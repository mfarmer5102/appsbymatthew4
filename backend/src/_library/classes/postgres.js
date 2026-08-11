import pg from 'pg';
import {readFileSync} from 'fs';

const {Pool, types} = pg;

/**
 * Supabase's pooler does not use a publicly trusted certificate. It presents a chain
 * rooted in Supabase's own self-signed "Supabase Root 2021 CA", which is not in Node's
 * trust store, so verification fails with SELF_SIGNED_CERT_IN_CHAIN unless that CA is
 * supplied explicitly.
 *
 * Preferred: download the CA (Supabase dashboard -> Project Settings -> Database ->
 * SSL Configuration) and point PGSSL_ROOT_CERT at the file. That keeps the certificate
 * genuinely verified.
 *
 * PGSSL_NO_VERIFY=true is the fallback. It still encrypts the connection, but stops
 * authenticating the server, so a machine-in-the-middle could impersonate the database.
 * Use it for local development, not for anything holding real data.
 */
function build_ssl_options() {
    const root_cert_path = process.env.PGSSL_ROOT_CERT;

    if (root_cert_path) {
        return {
            ca: readFileSync(root_cert_path, 'utf8'),
            rejectUnauthorized: true,
        };
    }

    if (process.env.PGSSL_NO_VERIFY === 'true') {
        console.warn(
            'PGSSL_NO_VERIFY=true: the database connection is encrypted but the server ' +
            'certificate is NOT verified. Set PGSSL_ROOT_CERT to Supabase\'s CA instead.',
        );
        return {rejectUnauthorized: false};
    }

    return {rejectUnauthorized: true};
}

// DATE columns (OID 1082) are parsed into a JS Date at midnight *local* time by
// default, which shifts publish_date back a day for anyone west of UTC. The column
// has no time component to begin with, so keep it as the raw 'YYYY-MM-DD' string.
types.setTypeParser(1082, (value) => value);

// COUNT() returns int8 (OID 20), which node-postgres hands back as a string to avoid
// precision loss past 2^53. These are row counts, so a Number is safe and spares every
// caller a parseInt.
types.setTypeParser(20, (value) => (value === null ? null : Number(value)));

export class PostgresConfig {
    constructor(connection_string, options = {}) {
        if (!connection_string) {
            throw new Error('PostgresConfig requires a connection string.');
        }

        this.pool = new Pool({
            connectionString: connection_string,
            // Supabase's transaction-mode pooler hands each statement to whichever
            // backend is free, so the pool here should stay small. Lambda holds this
            // module across warm invocations, and every concurrent container keeps its
            // own pool against the same pooler.
            max: options.max ?? 5,
            idleTimeoutMillis: options.idle_timeout_ms ?? 30000,
            connectionTimeoutMillis: options.connection_timeout_ms ?? 10000,
            // A runaway query would otherwise pin a pooler slot until the TCP timeout.
            statement_timeout: options.statement_timeout_ms ?? 15000,
            ssl: options.ssl ?? build_ssl_options(),
        });

        // An idle client dropped by the pooler emits 'error' on the pool. Without a
        // listener that is an unhandled event, which takes the whole process down.
        this.pool.on('error', (error) => {
            console.error('Idle Postgres client error:', error.message);
        });
    }

    /**
     * Run a single parameterized statement.
     *
     * Note these are unnamed prepared statements, which the transaction-mode pooler
     * supports. Passing a `name` would switch them to named statements and break under
     * that pooler, so don't.
     *
     * @param {string} text - SQL with $1-style placeholders
     * @param {Array} params - Values bound to the placeholders
     * @returns {Promise<import('pg').QueryResult>}
     */
    async query(text, params = []) {
        return await this.pool.query(text, params);
    }

    /**
     * Run several statements against one client inside a transaction, rolling back if
     * the callback throws. Needed wherever a write spans a dimension and its bridge
     * tables, so an application can never end up with half its skills attached.
     *
     * @param {(client: import('pg').PoolClient) => Promise<T>} callback
     * @returns {Promise<T>}
     * @template T
     */
    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            try {
                await client.query('ROLLBACK');
            } catch (rollback_error) {
                // The connection is already unusable; surface the original failure.
                console.error('Rollback failed:', rollback_error.message);
            }
            throw error;
        } finally {
            client.release();
        }
    }

    async close() {
        await this.pool.end();
    }
}
