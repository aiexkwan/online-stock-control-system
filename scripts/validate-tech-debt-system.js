#!/usr/bin/env node

/**
 * 技術債務治理系統驗證腳本
 *
 * 驗證 Phase 6D 建立的長期治理機制是否正常運作
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * 驗證項目列表
 */
const validationChecks = {
  dashboard: '技術債務監控 Dashboard',
  cicd: 'CI/CD 類型檢查增強',
  precommit: 'Pre-commit hooks 設置',
  codeReview: '代碼審查流程自動化',
  thresholds: '預警閾值設定',
  documentation: '團隊最佳實踐文檔化',
  scripts: '自動化腳本功能',
  configuration: '配置文件完整性',
};

/**
 * 輸出格式化
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    test: '🧪',
  }[level];

  console.log(`${prefix} ${message}`);
}

/**
 * 檢查文件是否存在
 */
function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  log(`${description}: ${exists ? '存在' : '缺失'} - ${filePath}`, exists ? 'success' : 'error');
  return exists;
}

/**
 * 檢查命令是否可執行
 */
async function checkCommand(command, description) {
  try {
    await execAsync(command);
    log(`${description}: 可執行`, 'success');
    return true;
  } catch (error) {
    log(`${description}: 執行失敗 - ${error.message}`, 'error');
    return false;
  }
}

/**
 * 驗證 Dashboard 組件
 */
async function validateDashboard() {
  log('驗證技術債務監控 Dashboard...', 'test');

  const checks = [
    // API 路由
    ['app/api/monitoring/tech-debt/route.ts', 'API 路由'],
    // Dashboard 頁面
    ['app/admin/tech-debt-monitoring/page.tsx', 'Dashboard 頁面'],
    // 數據收集腳本
    ['scripts/collect-tech-debt-metrics.js', '數據收集腳本'],
  ];

  let passed = 0;
  checks.forEach(([file, desc]) => {
    if (checkFileExists(file, desc)) passed++;
  });

  return { passed, total: checks.length, component: 'Dashboard' };
}

/**
 * 驗證 CI/CD 配置
 */
async function validateCICD() {
  log('驗證 CI/CD 配置...', 'test');

  const checks = [
    // GitHub Actions workflows
    ['.github/workflows/tech-debt-monitoring.yml', '技術債務監控工作流'],
    ['.github/workflows/code-review-automation.yml', '代碼審查自動化工作流'],
    ['.github/workflows/test.yml', '測試工作流'],
  ];

  let passed = 0;
  checks.forEach(([file, desc]) => {
    if (checkFileExists(file, desc)) passed++;
  });

  return { passed, total: checks.length, component: 'CI/CD' };
}

/**
 * 驗證 Pre-commit 設置
 */
async function validatePrecommit() {
  log('驗證 Pre-commit 設置...', 'test');

  const checks = [
    // 配置文件
    ['.pre-commit-config.yaml', 'Pre-commit 配置'],
    ['scripts/setup-pre-commit.sh', '安裝腳本'],
    ['PRE_COMMIT_GUIDE.md', '使用指南'],
  ];

  let passed = 0;
  checks.forEach(([file, desc]) => {
    if (checkFileExists(file, desc)) passed++;
  });

  // 檢查 pre-commit 是否安裝
  try {
    await execAsync('pre-commit --version');
    log('Pre-commit 工具: 已安裝', 'success');
    passed++;
    checks.push(['pre-commit-tool', 'Pre-commit 工具']);
  } catch (error) {
    log('Pre-commit 工具: 未安裝', 'warning');
  }

  return { passed, total: checks.length, component: 'Pre-commit' };
}

/**
 * 驗證代碼審查自動化
 */
async function validateCodeReview() {
  log('驗證代碼審查自動化...', 'test');

  const checks = [['.github/workflows/code-review-automation.yml', '自動化代碼審查工作流']];

  let passed = 0;
  checks.forEach(([file, desc]) => {
    if (checkFileExists(file, desc)) passed++;
  });

  return { passed, total: checks.length, component: 'Code Review' };
}

/**
 * 驗證閾值設定
 */
async function validateThresholds() {
  log('驗證閾值設定...', 'test');

  const checks = [
    // 配置文件
    ['config/tech-debt-thresholds.json', '閾值配置'],
    ['scripts/apply-tech-debt-thresholds.js', '閾值應用腳本'],
  ];

  let passed = 0;
  checks.forEach(([file, desc]) => {
    if (checkFileExists(file, desc)) passed++;
  });

  // 驗證配置文件格式
  try {
    const configPath = 'config/tech-debt-thresholds.json';
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.thresholds && config.environments) {
        log('閾值配置格式: 有效', 'success');
        passed++;
      } else {
        log('閾值配置格式: 無效', 'error');
      }
    }
  } catch (error) {
    log(`閾值配置解析: 失敗 - ${error.message}`, 'error');
  }

  return { passed, total: checks.length + 1, component: 'Thresholds' };
}

/**
 * 驗證文檔
 */
async function validateDocumentation() {
  log('驗證文檔...', 'test');

  const checks = [
    ['docs/team-best-practices.md', '團隊最佳實踐指南'],
    ['PRE_COMMIT_GUIDE.md', 'Pre-commit 使用指南'],
    ['CLAUDE.md', '項目開發指南'],
  ];

  let passed = 0;
  checks.forEach(([file, desc]) => {
    if (checkFileExists(file, desc)) passed++;
  });

  return { passed, total: checks.length, component: 'Documentation' };
}

/**
 * 驗證腳本功能
 */
async function validateScripts() {
  log('驗證腳本功能...', 'test');

  const scriptChecks = [
    ['npm run tech-debt:collect:fast', '技術債務收集'],
    ['npm run tech-debt:check', '閾值檢查'],
    ['npm run pre-commit:run', 'Pre-commit 檢查'],
  ];

  let passed = 0;
  for (const [command, desc] of scriptChecks) {
    if (await checkCommand(command, desc)) {
      passed++;
    }
  }

  return { passed, total: scriptChecks.length, component: 'Scripts' };
}

/**
 * 驗證配置完整性
 */
async function validateConfiguration() {
  log('驗證配置完整性...', 'test');

  const checks = [
    ['package.json', 'Package 配置'],
    ['tsconfig.json', 'TypeScript 配置'],
    ['.eslintrc.json', 'ESLint 配置'],
  ];

  let passed = 0;
  checks.forEach(([file, desc]) => {
    if (checkFileExists(file, desc)) passed++;
  });

  // 檢查 package.json 中的技術債務相關腳本
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const techDebtScripts = Object.keys(packageJson.scripts).filter(
      script => script.includes('tech-debt') || script.includes('pre-commit')
    );

    if (techDebtScripts.length >= 5) {
      log(`技術債務相關腳本: ${techDebtScripts.length} 個`, 'success');
      passed++;
    } else {
      log(`技術債務相關腳本: 不足 (${techDebtScripts.length}/5)`, 'warning');
    }
  } catch (error) {
    log(`Package.json 解析失敗: ${error.message}`, 'error');
  }

  return { passed, total: checks.length + 1, component: 'Configuration' };
}

/**
 * 生成驗證報告
 */
function generateValidationReport(results) {
  const totalPassed = results.reduce((sum, result) => sum + result.passed, 0);
  const totalChecks = results.reduce((sum, result) => sum + result.total, 0);
  const successRate = ((totalPassed / totalChecks) * 100).toFixed(1);

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalChecks,
      totalPassed,
      successRate: parseFloat(successRate),
      status: successRate >= 90 ? 'PASS' : successRate >= 70 ? 'WARNING' : 'FAIL',
    },
    components: results.reduce((acc, result) => {
      acc[result.component] = {
        passed: result.passed,
        total: result.total,
        rate: ((result.passed / result.total) * 100).toFixed(1),
      };
      return acc;
    }, {}),
    recommendations: [],
  };

  // 生成建議
  if (successRate < 100) {
    const failedComponents = results.filter(r => r.passed < r.total);
    failedComponents.forEach(component => {
      report.recommendations.push(
        `修復 ${component.component} 組件中的 ${component.total - component.passed} 個問題`
      );
    });
  }

  if (successRate < 70) {
    report.recommendations.push('技術債務治理系統需要重大修復');
  } else if (successRate < 90) {
    report.recommendations.push('技術債務治理系統需要小幅改進');
  } else {
    report.recommendations.push('技術債務治理系統運行良好');
  }

  return report;
}

/**
 * 主要驗證函數
 */
async function runValidation() {
  log('🚀 開始驗證技術債務治理系統...', 'info');
  log('', 'info');

  const results = [];

  // 執行所有驗證
  results.push(await validateDashboard());
  results.push(await validateCICD());
  results.push(await validatePrecommit());
  results.push(await validateCodeReview());
  results.push(await validateThresholds());
  results.push(await validateDocumentation());
  results.push(await validateScripts());
  results.push(await validateConfiguration());

  // 生成報告
  const report = generateValidationReport(results);

  // 輸出總結
  log('', 'info');
  log('📊 驗證總結:', 'info');
  log(`   總檢查項目: ${report.summary.totalChecks}`, 'info');
  log(`   通過項目: ${report.summary.totalPassed}`, 'info');
  log(`   成功率: ${report.summary.successRate}%`, 'info');
  log(
    `   整體狀態: ${report.summary.status}`,
    report.summary.status === 'PASS' ? 'success' : 'warning'
  );

  log('', 'info');
  log('📋 組件詳情:', 'info');
  Object.entries(report.components).forEach(([component, data]) => {
    log(
      `   ${component}: ${data.passed}/${data.total} (${data.rate}%)`,
      data.rate >= 90 ? 'success' : 'warning'
    );
  });

  if (report.recommendations.length > 0) {
    log('', 'info');
    log('💡 建議:', 'info');
    report.recommendations.forEach(recommendation => {
      log(`   • ${recommendation}`, 'warning');
    });
  }

  // 寫入報告文件
  const reportPath = path.join(__dirname, '../tech-debt-system-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log('', 'info');
  log(`📝 詳細報告已保存: ${reportPath}`, 'success');

  // 設置退出代碼
  if (report.summary.status === 'FAIL') {
    process.exit(1);
  } else if (report.summary.status === 'WARNING') {
    process.exit(2);
  } else {
    process.exit(0);
  }
}

// 執行驗證
if (require.main === module) {
  runValidation().catch(error => {
    log(`驗證過程中出現錯誤: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runValidation,
  generateValidationReport,
  validationChecks,
};
