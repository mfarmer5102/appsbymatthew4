// Imported first, for its side effect: config.js loads .env before resolving these.
import {DATABASE} from './config.js';

import pg from 'pg';
import {readFileSync} from 'fs';

const {Pool, types} = pg;

// Which certificate to trust is configuration and lives in config.js; this is only the
// resolution of it.
function build_ssl_options() {
    const {bundled_root_cert_path, root_cert_path, no_verify} = DATABASE.ssl;

    if (root_cert_path) {
        return {ca: readFileSync(root_cert_path, 'utf8'), rejectUnauthorized: true};
    }

    if (no_verify) {
        console.error(
            'PGSSL_NO_VERIFY=true: the database connection is encrypted but the server ' +
            'certificate is NOT verified. Unset it to use the bundled Supabase CA.',
        );
        return {rejectUnauthorized: false};
    }

    try {
        return {ca: readFileSync(bundled_root_cert_path, 'utf8'), rejectUnauthorized: true};
    } catch (error) {
        console.error(
            `Could not read the bundled Postgres CA at ${bundled_root_cert_path} ` +
            `(${error.message}). Falling back to the system trust store, which does not ` +
            'include Supabase\'s CA - expect SELF_SIGNED_CERT_IN_CHAIN.',
        );
        return {rejectUnauthorized: true};
    }
}

// DATE (OID 1082) otherwise parses to a JS Date at midnight *local* time, shifting
// publish_date back a day west of UTC. Keep the raw 'YYYY-MM-DD' string.
types.setTypeParser(1082, (value) => value);

// int8 (OID 20) comes back as a string to protect precision past 2^53. These are row
// counts, so a Number is safe.
types.setTypeParser(20, (value) => (value === null ? null : Number(value)));

const pool = new Pool({
    connectionString: DATABASE.connection_string,
    ...DATABASE.pool,
    ssl: build_ssl_options(),
});

// An idle client dropped by the pooler emits 'error' on the pool; unhandled, that takes
// the process down.
pool.on('error', (error) => {
    console.error('Idle Postgres client error:', error.message);
});

// Unnamed prepared statements, which Supabase's transaction-mode pooler supports —
// passing a `name` would switch them to named ones and break there.
export async function query(text, params = []) {
    const {rows} = await pool.query(text, params);

    return rows;
}

export async function close() {
    await pool.end();
}
