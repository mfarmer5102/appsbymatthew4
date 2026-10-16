// Launches the local dev server (index.js) and the MCP Inspector's web UI together,
// pre-pointed at it - dev convenience only, not part of the deployed server. Run with
// `npm run inspect`. Ctrl+C stops both.
import {spawn} from 'child_process';
import {fileURLToPath} from 'url';

const PORT = process.env.PORT || 2022;
const LOCAL_SERVER_PATH = fileURLToPath(new URL('../index.js', import.meta.url));

const server = spawn(process.execPath, [LOCAL_SERVER_PATH], {
    env: {...process.env, PORT},
    stdio: ['inherit', 'pipe', 'inherit'],
});

let inspector = null;

const shutdown = (code) => {
    inspector?.kill();
    server.kill();
    process.exit(code ?? 0);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// The dev server has no readiness signal but its own startup log line, so wait for
// that rather than guessing a delay or polling the port.
server.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);

    if (inspector || !chunk.toString().includes('listening')) {
        return;
    }

    inspector = spawn('npx', [
        '@modelcontextprotocol/inspector',
        '--web',
        '--transport', 'http',
        '--server-url', `http://localhost:${PORT}/mcp`,
    ], {stdio: 'inherit'});

    inspector.on('exit', (code) => shutdown(code));
});

// Only fires if the dev server dies before the inspector ever started - once the
// inspector is up, its own exit handler above owns shutdown.
server.on('exit', (code) => {
    if (!inspector) {
        console.error(`Local dev server exited before it started listening (code ${code}).`);
        process.exit(code ?? 1);
    }
});
