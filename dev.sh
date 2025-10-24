#!/bin/bash

# Devin Takehome - Development Script
# This script helps you run the full-stack application

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    if ! command_exists python3; then
        print_error "Python 3 is not installed. Please install Python 3.12+ from https://python.org/"
        exit 1
    fi
    
    if ! command_exists poetry; then
        print_error "Poetry is not installed. Please install Poetry from https://python-poetry.org/docs/#installation"
        exit 1
    fi
    
    print_success "All prerequisites are installed!"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    if [ ! -d "node_modules" ]; then
        print_status "Installing root dependencies..."
        npm install
    fi
    
    # Install backend dependencies
    if [ ! -d "backend/.venv" ]; then
        print_status "Installing backend dependencies..."
        cd backend
        poetry install
        cd ..
    fi
    
    # Install frontend dependencies
    if [ ! -d "frontend/node_modules" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
    fi
    
    print_success "All dependencies installed!"
}

# Function to run the application
run_app() {
    print_status "Starting the application..."
    print_status "Backend will run on http://localhost:8000"
    print_status "Frontend will run on http://localhost:5173"
    print_status "Press Ctrl+C to stop both servers"
    echo ""
    
    # Run both servers concurrently
    npm run dev
}

# Function to show help
show_help() {
    echo "Devin Takehome - Development Script"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev, start    Start both frontend and backend servers (default)"
    echo "  install       Install all dependencies"
    echo "  backend       Start only the backend server"
    echo "  frontend      Start only the frontend server"
    echo "  clean         Clean all dependencies and build files"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh              # Start both servers"
    echo "  ./dev.sh install      # Install dependencies"
    echo "  ./dev.sh backend      # Start only backend"
    echo "  ./dev.sh frontend     # Start only frontend"
}

# Main script logic
case "${1:-dev}" in
    "dev"|"start")
        check_prerequisites
        install_dependencies
        run_app
        ;;
    "install")
        check_prerequisites
        install_dependencies
        print_success "Installation complete! Run './dev.sh' to start the application."
        ;;
    "backend")
        check_prerequisites
        install_dependencies
        print_status "Starting backend server..."
        cd backend
        poetry run fastapi dev app/main.py --host 0.0.0.0 --port 8000
        ;;
    "frontend")
        check_prerequisites
        install_dependencies
        print_status "Starting frontend server..."
        cd frontend
        npm run dev
        ;;
    "clean")
        print_status "Cleaning dependencies and build files..."
        rm -rf frontend/node_modules frontend/dist backend/__pycache__ backend/.venv node_modules
        print_success "Clean complete!"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
