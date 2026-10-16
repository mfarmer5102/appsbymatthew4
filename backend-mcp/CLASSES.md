# backend-mcp: Classes & Methods

Every class in this directory and its public methods, one line each. See
[README.md](README.md) for how the pieces fit together.

## Entry points (no classes)

- **_aws_lambda.mjs** — Event Function entry point (the container image's `CMD`); knows nothing about MCP.
  - `handle_lambda_request(event, context)` — converts the event to a `Request`, passes it to `McpEndpoint.fetch()`, converts the `Response` back; 500 if the Container cannot be built.
  - `to_web_request(event)` — converts an API Gateway REST (v1) or Function URL / HTTP API (v2) event into a web-standard `Request`.
- **index.js** — HTTP server entry point: a Web Function's entry file in AWS, and `npm run dev` locally. Adapts `McpEndpoint.fetch()` to Node's `http` server with `toNodeHandler`; binds `AWS_LAMBDA_HTTP_ENDPOINT` in a Web Function, or loopback behind localhost Host/Origin guards locally. Warms the Container after listening and closes it on `SIGTERM`.
- **scripts/smoke_test.js** — dev-only; drives `handle_lambda_request` with the SDK's client in both protocol eras and checks the CORS preflight. Run via `npm run smoke-test`.
- **scripts/inspect.js** — dev-only; spawns `index.js` and the MCP Inspector web UI together, pre-connected. Run via `npm run inspect`.

## `src/_library/classes/` — reusable, portfolio-agnostic

### `Environment` (environment.js)
Loads `.env` (or takes resolved secrets) and reads values off it.
- `constructor(dotenv_path, secrets)` — loads dotenv; stores a resolved `SecretConfig` if given.
- `require(name)` — returns a var or throws if missing.
- `optional(name)` — returns a var (secrets first, then `process.env`) or `undefined`.
- `flag(name)` — reads a var as a boolean (`=== 'true'`).

### `Configuration` (configuration.js)
Every setting, resolved once from `Environment`.
- `constructor(environment)` — builds `server`, `mcp`, `database`, `openai`, and `limits` config blocks, and `is_web_function` (which sizes the pool).
- `limits_for(tool_name)` — returns `{default, max}` for a tool, throws if unconfigured.

### `PostgresConfig` (postgres.js)
Read-only Postgres pool wrapper.
- `static {}` — registers process-global type parsers (DATE as string, int8 as Number).
- `constructor({connection_string, schema, pool, ssl})` — opens the pg `Pool`.
- `#build_ssl_options()` *(private)* — resolves CA cert / no-verify / bundled cert fallback.
- `query(text, params)` — runs a query, returns rows.
- `close()` — ends the pool.

### `OpenAIConfig` (openai.js)
Embeddings only — no chat model in this service.
- `constructor({api_key, embedding_model, embedding_input_max_chars})` — builds the OpenAI client.
- `generate_embedding(text)` — truncates input, returns an embedding vector.

### `Repository` (repository.js)
Base class for the data layer.
- `constructor(database)` — stores the `PostgresConfig`, throws if missing.
- `get schema()` — the configured Postgres schema name.
- `query(text, params)` — delegates to `database.query()`.

### `Tool` (tool.js)
Base class for an MCP tool: schema, envelope, registration.
- `constructor({limits})` — stores row-count limits.
- `get name()` / `get title()` / `get description()` *(abstract)* — subclass must define.
- `get input_schema()` — zod shape; empty object by default. `register()` wraps it in `z.object()`.
- `get annotations()` — client behavior hints; read-only by default.
- `execute(args)` *(abstract)* — subclass's actual logic.
- `limit_input()` — builds the shared zod `limit` field, capped at `this.limits.max`.
- `resolve_limit(limit)` — falls back to `this.limits.default` when omitted.
- `call(args)` — runs `execute()`, wraps the result (or error) in the MCP content envelope.
- `register(server)` — registers this tool, with its title, description, schema and annotations, on an `McpServer` instance.

### `ToolCatalog` (tool_catalog.js)
The set of tools; rejects duplicate names.
- `constructor(tools)` — adds each tool via `add()`.
- `add(tool)` — validates it's a `Tool`, throws on duplicate name.
- `get(name)` — looks up a tool by name.
- `get size()` — number of registered tools.
- `register_all(server)` — calls `register()` on every tool.
- `[Symbol.iterator]()` — iterates the tools.

### `McpEndpoint` (mcp_endpoint.js)
The whole MCP surface, as a web-standard handler both entry points wrap.
- `constructor({info, catalog, max_tool_input_elements, cache_ttl_ms, allowed_origin})` — builds the `createMcpHandler` handler, which serves both protocol eras.
- `#build_server()` *(private)* — the per-request factory: a fresh `McpServer` with the catalog registered.
- `fetch(request, options)` — answers CORS preflights, otherwise delegates to the handler and adds CORS headers.
- `#cors_headers(request)` *(private)* — reflects the site's origins (else `*`) and the requested headers.
- `close()` — aborts in-flight exchanges.

### `SecretConfig` (secrets.js)
Loads secrets from AWS Secrets Manager in AWS; a no-op locally.
- `constructor(aws_region_name, list_of_secrets)` — records region and which keys/secret bundles to fetch; detects AWS by `AWS_EXECUTION_ENV` or `AWS_LAMBDA_HTTP_ENDPOINT`.
- `apply_list_of_secrets()` — populates `this[key]` for each configured secret (in AWS only).

## `src/repositories/` — one per part of the star schema

### `ApplicationRepository extends Repository` (application_repository.js)
Backs both application search tools.
- `get projection()` — shared `SELECT` column list.
- `get joins()` — shared lateral joins for skills/repository URLs.
- `search({search_text, limit})` — keyword `ILIKE` search, or most-recent if `search_text` is null.
- `search_by_embedding({embedding, model_version, limit})` — pgvector cosine-similarity search.

### `LookupRepository extends Repository` (lookup_repository.js)
- `skill_types()` — distinct, non-deleted skill types.
- `support_statuses()` — distinct, non-deleted support statuses.

### `SkillRepository extends Repository` (skill_repository.js)
- `list({skill_type, proficient_only, limit})` — filterable, non-hidden skill list.

## `src/tools/` — one per MCP tool

### `SearchApplicationsTool extends Tool` (search_applications_tool.js)
- `constructor({applications, limits})`
- `execute({query, limit})` — delegates to `ApplicationRepository.search()`.

### `SearchApplicationsSemanticTool extends Tool` (search_applications_semantic_tool.js)
- `constructor({applications, openai, limits})`
- `execute({query, limit})` — embeds the query, then delegates to `ApplicationRepository.search_by_embedding()`.

### `GetSkillsTool extends Tool` (get_skills_tool.js)
- `constructor({skills, limits})`
- `execute({skill_type, proficient_only, limit})` — delegates to `SkillRepository.list()`.

### `ListLookupsTool extends Tool` (list_lookups_tool.js)
- `constructor({lookups})`
- `execute()` — fetches skill types and support statuses in parallel.

## `src/configuration/` — composition root

### `Container` (container.js)
Builds and wires everything; the only place with singleton state.
- `constructor({dotenv_path, environment, secrets})` — builds `Environment` then `Configuration`.
- `#singleton(key, build)` *(private)* — lazy memoized instance cache.
- `get database()` — the `PostgresConfig` singleton.
- `get openai()` — the `OpenAIConfig` singleton.
- `get applications()` / `get skills()` / `get lookups()` — repository singletons.
- `get mcp_endpoint()` — the `McpEndpoint` singleton both entry points serve.
- `close()` — closes the endpoint and pool, if they were built.
- `get tool_catalog()` — builds and returns the `ToolCatalog` with all four tools wired in.

`index.js` exports `get_container()`, which resolves secrets (`secrets.js`'s
`resolve_secrets()`) and builds the running `Container` on first use, sharing one build
across concurrent first requests and retrying after a failure; and `close_container()`
for shutdown. Tests construct their own `Container`.
