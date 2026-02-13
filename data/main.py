from jobs.utils.arg_parsing import get_job_name_from_args
from jobs.utils.spark import launch_spark

if __name__ == "__main__":

    requested_job_name = get_job_name_from_args()
    print(requested_job_name)
    spark = launch_spark(job_name=requested_job_name)

    if requested_job_name == "copy_down":
        from jobs.src.copy_down.app import init

        init(spark)
    else:
        print("Existing. No job specified")

    spark.sparkContext.stop()
