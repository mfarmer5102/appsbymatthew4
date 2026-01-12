import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

export class SecretConfig {
    constructor(aws_region_name) {
        this.IS_AWS_ORIGINATED = process.env.AWS_EXECUTION_ENV;
        this.AWS_REGION = aws_region_name;
    }

    get_secret_value_from_aws = async (secretName) => {
        const client = new AWS.SecretsManager({ region: "us-east-1" });
        const data = await client.getSecretValue({ SecretId: secretName }).promise();
        console.log(data);
        if (data.SecretString) {
            return data.SecretString;
        }
    };

    attach_secret = async (key, aws_secret_name=null) => {
        if (this.IS_AWS_ORIGINATED) {
            console.log('attaching aws secret', aws_secret_name, key);
            this[key] = await this.get_secret_value_from_aws(aws_secret_name)[key];
            console.log(`value attached: ${this[key]}`);
        } else {
            this[key] = process.env[key];
        }
    }
}