/**
 * Example Integration for PDF Performance Optimization
 * Shows how to integrate the performance modules with your existing PDF extraction system
 */

import { pdfPerformanceService, OptimizedExtractionResult } from './pdf-performance-service';
import { pdfPerformanceMonitor } from './pdf-performance-monitor';
import { pdfCacheOptimizer } from './pdf-cache-optimizer';
import { pdfBenchmark } from './pdf-benchmark';

/**
 * Example 1: Basic PDF extraction with performance optimization
 */
export async function extractPDFWithOptimization(
  fileBuffer: Buffer,
  fileName: string
): Promise<OptimizedExtractionResult> {
  try {
    // Extract PDF with all optimizations enabled
    const result = await pdfPerformanceService.extractPDF(fileBuffer, fileName, {
      priority: 'normal', // Options: 'high', 'normal', 'low'
      skipCache: false,   // Use caching
      skipBatching: false // Use batching
    });
    
    console.log(`PDF extracted in ${result.performance.responseTime}ms`);
    console.log(`Cache hit: ${result.performance.cacheHit}`);
    console.log(`Tokens used: ${result.performance.tokensUsed}`);
    console.log(`Cost: $${result.performance.cost.toFixed(4)}`);
    
    return result;
  } catch (error) {
    console.error('PDF extraction failed:', error);
    throw error;
  }
}

/**
 * Example 2: Batch PDF processing with parallel execution
 */
export async function processBatchPDFs(
  files: Array<{ buffer: Buffer; fileName: string }>
): Promise<OptimizedExtractionResult[]> {
  try {
    // Process multiple PDFs in parallel
    const results = await pdfPerformanceService.extractMultiplePDFs(files, {
      parallel: true,
      maxConcurrency: 3 // Process 3 PDFs at a time
    });
    
    // Calculate total performance metrics
    const totalTime = results.reduce((sum, r) => sum + r.performance.responseTime, 0);
    const totalTokens = results.reduce((sum, r) => sum + r.performance.tokensUsed, 0);
    const totalCost = results.reduce((sum, r) => sum + r.performance.cost, 0);
    const cacheHits = results.filter(r => r.performance.cacheHit).length;
    
    console.log(`Processed ${files.length} PDFs`);
    console.log(`Total time: ${totalTime}ms`);
    console.log(`Average time: ${(totalTime / files.length).toFixed(2)}ms`);
    console.log(`Total tokens: ${totalTokens}`);
    console.log(`Total cost: $${totalCost.toFixed(2)}`);
    console.log(`Cache hits: ${cacheHits}/${files.length}`);
    
    return results;
  } catch (error) {
    console.error('Batch processing failed:', error);
    throw error;
  }
}

/**
 * Example 3: Get performance metrics and recommendations
 */
export function getPerformanceInsights() {
  // Get comprehensive performance report
  const report = pdfPerformanceService.getPerformanceReport();
  
  console.log('\n=== Performance Report ===');
  console.log('\nMonitoring Summary:');
  console.log(`- Total Requests: ${report.monitoring.summary.totalRequests}`);
  console.log(`- Success Rate: ${(report.monitoring.summary.successRate * 100).toFixed(1)}%`);
  console.log(`- Average Response Time: ${report.monitoring.summary.averageResponseTime}`);
  console.log(`- Cache Hit Rate: ${report.monitoring.summary.cacheHitRate}`);
  console.log(`- Total Cost: ${report.monitoring.summary.totalCost}`);
  console.log(`- Cost Savings: ${report.monitoring.summary.costSavings}`);
  
  console.log('\nCache Summary:');
  console.log(`- Entries: ${report.cache.entries}`);
  console.log(`- Size: ${report.cache.sizeMB} MB`);
  console.log(`- Hit Rate: ${report.cache.hitRate}`);
  console.log(`- Evictions: ${report.cache.evictions}`);
  
  console.log('\nBatching Status:');
  console.log(`- Queue Size: ${report.batching.queueSize}`);
  console.log(`- Active Batches: ${report.batching.activeBatches}`);
  console.log(`- Can Accept Requests: ${report.batching.canAcceptRequests}`);
  
  if (report.recommendations.length > 0) {
    console.log('\nRecommendations:');
    report.recommendations.forEach(rec => {
      console.log(`- ${rec}`);
    });
  }
  
  return report;
}

/**
 * Example 4: Run performance benchmark
 */
export async function runPerformanceBenchmark(testFiles: Buffer[]) {
  console.log('\n=== Running Performance Benchmark ===');
  
  // Compare baseline vs optimized performance
  const comparison = await pdfPerformanceService.runBenchmark(testFiles, {
    iterations: 20,
    compareWithBaseline: true
  });
  
  // Generate markdown report
  const report = pdfBenchmark.generateReport(comparison, 'markdown');
  console.log(report);
  
  return comparison;
}

/**
 * Example 5: Configure performance settings
 */
export function configurePerformance() {
  // Update performance configuration
  pdfPerformanceService.updateConfig({
    caching: {
      enabled: true,
      maxSizeMB: 150,      // Increase cache size to 150MB
      ttlSeconds: 3600     // Cache for 1 hour
    },
    batching: {
      enabled: true,
      maxBatchSize: 10,     // Process up to 10 PDFs per batch
      batchTimeoutMs: 3000  // Wait up to 3 seconds before processing
    },
    monitoring: {
      enabled: true,
      thresholds: {
        maxResponseTime: 5000,
        maxTokensPerRequest: 15000,
        maxCostPerRequest: 0.75
      }
    },
    optimization: {
      compressionEnabled: true,
      parallelProcessing: true,
      maxConcurrency: 5,
      retryEnabled: true,
      maxRetries: 3
    }
  });
  
  console.log('Performance configuration updated');
}

/**
 * Example 6: Preload cache with frequently accessed PDFs
 */
export async function preloadFrequentPDFs(
  frequentFiles: Array<{ buffer: Buffer; fileName: string }>
) {
  console.log(`Preloading ${frequentFiles.length} PDFs into cache...`);
  
  await pdfPerformanceService.preloadCache(frequentFiles);
  
  const cacheStats = pdfCacheOptimizer.getCacheSummary();
  console.log(`Cache preloaded: ${cacheStats.entries} entries, ${cacheStats.sizeMB} MB`);
}

/**
 * Example 7: Monitor performance in real-time
 */
export function setupPerformanceMonitoring() {
  // Listen for threshold violations
  pdfPerformanceMonitor.on('threshold-violation', (event) => {
    console.warn('Performance threshold violation detected:');
    console.warn(`Request ID: ${event.requestId}`);
    event.violations.forEach((violation: string) => {
      console.warn(`- ${violation}`);
    });
  });
  
  // Listen for requests
  pdfPerformanceMonitor.on('request', (metadata) => {
    console.log(`Request ${metadata.requestId}: ${metadata.responseTime}ms, ` +
                `Cache: ${metadata.cacheHit}, Tokens: ${metadata.tokensUsed}`);
  });
  
  console.log('Performance monitoring configured');
}

/**
 * Example 8: Export performance data for analysis
 */
export function exportPerformanceData() {
  const data = pdfPerformanceService.exportPerformanceData();
  
  // Save to file or send to analytics service
  const json = JSON.stringify(data, null, 2);
  
  console.log('Performance data exported:');
  console.log(`- Metrics: ${data.metrics.requestHistory.length} requests`);
  console.log(`- Cache: ${data.cache.totalEntries} entries`);
  console.log(`- Batching: ${data.batching.totalRequests} total requests`);
  console.log(`- Exported at: ${data.exportedAt}`);
  
  return json;
}

/**
 * Example 9: Clear all caches and reset metrics
 */
export function resetPerformanceSystem() {
  pdfPerformanceService.clearAll();
  console.log('Performance system reset - all caches cleared and metrics reset');
}

/**
 * Example 10: Integration with existing API route
 */
export async function optimizedAPIHandler(
  fileBuffer: Buffer,
  fileName: string,
  uploadedBy: string
) {
  try {
    // Setup monitoring for this session
    setupPerformanceMonitoring();
    
    // Extract PDF with optimization
    const result = await pdfPerformanceService.extractPDF(fileBuffer, fileName, {
      priority: 'high' // High priority for API requests
    });
    
    // Log performance metrics
    console.log({
      requestId: result.requestId,
      fileName: result.metadata.fileName,
      responseTime: result.performance.responseTime,
      cacheHit: result.performance.cacheHit,
      tokensUsed: result.performance.tokensUsed,
      cost: result.performance.cost,
      uploadedBy
    });
    
    // Return API response
    return {
      success: true,
      data: result.extractedData,
      orderData: result.orderData,
      performance: {
        processingTime: result.performance.responseTime,
        cached: result.performance.cacheHit,
        tokensUsed: result.performance.tokensUsed,
        estimatedCost: result.performance.cost
      },
      metadata: {
        requestId: result.requestId,
        timestamp: result.metadata.timestamp
      }
    };
    
  } catch (error) {
    console.error('API handler error:', error);
    
    // Get performance insights for debugging
    const insights = getPerformanceInsights();
    console.error('Performance state:', insights);
    
    throw error;
  }
}

/**
 * Example Usage Script
 */
export async function demonstrateUsage() {
  console.log('=== PDF Performance Optimization Demo ===\n');
  
  // 1. Configure performance settings
  console.log('1. Configuring performance settings...');
  configurePerformance();
  
  // 2. Setup monitoring
  console.log('\n2. Setting up performance monitoring...');
  setupPerformanceMonitoring();
  
  // 3. Create test data (simulated PDF buffers)
  const testPDF1 = Buffer.from('Sample PDF content 1'.repeat(1000));
  const testPDF2 = Buffer.from('Sample PDF content 2'.repeat(1000));
  const testPDF3 = Buffer.from('Sample PDF content 3'.repeat(1000));
  
  // 4. Single PDF extraction
  console.log('\n3. Extracting single PDF...');
  const singleResult = await extractPDFWithOptimization(testPDF1, 'test1.pdf');
  
  // 5. Batch processing
  console.log('\n4. Processing batch PDFs...');
  const batchResults = await processBatchPDFs([
    { buffer: testPDF1, fileName: 'test1.pdf' },
    { buffer: testPDF2, fileName: 'test2.pdf' },
    { buffer: testPDF3, fileName: 'test3.pdf' }
  ]);
  
  // 6. Get performance insights
  console.log('\n5. Getting performance insights...');
  const insights = getPerformanceInsights();
  
  // 7. Run benchmark
  console.log('\n6. Running performance benchmark...');
  await runPerformanceBenchmark([testPDF1, testPDF2, testPDF3]);
  
  // 8. Export data
  console.log('\n7. Exporting performance data...');
  const exportedData = exportPerformanceData();
  
  // 9. Reset system
  console.log('\n8. Resetting performance system...');
  resetPerformanceSystem();
  
  console.log('\n=== Demo Complete ===');
}

// Uncomment to run the demo
// demonstrateUsage().catch(console.error);