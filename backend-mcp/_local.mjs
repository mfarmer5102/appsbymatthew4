// Local dev server only - never deployed (absent from DockerfileLambda, which copies
// the whole directory but only ever invokes _aws_lambda.handle_lambda_request). Runs
// that exact same handler, so behavior matches prod; only the transport differs. Lets
// a real Streamable HTTP MCP client (e.g. the MCP Inspector) point at
// http://localhost:PORT/mcp instead of calling the handler in-process the way
// scripts/smoke_test.js does.
import {createServer} from 'http';
import {URL} from 'url';

import {handle_lambda_request} from './_aws_lambda.mjs';

const PORT = process.env.PORT || 2022;

const read_body = (req) => new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
});

// Mirrors just enough of an API Gateway event for _aws_lambda.mjs's to_web_request()
// to convert - the same shape scripts/smoke_test.js constructs by hand.
const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const body = await read_body(req);

    const event = {
        httpMethod: req.method,
        path: url.pathname,
        headers: req.headers,
        queryStringParameters: Object.fromEntries(url.searchParams),
        body: body || null,
        isBase64Encoded: false,
    };

    const response = await handle_lambda_request(event, {});

    res.writeHead(response.statusCode, response.headers);
    res.end(response.body);
});

server.listen(PORT, () => {
    console.log(`MCP dev server listening on http://localhost:${PORT}/mcp`);
});
