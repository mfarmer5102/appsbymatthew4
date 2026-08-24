// Exercises the server the way a real MCP client does, over HTTP: initialize, list
// tools, then call each one. Invokes handle_lambda_request directly - no deploy, no
// running process. Run with `npm run smoke-test`.
import {handle_lambda_request} from '../_aws_lambda.mjs';

const rpc_event = (body) => ({
    httpMethod: 'POST',
    path: '/mcp',
    headers: {
        'content-type': 'application/json',
        'accept': 'application/json, text/event-stream',
    },
    queryStringParameters: {},
    body: JSON.stringify(body),
    isBase64Encoded: false,
});

let next_id = 1;

const rpc = async (method, params) => {
    const response = await handle_lambda_request(rpc_event({
        jsonrpc: '2.0',
        id: next_id++,
        method,
        params,
    }), {});
    const parsed = JSON.parse(response.body);

    if (response.statusCode !== 200 || parsed.error) {
        throw new Error(`${method} failed: ${response.statusCode} ${response.body}`);
    }

    return parsed.result;
};

const preview = (text, length = 240) =>
    text.length > length ? `${text.slice(0, length)}...` : text;

const CALLS = [
    ['list_lookups', {}],
    ['search_applications', {limit: 2}],
    ['get_skills', {proficient_only: true, limit: 5}],
    ['search_applications_semantic', {query: 'AI chatbot with vector search', limit: 2}],
];

await rpc('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: {name: 'smoke-test', version: '1.0.0'},
});

const {tools} = await rpc('tools/list', {});
console.log(`Connected. ${tools.length} tools registered:`);
for (const tool of tools) console.log(`  - ${tool.name}`);

let failures = 0;

for (const [name, args] of CALLS) {
    const result = await rpc('tools/call', {name, arguments: args});
    const text = result.content.map((part) => part.text).join('\n');

    if (result.isError) {
        failures++;
        console.log(`\nFAIL ${name}\n  ${preview(text)}`);
    } else {
        console.log(`\nOK   ${name}(${JSON.stringify(args)})\n  ${preview(text)}`);
    }
}

console.log(failures === 0 ? '\nAll tool calls succeeded.' : `\n${failures} tool call(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
