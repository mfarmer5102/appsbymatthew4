// Imported first, and for its side effect: config.js loads .env before resolving the
// settings read below. See the note in env.js about ESM evaluation order.
import {DATABASE} from './config.js';

import pg from 'pg';
import {readFileSync} from 'fs';

const {Pool, types} = pg;

/**
 * Turn the configured TLS preferences into pg's ssl option.
 *
 * Which certificate to trust is configuration and lives in config.js; this is only the
 * resolution of it, including the diagnostics for when the bundled CA cannot be read.
 */
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

// DATE columns (OID 1082) are parsed into a JS Date at midnight *local* time by
// default, which shifts publish_date back a day for anyone west of UTC. The column has
// no time component to begin with, so keep it as the raw 'YYYY-MM-DD' string.
types.setTypeParser(1082, (value) => value);

// COUNT() returns int8 (OID 20), which node-postgres hands back as a string to avoid
// precision loss past 2^53. These are row counts, so a Number is safe.
types.setTypeParser(20, (value) => (value === null ? null : Number(value)));

const pool = new Pool({
    connectionString: DATABASE.connection_string,
    ...DATABASE.pool,
    ssl: build_ssl_options(),
});

// An idle client dropped by the pooler emits 'error' on the pool. Without a listener
// that is an unhandled event, which takes the whole process down.
pool.on('error', (error) => {
    console.error('Idle Postgres client error:', error.message);
});

/**
 * Run a single parameterized statement and return just the rows.
 *
 * These are unnamed prepared statements, which Supabase's transaction-mode pooler
 * supports. Passing a `name` would switch them to named statements and break there.
 */
export async function query(text, params = []) {
    const {rows} = await pool.query(text, params);

    return rows;
}

export async function close() {
    await pool.end();
}
