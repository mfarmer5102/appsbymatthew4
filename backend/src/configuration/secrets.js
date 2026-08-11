import {SecretConfig} from '../_library/classes/secrets.js';

const secret_config = new SecretConfig("us-east-1", [
    {
        'key': 'APPSBYMATTHEW_ADMIN_CODE',
        'parent': 'prd-secrets'
    },
    {
        'key': 'SUPABASE_DB_URL',
        'parent': 'prd-secrets'
    },
    {
        'key': 'OPENAI_API_KEY',
        'parent': 'prd-secrets'
    }
]);
await secret_config.apply_list_of_secrets();

export default secret_config;