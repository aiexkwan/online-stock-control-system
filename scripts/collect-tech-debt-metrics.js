#!/usr/bin/env node

/**
 * 技術債務指標收集腳本
 *
 * 收集 TypeScript、ESLint、測試和構建相關的技術債務指標
 * 可以在 CI/CD 流程中自動執行，或手動運行
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

// 配置
const CONFIG = {
  outputPath: process.env.TECH_DEBT_OUTPUT_PATH || './tech-debt-report.json',
  skipTests: process.env.SKIP_TESTS === 'true',
  skipBuild: process.env.SKIP_BUILD === 'true',
  verbose: process.env.VERBOSE === 'true',
};

/**
 * 日誌函數
 */
function log(message, level = 'info') {
  if (CONFIG.verbose || level === 'error') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }
}

/**
 * 安全執行命令
 */
async function safeExec(command, description, options = {}) {
  try {
    log(`執行: ${description}`);
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      ...options,
    });
    return { stdout, stderr, success: true };
  } catch (error) {
    // ESLint 返回非零 exit code 當有 warnings/errors，但 stdout 仍然有效
    if (error.stdout && command.includes('eslint')) {
      log(`${description} 完成但有警告/錯誤`);
      return { stdout: error.stdout, stderr: error.stderr || '', success: true, hasWarnings: true };
    }
    log(`執行失敗 ${description}: ${error.message}`, 'error');
    return { stdout: error.stdout || '', stderr: error.stderr || '', success: false, error };
  }
}

/**
 * 收集 TypeScript 指標
 */
async function collectTypeScriptMetrics() {
  log('收集 TypeScript 指標...');

  const result = await safeExec('npx tsc --noEmit --pretty false 2>&1 || true', 'TypeScript 檢查');
  const output = result.stdout + result.stderr;

  // 解析 TypeScript 錯誤
  const errorPattern = /(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)/g;
  const errors = [];
  const warnings = [];

  let match;
  while ((match = errorPattern.exec(output)) !== null) {
    const [, file, line, column, severity, code, message] = match;
    const item = {
      file: file.trim().replace(process.cwd(), ''),
      line: parseInt(line),
      column: parseInt(column),
      message: message.trim(),
      severity: severity,
      code: `TS${code}`,
      category: 'type-checking',
    };

    if (severity === 'error') {
      errors.push(item);
    } else {
      warnings.push(item);
    }
  }

  log(`TypeScript: ${errors.length} 錯誤, ${warnings.length} 警告`);

  return {
    errorCount: errors.length,
    warningCount: warnings.length,
    details: [...errors, ...warnings],
  };
}

/**
 * 收集 ESLint 指標
 */
async function collectESLintMetrics() {
  log('收集 ESLint 指標...');

  const result = await safeExec(
    'npx eslint . --format json --ext .ts,.tsx,.js,.jsx --max-warnings 9999',
    'ESLint 檢查',
    { maxBuffer: 1024 * 1024 * 20 } // 20MB buffer for ESLint
  );

  let eslintResults = [];
  try {
    // 嘗試解析 JSON，如果失敗就嘗試提取 JSON 部分
    const output = result.stdout || '[]';
    const jsonMatch = output.match(/(\[.*\])/s);
    const jsonString = jsonMatch ? jsonMatch[1] : '[]';
    eslintResults = JSON.parse(jsonString);
  } catch (error) {
    log(`ESLint 結果解析失敗: ${error.message}，跳過 ESLint 檢查`, 'error');
    return {
      errorCount: 0,
      warningCount: 0,
      fixableCount: 0,
      details: [],
      skipped: true,
    };
  }

  const errors = [];
  const warnings = [];
  let fixableCount = 0;

  eslintResults.forEach(fileResult => {
    if (!fileResult.messages) return;

    fileResult.messages.forEach(message => {
      const item = {
        file: fileResult.filePath.replace(process.cwd(), ''),
        line: message.line,
        column: message.column,
        rule: message.ruleId || 'unknown',
        message: message.message,
        severity: message.severity === 2 ? 'error' : 'warning',
        fixable: !!message.fix,
      };

      if (message.fix) fixableCount++;

      if (message.severity === 2) {
        errors.push(item);
      } else {
        warnings.push(item);
      }
    });
  });

  log(`ESLint: ${errors.length} 錯誤, ${warnings.length} 警告, ${fixableCount} 可修復`);

  return {
    errorCount: errors.length,
    warningCount: warnings.length,
    fixableCount,
    details: [...errors, ...warnings],
  };
}

/**
 * 收集測試指標
 */
async function collectTestingMetrics() {
  if (CONFIG.skipTests) {
    log('跳過測試收集');
    return {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skipped: true,
    };
  }

  log('收集測試指標...');

  // 嘗試運行測試
  const result = await safeExec('npm run test:ci 2>&1 || echo "TEST_FAILED"', '測試執行');
  const output = result.stdout + result.stderr;

  // 解析測試結果（根據實際測試框架調整）
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  // Jest 格式解析
  const testSummaryMatch = output.match(
    /Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/
  );
  if (testSummaryMatch) {
    failedTests = parseInt(testSummaryMatch[1]);
    passedTests = parseInt(testSummaryMatch[2]);
    totalTests = parseInt(testSummaryMatch[3]);
  } else {
    // 簡單的通過檢測
    const passedMatch = output.match(/(\d+)\s+passing/);
    if (passedMatch) {
      passedTests = parseInt(passedMatch[1]);
      totalTests = passedTests;
    }
  }

  log(`測試: ${passedTests}/${totalTests} 通過`);

  return {
    totalTests,
    passedTests,
    failedTests,
    coverage: null, // 後續可以添加覆蓋率解析
  };
}

/**
 * 收集構建指標
 */
async function collectBuildMetrics() {
  if (CONFIG.skipBuild) {
    log('跳過構建檢查');
    return {
      status: 'skipped',
      skipped: true,
    };
  }

  log('檢查構建狀態...');

  const startTime = Date.now();
  const result = await safeExec('npm run build 2>&1', '構建檢查');
  const duration = Date.now() - startTime;

  const warnings = (result.stdout + result.stderr)
    .split('\n')
    .filter(line => line.includes('warning') || line.includes('Warning')).length;

  return {
    status: result.success ? 'success' : 'failure',
    duration,
    warnings,
  };
}

/**
 * 主要收集函數
 */
async function main() {
  log('開始收集技術債務指標...');

  const metrics = {
    timestamp: new Date().toISOString(),
    source: process.env.CI ? 'ci' : 'manual',
    environment: {
      node: process.version,
      platform: process.platform,
      ci: !!process.env.CI,
      project: path.basename(process.cwd()),
    },
    metrics: {},
  };

  try {
    // 並行收集所有指標
    const [typescript, eslint, testing, build] = await Promise.all([
      collectTypeScriptMetrics(),
      collectESLintMetrics(),
      collectTestingMetrics(),
      collectBuildMetrics(),
    ]);

    metrics.metrics = {
      typescript,
      eslint,
      testing,
      build,
    };

    // 計算總分數
    const totalIssues = typescript.errorCount + eslint.errorCount;
    const totalWarnings = typescript.warningCount + eslint.warningCount;

    metrics.summary = {
      totalIssues,
      totalWarnings,
      testPassRate: testing.totalTests > 0 ? (testing.passedTests / testing.totalTests) * 100 : 100,
      buildStatus: build.status,
      healthScore: Math.max(0, 100 - totalIssues * 2 - totalWarnings * 0.5),
    };

    // 輸出結果
    fs.writeFileSync(CONFIG.outputPath, JSON.stringify(metrics, null, 2));

    log(`技術債務報告已生成: ${CONFIG.outputPath}`);
    log(`健康分數: ${metrics.summary.healthScore.toFixed(1)}/100`);

    // 退出碼：只有在構建失敗時才返回非零（寬容模式）
    if (build.status === 'failure') {
      log('構建失敗，退出碼: 1', 'error');
      process.exit(1);
    }

    if (typescript.errorCount > 500) {
      log('TypeScript 錯誤過多，退出碼: 1', 'error');
      process.exit(1);
    }
  } catch (error) {
    log(`收集過程發生錯誤: ${error.message}`, 'error');
    process.exit(1);
  }
}

// 執行主函數
if (require.main === module) {
  main().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = {
  collectTypeScriptMetrics,
  collectESLintMetrics,
  collectTestingMetrics,
  collectBuildMetrics,
};
