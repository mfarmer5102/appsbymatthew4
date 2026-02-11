import {SecretConfig} from '../_library/classes/secrets.js';

const secret_config = new SecretConfig("us-east-1", [
    {
        'key': 'APPSBYMATTHEW_ADMIN_CODE',
        'parent': 'prd-secrets'
    },
    {
        'key': 'MONGO_INSTANCE_URL',
        'parent': 'prd-secrets'
    },
    {
        'key': 'OPENAI_API_KEY',
        'parent': 'prd-secrets'
    }
]);
await secret_config.apply_list_of_secrets();
// await secret_config.attach_secret('MONGO_INSTANCE_URL', 'prd-secrets');
// await secret_config.attach_secret('APPSBYMATTHEW_ADMIN_CODE', 'prd-secrets');

export default secret_config;