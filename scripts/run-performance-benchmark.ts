#!/usr/bin/env node

import { performanceBenchmark } from '../lib/performance/performance-benchmark';
import * as fs from 'fs';
import * as path from 'path';

console.log('🚀 Performance Benchmark Tool');
console.log('=' .repeat(50));

async function main() {
  try {
    // Run comprehensive benchmarks
    const report = await performanceBenchmark.generateComprehensiveReport();

    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'docs', 'performance-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Generate markdown report
    const timestamp = new Date().toISOString().split('T')[0];
    const reportPath = path.join(reportsDir, `benchmark-${timestamp}.md`);
    
    const markdownReport = `
# Performance Benchmark Report
Date: ${timestamp}

## Overall Performance Grade: ${report.performanceGrade}

## Dashboard API Results
- Average Response Time: ${report.dashboard.summary.avgResponseTime.toFixed(2)}ms
- P95 Response Time: ${report.dashboard.summary.p95ResponseTime.toFixed(2)}ms
- Error Rate: ${(report.dashboard.summary.errorRate * 100).toFixed(2)}%

### Dashboard Recommendations:
${report.dashboard.recommendations.map(r => `- ${r}`).join('\n')}

## Inventory API Results
- Average Response Time: ${report.inventory.summary.avgResponseTime.toFixed(2)}ms
- P95 Response Time: ${report.inventory.summary.p95ResponseTime.toFixed(2)}ms
- Error Rate: ${(report.inventory.summary.errorRate * 100).toFixed(2)}%

### Inventory Recommendations:
${report.inventory.recommendations.map(r => `- ${r}`).join('\n')}

## Overall Recommendations:
${report.overallRecommendations.map(r => `- ${r}`).join('\n')}
`;

    fs.writeFileSync(reportPath, markdownReport);

    console.log('\n📊 Summary Results:');
    console.log('=' .repeat(50));
    console.log(`Performance Grade: ${report.performanceGrade}`);
    console.log(`Dashboard Avg Response: ${report.dashboard.summary.avgResponseTime.toFixed(2)}ms`);
    console.log(`Inventory Avg Response: ${report.inventory.summary.avgResponseTime.toFixed(2)}ms`);
    console.log('\n📦 Report saved to:', reportPath);

    // Exit with success
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Benchmark failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}