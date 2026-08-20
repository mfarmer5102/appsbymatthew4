# backend-mcp

An [MCP](https://modelcontextprotocol.io) server that exposes the portfolio database as
tools, so an MCP client (Claude Desktop, the MCP Inspector) can query it directly.

It is a standalone service with its own dependencies. It reads the same Supabase
database as `backend/`, **read-only**, but shares no code with it — the pieces it needs
are copied into `src/` rather than imported across directory boundaries, so this
directory can be deployed or moved on its own.

## How it differs from `backend/`

`backend/` serves HTTP and owns all the writes. Its `/api/chat` endpoint does retrieval
*and* generation: it embeds the question, searches, then calls OpenAI for an answer.

Here the client is the model. This server only retrieves — it embeds a query and runs
the pgvector search, then hands the rows back for Claude to reason over and answer from.
That is why the only OpenAI call in this directory is `embeddings.create`, and why
there is no chat model configured.

Being read-only also means there is no transaction helper, no admin code, and no auth:
every tool is a `SELECT`. Access control is the client's — anyone who can launch this
process can read the portfolio data.

## Setup

```bash
cd backend-mcp
npm install
cp .env.example .env   # then fill in SUPABASE_DB_URL and OPENAI_API_KEY
npm run smoke-test     # verifies it connects and every tool returns
```

## Tools

| Tool | Purpose |
| --- | --- |
| `search_applications` | Keyword search over project titles/descriptions. Omit the query to list recent projects. |
| `search_applications_semantic` | Conceptual search via pgvector, over the same embeddings the site's chat uses. |
| `get_skills` | Skills, filterable by type or proficiency. |
| `list_lookups` | Every skill type and support status — how a caller discovers valid filter values. |

## Running it

The server speaks JSON-RPC over **stdio**, so it is launched by a client rather than run
by hand. `node server.js` on its own just waits on stdin forever; that is not a hang.

**MCP Inspector** — a browser UI for calling tools and watching the raw protocol
traffic, and the best way to poke at it while developing:

```bash
npm run inspect
```

**Claude Desktop** — add to
`~/Library/Application Support/Claude/claude_desktop_config.json`, then fully quit and
reopen the app:

```json
{
  "mcpServers": {
    "appsbymatthew-portfolio": {
      "command": "node",
      "args": ["/Users/Matthew/Repositories/appsbymatthew4/backend-mcp/server.js"]
    }
  }
}
```

Absolute paths are required — the client does not resolve relative ones, and does not
run the server from this directory.

## Gotchas worth knowing

These are the two things that actually bit during development, both worth understanding
before writing another MCP server:

**Never write to stdout.** stdout *is* the protocol channel. A stray `console.log`
injects garbage into the JSON-RPC stream and the client drops the connection. Use
`console.error`; clients capture stderr in their logs
(`~/Library/Logs/Claude/mcp-server-*.log` on macOS).

**The working directory is not this one.** Claude Desktop spawns the server from an
arbitrary cwd, so anything resolved relative to `process.cwd()` — `.env`, the bundled CA
cert — silently fails there while working fine when run by hand. Everything here
resolves against `import.meta.url` instead, and `npm run smoke-test` runs the server
from `/` specifically to keep that honest.

A related subtlety: `src/env.js` exists only to make dotenv run at the right *time*. ES
modules evaluate all static imports before the importing file's own code, so calling
`dotenv.config()` at the top of `server.js` would still happen after the entire import
graph had been evaluated — and after anything that reads `process.env` at module scope
had already read it as undefined.
