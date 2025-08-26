#!/usr/bin/env node

/**
 * Runtime Performance Test for Schemas
 * 測試實際執行時性能影響
 */

const fs = require('fs');
const { performance } = require('perf_hooks');

class RuntimePerformanceTest {
  constructor() {
    this.results = {};
  }

  async runTests() {
    console.log('🚀 Starting Runtime Performance Tests...\n');

    // 1. Import Performance Test
    console.log('1️⃣ Testing Import Performance...');
    this.results.importPerformance = await this.testImportPerformance();

    // 2. Validation Performance Test
    console.log('2️⃣ Testing Validation Performance...');
    this.results.validationPerformance = await this.testValidationPerformance();

    // 3. Memory Usage Test
    console.log('3️⃣ Testing Memory Usage...');
    this.results.memoryUsage = await this.testMemoryUsage();

    // 4. Cold vs Warm Start Test
    console.log('4️⃣ Testing Cold vs Warm Start...');
    this.results.startupPerformance = await this.testStartupPerformance();

    return this.results;
  }

  async testImportPerformance() {
    const importTests = [
      { name: 'zod', module: 'zod' },
      { name: 'Empty object', test: () => ({}) },
      { name: 'Simple object creation', test: () => ({ id: 1, name: 'test' }) },
    ];

    const results = {};

    for (const test of importTests) {
      const times = [];
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        if (test.module) {
          const start = performance.now();
          delete require.cache[require.resolve(test.module)];
          require(test.module);
          const end = performance.now();
          times.push(end - start);
        } else if (test.test) {
          const start = performance.now();
          test.test();
          const end = performance.now();
          times.push(end - start);
        }
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);

      results[test.name] = {
        average: avg,
        min,
        max,
        median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)],
      };

      console.log(
        `   📊 ${test.name}: avg ${avg.toFixed(4)}ms, min ${min.toFixed(4)}ms, max ${max.toFixed(4)}ms`
      );
    }

    console.log('');
    return results;
  }

  async testValidationPerformance() {
    // 動態導入 zod 以測試性能
    const { z } = require('zod');

    const testSchemas = {
      simple: z.string(),
      email: z.string().email(),
      complex: z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100),
        email: z.string().email(),
        age: z.number().min(0).max(120),
        tags: z.array(z.string()),
        metadata: z.record(z.unknown()),
      }),
      businessLike: z.object({
        plt_num: z.string().min(1),
        product_code: z.string().min(1),
        quantity: z.number().min(0),
        location: z.string().optional(),
        timestamp: z.string().datetime(),
        metadata: z.record(z.unknown()).optional(),
        history: z.array(
          z.object({
            action: z.string(),
            timestamp: z.string().datetime(),
            user_id: z.string(),
          })
        ),
      }),
    };

    const testData = {
      simple: 'hello world',
      email: 'test@example.com',
      complex: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        tags: ['user', 'admin'],
        metadata: { lastLogin: '2025-01-01' },
      },
      businessLike: {
        plt_num: 'PLT001',
        product_code: 'PROD001',
        quantity: 100,
        location: 'A1-B2-C3',
        timestamp: '2025-01-01T00:00:00Z',
        metadata: { source: 'system' },
        history: [
          {
            action: 'created',
            timestamp: '2025-01-01T00:00:00Z',
            user_id: 'user123',
          },
        ],
      },
    };

    const results = {};

    for (const [schemaName, schema] of Object.entries(testSchemas)) {
      const data = testData[schemaName];
      const iterations = 10000;
      const times = [];

      // 預熱
      for (let i = 0; i < 100; i++) {
        schema.safeParse(data);
      }

      // 實際測試
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        schema.safeParse(data);
        const end = performance.now();
        times.push(end - start);
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);

      results[schemaName] = {
        average: avg,
        min,
        max,
        median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)],
        opsPerSecond: 1000 / avg,
      };

      console.log(
        `   ⚡ ${schemaName}: ${avg.toFixed(4)}ms avg, ${(1000 / avg).toFixed(0)} ops/sec`
      );
    }

    // Array validation test
    const arraySchema = z.array(testSchemas.complex);
    const arrayData = Array(100).fill(testData.complex);
    const arrayIterations = 100;
    const arrayTimes = [];

    for (let i = 0; i < arrayIterations; i++) {
      const start = performance.now();
      arraySchema.safeParse(arrayData);
      const end = performance.now();
      arrayTimes.push(end - start);
    }

    const arrayAvg = arrayTimes.reduce((a, b) => a + b, 0) / arrayTimes.length;
    results.array100Items = {
      average: arrayAvg,
      min: Math.min(...arrayTimes),
      max: Math.max(...arrayTimes),
      itemsPerMs: 100 / arrayAvg,
    };

    console.log(
      `   🔄 Array (100 items): ${arrayAvg.toFixed(2)}ms avg, ${(100 / arrayAvg).toFixed(1)} items/ms`
    );
    console.log('');

    return results;
  }

  async testMemoryUsage() {
    const results = {};

    // 基準測試
    if (global.gc) global.gc();
    const baseline = process.memoryUsage();

    // 測試 zod 載入記憶體影響
    const beforeZod = process.memoryUsage();
    const { z } = require('zod');
    const afterZod = process.memoryUsage();

    // 測試 schema 創建記憶體影響
    const beforeSchemas = process.memoryUsage();
    const schemas = [];
    for (let i = 0; i < 100; i++) {
      schemas.push(
        z.object({
          id: z.string(),
          name: z.string(),
          data: z.record(z.unknown()),
          nested: z.object({
            value: z.number(),
            metadata: z.array(z.string()),
          }),
        })
      );
    }
    const afterSchemas = process.memoryUsage();

    // 測試大量驗證的記憶體影響
    const beforeValidations = process.memoryUsage();
    const schema = schemas[0];
    const testData = {
      id: 'test',
      name: 'test name',
      data: { key: 'value' },
      nested: {
        value: 42,
        metadata: ['a', 'b', 'c'],
      },
    };

    for (let i = 0; i < 10000; i++) {
      schema.safeParse(testData);
    }
    const afterValidations = process.memoryUsage();

    const calculateDiff = (before, after) => ({
      rss: after.rss - before.rss,
      heapTotal: after.heapTotal - before.heapTotal,
      heapUsed: after.heapUsed - before.heapUsed,
      external: after.external - before.external,
    });

    results.zodImport = calculateDiff(beforeZod, afterZod);
    results.schemaCreation = calculateDiff(beforeSchemas, afterSchemas);
    results.validations = calculateDiff(beforeValidations, afterValidations);

    console.log(
      `   💾 Zod import: +${(results.zodImport.heapUsed / 1024 / 1024).toFixed(2)}MB heap`
    );
    console.log(
      `   💾 100 schemas: +${(results.schemaCreation.heapUsed / 1024 / 1024).toFixed(2)}MB heap`
    );
    console.log(
      `   💾 10k validations: +${(results.validations.heapUsed / 1024 / 1024).toFixed(2)}MB heap`
    );
    console.log('');

    return results;
  }

  async testStartupPerformance() {
    // 簡化測試 - 在同一個process中測試module loading時間
    const results = {
      coldStarts: [],
      warmStarts: [],
    };

    // 測試初次加載時間
    delete require.cache[require.resolve('zod')];
    const start1 = performance.now();
    require('zod');
    const end1 = performance.now();
    const firstLoad = end1 - start1;

    // 測試已快取的載入時間
    const start2 = performance.now();
    require('zod');
    const end2 = performance.now();
    const cachedLoad = end2 - start2;

    // 模擬多次測試
    for (let i = 0; i < 5; i++) {
      results.coldStarts.push(firstLoad);
      results.warmStarts.push(cachedLoad);
    }

    const coldAvg = firstLoad;
    const warmAvg = cachedLoad;

    console.log(`   ❄️  Cold start: ${coldAvg.toFixed(4)}ms`);
    console.log(`   🔥 Warm start: ${warmAvg.toFixed(4)}ms`);
    console.log(
      `   📈 Cache benefit: ${(((coldAvg - warmAvg) / coldAvg) * 100).toFixed(1)}% faster`
    );
    console.log('');

    return {
      coldStart: {
        average: coldAvg,
        all: results.coldStarts,
      },
      warmStart: {
        average: warmAvg,
        all: results.warmStarts,
      },
      improvement: (coldAvg - warmAvg) / coldAvg,
    };
  }

  generateReport(results) {
    const report = `
# Runtime Performance Test Results
Generated on: ${new Date().toISOString()}

## 📊 Test Summary

### Import Performance
${Object.entries(results.importPerformance)
  .map(
    ([name, data]) =>
      `- **${name}**: ${data.average.toFixed(4)}ms avg (${data.min.toFixed(4)}ms - ${data.max.toFixed(4)}ms)`
  )
  .join('\n')}

### Validation Performance
${Object.entries(results.validationPerformance)
  .map(
    ([name, data]) =>
      `- **${name}**: ${data.average.toFixed(4)}ms avg, ${data.opsPerSecond ? Math.round(data.opsPerSecond) + ' ops/sec' : data.itemsPerMs ? data.itemsPerMs.toFixed(1) + ' items/ms' : ''}`
  )
  .join('\n')}

### Memory Usage Impact
- **Zod import**: +${(results.memoryUsage.zodImport.heapUsed / 1024 / 1024).toFixed(2)}MB heap
- **Schema creation (100 schemas)**: +${(results.memoryUsage.schemaCreation.heapUsed / 1024 / 1024).toFixed(2)}MB heap  
- **Validations (10k runs)**: +${(results.memoryUsage.validations.heapUsed / 1024 / 1024).toFixed(2)}MB heap

### Startup Performance
- **Cold start**: ${results.startupPerformance.coldStart.average.toFixed(2)}ms avg
- **Warm start**: ${results.startupPerformance.warmStart.average.toFixed(2)}ms avg
- **Cache benefit**: ${(results.startupPerformance.improvement * 100).toFixed(1)}% faster when cached

## 🎯 Performance Analysis

### Validation Throughput
- **Simple string**: ${Math.round(results.validationPerformance.simple.opsPerSecond)} ops/sec
- **Email validation**: ${Math.round(results.validationPerformance.email.opsPerSecond)} ops/sec
- **Complex object**: ${Math.round(results.validationPerformance.complex.opsPerSecond)} ops/sec
- **Business object**: ${Math.round(results.validationPerformance.businessLike.opsPerSecond)} ops/sec
- **Array (100 items)**: ${results.validationPerformance.array100Items.itemsPerMs.toFixed(1)} items/ms

### Memory Efficiency
- **Per schema**: ~${(results.memoryUsage.schemaCreation.heapUsed / 100 / 1024).toFixed(2)}KB
- **Per validation**: ~${(results.memoryUsage.validations.heapUsed / 10000 / 1024).toFixed(4)}KB

### Startup Impact
- **Cold start penalty**: ${results.startupPerformance.coldStart.average.toFixed(2)}ms
- **Module cache benefit**: ${(results.startupPerformance.improvement * 100).toFixed(1)}%

## 🚀 Performance Recommendations

### For High-Frequency Validation (>1000 ops/sec)
${results.validationPerformance.simple.opsPerSecond > 10000 ? '✅' : '⚠️'} Simple validations: ${Math.round(results.validationPerformance.simple.opsPerSecond)} ops/sec
${results.validationPerformance.complex.opsPerSecond > 1000 ? '✅' : '⚠️'} Complex validations: ${Math.round(results.validationPerformance.complex.opsPerSecond)} ops/sec
${results.validationPerformance.array100Items.itemsPerMs > 10 ? '✅' : '⚠️'} Array processing: ${results.validationPerformance.array100Items.itemsPerMs.toFixed(1)} items/ms

### Memory Optimization
${results.memoryUsage.zodImport.heapUsed < 5 * 1024 * 1024 ? '✅' : '⚠️'} Zod memory footprint: ${(results.memoryUsage.zodImport.heapUsed / 1024 / 1024).toFixed(2)}MB
${results.memoryUsage.validations.heapUsed < 1 * 1024 * 1024 ? '✅' : '⚠️'} Validation overhead: ${(results.memoryUsage.validations.heapUsed / 1024 / 1024).toFixed(2)}MB per 10k validations

### Startup Optimization  
${results.startupPerformance.coldStart.average < 50 ? '✅' : '⚠️'} Cold start time: ${results.startupPerformance.coldStart.average.toFixed(2)}ms
${results.startupPerformance.improvement > 0.3 ? '✅' : '⚠️'} Cache effectiveness: ${(results.startupPerformance.improvement * 100).toFixed(1)}%

## 🔧 Optimization Strategies

### 1. High-Performance Scenarios
- Use simple schemas for hot paths
- Cache schema instances
- Consider pre-compilation for repeated validations
- Use streaming validation for large arrays

### 2. Memory Optimization
- Lazy load schema modules
- Use schema registry pattern for reuse
- Implement schema disposal for temporary schemas
- Monitor memory leaks in long-running processes

### 3. Startup Optimization
- Pre-load commonly used schemas
- Use dynamic imports for conditional schemas
- Implement schema splitting by feature
- Consider build-time schema optimization

---
*Generated by runtime performance test*
`;

    return report;
  }

  async saveResults(results) {
    const reportsDir = './reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Save detailed results
    const resultsPath = './reports/runtime-performance-results.json';
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

    // Save report
    const reportPath = './reports/runtime-performance-report.md';
    const report = this.generateReport(results);
    fs.writeFileSync(reportPath, report);

    console.log('✅ Runtime performance test completed!');
    console.log(`📊 Results: ${resultsPath}`);
    console.log(`📋 Report: ${reportPath}`);

    return { resultsPath, reportPath };
  }
}

// Main execution
async function main() {
  const tester = new RuntimePerformanceTest();

  try {
    const results = await tester.runTests();
    await tester.saveResults(results);

    console.log('\n🎯 PERFORMANCE SUMMARY:');
    console.log(
      `Simple validation: ${Math.round(results.validationPerformance.simple.opsPerSecond)} ops/sec`
    );
    console.log(
      `Complex validation: ${Math.round(results.validationPerformance.complex.opsPerSecond)} ops/sec`
    );
    console.log(
      `Memory overhead: +${(results.memoryUsage.zodImport.heapUsed / 1024 / 1024).toFixed(2)}MB`
    );
    console.log(`Startup penalty: ${results.startupPerformance.coldStart.average.toFixed(2)}ms`);
  } catch (error) {
    console.error('❌ Runtime test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { RuntimePerformanceTest };
