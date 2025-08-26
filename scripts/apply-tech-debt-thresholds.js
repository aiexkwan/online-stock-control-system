#!/usr/bin/env node

/**
 * 技術債務閾值應用腳本
 *
 * 根據配置的閾值檢查當前項目狀態並採取相應行動
 */

const fs = require('fs');
const path = require('path');

// 讀取配置
const configPath = path.join(__dirname, '../config/tech-debt-thresholds.json');
const reportPath = path.join(__dirname, '../tech-debt-report.json');

/**
 * 讀取配置文件
 */
function loadConfig() {
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('❌ 無法讀取閾值配置:', error.message);
    process.exit(1);
  }
}

/**
 * 讀取技術債務報告
 */
function loadTechDebtReport() {
  try {
    const reportData = fs.readFileSync(reportPath, 'utf8');
    return JSON.parse(reportData);
  } catch (error) {
    console.error('❌ 無法讀取技術債務報告:', error.message);
    console.error('請先運行: npm run tech-debt:collect');
    process.exit(1);
  }
}

/**
 * 獲取環境特定的閾值
 */
function getThresholdsForEnvironment(config, environment = 'development') {
  const baseThresholds = config.thresholds;
  const envConfig = config.environments[environment];

  if (!envConfig) {
    console.warn(`⚠️  環境 '${environment}' 不存在，使用預設閾值`);
    return baseThresholds;
  }

  // 應用環境修改器
  const modifiedThresholds = JSON.parse(JSON.stringify(baseThresholds));

  if (envConfig.modifiers) {
    Object.entries(envConfig.modifiers).forEach(([path, value]) => {
      const pathParts = path.split('.');
      let current = modifiedThresholds;

      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }

      const lastPart = pathParts[pathParts.length - 1];
      if (current[lastPart] && typeof current[lastPart] === 'object') {
        current[lastPart].value = value;
      }
    });
  }

  return modifiedThresholds;
}

/**
 * 檢查單個閾值
 */
function checkThreshold(name, currentValue, threshold) {
  if (!threshold || typeof threshold.value === 'undefined') {
    return { passed: true, message: `閾值 ${name} 未配置` };
  }

  const passed = currentValue <= threshold.value;
  const status = passed ? '✅' : '❌';
  const level = threshold.level || 'info';

  return {
    passed,
    level,
    message: `${status} ${name}: ${currentValue}/${threshold.value} (${threshold.description})`,
    action: threshold.actionRequired,
    currentValue,
    thresholdValue: threshold.value,
  };
}

/**
 * 主要檢查函數
 */
function checkThresholds() {
  const config = loadConfig();
  const report = loadTechDebtReport();
  const environment = process.env.NODE_ENV || process.env.TECH_DEBT_ENV || 'development';

  console.log(`🔍 檢查技術債務閾值 (環境: ${environment})`);
  console.log(`📊 報告時間: ${report.timestamp}`);
  console.log('');

  const thresholds = getThresholdsForEnvironment(config, environment);
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    critical: [],
    high: [],
    medium: [],
    info: [],
  };

  // TypeScript 檢查
  console.log('📝 TypeScript 分析:');
  const tsErrorCheck = checkThreshold(
    'TypeScript 錯誤',
    report.metrics.typescript.errorCount,
    thresholds.typescript.maxErrors
  );
  console.log(`   ${tsErrorCheck.message}`);
  if (tsErrorCheck.action && !tsErrorCheck.passed) {
    console.log(`   ➡️  行動: ${tsErrorCheck.action}`);
  }

  const tsWarningCheck = checkThreshold(
    'TypeScript 警告',
    report.metrics.typescript.warningCount,
    thresholds.typescript.maxWarnings
  );
  console.log(`   ${tsWarningCheck.message}`);

  // ESLint 檢查
  console.log('\n🔧 ESLint 分析:');
  const eslintErrorCheck = checkThreshold(
    'ESLint 錯誤',
    report.metrics.eslint.errorCount,
    thresholds.eslint.maxErrors
  );
  console.log(`   ${eslintErrorCheck.message}`);

  const eslintWarningCheck = checkThreshold(
    'ESLint 警告',
    report.metrics.eslint.warningCount,
    thresholds.eslint.maxWarnings
  );
  console.log(`   ${eslintWarningCheck.message}`);

  const eslintFixableCheck = checkThreshold(
    'ESLint 可修復問題',
    report.metrics.eslint.fixableCount,
    thresholds.eslint.maxFixableIssues
  );
  console.log(`   ${eslintFixableCheck.message}`);
  if (eslintFixableCheck.action && !eslintFixableCheck.passed) {
    console.log(`   ➡️  行動: ${eslintFixableCheck.action}`);
  }

  // 測試檢查
  console.log('\n🧪 測試分析:');
  const testFailCheck = checkThreshold(
    '測試失敗',
    report.metrics.testing.failedTests,
    thresholds.testing.maxFailedTests
  );
  console.log(`   ${testFailCheck.message}`);

  // 健康分數檢查
  console.log('\n📈 整體健康:');
  const healthCheck = checkThreshold(
    '健康分數',
    100 - report.summary.healthScore, // 反轉，因為我們檢查的是最小值
    {
      value: 100 - thresholds.codeQuality.minHealthScore.value,
      ...thresholds.codeQuality.minHealthScore,
    }
  );
  console.log(
    `   ${healthCheck.passed ? '✅' : '❌'} 健康分數: ${report.summary.healthScore}/100 (最低要求: ${thresholds.codeQuality.minHealthScore.value})`
  );

  // 收集所有檢查結果
  const allChecks = [
    tsErrorCheck,
    tsWarningCheck,
    eslintErrorCheck,
    eslintWarningCheck,
    eslintFixableCheck,
    testFailCheck,
    healthCheck,
  ];

  // 分類結果
  allChecks.forEach(check => {
    if (check.passed) {
      results.passed++;
    } else {
      results.failed++;

      switch (check.level) {
        case 'error':
          results.critical.push(check);
          break;
        case 'warning':
          results.high.push(check);
          break;
        default:
          results.medium.push(check);
      }
    }
  });

  // 檢查升級規則
  console.log('\n🚨 升級規則檢查:');
  const escalationResults = checkEscalationRules(config, report);

  // 輸出總結
  console.log('\n📋 總結:');
  console.log(`   ✅ 通過: ${results.passed}`);
  console.log(`   ❌ 失敗: ${results.failed}`);
  console.log(`   🔴 嚴重: ${results.critical.length}`);
  console.log(`   🟡 高優先級: ${results.high.length}`);
  console.log(`   🟠 中優先級: ${results.medium.length}`);

  // 建議行動
  if (results.critical.length > 0 || escalationResults.critical.length > 0) {
    console.log('\n🚨 需要立即行動:');
    results.critical.forEach(check => {
      console.log(`   • ${check.action}`);
    });
    escalationResults.critical.forEach(action => {
      console.log(`   • ${action}`);
    });

    // 嚴重問題時退出代碼為 1
    process.exit(1);
  } else if (results.high.length > 0 || escalationResults.high.length > 0) {
    console.log('\n⚠️  建議行動:');
    results.high.forEach(check => {
      console.log(`   • ${check.action}`);
    });
    escalationResults.high.forEach(action => {
      console.log(`   • ${action}`);
    });
  }

  console.log('\n✅ 閾值檢查完成');
  return results;
}

/**
 * 檢查升級規則
 */
function checkEscalationRules(config, report) {
  const results = {
    critical: [],
    high: [],
    medium: [],
  };

  const escalationRules = config.escalationRules;

  // 檢查關鍵問題
  if (escalationRules.criticalIssues) {
    let triggered = false;

    // 安全問題 (模擬檢查)
    if (report.summary.totalIssues > 1000) {
      triggered = true;
    }

    // TypeScript 錯誤過多
    if (report.metrics.typescript.errorCount > 1000) {
      triggered = true;
    }

    if (triggered) {
      console.log('   🔴 觸發關鍵升級規則');
      results.critical.push(...escalationRules.criticalIssues.actions);
    }
  }

  // 檢查高優先級問題
  if (escalationRules.highPriorityIssues) {
    let triggered = false;

    if (report.metrics.typescript.errorCount > 500) {
      triggered = true;
    }

    if (report.metrics.eslint.errorCount > 100) {
      triggered = true;
    }

    if (report.summary.healthScore < 50) {
      triggered = true;
    }

    if (triggered) {
      console.log('   🟡 觸發高優先級升級規則');
      results.high.push(...escalationRules.highPriorityIssues.actions);
    }
  }

  // 檢查中優先級問題
  if (escalationRules.mediumPriorityIssues) {
    let triggered = false;

    if (report.metrics.typescript.errorCount > 200) {
      triggered = true;
    }

    if (report.metrics.eslint.warningCount > 200) {
      triggered = true;
    }

    if (triggered) {
      console.log('   🟠 觸發中優先級升級規則');
      results.medium.push(...escalationRules.mediumPriorityIssues.actions);
    }
  }

  return results;
}

/**
 * 生成閾值報告
 */
function generateThresholdReport() {
  const config = loadConfig();
  const report = loadTechDebtReport();
  const environment = process.env.NODE_ENV || process.env.TECH_DEBT_ENV || 'development';

  const thresholds = getThresholdsForEnvironment(config, environment);

  const thresholdReport = {
    timestamp: new Date().toISOString(),
    environment,
    configVersion: config.version,
    checks: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      critical: 0,
      warnings: 0,
    },
  };

  // 執行所有檢查並收集結果
  const checks = [
    ['typescript.errors', report.metrics.typescript.errorCount, thresholds.typescript.maxErrors],
    [
      'typescript.warnings',
      report.metrics.typescript.warningCount,
      thresholds.typescript.maxWarnings,
    ],
    ['eslint.errors', report.metrics.eslint.errorCount, thresholds.eslint.maxErrors],
    ['eslint.warnings', report.metrics.eslint.warningCount, thresholds.eslint.maxWarnings],
    ['eslint.fixable', report.metrics.eslint.fixableCount, thresholds.eslint.maxFixableIssues],
    ['testing.failed', report.metrics.testing.failedTests, thresholds.testing.maxFailedTests],
    [
      'health.score',
      100 - report.summary.healthScore,
      {
        value: 100 - thresholds.codeQuality.minHealthScore.value,
        ...thresholds.codeQuality.minHealthScore,
      },
    ],
  ];

  checks.forEach(([name, currentValue, threshold]) => {
    const result = checkThreshold(name, currentValue, threshold);
    thresholdReport.checks[name] = {
      passed: result.passed,
      currentValue: result.currentValue,
      thresholdValue: result.thresholdValue,
      level: result.level,
      message: result.message,
      action: result.action,
    };

    thresholdReport.summary.total++;
    if (result.passed) {
      thresholdReport.summary.passed++;
    } else {
      thresholdReport.summary.failed++;
      if (result.level === 'error') {
        thresholdReport.summary.critical++;
      } else {
        thresholdReport.summary.warnings++;
      }
    }
  });

  // 寫入報告文件
  const reportPath = path.join(__dirname, '../tech-debt-threshold-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(thresholdReport, null, 2));

  return thresholdReport;
}

// 主執行邏輯
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'check':
      checkThresholds();
      break;
    case 'report':
      const report = generateThresholdReport();
      console.log('📊 閾值報告已生成:', 'tech-debt-threshold-report.json');
      break;
    default:
      console.log('用法: node apply-tech-debt-thresholds.js [check|report]');
      console.log('');
      console.log('命令:');
      console.log('  check   - 檢查當前狀態對比閾值');
      console.log('  report  - 生成詳細閾值報告');
      console.log('');
      console.log('環境變量:');
      console.log('  TECH_DEBT_ENV - 指定環境 (development|staging|production)');
      process.exit(1);
  }
}

module.exports = {
  loadConfig,
  loadTechDebtReport,
  getThresholdsForEnvironment,
  checkThreshold,
  checkThresholds,
  generateThresholdReport,
};
