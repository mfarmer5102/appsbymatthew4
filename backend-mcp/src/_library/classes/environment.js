import {config as load_dotenv} from 'dotenv';

// Controls *when* dotenv runs: ESM evaluates imports before the importing file's own
// code, so loading .env at the top of _aws_lambda.mjs would already be too late.
export class Environment {
    // Absolute, not resolved against process.cwd() - Lambda has no .env to find anyway.
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

    // Exits rather than throws: there is no request to fail yet, so there is nothing
    // for a thrown error to propagate back to.
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
