#!/bin/bash

# Poetry setup script for RAG backend
echo "Setting up Poetry for RAG backend..."

# Check if Poetry is installed
if ! command -v poetry &> /dev/null; then
    echo "Poetry is not installed. Installing Poetry..."
    curl -sSL https://install.python-poetry.org | python3 -
    echo "Please add Poetry to your PATH and restart your terminal, then run this script again."
    exit 1
fi

echo "Poetry is installed. Setting up the project..."

# Install dependencies
echo "Installing dependencies..."
poetry install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp ../env.example .env
    echo "Please update the .env file with your configuration."
fi

echo "Setup complete!"
echo ""
echo "To run the application:"
echo "  poetry run start          # Run the full application"
echo "  poetry run start-simple   # Run the simple version"
echo ""
echo "To activate the virtual environment:"
echo "  poetry shell"
echo ""
echo "To add new dependencies:"
echo "  poetry add package-name"
echo "  poetry add --group dev package-name  # for development dependencies" 