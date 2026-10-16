import {fileURLToPath} from 'url';

// Every setting, resolved once. Nothing else reads process.env, so this class plus
// .env.example is the whole configuration surface.
export class Configuration {
    constructor(environment) {
        this.environment = environment;

        this.server = {
            name: 'appsbymatthew-portfolio',
            version: '2.0.0',
        };

        // A Web Function sets AWS_LAMBDA_HTTP_ENDPOINT and serves many requests at once
        // from one process; an Event Function serves one at a time.
        this.is_web_function = Boolean(environment.optional('AWS_LAMBDA_HTTP_ENDPOINT'));

        this.mcp = {
            // Every tool takes at most three scalar arguments, so this only turns away
            // a pathological payload before any schema runs.
            max_tool_input_elements: 100,

            // How long a client may cache tools/list and server/discover. Both change
            // only with a deploy.
            cache_ttl_ms: 60 * 60 * 1000,

            // Origins CORS reflects; everything else gets '*'.
            allowed_origin: /^https:\/\/(www\.)?appsbymatthew\.com$/,
        };

        this.database = {
            connection_string: environment.require('SUPABASE_DB_URL'),

            // Not public, so queries qualify it rather than relying on search_path.
            schema: 'apps_by_matthew',

            // Read-only, so the pool stays small - but a Web Function environment
            // serves concurrent requests, which would queue behind three connections.
            pool: {
                max: this.is_web_function ? 10 : 3,
                idle_timeout_ms: 30000,
                connection_timeout_ms: 10000,
                statement_timeout_ms: 15000,
            },

            // Supabase's pooler is rooted in its own CA, absent from Node's trust
            // store - without it, SELF_SIGNED_CERT_IN_CHAIN. no_verify still encrypts
            // but stops authenticating the server. Last resort.
            ssl: {
                bundled_root_cert_path: fileURLToPath(
                    new URL('../../../certs/supabase-prod-ca-2021.crt', import.meta.url),
                ),
                root_cert_path: environment.optional('PGSSL_ROOT_CERT'),
                no_verify: environment.flag('PGSSL_NO_VERIFY'),
            },
        };

        this.openai = {
            api_key: environment.require('OPENAI_API_KEY'),

            // Also the stored dim_application_embedding.model_version, which reads
            // filter on. Changing it invalidates every stored vector.
            embedding_model: 'text-embedding-3-small', // 1536 dimensions

            // The model's context is ~8k tokens.
            embedding_input_max_chars: 30000,
        };

        // max is enforced by each tool's zod schema, so an oversized request never
        // reaches a query.
        this.limits = {
            search_applications: {default: 10, max: 50},
            search_applications_semantic: {default: 5, max: 20},
            get_skills: {default: 100, max: 200},
        };
    }

    limits_for(tool_name) {
        const limits = this.limits[tool_name];

        if (!limits) {
            throw new Error(`No configured limits for tool "${tool_name}".`);
        }

        return limits;
    }
}
