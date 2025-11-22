#!/bin/bash

echo "🛑 Stopping Mealprep Agent services..."

# Kill all node processes on the service ports
lsof -ti:3000,3001,3002,3003,3004,4000 | xargs kill -9 2>/dev/null

echo "✅ All services stopped!"

