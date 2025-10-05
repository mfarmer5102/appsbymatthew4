# Portfolio Backend - C# Version

This is a C# ASP.NET Core Web API version of the portfolio backend, providing the same functionality as the Node.js version.

## Features

- **Applications Management**: CRUD operations for portfolio applications
- **Skills Management**: CRUD operations for technical skills
- **Skill Types Management**: CRUD operations for skill categories
- **Support Status Management**: CRUD operations for application support statuses
- **Traffic Analytics**: Website traffic tracking and analytics
- **MongoDB Integration**: Uses MongoDB for data persistence
- **Rate Limiting**: Built-in rate limiting for API protection
- **CORS Support**: Configured for frontend integration
- **Swagger Documentation**: API documentation available in development mode

## Prerequisites

- .NET 8.0 SDK
- MongoDB (local or cloud instance)

## Getting Started

1. **Clone and navigate to the project**:
   ```bash
   cd backend_csharp
   ```

2. **Install dependencies**:
   ```bash
   dotnet restore
   ```

3. **Configure MongoDB connection**:
   Update `appsettings.json` or `appsettings.Development.json` with your MongoDB connection string:
   ```json
   {
     "ConnectionStrings": {
       "MongoDB": "mongodb://localhost:27017"
     },
     "MongoDB": {
       "DatabaseName": "portfolio"
     }
   }
   ```

4. **Run the application**:
   ```bash
   dotnet run
   ```

5. **Access the API**:
   - API Base URL: `https://localhost:5001` (or `http://localhost:5000`)
   - Swagger UI: `https://localhost:5001/swagger` (in development mode)

## API Endpoints

### Applications
- `GET /api/applications` - Get all applications (with filtering, sorting, pagination)
- `GET /api/applications/{id}` - Get application by ID
- `POST /api/applications` - Create new application
- `PUT /api/applications/{id}` - Update application
- `DELETE /api/applications/{id}` - Delete application
- `PATCH /api/applications/{id}/soft-delete` - Soft delete application

### Skills
- `GET /api/skills` - Get all skills (with filtering, sorting, pagination)
- `GET /api/skills/{id}` - Get skill by ID
- `GET /api/skills/code/{code}` - Get skill by code
- `POST /api/skills` - Create new skill
- `PUT /api/skills/{id}` - Update skill
- `DELETE /api/skills/{id}` - Delete skill

### Skill Types
- `GET /api/skilltypes` - Get all skill types
- `GET /api/skilltypes/{id}` - Get skill type by ID
- `GET /api/skilltypes/code/{code}` - Get skill type by code
- `POST /api/skilltypes` - Create new skill type
- `PUT /api/skilltypes/{id}` - Update skill type
- `DELETE /api/skilltypes/{id}` - Delete skill type

### Support Status
- `GET /api/supportstatus` - Get all support statuses
- `GET /api/supportstatus/{id}` - Get support status by ID
- `GET /api/supportstatus/code/{code}` - Get support status by code
- `POST /api/supportstatus` - Create new support status
- `PUT /api/supportstatus/{id}` - Update support status
- `DELETE /api/supportstatus/{id}` - Delete support status

### Traffic Analytics
- `GET /api/traffic/analytics` - Get traffic analytics dashboard data
- `GET /api/traffic/recent` - Get recent traffic activity
- `GET /api/traffic/ip/{ipAddress}` - Get traffic data for specific IP
- `POST /api/traffic/track-page` - Track page view (used by frontend)

## Configuration

### Environment Variables
- `ASPNETCORE_ENVIRONMENT` - Set to "Development" for development mode
- `ConnectionStrings__MongoDB` - MongoDB connection string
- `MongoDB__DatabaseName` - MongoDB database name
- `Frontend__Url` - Frontend URL for CORS configuration

### Rate Limiting
- Default: 1000 requests per 15 minutes per IP address
- Configurable in `Program.cs`

## Development

### Running in Development Mode
```bash
dotnet run --environment Development
```

### Building for Production
```bash
dotnet publish -c Release -o ./publish
```

### Running Tests
```bash
dotnet test
```

## Architecture

The application follows a clean architecture pattern:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and data access
- **Models**: Data models and DTOs
- **Middleware**: Custom middleware for traffic tracking
- **Configuration**: App settings and environment configuration

## Differences from Node.js Version

1. **Language**: C# instead of JavaScript/TypeScript
2. **Framework**: ASP.NET Core instead of Express.js
3. **ORM**: MongoDB Driver instead of Mongoose
4. **Logging**: Serilog instead of Morgan
5. **Validation**: Built-in model validation instead of express-validator
6. **Rate Limiting**: Built-in rate limiting instead of express-rate-limit

## Deployment

The application can be deployed to:
- **IIS**: Traditional Windows hosting
- **Docker**: Containerized deployment
- **Azure App Service**: Cloud hosting
- **AWS**: EC2 or Elastic Beanstalk
- **Linux**: Self-hosted on Linux servers

## License

MIT License - same as the original Node.js version.
