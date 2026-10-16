import {config as load_dotenv} from 'dotenv';

// Controls *when* dotenv runs: ESM evaluates imports before the importing file's own
// code, so loading .env at the top of an entry point would already be too late.
export class Environment {
    // Absolute, not resolved against process.cwd() - Lambda has no .env to find anyway.
    //
    // `secrets` is an already-resolved SecretConfig (see
    // src/configuration/secrets.js): populated in AWS, where there is no .env and
    // values come from Secrets Manager instead of process.env.
    constructor(dotenv_path = null, secrets = null) {
        if (dotenv_path) {
            load_dotenv({path: dotenv_path, quiet: true});
        }

        this.secrets = secrets;
    }

    // Throws rather than exits: the Container is built on the first request (see
    // src/configuration/index.js), so the error fails that request and lands in the
    // logs instead of killing an environment that is serving others.
    require(name) {
        const value = this.optional(name);

        if (!value) {
            throw new Error(
                `Missing required environment variable ${name}. Copy .env.example to ` +
                `backend-mcp/.env and fill it in.`,
            );
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
