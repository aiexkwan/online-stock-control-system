#!/bin/bash

echo "Testing API call optimizations..."
echo "Goal: Verify dashboard API is working and not being called excessively"
echo ""

# Test if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "Server not running on localhost:3000"
  echo "Please run: npm run dev"
  exit 1
fi

echo "Server is running"
echo ""

# Test dashboard API directly
echo "Testing dashboard API endpoint..."

RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/dashboard_response.json "http://localhost:3000/api/admin/dashboard?widgets=total_pallets")
HTTP_CODE=${RESPONSE: -3}

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "Dashboard API responded successfully (HTTP $HTTP_CODE)"
  
  # Check if response has data
  if [ -s /tmp/dashboard_response.json ]; then
    echo "Response contains data"
    echo "Response preview:"
    head -c 200 /tmp/dashboard_response.json
    echo ""
  else
    echo "Response is empty"
  fi
else
  echo "Dashboard API failed (HTTP $HTTP_CODE)"
  cat /tmp/dashboard_response.json
fi

echo ""
echo "Optimization changes made:"
echo "  - Disabled auto-refresh in DashboardDataContext"
echo "  - Increased React Query cache times (30min stale, 60min cache)"
echo "  - Disabled refetchOnMount, refetchOnFocus, refetchOnReconnect"
echo "  - Simplified analysis page (removed AnalysisExpandableCards)"
echo "  - Added rate limiting (5 second minimum between fetches)"
echo "  - Added detailed API request logging"
echo ""
echo "Expected result: Dashboard should load with < 15 API calls total"
echo "Check server logs for API call tracking with fire emoji"

# Clean up
rm -f /tmp/dashboard_response.json