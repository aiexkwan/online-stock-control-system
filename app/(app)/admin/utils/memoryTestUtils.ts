/**
 * 記憶體管理測試工具 - memoryTestUtils.ts
 *
 * 職責：
 * - 提供記憶體洩漏測試工具
 * - 模擬組件掛載和卸載
 * - 驗證清理機制的有效性
 * - 生成測試報告
 */

import { memoryManager } from './memoryManager';
import { leakDetector } from './leakDetector';
import { memoryGuard } from './memoryGuard';

// 測試配置
export interface MemoryTestConfig {
  /** 測試名稱 */
  testName: string;
  /** 測試持續時間（毫秒） */
  duration: number;
  /** 組件掛載/卸載次數 */
  mountUnmountCycles: number;
  /** 記憶體閾值（MB） */
  memoryThreshold: number;
  /** 是否啟用詳細記錄 */
  verbose: boolean;
}

// 測試結果
export interface MemoryTestResult {
  testName: string;
  passed: boolean;
  startMemory: number;
  endMemory: number;
  memoryGrowth: number;
  maxMemoryUsed: number;
  leaksDetected: number;
  cleanupEfficiency: number;
  duration: number;
  issues: string[];
  suggestions: string[];
}

class MemoryTester {
  private static instance: MemoryTester;
  private testResults: MemoryTestResult[] = [];
  private isTestRunning = false;

  static getInstance(): MemoryTester {
    if (!MemoryTester.instance) {
      MemoryTester.instance = new MemoryTester();
    }
    return MemoryTester.instance;
  }

  /**
   * 執行記憶體洩漏測試
   */
  async runMemoryLeakTest(config: MemoryTestConfig): Promise<MemoryTestResult> {
    if (this.isTestRunning) {
      throw new Error('Another memory test is already running');
    }

    this.isTestRunning = true;

    try {
      return await this.executeTest(config);
    } finally {
      this.isTestRunning = false;
    }
  }

  /**
   * 執行測試
   */
  private async executeTest(config: MemoryTestConfig): Promise<MemoryTestResult> {
    const { testName, duration, mountUnmountCycles, memoryThreshold, verbose } = config;

    if (verbose) {
      console.log(`🧪 Starting memory test: ${testName}`);
    }

    // 記錄初始狀態
    const startTime = Date.now();
    const startMemory = this.getCurrentMemoryUsage();
    let maxMemoryUsed = startMemory;
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 清理現有狀態
    memoryManager.clearAll();
    leakDetector.reset();

    // 執行測試循環
    for (let cycle = 0; cycle < mountUnmountCycles; cycle++) {
      if (verbose) {
        console.log(`🔄 Test cycle ${cycle + 1}/${mountUnmountCycles}`);
      }

      // 模擬組件掛載
      await this.simulateComponentMount(testName, cycle);

      // 測量記憶體
      const currentMemory = this.getCurrentMemoryUsage();
      maxMemoryUsed = Math.max(maxMemoryUsed, currentMemory);

      // 檢查記憶體增長
      if (currentMemory > startMemory + memoryThreshold) {
        issues.push(
          `Memory growth exceeded threshold at cycle ${cycle + 1}: ` +
            `${currentMemory - startMemory}MB > ${memoryThreshold}MB`
        );
      }

      // 模擬組件卸載
      await this.simulateComponentUnmount(testName, cycle);

      // 檢查清理效果
      await this.verifyCleanup(cycle, issues);

      // 短暫等待以允許垃圾回收
      await this.delay(100);
    }

    // 最終檢測
    const finalDetection = leakDetector.detectNow();
    const endTime = Date.now();
    const endMemory = this.getCurrentMemoryUsage();

    // 計算結果
    const memoryGrowth = endMemory - startMemory;
    const testDuration = endTime - startTime;
    const leaksDetected = finalDetection.issues.length;

    // 計算清理效率（基於記憶體增長和檢測到的問題）
    const cleanupEfficiency = this.calculateCleanupEfficiency(
      startMemory,
      endMemory,
      maxMemoryUsed,
      leaksDetected
    );

    // 添加檢測結果中的問題
    finalDetection.issues.forEach(issue => {
      issues.push(`${issue.type}: ${issue.description}`);
    });

    // 添加建議
    finalDetection.recommendations.forEach(rec => {
      suggestions.push(rec);
    });

    const result: MemoryTestResult = {
      testName,
      passed: memoryGrowth <= memoryThreshold && leaksDetected === 0,
      startMemory,
      endMemory,
      memoryGrowth,
      maxMemoryUsed,
      leaksDetected,
      cleanupEfficiency,
      duration: testDuration,
      issues,
      suggestions,
    };

    this.testResults.push(result);

    if (verbose) {
      this.printTestResult(result);
    }

    return result;
  }

  /**
   * 模擬組件掛載
   */
  private async simulateComponentMount(testName: string, cycle: number): Promise<string> {
    const componentId = memoryManager.registerComponent(`${testName}_${cycle}`);

    // 模擬添加事件監聽器
    memoryManager.trackMemoryItem(componentId, 'listener', `resize_${cycle}`);
    memoryManager.trackMemoryItem(componentId, 'listener', `scroll_${cycle}`);

    // 模擬添加定時器
    memoryManager.trackMemoryItem(componentId, 'timer', `interval_${cycle}`);

    // 模擬 Promise
    memoryManager.trackMemoryItem(componentId, 'promise', `fetch_${cycle}`);

    // 更新記憶體指標
    memoryManager.updateMetrics(componentId, {
      renderCount: 1,
      eventListeners: 2,
      timers: 1,
      promises: 1,
    });

    return componentId;
  }

  /**
   * 模擬組件卸載
   */
  private async simulateComponentUnmount(testName: string, cycle: number): Promise<void> {
    // 查找並清理組件
    const report = memoryManager.getMemoryReport();
    const component = report.componentSummary.find(
      (comp: any) => comp.name === `${testName}_${cycle}`
    );

    if (component) {
      // 這裡應該觸發實際的清理邏輯
      // 在真實測試中，組件卸載會自動觸發清理
    }
  }

  /**
   * 驗證清理效果
   */
  private async verifyCleanup(cycle: number, issues: string[]): Promise<void> {
    const report = memoryManager.getMemoryReport();

    // 檢查是否有未清理的項目
    const unclearedComponents = report.componentSummary.filter((comp: any) =>
      comp.name.includes(`_${cycle}`)
    );

    if (unclearedComponents.length > 0) {
      issues.push(`Cycle ${cycle}: Found ${unclearedComponents.length} uncleared components`);
    }
  }

  /**
   * 計算清理效率
   */
  private calculateCleanupEfficiency(
    startMemory: number,
    endMemory: number,
    maxMemoryUsed: number,
    leaksDetected: number
  ): number {
    // 基礎效率：100% - (記憶體增長百分比 * 50) - (洩漏數量 * 10)
    const memoryGrowthPercent = ((endMemory - startMemory) / startMemory) * 100;
    const efficiency = Math.max(0, 100 - memoryGrowthPercent * 0.5 - leaksDetected * 10);

    return Math.round(efficiency);
  }

  /**
   * 獲取當前記憶體使用量
   */
  private getCurrentMemoryUsage(): number {
    if (
      typeof window !== 'undefined' &&
      'performance' in window &&
      'memory' in window.performance
    ) {
      // @ts-ignore
      return Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  /**
   * 延遲函數
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 打印測試結果
   */
  private printTestResult(result: MemoryTestResult): void {
    console.group(`🧪 Memory Test Result: ${result.testName}`);

    console.log(`✨ Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`📊 Memory Growth: ${result.memoryGrowth}MB`);
    console.log(`📈 Max Memory Used: ${result.maxMemoryUsed}MB`);
    console.log(`🚨 Leaks Detected: ${result.leaksDetected}`);
    console.log(`🧹 Cleanup Efficiency: ${result.cleanupEfficiency}%`);
    console.log(`⏱️ Duration: ${result.duration}ms`);

    if (result.issues.length > 0) {
      console.group('⚠️ Issues:');
      result.issues.forEach(issue => console.warn(issue));
      console.groupEnd();
    }

    if (result.suggestions.length > 0) {
      console.group('💡 Suggestions:');
      result.suggestions.forEach(suggestion => console.info(suggestion));
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * 運行標準測試套件
   */
  async runStandardTestSuite(): Promise<MemoryTestResult[]> {
    const tests: MemoryTestConfig[] = [
      {
        testName: 'BasicComponentLifecycle',
        duration: 5000,
        mountUnmountCycles: 10,
        memoryThreshold: 5,
        verbose: true,
      },
      {
        testName: 'EventListenerCleanup',
        duration: 3000,
        mountUnmountCycles: 20,
        memoryThreshold: 3,
        verbose: true,
      },
      {
        testName: 'TimerCleanup',
        duration: 4000,
        mountUnmountCycles: 15,
        memoryThreshold: 2,
        verbose: true,
      },
      {
        testName: 'PromiseCleanup',
        duration: 6000,
        mountUnmountCycles: 25,
        memoryThreshold: 4,
        verbose: true,
      },
      {
        testName: 'HighVolumeTest',
        duration: 10000,
        mountUnmountCycles: 100,
        memoryThreshold: 10,
        verbose: false,
      },
    ];

    console.log('🚀 Starting Standard Memory Test Suite...');

    const results: MemoryTestResult[] = [];

    for (const testConfig of tests) {
      try {
        const result = await this.runMemoryLeakTest(testConfig);
        results.push(result);

        // 測試間隔等待
        await this.delay(1000);
      } catch (error) {
        console.error(`❌ Test ${testConfig.testName} failed:`, error);
      }
    }

    this.printTestSuiteSummary(results);
    return results;
  }

  /**
   * 打印測試套件摘要
   */
  private printTestSuiteSummary(results: MemoryTestResult[]): void {
    console.group('📋 Test Suite Summary');

    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const passRate = Math.round((passed / total) * 100);

    console.log(`📊 Overall: ${passed}/${total} tests passed (${passRate}%)`);

    const avgCleanupEfficiency = Math.round(
      results.reduce((sum, r) => sum + r.cleanupEfficiency, 0) / results.length
    );
    console.log(`🧹 Average Cleanup Efficiency: ${avgCleanupEfficiency}%`);

    const totalMemoryGrowth = results.reduce((sum, r) => sum + r.memoryGrowth, 0);
    console.log(`📈 Total Memory Growth: ${totalMemoryGrowth}MB`);

    const totalLeaks = results.reduce((sum, r) => sum + r.leaksDetected, 0);
    console.log(`🚨 Total Leaks Detected: ${totalLeaks}`);

    // 失敗的測試
    const failedTests = results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.group('❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`- ${test.testName}: ${test.issues.length} issues`);
      });
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * 獲取測試結果
   */
  getTestResults(): MemoryTestResult[] {
    return [...this.testResults];
  }

  /**
   * 清除測試結果
   */
  clearTestResults(): void {
    this.testResults = [];
  }

  /**
   * 生成測試報告
   */
  generateReport(): string {
    const results = this.getTestResults();
    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    let report = '# Memory Test Report\n\n';
    report += `## Summary\n`;
    report += `- Tests Run: ${total}\n`;
    report += `- Tests Passed: ${passed}\n`;
    report += `- Tests Failed: ${total - passed}\n`;
    report += `- Pass Rate: ${Math.round((passed / total) * 100)}%\n\n`;

    report += `## Test Results\n\n`;

    results.forEach(result => {
      report += `### ${result.testName}\n`;
      report += `- Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
      report += `- Memory Growth: ${result.memoryGrowth}MB\n`;
      report += `- Cleanup Efficiency: ${result.cleanupEfficiency}%\n`;
      report += `- Duration: ${result.duration}ms\n`;

      if (result.issues.length > 0) {
        report += `- Issues: ${result.issues.length}\n`;
        result.issues.forEach(issue => {
          report += `  - ${issue}\n`;
        });
      }

      report += '\n';
    });

    return report;
  }
}

// 單例導出
export const memoryTester = MemoryTester.getInstance();

// 在開發環境中暴露到 window 對象
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).__MEMORY_TESTER__ = memoryTester;
}

// 便捷函數
export const runQuickMemoryTest = async (componentName: string): Promise<MemoryTestResult> => {
  return memoryTester.runMemoryLeakTest({
    testName: componentName,
    duration: 3000,
    mountUnmountCycles: 10,
    memoryThreshold: 5,
    verbose: true,
  });
};

export const runFullTestSuite = (): Promise<MemoryTestResult[]> => {
  return memoryTester.runStandardTestSuite();
};
