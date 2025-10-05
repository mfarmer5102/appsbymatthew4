#!/bin/bash

# Start C# Backend and Frontend Stack
echo "🚀 Starting C# Backend and Frontend Stack..."

# Set environment variables
export PATH="$HOME/.dotnet:$PATH"
export MONGO_INSTANCE_URL="mongodb+srv://mfarmer5102:9AU2skCeWK4fdoqsbrEauvP3rpcABtRtPdwawYodBzGniGzURa@cluster0.sn2lo.mongodb.net/?retryWrites=true&w=majority"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Stopping services..."
    pkill -f "dotnet run"
    pkill -f "npm run dev"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start C# Backend in background
echo "🔧 Starting C# Backend on port 5002..."
cd backend_csharp
dotnet run --urls "http://localhost:5002" &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start Frontend in background
echo "🎨 Starting Frontend on port 5174..."
cd ../frontend_csharp
npm run dev &
FRONTEND_PID=$!

echo "✅ Both services started!"
echo "📊 Backend: http://localhost:5002"
echo "🎨 Frontend: http://localhost:5174"
echo "📖 API Docs: http://localhost:5002/swagger"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for user to stop
wait
