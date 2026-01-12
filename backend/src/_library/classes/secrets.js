import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

export class SecretConfig {

    constructor(aws_region_name, list_of_secrets) {
        this.IS_AWS_ORIGINATED = process.env.AWS_EXECUTION_ENV;
        this.AWS_REGION = aws_region_name;
        this.list_of_secrets = list_of_secrets;
        this.apply_list_of_secrets().then(r => {
            console.log('Applied list of secrets.')
        });
    }

     async get_secret_value_from_aws(secretName) {
        // Create a Secrets Manager client
        console.log(`creating secret client`);
        console.log('aws region is: ', this.AWS_REGION);
        const client = new SecretsManagerClient({
            region: this.AWS_REGION
        });

        try {
            const input = {SecretId: secretName};
            console.log('input', input)
            const command = new GetSecretValueCommand(input);
            console.log('preparing to enter promise');
            client.send(command).then(response => {
                console.log("Full AWS Response:", response); // Log to see what AWS is actually sending
                if (response.SecretString) {
                    try {
                        console.log('Secret Response block 1:', JSON.parse(response.SecretString));
                        return JSON.parse(response.SecretString);
                    } catch (e) {
                        console.log('Secret Response block 2:', response.SecretString);
                        return response.SecretString;
                    }
                }
                if (response.SecretBinary) {
                    console.log('Secret Response block 3:', response.SecretBinary);
                    return response.SecretBinary;
                }
                // If we reach here, neither String nor Binary was found
                console.warn("Secret found but contained no data.");
                return null;
            }).catch(e => {
                console.log('Fell into catch block of client.send().');
                console.log(e);
                console.error(e);
            });
        } catch (error) {
            console.error("Error retrieving secret:", error);
            throw error;
        }
    };

     async attach_secret(key, aws_secret_name=null) {
        if (this.IS_AWS_ORIGINATED) {
            console.log('attaching aws secret', aws_secret_name, key);
            const secretValue = await this.get_secret_value_from_aws(aws_secret_name);
            console.log('secretValue', secretValue);
            this[key] = secretValue[key];
            console.log(`value attached: ${this[key]}`);
        } else {
            this[key] = process.env[key];
        }
    }

    async apply_list_of_secrets() {
        this.list_of_secrets.forEach((secret) => {
            this.attach_secret(secret.key, secret.parent);
        })
    }
}