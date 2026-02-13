import os

binding = os.getenv("BINDING", "")
mongo_db_uri = os.getenv("MONGO_INSTANCE_URL", "NOTPROVIDED")
environment_name = os.getenv("ENVIRONMENT_NAME", "LOCAL")

upper_env_mongo_uri = os.getenv("UPPER_ENV_MONGO_URI", "NOTPROVIDED")
lower_env_mongo_uri = os.getenv("LOWER_ENV_MONGO_URI", "NOTPROVIDED")

aws_s3_bucket_name_verdantime = os.getenv("AWS_S3_BUCKET_NAME_VERDANTIME", "")
aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID", "")
aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY", "")
aws_s3_endpoint = os.getenv("AWS_S3_ENDPOINT", "")
aws_s3_path_env = os.getenv("AWS_S3_PATH_ENV", "")