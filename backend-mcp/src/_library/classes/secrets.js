import {GetSecretValueCommand, SecretsManagerClient} from '@aws-sdk/client-secrets-manager';

// Mirrors backend/src/_library/classes/secrets.js, reimplemented rather than imported -
// see the README on why this directory shares no code with backend/. Lambda has no
// .env, so secrets there come from Secrets Manager instead of process.env.
export class SecretConfig {
    constructor(aws_region_name, list_of_secrets) {
        // Event Functions set AWS_EXECUTION_ENV; Web Functions are not guaranteed to,
        // but always set AWS_LAMBDA_HTTP_ENDPOINT. Checking only the first would send
        // a Web Function looking for a .env that is not there.
        this.is_aws_originated = Boolean(
            process.env.AWS_EXECUTION_ENV || process.env.AWS_LAMBDA_HTTP_ENDPOINT,
        );
        this.aws_region = aws_region_name;
        this.list_of_secrets = list_of_secrets;
    }

    // A no-op locally: Environment falls back to process.env, which .env populates.
    async apply_list_of_secrets() {
        if (!this.is_aws_originated) {
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
