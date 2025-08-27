#!/bin/bash

# GRNLabelCard Phase 3 Testing Script
# Comprehensive test execution for load, stress, compatibility, and security testing

echo "==============================================="
echo "GRNLabelCard Phase 3 - Comprehensive Testing"
echo "==============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results directory
RESULTS_DIR="test-results/phase3"
mkdir -p $RESULTS_DIR

# Function to run tests and capture results
run_test_suite() {
    local suite_name=$1
    local test_path=$2
    local report_file="$RESULTS_DIR/${suite_name}_report.html"
    
    echo -e "${YELLOW}Running ${suite_name}...${NC}"
    
    if npx playwright test "$test_path" --config=playwright.phase3.config.ts --reporter=html --reporter-output="$report_file"; then
        echo -e "${GREEN}✓ ${suite_name} completed successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ ${suite_name} failed${NC}"
        return 1
    fi
}

# Function to run specific test with retries
run_with_retry() {
    local suite_name=$1
    local test_path=$2
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if run_test_suite "$suite_name" "$test_path"; then
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            echo -e "${YELLOW}Retrying ${suite_name} (Attempt $((retry_count + 1))/${max_retries})...${NC}"
            sleep 5
        fi
    done
    
    return 1
}

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Start timestamp
START_TIME=$(date +%s)

echo "Starting Phase 3 Test Suite Execution..."
echo "========================================="
echo ""

# 3.1.1 Load and Stress Testing
echo "Phase 3.1.1: Load and Stress Testing"
echo "-------------------------------------"

if run_with_retry "Load Testing" "tests/load-testing/grn-label-card-load.test.ts"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if run_with_retry "Stress Testing" "tests/load-testing/grn-label-card-stress.test.ts"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""

# 3.1.2 Cross-Browser Compatibility Testing
echo "Phase 3.1.2: Cross-Browser Compatibility Testing"
echo "------------------------------------------------"

if run_with_retry "Browser Compatibility" "tests/cross-browser/grn-label-card-compatibility.test.ts"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""

# 3.1.3 Mobile Responsive Testing
echo "Phase 3.1.3: Mobile Responsive Testing"
echo "--------------------------------------"

if run_with_retry "Mobile Responsive" "tests/mobile/grn-label-card-responsive.test.ts"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""

# 3.1.4 Security Testing
echo "Phase 3.1.4: Security Testing"
echo "-----------------------------"

if run_with_retry "Security Validation" "tests/security/grn-label-card-security.test.ts"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""

# End timestamp
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Generate summary report
SUMMARY_FILE="$RESULTS_DIR/phase3_summary.json"
cat > "$SUMMARY_FILE" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "duration": ${DURATION},
  "totalTests": ${TOTAL_TESTS},
  "passed": ${PASSED_TESTS},
  "failed": ${FAILED_TESTS},
  "skipped": ${SKIPPED_TESTS},
  "successRate": $(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
}
EOF

# Display summary
echo "==============================================="
echo "Phase 3 Test Execution Summary"
echo "==============================================="
echo ""
echo -e "Total Tests:    ${TOTAL_TESTS}"
echo -e "Passed:         ${GREEN}${PASSED_TESTS}${NC}"
echo -e "Failed:         ${RED}${FAILED_TESTS}${NC}"
echo -e "Skipped:        ${YELLOW}${SKIPPED_TESTS}${NC}"
echo -e "Success Rate:   $(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)%"
echo -e "Duration:       ${DURATION} seconds"
echo ""
echo "Test reports saved in: $RESULTS_DIR"
echo "Summary report: $SUMMARY_FILE"
echo ""

# Exit with appropriate code
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Some tests failed. Please review the reports for details.${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed successfully!${NC}"
    exit 0
fi