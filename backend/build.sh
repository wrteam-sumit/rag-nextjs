#!/bin/bash

# Build script for RAG Backend
echo "🚀 Building RAG Backend..."

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install dependencies from requirements.txt with verbose output
echo "📦 Installing dependencies from requirements.txt..."
pip install -r requirements.txt --verbose

# Verify key packages are installed
echo "🔍 Verifying key packages..."
python -c "import fastapi; print('✅ FastAPI installed')"
python -c "import uvicorn; print('✅ Uvicorn installed')"
python -c "import PyPDF2; print('✅ PyPDF2 installed')"
python -c "import pdfplumber; print('✅ pdfplumber installed')"

echo "✅ Build completed successfully!"
