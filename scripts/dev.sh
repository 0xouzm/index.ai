#!/bin/bash

# Index.ai Development Script
# Starts both frontend and backend in development mode

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Starting Index.ai Development Environment..."
echo "============================================="

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "Error: pnpm is not installed"
    exit 1
fi

# Start backend (Workers)
echo "Starting backend (Workers) on port 8787..."
cd "$PROJECT_ROOT/server"
pnpm dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend (Next.js)
echo "Starting frontend (Next.js) on port 3000..."
cd "$PROJECT_ROOT/web"
pnpm dev &
FRONTEND_PID=$!

echo ""
echo "============================================="
echo "Development servers started!"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8787"
echo "============================================="
echo ""
echo "Press Ctrl+C to stop all servers"

# Handle shutdown
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
