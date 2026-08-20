// Entry point for the portfolio MCP server. Speaks JSON-RPC over stdio, so it is
// launched by an MCP client (Claude Desktop, the Inspector) rather than run by hand -
// started directly from a shell it simply waits on stdin forever.
//
// Everything specific to a tool - its description, inputs and query - lives in
// src/tools.js; this file only wires that catalog to a transport.
//
// Note there is no dotenv call here: src/config.js imports src/env.js before it reads
// process.env, which is what makes the ordering correct. See the note in env.js.
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';

import {TOOLS} from './src/tools.js';
import {SERVER} from './src/config.js';
import {close as close_database} from './src/database.js';

const server = new McpServer(SERVER);

/**
 * Wrap a handler's return value in MCP's content envelope.
 *
 * Errors are reported with isError so the calling model sees what went wrong and can
 * retry or say so, rather than the exception killing the whole stdio connection.
 */
function tool_handler(handler) {
    return async (args) => {
        try {
            const result = await handler(args);
            return {content: [{type: 'text', text: JSON.stringify(result, null, 2)}]};
        } catch (error) {
            console.error('Tool error:', error);
            return {
                content: [{type: 'text', text: `Error: ${error.message}`}],
                isError: true,
            };
        }
    };
}

for (const {name, title, description, input_schema, handler} of TOOLS) {
    server.registerTool(
        name,
        {title, description, inputSchema: input_schema},
        tool_handler(handler),
    );
}

// Close the pool on shutdown so the client does not leave a connection dangling
// against Supabase's pooler when it restarts the server.
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, async () => {
        await close_database().catch(() => {});
        process.exit(0);
    });
}

await server.connect(new StdioServerTransport());
