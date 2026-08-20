// The single place anything about this server is configured. Every tunable literal and
// every environment variable it reads is resolved here; no other module touches
// process.env, so this file plus .env.example is the whole configuration surface.
//
// Imported first, and partly for its side effect: it loads .env before the reads below.
// See the note in env.js about ESM evaluation order — because every other module
// imports *this* one, that ordering now holds for the whole program by construction.
import {require_env, optional_env} from './env.js';

import {fileURLToPath} from 'url';

/** Reported to the client during the MCP handshake and shown in its server list. */
export const SERVER = {
    name: 'appsbymatthew-portfolio',
    version: '1.0.0',
};

export const DATABASE = {
    connection_string: require_env('SUPABASE_DB_URL'),

    // Every table lives in the apps_by_matthew schema rather than public, so queries
    // qualify it explicitly instead of relying on search_path.
    schema: 'apps_by_matthew',

    // Read-only and single-client, so the pool stays small. Everything this server does
    // is a SELECT, which is why there is no transaction helper as there is in backend/.
    pool: {
        max: 3,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        statement_timeout: 15000,
    },

    /**
     * Supabase's pooler presents a chain rooted in Supabase's own self-signed "Supabase
     * Root 2021 CA", which is not in Node's trust store, so verification fails with
     * SELF_SIGNED_CERT_IN_CHAIN unless that CA is supplied explicitly. It therefore
     * ships alongside this server in certs/ and is trusted by default. The path is
     * resolved against this file because the client's working directory is arbitrary.
     *
     * root_cert_path overrides the bundled file; no_verify still encrypts but stops
     * authenticating the server, so a machine-in-the-middle could impersonate the
     * database. It is a last resort. database.js applies these; see build_ssl_options.
     */
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

    /**
     * The one place the embedding model is named.
     *
     * It is both the model asked for at OpenAI and the value stored in
     * dim_application_embedding.model_version, and those two must never drift: reads
     * filter on the version their vectors were written with, so a second model's rows
     * would silently double every result, and a query vector from a different model
     * would be compared against vectors it shares no space with.
     */
    embedding_model: 'text-embedding-3-small', // 1536 dimensions

    // The model's context is ~8k tokens; this bound keeps a pathological input from
    // being rejected outright.
    embedding_input_max_chars: 30000,
};

/**
 * Result-size bounds per tool. `max` is enforced by the zod input schema, so an
 * oversized request is rejected by the SDK before the handler runs; `default` applies
 * when the caller omits `limit` entirely. Kept together because the pair only makes
 * sense read side by side.
 */
export const LIMITS = {
    search_applications: {default: 10, max: 50},
    search_applications_semantic: {default: 5, max: 20},
    get_skills: {default: 100, max: 200},
};
