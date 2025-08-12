#!/bin/bash

# Multi-Agent RAG System - Stop All Services
# This script stops all running services

echo "🛑 Stopping Multi-Agent RAG System..."

# Check if PID file exists
if [ -f .running_services.pid ]; then
    echo "📋 Found running services, stopping them..."
    
    PIDS=$(cat .running_services.pid)
    for pid in $PIDS; do
        if kill -0 $pid 2>/dev/null; then
            echo "   Stopping process $pid..."
            kill $pid
        else
            echo "   Process $pid is not running"
        fi
    done
    
    rm -f .running_services.pid
    echo "✅ All services stopped"
else
    echo "ℹ️  No running services found"
fi

# Also try to kill any remaining processes on our ports
echo "🔍 Checking for any remaining processes on our ports..."

# Kill processes on port 3001 (MCP Server)
if lsof -ti:3001 >/dev/null 2>&1; then
    echo "   Stopping processes on port 3001..."
    lsof -ti:3001 | xargs kill -9
fi

# Kill processes on port 8000 (Backend)
if lsof -ti:8000 >/dev/null 2>&1; then
    echo "   Stopping processes on port 8000..."
    lsof -ti:8000 | xargs kill -9
fi

# Kill processes on port 3000 (Frontend)
if lsof -ti:3000 >/dev/null 2>&1; then
    echo "   Stopping processes on port 3000..."
    lsof -ti:3000 | xargs kill -9
fi

echo "✅ Cleanup complete"
