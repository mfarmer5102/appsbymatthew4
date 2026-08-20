// Exercises the server the way a real MCP client does: spawn it, speak JSON-RPC over
// stdio, list the tools and call each one. Run with `npm run smoke-test`.
//
// cwd is deliberately set to the filesystem root, reproducing the one bug this setup
// is most prone to - Claude Desktop launches the server from an arbitrary working
// directory, so anything resolved relative to process.cwd() (.env, the CA cert) breaks
// there while working fine when run by hand from this directory.
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {fileURLToPath} from 'url';

const SERVER_PATH = fileURLToPath(new URL('../server.js', import.meta.url));

const CALLS = [
    ['list_lookups', {}],
    ['search_applications', {limit: 2}],
    ['get_skills', {proficient_only: true, limit: 5}],
    ['search_applications_semantic', {query: 'AI chatbot with vector search', limit: 2}],
];

const preview = (text, length = 240) =>
    text.length > length ? `${text.slice(0, length)}...` : text;

const transport = new StdioClientTransport({
    command: process.execPath,
    args: [SERVER_PATH],
    cwd: '/',
});

const client = new Client({name: 'smoke-test', version: '1.0.0'});
await client.connect(transport);

const {tools} = await client.listTools();
console.log(`Connected. ${tools.length} tools registered:`);
for (const tool of tools) console.log(`  - ${tool.name}`);

let failures = 0;

for (const [name, args] of CALLS) {
    const result = await client.callTool({name, arguments: args});
    const text = result.content.map((part) => part.text).join('\n');

    if (result.isError) {
        failures++;
        console.log(`\nFAIL ${name}\n  ${preview(text)}`);
    } else {
        console.log(`\nOK   ${name}(${JSON.stringify(args)})\n  ${preview(text)}`);
    }
}

await client.close();
console.log(failures === 0 ? '\nAll tool calls succeeded.' : `\n${failures} tool call(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
