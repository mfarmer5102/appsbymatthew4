import {SecretConfig} from '../_library/classes/secrets.js';

const secret_config = new SecretConfig("us-east-1");
secret_config.attach_secret('MONGO_INSTANCE_URL', 'prd-secrets');
secret_config.attach_secret('ADMIN_CODE', 'admin-code');

export default secret_config;