// Resolved on demand rather than by a top-level await, so neither entry point blocks
// on Secrets Manager while it loads - a Web Function must be listening within 10
// seconds of starting. See src/configuration/index.js for when this runs.
import {SecretConfig} from '../_library/classes/secrets.js';

export const resolve_secrets = async () => {
    const secret_config = new SecretConfig('us-east-1', [
        {key: 'SUPABASE_DB_URL', parent: 'prd-secrets'},
        {key: 'OPENAI_API_KEY', parent: 'prd-secrets'},
    ]);
    await secret_config.apply_list_of_secrets();

    return secret_config;
};
