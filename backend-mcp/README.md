# backend-mcp

An [MCP](https://modelcontextprotocol.io) server that exposes the portfolio database as
tools, so an MCP client (Claude Desktop, the MCP Inspector) can query it directly.

It is a standalone service with its own dependencies. It reads the same Supabase
database as `backend/`, **read-only**, but shares no code with it — the pieces it needs
are reimplemented under `src/` rather than imported across directory boundaries, so this
directory can be deployed or moved on its own. The class names and layout deliberately
echo `backend/src/_library/classes/`, so the two read the same way.

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

Everything configurable lives in the `Configuration` class
(`src/_library/classes/configuration.js`) — the two required secrets, the optional TLS
overrides, the Postgres schema and pool sizing, the embedding model, and each tool's
default and maximum result count. Nothing else reads `process.env`, so that class plus
`.env.example` is the whole configuration surface.

## Layout

Classes, wired together in one place, so a tool can be constructed against a stub rather
than reaching for a module singleton.

```
server.js                    picks a transport, starts the server
src/_library/classes/        the reusable pieces, none of them portfolio-specific
  environment.js             Environment    - loads .env, reads/validates variables
  configuration.js           Configuration  - every setting, resolved once
  postgres.js                PostgresConfig - pool, TLS, type parsers, query()
  openai.js                  OpenAIConfig   - embeddings (no chat model here)
  repository.js              Repository     - base for the data layer
  tool.js                    Tool           - base for a tool: schema, envelope, register
  tool_catalog.js            ToolCatalog    - the set of tools, rejects duplicate names
  mcp_server.js              PortfolioMcpServer - registration, signals, shutdown
src/repositories/            one class per part of the star schema; owns the SQL
src/tools/                   one class per tool; owns the description and input schema
src/configuration/
  container.js               Container - the composition root; builds everything
  index.js                   the one Container instance the running server uses
```

`Tool` subclasses take their repositories through the constructor and implement
`execute()`; the base class handles the MCP content envelope and error reporting, so
`server.js` never learns what tools exist. Adding a tool is a class under `src/tools/`
and one entry in `Container#tool_catalog`.

`Container` is the only place wiring lives — nothing below it imports a singleton, and
its members are built lazily on first use, so a test can construct its own container
(passing a stub `Environment`) without opening a pool or an OpenAI client.

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

A related subtlety: `Environment` loads dotenv in its constructor, which is what makes it
run at the right *time*. ES modules evaluate all static imports before the importing
file's own code, so calling `dotenv.config()` at the top of `server.js` would still
happen after the entire import graph had been evaluated — and after anything reading
`process.env` at module scope had already read it as undefined. Nothing here reads
`process.env` at module scope: every read goes through the `Configuration` that
`Container` builds immediately after its `Environment`, so the ordering is a matter of
construction order in one constructor rather than of the module graph.
