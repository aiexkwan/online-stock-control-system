/**
 * Jest 測試性能監控工具
 * 
 * 功能：
 * - 監控測試執行時間
 * - 識別慢測試
 * - 生成性能報告
 */

interface TestPerformanceData {
  suiteName: string;
  testName: string;
  duration: number;
  status: 'passed' | 'failed' | 'skipped';
  timestamp: number;
}

class TestPerformanceMonitor {
  private performanceData: TestPerformanceData[] = [];
  private slowTestThreshold = 5000; // 5 seconds
  
  startTest(suiteName: string, testName: string): number {
    return performance.now();
  }
  
  endTest(
    suiteName: string, 
    testName: string, 
    startTime: number, 
    status: 'passed' | 'failed' | 'skipped'
  ) {
    const duration = performance.now() - startTime;
    
    this.performanceData.push({
      suiteName,
      testName,
      duration,
      status,
      timestamp: Date.now(),
    });
    
    // 警告慢測試
    if (duration > this.slowTestThreshold) {
      console.warn(`⚠️  Slow test detected: ${suiteName} > ${testName} (${duration.toFixed(2)}ms)`);
    }
  }
  
  getSlowTests(threshold?: number): TestPerformanceData[] {
    const limit = threshold || this.slowTestThreshold;
    return this.performanceData
      .filter(test => test.duration > limit)
      .sort((a, b) => b.duration - a.duration);
  }
  
  generateReport(): string {
    const totalTests = this.performanceData.length;
    const slowTests = this.getSlowTests();
    const avgDuration = this.performanceData.reduce((sum, test) => sum + test.duration, 0) / totalTests;
    
    return `
📊 Jest Performance Report
========================
Total Tests: ${totalTests}
Average Duration: ${avgDuration.toFixed(2)}ms
Slow Tests (>${this.slowTestThreshold}ms): ${slowTests.length}

🐌 Slowest Tests:
${slowTests.slice(0, 10).map(test => 
  `  ${test.suiteName} > ${test.testName}: ${test.duration.toFixed(2)}ms`
).join('\n')}

💡 Optimization Suggestions:
${slowTests.length > 0 ? `
  - Consider splitting large test suites
  - Mock expensive operations
  - Use beforeAll/afterAll for setup
  - Enable parallel execution
` : '  All tests are performing well! 🎉'}
    `.trim();
  }
  
  reset() {
    this.performanceData = [];
  }
}

export const testPerformanceMonitor = new TestPerformanceMonitor();

// Jest hook integration
export const withPerformanceMonitoring = (suiteName: string) => {
  let testStartTime: number;
  
  beforeEach(() => {
    const testName = expect.getState().currentTestName || 'unknown';
    testStartTime = testPerformanceMonitor.startTest(suiteName, testName);
  });
  
  afterEach(() => {
    const testName = expect.getState().currentTestName || 'unknown';
    const status = expect.getState().assertionCalls > 0 ? 'passed' : 'skipped';
    testPerformanceMonitor.endTest(suiteName, testName, testStartTime, status);
  });
  
  afterAll(() => {
    if (process.env.NODE_ENV === 'test' && process.env.JEST_PERFORMANCE_REPORT) {
      console.log(testPerformanceMonitor.generateReport());
    }
  });
};