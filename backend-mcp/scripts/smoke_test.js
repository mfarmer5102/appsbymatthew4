// Drives handle_lambda_request with the SDK's own client, once per protocol era: a
// 2026-07-28 client (pinned, so it cannot quietly fall back) and a default 2025-era
// client, which is still what most hosts send. Each lists the tools and calls every
// one. No deploy and no socket: the client's fetch is pointed at the Lambda handler,
// with each request converted to the event a Function URL would send. Run with
// `npm run smoke-test`.
import {Client, StreamableHTTPClientTransport} from '@modelcontextprotocol/client';

import {handle_lambda_request} from '../_aws_lambda.mjs';
import {close_container} from '../src/configuration/index.js';

const ENDPOINT = new URL('https://lambda.internal/mcp');

// A Function URL (payload v2) event, the shape a real deploy receives.
const lambda_fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);

    const result = await handle_lambda_request({
        rawPath: url.pathname,
        rawQueryString: url.search.slice(1),
        headers: Object.fromEntries(request.headers),
        requestContext: {http: {method: request.method}},
        body: request.method === 'GET' ? null : (await request.text()) || null,
        isBase64Encoded: false,
    }, {});

    // A 202 or 204 must not carry a body, even an empty string.
    return new Response(result.body || null, {status: result.statusCode, headers: result.headers});
};

const ERAS = [
    ['2026-07-28', {versionNegotiation: {mode: {pin: '2026-07-28'}}}],
    ['2025 (default client)', {}],
];

const CALLS = [
    ['list_lookups', {}],
    ['search_applications', {limit: 2}],
    ['get_skills', {proficient_only: true, limit: 5}],
    ['search_applications_semantic', {query: 'AI chatbot with vector search', limit: 2}],
];

const preview = (text, length = 160) =>
    text.length > length ? `${text.slice(0, length)}...` : text;

let failures = 0;

for (const [label, options] of ERAS) {
    const client = new Client({name: 'smoke-test', version: '1.0.0'}, options);
    await client.connect(new StreamableHTTPClientTransport(ENDPOINT, {fetch: lambda_fetch}));

    const {tools} = await client.listTools();
    console.log(`\n=== ${label}: connected as ${client.getProtocolEra()}, ${tools.length} tools`);

    for (const tool of tools) {
        if (!tool.annotations?.readOnlyHint) {
            failures++;
            console.log(`FAIL ${tool.name} is not annotated read-only`);
        }
    }

    for (const [name, args] of CALLS) {
        const result = await client.callTool({name, arguments: args});
        const text = result.content.map((part) => part.text).join('\n');

        if (result.isError) {
            failures++;
            console.log(`FAIL ${name}\n  ${preview(text)}`);
        } else {
            console.log(`OK   ${name}(${JSON.stringify(args)})  ${preview(text.replace(/\s+/g, ' '))}`);
        }
    }

    await client.close();
}

// The site's own origin is reflected, and a 2026 client's per-request headers are
// allowed - otherwise a browser-based client never gets past the preflight.
const preflight = await lambda_fetch(ENDPOINT, {
    method: 'OPTIONS',
    headers: {
        'origin': 'https://www.appsbymatthew.com',
        'access-control-request-headers': 'content-type, mcp-method, mcp-name, mcp-protocol-version',
    },
});
const allowed = preflight.headers.get('access-control-allow-headers') ?? '';

if (
    preflight.status !== 204 ||
    preflight.headers.get('access-control-allow-origin') !== 'https://www.appsbymatthew.com' ||
    !allowed.includes('mcp-method')
) {
    failures++;
    console.log(`\nFAIL CORS preflight: ${preflight.status} ${JSON.stringify(Object.fromEntries(preflight.headers))}`);
} else {
    console.log('\nOK   CORS preflight');
}

await close_container();

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
