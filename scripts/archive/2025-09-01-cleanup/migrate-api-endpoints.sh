#!/bin/bash

# API Consolidation Migration Script
# Date: 2025-08-11
# Purpose: Migrate v1 and v2 API endpoints to consolidated structure

set -e

echo "Starting API consolidation migration..."

# Base directory
BASE_DIR="/Users/chun/Documents/PennineWMS/online-stock-control-system"
API_DIR="${BASE_DIR}/app/api"

# Function to copy and update file
migrate_endpoint() {
    local src=$1
    local dest=$2
    local endpoint_name=$3
    
    if [ -f "$src" ]; then
        echo "Migrating ${endpoint_name}..."
        cp "$src" "$dest"
        echo "  ✓ Copied to new location"
    else
        echo "  ⚠ Source file not found: $src"
    fi
}

# Create necessary directories
echo "Creating directory structure..."
mkdir -p "${API_DIR}/monitoring/deep"
mkdir -p "${API_DIR}/alerts/config"
mkdir -p "${API_DIR}/alerts/history"
mkdir -p "${API_DIR}/alerts/notifications"
mkdir -p "${API_DIR}/alerts/rules/[id]/test"
mkdir -p "${API_DIR}/metrics/business"
mkdir -p "${API_DIR}/metrics/database"
mkdir -p "${API_DIR}/cache/metrics"

# Migrate health endpoints
echo ""
echo "=== Migrating Health Endpoints ==="
migrate_endpoint "${API_DIR}/v1/health/route.ts" "${API_DIR}/monitoring/health/route.ts" "v1/health"
migrate_endpoint "${API_DIR}/v1/health/deep/route.ts" "${API_DIR}/monitoring/deep/route.ts" "v1/health/deep"

# Migrate alerts endpoints
echo ""
echo "=== Migrating Alert Endpoints ==="
migrate_endpoint "${API_DIR}/v1/alerts/config/route.ts" "${API_DIR}/alerts/config/route.ts" "v1/alerts/config"
migrate_endpoint "${API_DIR}/v1/alerts/history/route.ts" "${API_DIR}/alerts/history/route.ts" "v1/alerts/history"
migrate_endpoint "${API_DIR}/v1/alerts/notifications/route.ts" "${API_DIR}/alerts/notifications/route.ts" "v1/alerts/notifications"
migrate_endpoint "${API_DIR}/v1/alerts/rules/route.ts" "${API_DIR}/alerts/rules/route.ts" "v1/alerts/rules"
migrate_endpoint "${API_DIR}/v1/alerts/rules/[id]/route.ts" "${API_DIR}/alerts/rules/[id]/route.ts" "v1/alerts/rules/[id]"
migrate_endpoint "${API_DIR}/v1/alerts/rules/[id]/test/route.ts" "${API_DIR}/alerts/rules/[id]/test/route.ts" "v1/alerts/rules/[id]/test"

# Migrate metrics endpoints (main metrics already done manually)
echo ""
echo "=== Migrating Metrics Endpoints ==="
migrate_endpoint "${API_DIR}/v1/metrics/business/route.ts" "${API_DIR}/metrics/business/route.ts" "v1/metrics/business"
migrate_endpoint "${API_DIR}/v1/metrics/database/route.ts" "${API_DIR}/metrics/database/route.ts" "v1/metrics/database"

# Migrate cache endpoints
echo ""
echo "=== Migrating Cache Endpoints ==="
migrate_endpoint "${API_DIR}/v1/cache/metrics/route.ts" "${API_DIR}/cache/metrics/route.ts" "v1/cache/metrics"

echo ""
echo "Migration complete!"
echo ""
echo "Next steps:"
echo "1. Update all file headers to remove v1/v2 references"
echo "2. Test all endpoints at new locations"
echo "3. Verify redirects are working"
echo "4. Update client code to use new endpoints"
echo "5. Remove old v1/v2 directories after verification"