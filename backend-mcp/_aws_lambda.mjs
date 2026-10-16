// Lambda Event Function entry point (the container image's CMD). It only translates:
// an API Gateway or Function URL event becomes a web-standard Request for the shared
// McpEndpoint, and its Response becomes the result Lambda expects. All MCP handling,
// CORS included, lives in McpEndpoint - index.js wraps the same object for Web
// Functions and local runs.
//
// The response is buffered: an Event Function behind a buffered Function URL or API
// Gateway can't stream. Nothing here needs to - see McpEndpoint's response mode.
import {get_container} from './src/configuration/index.js';

export const handle_lambda_request = async (event, _context) => {
    try {
        const {mcp_endpoint} = await get_container();
        const response = await mcp_endpoint.fetch(to_web_request(event));

        return {
            statusCode: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: await response.text(),
            isBase64Encoded: false,
        };
    } catch (error) {
        console.error('MCP Lambda request failed:', error);

        return {
            statusCode: 500,
            headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            body: JSON.stringify({error: 'Internal server error'}),
            isBase64Encoded: false,
        };
    }
};

// Handles both payload shapes: API Gateway REST (v1: httpMethod, path,
// queryStringParameters) and Function URLs / HTTP APIs (v2: requestContext.http,
// rawPath, rawQueryString). The host is a placeholder; the endpoint routes on nothing
// but method, headers and body.
const to_web_request = (event) => {
    const method = event['httpMethod'] || event['requestContext']?.['http']?.['method'] || 'POST';

    const headers = new Headers();
    for (const [key, value] of Object.entries(event['headers'] || {})) {
        if (value != null) {
            headers.set(key, value);
        }
    }

    const url = new URL(event['rawPath'] || event['path'] || '/mcp', 'https://lambda.internal');
    if (event['rawQueryString']) {
        url.search = event['rawQueryString'];
    } else {
        for (const [key, value] of Object.entries(event['queryStringParameters'] || {})) {
            if (value != null) {
                url.searchParams.set(key, value);
            }
        }
    }

    const has_body = method !== 'GET' && method !== 'HEAD' && event['body'] != null;
    const body = has_body
        ? (event['isBase64Encoded'] ? Buffer.from(event['body'], 'base64').toString('utf8') : event['body'])
        : undefined;

    return new Request(url, {method, headers, body});
};
