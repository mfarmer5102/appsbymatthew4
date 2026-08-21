import {config as load_dotenv} from 'dotenv';

// Controls *when* dotenv runs: ESM evaluates imports before the importing file's own
// code, so loading .env in server.js would already be too late.
export class Environment {
    // Absolute - MCP clients spawn this server from an arbitrary cwd.
    //
    // `secrets` is an already-resolved SecretConfig (see
    // src/configuration/secrets.js): present in Lambda, where there is no .env and
    // values come from Secrets Manager instead of process.env.
    constructor(dotenv_path = null, secrets = null) {
        if (dotenv_path) {
            load_dotenv({path: dotenv_path});
        }

        this.secrets = secrets;
    }

    // Exits rather than throws: there is no request to fail yet. stderr, not stdout -
    // stdout is the JSON-RPC channel.
    require(name) {
        const value = this.optional(name);

        if (!value) {
            console.error(
                `Missing required environment variable ${name}. Copy .env.example to ` +
                `backend-mcp/.env and fill it in.`,
            );
            process.exit(1);
        }

        return value;
    }

    optional(name) {
        return this.secrets?.[name] || process.env[name] || undefined;
    }

    flag(name) {
        return this.optional(name) === 'true';
    }
}
