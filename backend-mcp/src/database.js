// Imported first, and for its side effect: it populates process.env before the pool
// below reads SUPABASE_DB_URL. See the note in env.js about ESM evaluation order.
import {require_env} from './env.js';

import pg from 'pg';
import {readFileSync} from 'fs';
import {fileURLToPath} from 'url';

const {Pool, types} = pg;

// Every table lives in the apps_by_matthew schema rather than public, so queries
// qualify it explicitly instead of relying on search_path.
export const SCHEMA = 'apps_by_matthew';

// dim_application_embedding is keyed on (application_key, model_version), so reads must
// filter on the same version the vectors were written with or a second model's rows
// would silently double every result. Must match EMBEDDING_MODEL in openai.js.
export const EMBEDDING_MODEL_VERSION = 'text-embedding-3-small';

/**
 * Supabase's pooler presents a chain rooted in Supabase's own self-signed "Supabase
 * Root 2021 CA", which is not in Node's trust store, so verification fails with
 * SELF_SIGNED_CERT_IN_CHAIN unless that CA is supplied explicitly. It therefore ships
 * alongside this server in certs/ and is trusted by default.
 *
 * PGSSL_ROOT_CERT overrides the bundled file; PGSSL_NO_VERIFY=true still encrypts but
 * stops authenticating the server, so a machine-in-the-middle could impersonate the
 * database. It is a last resort.
 */
const BUNDLED_ROOT_CERT_PATH = fileURLToPath(
    new URL('../certs/supabase-prod-ca-2021.crt', import.meta.url),
);

function build_ssl_options() {
    const root_cert_path = process.env.PGSSL_ROOT_CERT;

    if (root_cert_path) {
        return {ca: readFileSync(root_cert_path, 'utf8'), rejectUnauthorized: true};
    }

    if (process.env.PGSSL_NO_VERIFY === 'true') {
        console.error(
            'PGSSL_NO_VERIFY=true: the database connection is encrypted but the server ' +
            'certificate is NOT verified. Unset it to use the bundled Supabase CA.',
        );
        return {rejectUnauthorized: false};
    }

    try {
        return {ca: readFileSync(BUNDLED_ROOT_CERT_PATH, 'utf8'), rejectUnauthorized: true};
    } catch (error) {
        console.error(
            `Could not read the bundled Postgres CA at ${BUNDLED_ROOT_CERT_PATH} ` +
            `(${error.message}). Falling back to the system trust store, which does not ` +
            'include Supabase\'s CA - expect SELF_SIGNED_CERT_IN_CHAIN.',
        );
        return {rejectUnauthorized: true};
    }
}

// DATE columns (OID 1082) are parsed into a JS Date at midnight *local* time by
// default, which shifts publish_date back a day for anyone west of UTC. The column has
// no time component to begin with, so keep it as the raw 'YYYY-MM-DD' string.
types.setTypeParser(1082, (value) => value);

// COUNT() returns int8 (OID 20), which node-postgres hands back as a string to avoid
// precision loss past 2^53. These are row counts, so a Number is safe.
types.setTypeParser(20, (value) => (value === null ? null : Number(value)));

// Read-only and single-client, so the pool stays small. Everything this server does is
// a SELECT, which is why there is no transaction() helper here as there is in backend/.
const pool = new Pool({
    connectionString: require_env('SUPABASE_DB_URL'),
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    statement_timeout: 15000,
    ssl: build_ssl_options(),
});

// An idle client dropped by the pooler emits 'error' on the pool. Without a listener
// that is an unhandled event, which takes the whole process down.
pool.on('error', (error) => {
    console.error('Idle Postgres client error:', error.message);
});

/**
 * Run a single parameterized statement.
 *
 * These are unnamed prepared statements, which Supabase's transaction-mode pooler
 * supports. Passing a `name` would switch them to named statements and break there.
 */
export async function query(text, params = []) {
    return await pool.query(text, params);
}

export async function close() {
    await pool.end();
}
