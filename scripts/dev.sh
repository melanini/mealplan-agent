#!/bin/bash

# Mealprep Agent - Development Mode
# Starts all services and opens the UI in the browser

PROJECT_DIR="/Users/mel/Documents/mealprep-agent/mealprep-agent"
cd "$PROJECT_DIR"

echo "🔧 Starting Mealprep Agent in development mode..."
echo ""

# Start backend services
./scripts/start_all.sh

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 3

# Start frontend in the background
echo ""
echo "🌐 Starting frontend UI..."
cd ui
npm run dev &

# Wait for frontend to start
sleep 3

# Open browser
echo ""
echo "🚀 Opening browser..."
open http://localhost:5173 2>/dev/null || echo "   → Open http://localhost:5173 in your browser"

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep script running
wait

