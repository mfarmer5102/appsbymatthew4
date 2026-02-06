# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a portfolio management application with a Node.js backend and React frontend. The backend is designed to run both as an Express server and as an AWS Lambda function, using a custom routing abstraction layer.

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

### Frontend Architecture

React application using:
- **React Router** for navigation between pages (Applications, Skills, Skill Types, Support Status)
- **React Hook Form** for form management in modals
- **Axios** for API communication
- **Vite** for build tooling

Layout structure: `Layout` component wraps all pages with `Header`, `SideNav`, `BottomNav`, and `Footer`

### Data Model

Four main collections:
- **Applications**: Portfolio projects with featured flags, support status, and associated skills
- **Skills**: Individual skills with proficiency levels and visibility flags
- **Skill Types**: Categories for organizing skills (e.g., "Back End Framework", "Cloud")
- **Support Status**: Status codes for applications (e.g., "ACTIVE", "EXPERIMENTAL")

Items can be soft-deleted (have `deleted_at` field) and are filtered out in API responses.

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
- `NODE_ENV`: development or production
- `PORT`: Server port (default: 2021)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:*)

For AWS deployment, secrets are retrieved from AWS Secrets Manager using the `@aws-sdk/client-secrets-manager` package.

### Frontend (.env.production)

- `VITE_API_BASE_URL`: Backend API URL (development default: http://localhost:5011/api)

## Important Patterns

### Adding a New Route

1. Create controller function in `src/controllers/[resource].js`
2. Create data layer function in `src/data/[resource].js`
3. Register route in `src/configuration/routing.js`:
   - Add to `unprotected_routes` array for public endpoints
   - Add to `protected_routes` array for admin-only endpoints (requires authorization header)

### Authorization

Write operations (POST, PUT, DELETE) are protected routes requiring an `authorization` header matching `APPSBYMATTHEW_ADMIN_CODE` secret. The middleware in `src/configuration/middleware.js` validates this before allowing access.

Frontend admin functionality is toggled via localStorage key (see `Header.jsx` for admin toggle implementation).

### Dual Runtime Support

When modifying backend code, ensure it works in both environments:
- **Express**: Uses `_express.js` as entry point
- **AWS Lambda**: Uses `_aws_lambda.mjs` as handler (exported as `handle_lambda_request`)

Both convert their respective request formats to `StandardizedRequestObject` and share the same routing configuration.

## Deployment Notes

- Backend is deployed to AWS Lambda with API Gateway (or App Runner based on production URL)
- Frontend production URL: https://www.appsbymatthew.com
- Backend production URL: https://r2ccrdqgnu.us-east-1.awsapprunner.com/api
- SAM build artifacts are in `backend/.aws-sam/build/`