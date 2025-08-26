#!/usr/bin/env node
/**
 * PDF Extraction Performance Benchmark
 * Comprehensive benchmarking suite for comparing extraction methods
 */

import { config } from 'dotenv';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import Table from 'cli-table3';
import ora from 'ora';

// Services to benchmark
import { PDFExtractionService } from '../app/services/pdfExtractionService';
import { ChatCompletionService } from '../app/services/chatCompletionService';
import { AssistantService } from '../app/services/assistantService';
import { EnhancedOrderExtractionService } from '../app/services/enhancedOrderExtractionService';
import { OptimizedPDFExtractionService } from '../app/services/OptimizedPDFExtractionService';
import { pdfMonitor } from '../lib/monitoring/PDFExtractionMonitor';

// Load environment variables
config({ path: '.env.local' });

// Benchmark configuration
interface BenchmarkConfig {
  testFiles: string[];
  iterations: number;
  warmupRuns: number;
  outputDir: string;
  verbose: boolean;
  compareBaseline: boolean;
  methods: string[];
}

// Benchmark result
interface BenchmarkResult {
  method: string;
  fileName: string;
  iteration: number;
  success: boolean;
  extractionTime: number;
  totalTime: number;
  tokensUsed: number;
  productsFound: number;
  cacheHit: boolean;
  error?: string;
  memoryUsed: number;
}

// Method statistics
interface MethodStats {
  method: string;
  runs: number;
  successRate: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50Time: number;
  p95Time: number;
  p99Time: number;
  avgTokens: number;
  totalTokens: number;
  avgProducts: number;
  cacheHitRate: number;
  estimatedCost: number;
  memoryPeak: number;
}

class PDFExtractionBenchmark {
  private config: BenchmarkConfig;
  private results: BenchmarkResult[] = [];
  private baselineResults: Map<string, MethodStats> = new Map();

  constructor(config: Partial<BenchmarkConfig> = {}) {
    this.config = {
      testFiles: config.testFiles || this.getDefaultTestFiles(),
      iterations: config.iterations || 5,
      warmupRuns: config.warmupRuns || 2,
      outputDir: config.outputDir || 'benchmark-results',
      verbose: config.verbose || false,
      compareBaseline: config.compareBaseline || false,
      methods: config.methods || ['optimized', 'enhanced', 'chat', 'assistant'],
    };

    // Ensure output directory exists
    if (!existsSync(this.config.outputDir)) {
      mkdirSync(this.config.outputDir, { recursive: true });
    }
  }

  /**
   * Get default test files
   */
  private getDefaultTestFiles(): string[] {
    const testDir = join(process.cwd(), 'test-pdfs');
    if (!existsSync(testDir)) {
      console.log(chalk.yellow('Warning: test-pdfs directory not found'));
      return [];
    }

    // Look for PDF files in test directory
    const fs = require('fs');
    return fs
      .readdirSync(testDir)
      .filter((file: string) => file.endsWith('.pdf'))
      .map((file: string) => join(testDir, file));
  }

  /**
   * Run complete benchmark suite
   */
  public async run(): Promise<void> {
    console.log(chalk.bold.blue('\n📊 PDF Extraction Performance Benchmark\n'));
    console.log(chalk.gray('Configuration:'));
    console.log(chalk.gray(`  - Test Files: ${this.config.testFiles.length}`));
    console.log(chalk.gray(`  - Iterations: ${this.config.iterations}`));
    console.log(chalk.gray(`  - Methods: ${this.config.methods.join(', ')}`));
    console.log(chalk.gray(`  - Output: ${this.config.outputDir}\n`));

    // Load baseline if comparing
    if (this.config.compareBaseline) {
      this.loadBaseline();
    }

    // Warmup runs
    if (this.config.warmupRuns > 0) {
      console.log(chalk.yellow('🔥 Warming up...'));
      await this.runWarmup();
    }

    // Main benchmark
    console.log(chalk.green('\n🚀 Starting benchmark...\n'));

    for (const method of this.config.methods) {
      await this.benchmarkMethod(method);
    }

    // Generate reports
    console.log(chalk.blue('\n📈 Generating reports...\n'));
    this.generateReports();

    // Compare with baseline
    if (this.config.compareBaseline && this.baselineResults.size > 0) {
      this.compareWithBaseline();
    }

    console.log(chalk.green('\n✅ Benchmark complete!\n'));
  }

  /**
   * Run warmup iterations
   */
  private async runWarmup(): Promise<void> {
    if (this.config.testFiles.length === 0) return;

    const testFile = this.config.testFiles[0];
    const spinner = ora('Warming up services...').start();

    try {
      // Warm up optimized service
      const optimizedService = OptimizedPDFExtractionService.getInstance();
      await optimizedService.warmCache();

      // Run a few test extractions
      const buffer = this.loadPDFBuffer(testFile);
      for (let i = 0; i < this.config.warmupRuns; i++) {
        await optimizedService.extractFromPDF(buffer, 'warmup.pdf');
      }

      spinner.succeed('Warmup complete');
    } catch (error) {
      spinner.fail('Warmup failed');
    }
  }

  /**
   * Benchmark a specific method
   */
  private async benchmarkMethod(method: string): Promise<void> {
    console.log(chalk.bold(`\n📋 Benchmarking: ${method}`));

    const progressBar = this.createProgressBar(
      this.config.testFiles.length * this.config.iterations
    );

    for (const testFile of this.config.testFiles) {
      const fileName = testFile.split('/').pop() || 'unknown.pdf';

      for (let i = 0; i < this.config.iterations; i++) {
        const result = await this.runSingleBenchmark(method, testFile, fileName, i);
        this.results.push(result);
        progressBar.tick();

        if (this.config.verbose) {
          this.printResult(result);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    progressBar.terminate();
  }

  /**
   * Run single benchmark iteration
   */
  private async runSingleBenchmark(
    method: string,
    filePath: string,
    fileName: string,
    iteration: number
  ): Promise<BenchmarkResult> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    const result: BenchmarkResult = {
      method,
      fileName,
      iteration,
      success: false,
      extractionTime: 0,
      totalTime: 0,
      tokensUsed: 0,
      productsFound: 0,
      cacheHit: false,
      memoryUsed: 0,
    };

    try {
      const buffer = this.loadPDFBuffer(filePath);

      switch (method) {
        case 'optimized':
          const optimizedResult = await this.benchmarkOptimized(buffer, fileName);
          result.success = optimizedResult.success;
          result.productsFound = optimizedResult.products;
          result.tokensUsed = optimizedResult.tokens;
          result.cacheHit = optimizedResult.cacheHit;
          result.extractionTime = optimizedResult.extractionTime;
          break;

        case 'enhanced':
          const enhancedResult = await this.benchmarkEnhanced(buffer, fileName);
          result.success = enhancedResult.success;
          result.productsFound = enhancedResult.products;
          result.tokensUsed = enhancedResult.tokens;
          result.extractionTime = enhancedResult.extractionTime;
          break;

        case 'chat':
          const chatResult = await this.benchmarkChat(buffer, fileName);
          result.success = chatResult.success;
          result.productsFound = chatResult.products;
          result.tokensUsed = chatResult.tokens;
          result.extractionTime = chatResult.extractionTime;
          break;

        case 'assistant':
          const assistantResult = await this.benchmarkAssistant(buffer, fileName);
          result.success = assistantResult.success;
          result.productsFound = assistantResult.products;
          result.tokensUsed = assistantResult.tokens;
          result.extractionTime = assistantResult.extractionTime;
          break;

        default:
          throw new Error(`Unknown method: ${method}`);
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    result.totalTime = Date.now() - startTime;
    result.memoryUsed = (process.memoryUsage().heapUsed - startMemory) / 1024 / 1024;

    // Record in monitor
    pdfMonitor.recordMetric({
      extractionTime: result.extractionTime,
      tokensUsed: result.tokensUsed,
      cacheHit: result.cacheHit,
      success: result.success,
      method: result.method,
      fileName: result.fileName,
      error: result.error,
    });

    return result;
  }

  /**
   * Benchmark optimized service
   */
  private async benchmarkOptimized(buffer: ArrayBuffer, fileName: string) {
    const service = OptimizedPDFExtractionService.getInstance();
    const result = await service.extractFromPDF(buffer, fileName);

    return {
      success: result.success,
      products: result.data?.products.length || 0,
      tokens: result.metrics.tokensUsed,
      cacheHit: result.metrics.cacheHit,
      extractionTime: result.metrics.llmTime,
    };
  }

  /**
   * Benchmark enhanced service
   */
  private async benchmarkEnhanced(buffer: ArrayBuffer, fileName: string) {
    const startTime = Date.now();
    const service = EnhancedOrderExtractionService.getInstance();
    const result = await service.extractOrderFromPDF(buffer, fileName);

    return {
      success: result.success,
      products: result.data?.products.length || 0,
      tokens: result.metadata.tokensUsed || 0,
      cacheHit: false,
      extractionTime: Date.now() - startTime,
    };
  }

  /**
   * Benchmark chat completion service
   */
  private async benchmarkChat(buffer: ArrayBuffer, fileName: string) {
    const startTime = Date.now();
    const pdfService = PDFExtractionService.getInstance();
    const chatService = ChatCompletionService.getInstance();

    const extractedData = await pdfService.extractText(buffer);
    const processedText = pdfService.preprocessTextForLLM(extractedData);
    const result = await chatService.extractOrdersFromText(processedText, extractedData);

    return {
      success: result.orders.length > 0,
      products: result.orders.length,
      tokens: result.metadata?.tokensUsed || 0,
      cacheHit: false,
      extractionTime: Date.now() - startTime,
    };
  }

  /**
   * Benchmark assistant API
   */
  private async benchmarkAssistant(buffer: ArrayBuffer, fileName: string) {
    const startTime = Date.now();
    const service = AssistantService.getInstance();

    let threadId: string | undefined;
    let fileId: string | undefined;

    try {
      // Get or create assistant
      const assistantId = await service.getAssistant();

      // Create thread
      threadId = await service.createThread();

      // Upload file
      fileId = await service.uploadFileToVectorStore(
        Buffer.from(buffer),
        fileName,
        true // Skip vector store processing for speed
      );

      // Send message
      await service.sendMessage(threadId, 'Extract all products from this order PDF', fileId);

      // Run and wait
      const response = await service.runAndWait(threadId, assistantId);
      const parsed = service.parseAssistantResponse(response);

      return {
        success: true,
        products: parsed.products?.length || 0,
        tokens: 8192, // Estimated based on config
        cacheHit: false,
        extractionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        products: 0,
        tokens: 0,
        cacheHit: false,
        extractionTime: Date.now() - startTime,
      };
    } finally {
      // Cleanup
      if (threadId || fileId) {
        await service.cleanup(threadId, fileId);
      }
    }
  }

  /**
   * Generate reports
   */
  private generateReports(): void {
    // Calculate statistics for each method
    const methodStats = this.calculateMethodStats();

    // Print summary table
    this.printSummaryTable(methodStats);

    // Save detailed results
    this.saveDetailedResults();

    // Save statistics
    this.saveStatistics(methodStats);

    // Generate charts data
    this.generateChartsData();

    // Save monitor report
    this.saveMonitorReport();
  }

  /**
   * Calculate statistics for each method
   */
  private calculateMethodStats(): MethodStats[] {
    const methodGroups = new Map<string, BenchmarkResult[]>();

    // Group results by method
    this.results.forEach(result => {
      const group = methodGroups.get(result.method) || [];
      group.push(result);
      methodGroups.set(result.method, group);
    });

    // Calculate stats for each method
    const stats: MethodStats[] = [];

    methodGroups.forEach((results, method) => {
      const successfulRuns = results.filter(r => r.success);
      const times = successfulRuns.map(r => r.totalTime).sort((a, b) => a - b);
      const tokens = results.map(r => r.tokensUsed);
      const products = successfulRuns.map(r => r.productsFound);
      const cacheHits = results.filter(r => r.cacheHit).length;
      const memoryPeaks = results.map(r => r.memoryUsed);

      stats.push({
        method,
        runs: results.length,
        successRate: (successfulRuns.length / results.length) * 100,
        avgTime: this.average(times),
        minTime: Math.min(...times),
        maxTime: Math.max(...times),
        p50Time: this.percentile(times, 50),
        p95Time: this.percentile(times, 95),
        p99Time: this.percentile(times, 99),
        avgTokens: this.average(tokens),
        totalTokens: tokens.reduce((sum, t) => sum + t, 0),
        avgProducts: this.average(products),
        cacheHitRate: (cacheHits / results.length) * 100,
        estimatedCost: this.estimateCost(tokens.reduce((sum, t) => sum + t, 0)),
        memoryPeak: Math.max(...memoryPeaks),
      });
    });

    return stats.sort((a, b) => a.avgTime - b.avgTime);
  }

  /**
   * Print summary table
   */
  private printSummaryTable(stats: MethodStats[]): void {
    const table = new Table({
      head: [
        'Method',
        'Success %',
        'Avg Time',
        'P95 Time',
        'Avg Tokens',
        'Cache Hit %',
        'Est. Cost',
      ],
      colWidths: [15, 12, 12, 12, 12, 12, 12],
    });

    stats.forEach(stat => {
      table.push([
        stat.method,
        `${stat.successRate.toFixed(1)}%`,
        `${stat.avgTime.toFixed(0)}ms`,
        `${stat.p95Time.toFixed(0)}ms`,
        stat.avgTokens.toFixed(0),
        `${stat.cacheHitRate.toFixed(1)}%`,
        `$${stat.estimatedCost.toFixed(3)}`,
      ]);
    });

    console.log(chalk.bold('\n📊 Performance Summary:'));
    console.log(table.toString());

    // Highlight winner
    const fastest = stats[0];
    console.log(
      chalk.green(`\n🏆 Fastest Method: ${fastest.method} (${fastest.avgTime.toFixed(0)}ms avg)`)
    );

    // Calculate improvements
    if (stats.length > 1) {
      const baseline = stats.find(s => s.method === 'assistant') || stats[stats.length - 1];
      const improvement = ((baseline.avgTime - fastest.avgTime) / baseline.avgTime) * 100;
      const tokenSavings = baseline.avgTokens - fastest.avgTokens;

      if (improvement > 0) {
        console.log(chalk.green(`   ${improvement.toFixed(1)}% faster than ${baseline.method}`));
      }
      if (tokenSavings > 0) {
        console.log(chalk.green(`   ${tokenSavings.toFixed(0)} fewer tokens per request`));
      }
    }
  }

  /**
   * Compare with baseline
   */
  private compareWithBaseline(): void {
    console.log(chalk.bold('\n📊 Baseline Comparison:'));

    const currentStats = this.calculateMethodStats();
    const table = new Table({
      head: ['Method', 'Metric', 'Baseline', 'Current', 'Change'],
      colWidths: [15, 15, 15, 15, 15],
    });

    currentStats.forEach(current => {
      const baseline = this.baselineResults.get(current.method);
      if (!baseline) return;

      // Time comparison
      const timeChange = ((current.avgTime - baseline.avgTime) / baseline.avgTime) * 100;
      table.push([
        current.method,
        'Avg Time',
        `${baseline.avgTime.toFixed(0)}ms`,
        `${current.avgTime.toFixed(0)}ms`,
        this.formatChange(timeChange, true),
      ]);

      // Token comparison
      const tokenChange = ((current.avgTokens - baseline.avgTokens) / baseline.avgTokens) * 100;
      table.push([
        '',
        'Avg Tokens',
        baseline.avgTokens.toFixed(0),
        current.avgTokens.toFixed(0),
        this.formatChange(tokenChange, true),
      ]);

      // Success rate comparison
      const successChange = current.successRate - baseline.successRate;
      table.push([
        '',
        'Success Rate',
        `${baseline.successRate.toFixed(1)}%`,
        `${current.successRate.toFixed(1)}%`,
        this.formatChange(successChange, false),
      ]);
    });

    console.log(table.toString());
  }

  /**
   * Format change percentage
   */
  private formatChange(change: number, inverse: boolean): string {
    const improved = inverse ? change < 0 : change > 0;
    const symbol = change > 0 ? '+' : '';
    const color = improved ? chalk.green : change === 0 ? chalk.gray : chalk.red;
    return color(`${symbol}${change.toFixed(1)}%`);
  }

  /**
   * Save detailed results
   */
  private saveDetailedResults(): void {
    const filePath = join(this.config.outputDir, `results-${Date.now()}.json`);
    writeFileSync(filePath, JSON.stringify(this.results, null, 2));
    console.log(chalk.gray(`\n💾 Detailed results saved to: ${filePath}`));
  }

  /**
   * Save statistics
   */
  private saveStatistics(stats: MethodStats[]): void {
    const filePath = join(this.config.outputDir, `stats-${Date.now()}.json`);
    writeFileSync(filePath, JSON.stringify(stats, null, 2));

    // Also save as baseline for future comparisons
    const baselinePath = join(this.config.outputDir, 'baseline.json');
    const baseline = Object.fromEntries(stats.map(s => [s.method, s]));
    writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
  }

  /**
   * Generate charts data
   */
  private generateChartsData(): void {
    const chartsData = {
      methods: this.config.methods,
      metrics: {} as any,
    };

    // Group by method
    const methodGroups = new Map<string, BenchmarkResult[]>();
    this.results.forEach(result => {
      const group = methodGroups.get(result.method) || [];
      group.push(result);
      methodGroups.set(result.method, group);
    });

    // Extract metrics for each method
    methodGroups.forEach((results, method) => {
      chartsData.metrics[method] = {
        times: results.map(r => r.totalTime),
        tokens: results.map(r => r.tokensUsed),
        products: results.map(r => r.productsFound),
        success: results.map(r => (r.success ? 1 : 0)),
      };
    });

    const filePath = join(this.config.outputDir, `charts-${Date.now()}.json`);
    writeFileSync(filePath, JSON.stringify(chartsData, null, 2));
  }

  /**
   * Save monitor report
   */
  private saveMonitorReport(): void {
    const report = pdfMonitor.generateReport();
    const filePath = join(this.config.outputDir, `monitor-report-${Date.now()}.md`);
    writeFileSync(filePath, report);
    console.log(chalk.gray(`📊 Monitor report saved to: ${filePath}`));
  }

  /**
   * Load baseline results
   */
  private loadBaseline(): void {
    const baselinePath = join(this.config.outputDir, 'baseline.json');
    if (existsSync(baselinePath)) {
      try {
        const baseline = JSON.parse(readFileSync(baselinePath, 'utf-8'));
        Object.entries(baseline).forEach(([method, stats]) => {
          this.baselineResults.set(method, stats as MethodStats);
        });
        console.log(chalk.gray('📂 Baseline loaded for comparison'));
      } catch (error) {
        console.log(chalk.yellow('⚠️ Failed to load baseline'));
      }
    }
  }

  /**
   * Load PDF buffer
   */
  private loadPDFBuffer(filePath: string): ArrayBuffer {
    const buffer = readFileSync(filePath);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }

  /**
   * Create progress bar
   */
  private createProgressBar(total: number): any {
    const ProgressBar = require('progress');
    return new ProgressBar('  [:bar] :percent :etas', {
      complete: '█',
      incomplete: '░',
      width: 40,
      total,
    });
  }

  /**
   * Print single result
   */
  private printResult(result: BenchmarkResult): void {
    const status = result.success ? chalk.green('✓') : chalk.red('✗');
    const cache = result.cacheHit ? chalk.cyan('[CACHE]') : '';
    console.log(
      `  ${status} ${result.fileName} - ${result.totalTime}ms, ${result.tokensUsed} tokens, ${result.productsFound} products ${cache}`
    );
  }

  /**
   * Calculate average
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  /**
   * Estimate cost
   */
  private estimateCost(totalTokens: number): number {
    // Assume gpt-4o-mini pricing
    const costPer1K = 0.00015 + 0.0006; // input + output
    return (totalTokens / 1000) * costPer1K;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  const config: Partial<BenchmarkConfig> = {
    verbose: args.includes('--verbose'),
    compareBaseline: args.includes('--compare'),
  };

  // Parse iterations
  const iterIndex = args.indexOf('--iterations');
  if (iterIndex !== -1 && args[iterIndex + 1]) {
    config.iterations = parseInt(args[iterIndex + 1]);
  }

  // Parse methods
  const methodsIndex = args.indexOf('--methods');
  if (methodsIndex !== -1 && args[methodsIndex + 1]) {
    config.methods = args[methodsIndex + 1].split(',');
  }

  // Parse test files
  const filesIndex = args.indexOf('--files');
  if (filesIndex !== -1 && args[filesIndex + 1]) {
    config.testFiles = args[filesIndex + 1].split(',');
  }

  // Show help
  if (args.includes('--help')) {
    console.log(`
PDF Extraction Benchmark Tool

Usage: npm run benchmark:pdf [options]

Options:
  --iterations <n>     Number of iterations per test (default: 5)
  --methods <list>     Comma-separated list of methods to test
                       Options: optimized,enhanced,chat,assistant
                       Default: all methods
  --files <list>       Comma-separated list of PDF files to test
  --verbose           Show detailed output for each run
  --compare           Compare results with baseline
  --help              Show this help message

Examples:
  npm run benchmark:pdf
  npm run benchmark:pdf --iterations 10 --verbose
  npm run benchmark:pdf --methods optimized,enhanced --compare
`);
    process.exit(0);
  }

  // Run benchmark
  const benchmark = new PDFExtractionBenchmark(config);
  await benchmark.run();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Benchmark failed:'), error);
    process.exit(1);
  });
}

export { PDFExtractionBenchmark };
