import SecretConfig from '../_library/classes/secrets';

secret_config = new SecretConfig(aws_region_name="us-east-1");
secret_config.attach_secret('MONGO_INSTANCE_URL', 'prd-secrets');
secret_config.attach_secret('JWT_SECRET', 'prd-secrets');
secret_config.attach_secret('JWT_ALGORITHM', 'prd-secrets');

/*
from src._library.classes.secrets import SecretConfig

secret_config = SecretConfig(aws_region_name="us-east-1")
secret_config.attach_secret('MONGO_INSTANCE_URL', 'prd-secrets')
secret_config.attach_secret('JWT_SECRET', 'prd-secrets')
secret_config.attach_secret('JWT_ALGORITHM', 'prd-secrets')
*/