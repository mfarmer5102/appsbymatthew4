import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

export class SecretConfig {
    constructor(aws_region_name) {
        this.IS_AWS_ORIGINATED = process.env.AWS_EXECUTION_ENV;
        this.AWS_REGION = aws_region_name;
    }

    get_secret_value_from_aws = async (secretName) => {
        // Create a Secrets Manager client
        const client = new SecretsManagerClient({ region: "us-east-1" }); // Specify your AWS region
      
        try {
          const response = await client.send(
            new GetSecretValueCommand({
              SecretId: secretName,
            })
          );
      
          // Check if the secret is a string or binary and return its value
          if (response.SecretString) {
            return response.SecretString;
          }
          if (response.SecretBinary) {
            return response.SecretBinary;
          }
        } catch (error) {
          // Log the error and handle it as appropriate for your application
          console.error("Error retrieving secret:", error);
          throw error;
        }
      };

    attach_secret(key, aws_secret_name=null) {
        if (this.IS_AWS_ORIGINATED) {
            this[key] = this.get_secret_value_from_aws(aws_secret_name)[key];
        } else {
            this[key] = process.env[key];
        }
    }
}