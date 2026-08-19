import pytest
from datetime import date
from pyspark.sql import SparkSession
from pyspark.sql.types import (
    StructType, StructField, StringType, IntegerType, BooleanType,
    FloatType, LongType, TimestampType
)
from datetime import datetime

from jobs.src.chat_reports.queries import ChatMessagesQuery, ChatSourcesQuery
from jobs.src.chat_reports.misc import compute_daily_summary, compute_top_applications


@pytest.fixture(scope="session")
def spark():
    return SparkSession.builder.appName("PySpark Test").getOrCreate()


TARGET_DATE = date(2026, 8, 12)


def _make_messages_df(spark, rows):
    schema = StructType([
        StructField("chat_message_key", LongType()),
        StructField("session_id", StringType()),
        StructField("turn_ordinal", IntegerType()),
        StructField("message_ordinal", IntegerType()),
        StructField("role", StringType()),
        StructField("content", StringType()),
        StructField("ip_address", StringType()),
        StructField("user_agent", StringType()),
        StructField("embedding_model", StringType()),
        StructField("embedding_ms", IntegerType()),
        StructField("search_ms", IntegerType()),
        StructField("chat_model", StringType()),
        StructField("prompt_tokens", IntegerType()),
        StructField("completion_tokens", IntegerType()),
        StructField("completion_ms", IntegerType()),
        StructField("latency_ms", IntegerType()),
        StructField("is_error", BooleanType()),
        StructField("error_detail", StringType()),
        StructField("created_at", TimestampType()),
    ])
    return spark.createDataFrame(rows, schema)


def _make_sources_df(spark, rows):
    schema = StructType([
        StructField("chat_message_key", LongType()),
        StructField("application_key", IntegerType()),
        StructField("similarity_score", FloatType()),
        StructField("application_title", StringType()),
    ])
    return spark.createDataFrame(rows, schema)


def test_chat_messages_query_transform(spark):
    rows = [
        (1, "sess1", 1, 1, "user", "hello", "1.2.3.4", "Mozilla", "text-embedding-3-small",
         50, 30, None, None, None, None, None, False, None, datetime(2026, 8, 12, 10, 0, 0)),
        (2, "sess1", 1, 2, "assistant", "Hi there!", None, None, None,
         None, None, "gpt-4o-mini", 100, 50, 400, 500, False, None, datetime(2026, 8, 12, 10, 0, 1)),
    ]
    df = _make_messages_df(spark, rows)
    query = ChatMessagesQuery(spark, TARGET_DATE, df=df)
    result = query.transform()
    assert result.count() == 2
    assert set(result.select("role").rdd.flatMap(lambda x: x).collect()) == {"user", "assistant"}


def test_chat_sources_query_transform(spark):
    rows = [
        (2, 1, 0.85, "Portfolio App"),
        (2, 3, 0.72, "Another App"),
    ]
    df = _make_sources_df(spark, rows)
    query = ChatSourcesQuery(spark, TARGET_DATE, df=df)
    result = query.transform()
    assert result.count() == 2


def test_compute_daily_summary(spark):
    rows = [
        (1, "sess1", 1, 1, "user", "hello", "1.2.3.4", "Mozilla", "text-embedding-3-small",
         50, 30, None, None, None, None, None, False, None, datetime(2026, 8, 12, 10, 0, 0)),
        (2, "sess1", 1, 2, "assistant", "Hi!", None, None, None,
         None, None, "gpt-4o-mini", 100, 50, 400, 500, False, None, datetime(2026, 8, 12, 10, 0, 1)),
        (3, "sess2", 1, 1, "user", "what apps", "5.6.7.8", "Chrome", "text-embedding-3-small",
         60, 40, None, None, None, None, None, False, None, datetime(2026, 8, 12, 11, 0, 0)),
        (4, "sess2", 1, 2, "assistant", "Here are some", None, None, None,
         None, None, "gpt-4o-mini", 200, 80, 600, 700, False, None, datetime(2026, 8, 12, 11, 0, 1)),
    ]
    messages_df = _make_messages_df(spark, rows)
    result = compute_daily_summary(messages_df, TARGET_DATE)

    assert result.count() == 1
    row = result.collect()[0]
    assert row["total_turns"] == 2
    assert row["unique_sessions"] == 2
    assert row["error_count"] == 0
    assert row["total_prompt_tokens"] == 300
    assert row["total_completion_tokens"] == 130
    assert row["avg_embedding_ms"] == 55.0
    assert row["avg_search_ms"] == 35.0
    assert row["report_date"] == str(TARGET_DATE)


def test_compute_daily_summary_with_errors(spark):
    rows = [
        (1, "sess1", 1, 1, "user", "hello", "1.2.3.4", "Mozilla", "text-embedding-3-small",
         50, 30, None, None, None, None, None, False, None, datetime(2026, 8, 12, 10, 0, 0)),
        (2, "sess1", 1, 2, "assistant", "Sorry", None, None, None,
         None, None, "gpt-4o-mini", 0, 0, 0, 100, True, "timeout", datetime(2026, 8, 12, 10, 0, 1)),
    ]
    messages_df = _make_messages_df(spark, rows)
    result = compute_daily_summary(messages_df, TARGET_DATE)
    row = result.collect()[0]
    assert row["error_count"] == 1


def test_compute_top_applications(spark):
    rows = [
        (2, 1, 0.85, "Portfolio App"),
        (4, 1, 0.90, "Portfolio App"),
        (4, 3, 0.72, "Another App"),
    ]
    sources_df = _make_sources_df(spark, rows)
    result = compute_top_applications(sources_df, TARGET_DATE)

    assert result.count() == 2
    top_row = result.collect()[0]
    assert top_row["application_title"] == "Portfolio App"
    assert top_row["times_surfaced"] == 2
    assert top_row["report_date"] == str(TARGET_DATE)


def test_compute_top_applications_empty(spark):
    sources_df = _make_sources_df(spark, [])
    result = compute_top_applications(sources_df, TARGET_DATE)
    assert result.count() == 0
    assert "application_title" in result.columns
    assert "times_surfaced" in result.columns


def test_compute_daily_summary_empty_user_rows(spark):
    """When there are assistant rows but no user rows, embedding/search metrics should be null."""
    rows = [
        (2, "sess1", 1, 2, "assistant", "Hi!", None, None, None,
         None, None, "gpt-4o-mini", 100, 50, 400, 500, False, None, datetime(2026, 8, 12, 10, 0, 1)),
    ]
    messages_df = _make_messages_df(spark, rows)
    result = compute_daily_summary(messages_df, TARGET_DATE)
    row = result.collect()[0]
    assert row["total_turns"] == 1
    assert row["avg_embedding_ms"] is None
    assert row["avg_search_ms"] is None
