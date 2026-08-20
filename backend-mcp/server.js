// Entry point for the portfolio MCP server. Speaks JSON-RPC over stdio, so it is
// launched by an MCP client (Claude Desktop, the Inspector) rather than run by hand -
// started directly from a shell it simply waits on stdin forever.
//
// Note there is no dotenv call here: database.js imports src/env.js before it reads
// process.env, which is what makes the ordering correct. See the note in env.js.
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';

import * as tools from './src/tools.js';
import {close as close_database} from './src/database.js';

const server = new McpServer({
    name: 'appsbymatthew-portfolio',
    version: '1.0.0',
});

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
            console.error(`Tool error:`, error);
            return {
                content: [{type: 'text', text: `Error: ${error.message}`}],
                isError: true,
            };
        }
    };
}

server.registerTool(
    'search_applications',
    {
        title: 'Search applications',
        description:
            'Keyword search over portfolio project titles and descriptions. Omit the ' +
            'query to list the most recent projects.',
        inputSchema: {
            query: z.string().optional().describe('Text to match against title/description'),
            limit: z.number().int().positive().max(50).optional(),
        },
    },
    tool_handler(tools.search_applications),
);

server.registerTool(
    'search_applications_semantic',
    {
        title: 'Semantic search applications',
        description:
            'Conceptual search over portfolio projects using the same pgvector index the ' +
            'site\'s AI chat uses. Better than keyword search for questions like "what did ' +
            'he build involving background jobs".',
        inputSchema: {
            query: z.string().describe('Natural-language description of what to find'),
            limit: z.number().int().positive().max(20).optional(),
        },
    },
    tool_handler(tools.search_applications_semantic),
);

server.registerTool(
    'get_skills',
    {
        title: 'Get skills',
        description:
            'List skills, optionally filtered by skill type or to proficient ones only. ' +
            'Call list_lookups for the valid skill_type values.',
        inputSchema: {
            skill_type: z.string().optional().describe('Exact skill type, e.g. "Database"'),
            proficient_only: z.boolean().optional(),
            limit: z.number().int().positive().max(200).optional(),
        },
    },
    tool_handler(tools.get_skills),
);

server.registerTool(
    'list_lookups',
    {
        title: 'List lookup values',
        description:
            'List every skill type and support status used across the portfolio. Useful ' +
            'for discovering the values the other tools accept as filters.',
        inputSchema: {},
    },
    tool_handler(tools.list_lookups),
);

// Close the pool on shutdown so the client does not leave a connection dangling
// against Supabase's pooler when it restarts the server.
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, async () => {
        await close_database().catch(() => {});
        process.exit(0);
    });
}

await server.connect(new StdioServerTransport());
