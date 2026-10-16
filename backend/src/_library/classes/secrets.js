import {GetSecretValueCommand, SecretsManagerClient} from '@aws-sdk/client-secrets-manager';

/**
 * Secrets come from AWS Secrets Manager when running in AWS, and from process.env
 * (populated by .env) everywhere else. Each resolved secret is set as a property of
 * this object, so callers read `secret_config['OPENAI_API_KEY']`.
 *
 * Never log a secret bundle or its values: anything written to the console lands in
 * CloudWatch Logs.
 */
export class SecretConfig {
    constructor(aws_region_name, list_of_secrets) {
        // A Web Function is not guaranteed to set AWS_EXECUTION_ENV, but always sets
        // AWS_LAMBDA_HTTP_ENDPOINT. Checking only the first would send it looking for a
        // .env that is not there.
        this.is_aws_originated = Boolean(
            process.env.AWS_EXECUTION_ENV || process.env.AWS_LAMBDA_HTTP_ENDPOINT,
        );
        this.aws_region = aws_region_name;
        this.list_of_secrets = list_of_secrets;
    }

    /**
     * Throws if a secret bundle cannot be read. Failing loudly at startup beats serving
     * requests with an undefined database URL or admin code.
     */
    async apply_list_of_secrets() {
        if (!this.is_aws_originated) {
            for (const {key} of this.list_of_secrets) {
                this[key] = process.env[key];
            }
            return;
        }

        const client = new SecretsManagerClient({region: this.aws_region});
        const bundles = new Map();

        for (const {key, parent} of this.list_of_secrets) {
            if (!bundles.has(parent)) {
                const response = await client.send(new GetSecretValueCommand({SecretId: parent}));
                bundles.set(parent, JSON.parse(response.SecretString));
            }

            this[key] = bundles.get(parent)[key];
        }
    }
}
