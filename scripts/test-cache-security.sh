#!/bin/bash

# Security test script for cache endpoints
# Tests authentication, authorization, and rate limiting

echo "================================"
echo "Cache Endpoint Security Testing"
echo "================================"
echo ""

BASE_URL="http://localhost:3000"

# Test 1: Unauthenticated DELETE request (should fail with 401)
echo "Test 1: Unauthenticated DELETE request"
echo "---------------------------------------"
curl -X DELETE "$BASE_URL/api/cache/metrics?type=all" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.'

echo ""

# Test 2: Unauthenticated POST request (should fail with 401)
echo "Test 2: Unauthenticated POST request"
echo "-------------------------------------"
curl -X POST "$BASE_URL/api/cache/metrics" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.'

echo ""

# Test 3: Rate limiting test (should trigger 429 after 5 requests)
echo "Test 3: Rate limiting test (6 requests, should fail on 6th)"
echo "-----------------------------------------------------------"
for i in {1..6}; do
  echo "Request $i:"
  curl -X GET "$BASE_URL/api/cache/metrics" \
    -H "Content-Type: application/json" \
    -w "HTTP Status: %{http_code}\n" \
    -s -o /dev/null
done

echo ""

# Test 4: v1 endpoint authentication test
echo "Test 4: v1 endpoint authentication test"
echo "----------------------------------------"
curl -X DELETE "$BASE_URL/api/v1/cache/metrics?pattern=test*" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.'

echo ""
echo "================================"
echo "Security Testing Complete"
echo "================================"
echo ""
echo "Expected results:"
echo "- Test 1: HTTP 401 (Unauthorized)"
echo "- Test 2: HTTP 401 (Unauthorized)"
echo "- Test 3: First 5 requests succeed, 6th returns 429"
echo "- Test 4: HTTP 401 (Unauthorized)"