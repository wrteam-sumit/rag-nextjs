#!/bin/bash

# Multi-Agent RAG System - Complete Startup Script
# This script starts all services needed for the multi-agent system

echo "🚀 Starting Multi-Agent RAG System..."
echo "======================================"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to start within expected time"
    return 1
}

# Check if required ports are available
echo "🔍 Checking port availability..."

if check_port 3001; then
    echo "❌ Port 3001 is already in use (MCP Server)"
    exit 1
fi

if check_port 8000; then
    echo "❌ Port 8000 is already in use (Backend)"
    exit 1
fi

if check_port 3000; then
    echo "❌ Port 3000 is already in use (Frontend)"
    exit 1
fi

echo "✅ All ports are available"

# Start MCP Server
echo ""
echo "🌐 Starting MCP Web Search Server..."
./run-mcp-server.sh &
MCP_PID=$!

# Wait for MCP server to start
if wait_for_service "http://localhost:3001/health" "MCP Server"; then
    echo "✅ MCP Server started successfully (PID: $MCP_PID)"
else
    echo "❌ Failed to start MCP Server"
    kill $MCP_PID 2>/dev/null
    exit 1
fi

# Start Backend
echo ""
echo "🐍 Starting Python Backend..."
./run-backend.sh &
BACKEND_PID=$!

# Wait for backend to start
if wait_for_service "http://localhost:8000/docs" "Backend API"; then
    echo "✅ Backend started successfully (PID: $BACKEND_PID)"
else
    echo "❌ Failed to start Backend"
    kill $MCP_PID $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start Frontend
echo ""
echo "⚛️  Starting Next.js Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
if wait_for_service "http://localhost:3000" "Frontend"; then
    echo "✅ Frontend started successfully (PID: $FRONTEND_PID)"
else
    echo "❌ Failed to start Frontend"
    kill $MCP_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

# Save PIDs to file for cleanup
echo "$MCP_PID $BACKEND_PID $FRONTEND_PID" > .running_services.pid

echo ""
echo "🎉 All services started successfully!"
echo "======================================"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "🌐 MCP Server: http://localhost:3001"
echo ""
echo "📋 Available endpoints:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API Docs: http://localhost:8000/docs"
echo "   - MCP Server Health: http://localhost:3001/health"
echo "   - MCP Search Engines: http://localhost:3001/engines"
echo ""
echo "🧪 Run tests: ./test-multi-agent.py"
echo ""
echo "🛑 To stop all services: ./stop-all.sh"
echo ""

# Function to handle cleanup on script exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    
    if [ -f .running_services.pid ]; then
        PIDS=$(cat .running_services.pid)
        for pid in $PIDS; do
            if kill -0 $pid 2>/dev/null; then
                echo "   Stopping process $pid..."
                kill $pid
            fi
        done
        rm -f .running_services.pid
    fi
    
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
echo "⏳ Services are running. Press Ctrl+C to stop all services."
while true; do
    sleep 1
done
