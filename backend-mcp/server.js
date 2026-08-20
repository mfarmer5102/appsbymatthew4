// Entry point. Speaks JSON-RPC over stdio, so an MCP client launches it — run from a
// shell it just waits on stdin forever, which is not a hang. Everything tool-specific
// lives in src/tools.js; this file only wires that catalog to a transport.
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';

import {TOOLS} from './src/tools.js';
import {SERVER} from './src/config.js';
import {close as close_database} from './src/database.js';

const server = new McpServer(SERVER);

// Wrap a handler's return value in MCP's content envelope. isError reports the failure
// to the calling model instead of letting the exception kill the stdio connection.
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

// Don't leave a connection dangling against the pooler when the client restarts us.
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, async () => {
        await close_database().catch(() => {});
        process.exit(0);
    });
}

await server.connect(new StdioServerTransport());
