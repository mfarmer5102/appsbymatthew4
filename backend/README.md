# Portfolio backend

One Express app, deployed as an AWS Lambda Web Function, serving two kinds of client
from the same Supabase (PostgreSQL) data layer:

- **The site** — a REST API under `/api`: public reads, admin writes, and the AI chat.
- **AI clients** — an [MCP](https://modelcontextprotocol.io) endpoint at `/api/mcp`:
  four read-only tools that let a model (Claude, the MCP Inspector) query the portfolio
  directly and write its own answer.

Both share one process, one database pool, one OpenAI client, and one deploy.

## Setup

Requires Node 24, the version Lambda runs it on.

```bash
cd backend
npm install
cp .env.example .env   # then fill in the three secrets
npm run dev            # http://localhost:2021/api, restarting on file changes
npm test               # integration tests against the real database; writes nothing
```

The frontend's dev server (`frontend/`, port 2020) already points at
`http://localhost:2021/api`.

## Layout

```
index.js                    entry point: listens, then loads app.js (Web Function and local)
app.js                      the Express app: middleware, /api/mcp, /api routes, errors
src/configuration/          wiring - one instance of each thing, built at import
  routing.js                every /api route, and which ones need the admin code
  middleware.js             admin-code check, client metadata, rate limits
  mcp.js                    the MCP endpoint and its tool catalog
  http.js                   CORS policy
  secrets.js                Secrets Manager in AWS, .env locally
  database.js               the Postgres pool, schema name, embedding model version
  openai.js, vector_search.js, errors.js
src/controllers/            Express handlers: read req, call src/data, send JSON
src/data/                   all SQL; each function takes {query} or {body}, not a request
src/mcp/                    MCP tools, built on src/data, plus their row projection
src/_library/               reusable classes and helpers (Postgres, OpenAI, McpEndpoint, Tool)
scripts/                    check-db and vectorize-existing-apps
test/                       node:test integration tests
```

`src/data` knows nothing about HTTP: a function takes `{query}` (read filters) or
`{body}` (write payload) and returns plain data. The REST controllers and the MCP tools
are both thin callers of it, which is why the two surfaces can never drift apart.

## REST API

Responses are JSON. Errors are a JSON string with the message, e.g. `"Not found."`.

### Public reads

All return `{data: [...], pagination: {total, limit, offset, hasMore}}`, and accept
`limit` (default 50, max 200) and `offset`.

| Route | Filters |
| --- | --- |
| `GET /api/applications` | `title` (exact), `search` (substring of title or description), `featured`, `support_status_key` |
| `GET /api/skills` | `skill`, `skill_type_key`, `skill_type` (name), `proficient`, `visible`, `include_hidden`, `sort` (`skill`, `skill_type`, `is_proficient`, `created_at`, `updated_at`), `order` (`asc`/`desc`) |
| `GET /api/skill-types` | `skill_type` |
| `GET /api/support-status` | `support_status` |

Hidden skills are left out unless `include_hidden=true`.

### Chat

`POST /api/chat` with `{message, session_id?}` embeds the message, finds related
projects by vector search, and answers with a chat completion. It returns
`{message, session_id, sources}`. Every turn is logged to `fact_chat_message`, but the
model never sees earlier turns.

### Admin writes

Each requires the `APPSBYMATTHEW_ADMIN_CODE` value in the `Authorization` header.

| Route | Body |
| --- | --- |
| `POST /api/applications` | `title`, `publish_date`, `support_status_key` (required); `description`, `image_filename`, `deployed_url`, `is_featured`, `skill_keys`, `repository_urls` |
| `PUT /api/applications` | the same, plus `application_key` |
| `DELETE /api/applications` | `application_key` |
| `POST /api/applications/vectorize` | none — re-embeds every application |
| `POST` / `PUT` / `DELETE /api/skills` | `skill`, `skill_type_key` (required); `is_proficient`, `is_visible_in_app_details`, `is_hidden`, `provide_disclaimer`; `skill_key` to update or delete |
| `POST` / `PUT` / `DELETE /api/skill-types` | `skill_type`; `skill_type_key` to update or delete |
| `POST` / `PUT` / `DELETE /api/support-status` | `support_status`; `support_status_key` to update or delete |

Deletes are soft. Writing an application embeds it for chat and MCP semantic search;
if that OpenAI call fails, the application still saves and just won't appear in those
searches until `POST /api/applications/vectorize` (or `npm run vectorize-existing-apps`).

## MCP endpoint

`/api/mcp` speaks MCP's Streamable HTTP transport, built on the v2 TypeScript SDK's
`createMcpHandler`. It serves both protocol eras from the one URL: the stateless
2026-07-28 revision, and the 2025 revisions most clients still default to. Neither has
server-side sessions, so any environment can answer any request.

| Tool | Purpose |
| --- | --- |
| `search_applications` | Keyword search over project titles and descriptions; omit the query for the newest. |
| `search_applications_semantic` | Conceptual search over the same pgvector embeddings the chat uses. |
| `get_skills` | Skills, filterable by skill type name or to proficient ones. |
| `list_lookups` | Every skill type and support status — how a caller learns the valid filters. |

Every tool is annotated read-only, so clients can approve it without asking. Results are
projected for a model — names, not surrogate keys. There is no auth: the tools read the
same public data the `GET` routes serve.

To try it, run `npm run dev` in one terminal and `npm run inspect` in another; the MCP
Inspector opens pre-connected to `http://localhost:2021/api/mcp`. To add it to Claude,
add a custom connector pointing at the deployed endpoint's `/api/mcp` URL.

## Security

- **Admin code** — compared in constant time; the header name is case-insensitive.
- **Rate limits** — per client IP, per minute: 300 across `/api`, 10 for chat, 60 for
  MCP. Counts are kept in memory per execution environment, and the IP comes from
  `x-forwarded-for`, which a client can spoof, so these slow a flood rather than stop a
  determined attacker. Cap the endpoint's `maxEnvironments` to bound worst-case cost.
- **CORS** — the site's own origins (`appsbymatthew.com`, `www.`), plus any localhost
  port locally and `FRONTEND_URL` if set. `/api/mcp` applies its own, more permissive
  policy, since MCP clients are rarely browsers.
- **DNS rebinding** — locally, `/api/mcp` rejects any `Host` or `Origin` that is not
  localhost.
- **Errors** — unexpected failures return a generic `"Internal server error."`; the
  details go to the log only.
- **Headers** — `helmet` sets the standard security headers.

## Environment

See `.env.example`. Locally, `index.js` loads `backend/.env` before anything reads it.
In AWS there is no `.env`: `SUPABASE_DB_URL`, `OPENAI_API_KEY` and
`APPSBYMATTHEW_ADMIN_CODE` come from Secrets Manager's `prd-secrets` secret.

Supabase's pooler presents a chain rooted in its own CA, which is not in Node's trust
store. That CA ships in `certs/` and is trusted by default; it must be in every deploy
package.

## Deploying

`.github/workflows/backend-lambda-web.yml` deploys on every push to `main` that touches
`backend/`: it zips the server with its production dependencies, uploads the zip to S3,
creates a new Web Function revision from it, and waits for that revision to go Active.

### How it runs on Lambda

A [Lambda Web Function](https://docs.aws.amazon.com/lambda/latest/dg/web-functions-runtimes.html)
runs `index.js` as an ordinary HTTP server on `nodejs24.x` (Arm64). One environment
serves many requests at once — up to the revision's `maxConcurrencyPerEnvironment`,
set to 10 to match the Postgres pool — and is billed for active CPU rather than
wall-clock time.

`index.js` starts listening before it loads `app.js`, because a Web Function must be
listening within 10 seconds of starting and loading the app means a Secrets Manager
call. Requests that arrive in that window wait for it. If loading fails, the process
exits and Lambda replaces the environment.

### One-time setup

Before the first deploy, create:

1. **A versioned S3 bucket** for deployment packages.
2. **An execution role** with `secretsmanager:GetSecretValue` on `prd-secrets`.
3. **The Web Function** named `appsByMatthew4_api` (the workflow's `FUNCTION_NAME`), and
   **an endpoint** in `LatestRevision` auto-deployment mode. Its auth type is
   `ApplicationManaged` if clients call it directly (the app does its own auth), or
   `IamAuth` if only a CloudFront distribution with origin access control may reach it.
   Set the endpoint's `maxEnvironments` to a small number. See AWS's "Creating a Web
   Function" guide.
4. **Repository variables** `BACKEND_DEPLOY_BUCKET` and `BACKEND_EXECUTION_ROLE_ARN`.
   The existing `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` secrets are reused; their
   IAM user needs `s3:PutObject` on the bucket and permission to create and read Web
   Function revisions.

The site calls `https://www.appsbymatthew.com/api` (`frontend/.env.production`), so
whatever serves that domain — a CloudFront distribution, for instance — needs an `/api/*`
behavior pointing at the endpoint.
