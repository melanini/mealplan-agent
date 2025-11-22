#!/bin/bash

# Mealprep Agent - Start All Services
# This script starts all backend services in the background

PROJECT_DIR="/Users/mel/Documents/mealprep-agent/mealprep-agent"
cd "$PROJECT_DIR"

echo "🚀 Starting Mealprep Agent services..."

# Kill any existing node processes on these ports
lsof -ti:3000,3001,3002,3003,3004,4000 | xargs kill -9 2>/dev/null

# Start User Profile Tool
echo "Starting User Profile Tool (port 3000)..."
node tools/userProfileTool/index.js > logs/userProfile.log 2>&1 &
sleep 1

# Start Recipe Tool
echo "Starting Recipe Tool (port 3001)..."
node tools/recipeTool/index.js > logs/recipe.log 2>&1 &
sleep 1

# Start Shopping List Tool
echo "Starting Shopping List Tool (port 3002)..."
node tools/shoppingListTool/index.js > logs/shopping.log 2>&1 &
sleep 1

# Start Metrics Tool
echo "Starting Metrics Tool (port 3003)..."
node tools/metricsTool/index.js > logs/metrics.log 2>&1 &
sleep 1

# Start Logger Tool
echo "Starting Logger Tool (port 3004)..."
node tools/loggerTool/index.js > logs/logger.log 2>&1 &
sleep 1

# Start Main Agent
echo "Starting Main Agent (port 4000)..."
node agent/index.js > logs/agent.log 2>&1 &
sleep 2

echo ""
echo "✅ All services started!"
echo ""
echo "Services running on:"
echo "  - User Profile Tool: http://localhost:3000"
echo "  - Recipe Tool: http://localhost:3001"
echo "  - Shopping List Tool: http://localhost:3002"
echo "  - Metrics Tool: http://localhost:3003"
echo "  - Logger Tool: http://localhost:3004"
echo "  - Main Agent: http://localhost:4000"
echo ""
echo "To view logs: tail -f logs/*.log"
echo "To stop all services: ./scripts/stop_all.sh"

