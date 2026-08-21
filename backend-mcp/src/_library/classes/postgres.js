import pg from 'pg';
import {readFileSync} from 'fs';

const {Pool, types} = pg;

// Read-only by design, so unlike its sibling in backend/ there is no transaction helper.
export class PostgresConfig {
    // pg's parser registry is process-global, so these are set once, not per instance.
    static {
        // DATE would otherwise become a JS Date at midnight *local* time, shifting
        // publish_date back a day west of UTC.
        types.setTypeParser(1082, (value) => value);

        // int8 arrives as a string to protect precision past 2^53. These are row counts.
        types.setTypeParser(20, (value) => (value === null ? null : Number(value)));
    }

    constructor({connection_string, schema, pool = {}, ssl = {}}) {
        if (!connection_string) {
            throw new Error('PostgresConfig requires a connection string.');
        }

        // Travels with the connection so repositories never import configuration.
        this.schema = schema;
        this.ssl_options = ssl;

        this.pool = new Pool({
            connectionString: connection_string,
            max: pool.max ?? 3,
            idleTimeoutMillis: pool.idle_timeout_ms ?? 30000,
            connectionTimeoutMillis: pool.connection_timeout_ms ?? 10000,
            // Or a runaway query pins a pooler slot until the TCP timeout.
            statement_timeout: pool.statement_timeout_ms ?? 15000,
            ssl: this.#build_ssl_options(),
        });

        // Unhandled, an idle client dropped by the pooler takes the process down.
        this.pool.on('error', (error) => {
            console.error('Idle Postgres client error:', error.message);
        });
    }

    #build_ssl_options() {
        const {bundled_root_cert_path, root_cert_path, no_verify} = this.ssl_options;

        if (root_cert_path) {
            return {ca: readFileSync(root_cert_path, 'utf8'), rejectUnauthorized: true};
        }

        if (no_verify) {
            console.error(
                'PGSSL_NO_VERIFY=true: the database connection is encrypted but the ' +
                'server certificate is NOT verified. Unset it to use the bundled ' +
                'Supabase CA.',
            );
            return {rejectUnauthorized: false};
        }

        try {
            return {
                ca: readFileSync(bundled_root_cert_path, 'utf8'),
                rejectUnauthorized: true,
            };
        } catch (error) {
            console.error(
                `Could not read the bundled Postgres CA at ${bundled_root_cert_path} ` +
                `(${error.message}). Falling back to the system trust store, which does ` +
                'not include Supabase\'s CA - expect SELF_SIGNED_CERT_IN_CHAIN.',
            );
            return {rejectUnauthorized: true};
        }
    }

    // Passing a `name` would make these named prepared statements, which Supabase's
    // transaction-mode pooler does not support.
    async query(text, params = []) {
        const {rows} = await this.pool.query(text, params);

        return rows;
    }

    async close() {
        await this.pool.end();
    }
}
