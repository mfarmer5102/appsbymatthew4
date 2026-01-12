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

     get_secret_value_from_aws = async (secretName) => {
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
            await client.send(command).then(response => {
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
            }).finally((x) => {
                console.log('Inside finally block')
                console.log('Finally block returns the following: ', x);
            });
        } catch (error) {
            console.error("Error retrieving secret:", error);
            throw error;
        }
    };

     attach_secret = async (key, aws_secret_name=null)=> {
        if (this.IS_AWS_ORIGINATED) {
            console.log('attaching aws secret', aws_secret_name, key);
            const secretValue = await this.get_secret_value_from_aws(aws_secret_name); // <-- secret value is coming back null
            console.log('secretValue', secretValue);
            this[key] = secretValue[key];
            console.log(`value attached: ${this[key]}`);
        } else {
            this[key] = process.env[key];
        }
    }

    apply_list_of_secrets = async ()=> {
         const self = this;
         const is_aws_originated = self.IS_AWS_ORIGINATED;
        const client = is_aws_originated ?  new SecretsManagerClient({'region': self.AWS_REGION }) : null;

        for (const secret of self.list_of_secrets) {
            const secret_parent = secret.parent;
            const secret_key = secret.key;
            if (!is_aws_originated) {
                self[secret_key] = process.env[secret_key];
            }
            else {
                try {
                    console.log('secret_parent', secret_parent);
                    console.log('secret_key', secret_key);
                    const response = await client.send(
                        new GetSecretValueCommand({ SecretId: secret_parent })
                    );
                    console.log('response', response);
                    const secret_bundle = JSON.parse(response.SecretString);
                    console.log('secret_bundle', secret_bundle);
                    console.log('secret_bundle.secret_key', secret_bundle[secret_key]);
                    self[secret_key] = secret_bundle[secret_key];
                } catch (error) {
                    console.error("Error retrieving secret:", error);
                    throw error;
                }
            }
        }
    }
}