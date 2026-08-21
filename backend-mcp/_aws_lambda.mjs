// Lambda entry point for the MCP server, alongside server.js's stdio entry point.
// stdio only makes sense for a client that spawns the process itself (Claude Desktop,
// the Inspector); Lambda instead receives one HTTP request per invocation, so this
// speaks MCP's Streamable HTTP transport over a Web Standard Request/Response,
// converted to and from whatever shape API Gateway or a Lambda Function URL hands us.
//
// Must come first: secrets.js reads process.env at module scope (via SecretConfig's
// constructor). In Lambda the values come from Secrets Manager and there is no .env to
// find, so this is a no-op there - it exists so `npm run lambda-test` works locally.
import 'dotenv/config';

import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {WebStandardStreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';

import secret_config from './src/configuration/secrets.js';
import {Container} from './src/configuration/index.js';

// Built once per cold start, then reused across warm invocations - the database pool
// and OpenAI client are container singletons, so a warm Lambda keeps its connections.
const container = new Container({secrets: secret_config});

// Reflect the request's Origin so both appsbymatthew.com and www.appsbymatthew.com work,
// same policy as backend/_aws_lambda.mjs. An MCP client is not usually a browser, but a
// browser-based one (e.g. the Inspector's remote mode) still needs this.
const cors_headers = (origin) => ({
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Expose-Headers': 'Mcp-Session-Id',
    'Access-Control-Allow-Origin': /^https:\/\/(www\.)?appsbymatthew\.com$/.test(origin) ? origin : '*',
});

export const handle_lambda_request = async (event, context) => {
    const method = event['httpMethod'] || event['requestContext']?.['http']?.['method'] || 'POST';
    const origin = (event['headers'] || {})['origin'] || (event['headers'] || {})['Origin'];

    if (method === 'OPTIONS') {
        return {
            isBase64Encoded: false,
            statusCode: 204,
            headers: cors_headers(origin),
            multiValueHeaders: {},
            body: '',
        };
    }

    try {
        const response = await handle_mcp_request(event, method);
        const body = await response.text();
        const headers = Object.fromEntries(response.headers.entries());

        return {
            isBase64Encoded: false,
            statusCode: response.status,
            headers: {...headers, ...cors_headers(origin)},
            multiValueHeaders: {},
            body,
        };
    } catch (error) {
        console.error('MCP Lambda request failed:', error);

        return {
            isBase64Encoded: false,
            statusCode: 500,
            headers: cors_headers(origin),
            multiValueHeaders: {},
            body: JSON.stringify({error: 'Internal server error'}),
        };
    }
};

// A fresh McpServer + transport per invocation - Lambda gives no guarantee that two
// requests land on the same instance, so there is nowhere to keep an in-memory MCP
// session between them. sessionIdGenerator: undefined puts the transport in stateless
// mode to match; enableJsonResponse skips the SSE stream, since a buffered Lambda
// response can't push further events after it returns anyway.
const handle_mcp_request = async (event, method) => {
    const server = new McpServer(container.config.server);
    container.tool_catalog.register_all(server);

    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
    });

    await server.connect(transport);

    try {
        return await transport.handleRequest(to_web_request(event, method));
    } finally {
        await transport.close();
    }
};

const to_web_request = (event, method) => {
    const headers = new Headers();
    for (const [key, value] of Object.entries(event['headers'] || {})) {
        if (value != null) {
            headers.set(key, value);
        }
    }

    const url = new URL(event['path'] || event['rawPath'] || '/mcp', 'https://lambda.internal');
    for (const [key, value] of Object.entries(event['queryStringParameters'] || {})) {
        if (value != null) {
            url.searchParams.set(key, value);
        }
    }

    const has_body = method !== 'GET' && method !== 'HEAD' && event['body'] != null;
    const body = has_body
        ? (event['isBase64Encoded'] ? Buffer.from(event['body'], 'base64').toString('utf8') : event['body'])
        : undefined;

    return new Request(url, {method, headers, body});
};
