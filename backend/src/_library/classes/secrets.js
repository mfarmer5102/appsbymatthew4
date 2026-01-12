import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

export class SecretConfig {
    constructor(aws_region_name) {
        this.IS_AWS_ORIGINATED = process.env.AWS_EXECUTION_ENV;
        this.AWS_REGION = aws_region_name;
    }

    get_secret_value_from_aws = async (secretName) => {
        // Create a Secrets Manager client
        console.log(`creating secret client`);
        const client = new SecretsManagerClient({ region: this.AWS_REGION }); // Specify your AWS region
      
        try {
          const response = await client.send(
            new GetSecretValueCommand({
              SecretId: secretName,
            })
          );

          // Check if the secret is a plain string or a JSON object
            if (response.SecretString) {
                // If the secret is stored as a JSON string, you may want to parse it
                try {
                    return JSON.parse(response.SecretString);
                } catch (e) {
                    return response.SecretString;
                }
            } else if (response.SecretBinary) {
                // Handle binary secrets if needed
                return response.SecretBinary;
            }
        } catch (error) {
          // Log the error and handle it as appropriate for your application
          console.error("Error retrieving secret:", error);
          throw error;
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