#!/bin/bash

echo "Starting NestJS server..."

# Navigate to NestJS project directory
cd backend/newpennine-api

# Kill any existing process on port 3001
kill $(lsof -t -i:3001) 2>/dev/null || true

# Start the server
npm run start &

# Wait for server to be ready
echo "Waiting for server to start..."
for i in {1..30}; do
  if curl -s http://localhost:3001/api/v1/health > /dev/null; then
    echo "Server is ready!"
    break
  fi
  echo -n "."
  sleep 1
done

echo ""
echo "Testing endpoints..."

# Test health endpoint
echo "Testing /api/v1/health:"
curl -s http://localhost:3001/api/v1/health | python3 -m json.tool

echo ""
echo "Testing /api/v1/health/detailed:"
curl -s http://localhost:3001/api/v1/health/detailed | python3 -m json.tool

echo ""
echo "Testing /api/v1/widgets/stats:"
curl -s http://localhost:3001/api/v1/widgets/stats | python3 -m json.tool

echo ""
echo "Server is running on http://localhost:3001/api/v1"
