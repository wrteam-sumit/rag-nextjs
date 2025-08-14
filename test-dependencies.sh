#!/bin/bash

# Comprehensive dependency test script
echo "🧪 Testing RAG Backend Dependencies Compatibility"
echo "=================================================="

# Create a temporary virtual environment
echo "📦 Creating test virtual environment..."
python3 -m venv test_env
source test_env/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r backend/requirements.txt

# Test all key packages
echo "🔍 Testing package imports..."

# Test FastAPI and core packages
echo "1️⃣ Testing FastAPI..."
python -c "import fastapi; print('✅ FastAPI imported successfully')" || { echo "❌ FastAPI import failed"; exit 1; }

echo "2️⃣ Testing Uvicorn..."
python -c "import uvicorn; print('✅ Uvicorn imported successfully')" || { echo "❌ Uvicorn import failed"; exit 1; }

echo "3️⃣ Testing Pydantic..."
python -c "import pydantic; print('✅ Pydantic imported successfully')" || { echo "❌ Pydantic import failed"; exit 1; }

echo "4️⃣ Testing PyPDF2..."
python -c "import PyPDF2; print('✅ PyPDF2 imported successfully')" || { echo "❌ PyPDF2 import failed"; exit 1; }

echo "5️⃣ Testing pdfplumber..."
python -c "import pdfplumber; print('✅ pdfplumber imported successfully')" || { echo "❌ pdfplumber import failed"; exit 1; }

echo "6️⃣ Testing qdrant-client..."
python -c "import qdrant_client; print('✅ qdrant-client imported successfully')" || { echo "❌ qdrant-client import failed"; exit 1; }

echo "7️⃣ Testing google-generativeai..."
python -c "import google.generativeai; print('✅ google-generativeai imported successfully')" || { echo "❌ google-generativeai import failed"; exit 1; }

echo "8️⃣ Testing SQLAlchemy..."
python -c "import sqlalchemy; print('✅ SQLAlchemy imported successfully')" || { echo "❌ SQLAlchemy import failed"; exit 1; }

echo "9️⃣ Testing httpx..."
python -c "import httpx; print('✅ httpx imported successfully')" || { echo "❌ httpx import failed"; exit 1; }

echo "🔟 Testing duckduckgo-search..."
python -c "import duckduckgo_search; print('✅ duckduckgo-search imported successfully')" || { echo "❌ duckduckgo-search import failed"; exit 1; }

# Test our app imports
echo "📱 Testing app imports..."
cd backend
python -c "from app.core.config import settings; print('✅ Config imported successfully')" || { echo "❌ Config import failed"; exit 1; }
python -c "from app.services.document_processor import DocumentProcessor; print('✅ DocumentProcessor imported successfully')" || { echo "❌ DocumentProcessor import failed"; exit 1; }
python -c "from app.services.ai_service import AIService; print('✅ AIService imported successfully')" || { echo "❌ AIService import failed"; exit 1; }
python -c "from app.services.vector_service import VectorService; print('✅ VectorService imported successfully')" || { echo "❌ VectorService import failed"; exit 1; }

# Test FastAPI app creation
echo "🚀 Testing FastAPI app creation..."
python -c "from app.main_simple import app; print('✅ FastAPI app created successfully')" || { echo "❌ FastAPI app creation failed"; exit 1; }

cd ..

# Clean up
echo "🧹 Cleaning up test environment..."
deactivate
rm -rf test_env

echo ""
echo "🎉 All tests passed! Dependencies are compatible."
echo "✅ Ready for deployment to Render!"
