#!/bin/bash

# RAG Backend Deployment Script for Render
echo "🚀 Starting RAG Backend Deployment to Render..."

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Please run this script from the project root."
    exit 1
fi

echo "📋 Current configuration:"
echo "   - Backend: rag-backend"
echo "   - Database: rag-db"
echo "   - Health check: /health"
echo "   - Start command: uvicorn app.main_simple:app"

echo ""
echo "🔧 To deploy to Render:"
echo "1. Go to https://dashboard.render.com"
echo "2. Click 'New' → 'Blueprint'"
echo "3. Connect your GitHub repository"
echo "4. Select this repository"
echo "5. Render will automatically detect render.yaml"
echo "6. Click 'Apply' to deploy"

echo ""
echo "📝 Important notes:"
echo "- The backend will use the simple main file (main_simple.py)"
echo "- Database will be automatically provisioned"
echo "- Health check endpoint: /health"
echo "- CORS is configured for Vercel frontend"

echo ""
echo "🔍 After deployment, test these endpoints:"
echo "- https://rag-backend.onrender.com/ (root)"
echo "- https://rag-backend.onrender.com/health (health check)"
echo "- https://rag-backend.onrender.com/test (test endpoint)"

echo ""
echo "✅ Deployment script completed!"
