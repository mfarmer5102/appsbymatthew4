# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a portfolio management application with a Node.js backend and React frontend. The backend is designed to run both as an Express server and as an AWS Lambda function, using a custom routing abstraction layer. It includes an AI-powered chat feature backed by OpenAI and pgvector similarity search over Supabase (PostgreSQL).

## Architecture

### Backend Architecture

The backend uses a **custom routing framework** that abstracts away the web server implementation, allowing the same code to run on Express.js or AWS Lambda:

1. **Request Standardization**: Both `_express.js` and `_aws_lambda.mjs` convert platform-specific requests into `StandardizedRequestObject` instances
2. **Unified Routing**: All routes are defined once in `src/configuration/routing.js` using `Route` and `RoutingConfig` classes
3. **Middleware System**: Custom middleware runs in `src/configuration/middleware.js` (not Express middleware)
4. **Data Layer**: Controllers (`src/controllers/`) delegate to data functions (`src/data/`) which issue SQL against Supabase via the shared `pg` pool

**Key classes** (in `src/_library/classes/`):
- `StandardizedRequestObject` / `StandardizedResponseObject`: Platform-agnostic request/response wrappers
- `RoutingConfig` / `Route`: Custom routing system with protected/unprotected route separation
- `MiddlewareConfig`: Custom middleware that runs before route handlers
- `PostgresConfig`: `pg` connection pool wrapper exposing `query()` and `transaction()`
- `OpenAIConfig`: Wrapper for OpenAI API (embeddings + chat completions)
- `VectorSearchHelper`: Helper for pgvector similarity search over application embeddings
- `SecretConfig`: Loads secrets from environment or AWS Secrets Manager

### Frontend Architecture

React application using:
- **React Router** for navigation between pages (Home, Applications, Skills, Skill Types, Support Status)
- **React Hook Form** for form management in modals
- **Axios** for API communication with automatic Authorization header injection
- **Vite** for build tooling

Layout structure: `Layout` component (provides `AdminContext` and dark mode state) wraps all pages with `Header`, `SideNav`, `BottomNav`, and `Footer`.

**Dark mode** is persisted in localStorage and applied via `data-theme="dark|light"` on the document root. Toggle is in `Header.jsx`.

**Chat panel** (`ChatPanel.jsx`) is triggered by clicking the sprite decoration. It sends messages to `/api/chat` and holds a `session_id` in React state. Nothing is persisted server-side, and the panel does not reload history.

### Data Model

A star schema in the `apps_by_matthew` Postgres schema. Every table is addressed by an
integer surrogate key (`application_key`, `skill_key`, …) — there are no `code` columns;
that concept came from the MongoDB era and was dropped in the Supabase migration.

Dimensions:
- **dim_application**: Portfolio projects. `title` is UNIQUE. FK to `dim_support_status`.
- **dim_skill**: Individual skills. FK to `dim_skill_type`. Flags: `is_proficient`,
  `is_visible_in_app_details`, `is_hidden`, `provide_disclaimer`.
- **dim_skill_type**: Categories for organizing skills (e.g., "Back End Framework")
- **dim_support_status**: Status of an application (e.g., "Active", "Experimental")

Bridges (these replace what were array fields on the Mongo documents):
- **bridge_application_skill**: application ↔ skill. No ordinal column.
- **bridge_application_repository**: application ↔ repository URL. No ordinal column, so
  repository order is not preserved; queries sort by URL for stable output.

Embeddings:
- **dim_application_embedding**: keyed `(application_key, model_version)` with a
  `vector(1536)` column. Reads and writes must filter on `EMBEDDING_MODEL_VERSION` from
  `src/configuration/database.js`, or a second model's vectors would duplicate results.

All four dimensions soft-delete via `deleted_at` and are filtered out of API responses.
Deletes are always soft, which is what keeps the foreign keys satisfied.

There is no chat history table — chat is stateless.

### API Routes

**Unprotected (public):**
```
GET  /api/applications
GET  /api/skill-types
GET  /api/skills
GET  /api/support-status
POST /api/chat
```

**Protected (require `authorization` header):**
```
POST/PUT/DELETE  /api/applications
POST             /api/applications/vectorize
POST/PUT/DELETE  /api/skill-types
POST/PUT/DELETE  /api/skills
POST/PUT/DELETE  /api/support-status
```

## Development Commands

### Backend

```bash
cd backend

# Install dependencies
npm install

# Development (with auto-reload)
npm run dev

# Production
npm start

# Test Lambda handler locally
npm run lambda_test

# Run tests
npm test

# Backfill vector embeddings for existing applications
npm run vectorize-existing-apps
```

**Backend runs on port 2021** by default (configurable via `PORT` env var)

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Development server (port 2020)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Environment Configuration

### Backend (.env)

Required variables:
- `SUPABASE_DB_URL`: Supabase PostgreSQL connection string. Use the **transaction
  pooler** (port 6543) — it suits both App Runner and Lambda.
- `APPSBYMATTHEW_ADMIN_CODE`: Secret used to authorize protected routes
- `OPENAI_API_KEY`: OpenAI API key (used for chat completions and embeddings)
- `NODE_ENV`: development or production
- `PORT`: Server port (default: 2021)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:*)
- `PGSSL_ROOT_CERT`: Optional. Path to a CA file for the database connection. Overrides
  the CA bundled at `backend/certs/supabase-prod-ca-2021.crt`.
- `PGSSL_NO_VERIFY`: Optional. Set to `true` to encrypt without verifying the server
  certificate. Not needed for Supabase — see the TLS note below.

Supabase's pooler presents a chain rooted in Supabase's own **Supabase Root 2021 CA**,
which is not in Node's trust store. Verifying against the system trust store therefore
fails with `SELF_SIGNED_CERT_IN_CHAIN`. That CA is committed at
`backend/certs/supabase-prod-ca-2021.crt` and trusted by default in
`src/_library/classes/postgres.js`. It must stay in the deployment package — nothing
about TLS is configurable per environment, because Lambda and App Runner have no `.env`
and their secrets arrive via Secrets Manager rather than `process.env`.

For AWS deployment, secrets are retrieved from AWS Secrets Manager (`prd-secrets` secret) using `@aws-sdk/client-secrets-manager`. The presence of `AWS_EXECUTION_ENV` signals the Lambda runtime. Note that only the keys listed in `src/configuration/secrets.js` are read from there; anything read straight off `process.env` (such as the `PGSSL_*` variables) is simply unset in AWS.

### Frontend

- `VITE_API_BASE_URL`: Backend API URL
  - Dev default: `http://localhost:2021/api`
  - Prod (`.env.production`): `https://www.appsbymatthew.com/api`

## Important Patterns

### Adding a New Route

1. Create controller function in `src/controllers/[resource].js`
2. Create data layer function in `src/data/[resource].js`. Query via `db.query()` from
   `src/configuration/database.js`; use `db.transaction()` whenever a write touches a
   dimension and its bridge tables together. Optional filters use the
   `($1::type IS NULL OR col = $1)` pattern so one clause can drive both the page query
   and the count query. `ORDER BY` can't be parameterized — whitelist sort fields with
   `parse_sort` from `src/_library/functions/query_params.js`.
3. Register route in `src/configuration/routing.js`:
   - Add to `unprotected_routes` array for public endpoints
   - Add to `protected_routes` array for admin-only endpoints (requires authorization header)

### Authorization

Write operations (POST, PUT, DELETE) are protected routes requiring an `authorization` header matching the `APPSBYMATTHEW_ADMIN_CODE` secret. The middleware in `src/configuration/middleware.js` validates this before allowing access.

Frontend admin functionality is toggled via a localStorage key (see `Header.jsx`). The Axios instance in `src/config/api.js` automatically injects the stored key as the `Authorization` header on every request when present.

### Dual Runtime Support

When modifying backend code, ensure it works in both environments:
- **Express**: Uses `_express.js` as entry point
- **AWS Lambda**: Uses `_aws_lambda.mjs` as handler (exported as `handle_lambda_request`)

Both convert their respective request formats to `StandardizedRequestObject` and share the same routing configuration.

### Vector Search / AI Chat

Applications are embedded with OpenAI's `text-embedding-3-small` model (1536 dims) into
`dim_application_embedding`. The `/api/chat` endpoint:
1. Embeds the user message
2. Runs a pgvector cosine search (`<=>`) over `dim_application_embedding`, joining the
   dimension and bridge tables so the model sees skill and status *names*
3. Passes those projects as context to a chat completion

Chat is **stateless** — nothing is persisted, so the model has no memory of earlier turns
in a session. `session_id` is still echoed back to the client, but it looks nothing up.

Embedding generation always happens *outside* the write transaction, so a slow OpenAI
call never holds a pooler connection open. A failure there is non-fatal: the application
saves without an embedding and simply won't appear in chat until re-vectorized.

To backfill embeddings, run `npm run vectorize-existing-apps` from `backend/`.
To sanity-check the database (connectivity, pgvector, identity sequences, embedding
coverage), run `npm run check-db`.

## Deployment Notes

- **Frontend**: Deployed to AWS S3 via GitHub Actions; served at `https://www.appsbymatthew.com`
- **Backend**: Deployed to AWS App Runner at `https://r2ccrdqgnu.us-east-1.awsapprunner.com/api`; also packaged as an AWS Lambda function
- SAM build artifacts are in `backend/.aws-sam/build/`
