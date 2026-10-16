# backend-mcp

An [MCP](https://modelcontextprotocol.io) server that exposes the portfolio database as
tools, so an MCP client that speaks Streamable HTTP (the MCP Inspector, a hosted client
such as a Claude connector) can query it directly.

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
every tool is a `SELECT`, annotated `readOnlyHint` so clients can auto-approve it.
Access control is the client's — anyone who can reach the URL can read the portfolio
data, the same data the site's unprotected `GET /api/*` routes already serve.

## Setup

Requires Node 24 (what Lambda runs it on).

```bash
cd backend-mcp
npm install
cp .env.example .env   # then fill in SUPABASE_DB_URL and OPENAI_API_KEY
npm run smoke-test     # connects in both protocol eras and calls every tool
npm run dev            # a real HTTP server at http://127.0.0.1:2022/mcp
```

Everything configurable lives in the `Configuration` class
(`src/_library/classes/configuration.js`) — the two required secrets, the optional TLS
overrides, the Postgres schema and pool sizing, the MCP endpoint's settings (argument
size limit, cache lifetime, CORS origins), the embedding model, and each tool's default
and maximum result count. `.env.example` lists every secret and override it reads.

## Protocol versions

Built on the v2 MCP TypeScript SDK (`@modelcontextprotocol/server`). Its
`createMcpHandler` serves both protocol *eras* from one URL:

- **2026-07-28** clients get the current, stateless revision: no `initialize`
  handshake, a `server/discover` advertisement, and cache hints on `tools/list`
  (one hour, public — the list changes only with a deploy).
- **2025-era** clients — still the default in most SDKs and hosts — open with
  `initialize` as before and are served statelessly from the same factory.

Neither era has server-side sessions here, which is what lets any Lambda environment
answer any request. See the SDK's
[protocol versions guide](https://ts.sdk.modelcontextprotocol.io/v2/protocol-versions)
for the full list of differences.

## Layout

Classes, wired together in one place, so a tool can be constructed against a stub rather
than reaching for a module singleton.

```
_aws_lambda.mjs              Event Function entry point: Lambda event <-> Request/Response
index.js                     HTTP server entry point: Web Function, and `npm run dev`
src/_library/classes/        the reusable pieces, none of them portfolio-specific
  environment.js             Environment    - loads .env or resolved secrets, reads/validates
  configuration.js           Configuration  - every setting, resolved once
  mcp_endpoint.js            McpEndpoint    - createMcpHandler + CORS, as fetch(Request)
  postgres.js                PostgresConfig - pool, TLS, type parsers, query()
  openai.js                  OpenAIConfig   - embeddings (no chat model here)
  repository.js              Repository     - base for the data layer
  tool.js                    Tool           - base for a tool: schema, annotations, envelope
  tool_catalog.js            ToolCatalog    - the set of tools, rejects duplicate names
  secrets.js                 SecretConfig   - Secrets Manager, used only in AWS
src/repositories/            one class per part of the star schema; owns the SQL
src/tools/                   one class per tool; owns the description and input schema
src/configuration/
  container.js               Container - the composition root; builds everything
  index.js                   get_container() - builds the running Container on first use
  secrets.js                 resolve_secrets() - which secrets to fetch, and from where
```

`McpEndpoint` is the whole MCP surface: a web-standard `fetch(Request) => Response`.
Both entry points only translate into and out of that, so neither knows anything about
MCP. Its factory builds a fresh `McpServer` per request and registers the
`ToolCatalog` onto it; the Postgres pool and OpenAI client stay `Container` singletons,
so a warm environment reuses its connections.

`Tool` subclasses take their repositories through the constructor and implement
`execute()`; the base class handles the input schema, annotations, MCP content envelope
and error reporting, so nothing above it learns what tools exist. Adding a tool is a
class under `src/tools/` and one entry in `Container#tool_catalog`.

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

## Running it locally

```bash
npm run smoke-test   # SDK client -> handle_lambda_request, in both eras; no socket
npm run dev          # index.js on http://127.0.0.1:2022/mcp (PORT to change it)
npm run inspect      # npm run dev plus the MCP Inspector's web UI, pre-connected
```

`npm run smoke-test` drives the Event Function handler with the SDK's own client: once
pinned to 2026-07-28 and once as a default 2025-era client, each listing the tools and
calling every one, then checks the CORS preflight. Its `fetch` is pointed at
`handle_lambda_request`, with each request converted to the event a Function URL sends,
so it exercises exactly what Lambda runs.

`npm run dev` runs `index.js`, the same file a Web Function runs. Locally it binds
loopback and rejects requests whose `Host` or `Origin` is not localhost, which stops a
web page from reaching it through DNS rebinding. Move it with `PORT`, never by setting
`AWS_LAMBDA_HTTP_ENDPOINT` — that variable is how the code recognizes a Web Function,
and it would then go to Secrets Manager for its credentials.

## Deploying

Either Lambda model works; the code is the same.

### Secrets, in either model

Lambda has no `.env`. `src/configuration/secrets.js` resolves `SUPABASE_DB_URL` and
`OPENAI_API_KEY` from Secrets Manager's `prd-secrets` secret, so the function's
execution role needs `secretsmanager:GetSecretValue` on it. That happens on the first
request, not at import: a Web Function must be listening within 10 seconds of starting,
so `index.js` listens first and builds the `Container` behind it. AWS is detected by
`AWS_EXECUTION_ENV` (Event Functions) or `AWS_LAMBDA_HTTP_ENDPOINT` (Web Functions,
which do not reliably set the former).

The bundled Supabase CA under `certs/` must ship in either package.

### As an Event Function (what CI deploys)

`dockerfiles/DockerfileLambda` builds a container image on
`public.ecr.aws/lambda/nodejs:24` with `CMD` set to
`_aws_lambda.handle_lambda_request`, and `.github/workflows/backend-mcp-awsecr.yml`
pushes it to ECR and repoints the `appsByMatthew4_mcpServer` function at it on every
push to `main` that touches this directory. The function, its ECR repository, and its
Function URL (or API Gateway route) must already exist — the workflow only updates the
image. `DockerfileLambda.dockerignore` keeps a local `.env` out of the image.

Settings worth making on the function, since none of them live in code:

- **Timeout: 30 seconds.** Lambda's default is 3. A cold start fetches secrets, opens a
  TLS connection, and the semantic tool also calls OpenAI before its query.
- **Reserved concurrency: a small cap, such as 5.** There is no auth, and every
  semantic search spends OpenAI credit; the cap bounds what a flood of requests can
  cost.

An Event Function's response is buffered, so nothing here streams — and nothing needs
to, since no tool reports progress before its result.

### As a Web Function

[Lambda Web Functions](https://docs.aws.amazon.com/lambda/latest/dg/web-functions-runtimes.html)
run `index.js` as an ordinary HTTP server: no event translation, and one environment
serves many requests at once, billed for active CPU rather than wall-clock time.
`Configuration` raises the Postgres pool to 10 when it detects one.

Code is deployed as a zip from a versioned S3 bucket, and must include everything the
server reads at runtime:

```bash
npm ci --omit=dev
zip -r function.zip index.js package.json package-lock.json src certs node_modules
aws s3 cp function.zip s3://YOUR_BUCKET/backend-mcp/function.zip
```

Then create a revision pointing at it (the Web Function and its endpoint are created
once beforehand — see AWS's "Creating a Web Function" guide):

```bash
aws lambda-web create-web-function-revision \
    --function-name appsByMatthew4_mcpWeb \
    --build-config '{"codeConfig": {"s3Object": {"bucket": "YOUR_BUCKET", "key": "backend-mcp/function.zip"}}, "runtimeConfig": {"runtime": "nodejs24.x"}}' \
    --service-config '{"executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/YOUR_ROLE", "timeoutSeconds": 30, "maxConcurrencyPerEnvironment": 10}'
```

`maxConcurrencyPerEnvironment` defaults to 64; 10 matches the pool, so requests do not
queue behind its connections. Revisions are immutable, so every setting goes in every
revision. At launch Web Functions run only `nodejs24.x` on Arm64, in a handful of
Regions that include us-east-1. There is no CI workflow for this path yet.
