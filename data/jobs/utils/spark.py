import os

from pyspark.sql import SparkSession

from data.jobs.utils.environment import aws_access_key_id, aws_secret_access_key, aws_s3_endpoint

list_of_jars = [
    'org.mongodb.spark:mongo-spark-connector_2.12:3.0.2',
    'org.apache.hadoop:hadoop-aws:3.3.1',
    'com.amazonaws:aws-java-sdk:1.12.662'
]

def launch_spark(job_name):
    # some_jar_a_path = os.path.join(os.getcwd(), 'lib', 'some_jar_a.jar')
    # some_jar_b_path = os.path.join(os.getcwd(), 'lib', 'some_jar_b.jar')
    spark = (SparkSession.builder
             .appName(job_name)
             .master("local")
             # .config("spark.jars", some_jar_a_path + "," + some_jar_b_path)
             .config('spark.jars.packages', ",".join(list_of_jars))
             .config("spark.driver.cores", "1")
             .config("spark.driver.memory", "1g")
             .config("spark.driver.maxResultSize", "4g")
             .config("spark.executor.memory", "1g")
             .config("spark.executor.cores", "1")
             .config("spark.hadoop.fs.s3a.access.key", aws_access_key_id)
             .config("spark.hadoop.fs.s3a.secret.key", aws_secret_access_key)
             .config("spark.hadoop.fs.s3a.impl", 'org.apache.hadoop.fs.s3a.S3AFileSystem')
             .config("spark.hadoop.fs.s3a.endpoint", aws_s3_endpoint)
             .getOrCreate())
    spark.sparkContext.setLogLevel('ERROR')
    return spark
