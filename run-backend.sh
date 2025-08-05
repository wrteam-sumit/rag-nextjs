#!/bin/bash

# Convenience script to run the RAG backend with Poetry
# This script can be run from the project root directory

# Add Poetry to PATH if not already there
export PATH="/Users/payalpatel/.local/bin:$PATH"

# Change to backend directory (relative to project root)
cd backend

# Check if Poetry is installed
if ! command -v poetry &> /dev/null; then
    echo "Poetry is not installed. Please install Poetry first:"
    echo "curl -sSL https://install.python-poetry.org | python3 -"
    exit 1
fi

# Parse command line arguments
case "${1:-start}" in
    "start")
        echo "Starting full RAG backend..."
        poetry run start
        ;;
    "start-simple"|"simple")
        echo "Starting simple RAG backend..."
        poetry run start-simple
        ;;
    "install")
        echo "Installing dependencies..."
        poetry install
        ;;
    "shell")
        echo "Activating Poetry shell..."
        poetry shell
        ;;
    "add")
        if [ -z "$2" ]; then
            echo "Usage: $0 add <package-name>"
            exit 1
        fi
        echo "Adding dependency: $2"
        poetry add "$2"
        ;;
    "add-dev")
        if [ -z "$2" ]; then
            echo "Usage: $0 add-dev <package-name>"
            exit 1
        fi
        echo "Adding development dependency: $2"
        poetry add --group dev "$2"
        ;;
    "remove")
        if [ -z "$2" ]; then
            echo "Usage: $0 remove <package-name>"
            exit 1
        fi
        echo "Removing dependency: $2"
        poetry remove "$2"
        ;;
    "update")
        echo "Updating dependencies..."
        poetry update
        ;;
    "show")
        echo "Showing installed packages..."
        poetry show
        ;;
    "help"|"-h"|"--help")
        echo "RAG Backend Poetry Runner"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start          Run the full application (default)"
        echo "  start-simple   Run the simple version"
        echo "  install        Install dependencies"
        echo "  shell          Activate Poetry shell"
        echo "  add <pkg>      Add a production dependency"
        echo "  add-dev <pkg>  Add a development dependency"
        echo "  remove <pkg>   Remove a dependency"
        echo "  update         Update all dependencies"
        echo "  show           Show installed packages"
        echo "  help           Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                    # Run full application"
        echo "  $0 start-simple       # Run simple version"
        echo "  $0 add requests       # Add requests package"
        echo "  $0 add-dev pytest     # Add pytest as dev dependency"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac 