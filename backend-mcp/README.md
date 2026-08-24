# backend-mcp

An [MCP](https://modelcontextprotocol.io) server that exposes the portfolio database as
tools, so an MCP client that speaks Streamable HTTP (the MCP Inspector's remote mode, a
hosted client) can query it directly.

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
every tool is a `SELECT`. Access control is the client's — anyone who can reach the
Lambda URL can read the portfolio data.

## Setup

```bash
cd backend-mcp
npm install
cp .env.example .env   # then fill in SUPABASE_DB_URL and OPENAI_API_KEY
npm run smoke-test     # verifies it connects and every tool returns
npm run dev            # or: a real HTTP server at localhost:2022/mcp for a real client
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
_aws_lambda.mjs              Lambda entry point - the only deployed entry point
_local.mjs                   dev-only: runs handle_lambda_request behind a real HTTP server
src/_library/classes/        the reusable pieces, none of them portfolio-specific
  environment.js             Environment    - loads .env or resolved secrets, reads/validates
  configuration.js           Configuration  - every setting, resolved once
  postgres.js                PostgresConfig - pool, TLS, type parsers, query()
  openai.js                  OpenAIConfig   - embeddings (no chat model here)
  repository.js              Repository     - base for the data layer
  tool.js                    Tool           - base for a tool: schema, envelope, register
  tool_catalog.js            ToolCatalog    - the set of tools, rejects duplicate names
  secrets.js                 SecretConfig   - Secrets Manager, used only in Lambda
src/repositories/            one class per part of the star schema; owns the SQL
src/tools/                   one class per tool; owns the description and input schema
src/configuration/
  container.js               Container - the composition root; builds everything
  secrets.js                  resolves SecretConfig once, at module scope, for Lambda
```

`Tool` subclasses take their repositories through the constructor and implement
`execute()`; the base class handles the MCP content envelope and error reporting, so
`_aws_lambda.mjs` never learns what tools exist. Adding a tool is a class under
`src/tools/` and one entry in `Container#tool_catalog`.

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

`_aws_lambda.mjs` exports `handle_lambda_request`, the sole deployed entry point,
speaking MCP's **Streamable HTTP** transport over a Web Standard Request/Response
converted to and from whatever shape API Gateway or a Lambda Function URL hands it. A
client always reaches this over HTTP — there is no stdio transport.

Lambda hands it one event per invocation, and there is no guarantee two requests land on
the same instance, so there is nowhere to keep an in-memory MCP session between them the
way a long-lived process would. Every invocation therefore builds a fresh `McpServer`,
registers the same `Container#tool_catalog` onto it, and opens
`WebStandardStreamableHTTPServerTransport` in **stateless mode**
(`sessionIdGenerator: undefined`, `enableJsonResponse: true`) — no session to validate,
no SSE stream to keep open past the one buffered response Lambda returns. The Postgres
pool and OpenAI client stay `Container` singletons, so they survive a warm start; only
the per-request MCP plumbing is rebuilt.

Secrets: locally, `Environment` loads `backend-mcp/.env`. Lambda has no `.env`, so
`src/configuration/secrets.js` resolves `SUPABASE_DB_URL` and `OPENAI_API_KEY` from AWS
Secrets Manager's `prd-secrets` secret at module scope (a top-level `await`, so it
finishes before `Container` is built) and hands the result to `Container` as `secrets`;
`Environment` checks that object before `process.env`. This mirrors
`backend/src/configuration/secrets.js` — reimplemented, not imported, for the same
reason the rest of this directory is: it stays deployable on its own.

```bash
npm run smoke-test   # invokes handle_lambda_request directly - initialize, list, call every tool
```

### Running it locally against a real client

`npm run smoke-test` calls `handle_lambda_request` in-process — no socket, so nothing an
external client can point at. `_local.mjs` is a thin dev-only wrapper: a plain Node
`http` server that converts each incoming request into the same event shape API Gateway
would send, hands it to `handle_lambda_request` unchanged, and writes the response back.
It isn't part of the deployment (`DockerfileLambda` never references it), and it isn't a
second real transport — `_aws_lambda.mjs` is still the only code that speaks MCP.

```bash
npm run dev       # serves http://localhost:2022/mcp (PORT env var to change it)
npm run inspect   # both of the above: starts the dev server, then the Inspector pointed at it
```

`npm run inspect` (`scripts/inspect.js`) is the easiest way to poke at it while
developing: it starts `_local.mjs`, waits for its "listening" log line, then launches
the MCP Inspector's web UI pre-connected to `http://localhost:2022/mcp` (`--transport
http --server-url ...`) and opens it in a browser. Ctrl+C stops both.

Deployed the same way as `backend/`: `dockerfiles/DockerfileLambda` builds a container
image (`public.ecr.aws/lambda/nodejs:20`, `CMD` set to
`_aws_lambda.handle_lambda_request`), and
`.github/workflows/backend-mcp-awsecr.yml` pushes it to ECR and repoints a Lambda
function at the new image on every push to `main` that touches this directory. That
Lambda function, its ECR repository, and whatever fronts it with a URL (a Function URL
or an API Gateway route) need to exist first — this workflow only updates the image.

There is no auth in front of it, same as the rest of this directory — every tool is a
read-only `SELECT` over public portfolio data, the same data the site's unprotected
`GET /api/*` routes already serve.
