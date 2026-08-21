// Exercises _aws_lambda.mjs locally the way API Gateway would: build a fake event,
// invoke the handler directly (no server, no deploy). Run with `npm run lambda-test`.
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

const initialize_response = await handle_lambda_request(rpc_event({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: {name: 'lambda-test', version: '1.0.0'},
    },
}), {});

console.log('initialize ->', initialize_response.statusCode);
console.log(initialize_response.body);

const list_tools_response = await handle_lambda_request(rpc_event({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
}), {});

console.log('\ntools/list ->', list_tools_response.statusCode);
console.log(list_tools_response.body);

process.exit(
    initialize_response.statusCode === 200 && list_tools_response.statusCode === 200 ? 0 : 1,
);
