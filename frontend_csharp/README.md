# Frontend C# Backend

This is a duplicate of the main frontend, configured to work with the C# backend.

## Configuration

- **Backend URL**: `http://localhost:5002/api`
- **Frontend Port**: `5174` (or next available port)
- **Backend Type**: C# ASP.NET Core Web API

## API Endpoints

The frontend is configured to use the following C# backend endpoints:

- **Applications**: `/api/applications`
- **Skills**: `/api/skills`
- **Skill Types**: `/api/skilltypes` (note: no hyphen)
- **Support Status**: `/api/supportstatus` (note: no hyphen)
- **Traffic**: `/api/traffic/*`

## Running

1. Start the C# backend:
   ```bash
   cd backend_csharp
   export PATH="$HOME/.dotnet:$PATH"
   export MONGO_INSTANCE_URL="mongodb+srv://mfarmer5102:9AU2skCeWK4fdoqsbrEauvP3rpcABtRtPdwawYodBzGniGzURa@cluster0.sn2lo.mongodb.net/?retryWrites=true&w=majority"
   dotnet run --urls "http://localhost:5002"
   ```

2. Start this frontend:
   ```bash
   cd frontend_csharp
   npm install
   npm run dev
   ```

3. Open your browser to the URL shown in the terminal (typically `http://localhost:5174`)

## Differences from Main Frontend

- Points to C# backend instead of Node.js backend
- Uses different API endpoint paths (no hyphens in some endpoints)
- Has traffic tracking API endpoints configured
- Title shows "(C# Backend)" to distinguish it

## Notes

- Both frontends can run simultaneously on different ports
- The C# backend supports all the same functionality as the Node.js backend
- Traffic tracking is available in both versions