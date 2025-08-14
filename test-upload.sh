#!/bin/bash

# Test script for RAG Backend Upload Functionality
echo "🧪 Testing RAG Backend Upload Functionality..."

BACKEND_URL="https://rag-backend.onrender.com"

echo "📋 Testing endpoints..."

# Test 1: Health check
echo "1️⃣ Testing health check..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health")
if [[ $? -eq 0 ]]; then
    echo "✅ Health check passed: $HEALTH_RESPONSE"
else
    echo "❌ Health check failed"
fi

# Test 2: Root endpoint
echo "2️⃣ Testing root endpoint..."
ROOT_RESPONSE=$(curl -s "$BACKEND_URL/")
if [[ $? -eq 0 ]]; then
    echo "✅ Root endpoint passed: $ROOT_RESPONSE"
else
    echo "❌ Root endpoint failed"
fi

# Test 3: Test endpoint
echo "3️⃣ Testing test endpoint..."
TEST_RESPONSE=$(curl -s "$BACKEND_URL/test")
if [[ $? -eq 0 ]]; then
    echo "✅ Test endpoint passed: $TEST_RESPONSE"
else
    echo "❌ Test endpoint failed"
fi

echo ""
echo "📝 Upload functionality test instructions:"
echo "1. Make sure backend is deployed and running"
echo "2. Go to your Vercel frontend: https://rag-nextjs-frontend.vercel.app"
echo "3. Login with Google OAuth"
echo "4. Try uploading a PDF or document"
echo "5. Check if the document appears in the chat interface"

echo ""
echo "🔍 Expected behavior:"
echo "- Document should upload successfully"
echo "- Text should be extracted from the document"
echo "- Document should appear in the chat sidebar"
echo "- You should be able to ask questions about the document"

echo ""
echo "⚠️  Common issues and solutions:"
echo "- If upload fails: Check backend logs in Render dashboard"
echo "- If CORS error: Verify ALLOWED_ORIGINS in backend config"
echo "- If auth fails: Check Google OAuth configuration"
echo "- If database error: Check DATABASE_URL in Render environment"

echo ""
echo "✅ Test script completed!"
