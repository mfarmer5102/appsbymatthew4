// HTTP server entry point: a Lambda Web Function's entry file in AWS (the runtime loads
// index.js from the package root by default), and the local dev server everywhere
// else. Serves the same McpEndpoint as _aws_lambda.mjs, adapted to Node's http server.
//
// In a Web Function, Lambda sets AWS_LAMBDA_HTTP_ENDPOINT to the host:port to bind and
// terminates TLS in front of it. Locally it is unset, so this binds loopback and
// guards against DNS rebinding - set PORT, not AWS_LAMBDA_HTTP_ENDPOINT, to move it.
import {createServer} from 'http';
import {localhostHostValidation, localhostOriginValidation, toNodeHandler} from '@modelcontextprotocol/node';

import {close_container, get_container} from './src/configuration/index.js';

const LAMBDA_ENDPOINT = process.env.AWS_LAMBDA_HTTP_ENDPOINT;
const [HOST, PORT] = LAMBDA_ENDPOINT
    ? LAMBDA_ENDPOINT.split(':')
    : ['127.0.0.1', process.env.PORT || 2022];

const handle = toNodeHandler(
    {
        fetch: async (request, options) => {
            const {mcp_endpoint} = await get_container();
            return mcp_endpoint.fetch(request, options);
        },
    },
    {onerror: (error) => console.error('MCP HTTP request failed:', error)},
);

// A page in the browser can resolve its own domain to 127.0.0.1; these stop it from
// reaching a local server that way. In Lambda the host is the function's own URL.
const guards = LAMBDA_ENDPOINT ? [] : [localhostHostValidation(), localhostOriginValidation()];

const server = createServer((req, res) => {
    if (guards.every((guard) => guard(req, res))) {
        void handle(req, res);
    }
});

server.listen(Number(PORT), HOST, () => {
    console.log(`MCP server listening on http://${HOST}:${PORT}/mcp`);

    // Listening first, building second: Lambda routes requests as soon as the port is
    // open, and the first request awaits this same build. A failure is retried by
    // that request, so it is only logged here.
    get_container().catch((error) => console.error('Warm-up failed:', error));
});

// A Web Function gets 1 second after SIGTERM, so close what is open and nothing more.
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, async () => {
        server.close();
        await close_container();
        process.exit(0);
    });
}
