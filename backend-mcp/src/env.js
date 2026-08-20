import {config} from 'dotenv';
import {fileURLToPath} from 'url';

/**
 * Loads .env, and exists as its own module purely to control *when* that happens.
 *
 * ES modules evaluate every static import before the importing file's own top-level
 * code, so calling dotenv at the top of server.js would still run after the whole
 * import graph — including anything that reads process.env at module scope — had
 * already been evaluated. Importing this module first from database.js instead makes
 * the ordering explicit and correct: a module's imports are evaluated in source order.
 *
 * The path is resolved relative to this file rather than process.cwd() because MCP
 * clients (Claude Desktop) spawn the server with an arbitrary working directory.
 */
config({path: fileURLToPath(new URL('../.env', import.meta.url))});

export function require_env(name) {
    const value = process.env[name];

    if (!value) {
        // stderr, not stdout: stdout is the JSON-RPC channel and any stray write there
        // corrupts the protocol stream. MCP clients surface stderr in their logs.
        console.error(
            `Missing required environment variable ${name}. Copy .env.example to ` +
            `backend-mcp/.env and fill it in.`,
        );
        process.exit(1);
    }

    return value;
}
