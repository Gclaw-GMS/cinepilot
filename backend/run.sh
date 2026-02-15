#!/bin/bash
cd "$(dirname "$0")"

# Start backend
echo "Starting backend on port 8000..."
cd backend
pip install -q -r requirements.txt 2>/dev/null
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend
sleep 3

# Start frontend
echo "Starting frontend on port 3000..."
cd ../frontend
npm install --silent 2>/dev/null
npm run dev -- -p 3000 &

echo "CinePilot running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"

wait
