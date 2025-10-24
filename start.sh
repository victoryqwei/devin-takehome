#!/bin/bash

# Quick start script for Devin Takehome
# This is a simpler version of dev.sh for quick starts

set -e

echo "🚀 Starting Devin Takehome Application..."
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ] || [ ! -d "frontend/node_modules" ] || [ ! -d "backend/.venv" ]; then
    echo "📦 Installing dependencies..."
    npm run install:all
    echo ""
fi

echo "🎯 Starting both servers..."
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers
npm run dev
