#!/bin/bash

# MCP Web Search Server Runner
# This script starts the MCP server for web search functionality

echo "🚀 Starting MCP Web Search Server..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed or not in PATH"
    exit 1
fi

# Check if required packages are installed
echo "📦 Checking dependencies..."
python3 -c "import requests, fastapi, uvicorn" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Missing required packages. Installing..."
    pip3 install requests fastapi uvicorn
fi

# Set environment variables
export MCP_SERVER_PORT=${MCP_SERVER_PORT:-3001}
export MCP_SERVER_HOST=${MCP_SERVER_HOST:-"0.0.0.0"}

echo "🌐 MCP Server will run on http://$MCP_SERVER_HOST:$MCP_SERVER_PORT"
echo "📋 Available endpoints:"
echo "   - GET  /health - Health check"
echo "   - GET  /engines - List search engines"
echo "   - POST /search - Perform web search"
echo "   - POST /search/simple - Simple search"

# Start the server
cd backend
python3 mcp_server.py
