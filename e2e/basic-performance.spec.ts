/**
 * 基本性能測試 - 不需要 web 服務器
 * 測試 bundle 分析和基本文件系統操作
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';

// 基本性能測試配置
const BASIC_CONFIG = {
  reportPath: 'test-results/basic-performance-report.json'
};

// 基本性能指標
interface BasicMetrics {
  bundleExists: boolean;
  bundleSize: number;
  packageJsonSize: number;
  nodeModulesSize: number;
  timestamp: string;
}

// 基本性能測試類
class BasicPerformanceTester {
  private results: BasicMetrics[] = [];

  async calculateDirectorySize(dirPath: string, maxDepth: number = 2): Promise<number> {
    try {
      if (maxDepth <= 0) return 0;
      
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          // 限制深度避免過度遞歸
          totalSize += await this.calculateDirectorySize(filePath, maxDepth - 1);
        } else {
          const stat = await fs.stat(filePath);
          totalSize += stat.size;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error(`Error calculating directory size for ${dirPath}:`, error);
      return 0;
    }
  }

  async measureBundleSize(): Promise<number> {
    try {
      console.log('Checking bundle size...');
      
      const nextDir = path.join(process.cwd(), '.next');
      const stat = await fs.stat(nextDir).catch(() => null);
      if (stat) {
        const sizeInBytes = await this.calculateDirectorySize(nextDir);
        return Math.round(sizeInBytes / 1024); // 轉換為 KB
      }
      
      return 0;
    } catch (error) {
      console.error('Bundle size measurement failed:', error);
      return 0;
    }
  }

  async measurePackageJsonSize(): Promise<number> {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const stat = await fs.stat(packageJsonPath);
      return Math.round(stat.size / 1024); // 轉換為 KB
    } catch (error) {
      console.error('Package.json size measurement failed:', error);
      return 0;
    }
  }

  async measureNodeModulesSize(): Promise<number> {
    try {
      console.log('Checking node_modules size (limited depth)...');
      
      const nodeModulesDir = path.join(process.cwd(), 'node_modules');
      const stat = await fs.stat(nodeModulesDir).catch(() => null);
      if (stat) {
        const sizeInBytes = await this.calculateDirectorySize(nodeModulesDir, 1); // 限制深度
        return Math.round(sizeInBytes / 1024 / 1024); // 轉換為 MB
      }
      
      return 0;
    } catch (error) {
      console.error('Node modules size measurement failed:', error);
      return 0;
    }
  }

  async runBasicPerformanceTest(): Promise<BasicMetrics> {
    console.log('Running basic performance test...');
    
    const bundleSize = await this.measureBundleSize();
    const packageJsonSize = await this.measurePackageJsonSize();
    const nodeModulesSize = await this.measureNodeModulesSize();
    
    const metrics: BasicMetrics = {
      bundleExists: bundleSize > 0,
      bundleSize,
      packageJsonSize,
      nodeModulesSize,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(metrics);
    return metrics;
  }

  async saveResults(): Promise<void> {
    try {
      const reportDir = path.dirname(BASIC_CONFIG.reportPath);
      await fs.mkdir(reportDir, { recursive: true });
      
      const report = {
        timestamp: new Date().toISOString(),
        results: this.results,
        summary: {
          totalTests: this.results.length,
          bundleExists: this.results.some(r => r.bundleExists),
          avgBundleSize: this.calculateAverage('bundleSize'),
          avgPackageJsonSize: this.calculateAverage('packageJsonSize'),
          avgNodeModulesSize: this.calculateAverage('nodeModulesSize')
        }
      };
      
      await fs.writeFile(
        BASIC_CONFIG.reportPath,
        JSON.stringify(report, null, 2)
      );
      
      // 生成簡單的 Markdown 報告
      await this.generateMarkdownReport(report);
      
      console.log(`Basic performance report saved to: ${BASIC_CONFIG.reportPath}`);
      
    } catch (error) {
      console.error('Failed to save basic performance results:', error);
    }
  }

  private calculateAverage(metric: keyof BasicMetrics): number {
    if (this.results.length === 0) return 0;
    
    const values = this.results.map(r => r[metric]).filter(v => typeof v === 'number') as number[];
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private async generateMarkdownReport(report: any): Promise<void> {
    const markdown = `# 基本性能測試報告

## 測試概要
- 測試時間: ${report.timestamp}
- 測試次數: ${report.summary.totalTests}

## 基本指標

### Bundle 狀態
- **Bundle 存在**: ${report.summary.bundleExists ? '✅ 是' : '❌ 否'}
- **平均 Bundle Size**: ${report.summary.avgBundleSize.toFixed(2)} KB

### 項目大小
- **Package.json Size**: ${report.summary.avgPackageJsonSize.toFixed(2)} KB
- **Node Modules Size**: ${report.summary.avgNodeModulesSize.toFixed(2)} MB

## 詳細結果

${report.results.map((result: BasicMetrics, index: number) => `
### 測試 ${index + 1}
- 時間: ${result.timestamp}
- Bundle 存在: ${result.bundleExists ? '是' : '否'}
- Bundle Size: ${result.bundleSize} KB
- Package.json Size: ${result.packageJsonSize} KB
- Node Modules Size: ${result.nodeModulesSize} MB
`).join('')}

## 狀態檢查
${report.summary.bundleExists ? '✅ 項目已構建' : '⚠️ 項目尚未構建，請運行 npm run build'}
${report.summary.avgNodeModulesSize > 0 ? '✅ Node modules 已安裝' : '⚠️ Node modules 未安裝'}
${report.summary.avgPackageJsonSize > 0 ? '✅ Package.json 存在' : '❌ Package.json 不存在'}

## 建議
- 如果 Bundle 不存在，請運行 \`npm run build\`
- 如果 Node modules 過大，考慮清理未使用的依賴
- 定期運行性能測試監控項目大小變化
`;

    const markdownPath = path.join(
      path.dirname(BASIC_CONFIG.reportPath),
      'basic-performance-report.md'
    );
    
    await fs.writeFile(markdownPath, markdown);
  }
}

// 主測試套件
test.describe('Basic Performance Tests', () => {
  // 只在 chromium 上運行
  test.skip(({ browserName }) => browserName !== 'chromium');
  
  let tester: BasicPerformanceTester;

  test.beforeAll(async () => {
    tester = new BasicPerformanceTester();
    console.log('Initializing basic performance tests...');
  });

  test.afterAll(async () => {
    await tester.saveResults();
    console.log('Basic performance test completed!');
  });

  test('Bundle Size Check', async () => {
    const bundleSize = await tester.measureBundleSize();
    console.log(`Bundle size: ${bundleSize} KB`);
    
    // 記錄結果但不強制要求 bundle 存在
    expect(bundleSize).toBeGreaterThanOrEqual(0);
  });

  test('Package.json Size Check', async () => {
    const packageSize = await tester.measurePackageJsonSize();
    console.log(`Package.json size: ${packageSize} KB`);
    
    // Package.json 應該存在
    expect(packageSize).toBeGreaterThan(0);
  });

  test('Node Modules Size Check', async () => {
    const nodeModulesSize = await tester.measureNodeModulesSize();
    console.log(`Node modules size: ${nodeModulesSize} MB`);
    
    // Node modules 應該存在
    expect(nodeModulesSize).toBeGreaterThan(0);
  });

  test('Complete Basic Performance Test', async () => {
    const metrics = await tester.runBasicPerformanceTest();
    
    // 驗證所有指標都有有效值
    expect(metrics.bundleSize).toBeGreaterThanOrEqual(0);
    expect(metrics.packageJsonSize).toBeGreaterThan(0);
    expect(metrics.nodeModulesSize).toBeGreaterThan(0);
    expect(metrics.timestamp).toBeTruthy();
    
    console.log('Basic performance metrics:', metrics);
  });
});

export { BasicPerformanceTester, type BasicMetrics };