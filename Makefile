# Devin Takehome - Makefile
# Common development commands for the full-stack application

.PHONY: help dev install clean build start backend frontend lint test

# Default target
help: ## Show this help message
	@echo "Devin Takehome - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Quick Start:"
	@echo "  make install  # Install all dependencies"
	@echo "  make dev      # Start both servers in development mode"
	@echo "  make start    # Start both servers in production mode"

# Development commands
dev: ## Start both frontend and backend in development mode
	@echo "🚀 Starting development servers..."
	@echo "   Backend:  http://localhost:8000"
	@echo "   Frontend: http://localhost:5173"
	@echo ""
	npm run dev

start: ## Start both frontend and backend in production mode
	@echo "🚀 Starting production servers..."
	@echo "   Backend:  http://localhost:8000"
	@echo "   Frontend: http://localhost:5173"
	@echo ""
	npm run start

backend: ## Start only the backend server
	@echo "🚀 Starting backend server..."
	@echo "   Backend:  http://localhost:8000"
	@echo ""
	npm run dev:backend

frontend: ## Start only the frontend server
	@echo "🚀 Starting frontend server..."
	@echo "   Frontend: http://localhost:5173"
	@echo ""
	npm run dev:frontend

# Installation commands
install: ## Install all dependencies
	@echo "📦 Installing all dependencies..."
	npm run install:all
	@echo "✅ Installation complete!"

install-backend: ## Install only backend dependencies
	@echo "📦 Installing backend dependencies..."
	npm run install:backend
	@echo "✅ Backend dependencies installed!"

install-frontend: ## Install only frontend dependencies
	@echo "📦 Installing frontend dependencies..."
	npm run install:frontend
	@echo "✅ Frontend dependencies installed!"

# Build commands
build: ## Build the frontend for production
	@echo "🔨 Building frontend..."
	npm run build
	@echo "✅ Build complete!"

# Utility commands
clean: ## Clean all dependencies and build files
	@echo "🧹 Cleaning dependencies and build files..."
	npm run clean
	@echo "✅ Clean complete!"

lint: ## Run linting on frontend
	@echo "🔍 Running linter..."
	npm run lint
	@echo "✅ Linting complete!"

# Setup commands
setup: install ## Complete setup (install all dependencies)
	@echo "✅ Setup complete! Run 'make dev' to start development."

# Check commands
check: ## Check if all prerequisites are installed
	@echo "🔍 Checking prerequisites..."
	@command -v node >/dev/null 2>&1 || (echo "❌ Node.js is not installed" && exit 1)
	@command -v python3 >/dev/null 2>&1 || (echo "❌ Python 3 is not installed" && exit 1)
	@command -v poetry >/dev/null 2>&1 || (echo "❌ Poetry is not installed" && exit 1)
	@echo "✅ All prerequisites are installed!"

# Development workflow
dev-setup: check install ## Complete development setup
	@echo "✅ Development setup complete!"
	@echo "Run 'make dev' to start both servers"

# Quick commands
run: dev ## Alias for dev command
	@true

# Default target when no argument is provided
.DEFAULT_GOAL := help
