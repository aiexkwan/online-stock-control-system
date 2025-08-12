#!/usr/bin/env node

/**
 * JavaScript版本的schemas性能分析
 * 簡化版本，專注於關鍵性能指標
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class SchemasPerformanceAnalyzer {
  constructor() {
    this.metrics = {};
  }

  async runAnalysis() {
    console.log('🔍 Starting lib/schemas Performance Analysis...\n');

    // 1. Bundle Size Analysis
    console.log('1️⃣ Analyzing Bundle Size Impact...');
    this.metrics.bundleSize = this.analyzeBundleSize();

    // 2. Schema Count Analysis
    console.log('2️⃣ Analyzing Schema Definitions...');
    this.metrics.schemaCounts = this.countSchemas();

    // 3. Usage Analysis
    console.log('3️⃣ Analyzing Schema Usage...');
    this.metrics.usage = this.analyzeUsage();

    // 4. Dependency Analysis
    console.log('4️⃣ Analyzing Dependencies...');
    this.metrics.dependencies = this.analyzeDependencies();

    return this.metrics;
  }

  analyzeBundleSize() {
    const getFileSize = (filePath) => {
      try {
        const stats = fs.statSync(filePath);
        return stats.size;
      } catch (error) {
        console.warn(`⚠️  Could not read ${filePath}`);
        return 0;
      }
    };

    const getDirectorySize = (dirPath) => {
      let totalSize = 0;
      try {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          if (stats.isFile() && file.endsWith('.ts')) {
            totalSize += stats.size;
          }
        }
      } catch (error) {
        console.warn(`⚠️  Could not read directory ${dirPath}`);
      }
      return totalSize;
    };

    const bundleSize = {
      libSchemas: getDirectorySize('./lib/schemas'),
      businessSchemas: getFileSize('./types/business/schemas.ts'),
      actionSchemas: getFileSize('./app/actions/schemas.ts'),
      excelSchemas: getFileSize('./app/components/reports/schemas/ExcelGeneratorSchemas.ts'),
    };

    bundleSize.total = Object.values(bundleSize).reduce((sum, size) => sum + size, 0);

    console.log(`   📦 lib/schemas: ${(bundleSize.libSchemas / 1024).toFixed(2)} KB`);
    console.log(`   📦 business schemas: ${(bundleSize.businessSchemas / 1024).toFixed(2)} KB`);
    console.log(`   📦 action schemas: ${(bundleSize.actionSchemas / 1024).toFixed(2)} KB`);
    console.log(`   📦 excel schemas: ${(bundleSize.excelSchemas / 1024).toFixed(2)} KB`);
    console.log(`   📦 Total: ${(bundleSize.total / 1024).toFixed(2)} KB\n`);

    return bundleSize;
  }

  countSchemas() {
    const countInFile = (filePath) => {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const schemaDefinitions = content.match(/export const \w+Schema/g) || [];
        const typeDefinitions = content.match(/export type \w+/g) || [];
        const zodImports = content.match(/import.*zod/g) || [];
        
        return {
          schemas: schemaDefinitions.length,
          types: typeDefinitions.length,
          hasZodImport: zodImports.length > 0,
          totalLines: content.split('\n').length,
        };
      } catch (error) {
        return { schemas: 0, types: 0, hasZodImport: false, totalLines: 0 };
      }
    };

    const schemaFiles = {
      'lib/schemas/alerts.ts': countInFile('./lib/schemas/alerts.ts'),
      'lib/schemas/api.ts': countInFile('./lib/schemas/api.ts'),
      'lib/schemas/dashboard.ts': countInFile('./lib/schemas/dashboard.ts'),
      'lib/schemas/widgets.ts': countInFile('./lib/schemas/widgets.ts'),
      'lib/schemas/shared.ts': countInFile('./lib/schemas/shared.ts'),
      'lib/schemas/printing.ts': countInFile('./lib/schemas/printing.ts'),
      'types/business/schemas.ts': countInFile('./types/business/schemas.ts'),
      'app/actions/schemas.ts': countInFile('./app/actions/schemas.ts'),
      'app/components/reports/schemas/ExcelGeneratorSchemas.ts': countInFile('./app/components/reports/schemas/ExcelGeneratorSchemas.ts'),
    };

    const totals = Object.values(schemaFiles).reduce((acc, file) => ({
      schemas: acc.schemas + file.schemas,
      types: acc.types + file.types,
      totalLines: acc.totalLines + file.totalLines,
    }), { schemas: 0, types: 0, totalLines: 0 });

    console.log(`   📊 Total schema definitions: ${totals.schemas}`);
    console.log(`   📊 Total type exports: ${totals.types}`);
    console.log(`   📊 Total lines of code: ${totals.totalLines}\n`);

    return { files: schemaFiles, totals };
  }

  analyzeUsage() {
    const usageMap = new Map();
    const searchForUsage = (dirPath) => {
      const searchDir = (currentPath) => {
        try {
          const items = fs.readdirSync(currentPath);
          for (const item of items) {
            const itemPath = path.join(currentPath, item);
            const stats = fs.statSync(itemPath);
            
            if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
              searchDir(itemPath);
            } else if (stats.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
              const content = fs.readFileSync(itemPath, 'utf-8');
              
              // Count schema imports
              const schemaImports = content.match(/from.*['"](.*schemas.*)['"]/g) || [];
              const directSchemaUsage = content.match(/\w+Schema\./g) || [];
              const zodUsage = content.match(/z\./g) || [];
              
              if (schemaImports.length > 0 || directSchemaUsage.length > 0) {
                usageMap.set(itemPath, {
                  imports: schemaImports.length,
                  directUsage: directSchemaUsage.length,
                  zodUsage: zodUsage.length,
                });
              }
            }
          }
        } catch (error) {
          // Skip directories we can't access
        }
      };
      searchDir(dirPath);
    };

    searchForUsage('./app');
    searchForUsage('./lib');
    searchForUsage('./components');
    searchForUsage('./types');

    const summary = {
      filesUsingSchemas: usageMap.size,
      totalImports: Array.from(usageMap.values()).reduce((sum, file) => sum + file.imports, 0),
      totalDirectUsage: Array.from(usageMap.values()).reduce((sum, file) => sum + file.directUsage, 0),
      totalZodUsage: Array.from(usageMap.values()).reduce((sum, file) => sum + file.zodUsage, 0),
    };

    console.log(`   🔍 Files using schemas: ${summary.filesUsingSchemas}`);
    console.log(`   🔍 Total schema imports: ${summary.totalImports}`);
    console.log(`   🔍 Direct schema usage: ${summary.totalDirectUsage}`);
    console.log(`   🔍 Zod usage instances: ${summary.totalZodUsage}\n`);

    return { summary, details: Object.fromEntries(usageMap) };
  }

  analyzeDependencies() {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
    const zodVersion = packageJson.dependencies?.zod || packageJson.devDependencies?.zod || 'not found';
    
    const dependencies = {
      zodVersion,
      hasZodDependency: zodVersion !== 'not found',
    };

    console.log(`   📦 Zod version: ${zodVersion}`);
    console.log(`   📦 Zod available: ${dependencies.hasZodDependency ? '✅' : '❌'}\n`);

    return dependencies;
  }

  generateReport(metrics) {
    const unusedPercentage = metrics.schemaCounts.totals.schemas > 0 
      ? ((metrics.schemaCounts.totals.schemas - Math.min(metrics.usage.summary.totalDirectUsage, metrics.schemaCounts.totals.schemas)) / metrics.schemaCounts.totals.schemas * 100)
      : 0;

    const report = `
# lib/schemas Performance Analysis Report
Generated on: ${new Date().toISOString()}

## 📊 Executive Summary

### Bundle Size Analysis
- **Total schemas size**: ${(metrics.bundleSize.total / 1024).toFixed(2)} KB
- **lib/schemas**: ${(metrics.bundleSize.libSchemas / 1024).toFixed(2)} KB (${((metrics.bundleSize.libSchemas / metrics.bundleSize.total) * 100).toFixed(1)}%)
- **Business schemas**: ${(metrics.bundleSize.businessSchemas / 1024).toFixed(2)} KB (${((metrics.bundleSize.businessSchemas / metrics.bundleSize.total) * 100).toFixed(1)}%)
- **Action schemas**: ${(metrics.bundleSize.actionSchemas / 1024).toFixed(2)} KB (${((metrics.bundleSize.actionSchemas / metrics.bundleSize.total) * 100).toFixed(1)}%)
- **Excel schemas**: ${(metrics.bundleSize.excelSchemas / 1024).toFixed(2)} KB (${((metrics.bundleSize.excelSchemas / metrics.bundleSize.total) * 100).toFixed(1)}%)

### Schema Definition Analysis
- **Total schema definitions**: ${metrics.schemaCounts.totals.schemas}
- **Total type exports**: ${metrics.schemaCounts.totals.types}
- **Total lines of code**: ${metrics.schemaCounts.totals.totalLines}
- **Average schemas per file**: ${(metrics.schemaCounts.totals.schemas / Object.keys(metrics.schemaCounts.files).length).toFixed(1)}

### Usage Analysis
- **Files using schemas**: ${metrics.usage.summary.filesUsingSchemas}
- **Schema import statements**: ${metrics.usage.summary.totalImports}
- **Direct schema usage**: ${metrics.usage.summary.totalDirectUsage}
- **Zod usage instances**: ${metrics.usage.summary.totalZodUsage}
- **Estimated unused schemas**: ${unusedPercentage.toFixed(1)}%

### Dependencies
- **Zod version**: ${metrics.dependencies.zodVersion}
- **Zod available**: ${metrics.dependencies.hasZodDependency ? 'Yes' : 'No'}

## 🎯 Performance Assessment

### Bundle Size Impact: ${metrics.bundleSize.total > 50000 ? '🔴 HIGH' : metrics.bundleSize.total > 20000 ? '🟡 MEDIUM' : '🟢 LOW'}
${metrics.bundleSize.total > 50000 ? `
**CRITICAL**: Schemas contribute ${(metrics.bundleSize.total / 1024).toFixed(2)} KB to bundle size.
` : metrics.bundleSize.total > 20000 ? `
**MODERATE**: Schemas contribute ${(metrics.bundleSize.total / 1024).toFixed(2)} KB to bundle size.
` : `
**GOOD**: Bundle size impact is minimal at ${(metrics.bundleSize.total / 1024).toFixed(2)} KB.
`}

### Usage Efficiency: ${unusedPercentage > 50 ? '🔴 POOR' : unusedPercentage > 30 ? '🟡 MODERATE' : '🟢 GOOD'}
${unusedPercentage > 50 ? `
**POOR**: Approximately ${unusedPercentage.toFixed(1)}% of schemas appear unused.
` : unusedPercentage > 30 ? `
**MODERATE**: Some schemas (${unusedPercentage.toFixed(1)}%) may be unused.
` : `
**GOOD**: Most schemas appear to be actively used.
`}

### Code Organization: ${metrics.schemaCounts.totals.schemas / Object.keys(metrics.schemaCounts.files).length > 20 ? '🟡 NEEDS ATTENTION' : '🟢 GOOD'}
${metrics.schemaCounts.totals.schemas / Object.keys(metrics.schemaCounts.files).length > 20 ? `
**ATTENTION**: High schema density (${(metrics.schemaCounts.totals.schemas / Object.keys(metrics.schemaCounts.files).length).toFixed(1)} schemas per file).
` : `
**GOOD**: Schema organization is well-balanced.
`}

## 📋 Detailed File Analysis

### lib/schemas breakdown:
${Object.entries(metrics.schemaCounts.files).map(([file, data]) => 
  `- **${file}**: ${data.schemas} schemas, ${data.types} types, ${data.totalLines} lines`
).join('\n')}

## 🚀 Optimization Recommendations

### 1. Bundle Size Optimization
${metrics.bundleSize.total > 50000 ? `
- **HIGH PRIORITY**: Implement lazy loading for schemas
- Split schemas into feature-specific modules
- Use dynamic imports for conditional schema loading
- Consider build-time schema compilation
` : metrics.bundleSize.total > 20000 ? `
- **MEDIUM PRIORITY**: Monitor bundle growth
- Consider code splitting for larger schema files
- Implement tree-shaking improvements
` : `
- **LOW PRIORITY**: Current bundle size is acceptable
- Monitor for future growth
`}

### 2. Usage Optimization
${unusedPercentage > 50 ? `
- **HIGH PRIORITY**: Remove unused schema definitions
- Audit schema usage across the codebase
- Implement more specific imports
- Consider schema consolidation
` : unusedPercentage > 30 ? `
- **MEDIUM PRIORITY**: Review potentially unused schemas
- Improve import specificity
- Document schema purposes
` : `
- **LOW PRIORITY**: Schema usage appears optimal
- Continue monitoring usage patterns
`}

### 3. Performance vs Security Balance
- Maintain security-critical schemas (as noted by security auditor)
- Consider client-side vs server-side validation trade-offs
- Implement progressive validation strategies
- Use schema caching for frequently validated data

### 4. Code Organization
- Consider splitting large schema files (>1000 lines)
- Group related schemas together
- Maintain clear naming conventions
- Document complex schema relationships

## 📈 Performance Budget Recommendations

\`\`\`javascript
const PERFORMANCE_BUDGETS = {
  maxTotalBundleSize: 30 * 1024, // 30KB for all schemas
  maxSchemasPerFile: 15, // Maximum 15 schemas per file
  maxUnusedPercentage: 25, // Maximum 25% unused schemas
  maxLinesPerSchemaFile: 500, // Maximum 500 lines per schema file
};
\`\`\`

## 🔧 Implementation Priority

1. **HIGH**: ${metrics.bundleSize.total > 50000 || unusedPercentage > 50 ? 'Address bundle size and unused schemas' : 'Monitor current performance'}
2. **MEDIUM**: ${metrics.bundleSize.total > 20000 || unusedPercentage > 30 ? 'Optimize schema organization' : 'Implement performance monitoring'}
3. **LOW**: Enhance developer experience and documentation

---
*Generated by schemas performance analyzer*
`;

    return report;
  }

  async saveResults(metrics) {
    const reportsDir = './reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Save metrics
    const metricsPath = path.join(reportsDir, 'schemas-performance-metrics.json');
    fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));

    // Save report
    const reportPath = path.join(reportsDir, 'schemas-performance-analysis.md');
    const report = this.generateReport(metrics);
    fs.writeFileSync(reportPath, report);

    console.log('✅ Analysis completed!');
    console.log(`📊 Metrics saved to: ${metricsPath}`);
    console.log(`📋 Report saved to: ${reportPath}`);

    return { metricsPath, reportPath };
  }
}

// Main execution
async function main() {
  const analyzer = new SchemasPerformanceAnalyzer();
  
  try {
    const metrics = await analyzer.runAnalysis();
    const { reportPath } = await analyzer.saveResults(metrics);
    
    console.log('\n📊 PERFORMANCE SUMMARY:');
    console.log(`Bundle Size: ${(metrics.bundleSize.total / 1024).toFixed(2)} KB`);
    console.log(`Schema Definitions: ${metrics.schemaCounts.totals.schemas}`);
    console.log(`Files Using Schemas: ${metrics.usage.summary.filesUsingSchemas}`);
    console.log(`Zod Version: ${metrics.dependencies.zodVersion}`);
    
    const unusedPercentage = metrics.schemaCounts.totals.schemas > 0 
      ? ((metrics.schemaCounts.totals.schemas - Math.min(metrics.usage.summary.totalDirectUsage, metrics.schemaCounts.totals.schemas)) / metrics.schemaCounts.totals.schemas * 100)
      : 0;
    console.log(`Estimated Unused: ${unusedPercentage.toFixed(1)}%`);
    
    console.log(`\n📋 Full analysis available at: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { SchemasPerformanceAnalyzer };