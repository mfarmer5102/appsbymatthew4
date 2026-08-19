from jobs.src.chat_reports.misc import job_flow
from jobs.utils.arg_parsing import get_target_date_from_args
from mfarmer5102_utils.pyspark.steps import Job, run_job, run_step


def init(spark):
    job_details = Job(
        job_id="APPSBYMATTHEW-CHAT-REPORTS",
        job_name="AppsByMatthew Chat Reports",
        logger_db="logs",
        logger_coll="jobs",
    )
    run_job(spark, job_details, lambda: run(spark, job_details))


def run(spark, job_details):
    target_date = get_target_date_from_args()
    run_step(spark, job_details, "CHAT-AGG", "Chat aggregation",
             lambda: job_flow(spark, target_date))
