# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a portfolio management application with a Node.js backend and React frontend. The backend is designed to run both as an Express server and as an AWS Lambda function, using a custom routing abstraction layer. It includes an AI-powered chat feature backed by OpenAI and MongoDB vector search.

## Architecture

### Backend Architecture

The backend uses a **custom routing framework** that abstracts away the web server implementation, allowing the same code to run on Express.js or AWS Lambda:

1. **Request Standardization**: Both `_express.js` and `_aws_lambda.mjs` convert platform-specific requests into `StandardizedRequestObject` instances
2. **Unified Routing**: All routes are defined once in `src/configuration/routing.js` using `Route` and `RoutingConfig` classes
3. **Middleware System**: Custom middleware runs in `src/configuration/middleware.js` (not Express middleware)
4. **Data Layer**: Controllers (`src/controllers/`) delegate to data functions (`src/data/`) which interact with MongoDB

**Key classes** (in `src/_library/classes/`):
- `StandardizedRequestObject` / `StandardizedResponseObject`: Platform-agnostic request/response wrappers
- `RoutingConfig` / `Route`: Custom routing system with protected/unprotected route separation
- `MiddlewareConfig`: Custom middleware that runs before route handlers
- `MongoConfig` / `MongoColl`: MongoDB connection and collection wrappers
- `OpenAIConfig`: Wrapper for OpenAI API (embeddings + chat completions)
- `VectorSearchHelper`: Helper for MongoDB vector search over application embeddings
- `SecretConfig`: Loads secrets from environment or AWS Secrets Manager

### Frontend Architecture

React application using:
- **React Router** for navigation between pages (Home, Applications, Skills, Skill Types, Support Status)
- **React Hook Form** for form management in modals
- **Axios** for API communication with automatic Authorization header injection
- **Vite** for build tooling

Layout structure: `Layout` component (provides `AdminContext` and dark mode state) wraps all pages with `Header`, `SideNav`, `BottomNav`, and `Footer`.

**Dark mode** is persisted in localStorage and applied via `data-theme="dark|light"` on the document root. Toggle is in `Header.jsx`.

**Chat panel** (`ChatPanel.jsx`) is triggered by clicking the sprite decoration. It sends messages to `/api/chat` and maintains a `session_id` across messages. Chat history is stored in MongoDB.

### Data Model

Five MongoDB collections:

- **Applications**: Portfolio projects with featured flags, support status, associated skills, and a 1536-dim `embedding` vector field for semantic search
- **Skills**: Individual skills with proficiency levels and visibility flags
- **Skill Types**: Categories for organizing skills (e.g., "Back End Framework", "Cloud")
- **Support Status**: Status codes for applications (e.g., "ACTIVE", "EXPERIMENTAL")
- **Chat History**: Persisted chat messages with `session_id`, `role`, `content`, and optional `metadata` (sources used)

Items in the first four collections can be soft-deleted (have a `deleted_at` field) and are filtered out in API responses.

### API Routes

**Unprotected (public):**
```
GET  /api/applications
GET  /api/skill-types
GET  /api/skills
GET  /api/support-status
POST /api/chat
GET  /api/chat/history
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
- `MONGO_INSTANCE_URL`: MongoDB connection string
- `APPSBYMATTHEW_ADMIN_CODE`: Secret used to authorize protected routes
- `OPENAI_API_KEY`: OpenAI API key (used for chat completions and embeddings)
- `NODE_ENV`: development or production
- `PORT`: Server port (default: 2021)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:*)

For AWS deployment, secrets are retrieved from AWS Secrets Manager (`prd-secrets` secret) using `@aws-sdk/client-secrets-manager`. The presence of `AWS_EXECUTION_ENV` signals the Lambda runtime.

### Frontend

- `VITE_API_BASE_URL`: Backend API URL
  - Dev default: `http://localhost:2021/api`
  - Prod (`.env.production`): `https://www.appsbymatthew.com/api`

## Important Patterns

### Adding a New Route

1. Create controller function in `src/controllers/[resource].js`
2. Create data layer function in `src/data/[resource].js`
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

Applications have a 1536-dim `embedding` field generated via OpenAI's `text-embedding-ada-002` model. The `/api/chat` endpoint:
1. Embeds the user message
2. Runs a MongoDB vector search over `applications` to find relevant projects
3. Passes those projects as context to a GPT chat completion
4. Persists the exchange to the `chat_history` collection

To backfill embeddings for existing applications, run `npm run vectorize-existing-apps` from the `backend/` directory.

## Deployment Notes

- **Frontend**: Deployed to AWS S3 via GitHub Actions; served at `https://www.appsbymatthew.com`
- **Backend**: Deployed to AWS App Runner at `https://r2ccrdqgnu.us-east-1.awsapprunner.com/api`; also packaged as an AWS Lambda function
- SAM build artifacts are in `backend/.aws-sam/build/`
