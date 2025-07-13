#!/bin/bash

# Script to run Next.js in test mode for performance testing
# This disables authentication for specified routes

echo "🚀 Starting Next.js in Test Mode..."
echo "⚠️  WARNING: Authentication is disabled for test routes!"
echo ""
echo "Test routes available without authentication:"
echo "  - http://localhost:3000/"
echo "  - http://localhost:3000/admin/injection"
echo "  - http://localhost:3000/admin/pipeline"
echo "  - http://localhost:3000/admin/warehouse"
echo "  - http://localhost:3000/access"
echo "  - http://localhost:3000/test-performance"
echo "  - http://localhost:3000/api/graphql"
echo ""

# Set test mode environment variable and start dev server
NEXT_PUBLIC_TEST_MODE=true npm run dev