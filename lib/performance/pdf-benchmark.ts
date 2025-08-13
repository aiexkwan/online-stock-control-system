/**
 * PDF Benchmark Utility
 * Performance benchmarking and testing tools for PDF extraction
 */

import { performance } from 'perf_hooks';
import { systemLogger } from '@/lib/logger';
import { PDFExtractionService, ExtractedPDFData } from '@/app/services/pdfExtractionService';
import { PDFPerformanceMonitor } from './pdf-performance-monitor';
import { PDFCacheOptimizer } from './pdf-cache-optimizer';
import { PDFRequestBatcher } from './pdf-request-batcher';

export interface BenchmarkConfig {
  iterations: number;
  warmupIterations: number;
  concurrency: number;
  cacheEnabled: boolean;
  batchingEnabled: boolean;
  reportFormat: 'json' | 'markdown' | 'html';
}

export interface BenchmarkResult {
  testName: string;
  iterations: number;
  concurrency: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  p50Time: number;
  p95Time: number;
  p99Time: number;
  throughput: number;
  tokensPerSecond: number;
  memoryUsage: {
    before: number;
    after: number;
    peak: number;
  };
  cacheMetrics?: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  errors: number;
  errorRate: number;
}

export interface ComparisonResult {
  baseline: BenchmarkResult;
  optimized: BenchmarkResult;
  improvement: {
    speedup: number;
    tokenSavings: number;
    memoryReduction: number;
    errorReduction: number;
  };
  recommendations: string[];
}

/**
 * PDF Benchmark Class
 * Comprehensive benchmarking for PDF extraction performance
 */
export class PDFBenchmark {
  private pdfService: PDFExtractionService;
  private performanceMonitor: PDFPerformanceMonitor;
  private cacheOptimizer: PDFCacheOptimizer;
  private requestBatcher: PDFRequestBatcher;
  
  constructor() {
    this.pdfService = PDFExtractionService.getInstance();
    this.performanceMonitor = PDFPerformanceMonitor.getInstance();
    this.cacheOptimizer = PDFCacheOptimizer.getInstance();
    this.requestBatcher = PDFRequestBatcher.getInstance();
  }
  
  /**
   * Run benchmark test
   */
  public async runBenchmark(
    testName: string,
    testData: Buffer[],
    config: BenchmarkConfig
  ): Promise<BenchmarkResult> {
    systemLogger.info({
      testName,
      dataCount: testData.length,
      config,
    }, '[PDFBenchmark] Starting benchmark');
    
    // Reset monitors
    this.performanceMonitor.resetMetrics();
    if (!config.cacheEnabled) {
      this.cacheOptimizer.clear();
    }
    
    // Memory tracking
    const memoryBefore = process.memoryUsage().heapUsed;
    let memoryPeak = memoryBefore;
    
    // Warmup runs
    if (config.warmupIterations > 0) {
      await this.runWarmup(testData[0], config.warmupIterations);
    }
    
    // Timing array
    const timings: number[] = [];
    let errors = 0;
    let totalTokens = 0;
    
    // Run benchmark
    const startTime = performance.now();
    
    for (let i = 0; i < config.iterations; i++) {
      const dataIndex = i % testData.length;
      const iterationStart = performance.now();
      
      try {
        if (config.batchingEnabled && config.concurrency > 1) {
          // Batch processing
          await this.runConcurrent(
            testData.slice(dataIndex, dataIndex + config.concurrency),
            config
          );
        } else {
          // Single processing
          const result = await this.processPDF(testData[dataIndex], config);
          totalTokens += this.estimateTokens(result);
        }
        
        const iterationTime = performance.now() - iterationStart;
        timings.push(iterationTime);
        
        // Track memory
        const currentMemory = process.memoryUsage().heapUsed;
        memoryPeak = Math.max(memoryPeak, currentMemory);
        
      } catch (error) {
        errors++;
        systemLogger.error({
          iteration: i,
          error: error instanceof Error ? error.message : 'Unknown error',
        }, '[PDFBenchmark] Iteration failed');
      }
    }
    
    const totalTime = performance.now() - startTime;
    const memoryAfter = process.memoryUsage().heapUsed;
    
    // Calculate statistics
    const result = this.calculateStatistics(
      testName,
      timings,
      config,
      totalTime,
      totalTokens,
      {
        before: memoryBefore,
        after: memoryAfter,
        peak: memoryPeak,
      },
      errors
    );
    
    // Get cache metrics if enabled
    if (config.cacheEnabled) {
      const cacheStats = this.cacheOptimizer.getStatistics();
      result.cacheMetrics = {
        hits: cacheStats.hitRate * config.iterations,
        misses: cacheStats.missRate * config.iterations,
        hitRate: cacheStats.hitRate,
      };
    }
    
    systemLogger.info({
      testName,
      result,
    }, '[PDFBenchmark] Benchmark completed');
    
    return result;
  }
  
  /**
   * Run warmup iterations
   */
  private async runWarmup(data: Buffer, iterations: number): Promise<void> {
    systemLogger.debug({
      iterations,
    }, '[PDFBenchmark] Running warmup');
    
    for (let i = 0; i < iterations; i++) {
      try {
        await this.pdfService.extractText(data.buffer as ArrayBuffer);
      } catch (error) {
        // Ignore warmup errors
      }
    }
  }
  
  /**
   * Process single PDF
   */
  private async processPDF(data: Buffer, config: BenchmarkConfig): Promise<ExtractedPDFData> {
    const fileHash = this.cacheOptimizer.generateHash(data);
    
    // Check cache if enabled
    if (config.cacheEnabled) {
      const cached = this.cacheOptimizer.get(fileHash);
      if (cached) {
        return cached.extractedData;
      }
    }
    
    // Process PDF
    const result = await this.pdfService.extractText(data.buffer as ArrayBuffer);
    
    // Cache if enabled
    if (config.cacheEnabled) {
      this.cacheOptimizer.set(
        fileHash,
        'benchmark.pdf',
        data.length,
        result,
        null,
        this.estimateTokens(result),
        0
      );
    }
    
    return result;
  }
  
  /**
   * Run concurrent processing
   */
  private async runConcurrent(
    dataArray: Buffer[],
    config: BenchmarkConfig
  ): Promise<ExtractedPDFData[]> {
    const promises = dataArray.map(data => this.processPDF(data, config));
    return Promise.all(promises);
  }
  
  /**
   * Estimate tokens from result
   */
  private estimateTokens(result: ExtractedPDFData): number {
    const text = result?.text || '';
    return Math.ceil(text.length / 4); // Rough estimation
  }
  
  /**
   * Calculate statistics
   */
  private calculateStatistics(
    testName: string,
    timings: number[],
    config: BenchmarkConfig,
    totalTime: number,
    totalTokens: number,
    memoryUsage: BenchmarkResult['memoryUsage'],
    errors: number
  ): BenchmarkResult {
    const sortedTimings = [...timings].sort((a, b) => a - b);
    const len = sortedTimings.length;
    
    return {
      testName,
      iterations: config.iterations,
      concurrency: config.concurrency,
      totalTime,
      averageTime: len > 0 ? sortedTimings.reduce((a, b) => a + b, 0) / len : 0,
      minTime: len > 0 ? sortedTimings[0] : 0,
      maxTime: len > 0 ? sortedTimings[len - 1] : 0,
      p50Time: len > 0 ? sortedTimings[Math.floor(len * 0.5)] : 0,
      p95Time: len > 0 ? sortedTimings[Math.floor(len * 0.95)] : 0,
      p99Time: len > 0 ? sortedTimings[Math.floor(len * 0.99)] : 0,
      throughput: config.iterations / (totalTime / 1000), // requests per second
      tokensPerSecond: totalTokens / (totalTime / 1000),
      memoryUsage,
      errors,
      errorRate: errors / config.iterations,
    };
  }
  
  /**
   * Compare baseline vs optimized performance
   */
  public async compareBenchmarks(
    testData: Buffer[],
    baselineConfig: BenchmarkConfig,
    optimizedConfig: BenchmarkConfig
  ): Promise<ComparisonResult> {
    systemLogger.info('[PDFBenchmark] Running comparison benchmark');
    
    // Run baseline
    const baseline = await this.runBenchmark(
      'Baseline',
      testData,
      baselineConfig
    );
    
    // Clear state between tests
    this.performanceMonitor.resetMetrics();
    this.cacheOptimizer.clear();
    
    // Run optimized
    const optimized = await this.runBenchmark(
      'Optimized',
      testData,
      optimizedConfig
    );
    
    // Calculate improvements
    const speedup = baseline.averageTime / optimized.averageTime;
    const tokenSavings = 
      (baseline.tokensPerSecond - optimized.tokensPerSecond) / baseline.tokensPerSecond;
    const memoryReduction = 
      (baseline.memoryUsage.peak - optimized.memoryUsage.peak) / baseline.memoryUsage.peak;
    const errorReduction = 
      (baseline.errorRate - optimized.errorRate) / baseline.errorRate;
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      baseline,
      optimized,
      speedup
    );
    
    return {
      baseline,
      optimized,
      improvement: {
        speedup,
        tokenSavings,
        memoryReduction,
        errorReduction,
      },
      recommendations,
    };
  }
  
  /**
   * Generate recommendations
   */
  private generateRecommendations(
    baseline: BenchmarkResult,
    optimized: BenchmarkResult,
    speedup: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (speedup < 1.2) {
      recommendations.push('Limited performance improvement. Consider more aggressive optimization.');
    }
    
    if (optimized.cacheMetrics && optimized.cacheMetrics.hitRate < 0.5) {
      recommendations.push('Cache hit rate is low. Increase cache size or TTL.');
    }
    
    if (optimized.p99Time > optimized.p95Time * 2) {
      recommendations.push('High P99 latency variance. Investigate outliers.');
    }
    
    if (optimized.memoryUsage.peak > 500 * 1024 * 1024) {
      recommendations.push('High memory usage. Consider memory optimization.');
    }
    
    if (optimized.errorRate > 0.01) {
      recommendations.push('Error rate above 1%. Implement better error handling.');
    }
    
    if (optimized.throughput < 10) {
      recommendations.push('Low throughput. Consider parallel processing.');
    }
    
    return recommendations;
  }
  
  /**
   * Generate benchmark report
   */
  public generateReport(
    result: BenchmarkResult | ComparisonResult,
    format: 'json' | 'markdown' | 'html' = 'markdown'
  ): string {
    switch (format) {
      case 'json':
        return JSON.stringify(result, null, 2);
        
      case 'markdown':
        return this.generateMarkdownReport(result);
        
      case 'html':
        return this.generateHTMLReport(result);
        
      default:
        return JSON.stringify(result, null, 2);
    }
  }
  
  /**
   * Generate Markdown report
   */
  private generateMarkdownReport(result: BenchmarkResult | ComparisonResult): string {
    let report = '# PDF Extraction Benchmark Report\n\n';
    
    if ('baseline' in result) {
      // Comparison report
      report += '## Performance Comparison\n\n';
      report += '### Baseline Performance\n';
      report += this.formatBenchmarkTable(result.baseline);
      report += '\n### Optimized Performance\n';
      report += this.formatBenchmarkTable(result.optimized);
      report += '\n### Improvements\n';
      report += `- **Speedup**: ${result.improvement.speedup.toFixed(2)}x\n`;
      report += `- **Token Savings**: ${(result.improvement.tokenSavings * 100).toFixed(1)}%\n`;
      report += `- **Memory Reduction**: ${(result.improvement.memoryReduction * 100).toFixed(1)}%\n`;
      report += `- **Error Reduction**: ${(result.improvement.errorReduction * 100).toFixed(1)}%\n`;
      
      if (result.recommendations.length > 0) {
        report += '\n### Recommendations\n';
        result.recommendations.forEach(rec => {
          report += `- ${rec}\n`;
        });
      }
    } else {
      // Single benchmark report
      report += '## Benchmark Results\n\n';
      report += this.formatBenchmarkTable(result);
    }
    
    report += `\n---\n*Generated at ${new Date().toISOString()}*\n`;
    
    return report;
  }
  
  /**
   * Format benchmark table
   */
  private formatBenchmarkTable(result: BenchmarkResult): string {
    let table = '| Metric | Value |\n';
    table += '|--------|-------|\n';
    table += `| Test Name | ${result.testName} |\n`;
    table += `| Iterations | ${result.iterations} |\n`;
    table += `| Concurrency | ${result.concurrency} |\n`;
    table += `| Total Time | ${result.totalTime.toFixed(2)}ms |\n`;
    table += `| Average Time | ${result.averageTime.toFixed(2)}ms |\n`;
    table += `| Min Time | ${result.minTime.toFixed(2)}ms |\n`;
    table += `| Max Time | ${result.maxTime.toFixed(2)}ms |\n`;
    table += `| P50 Time | ${result.p50Time.toFixed(2)}ms |\n`;
    table += `| P95 Time | ${result.p95Time.toFixed(2)}ms |\n`;
    table += `| P99 Time | ${result.p99Time.toFixed(2)}ms |\n`;
    table += `| Throughput | ${result.throughput.toFixed(2)} req/s |\n`;
    table += `| Tokens/Second | ${result.tokensPerSecond.toFixed(0)} |\n`;
    table += `| Memory Before | ${(result.memoryUsage.before / 1024 / 1024).toFixed(2)}MB |\n`;
    table += `| Memory After | ${(result.memoryUsage.after / 1024 / 1024).toFixed(2)}MB |\n`;
    table += `| Memory Peak | ${(result.memoryUsage.peak / 1024 / 1024).toFixed(2)}MB |\n`;
    table += `| Errors | ${result.errors} |\n`;
    table += `| Error Rate | ${(result.errorRate * 100).toFixed(2)}% |\n`;
    
    if (result.cacheMetrics) {
      table += `| Cache Hits | ${result.cacheMetrics.hits} |\n`;
      table += `| Cache Misses | ${result.cacheMetrics.misses} |\n`;
      table += `| Cache Hit Rate | ${(result.cacheMetrics.hitRate * 100).toFixed(1)}% |\n`;
    }
    
    return table;
  }
  
  /**
   * Generate HTML report
   */
  private generateHTMLReport(result: BenchmarkResult | ComparisonResult): string {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>PDF Benchmark Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1, h2, h3 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .improvement { color: green; font-weight: bold; }
    .recommendation { background-color: #fffbea; padding: 10px; margin: 5px 0; }
  </style>
</head>
<body>
  <h1>PDF Extraction Benchmark Report</h1>
`;
    
    if ('baseline' in result) {
      html += '<h2>Performance Comparison</h2>';
      html += '<h3>Baseline Performance</h3>';
      html += this.formatHTMLTable(result.baseline);
      html += '<h3>Optimized Performance</h3>';
      html += this.formatHTMLTable(result.optimized);
      html += '<h3>Improvements</h3>';
      html += '<ul class="improvement">';
      html += `<li>Speedup: ${result.improvement.speedup.toFixed(2)}x</li>`;
      html += `<li>Token Savings: ${(result.improvement.tokenSavings * 100).toFixed(1)}%</li>`;
      html += `<li>Memory Reduction: ${(result.improvement.memoryReduction * 100).toFixed(1)}%</li>`;
      html += `<li>Error Reduction: ${(result.improvement.errorReduction * 100).toFixed(1)}%</li>`;
      html += '</ul>';
      
      if (result.recommendations.length > 0) {
        html += '<h3>Recommendations</h3>';
        result.recommendations.forEach(rec => {
          html += `<div class="recommendation">${rec}</div>`;
        });
      }
    } else {
      html += '<h2>Benchmark Results</h2>';
      html += this.formatHTMLTable(result);
    }
    
    html += `<p><em>Generated at ${new Date().toISOString()}</em></p>`;
    html += '</body></html>';
    
    return html;
  }
  
  /**
   * Format HTML table
   */
  private formatHTMLTable(result: BenchmarkResult): string {
    let table = '<table>';
    table += '<tr><th>Metric</th><th>Value</th></tr>';
    table += `<tr><td>Test Name</td><td>${result.testName}</td></tr>`;
    table += `<tr><td>Iterations</td><td>${result.iterations}</td></tr>`;
    table += `<tr><td>Average Time</td><td>${result.averageTime.toFixed(2)}ms</td></tr>`;
    table += `<tr><td>P95 Time</td><td>${result.p95Time.toFixed(2)}ms</td></tr>`;
    table += `<tr><td>Throughput</td><td>${result.throughput.toFixed(2)} req/s</td></tr>`;
    table += `<tr><td>Memory Peak</td><td>${(result.memoryUsage.peak / 1024 / 1024).toFixed(2)}MB</td></tr>`;
    table += `<tr><td>Error Rate</td><td>${(result.errorRate * 100).toFixed(2)}%</td></tr>`;
    table += '</table>';
    
    return table;
  }
}

// Export singleton instance
export const pdfBenchmark = new PDFBenchmark();