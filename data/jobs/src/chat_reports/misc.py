from pyspark.sql import functions as F
from pyspark.sql.types import (
    StructType, StructField, StringType, IntegerType, FloatType, LongType
)

from jobs.globals.s3_paths import app_name
from jobs.src.chat_reports.queries import ChatMessagesQuery, ChatSourcesQuery
from mfarmer5102_utils.pyspark.s3 import write_to_object_storage
from mfarmer5102_utils.common.slack import publish_slack_message


def job_flow(spark, target_date):
    messages_df = ChatMessagesQuery(spark, target_date).extract().transform()
    sources_df = ChatSourcesQuery(spark, target_date).extract().transform()

    if messages_df.count() == 0:
        publish_slack_message(f"Chat report for {target_date}: no activity.")
        return

    summary_df = compute_daily_summary(messages_df, target_date)
    top_apps_df = compute_top_applications(sources_df, target_date)

    write_to_object_storage(summary_df, app_name, f"chat_reports/daily_summary/date={target_date}")
    if top_apps_df.count() > 0:
        write_to_object_storage(top_apps_df, app_name, f"chat_reports/top_applications/date={target_date}")

    send_slack_report(summary_df, top_apps_df, target_date)


def compute_daily_summary(messages_df, target_date):
    # Filter to assistant rows for response-side metrics
    assistant_df = messages_df.filter(F.col("role") == "assistant")
    # Filter to user rows for request-side metrics
    user_df = messages_df.filter(F.col("role") == "user")

    summary = assistant_df.agg(
        F.count("*").alias("total_turns"),
        F.countDistinct("session_id").alias("unique_sessions"),
        F.sum(F.when(F.col("is_error"), 1).otherwise(0)).cast("int").alias("error_count"),
        F.avg("latency_ms").alias("avg_latency_ms"),
        F.sum("latency_ms").alias("total_latency_ms"),
        F.avg("prompt_tokens").alias("avg_prompt_tokens"),
        F.sum("prompt_tokens").alias("total_prompt_tokens"),
        F.avg("completion_tokens").alias("avg_completion_tokens"),
        F.sum("completion_tokens").alias("total_completion_tokens"),
        F.avg("completion_ms").alias("avg_completion_ms"),
    )

    user_metrics = user_df.agg(
        F.avg("embedding_ms").alias("avg_embedding_ms"),
        F.avg("search_ms").alias("avg_search_ms"),
    )

    # Cross join the single-row aggregates and add the date
    summary = summary.crossJoin(user_metrics).withColumn(
        "report_date", F.lit(str(target_date))
    )

    return summary


def compute_top_applications(sources_df, target_date):
    if sources_df.count() == 0:
        return sources_df.sparkSession.createDataFrame(
            [],
            StructType([
                StructField("application_key", IntegerType()),
                StructField("application_title", StringType()),
                StructField("times_surfaced", LongType()),
                StructField("avg_similarity_score", FloatType()),
                StructField("report_date", StringType()),
            ])
        )

    top_apps = sources_df.groupBy("application_key", "application_title").agg(
        F.count("*").alias("times_surfaced"),
        F.avg("similarity_score").cast("float").alias("avg_similarity_score"),
    ).orderBy(F.desc("times_surfaced"))

    top_apps = top_apps.withColumn("report_date", F.lit(str(target_date)))
    return top_apps


def send_slack_report(summary_df, top_apps_df, target_date):
    row = summary_df.collect()[0]

    lines = [
        f"Chat report for {target_date}:",
        f"  Turns: {row['total_turns']}  |  Sessions: {row['unique_sessions']}  |  Errors: {row['error_count']}",
        f"  Avg latency: {_fmt_ms(row['avg_latency_ms'])}  |  Avg completion: {_fmt_ms(row['avg_completion_ms'])}",
        f"  Avg embedding: {_fmt_ms(row['avg_embedding_ms'])}  |  Avg search: {_fmt_ms(row['avg_search_ms'])}",
        f"  Tokens — prompt: {_fmt_int(row['total_prompt_tokens'])}  |  completion: {_fmt_int(row['total_completion_tokens'])}",
    ]

    if top_apps_df.count() > 0:
        lines.append("  Top applications surfaced:")
        for app_row in top_apps_df.limit(10).collect():
            lines.append(
                f"    {app_row['application_title']}: "
                f"{app_row['times_surfaced']}x "
                f"(avg score {app_row['avg_similarity_score']:.3f})"
            )

    publish_slack_message("\n".join(lines))


def _fmt_ms(val):
    if val is None:
        return "N/A"
    return f"{val:.0f}ms"


def _fmt_int(val):
    if val is None:
        return "N/A"
    return str(int(val))
