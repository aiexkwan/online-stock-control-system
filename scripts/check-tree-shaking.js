#!/usr/bin/env node

/**
 * Tree Shaking Analysis Script
 * 檢查項目中可能影響 tree shaking 的問題
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 配置
const CONFIG = {
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  excludePaths: [
    'node_modules/**',
    '.next/**',
    'dist/**',
    '**/*.test.*',
    '**/*.spec.*'
  ],
  checkPatterns: {
    // 檢查可能有問題的導入模式
    barrelExports: /export \* from ['"][^'"]+['"]/g,
    defaultImports: /import\s+\w+\s+from ['"][^'"]+['"]/g,
    namespaceImports: /import\s+\*\s+as\s+\w+\s+from ['"][^'"]+['"]/g,
    sideEffectImports: /import ['"][^'"]+['"]/g,
    rechartsImports: /import.*from ['"]recharts['"]/g,
    apolloImports: /import.*from ['"]@apollo\/client['"]/g,
  }
};

class TreeShakingAnalyzer {
  constructor() {
    this.issues = [];
    this.stats = {
      totalFiles: 0,
      barrelExports: 0,
      problematicImports: 0,
      rechartsUsage: 0,
      apolloUsage: 0
    };
  }

  /**
   * 分析單個文件
   */
  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    this.stats.totalFiles++;

    // 檢查 barrel exports
    const barrelMatches = content.match(CONFIG.checkPatterns.barrelExports);
    if (barrelMatches) {
      this.stats.barrelExports++;
      this.issues.push({
        type: 'barrel-export',
        file: relativePath,
        line: this.getLineNumber(content, barrelMatches[0]),
        message: `Barrel export detected: ${barrelMatches[0]}`,
        severity: 'warning'
      });
    }

    // 檢查 namespace imports
    const namespaceMatches = content.match(CONFIG.checkPatterns.namespaceImports);
    if (namespaceMatches) {
      this.stats.problematicImports++;
      namespaceMatches.forEach(match => {
        this.issues.push({
          type: 'namespace-import',
          file: relativePath,
          line: this.getLineNumber(content, match),
          message: `Namespace import may affect tree shaking: ${match}`,
          severity: 'warning'
        });
      });
    }

    // 檢查 recharts 使用
    const rechartsMatches = content.match(CONFIG.checkPatterns.rechartsImports);
    if (rechartsMatches) {
      this.stats.rechartsUsage++;
      this.analyzeRechartsUsage(content, relativePath);
    }

    // 檢查 Apollo Client 使用
    const apolloMatches = content.match(CONFIG.checkPatterns.apolloImports);
    if (apolloMatches) {
      this.stats.apolloUsage++;
      this.analyzeApolloUsage(content, relativePath);
    }
  }

  /**
   * 分析 recharts 使用情況
   */
  analyzeRechartsUsage(content, filePath) {
    // 檢查是否導入整個 recharts
    if (content.includes('* as recharts') || content.includes('* as Recharts')) {
      this.issues.push({
        type: 'recharts-namespace',
        file: filePath,
        message: 'Import entire recharts library - consider named imports',
        severity: 'error'
      });
    }

    // 檢查是否有未使用的組件
    const importMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]recharts['"]/);
    if (importMatch) {
      const imports = importMatch[1].split(',').map(i => i.trim());
      const unusedImports = imports.filter(imp => {
        const regex = new RegExp(`\\b${imp}\\b`, 'g');
        const matches = content.match(regex);
        return !matches || matches.length <= 1; // 只在 import 中出現
      });

      if (unusedImports.length > 0) {
        this.issues.push({
          type: 'unused-imports',
          file: filePath,
          message: `Possibly unused recharts imports: ${unusedImports.join(', ')}`,
          severity: 'info'
        });
      }
    }
  }

  /**
   * 分析 Apollo Client 使用情況
   */
  analyzeApolloUsage(content, filePath) {
    if (content.includes('* as Apollo') || content.includes('* as apollo')) {
      this.issues.push({
        type: 'apollo-namespace',
        file: filePath,
        message: 'Import entire Apollo Client - consider named imports',
        severity: 'error'
      });
    }
  }

  /**
   * 獲取行號
   */
  getLineNumber(content, searchString) {
    const index = content.indexOf(searchString);
    if (index === -1) return 1;
    return content.substring(0, index).split('\n').length;
  }

  /**
   * 檢查 package.json 配置
   */
  checkPackageJson() {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
      this.issues.push({
        type: 'config',
        file: 'package.json',
        message: 'package.json not found',
        severity: 'error'
      });
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    
    // 檢查 sideEffects 配置
    if (!packageJson.hasOwnProperty('sideEffects')) {
      this.issues.push({
        type: 'config',
        file: 'package.json',
        message: 'Missing "sideEffects" field - add this for better tree shaking',
        severity: 'error'
      });
    } else if (packageJson.sideEffects === true) {
      this.issues.push({
        type: 'config',
        file: 'package.json',
        message: '"sideEffects": true disables tree shaking - consider specific files array',
        severity: 'warning'
      });
    }
  }

  /**
   * 運行完整分析
   */
  async analyze() {
    console.log('🌳 Running Tree Shaking Analysis...\n');

    // 檢查 package.json
    this.checkPackageJson();

    // 獲取所有要分析的文件
    const patterns = CONFIG.extensions.map(ext => `**/*${ext}`);
    const files = [];
    
    for (const pattern of patterns) {
      const matches = glob.sync(pattern, { 
        ignore: CONFIG.excludePaths,
        absolute: true 
      });
      files.push(...matches);
    }

    // 分析每個文件
    files.forEach(file => {
      try {
        this.analyzeFile(file);
      } catch (error) {
        console.warn(`Warning: Could not analyze ${file}: ${error.message}`);
      }
    });

    this.generateReport();
  }

  /**
   * 生成分析報告
   */
  generateReport() {
    console.log('📊 Tree Shaking Analysis Report');
    console.log('================================\n');

    // 統計信息
    console.log('📈 Statistics:');
    console.log(`Total files analyzed: ${this.stats.totalFiles}`);
    console.log(`Files with barrel exports: ${this.stats.barrelExports}`);
    console.log(`Files with problematic imports: ${this.stats.problematicImports}`);
    console.log(`Files using recharts: ${this.stats.rechartsUsage}`);
    console.log(`Files using Apollo Client: ${this.stats.apolloUsage}`);
    console.log('');

    // 按嚴重程度分組問題
    const errorIssues = this.issues.filter(i => i.severity === 'error');
    const warningIssues = this.issues.filter(i => i.severity === 'warning');
    const infoIssues = this.issues.filter(i => i.severity === 'info');

    // 顯示錯誤
    if (errorIssues.length > 0) {
      console.log('🚨 Errors (High Priority):');
      errorIssues.forEach(issue => {
        console.log(`  ❌ ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
        console.log(`     ${issue.message}`);
      });
      console.log('');
    }

    // 顯示警告
    if (warningIssues.length > 0) {
      console.log('⚠️  Warnings (Medium Priority):');
      warningIssues.forEach(issue => {
        console.log(`  ⚠️  ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
        console.log(`     ${issue.message}`);
      });
      console.log('');
    }

    // 顯示信息
    if (infoIssues.length > 0) {
      console.log('ℹ️  Information (Low Priority):');
      infoIssues.forEach(issue => {
        console.log(`  ℹ️  ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
        console.log(`     ${issue.message}`);
      });
      console.log('');
    }

    // 總結和建議
    console.log('💡 Recommendations:');
    if (errorIssues.length > 0) {
      console.log('  1. Fix all errors first (especially package.json configuration)');
    }
    if (this.stats.barrelExports > 0) {
      console.log('  2. Consider splitting barrel exports into smaller, more specific modules');
    }
    if (this.stats.rechartsUsage > 0) {
      console.log('  3. Optimize recharts imports by using named imports only');
    }
    if (warningIssues.length > 0) {
      console.log('  4. Address warnings to improve tree shaking effectiveness');
    }

    // 退出碼
    const exitCode = errorIssues.length > 0 ? 1 : 0;
    console.log(`\n🏁 Analysis complete. Exit code: ${exitCode}`);
    
    if (exitCode === 0) {
      console.log('✅ No critical tree shaking issues found!');
    } else {
      console.log('❌ Tree shaking issues detected. Please fix errors above.');
    }

    process.exit(exitCode);
  }
}

// 運行分析
if (require.main === module) {
  const analyzer = new TreeShakingAnalyzer();
  analyzer.analyze().catch(error => {
    console.error('Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = TreeShakingAnalyzer;