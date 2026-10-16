// The Express app: the site's REST API under /api, and the MCP endpoint at /api/mcp.
// index.js serves it. Importing this resolves secrets (src/configuration/secrets.js
// awaits them at module scope), which is why index.js imports it only after it is
// already listening.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {localhostHostValidation, localhostOriginValidation, toNodeHandler} from '@modelcontextprotocol/node';

import {api_router} from './src/configuration/routing.js';
import {error_config} from './src/configuration/errors.js';
import {cors_options} from './src/configuration/http.js';
import {mcp_endpoint} from './src/configuration/mcp.js';
import {postgres_config} from './src/configuration/database.js';
import {attach_client, api_rate_limit, mcp_rate_limit} from './src/configuration/middleware.js';

const is_web_function = Boolean(process.env.AWS_LAMBDA_HTTP_ENDPOINT);

export const app = express();

// The API is read cross-origin by the site, so helmet's default same-origin resource
// policy would get in the way.
app.use(helmet({crossOriginResourcePolicy: {policy: 'cross-origin'}}));
app.use(attach_client);

// MCP comes before cors() and express.json(): McpEndpoint applies its own CORS policy
// (MCP clients send headers the site never does) and reads the raw body itself.
//
// Locally it also rejects a Host or Origin that is not localhost, which stops a web
// page from reaching the dev server through DNS rebinding. In a Web Function, Lambda
// owns the host.
const as_middleware = (guard) => (req, res, next) => {
    if (guard(req, res)) next();
};
const mcp_guards = is_web_function
    ? []
    : [as_middleware(localhostHostValidation()), as_middleware(localhostOriginValidation())];

app.all('/api/mcp', mcp_rate_limit, ...mcp_guards, toNodeHandler(mcp_endpoint, {
    onerror: (error) => console.error('MCP request failed:', error),
}));

// cors() before the limiter, so a 429 still carries CORS headers the browser can read.
app.use(cors(cors_options));
app.use('/api', api_rate_limit);
app.use(express.json());
app.use('/api', api_router);

app.use((req, res) => {
    res.status(404).json('Not found.');
});

// Express 5 routes a rejected promise from any handler here. Errors keep the response
// shape the frontend already reads: a JSON string.
app.use((error, req, res, next) => {
    const [status_code, message] = error_config.prepare_error_notice(error);
    if (status_code >= 500) {
        console.error(`${req.method} ${req.path} failed:`, error);
    }
    res.status(status_code).json(message);
});

// For index.js's shutdown handler.
export const close_app = async () => {
    await mcp_endpoint.close();
    await postgres_config.close();
};
