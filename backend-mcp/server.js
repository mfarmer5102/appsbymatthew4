// Speaks JSON-RPC over stdio, so an MCP client launches it - run from a shell it just
// waits on stdin forever, which is not a hang.
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';

import {container} from './src/configuration/index.js';
import {PortfolioMcpServer} from './src/_library/classes/mcp_server.js';

const server = new PortfolioMcpServer({
    info: container.config.server,
    catalog: container.tool_catalog,
    closables: container.closables,
});

await server.start(new StdioServerTransport());
