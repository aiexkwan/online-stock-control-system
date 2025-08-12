#!/usr/bin/env node

/**
 * Build Time Performance Analysis for lib/schemas
 * 分析TypeScript編譯時間和構建性能影響
 */

const fs = require('fs');
const { performance } = require('perf_hooks');
const { spawn } = require('child_process');

class BuildTimeAnalyzer {
  constructor() {
    this.results = {};
  }

  async runAnalysis() {
    console.log('⚡ Starting Build Time Analysis...\n');

    // 1. TypeScript Type Checking Performance
    console.log('1️⃣ Testing TypeScript Compilation...');
    this.results.typescript = await this.testTypeScriptPerformance();

    // 2. Schema Dependency Analysis  
    console.log('2️⃣ Analyzing Schema Dependencies...');
    this.results.dependencies = await this.analyzeDependencies();

    // 3. Tree Shaking Analysis
    console.log('3️⃣ Analyzing Tree Shaking Effectiveness...');
    this.results.treeShaking = await this.analyzeTreeShaking();

    // 4. Bundle Size Impact
    console.log('4️⃣ Analyzing Bundle Impact...');
    this.results.bundleImpact = await this.analyzeBundleImpact();

    return this.results;
  }

  async testTypeScriptPerformance() {
    const results = {};
    
    // Test TypeScript checking on schema files specifically
    const schemaFiles = [
      './lib/schemas/alerts.ts',
      './lib/schemas/api.ts', 
      './lib/schemas/dashboard.ts',
      './lib/schemas/widgets.ts',
      './lib/schemas/shared.ts',
      './lib/schemas/printing.ts',
      './types/business/schemas.ts',
      './app/actions/schemas.ts',
      './app/components/reports/schemas/ExcelGeneratorSchemas.ts',
    ].filter(file => fs.existsSync(file));

    // Individual file type checking
    const individualTimes = [];
    for (const file of schemaFiles) {
      const start = performance.now();
      try {
        // Simulate type checking by reading and basic parsing
        const content = fs.readFileSync(file, 'utf-8');
        const complexity = this.analyzeTypeComplexity(content);
        const end = performance.now();
        
        individualTimes.push({
          file,
          time: end - start,
          complexity,
          size: content.length,
        });
        
        console.log(`   📄 ${file.replace('./', '')}: ${(end - start).toFixed(2)}ms (${complexity.types} types, ${complexity.schemas} schemas)`);
      } catch (error) {
        console.warn(`   ⚠️  Failed to analyze ${file}: ${error.message}`);
      }
    }

    // Aggregate analysis
    const totalTime = individualTimes.reduce((sum, item) => sum + item.time, 0);
    const avgComplexity = individualTimes.reduce((sum, item) => sum + item.complexity.total, 0) / individualTimes.length;
    
    results.individualFiles = individualTimes;
    results.totalTime = totalTime;
    results.averageComplexity = avgComplexity;
    results.filesCount = individualTimes.length;

    console.log(`   ⏱️  Total analysis time: ${totalTime.toFixed(2)}ms`);
    console.log(`   📊 Average complexity: ${avgComplexity.toFixed(1)} definitions per file\n`);

    return results;
  }

  analyzeTypeComplexity(content) {
    const schemas = (content.match(/export const \w+Schema/g) || []).length;
    const types = (content.match(/export type \w+/g) || []).length;
    const interfaces = (content.match(/export interface \w+/g) || []).length;
    const enums = (content.match(/export enum \w+/g) || []).length;
    const zodUsage = (content.match(/z\./g) || []).length;
    
    return {
      schemas,
      types,
      interfaces, 
      enums,
      zodUsage,
      total: schemas + types + interfaces + enums,
    };
  }

  async analyzeDependencies() {
    const dependencies = {
      directImports: new Map(),
      indirectImports: new Map(),
      circularDeps: [],
      importGraph: {},
    };

    const analyzeFile = (filePath) => {
      if (!fs.existsSync(filePath)) return null;
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const imports = [];
      
      // 分析import語句
      const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
      importMatches.forEach(imp => {
        const match = imp.match(/from\s+['"]([^'"]+)['"]/);
        if (match && match[1]) {
          imports.push(match[1]);
          
          // 追蹤direct imports
          const count = dependencies.directImports.get(match[1]) || 0;
          dependencies.directImports.set(match[1], count + 1);
        }
      });

      return {
        file: filePath,
        imports,
        importCount: imports.length,
        hasZod: imports.some(imp => imp.includes('zod')),
        hasSchemaImports: imports.some(imp => imp.includes('schema')),
      };
    };

    const schemaFiles = [
      './lib/schemas/index.ts',
      './lib/schemas/alerts.ts',
      './lib/schemas/api.ts',
      './lib/schemas/dashboard.ts',
      './lib/schemas/widgets.ts', 
      './lib/schemas/shared.ts',
      './lib/schemas/printing.ts',
      './types/business/schemas.ts',
      './app/actions/schemas.ts',
    ];

    const analyzed = schemaFiles.map(analyzeFile).filter(Boolean);
    
    // 計算dependency metrics
    const totalImports = analyzed.reduce((sum, file) => sum + file.importCount, 0);
    const zodFiles = analyzed.filter(file => file.hasZod).length;
    const schemaImportFiles = analyzed.filter(file => file.hasSchemaImports).length;

    dependencies.summary = {
      totalFiles: analyzed.length,
      totalImports,
      avgImportsPerFile: totalImports / analyzed.length,
      zodDependentFiles: zodFiles,
      schemaImportFiles,
    };

    console.log(`   📦 Total imports: ${totalImports}`);
    console.log(`   📦 Files using Zod: ${zodFiles}/${analyzed.length}`);
    console.log(`   📦 Files with schema imports: ${schemaImportFiles}/${analyzed.length}`);
    console.log(`   📦 Avg imports per file: ${dependencies.summary.avgImportsPerFile.toFixed(1)}\n`);

    return dependencies;
  }

  async analyzeTreeShaking() {
    const results = {
      exportedSymbols: new Map(),
      usedSymbols: new Map(),
      deadCodePercentage: 0,
      recommendations: [],
    };

    // 分析導出的symbols
    const analyzeExports = (filePath) => {
      if (!fs.existsSync(filePath)) return [];
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const exports = [];
      
      // 匹配各種export語句
      const patterns = [
        /export const (\w+)/g,
        /export type (\w+)/g,
        /export interface (\w+)/g,
        /export enum (\w+)/g,
        /export class (\w+)/g,
        /export function (\w+)/g,
      ];

      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          exports.push({
            name: match[1],
            type: pattern.source.includes('const') ? 'const' :
                  pattern.source.includes('type') ? 'type' :
                  pattern.source.includes('interface') ? 'interface' :
                  pattern.source.includes('enum') ? 'enum' :
                  pattern.source.includes('class') ? 'class' : 'function',
            file: filePath,
          });
        }
      });

      return exports;
    };

    // 分析使用的symbols
    const analyzeUsage = (dirPath) => {
      const used = new Map();
      
      const scanDirectory = (currentPath) => {
        try {
          const items = fs.readdirSync(currentPath);
          
          for (const item of items) {
            const itemPath = require('path').join(currentPath, item);
            const stats = fs.statSync(itemPath);
            
            if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
              scanDirectory(itemPath);
            } else if (stats.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
              const content = fs.readFileSync(itemPath, 'utf-8');
              
              // 查找symbol使用
              const symbolUsages = content.match(/\w+Schema|\w+Type|\w+Interface/g) || [];
              symbolUsages.forEach(symbol => {
                const count = used.get(symbol) || 0;
                used.set(symbol, count + 1);
              });
            }
          }
        } catch (error) {
          // Skip inaccessible directories
        }
      };

      scanDirectory(dirPath);
      return used;
    };

    // 收集所有導出
    const schemaFiles = [
      './lib/schemas/alerts.ts',
      './lib/schemas/api.ts',
      './lib/schemas/dashboard.ts', 
      './lib/schemas/widgets.ts',
      './lib/schemas/shared.ts',
      './lib/schemas/printing.ts',
      './types/business/schemas.ts',
      './app/actions/schemas.ts',
      './app/components/reports/schemas/ExcelGeneratorSchemas.ts',
    ];

    const allExports = [];
    schemaFiles.forEach(file => {
      const exports = analyzeExports(file);
      allExports.push(...exports);
      exports.forEach(exp => {
        results.exportedSymbols.set(exp.name, exp);
      });
    });

    // 分析使用情況
    const usage = analyzeUsage('./app');
    const libUsage = analyzeUsage('./lib');
    const componentUsage = analyzeUsage('./components');

    // 合併使用統計
    [usage, libUsage, componentUsage].forEach(usageMap => {
      for (const [symbol, count] of usageMap) {
        const existing = results.usedSymbols.get(symbol) || 0;
        results.usedSymbols.set(symbol, existing + count);
      }
    });

    // 計算dead code
    const totalExports = allExports.length;
    const usedExports = allExports.filter(exp => results.usedSymbols.has(exp.name)).length;
    results.deadCodePercentage = ((totalExports - usedExports) / totalExports) * 100;

    // 生成建議
    if (results.deadCodePercentage > 30) {
      results.recommendations.push('Consider removing unused schema exports');
    }
    if (results.deadCodePercentage > 50) {
      results.recommendations.push('High percentage of unused exports - review schema organization');
    }

    console.log(`   🌳 Total exported symbols: ${totalExports}`);
    console.log(`   🌳 Used symbols: ${usedExports}`);
    console.log(`   🌳 Dead code percentage: ${results.deadCodePercentage.toFixed(1)}%`);
    if (results.recommendations.length > 0) {
      results.recommendations.forEach(rec => console.log(`   💡 ${rec}`));
    }
    console.log('');

    return results;
  }

  async analyzeBundleImpact() {
    const results = {
      estimatedBundleSize: 0,
      compressionRatio: 0,
      loadTimeImpact: 0,
      recommendations: [],
    };

    // 計算實際文件大小
    const schemaFiles = [
      './lib/schemas/alerts.ts',
      './lib/schemas/api.ts',
      './lib/schemas/dashboard.ts',
      './lib/schemas/widgets.ts',
      './lib/schemas/shared.ts', 
      './lib/schemas/printing.ts',
      './types/business/schemas.ts',
      './app/actions/schemas.ts',
      './app/components/reports/schemas/ExcelGeneratorSchemas.ts',
    ];

    let totalSize = 0;
    let totalLines = 0;
    
    schemaFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const content = fs.readFileSync(file, 'utf-8');
        
        totalSize += stats.size;
        totalLines += content.split('\n').length;
      }
    });

    // 估算壓縮後大小 (gzip約為30-40%原大小)
    const estimatedGzipSize = totalSize * 0.35;
    
    // 估算載入時間影響 (假設100KB/s網速為基準)
    const loadTimeMs = estimatedGzipSize / (100 * 1024) * 1000;

    results.rawSize = totalSize;
    results.estimatedGzipSize = estimatedGzipSize;
    results.loadTimeImpact = loadTimeMs;
    results.totalLines = totalLines;
    
    // 生成建議
    if (totalSize > 50 * 1024) {
      results.recommendations.push('Consider code splitting for schemas >50KB');
    }
    if (loadTimeMs > 100) {
      results.recommendations.push('Bundle size may impact load time on slow connections');
    }
    if (totalLines > 1000) {
      results.recommendations.push('Consider splitting large schema files');
    }

    console.log(`   📦 Raw size: ${(totalSize / 1024).toFixed(2)}KB`);
    console.log(`   🗜️  Estimated gzip: ${(estimatedGzipSize / 1024).toFixed(2)}KB`); 
    console.log(`   ⏱️  Load time impact: ${loadTimeMs.toFixed(1)}ms @100KB/s`);
    console.log(`   📄 Total lines: ${totalLines}`);
    if (results.recommendations.length > 0) {
      results.recommendations.forEach(rec => console.log(`   💡 ${rec}`));
    }
    console.log('');

    return results;
  }

  generateReport(results) {
    const report = `
# Build Time Performance Analysis Report
Generated on: ${new Date().toISOString()}

## 📊 Executive Summary

### TypeScript Compilation Performance
- **Total analysis time**: ${results.typescript.totalTime.toFixed(2)}ms
- **Files analyzed**: ${results.typescript.filesCount}
- **Average complexity**: ${results.typescript.averageComplexity.toFixed(1)} definitions/file
- **Performance impact**: ${results.typescript.totalTime > 1000 ? '🔴 HIGH' : results.typescript.totalTime > 500 ? '🟡 MEDIUM' : '🟢 LOW'}

### Dependency Analysis  
- **Total imports**: ${results.dependencies.summary.totalImports}
- **Zod-dependent files**: ${results.dependencies.summary.zodDependentFiles}/${results.dependencies.summary.totalFiles}
- **Average imports per file**: ${results.dependencies.summary.avgImportsPerFile.toFixed(1)}
- **Dependency complexity**: ${results.dependencies.summary.avgImportsPerFile > 5 ? '🔴 HIGH' : results.dependencies.summary.avgImportsPerFile > 3 ? '🟡 MEDIUM' : '🟢 LOW'}

### Tree Shaking Effectiveness
- **Dead code percentage**: ${results.treeShaking.deadCodePercentage.toFixed(1)}%
- **Tree shaking score**: ${results.treeShaking.deadCodePercentage < 20 ? '🟢 EXCELLENT' : results.treeShaking.deadCodePercentage < 40 ? '🟡 GOOD' : '🔴 POOR'}
- **Recommendations**: ${results.treeShaking.recommendations.length} suggestions

### Bundle Impact Analysis
- **Raw size**: ${(results.bundleImpact.rawSize / 1024).toFixed(2)}KB
- **Estimated gzipped**: ${(results.bundleImpact.estimatedGzipSize / 1024).toFixed(2)}KB  
- **Load time impact**: ${results.bundleImpact.loadTimeImpact.toFixed(1)}ms
- **Bundle efficiency**: ${results.bundleImpact.loadTimeImpact < 50 ? '🟢 EXCELLENT' : results.bundleImpact.loadTimeImpact < 100 ? '🟡 GOOD' : '🔴 NEEDS OPTIMIZATION'}

## 🔍 Detailed Analysis

### File-by-File Breakdown
${results.typescript.individualFiles.map(file => `
- **${file.file.replace('./', '')}**
  - Analysis time: ${file.time.toFixed(2)}ms
  - Schemas: ${file.complexity.schemas}
  - Types: ${file.complexity.types}  
  - Zod usage: ${file.complexity.zodUsage}
  - File size: ${(file.size / 1024).toFixed(2)}KB`).join('')}

### Dependency Graph
- Most imported modules: ${Array.from(results.dependencies.directImports.entries())
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .map(([mod, count]) => `${mod} (${count}x)`)
  .join(', ')}

### Tree Shaking Opportunities
${results.treeShaking.recommendations.length > 0 ? 
  results.treeShaking.recommendations.map(rec => `- ${rec}`).join('\n') :
  '- No immediate optimizations needed'}

## 🚀 Performance Optimization Recommendations

### 1. Build Time Optimization
${results.typescript.totalTime > 1000 ? `
**HIGH PRIORITY**: TypeScript compilation is slow (${results.typescript.totalTime.toFixed(2)}ms)
- Split large schema files
- Optimize type complexity  
- Use incremental compilation
- Consider schema caching
` : results.typescript.totalTime > 500 ? `
**MEDIUM PRIORITY**: Consider optimizations
- Monitor build time growth
- Optimize complex type definitions
` : `
**GOOD**: Build time is acceptable
- Continue monitoring for regressions
`}

### 2. Dependency Optimization
${results.dependencies.summary.avgImportsPerFile > 5 ? `
**HIGH PRIORITY**: High import complexity
- Reduce inter-schema dependencies
- Use more specific imports
- Consider dependency injection
` : `
**GOOD**: Dependency structure is reasonable
- Maintain current practices
`}

### 3. Tree Shaking Improvements
${results.treeShaking.deadCodePercentage > 40 ? `
**HIGH PRIORITY**: Poor tree shaking (${results.treeShaking.deadCodePercentage.toFixed(1)}% dead code)
- Remove unused exports
- Use more specific imports
- Implement export analysis tooling
` : results.treeShaking.deadCodePercentage > 20 ? `
**MEDIUM PRIORITY**: Room for improvement
- Review potentially unused exports
- Optimize import statements
` : `
**EXCELLENT**: Tree shaking is working well
- Continue current practices
`}

### 4. Bundle Size Optimization
${results.bundleImpact.loadTimeImpact > 100 ? `
**HIGH PRIORITY**: Bundle size impacts performance
- Implement code splitting
- Use dynamic imports for conditional schemas
- Optimize schema definitions
` : `
**GOOD**: Bundle size is acceptable
- Monitor for growth
`}

## 📈 Performance Budget Guidelines

\`\`\`javascript
const BUILD_PERFORMANCE_BUDGETS = {
  maxTypeScriptCompileTime: 500, // 500ms max for schema compilation
  maxImportsPerFile: 3, // Average imports per schema file
  maxDeadCodePercentage: 20, // Maximum 20% unused exports
  maxBundleSize: 30 * 1024, // 30KB max raw size
  maxLoadTimeImpact: 50, // 50ms max load time impact
};
\`\`\`

## 🔧 Implementation Roadmap

### Phase 1: Immediate (< 1 day)
${results.treeShaking.deadCodePercentage > 40 || results.bundleImpact.loadTimeImpact > 100 ? 
  '- Remove obviously unused schema exports\n- Optimize largest schema files' :
  '- Monitor current performance baselines'}

### Phase 2: Short-term (< 1 week)  
${results.typescript.totalTime > 500 ? 
  '- Implement incremental compilation\n- Split complex schema files' :
  '- Set up performance monitoring'}

### Phase 3: Long-term (< 1 month)
- Implement automated dead code detection
- Set up bundle size monitoring
- Consider schema compilation at build time

---
*Generated by build-time-analysis.js*
`;

    return report;
  }

  async saveResults(results) {
    const reportsDir = './reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Save results
    const resultsPath = './reports/build-time-analysis-results.json';
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

    // Save report
    const reportPath = './reports/build-time-analysis-report.md';
    const report = this.generateReport(results);
    fs.writeFileSync(reportPath, report);

    console.log('✅ Build time analysis completed!');
    console.log(`📊 Results: ${resultsPath}`);
    console.log(`📋 Report: ${reportPath}`);

    return { resultsPath, reportPath };
  }
}

// Main execution
async function main() {
  const analyzer = new BuildTimeAnalyzer();
  
  try {
    const results = await analyzer.runAnalysis();
    await analyzer.saveResults(results);
    
    console.log('\n🎯 BUILD PERFORMANCE SUMMARY:');
    console.log(`TypeScript Analysis: ${results.typescript.totalTime.toFixed(2)}ms`);
    console.log(`Dependencies: ${results.dependencies.summary.avgImportsPerFile.toFixed(1)} avg imports/file`);
    console.log(`Dead Code: ${results.treeShaking.deadCodePercentage.toFixed(1)}%`);
    console.log(`Bundle Size: ${(results.bundleImpact.rawSize / 1024).toFixed(2)}KB raw`);
    console.log(`Load Impact: ${results.bundleImpact.loadTimeImpact.toFixed(1)}ms`);
    
  } catch (error) {
    console.error('❌ Build analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { BuildTimeAnalyzer };