from data.jobs.utils.environment import aws_s3_path_env

s3_path_prefix = f"s3a://mfarmer5102-private/application_data/appsbymatthew/{aws_s3_path_env}"

def write_to_object_storage(df, path, save_mode="overwrite"):
    try:
        return df.write.format("parquet") \
            .mode(save_mode) \
            .save(f"{s3_path_prefix}/{path}")
    except Exception as e:
        print(e)

def read_from_object_storage(spark, path):
    return spark.read.parquet(f"{s3_path_prefix}/{path}")
