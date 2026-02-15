#!/bin/bash

# CinePilot Startup Script
# Starts both frontend and backend servers

set -e

echo "🎬 Starting CinePilot..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found. Install from https://nodejs.org${NC}"
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}⚠️  Python not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dependencies found${NC}"
echo ""

# Function to handle cleanup
cleanup() {
    echo ""
    echo "🛑 Shutting down CinePilot..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "🔧 Starting Backend (port 8000)..."
cd "$(dirname "$0")/backend"

# Install backend dependencies quietly
pip install -q -r requirements.txt 2>/dev/null || true

# Start backend in background
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

cd ..

# Wait for backend to start
sleep 2

# Start frontend
echo "🌐 Starting Frontend (port 3000)..."
cd "$(dirname "$0")/frontend"

# Install frontend dependencies quietly
npm install --silent 2>/dev/null || true

# Start frontend in background
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

cd ..

echo ""
echo "🎉 CinePilot is running!"
echo ""
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Wait for any process to exit
wait
