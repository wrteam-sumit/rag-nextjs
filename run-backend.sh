#!/bin/bash

# RAG Backend Management Script
# This script manages the Python FastAPI backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if we're in the right directory
check_directory() {
    if [ ! -d "backend" ]; then
        print_error "Backend directory not found. Please run this script from the project root."
        exit 1
    fi
}

# Function to check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8+ first."
        exit 1
    fi
}

# Function to check if Poetry is installed
check_poetry() {
    if ! command -v poetry &> /dev/null; then
        print_warning "Poetry is not installed. Installing Poetry..."
        curl -sSL https://install.python-poetry.org | python3 -
        export PATH="$HOME/.local/bin:$PATH"
    fi
}

# Function to setup virtual environment
setup_venv() {
    cd backend
    if [ ! -d "venv" ]; then
        print_status "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    print_status "Activating virtual environment..."
    source venv/bin/activate
    
    print_status "Installing dependencies with Poetry..."
    poetry install
    cd ..
}

# Function to start the backend
start_backend() {
    cd backend
    source venv/bin/activate
    
    print_status "Starting FastAPI backend server..."
    print_status "Server will be available at: http://localhost:8000"
    print_status "API documentation at: http://localhost:8000/docs"
    
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
}

# Function to start the simple backend
start_simple_backend() {
    cd backend
    source venv/bin/activate
    
    print_status "Starting simple FastAPI backend server..."
    print_status "Server will be available at: http://localhost:8000"
    
    uvicorn app.main_simple:app --host 0.0.0.0 --port 8000 --reload
}

# Function to install dependencies
install_deps() {
    check_directory
    check_python
    check_poetry
    setup_venv
    print_success "Backend dependencies installed successfully!"
}

# Function to add a new dependency
add_dependency() {
    if [ -z "$1" ]; then
        print_error "Please specify a package name. Usage: $0 add <package_name>"
        exit 1
    fi
    
    cd backend
    source venv/bin/activate
    print_status "Adding dependency: $1"
    poetry add "$1"
    cd ..
    print_success "Dependency added successfully!"
}

# Function to add a development dependency
add_dev_dependency() {
    if [ -z "$1" ]; then
        print_error "Please specify a package name. Usage: $0 add-dev <package_name>"
        exit 1
    fi
    
    cd backend
    source venv/bin/activate
    print_status "Adding development dependency: $1"
    poetry add --group dev "$1"
    cd ..
    print_success "Development dependency added successfully!"
}

# Function to remove a dependency
remove_dependency() {
    if [ -z "$1" ]; then
        print_error "Please specify a package name. Usage: $0 remove <package_name>"
        exit 1
    fi
    
    cd backend
    source venv/bin/activate
    print_status "Removing dependency: $1"
    poetry remove "$1"
    cd ..
    print_success "Dependency removed successfully!"
}

# Function to update dependencies
update_dependencies() {
    cd backend
    source venv/bin/activate
    print_status "Updating dependencies..."
    poetry update
    cd ..
    print_success "Dependencies updated successfully!"
}

# Function to show dependency information
show_dependencies() {
    cd backend
    source venv/bin/activate
    print_status "Current dependencies:"
    poetry show
    cd ..
}

# Function to open Poetry shell
open_shell() {
    cd backend
    source venv/bin/activate
    print_status "Opening Poetry shell..."
    poetry shell
}

# Function to show help
show_help() {
    echo "RAG Backend Management Script"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  install          Install backend dependencies"
    echo "  start            Start the FastAPI backend server"
    echo "  start-simple     Start the simple FastAPI backend server"
    echo "  add <package>    Add a new dependency"
    echo "  add-dev <package> Add a new development dependency"
    echo "  remove <package> Remove a dependency"
    echo "  update           Update all dependencies"
    echo "  show             Show current dependencies"
    echo "  shell            Open Poetry shell"
    echo "  help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 install"
    echo "  $0 start"
    echo "  $0 add requests"
    echo "  $0 add-dev pytest"
}

# Main script logic
case "$1" in
    "install")
        install_deps
        ;;
    "start")
        check_directory
        start_backend
        ;;
    "start-simple")
        check_directory
        start_simple_backend
        ;;
    "add")
        add_dependency "$2"
        ;;
    "add-dev")
        add_dev_dependency "$2"
        ;;
    "remove")
        remove_dependency "$2"
        ;;
    "update")
        update_dependencies
        ;;
    "show")
        show_dependencies
        ;;
    "shell")
        open_shell
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
