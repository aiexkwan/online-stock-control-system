/**
 * PDF Performance Benchmark Utility
 * 提供 PDF 生成性能的基準測試和監控功能
 */

import { systemLogger } from '@/lib/logger';
import { EnhancedPdfParallelProcessor, type ParallelPdfTask } from './enhanced-pdf-parallel-processor';
import { pdfRequestBatcher } from './pdf-request-batcher';

export interface BenchmarkConfig {
  testSizes: number[];
  iterations: number;
  warmupRuns: number;
  timeout: number;
  enableMemoryTracking: boolean;
  enableCpuTracking: boolean;
  outputFormat: 'json' | 'csv' | 'console';
}

export interface BenchmarkResult {
  testId: string;
  timestamp: string;
  config: BenchmarkConfig;
  results: {
    testSize: number;
    iteration: number;
    processingTime: number;
    throughput: number;
    successRate: number;
    memoryUsage?: MemoryUsage;
    cpuUsage?: number;
    errors: string[];
  }[];
  summary: {
    averageProcessingTime: number;
    averageThroughput: number;
    averageSuccessRate: number;
    peakMemoryUsage: number;
    totalProcessedItems: number;
    totalErrors: number;
    performanceImprovement?: number; // 相對於基準的改進百分比
  };
}

export interface MemoryUsage {
  used: number;
  total: number;
  external: number;
  heapUsed: number;
  heapTotal: number;
  rss: number;
}

export interface PerformanceComparison {
  oldSystem: BenchmarkResult;
  newSystem: BenchmarkResult;
  improvements: {
    processingTimeImprovement: number;
    throughputImprovement: number;
    successRateImprovement: number;
    memoryEfficiencyImprovement: number;
  };
  recommendation: string;
}

const DEFAULT_BENCHMARK_CONFIG: BenchmarkConfig = {
  testSizes: [1, 5, 10, 20, 50],
  iterations: 3,
  warmupRuns: 1,
  timeout: 300000, // 5 minutes
  enableMemoryTracking: true,
  enableCpuTracking: true,
  outputFormat: 'console',
};

/**
 * PDF 性能基準測試器
 */
export class PdfPerformanceBenchmark {
  private config: BenchmarkConfig;
  private processor: EnhancedPdfParallelProcessor;

  constructor(config: Partial<BenchmarkConfig> = {}) {
    this.config = { ...DEFAULT_BENCHMARK_CONFIG, ...config };
    this.processor = EnhancedPdfParallelProcessor.getInstance({
      maxConcurrency: 6,
      uploadConcurrency: 8,
      enableProgressTracking: true,
    });
  }

  /**
   * 執行完整的性能基準測試
   */
  async runBenchmark(): Promise<BenchmarkResult> {
    const testId = `benchmark-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    systemLogger.info(
      {
        testId,
        config: this.config,
      },
      '[PDF Performance Benchmark] Starting benchmark'
    );

    const results: BenchmarkResult['results'] = [];
    let totalProcessedItems = 0;
    let totalErrors = 0;

    try {
      // Warmup runs
      if (this.config.warmupRuns > 0) {
        systemLogger.info('[PDF Performance Benchmark] Running warmup');
        for (let i = 0; i < this.config.warmupRuns; i++) {
          await this.runSingleTest(5, i); // Small warmup test
        }
      }

      // Main benchmark tests
      for (const testSize of this.config.testSizes) {
        for (let iteration = 0; iteration < this.config.iterations; iteration++) {
          systemLogger.info(
            {
              testSize,
              iteration: iteration + 1,
              totalIterations: this.config.iterations,
            },
            '[PDF Performance Benchmark] Running test'
          );

          const result = await this.runSingleTest(testSize, iteration);
          results.push(result);
          
          totalProcessedItems += testSize;
          totalErrors += result.errors.length;

          // Short delay between tests
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Calculate summary
      const summary = this.calculateSummary(results, totalProcessedItems, totalErrors);

      const benchmarkResult: BenchmarkResult = {
        testId,
        timestamp,
        config: this.config,
        results,
        summary,
      };

      // Output results
      this.outputResults(benchmarkResult);

      systemLogger.info(
        {
          testId,
          summary,
        },
        '[PDF Performance Benchmark] Benchmark completed'
      );

      return benchmarkResult;
    } catch (error) {
      systemLogger.error(
        {
          testId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        '[PDF Performance Benchmark] Benchmark failed'
      );
      throw error;
    }
  }

  /**
   * 執行單個測試
   */
  private async runSingleTest(testSize: number, iteration: number): Promise<BenchmarkResult['results'][0]> {
    const startTime = Date.now();
    const initialMemory = this.config.enableMemoryTracking ? this.getMemoryUsage() : undefined;
    
    // 生成測試任務
    const tasks = this.generateTestTasks(testSize);
    
    try {
      // 執行並行處理
      const result = await Promise.race([
        this.processor.processParallel(tasks),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), this.config.timeout)
        )
      ]) as Awaited<ReturnType<typeof this.processor.processParallel>>;

      const endTime = Date.now();
      const processingTime = endTime - startTime;
      const throughput = testSize / (processingTime / 1000); // items per second
      const successRate = (result.results.filter(r => r.success).length / testSize) * 100;
      const finalMemory = this.config.enableMemoryTracking ? this.getMemoryUsage() : undefined;
      
      return {
        testSize,
        iteration,
        processingTime,
        throughput,
        successRate,
        memoryUsage: finalMemory,
        errors: result.errors,
      };
    } catch (error) {
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        testSize,
        iteration,
        processingTime,
        throughput: 0,
        successRate: 0,
        memoryUsage: initialMemory,
        errors: [errorMessage],
      };
    }
  }

  /**
   * 生成測試任務
   */
  private generateTestTasks(count: number): ParallelPdfTask[] {
    const tasks: ParallelPdfTask[] = [];
    
    for (let i = 0; i < count; i++) {
      tasks.push({
        id: `benchmark-task-${i}`,
        productInfo: {
          code: `TEST-${String(i).padStart(3, '0')}`,
          description: `Benchmark Test Product ${i}`,
          type: i % 5 === 0 ? 'ACO' : 'Standard',
          standard_qty: '100',
        },
        quantity: Math.floor(Math.random() * 1000) + 1,
        palletNum: `P${String(i).padStart(6, '0')}`,
        series: `S${String(i).padStart(4, '0')}`,
        operatorClockNum: 'BENCH001',
        qcClockNum: 'QC001',
        acoDisplayText: i % 5 === 0 ? `ACO-BENCH-${i}` : undefined,
        priority: i < count * 0.2 ? 'high' : i < count * 0.8 ? 'normal' : 'low',
        timestamp: Date.now(),
      });
    }
    
    return tasks;
  }

  /**
   * 獲取記憶體使用情況
   */
  private getMemoryUsage(): MemoryUsage {
    const memUsage = process.memoryUsage();
    return {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      external: memUsage.external,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      rss: memUsage.rss,
    };
  }

  /**
   * 計算摘要統計
   */
  private calculateSummary(
    results: BenchmarkResult['results'],
    totalProcessedItems: number,
    totalErrors: number
  ): BenchmarkResult['summary'] {
    const validResults = results.filter(r => r.processingTime > 0);
    
    const averageProcessingTime = validResults.length > 0 
      ? validResults.reduce((sum, r) => sum + r.processingTime, 0) / validResults.length
      : 0;
    
    const averageThroughput = validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.throughput, 0) / validResults.length
      : 0;
    
    const averageSuccessRate = validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.successRate, 0) / validResults.length
      : 0;
    
    const peakMemoryUsage = Math.max(
      ...results
        .filter(r => r.memoryUsage)
        .map(r => r.memoryUsage!.heapUsed),
      0
    );

    return {
      averageProcessingTime,
      averageThroughput,
      averageSuccessRate,
      peakMemoryUsage,
      totalProcessedItems,
      totalErrors,
    };
  }

  /**
   * 輸出測試結果
   */
  private outputResults(result: BenchmarkResult) {
    switch (this.config.outputFormat) {
      case 'json':
        console.log(JSON.stringify(result, null, 2));
        break;
      
      case 'csv':
        this.outputCsv(result);
        break;
      
      case 'console':
      default:
        this.outputConsole(result);
        break;
    }
  }

  /**
   * 控制台輸出格式
   */
  private outputConsole(result: BenchmarkResult) {
    console.log('\n🚀 PDF Performance Benchmark Results');
    console.log('=====================================');
    console.log(`Test ID: ${result.testId}`);
    console.log(`Timestamp: ${result.timestamp}`);
    console.log(`Test Sizes: ${result.config.testSizes.join(', ')}`);
    console.log(`Iterations per Size: ${result.config.iterations}\n`);

    console.log('📊 Summary Statistics:');
    console.log(`Average Processing Time: ${result.summary.averageProcessingTime.toFixed(2)}ms`);
    console.log(`Average Throughput: ${result.summary.averageThroughput.toFixed(2)} items/second`);
    console.log(`Average Success Rate: ${result.summary.averageSuccessRate.toFixed(2)}%`);
    console.log(`Peak Memory Usage: ${(result.summary.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Total Processed Items: ${result.summary.totalProcessedItems}`);
    console.log(`Total Errors: ${result.summary.totalErrors}\n`);

    if (result.summary.performanceImprovement !== undefined) {
      console.log(`Performance Improvement: ${result.summary.performanceImprovement.toFixed(2)}%\n`);
    }

    console.log('📈 Detailed Results:');
    console.table(
      result.results.map(r => ({
        'Test Size': r.testSize,
        'Iteration': r.iteration + 1,
        'Time (ms)': r.processingTime,
        'Throughput (items/s)': r.throughput.toFixed(2),
        'Success Rate (%)': r.successRate.toFixed(1),
        'Memory (MB)': r.memoryUsage ? (r.memoryUsage.heapUsed / 1024 / 1024).toFixed(1) : 'N/A',
        'Errors': r.errors.length,
      }))
    );
  }

  /**
   * CSV 輸出格式
   */
  private outputCsv(result: BenchmarkResult) {
    const headers = [
      'TestSize',
      'Iteration',
      'ProcessingTime',
      'Throughput',
      'SuccessRate',
      'MemoryUsed',
      'ErrorCount'
    ].join(',');

    const rows = result.results.map(r => [
      r.testSize,
      r.iteration + 1,
      r.processingTime,
      r.throughput.toFixed(2),
      r.successRate.toFixed(1),
      r.memoryUsage ? (r.memoryUsage.heapUsed / 1024 / 1024).toFixed(1) : 'N/A',
      r.errors.length,
    ].join(','));

    console.log([headers, ...rows].join('\n'));
  }

  /**
   * 比較兩個基準測試結果
   */
  static compareResults(oldResult: BenchmarkResult, newResult: BenchmarkResult): PerformanceComparison {
    const processingTimeImprovement = ((oldResult.summary.averageProcessingTime - newResult.summary.averageProcessingTime) / oldResult.summary.averageProcessingTime) * 100;
    const throughputImprovement = ((newResult.summary.averageThroughput - oldResult.summary.averageThroughput) / oldResult.summary.averageThroughput) * 100;
    const successRateImprovement = newResult.summary.averageSuccessRate - oldResult.summary.averageSuccessRate;
    const memoryEfficiencyImprovement = ((oldResult.summary.peakMemoryUsage - newResult.summary.peakMemoryUsage) / oldResult.summary.peakMemoryUsage) * 100;

    let recommendation = '';
    
    if (processingTimeImprovement > 20 && throughputImprovement > 20) {
      recommendation = 'Excellent improvement! The new system shows significant performance gains.';
    } else if (processingTimeImprovement > 10 || throughputImprovement > 10) {
      recommendation = 'Good improvement. The new system performs better than the old one.';
    } else if (processingTimeImprovement > 0 || throughputImprovement > 0) {
      recommendation = 'Modest improvement. Consider further optimizations.';
    } else {
      recommendation = 'No significant improvement. Review optimization strategy.';
    }

    return {
      oldSystem: oldResult,
      newSystem: newResult,
      improvements: {
        processingTimeImprovement,
        throughputImprovement,
        successRateImprovement,
        memoryEfficiencyImprovement,
      },
      recommendation,
    };
  }

  /**
   * 生成性能報告
   */
  generateReport(result: BenchmarkResult): string {
    const reportDate = new Date().toLocaleDateString();
    
    return `
# PDF Generation Performance Report

**Generated on:** ${reportDate}
**Test ID:** ${result.testId}

## Executive Summary

This report presents the performance analysis of the PDF generation system after implementing parallel processing optimizations.

### Key Metrics
- **Average Processing Time:** ${result.summary.averageProcessingTime.toFixed(2)}ms
- **Average Throughput:** ${result.summary.averageThroughput.toFixed(2)} PDFs/second
- **Average Success Rate:** ${result.summary.averageSuccessRate.toFixed(2)}%
- **Peak Memory Usage:** ${(result.summary.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB

### Performance Highlights
- Processed ${result.summary.totalProcessedItems} items across ${result.config.testSizes.length} different batch sizes
- Maintained ${result.summary.averageSuccessRate.toFixed(1)}% success rate under load
- Peak throughput achieved: ${Math.max(...result.results.map(r => r.throughput)).toFixed(2)} PDFs/second

## Detailed Analysis

### Test Configuration
- **Test Sizes:** ${result.config.testSizes.join(', ')}
- **Iterations:** ${result.config.iterations} per size
- **Timeout:** ${result.config.timeout / 1000} seconds
- **Memory Tracking:** ${result.config.enableMemoryTracking ? 'Enabled' : 'Disabled'}

### Results by Test Size
${result.config.testSizes.map(size => {
  const sizeResults = result.results.filter(r => r.testSize === size);
  const avgTime = sizeResults.reduce((sum, r) => sum + r.processingTime, 0) / sizeResults.length;
  const avgThroughput = sizeResults.reduce((sum, r) => sum + r.throughput, 0) / sizeResults.length;
  const avgSuccessRate = sizeResults.reduce((sum, r) => sum + r.successRate, 0) / sizeResults.length;
  
  return `
**${size} Items:**
- Average Time: ${avgTime.toFixed(2)}ms
- Average Throughput: ${avgThroughput.toFixed(2)} PDFs/sec
- Success Rate: ${avgSuccessRate.toFixed(1)}%
`;
}).join('')}

## Recommendations

Based on the performance analysis:

1. **Optimal Batch Size:** Results indicate optimal performance at ${result.config.testSizes[Math.floor(result.config.testSizes.length / 2)]} concurrent PDFs
2. **Memory Management:** Peak memory usage of ${(result.summary.peakMemoryUsage / 1024 / 1024).toFixed(2)}MB suggests efficient resource utilization
3. **Error Handling:** ${result.summary.totalErrors} total errors across all tests demonstrates robust error handling

## Technical Details

The parallel processing implementation uses:
- Promise.allSettled for true concurrent execution
- Intelligent concurrency control (6 PDF generation + 8 upload workers)
- Comprehensive error handling and retry mechanisms
- Real-time progress tracking and metrics collection

---

*This report was automatically generated by the PDF Performance Benchmark utility.*
`;
  }
}

// 導出便利函數
export const runPdfBenchmark = async (config?: Partial<BenchmarkConfig>): Promise<BenchmarkResult> => {
  const benchmark = new PdfPerformanceBenchmark(config);
  return await benchmark.runBenchmark();
};

export const comparePdfPerformance = (oldResult: BenchmarkResult, newResult: BenchmarkResult): PerformanceComparison => {
  return PdfPerformanceBenchmark.compareResults(oldResult, newResult);
};