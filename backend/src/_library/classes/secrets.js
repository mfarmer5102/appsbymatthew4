class SecretConfig {
    constructor(aws_region_name) {
        this.IS_AWS_ORIGINATED = os.environ.get("AWS_EXECUTION_ENV");
        this.AWS_REGION = aws_region_name;
    }

    get_secret_value_from_aws(secret_name) {
        session = boto3.session.Session();
        client = session.client(
            service_name='secretsmanager',
            region_name=self.AWS_REGION
        );
    }

    attach_secret(key, aws_secret_name=None) {
        if (this.IS_AWS_ORIGINATED) {
            setattr(this, key, this.get_secret_value_from_aws(secret_name=aws_secret_name)[key]);
        } else {
            setattr(this, key, os.getenv(key));
        }
    }
}

/*
import json
import os

import boto3
from botocore.exceptions import ClientError


class SecretConfig:

    def __init__(self, aws_region_name):
        self.IS_AWS_ORIGINATED = os.environ.get("AWS_EXECUTION_ENV") is not None
        self.AWS_REGION = aws_region_name

    def get_secret_value_from_aws(self, secret_name):
        session = boto3.session.Session()
        client = session.client(
            service_name='secretsmanager',
            region_name=self.AWS_REGION
        )
        try:
            get_secret_value_response = client.get_secret_value(SecretId=secret_name)
        except ClientError as e:
            raise e
        return json.loads(get_secret_value_response['SecretString'])

    def attach_secret(self, key, aws_secret_name=None):
        if self.IS_AWS_ORIGINATED:
            setattr(self, key, self.get_secret_value_from_aws(secret_name=aws_secret_name)[key])
        else:
            setattr(self, key, os.getenv(key))
*/