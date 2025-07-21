# Testing Guidelines

## Important Testing Rules

### 1. Always Run Tests to Completion
- **NEVER** give up after first failure
- If test fails due to connection/timing issues, retry with appropriate fixes
- Common issues and solutions:
  - Connection refused → Check if server is running, start if needed
  - Timeout errors → Increase timeout values
  - Element not found → Add appropriate wait times

### 2. Test Execution Checklist
- [ ] Ensure development server is running (`npm run dev`)
- [ ] Wait for server to be fully ready before running tests
- [ ] Run test with appropriate timeouts
- [ ] If test fails, diagnose the issue and retry
- [ ] Take screenshots for verification
- [ ] Only summarize AFTER successful test completion

### 3. Common Test Fixes
```javascript
// Add longer waits for server startup
await new Promise(resolve => setTimeout(resolve, 5000));

// Add retry logic for connections
let retries = 3;
while (retries > 0) {
  try {
    await page.goto(url);
    break;
  } catch (error) {
    retries--;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Increase timeouts for slow operations
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
```

### 4. Test Verification Steps
1. Visual confirmation (screenshots)
2. Console output verification
3. DOM state verification
4. User interaction simulation
5. Edge case testing

### 5. Never Skip to Summary
- Complete all test scenarios
- Document actual results, not assumptions
- Include evidence (screenshots, logs)
- Only summarize after full verification

## Example Test Pattern
```javascript
async function robustTest() {
  let testPassed = false;
  let attempts = 0;

  while (!testPassed && attempts < 3) {
    try {
      // Run test steps
      await runTestSteps();
      testPassed = true;
    } catch (error) {
      attempts++;
      console.log(`Attempt ${attempts} failed: ${error.message}`);
      if (attempts < 3) {
        console.log('Retrying...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  if (!testPassed) {
    throw new Error('Test failed after 3 attempts');
  }
}
```
