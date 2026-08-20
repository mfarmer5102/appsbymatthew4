import {config as load_dotenv} from 'dotenv';
import {fileURLToPath} from 'url';

// Its own module purely to control *when* dotenv runs. ESM evaluates a module's imports
// before its own top-level code, so calling dotenv in server.js would happen after the
// whole import graph had already read process.env. config.js imports this first.
//
// Path is relative to this file, not process.cwd(): MCP clients spawn the server from
// an arbitrary working directory.
load_dotenv({path: fileURLToPath(new URL('../.env', import.meta.url))});

// Exit rather than throw: these are read at import time, so there is no request to fail
// and a one-line reason is more use than a stack trace. stderr, not stdout — stdout is
// the JSON-RPC channel, and clients surface stderr in their logs.
export function require_env(name) {
    const value = process.env[name];

    if (!value) {
        console.error(
            `Missing required environment variable ${name}. Copy .env.example to ` +
            `backend-mcp/.env and fill it in.`,
        );
        process.exit(1);
    }

    return value;
}

export function optional_env(name) {
    return process.env[name] || undefined;
}
