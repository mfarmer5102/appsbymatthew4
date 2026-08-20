// The only module that reads process.env, and the one place anything here is tuned:
// this file plus .env.example is the whole configuration surface.
//
// Imported partly for its side effect — env.js loads .env before the reads below. Since
// every other module imports this one, that ordering holds by construction.
import {require_env, optional_env} from './env.js';

import {fileURLToPath} from 'url';

// Sent to the client during the MCP handshake.
export const SERVER = {
    name: 'appsbymatthew-portfolio',
    version: '1.0.0',
};

export const DATABASE = {
    connection_string: require_env('SUPABASE_DB_URL'),

    // Tables live here rather than public, so queries qualify it instead of relying on
    // search_path.
    schema: 'apps_by_matthew',

    // Read-only, single-client, every statement a SELECT — so the pool stays small.
    pool: {
        max: 3,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        statement_timeout: 15000,
    },

    // Supabase's pooler is rooted in its own "Supabase Root 2021 CA", which is not in
    // Node's trust store — without it, verification fails with SELF_SIGNED_CERT_IN_CHAIN.
    // It ships in certs/, resolved against this file because cwd is arbitrary.
    //
    // no_verify still encrypts but stops authenticating the server, so a
    // machine-in-the-middle could impersonate the database. Last resort.
    ssl: {
        bundled_root_cert_path: fileURLToPath(
            new URL('../certs/supabase-prod-ca-2021.crt', import.meta.url),
        ),
        root_cert_path: optional_env('PGSSL_ROOT_CERT'),
        no_verify: optional_env('PGSSL_NO_VERIFY') === 'true',
    },
};

export const OPENAI = {
    api_key: require_env('OPENAI_API_KEY'),

    // The one place the model is named: it is also the value stored in
    // dim_application_embedding.model_version, which reads filter on. Changing it
    // invalidates every stored vector.
    embedding_model: 'text-embedding-3-small', // 1536 dimensions

    // The model's context is ~8k tokens; keeps a pathological input from being rejected.
    embedding_input_max_chars: 30000,
};

// max is enforced by the zod input schema, so an oversized request never reaches a
// query; default applies when the caller omits limit.
export const LIMITS = {
    search_applications: {default: 10, max: 50},
    search_applications_semantic: {default: 5, max: 20},
    get_skills: {default: 100, max: 200},
};
