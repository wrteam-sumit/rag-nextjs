#!/bin/bash

# Build script for RAG Backend
echo "🚀 Building RAG Backend..."

# Exit on any error
set -e

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install dependencies from requirements.txt with verbose output
echo "📦 Installing dependencies from requirements.txt..."
pip install -r requirements.txt --verbose

# Verify key packages are installed
echo "🔍 Verifying key packages..."
python -c "import fastapi; print('✅ FastAPI installed')" || { echo "❌ FastAPI installation failed"; exit 1; }
python -c "import uvicorn; print('✅ Uvicorn installed')" || { echo "❌ Uvicorn installation failed"; exit 1; }
python -c "import PyPDF2; print('✅ PyPDF2 installed')" || { echo "❌ PyPDF2 installation failed"; exit 1; }
python -c "import pdfplumber; print('✅ pdfplumber installed')" || { echo "❌ pdfplumber installation failed"; exit 1; }
python -c "import qdrant_client; print('✅ qdrant-client installed')" || { echo "❌ qdrant-client installation failed"; exit 1; }

echo "✅ Build completed successfully!"
