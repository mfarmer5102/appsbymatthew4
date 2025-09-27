# Portfolio Backend API

A Node.js REST API for managing portfolio data with MongoDB integration.

## Features

- **CRUD Operations** for all data models:
  - Applications (portfolio projects)
  - Skill Types (skill categories)
  - Skills (individual skills with proficiency levels)
  - Support Status (project status codes)

- **Advanced Features**:
  - Pagination support
  - Query filtering
  - Input validation
  - Error handling
  - Rate limiting
  - CORS support
  - Security headers

## Data Models

### Applications
- Portfolio projects with descriptions, links, and metadata
- Support for soft deletion
- Featured application flagging
- Skill associations

### Skill Types
- Categories for organizing skills (e.g., "Back End Framework", "Cloud")

### Skills
- Individual skills with proficiency levels
- Visibility controls for app details
- Type associations

### Support Status
- Status codes for applications (e.g., "ACTIVE", "EXPERIMENTAL")

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env
```

3. Configure your MongoDB connection in `.env`:
```
MONGO_INSTANCE_URL=mongodb://localhost:27017/portfolio
```

4. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Applications
- `GET /api/applications` - Get all applications (with filtering)
- `GET /api/applications/:id` - Get application by ID
- `POST /api/applications` - Create new application
- `PUT /api/applications/:id` - Update application
- `PATCH /api/applications/:id` - Partial update application
- `DELETE /api/applications/:id` - Soft delete application
- `DELETE /api/applications/:id/hard` - Hard delete application

### Skill Types
- `GET /api/skill-types` - Get all skill types
- `GET /api/skill-types/:id` - Get skill type by ID
- `GET /api/skill-types/code/:code` - Get skill type by code
- `POST /api/skill-types` - Create new skill type
- `PUT /api/skill-types/:id` - Update skill type
- `PATCH /api/skill-types/:id` - Partial update skill type
- `DELETE /api/skill-types/:id` - Delete skill type

### Skills
- `GET /api/skills` - Get all skills (with filtering)
- `GET /api/skills/:id` - Get skill by ID
- `GET /api/skills/code/:code` - Get skill by code
- `GET /api/skills/type/:skillTypeCode` - Get skills by type
- `POST /api/skills` - Create new skill
- `PUT /api/skills/:id` - Update skill
- `PATCH /api/skills/:id` - Partial update skill
- `DELETE /api/skills/:id` - Delete skill

### Support Status
- `GET /api/support-status` - Get all support statuses
- `GET /api/support-status/:id` - Get support status by ID
- `GET /api/support-status/code/:code` - Get support status by code
- `POST /api/support-status` - Create new support status
- `PUT /api/support-status/:id` - Update support status
- `PATCH /api/support-status/:id` - Partial update support status
- `DELETE /api/support-status/:id` - Delete support status

## Query Parameters

### Pagination
- `limit` - Number of items per page (default: 50)
- `offset` - Number of items to skip (default: 0)

### Applications Filtering
- `featured` - Filter by featured status (true/false)
- `support_status` - Filter by support status code

### Skills Filtering
- `proficient` - Filter by proficiency (true/false)
- `skill_type` - Filter by skill type code
- `visible` - Filter by visibility in app details (true/false)

## Example Usage

### Get featured applications
```
GET /api/applications?featured=true&limit=10
```

### Get proficient skills
```
GET /api/skills?proficient=true&skill_type=BACKENDFRAMEWORK
```

### Create a new application
```json
POST /api/applications
{
  "title": "My New App",
  "publish_date": "2024-01-01T00:00:00.000Z",
  "is_featured": true,
  "description": "A great application",
  "support_status_code": "ACTIVE",
  "associated_skill_codes": ["REACT", "NODEJS"]
}
```

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `MONGO_INSTANCE_URL` - MongoDB connection string
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)

## Health Check

- `GET /health` - Server health status

## API Documentation

- `GET /api` - API documentation and endpoint overview
