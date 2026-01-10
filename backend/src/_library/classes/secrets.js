export class SecretConfig {
    constructor(aws_region_name) {
        this.IS_AWS_ORIGINATED = process.env.AWS_EXECUTION_ENV;
        this.AWS_REGION = aws_region_name;
    }

    get_secret_value_from_aws(secret_name) {
        const session = boto3.session.Session()
        const client = session.client(
            'secretsmanager',
            self.AWS_REGION
        )
        try {
            const get_secret_value_response = client.get_secret_value(secret_name)
            return JSON.parse(get_secret_value_response['SecretString'])
        }
        catch(e) {
            throw Error;
        }
    }

    attach_secret(key, aws_secret_name=null) {
        if (this.IS_AWS_ORIGINATED) {
            this[key] = this.get_secret_value_from_aws(aws_secret_name)[key];
        } else {
            this[key] = process.env[key];
        }
    }
}