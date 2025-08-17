# Run Testing For QC Card Label

## Command
`/test-qc-label [--iterations=4] [--headless=false] [--report=full]`

## Description
Automated end-to-end testing for QC Label Card functionality, including UI interaction, label generation, database verification, and comprehensive reporting.

## Target Component
- **Primary**: [QCLabelCard](../../app/(app)/admin/cards/QCLabelCard.tsx)
- **Purpose**: Verify QC label generation, printing workflow, and database synchronization
- **Coverage**: UI functionality, RPC calls, database updates, error handling

## Multi-Agent Assignment

### Core Testing Team
- **[test-automator](../agents/test-automator.md)** - Lead test execution and orchestration
- **[frontend-developer](../agents/frontend-developer.md)** - Validate UI/UX interactions
- **[database-admin](../agents/database-admin.md)** - Verify database transactions
- **[backend-architect](../agents/backend-architect.md)** - Validate RPC functions and API calls

### Support Team
- **[code-reviewer](../agents/code-reviewer.md)** - Review test code quality
- **[context-manager](../agents/context-manager.md)** - Maintain test context across iterations
- **[docs-architect](../agents/docs-architect.md)** - Generate comprehensive test documentation
- **[ui-ux-designer](../agents/ui-ux-designer.md)** - Validate user experience flows
- **[business-analyst](../agents/business-analyst.md)** - Verify business logic compliance

## Required Tools & Access

### Testing Infrastructure
- **Playwright** - Native framework (not through MCP) for browser automation
- **Supabase MCP** - Database verification and RPC function testing
- **Chrome Browser** - Primary testing environment
- **Test Data Generator** - For creating test scenarios

### Access Requirements
- [ ] Supabase database read/write access
- [ ] Test environment credentials
- [ ] RPC function execution permissions
- [ ] Test folder write permissions
- [ ] Browser automation permissions

## Pre-Test Configuration

### Environment Setup
```javascript
// Required environment variables
const testConfig = {
  login: {
    email: process.env.TEST_SYS_LOGIN,
    password: process.env.TEST_SYS_PASSWORD
  },
  database: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_KEY
  },
  paths: {
    testFolder: '/Users/chun/Documents/PennineWMS/online-stock-control-system/__tests__',
    reportFolder: '/Users/chun/Documents/PennineWMS/online-stock-control-system/docs/test/qc-label'
  },
  timeout: {
    navigation: 30000,
    action: 10000,
    verification: 5000
  }
};
```

### Validation Rules
- **NEVER** hardcode credentials in test files
- **ALWAYS** use environment variables
- **NO** physical print operations required
- **SIMULATE** single worker continuous operation
- **VERIFY** each action before proceeding

## Test Workflow

### Phase 0: Component Analysis & Understanding
```javascript
// Analyze component dependencies
const componentAnalysis = {
  rpcFunctions: [
    'generate_qc_label',
    'verify_clock_id',
    'update_label_status'
  ],
  relatedTables: [
    'qc_labels',
    'products',
    'operators',
    'pallet_tracking'
  ],
  uiComponents: [
    'QCLabelCard',
    'AnalysisCardSelector',
    'TabSelectorCard'
  ],
  businessLogic: [
    'Label generation rules',
    'Clock ID verification',
    'Pallet count validation'
  ]
};
```

**Verification Checklist:**
- [ ] All RPC functions documented and understood
- [ ] Database schema relationships mapped
- [ ] UI flow diagrams created
- [ ] Business rules validated
- [ ] Error scenarios identified

### Phase 1: System Authentication
```javascript
// Login flow
await test('System Login', async ({ page }) => {
  // Navigate to login page
  await page.goto('app/(auth)/main-login/page.tsx');
  
  // Enter credentials
  await page.fill('[data-testid="email-input"]', process.env.TEST_SYS_LOGIN);
  await page.fill('[data-testid="password-input"]', process.env.TEST_SYS_PASSWORD);
  
  // Submit and verify
  await page.click('[data-testid="login-button"]');
  await page.waitForSelector('[data-testid="dashboard"]', { timeout: 30000 });
  
  // Verify authentication token
  const token = await page.evaluate(() => localStorage.getItem('auth-token'));
  expect(token).toBeTruthy();
});
```

**Success Criteria:**
- Login completes within 30 seconds
- Dashboard loads successfully
- Authentication token stored
- User session established

### Phase 2: Navigation to Target Component
```javascript
// Navigation flow
await test('Navigate to QC Label Card', async ({ page }) => {
  // Step 1: Open card selector
  await page.click('[data-testid="cards-selector"]');
  await page.waitForSelector('.card-selector-modal');
  
  // Step 2: Select QC category
  await page.click('[data-testid="qc-category"]');
  
  // Step 3: Select Label Card tab
  await page.click('[data-testid="tab-selector"]');
  await page.click('[data-testid="qc-label-tab"]');
  
  // Verify correct component loaded
  await expect(page.locator('.qc-label-card')).toBeVisible();
});
```

### Phase 3: Test Execution Matrix

#### Test Data Sets
```javascript
const testCases = [
  {
    testId: 1,
    productCode: 'MEP9090150',
    quantity: 20,
    palletCount: 1,
    operator: '',
    expectedClockId: '5997',
    validation: {
      checkInventory: true,
      verifyLabel: true,
      confirmDatabase: true
    }
  },
  {
    testId: 2,
    productCode: 'ME4545150',
    quantity: 20,
    palletCount: 2,
    operator: '',
    expectedClockId: '6001',
    validation: {
      checkInventory: true,
      verifyLabel: true,
      confirmDatabase: true
    }
  },
  {
    testId: 3,
    productCode: 'MEL4545A',
    quantity: 20,
    palletCount: 3,
    operator: '',
    expectedClockId: '5667',
    validation: {
      checkInventory: true,
      verifyLabel: true,
      confirmDatabase: true
    }
  },
  {
    testId: 4,
    productCode: 'MEL6060A',
    quantity: 20,
    palletCount: 2,
    operator: '',
    expectedClockId: '5997',
    validation: {
      checkInventory: true,
      verifyLabel: true,
      confirmDatabase: true
    }
  }
];
```

#### Test Execution Loop
```javascript
for (const testCase of testCases) {
  await test(`QC Label Test Case #${testCase.testId}`, async ({ page }) => {
    // Clear previous inputs
    await page.click('[data-testid="clear-form"]');
    
    // Input test data
    await page.fill('[data-testid="product-code"]', testCase.productCode);
    await page.fill('[data-testid="quantity"]', testCase.quantity.toString());
    await page.fill('[data-testid="pallet-count"]', testCase.palletCount.toString());
    
    if (testCase.operator) {
      await page.fill('[data-testid="operator"]', testCase.operator);
    }
    
    // Pre-submission validation
    await validateFormState(page, testCase);
    
    // Submit form
    await page.click('[data-testid="print-label-button"]');
    
    // Wait for processing
    await page.waitForSelector('.label-generation-complete', { timeout: 10000 });
    
    // Verify Clock ID
    await page.fill('[data-testid="verified-clock-id"]', testCase.expectedClockId);
    await page.click('[data-testid="verify-clock-id"]');
    
    // Capture results
    const result = await captureTestResult(page, testCase);
    testResults.push(result);
  });
}
```

### Phase 4: Database Verification
```sql
-- Verify label generation
SELECT 
  l.id,
  l.product_code,
  l.quantity,
  l.pallet_count,
  l.operator_id,
  l.clock_id,
  l.created_at,
  l.status
FROM qc_labels l
WHERE l.created_at >= '[test_start_time]'
ORDER BY l.created_at DESC;

-- Verify inventory updates
SELECT 
  i.product_code,
  i.quantity_before,
  i.quantity_after,
  i.transaction_type,
  i.reference_id
FROM inventory_transactions i
WHERE i.created_at >= '[test_start_time]'
  AND i.transaction_type = 'QC_LABEL';

-- Verify pallet tracking
SELECT 
  p.pallet_id,
  p.product_code,
  p.quantity,
  p.status,
  p.location
FROM pallet_tracking p
WHERE p.created_at >= '[test_start_time]';
```

**Database Validation Checklist:**
- [ ] Labels created with correct data
- [ ] Inventory quantities updated
- [ ] Pallet records generated
- [ ] Transaction logs complete
- [ ] No orphaned records
- [ ] Referential integrity maintained

### Phase 5: Error Handling & Edge Cases

#### Error Scenarios to Test
```javascript
const errorScenarios = [
  {
    name: 'Invalid Product Code',
    input: { productCode: 'INVALID123' },
    expectedError: 'Product code not found',
    recovery: 'Clear form and retry'
  },
  {
    name: 'Negative Quantity',
    input: { quantity: -10 },
    expectedError: 'Quantity must be positive',
    recovery: 'Validation prevents submission'
  },
  {
    name: 'Duplicate Clock ID',
    input: { clockId: '5997' },
    expectedError: 'Clock ID already verified',
    recovery: 'Alert user, log attempt'
  },
  {
    name: 'Network Timeout',
    simulation: 'throttle_network',
    expectedBehavior: 'Retry mechanism activates',
    recovery: 'Auto-retry with exponential backoff'
  }
];
```

### Phase 6: Performance Metrics Collection
```javascript
const performanceMetrics = {
  pageLoad: [],
  formSubmission: [],
  labelGeneration: [],
  clockIdVerification: [],
  databaseUpdate: []
};

// Collect metrics during test
await page.evaluate(() => {
  performance.mark('label-generation-start');
  // ... operation
  performance.mark('label-generation-end');
  performance.measure('label-generation', 
    'label-generation-start', 
    'label-generation-end'
  );
});
```

## Test Report Template

### Report Generation
```javascript
const generateReport = async (testResults) => {
  const report = {
    metadata: {
      testDate: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      browser: 'Chrome',
      totalTests: testResults.length,
      passed: testResults.filter(r => r.status === 'passed').length,
      failed: testResults.filter(r => r.status === 'failed').length
    },
    results: testResults,
    performance: performanceMetrics,
    database: databaseValidation,
    recommendations: generateRecommendations(testResults)
  };
  
  const reportPath = `${config.paths.reportFolder}/${formatDate()}-test-result.md`;
  await writeReport(reportPath, report);
};
```

### Enhanced Report Structure

```markdown
# QCLabelCard Test Report

**Test Date**: [YYYY-MM-DD HH:MM:SS]
**Test ID**: [UUID]
**Environment**: [Development/Staging/Production]

---

## 📋 Executive Summary

### Overall Results
| Metric | Value | Status |
|--------|-------|--------|
| Total Test Cases | [N] | - |
| Passed | [N] | ✅ |
| Failed | [N] | ❌ |
| Skipped | [N] | ⏭️ |
| Success Rate | [%] | [🟢/🟡/🔴] |
| Total Duration | [HH:MM:SS] | - |

### Critical Findings
1. [Finding 1 with severity]
2. [Finding 2 with severity]
3. [Finding 3 with severity]

---

## 🔬 Detailed Test Results

### Test Case Results

[Detailed table for each test case with all fields]

### Performance Analysis

#### Response Time Distribution
| Operation | P50 | P90 | P95 | P99 | Max |
|-----------|-----|-----|-----|-----|-----|
| Page Load | [ms] | [ms] | [ms] | [ms] | [ms] |
| Label Generation | [ms] | [ms] | [ms] | [ms] | [ms] |
| Database Update | [ms] | [ms] | [ms] | [ms] | [ms] |

#### Performance Trends
[Graph or ASCII chart showing performance over test iterations]

---

## 🗄️ Database Verification

### Data Integrity Check
| Table | Records Created | Records Updated | Orphaned Records | Status |
|-------|----------------|-----------------|------------------|--------|
| qc_labels | [N] | [N] | [N] | [✅/❌] |
| inventory_transactions | [N] | [N] | [N] | [✅/❌] |
| pallet_tracking | [N] | [N] | [N] | [✅/❌] |

### Transaction Consistency
- Atomicity: [✅/❌] All operations completed or rolled back
- Consistency: [✅/❌] Data constraints maintained
- Isolation: [✅/❌] No transaction conflicts
- Durability: [✅/❌] Changes persisted correctly

---

## 🐛 Issues & Bugs

### Critical Issues
[List of critical issues that block functionality]

### Major Issues
[List of major issues affecting user experience]

### Minor Issues
[List of minor issues and improvements]

---

## 📊 Test Coverage Analysis

### Functional Coverage
- Core Functionality: [%]
- Edge Cases: [%]
- Error Handling: [%]
- Integration Points: [%]

### Code Coverage
- Line Coverage: [%]
- Branch Coverage: [%]
- Function Coverage: [%]

---

## 🎯 Recommendations

### Immediate Actions
1. [Action with priority and owner]

### Short-term Improvements
1. [Improvement with timeline]

### Long-term Enhancements
1. [Enhancement with benefits]

---

## 📎 Attachments & Artifacts

- Test Script: `[path]`
- Screenshots: `[folder]`
- Video Recording: `[path]`
- Performance Traces: `[path]`
- Database Logs: `[path]`

---

## ✅ Sign-off

| Role | Name | Status | Date |
|------|------|--------|------|
| Test Lead | [Name] | [Approved/Pending] | [Date] |
| QA Manager | [Name] | [Approved/Pending] | [Date] |
| Product Owner | [Name] | [Approved/Pending] | [Date] |

---

*Report generated automatically by Test Automation Framework*
*Version: [Version] | Build: [Build Number]*
```

## Post-Test Actions

### Cleanup Operations
```javascript
// Clean test data
await cleanupTestData();

// Reset test environment
await resetEnvironment();

// Archive test artifacts
await archiveTestResults();

// Notify stakeholders
await sendTestNotifications();
```

### Success Criteria

The test is considered successful when:
- [ ] All 4 test iterations complete without fatal errors
- [ ] Database updates verified for all transactions
- [ ] Performance metrics within acceptable thresholds
- [ ] No data integrity issues detected
- [ ] Test report generated and saved
- [ ] All artifacts collected and archived

## Command Options

```bash
# Standard test run
/test-qc-label

# Run with specific iterations
/test-qc-label --iterations=10

# Headless mode for CI/CD
/test-qc-label --headless=true

# Quick smoke test
/test-qc-label --mode=smoke --iterations=1

# Full regression test
/test-qc-label --mode=regression --iterations=20

# Debug mode with verbose logging
/test-qc-label --debug=true --slowmo=500
```

## Error Recovery Strategies

1. **Network Failures**: Automatic retry with exponential backoff
2. **Element Not Found**: Wait and retry with alternative selectors
3. **Database Lock**: Queue and retry after delay
4. **Browser Crash**: Restart browser and resume from checkpoint
5. **Test Data Conflict**: Generate unique test data per run

## Integration Points

- **CI/CD Pipeline**: Trigger on code changes to QCLabelCard
- **Monitoring**: Send metrics to monitoring dashboard
- **Alerting**: Notify team on test failures
- **Documentation**: Auto-update test documentation
- **Issue Tracking**: Create tickets for identified bugs

---

**Note**: This test suite is designed for comprehensive validation of the QC Label Card functionality. Always ensure test environment is properly configured before execution.