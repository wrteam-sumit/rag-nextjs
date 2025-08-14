#!/bin/bash

# Build script for RAG Backend
echo "🚀 Building RAG Backend..."

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install dependencies from requirements.txt
echo "📦 Installing dependencies from requirements.txt..."
pip install -r requirements.txt

echo "✅ Build completed successfully!"
