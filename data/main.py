from mfarmer5102_utils.pyspark.arg_parsing import get_job_name_from_args
from mfarmer5102_utils.pyspark.spark import launch_spark

if __name__ == "__main__":

    requested_job_name = get_job_name_from_args()
    print(requested_job_name)
    spark = launch_spark(job_name=requested_job_name)

    if requested_job_name == "chat_reports":
        from jobs.src.chat_reports.app import init

        init(spark)
    else:
        print("Existing. No job specified")

    spark.sparkContext.stop()
