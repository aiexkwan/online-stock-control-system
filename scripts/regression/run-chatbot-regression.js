#!/usr/bin/env node

/**
 * ChatbotCard 回歸測試執行腳本
 *
 * 功能：
 * - 一鍵執行完整的回歸測試套件
 * - 管理測試環境和依賴
 * - 生成詳細的測試報告
 * - 實現 CI/CD 集成
 * - 性能回歸預警
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class RegressionTestRunner {
  constructor() {
    this.startTime = Date.now();
    this.testResults = new Map();
    this.config = this.loadConfig();
  }

  loadConfig() {
    const defaultConfig = {
      // 測試環境配置
      environment: {
        nodeVersion: process.version,
        testTimeout: 300000, // 5分鐘
        retryAttempts: 2,
        parallelWorkers: os.cpus().length,
      },

      // 測試套件配置
      suites: {
        unit: true,
        integration: true,
        e2e: process.env.CI !== 'true', // CI 環境可能跳過 E2E
        performance: process.env.CI !== 'true',
        crossBrowser: true,
      },

      // 性能基準
      performanceBaseline: {
        pageLoadTime: 2500,
        componentRenderTime: 800,
        memoryUsage: 5000000,
        targetImprovement: 15, // 15% 最低改進目標
      },

      // 報告配置
      reporting: {
        formats: ['json', 'html', 'console'],
        outputDir: 'test-results',
        includeScreenshots: true,
        includeMetrics: true,
      },
    };

    // 嘗試加載自定義配置
    const configPath = path.join(process.cwd(), 'regression.config.js');
    if (fs.existsSync(configPath)) {
      try {
        const customConfig = require(configPath);
        return { ...defaultConfig, ...customConfig };
      } catch (error) {
        console.warn('⚠️  無法載入自定義配置，使用預設配置:', error.message);
      }
    }

    return defaultConfig;
  }

  async run() {
    console.log('🚀 ChatbotCard 回歸測試開始...\n');
    console.log(`📊 配置摘要:`);
    console.log(`   - Node.js: ${this.config.environment.nodeVersion}`);
    console.log(`   - 超時設定: ${this.config.environment.testTimeout / 1000}秒`);
    console.log(`   - 重試次數: ${this.config.environment.retryAttempts}`);
    console.log(`   - 並行執行緒: ${this.config.environment.parallelWorkers}\n`);

    try {
      // 1. 環境檢查與準備
      await this.prepareEnvironment();

      // 2. 執行測試套件
      if (this.config.suites.unit) {
        await this.runUnitTests();
      }

      if (this.config.suites.integration) {
        await this.runIntegrationTests();
      }

      if (this.config.suites.crossBrowser) {
        await this.runCrossBrowserTests();
      }

      if (this.config.suites.e2e) {
        await this.runE2ETests();
      }

      if (this.config.suites.performance) {
        await this.runPerformanceTests();
      }

      // 3. 生成報告
      const report = await this.generateFinalReport();

      // 4. 性能回歸檢查
      const regressionResult = await this.checkPerformanceRegression(report);

      // 5. 輸出結果
      this.outputResults(report, regressionResult);

      // 6. 決定退出代碼
      const exitCode = this.determineExitCode(report, regressionResult);
      process.exit(exitCode);
    } catch (error) {
      console.error('❌ 回歸測試執行失敗:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  async prepareEnvironment() {
    console.log('🔧 準備測試環境...');

    // 檢查 Node.js 版本
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      console.warn(`⚠️  建議使用 Node.js 18+ (當前: ${nodeVersion})`);
    }

    // 創建測試結果目錄
    const resultsDir = path.join(process.cwd(), this.config.reporting.outputDir);
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    // 清理舊的測試結果
    this.cleanupOldResults(resultsDir);

    // 檢查依賴
    await this.checkDependencies();

    // 檢查測試文件存在性
    this.validateTestFiles();

    console.log('✅ 環境準備完成\n');
  }

  cleanupOldResults(resultsDir) {
    const files = fs.readdirSync(resultsDir);
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7天前

    files.forEach(file => {
      const filePath = path.join(resultsDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime.getTime() < cutoff && file.startsWith('chatbot-regression-')) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  清理舊結果: ${file}`);
      }
    });
  }

  async checkDependencies() {
    const requiredDeps = ['@playwright/test', 'vitest', '@testing-library/react'];

    for (const dep of requiredDeps) {
      try {
        require.resolve(dep);
      } catch (error) {
        throw new Error(`缺少依賴: ${dep}. 請執行 npm install`);
      }
    }
  }

  validateTestFiles() {
    const testFiles = [
      '__tests__/regression/chatbot-refactor/ChatbotCard.regression.test.tsx',
      '__tests__/regression/chatbot-refactor/CrossBrowser.regression.test.tsx',
      '__tests__/e2e/chatbot-refactor/ChatbotCard.e2e.spec.ts',
      '__tests__/performance/chatbot-refactor/Performance.benchmark.test.ts',
    ];

    const missingFiles = testFiles.filter(file => !fs.existsSync(file));

    if (missingFiles.length > 0) {
      console.warn('⚠️  以下測試文件不存在:');
      missingFiles.forEach(file => console.warn(`   - ${file}`));
      console.warn('部分測試將被跳過\n');
    }
  }

  async runUnitTests() {
    console.log('🔍 執行單元測試...');

    const testFile = '__tests__/regression/chatbot-refactor/ChatbotCard.regression.test.tsx';

    if (!fs.existsSync(testFile)) {
      console.warn('⚠️  單元測試文件不存在，跳過');
      this.testResults.set('unit', { passed: 0, failed: 0, skipped: 1 });
      return;
    }

    try {
      const result = await this.executeTest('vitest', [
        testFile,
        '--run',
        '--reporter=json',
        '--reporter=verbose',
        `--reporter=json:${this.config.reporting.outputDir}/unit-results.json`,
      ]);

      this.testResults.set('unit', this.parseTestResult(result));
      console.log('✅ 單元測試完成\n');
    } catch (error) {
      console.error('❌ 單元測試失敗:', error.message);
      this.testResults.set('unit', { passed: 0, failed: 1, error: error.message });
    }
  }

  async runIntegrationTests() {
    console.log('🔗 執行整合測試...');

    const testPattern = '__tests__/integration/chatbot-refactor/**/*.test.tsx';

    try {
      const result = await this.executeTest('vitest', [
        testPattern,
        '--run',
        '--reporter=json',
        `--reporter=json:${this.config.reporting.outputDir}/integration-results.json`,
      ]);

      this.testResults.set('integration', this.parseTestResult(result));
      console.log('✅ 整合測試完成\n');
    } catch (error) {
      console.error('❌ 整合測試失敗:', error.message);
      this.testResults.set('integration', { passed: 0, failed: 1, error: error.message });
    }
  }

  async runCrossBrowserTests() {
    console.log('🌐 執行跨瀏覽器兼容性測試...');

    const testFile = '__tests__/regression/chatbot-refactor/CrossBrowser.regression.test.tsx';

    if (!fs.existsSync(testFile)) {
      console.warn('⚠️  跨瀏覽器測試文件不存在，跳過');
      this.testResults.set('crossBrowser', { passed: 0, failed: 0, skipped: 1 });
      return;
    }

    try {
      const result = await this.executeTest('vitest', [
        testFile,
        '--run',
        '--reporter=json',
        `--reporter=json:${this.config.reporting.outputDir}/crossbrowser-results.json`,
      ]);

      this.testResults.set('crossBrowser', this.parseTestResult(result));
      console.log('✅ 跨瀏覽器測試完成\n');
    } catch (error) {
      console.error('❌ 跨瀏覽器測試失敗:', error.message);
      this.testResults.set('crossBrowser', { passed: 0, failed: 1, error: error.message });
    }
  }

  async runE2ETests() {
    console.log('🎯 執行 E2E 測試...');

    // 檢查伺服器狀態
    const isServerRunning = await this.checkServerHealth();

    if (!isServerRunning) {
      console.warn('⚠️  開發伺服器未運行，嘗試啟動...');

      const serverProcess = await this.startDevServer();

      try {
        // 等待伺服器啟動
        await this.waitForServerReady();

        await this.executeE2ETests();
      } finally {
        // 清理伺服器進程
        if (serverProcess) {
          serverProcess.kill();
        }
      }
    } else {
      await this.executeE2ETests();
    }
  }

  async executeE2ETests() {
    const testFile = '__tests__/e2e/chatbot-refactor/ChatbotCard.e2e.spec.ts';

    if (!fs.existsSync(testFile)) {
      console.warn('⚠️  E2E 測試文件不存在，跳過');
      this.testResults.set('e2e', { passed: 0, failed: 0, skipped: 1 });
      return;
    }

    try {
      const result = await this.executeTest('npx playwright test', [
        testFile,
        '--reporter=json',
        `--output=${this.config.reporting.outputDir}/e2e-results.json`,
      ]);

      this.testResults.set('e2e', this.parsePlaywrightResult(result));
      console.log('✅ E2E 測試完成\n');
    } catch (error) {
      console.error('❌ E2E 測試失敗:', error.message);
      this.testResults.set('e2e', { passed: 0, failed: 1, error: error.message });
    }
  }

  async runPerformanceTests() {
    console.log('⚡ 執行性能基準測試...');

    const testFile = '__tests__/performance/chatbot-refactor/Performance.benchmark.test.ts';

    if (!fs.existsSync(testFile)) {
      console.warn('⚠️  性能測試文件不存在，跳過');
      this.testResults.set('performance', { passed: 0, failed: 0, skipped: 1 });
      return;
    }

    // 確保伺服器運行
    const isServerRunning = await this.checkServerHealth();
    if (!isServerRunning) {
      console.warn('⚠️  性能測試需要開發伺服器，跳過');
      this.testResults.set('performance', { passed: 0, failed: 0, skipped: 1 });
      return;
    }

    try {
      const result = await this.executeTest('npx playwright test', [
        testFile,
        '--reporter=json',
        `--output=${this.config.reporting.outputDir}/performance-results.json`,
        '--timeout=180000', // 3分鐘超時
      ]);

      const testResult = this.parsePlaywrightResult(result);

      // 加載性能指標
      const performanceMetrics = await this.loadPerformanceMetrics();
      testResult.performanceMetrics = performanceMetrics;

      this.testResults.set('performance', testResult);
      console.log('✅ 性能測試完成\n');
    } catch (error) {
      console.error('❌ 性能測試失敗:', error.message);
      this.testResults.set('performance', { passed: 0, failed: 1, error: error.message });
    }
  }

  async executeTest(command, args) {
    return new Promise((resolve, reject) => {
      const [cmd, ...cmdArgs] = command.split(' ');
      const allArgs = [...cmdArgs, ...args];

      const child = spawn(cmd, allArgs, {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true,
        timeout: this.config.environment.testTimeout,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', data => {
        stdout += data.toString();
        process.stdout.write(data);
      });

      child.stderr.on('data', data => {
        stderr += data.toString();
        process.stderr.write(data);
      });

      child.on('close', code => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', error => {
        reject(error);
      });
    });
  }

  parseTestResult(result) {
    try {
      // 嘗試從 JSON 輸出解析
      const lines = result.stdout.split('\n');
      let jsonResult = null;

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.numPassedTests !== undefined) {
            jsonResult = parsed;
            break;
          }
        } catch (e) {
          // 忽略非 JSON 行
        }
      }

      if (jsonResult) {
        return {
          passed: jsonResult.numPassedTests || 0,
          failed: jsonResult.numFailedTests || 0,
          total: jsonResult.numTotalTests || 0,
          duration: jsonResult.testResults?.[0]?.perfStats?.end || 0,
        };
      }

      // 回退到文本解析
      const passedMatch = result.stdout.match(/(\d+)\s+passed/);
      const failedMatch = result.stdout.match(/(\d+)\s+failed/);

      return {
        passed: passedMatch ? parseInt(passedMatch[1]) : 0,
        failed: failedMatch ? parseInt(failedMatch[1]) : 0,
        total:
          (passedMatch ? parseInt(passedMatch[1]) : 0) +
          (failedMatch ? parseInt(failedMatch[1]) : 0),
      };
    } catch (error) {
      return {
        passed: 0,
        failed: 1,
        total: 1,
        parseError: error.message,
      };
    }
  }

  parsePlaywrightResult(result) {
    // Playwright 結果解析邏輯
    try {
      const passedMatch = result.stdout.match(/(\d+)\s+passed/);
      const failedMatch = result.stdout.match(/(\d+)\s+failed/);

      return {
        passed: passedMatch ? parseInt(passedMatch[1]) : 0,
        failed: failedMatch ? parseInt(failedMatch[1]) : 0,
        total:
          (passedMatch ? parseInt(passedMatch[1]) : 0) +
          (failedMatch ? parseInt(failedMatch[1]) : 0),
      };
    } catch (error) {
      return {
        passed: 0,
        failed: 1,
        total: 1,
        parseError: error.message,
      };
    }
  }

  async checkServerHealth() {
    try {
      const http = require('http');

      return new Promise(resolve => {
        const req = http.get('http://localhost:3001/', res => {
          resolve(res.statusCode === 200);
        });

        req.on('error', () => {
          resolve(false);
        });

        req.setTimeout(5000, () => {
          req.destroy();
          resolve(false);
        });
      });
    } catch (error) {
      return false;
    }
  }

  async startDevServer() {
    console.log('🌐 啟動開發伺服器...');

    const serverProcess = spawn('npm', ['run', 'dev', '--', '--port', '3001'], {
      stdio: 'pipe',
      detached: true,
    });

    return serverProcess;
  }

  async waitForServerReady(maxWaitTime = 60000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      if (await this.checkServerHealth()) {
        console.log('✅ 開發伺服器就緒');
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('開發伺服器啟動超時');
  }

  async loadPerformanceMetrics() {
    try {
      const metricsPath = path.join(this.config.reporting.outputDir, 'performance-benchmark.json');
      if (fs.existsSync(metricsPath)) {
        const content = fs.readFileSync(metricsPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn('⚠️  無法載入性能指標:', error.message);
    }
    return null;
  }

  async generateFinalReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    // 統計總結
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    for (const [suite, result] of this.testResults) {
      totalPassed += result.passed || 0;
      totalFailed += result.failed || 0;
      totalSkipped += result.skipped || 0;
    }

    const report = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      environment: {
        node: process.version,
        platform: os.platform(),
        arch: os.arch(),
        ci: process.env.CI === 'true',
      },
      summary: {
        totalPassed,
        totalFailed,
        totalSkipped,
        totalTests: totalPassed + totalFailed + totalSkipped,
        successRate:
          totalPassed + totalFailed > 0 ? (totalPassed / (totalPassed + totalFailed)) * 100 : 0,
      },
      suites: Object.fromEntries(this.testResults),
      config: this.config,
    };

    // 保存報告
    const reportPath = path.join(
      this.config.reporting.outputDir,
      `regression-report-${Date.now()}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📄 測試報告已保存: ${reportPath}`);

    return report;
  }

  async checkPerformanceRegression(report) {
    console.log('🔍 檢查性能回歸...');

    const performanceResult = report.suites.performance;

    if (!performanceResult?.performanceMetrics) {
      console.warn('⚠️  無性能數據，跳過回歸檢查');
      return { hasRegression: false, reason: 'no_performance_data' };
    }

    const metrics = performanceResult.performanceMetrics;
    const baseline = this.config.performanceBaseline;

    // 檢查各項性能指標
    const checks = [];

    // 頁面載入時間檢查
    const pageLoadMetric = metrics.find(m => m.testName === 'pageLoad');
    if (pageLoadMetric) {
      const improvement = pageLoadMetric.improvement || 0;
      const targetImprovement = baseline.targetImprovement;

      checks.push({
        metric: 'pageLoad',
        current: pageLoadMetric.loadTime,
        baseline: pageLoadMetric.baseline,
        improvement,
        target: targetImprovement,
        passed: improvement >= targetImprovement,
      });
    }

    // 記憶體使用檢查
    const memoryMetric = metrics.find(m => m.testName === 'memoryUsage');
    if (memoryMetric) {
      const improvement = memoryMetric.improvement || 0;

      checks.push({
        metric: 'memoryUsage',
        current: memoryMetric.usedHeapSize,
        baseline: memoryMetric.baseline,
        improvement,
        target: 17.8, // 目標：記憶體使用減少 17.8%
        passed: improvement >= 17.8,
      });
    }

    const failedChecks = checks.filter(check => !check.passed);
    const hasRegression = failedChecks.length > 0;

    if (hasRegression) {
      console.log('❌ 檢測到性能回歸:');
      failedChecks.forEach(check => {
        console.log(
          `   - ${check.metric}: 改進 ${check.improvement.toFixed(1)}% (目標: ${check.target}%)`
        );
      });
    } else {
      console.log('✅ 性能檢查通過，無回歸');
    }

    return {
      hasRegression,
      checks,
      failedChecks,
    };
  }

  outputResults(report, regressionResult) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ChatbotCard 回歸測試結果摘要');
    console.log('='.repeat(60));

    console.log(`執行時間: ${Math.round(report.duration / 1000)}秒`);
    console.log(`總測試數: ${report.summary.totalTests}`);
    console.log(`通過: ${report.summary.totalPassed} ✅`);
    console.log(
      `失敗: ${report.summary.totalFailed} ${report.summary.totalFailed > 0 ? '❌' : '✅'}`
    );
    console.log(`跳過: ${report.summary.totalSkipped}`);
    console.log(`成功率: ${report.summary.successRate.toFixed(1)}%`);

    console.log('\n📋 測試套件詳情:');
    for (const [suiteName, result] of Object.entries(report.suites)) {
      const status = result.failed > 0 ? '❌' : result.skipped > 0 ? '⚠️ ' : '✅';
      console.log(
        `   ${status} ${suiteName}: ${result.passed}通過/${result.failed}失敗/${result.skipped || 0}跳過`
      );
    }

    if (regressionResult.hasRegression) {
      console.log('\n⚠️  性能回歸警告:');
      regressionResult.failedChecks.forEach(check => {
        console.log(
          `   - ${check.metric}: ${check.improvement.toFixed(1)}% 改進 (目標: ${check.target}%)`
        );
      });
    } else {
      console.log('\n🎯 性能目標達成!');
    }

    console.log('='.repeat(60));
  }

  determineExitCode(report, regressionResult) {
    // 任何測試失敗或性能回歸都會導致非零退出代碼
    if (report.summary.totalFailed > 0) {
      console.log('\n❌ 退出代碼: 1 (測試失敗)');
      return 1;
    }

    if (regressionResult.hasRegression) {
      console.log('\n❌ 退出代碼: 2 (性能回歸)');
      return 2;
    }

    console.log('\n✅ 退出代碼: 0 (所有測試通過)');
    return 0;
  }
}

// 主執行邏輯
if (require.main === module) {
  const runner = new RegressionTestRunner();
  runner.run().catch(error => {
    console.error('執行失敗:', error);
    process.exit(1);
  });
}

module.exports = { RegressionTestRunner };
