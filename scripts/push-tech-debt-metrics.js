#!/usr/bin/env node

/**
 * 技術債務指標推送腳本
 *
 * 將收集的技術債務指標推送到監控 API
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  reportPath: process.env.TECH_DEBT_REPORT_PATH || './tech-debt-report.json',
  apiUrl: process.env.TECH_DEBT_API_URL || 'http://localhost:3000/api/monitoring/tech-debt',
  verbose: process.env.VERBOSE === 'true'
};

function log(message, level = 'info') {
  if (CONFIG.verbose || level === 'error') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }
}

async function pushMetrics() {
  try {
    // 檢查報告文件是否存在
    if (!fs.existsSync(CONFIG.reportPath)) {
      log(`報告文件不存在: ${CONFIG.reportPath}`, 'error');
      process.exit(1);
    }

    // 讀取報告數據
    const reportData = JSON.parse(fs.readFileSync(CONFIG.reportPath, 'utf8'));
    log(`讀取報告數據: ${Object.keys(reportData.metrics).length} 個指標類型`);

    // 推送到 API
    log(`推送數據到: ${CONFIG.apiUrl}`);

    const response = await fetch(CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData)
    });

    if (response.ok) {
      const result = await response.json();
      log('數據推送成功');
      log(`伺服器回應: ${JSON.stringify(result, null, 2)}`);
    } else {
      const errorText = await response.text();
      log(`推送失敗 (${response.status}): ${errorText}`, 'error');
      process.exit(1);
    }

  } catch (error) {
    log(`推送過程發生錯誤: ${error.message}`, 'error');
    process.exit(1);
  }
}

// 檢查是否有 fetch （Node.js 18+）
if (typeof fetch === 'undefined') {
  log('需要 Node.js 18+ 或安裝 node-fetch', 'error');
  process.exit(1);
}

// 執行推送
if (require.main === module) {
  pushMetrics().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { pushMetrics };
