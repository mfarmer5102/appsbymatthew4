// Resolved once at module scope via top-level await, mirroring
// backend/src/configuration/secrets.js, so it is ready before Container is constructed.
// A no-op outside Lambda - SecretConfig falls back to process.env there.
import {SecretConfig} from '../_library/classes/secrets.js';

const secret_config = new SecretConfig('us-east-1', [
    {key: 'SUPABASE_DB_URL', parent: 'prd-secrets'},
    {key: 'OPENAI_API_KEY', parent: 'prd-secrets'},
]);
await secret_config.apply_list_of_secrets();

export default secret_config;
