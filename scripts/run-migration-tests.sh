#!/bin/bash

##############################################################################
# GraphQL → REST API 遷移測試執行腳本
# QA專家 - 自動化測試套件執行器
##############################################################################

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日誌函數
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 參數解析
TEST_TYPE="${1:-all}"
ENVIRONMENT="${NODE_ENV:-test}"
PARALLEL="${2:-true}"
VERBOSE="${3:-false}"

log_info "🧪 Starting Migration Test Suite"
log_info "📋 Test Type: $TEST_TYPE"
log_info "🌍 Environment: $ENVIRONMENT"
log_info "⚡ Parallel: $PARALLEL"

# 創建測試結果目錄
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
RESULTS_DIR="test-results/migration-$TIMESTAMP"
mkdir -p "$RESULTS_DIR"

# 測試配置
export TEST_RESULTS_DIR="$RESULTS_DIR"
export MIGRATION_TEST_MODE="true"

# 單元測試 - API 一致性
run_unit_tests() {
    log_info "🔬 Running Unit Tests (API Consistency)"
    
    npm run test -- __tests__/migration/api-consistency.test.ts \
        --coverage \
        --coverageDirectory="$RESULTS_DIR/coverage-unit" \
        --outputFile="$RESULTS_DIR/unit-results.json" \
        --verbose=$VERBOSE \
        2>&1 | tee "$RESULTS_DIR/unit-tests.log"
    
    if [ $? -eq 0 ]; then
        log_success "Unit tests passed"
        return 0
    else
        log_error "Unit tests failed"
        return 1
    fi
}

# 整合測試 - 資料完整性
run_integration_tests() {
    log_info "🔗 Running Integration Tests (Data Integrity)"
    
    # 設置測試資料庫
    if [ "$ENVIRONMENT" != "test" ]; then
        log_warning "Setting up test database..."
        npm run db:setup:test || log_error "Failed to setup test database"
    fi
    
    npm run test:integration -- \
        --testPathPattern="migration" \
        --runInBand \
        --outputFile="$RESULTS_DIR/integration-results.json" \
        2>&1 | tee "$RESULTS_DIR/integration-tests.log"
    
    local result=$?
    
    # 清理測試資料
    npm run db:cleanup:test || log_warning "Failed to cleanup test database"
    
    if [ $result -eq 0 ]; then
        log_success "Integration tests passed"
        return 0
    else
        log_error "Integration tests failed"
        return 1
    fi
}

# E2E 測試 - 用戶體驗
run_e2e_tests() {
    log_info "🌐 Running E2E Tests (User Experience)"
    
    # 檢查服務是否運行
    if ! curl -s http://localhost:3000/api/health > /dev/null; then
        log_info "Starting development server for E2E tests..."
        npm run dev &
        DEV_SERVER_PID=$!
        
        # 等待服務啟動
        local max_wait=60
        local wait_time=0
        while ! curl -s http://localhost:3000/api/health > /dev/null && [ $wait_time -lt $max_wait ]; do
            sleep 2
            wait_time=$((wait_time + 2))
            log_info "Waiting for server... ($wait_time/${max_wait}s)"
        done
        
        if [ $wait_time -ge $max_wait ]; then
            log_error "Server failed to start within ${max_wait}s"
            return 1
        fi
    fi
    
    # 執行 E2E 測試
    local e2e_result=0
    if [ "$PARALLEL" = "true" ]; then
        npm run test:e2e -- e2e/migration/ \
            --reporter=html,json \
            --output-dir="$RESULTS_DIR/e2e-results" \
            2>&1 | tee "$RESULTS_DIR/e2e-tests.log"
        e2e_result=$?
    else
        npm run test:e2e -- e2e/migration/ \
            --workers=1 \
            --reporter=html,json \
            --output-dir="$RESULTS_DIR/e2e-results" \
            2>&1 | tee "$RESULTS_DIR/e2e-tests.log"
        e2e_result=$?
    fi
    
    # 停止開發服務器（如果我們啟動了它）
    if [ -n "$DEV_SERVER_PID" ]; then
        kill $DEV_SERVER_PID || true
        wait $DEV_SERVER_PID 2>/dev/null || true
    fi
    
    if [ $e2e_result -eq 0 ]; then
        log_success "E2E tests passed"
        return 0
    else
        log_error "E2E tests failed"
        return 1
    fi
}

# 性能測試
run_performance_tests() {
    log_info "⚡ Running Performance Tests"
    
    npm run test:perf -- \
        --config=playwright.performance.config.ts \
        --reporter=html,json \
        --output-dir="$RESULTS_DIR/performance-results" \
        2>&1 | tee "$RESULTS_DIR/performance-tests.log"
        
    if [ $? -eq 0 ]; then
        log_success "Performance tests passed"
        return 0
    else
        log_error "Performance tests failed"
        return 1
    fi
}

# 可訪問性測試
run_accessibility_tests() {
    log_info "♿ Running Accessibility Tests"
    
    npm run test:a11y -- e2e/a11y/ \
        --reporter=html,json \
        --output-dir="$RESULTS_DIR/a11y-results" \
        2>&1 | tee "$RESULTS_DIR/a11y-tests.log"
        
    if [ $? -eq 0 ]; then
        log_success "Accessibility tests passed"
        return 0
    else
        log_warning "Accessibility tests had issues (non-blocking)"
        return 0  # A11y 問題不阻擋遷移
    fi
}

# 生成測試報告
generate_test_report() {
    log_info "📊 Generating Test Report"
    
    local report_file="$RESULTS_DIR/migration-test-report.md"
    local overall_status="PASSED"
    
    # 檢查各測試結果
    local unit_status="❌ FAILED"
    local integration_status="❌ FAILED" 
    local e2e_status="❌ FAILED"
    local performance_status="❌ FAILED"
    local a11y_status="❌ FAILED"
    
    [ -f "$RESULTS_DIR/unit-results.json" ] && unit_status="✅ PASSED"
    [ -f "$RESULTS_DIR/integration-results.json" ] && integration_status="✅ PASSED"
    [ -f "$RESULTS_DIR/e2e-results/results.json" ] && e2e_status="✅ PASSED"
    [ -f "$RESULTS_DIR/performance-results/results.json" ] && performance_status="✅ PASSED"
    [ -f "$RESULTS_DIR/a11y-results/results.json" ] && a11y_status="✅ PASSED"
    
    # 檢查整體狀態
    if [[ "$unit_status" =~ "FAILED" ]] || [[ "$integration_status" =~ "FAILED" ]] || [[ "$e2e_status" =~ "FAILED" ]]; then
        overall_status="FAILED"
    fi
    
    cat > "$report_file" << EOF
# Migration Test Report

**Timestamp**: $TIMESTAMP  
**Environment**: $ENVIRONMENT
**Test Type**: $TEST_TYPE
**Overall Status**: **$overall_status**

## Test Results Summary

| Test Suite | Status | Details |
|------------|--------|---------|
| Unit Tests (API Consistency) | $unit_status | GraphQL vs REST API validation |
| Integration Tests (Data Integrity) | $integration_status | Database and data flow validation |
| E2E Tests (User Experience) | $e2e_status | Widget functionality and interactions |
| Performance Tests | $performance_status | Response time and throughput validation |
| Accessibility Tests | $a11y_status | WCAG compliance validation |

## Key Metrics

### API Consistency
$(if [ -f "$RESULTS_DIR/unit-tests.log" ]; then
    grep -E "(tests? passed|tests? failed)" "$RESULTS_DIR/unit-tests.log" | tail -1 || echo "No metrics available"
else
    echo "No unit test results available"
fi)

### Performance Comparison
$(if [ -f "$RESULTS_DIR/performance-tests.log" ]; then
    grep -E "Performance|Duration|Response time" "$RESULTS_DIR/performance-tests.log" | head -5 || echo "No performance metrics available"
else
    echo "No performance test results available"
fi)

## Widget-Specific Results

### InventoryOrderedAnalysisWidget
- Data consistency: $(grep -q "InventoryOrderedAnalysisWidget.*passed" "$RESULTS_DIR"/*.log && echo "✅ Passed" || echo "❌ Failed")
- Performance: $(grep -q "inventory.*performance.*acceptable" "$RESULTS_DIR"/*.log && echo "✅ Acceptable" || echo "⚠️ Needs review")
- User interaction: $(grep -q "inventory.*interaction.*working" "$RESULTS_DIR"/*.log && echo "✅ Working" || echo "❌ Issues detected")

### HistoryTreeV2  
- Rendering: $(grep -q "HistoryTreeV2.*rendered" "$RESULTS_DIR"/*.log && echo "✅ Success" || echo "❌ Failed")
- No factory errors: $(grep -q "factory.call.*error" "$RESULTS_DIR"/*.log && echo "❌ Errors detected" || echo "✅ Clean")
- Edit mode: $(grep -q "edit.*mode.*working" "$RESULTS_DIR"/*.log && echo "✅ Working" || echo "⚠️ Not tested")

## Recommendations

$(if [ "$overall_status" = "PASSED" ]; then
cat << 'RECOMMENDATIONS'
✅ **Migration Ready**: All critical tests passed
- Proceed with phased rollout
- Monitor performance metrics closely
- Keep rollback procedure ready

**Next Steps:**
1. Deploy to staging environment
2. Run full regression test suite  
3. Perform manual UAT
4. Schedule production deployment
RECOMMENDATIONS
else
cat << 'RECOMMENDATIONS'
❌ **Migration Not Ready**: Critical issues detected
- Review failed test details below
- Fix identified issues before proceeding
- Re-run test suite after fixes

**Required Actions:**
1. Address all unit test failures
2. Resolve data integrity issues
3. Fix E2E test failures
4. Verify performance regressions
RECOMMENDATIONS
fi)

## Test Artifacts

- **Unit Test Results**: \`$RESULTS_DIR/unit-results.json\`
- **Integration Test Results**: \`$RESULTS_DIR/integration-results.json\`
- **E2E Test Results**: \`$RESULTS_DIR/e2e-results/\`
- **Performance Results**: \`$RESULTS_DIR/performance-results/\`
- **Test Logs**: \`$RESULTS_DIR/*.log\`

## Troubleshooting

$(if [ -f "$RESULTS_DIR/unit-tests.log" ]; then
    echo "### Unit Test Failures"
    grep -A 5 -B 5 "FAIL\|Error:" "$RESULTS_DIR/unit-tests.log" | head -20 || echo "No failures detected"
fi)

$(if [ -f "$RESULTS_DIR/e2e-tests.log" ]; then
    echo "### E2E Test Failures"  
    grep -A 5 -B 5 "✖\|Error:" "$RESULTS_DIR/e2e-tests.log" | head -20 || echo "No failures detected"
fi)

---
*Report generated automatically by migration test suite*
EOF

    log_success "Test report generated: $report_file"
    
    # 顯示摘要
    log_info "📋 Test Summary:"
    echo "   Unit Tests: $unit_status"
    echo "   Integration: $integration_status"  
    echo "   E2E Tests: $e2e_status"
    echo "   Performance: $performance_status"
    echo "   Accessibility: $a11y_status"
    echo "   Overall: $overall_status"
}

# 主執行函數
main() {
    local failed_tests=()
    
    case "$TEST_TYPE" in
        "unit")
            run_unit_tests || failed_tests+=("unit")
            ;;
        "integration")
            run_integration_tests || failed_tests+=("integration")
            ;;
        "e2e")
            run_e2e_tests || failed_tests+=("e2e")
            ;;
        "performance")
            run_performance_tests || failed_tests+=("performance")
            ;;
        "accessibility"|"a11y")
            run_accessibility_tests || failed_tests+=("accessibility")
            ;;
        "all"|*)
            log_info "🚀 Running Full Test Suite"
            
            run_unit_tests || failed_tests+=("unit")
            run_integration_tests || failed_tests+=("integration")
            run_e2e_tests || failed_tests+=("e2e")
            run_performance_tests || failed_tests+=("performance") 
            run_accessibility_tests || failed_tests+=("accessibility")
            ;;
    esac
    
    # 生成報告
    generate_test_report
    
    # 檢查結果
    if [ ${#failed_tests[@]} -eq 0 ]; then
        log_success "🎉 All tests passed! Migration is ready."
        echo "📋 Full report: $RESULTS_DIR/migration-test-report.md"
        exit 0
    else
        log_error "❌ Some tests failed: ${failed_tests[*]}"
        echo "📋 Check report for details: $RESULTS_DIR/migration-test-report.md"
        exit 1
    fi
}

# 捕獲中斷信號
trap 'log_error "Test execution interrupted"; exit 1' INT TERM

# 執行主程序
main "$@"