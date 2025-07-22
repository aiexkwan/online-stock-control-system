/**
 * Performance Test Utilities
 * @types-migration:todo(phase2) [P1] 完善性能測試工具的類型定義 - Owner: @performance-team
 */

// 導入性能測試類型 (已遷移到 @/types/utils/performance)
import type {
  PerformanceResult,
  PerformanceReport,
  PerformanceComparison,
} from '@/types/utils/performance';

class PerformanceTest {
  private results: PerformanceResult[] = [];

  addResult(result: PerformanceResult): void {
    this.results.push(result);
  }

  generateReport(): string {
    const report: PerformanceReport = {
      timestamp: Date.now(),
      results: this.results,
      summary: {
        total: this.results.length,
        success: this.results.filter(r => r.status === 'success').length,
        warning: this.results.filter(r => r.status === 'warning').length,
        error: this.results.filter(r => r.status === 'error').length,
        averageDuration:
          this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length || 0,
      },
    };

    return JSON.stringify(report, null, 2);
  }

  clear(): void {
    this.results = [];
  }
}

export const performanceTest = new PerformanceTest();

export function runPerformanceTest(): void {
  // @types-migration:todo(phase2) [P1] 實現真實的性能測試邏輯 - Target: 2025-02
  console.log('Performance test started...');
}

export function comparePerformance(results: PerformanceResult[]): PerformanceComparison {
  // @types-migration:todo(phase2) [P1] 實現性能比較邏輯 - Target: 2025-02
  return {
    improved: [],
    degraded: [],
    unchanged: results,
  };
}
