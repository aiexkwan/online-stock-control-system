#!/usr/bin/env tsx
/**
 * Test script for PDF extraction system
 * Tests the new enhanced extraction with pdf-parse and Chat Completions API
 */

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as fs from 'fs';
import * as path from 'path';
import { EnhancedOrderExtractionService } from '../app/services/enhancedOrderExtractionService';
import { PDFPerformanceService } from '../lib/performance/pdf-performance-service';
import { systemLogger } from '../lib/logger';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

async function testPDFExtraction() {
  console.log(`${colors.cyan}==================================${colors.reset}`);
  console.log(`${colors.cyan}PDF Extraction System Test${colors.reset}`);
  console.log(`${colors.cyan}==================================${colors.reset}\n`);

  // Test PDF paths
  const testPDFs = [
    '/Users/chun/Documents/PennineWMS/online-stock-control-system/docs/Others/281513-Picking List.pdf',
    '/Users/chun/Documents/PennineWMS/online-stock-control-system/docs/Others/280952-Picking List.pdf'
  ].filter(fs.existsSync);

  if (testPDFs.length === 0) {
    console.error(`${colors.red}❌ No test PDFs found${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.blue}📄 Found ${testPDFs.length} test PDFs${colors.reset}\n`);

  // Initialize services
  const enhancedService = EnhancedOrderExtractionService.getInstance();
  const performanceService = PDFPerformanceService.getInstance();

  // Test each PDF
  for (const pdfPath of testPDFs) {
    const fileName = path.basename(pdfPath);
    console.log(`${colors.yellow}Testing: ${fileName}${colors.reset}`);
    console.log(`${colors.yellow}${'='.repeat(50)}${colors.reset}`);

    try {
      // Read PDF file
      const fileBuffer = fs.readFileSync(pdfPath);
      console.log(`  File size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);

      // Test 1: Enhanced extraction (pdf-parse + Chat API)
      console.log(`\n${colors.blue}🔧 Test 1: Enhanced Extraction${colors.reset}`);
      const startTime = Date.now();
      const result = await enhancedService.extractOrderFromPDF(fileBuffer.buffer as ArrayBuffer, fileName);
      const elapsed = Date.now() - startTime;

      if (result.success && result.data) {
        console.log(`  ${colors.green}✅ Success${colors.reset}`);
        console.log(`  Order Ref: ${result.data.order_ref}`);
        console.log(`  Products found: ${result.data.products.length}`);
        console.log(`  Processing time: ${elapsed}ms`);
        console.log(`  Tokens used: ${result.metadata.tokensUsed || 'N/A'}`);
        console.log(`  Fallback used: ${result.metadata.fallbackUsed ? 'Yes' : 'No'}`);

        // Show first 3 products
        if (result.data.products.length > 0) {
          console.log(`\n  ${colors.cyan}Sample products:${colors.reset}`);
          result.data.products.slice(0, 3).forEach((product, i) => {
            console.log(`    ${i + 1}. ${product.product_code} - ${product.product_desc} (qty: ${product.product_qty})`);
          });
        }
      } else {
        console.log(`  ${colors.red}❌ Failed: ${result.error}${colors.reset}`);
      }

      // Test 2: Performance optimized extraction
      console.log(`\n${colors.blue}🚀 Test 2: Performance Optimized${colors.reset}`);
      const perfStart = Date.now();
      const perfResult = await performanceService.extractPDF(fileBuffer, fileName);
      const perfElapsed = Date.now() - perfStart;

      console.log(`  Request ID: ${perfResult.requestId}`);
      console.log(`  Cache hit: ${perfResult.performance.cacheHit ? '✅' : '❌'}`);
      console.log(`  Response time: ${perfResult.performance.responseTime}ms`);
      console.log(`  Tokens used: ${perfResult.performance.tokensUsed}`);
      console.log(`  Estimated cost: $${perfResult.performance.cost.toFixed(4)}`);

      // Validation
      console.log(`\n${colors.blue}🔍 Validation${colors.reset}`);
      const validation = enhancedService.validateExtractionResult(result);
      if (validation.isValid) {
        console.log(`  ${colors.green}✅ All validations passed${colors.reset}`);
      } else {
        console.log(`  ${colors.yellow}⚠️ Validation issues:${colors.reset}`);
        validation.issues.forEach(issue => {
          console.log(`    - ${issue}`);
        });
      }

      // Performance comparison
      if (elapsed > 0 && perfElapsed > 0) {
        const speedup = ((elapsed - perfElapsed) / elapsed * 100).toFixed(1);
        console.log(`\n${colors.magenta}📊 Performance Comparison${colors.reset}`);
        console.log(`  Enhanced: ${elapsed}ms`);
        console.log(`  Optimized: ${perfElapsed}ms`);
        console.log(`  Speedup: ${speedup}%`);
      }

    } catch (error) {
      console.error(`  ${colors.red}❌ Error: ${error instanceof Error ? error.message : error}${colors.reset}`);
    }

    console.log(`\n${colors.yellow}${'='.repeat(50)}${colors.reset}\n`);
  }

  // Generate performance report
  console.log(`${colors.cyan}📈 Performance Report${colors.reset}`);
  const report = performanceService.getPerformanceReport();
  console.log(`  Total requests: ${report.monitoring.summary.totalRequests}`);
  console.log(`  Average response time: ${report.monitoring.summary.averageResponseTime}ms`);
  console.log(`  Cache hit rate: ${(Number(report.cache.hitRate || 0) * 100).toFixed(1)}%`);
  console.log(`  Total cost: $${Number(report.monitoring.summary.totalCost || 0).toFixed(4)}`);
  console.log(`  Cost savings: $${Number(report.monitoring.summary.costSavings || 0).toFixed(4)}`);

  // Benchmark comparison (if multiple PDFs)
  if (testPDFs.length > 1) {
    console.log(`\n${colors.cyan}🏁 Running Benchmark${colors.reset}`);
    const benchmarkBuffers = testPDFs.map(p => fs.readFileSync(p));
    const benchmark = await performanceService.runBenchmark(benchmarkBuffers, {
      iterations: 3,
      compareWithBaseline: true
    });
    
    if ('improvement' in benchmark) {
      console.log(`  Speed improvement: ${benchmark.improvement.speedup.toFixed(1)}%`);
      console.log(`  Token savings: ${benchmark.improvement.tokenSavings.toFixed(1)}%`);
      console.log(`  Memory reduction: ${benchmark.improvement.memoryReduction.toFixed(1)}%`);
    }
  }

  console.log(`\n${colors.green}✨ Test completed successfully!${colors.reset}`);
}

// Run tests
testPDFExtraction()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}Fatal error: ${error}${colors.reset}`);
    process.exit(1);
  });