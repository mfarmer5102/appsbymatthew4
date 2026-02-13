import time

from pyspark.sql.functions import current_timestamp
from pyspark.sql.types import StructType, StructField, StringType, Row, LongType, BooleanType, IntegerType

from data.jobs.globals.mongo_coll_names import logger_coll
from data.jobs.utils.arg_parsing import get_start_step_from_args
from data.jobs.utils.environment import environment_name
from data.jobs.utils.mongo import write_to_mongo
from data.jobs.utils.slack import publish_slack_message


def run_job(spark, this_job, callback):
    print(f"Env: {environment_name} | Starting job {this_job.job_name}")
    publish_slack_message(f"Env: {environment_name} | Starting job {this_job.job_name}")
    this_job.record_start_or_end(spark, is_start=True, is_successful=False)
    if callback is not None:
        try:
            callback()
            this_job.record_start_or_end(spark, is_start=False, is_successful=True)
            publish_slack_message(f"Env: {environment_name} | Job {this_job.job_name} completed successfully.")
        except Exception as e:
            this_job.record_start_or_end(spark, is_start=False, is_successful=False, details=str(e))
            publish_slack_message(f"Env: {environment_name} | Job {this_job.job_name} failed: {str(e)}")
    spark.sparkContext.stop()
    return


def run_step(spark, job_id, job_name, step_name, callback):
    this_step = Step(job_id, job_name, step_name)
    this_step.record_start_or_end(spark, is_start=True, is_successful=None)
    if callback is not None:
        try:
            callback()
        except Exception as e:
            this_step.record_start_or_end(spark, is_start=False, is_successful=False)
            raise Exception(e)
    this_step.record_start_or_end(spark, is_start=False, is_successful=True)
    return


class Job:

    def __init__(self, job_id, job_name):
        self.start_time = None
        self.end_time = None
        self.job_id = job_id
        self.job_name = job_name
        self.job_run_id = int(time.time()) * 1000
        self.start_step = get_start_step_from_args()

    def record_start_or_end(self, spark, is_start, is_successful, details=None):
        if is_start:
            self.start_time = int(time.time())
        else:
            self.end_time = int(time.time())

        schema = StructType([
            StructField("job_id", StringType(), True),
            StructField("job_name", StringType(), True),
            StructField("action", StringType(), True),
            StructField("job_run_id", LongType(), True),
            StructField("is_successful", BooleanType(), True),
            StructField("run_duration_in_minutes", LongType(), True),
            StructField("details", StringType(), True),
            StructField("start_step", IntegerType(), True)
        ])

        rdd = spark.sparkContext.parallelize([
            Row(
                job_id=self.job_id,
                job_name=self.job_name,
                action="Job Start" if is_start == True else "Job End",
                job_run_id=self.job_run_id,
                is_successful=None if is_start else is_successful,
                run_duration_in_minutes=None if is_start else int((self.end_time - self.start_time) / 60),
                details=details,
                start_step=self.start_step
            )
        ])

        df = spark.createDataFrame(rdd, schema).withColumn("event_time", current_timestamp())
        if environment_name != "LOCAL":
            write_to_mongo(df, logger_coll.db, logger_coll.name, "append")


class Step:

    def __init__(self, this_job, step_id, step_name):
        self.start_time = None
        self.end_time = None
        self.job_id = this_job.job_id
        self.job_name = this_job.job_name
        self.job_run_id = this_job.job_run_id
        self.step_id = step_id
        self.step_name = step_name
        self.step_run_id = int(time.time()) * 1000

    def record_start_or_end(self, spark, is_start, is_successful):
        if is_start:
            self.start_time = int(time.time())
        else:
            self.end_time = int(time.time())

        schema = StructType([
            StructField("job_id", StringType(), True),
            StructField("job_name", StringType(), True),
            StructField("action", StringType(), True),
            StructField("job_run_id", LongType(), True),
            StructField("step_run_id", LongType(), True),
            StructField("step_id", StringType(), True),
            StructField("step_name", StringType(), True),
            StructField("is_successful", BooleanType(), True),
            StructField("run_duration_in_minutes", LongType(), True)
        ])

        rdd = spark.sparkContext.parallelize([
            Row(
                job_id=self.job_id,
                job_name=self.job_name,
                action="Step Start" if is_start == True else "Step End",
                job_run_id=self.job_run_id,
                step_run_id=self.step_run_id,
                step_id=self.step_id,
                step_name=self.step_name,
                is_successful=None if is_start else is_successful,
                run_duration_in_minutes=None if is_start else int((self.end_time - self.start_time) / 60)
            )
        ])

        df = spark.createDataFrame(rdd, schema).withColumn("event_time", current_timestamp())
        if environment_name != "LOCAL":
            write_to_mongo(df, logger_coll.db, logger_coll.name, "append")
