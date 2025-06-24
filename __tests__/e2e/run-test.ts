#!/usr/bin/env ts-node

import * as path from 'path';
import { spawn } from 'child_process';
import { ReportGenerator } from './helpers/report-generator';
import * as fs from 'fs';

// 運行測試嘅腳本
async function runTests() {
  console.log('🚀 開始運行 Order PDF Upload E2E 測試...\n');
  
  // 確保報告目錄存在
  const reportDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  // 運行 Jest 測試
  const jestProcess = spawn('npx', [
    'jest',
    '__tests__/e2e/order-pdf-upload.test.ts',
    '--verbose',
    '--runInBand', // 確保測試按順序運行
    '--no-cache'
  ], {
    stdio: 'inherit',
    shell: true
  });
  
  jestProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ 測試完成！');
      
      // 生成 HTML 報告
      try {
        const reportFiles = fs.readdirSync(reportDir)
          .filter(f => f.startsWith('test-report-') && f.endsWith('.json'))
          .sort((a, b) => b.localeCompare(a));
        
        if (reportFiles.length > 0) {
          const latestReport = path.join(reportDir, reportFiles[0]);
          const reportData = JSON.parse(fs.readFileSync(latestReport, 'utf8'));
          
          const htmlReportPath = path.join(reportDir, `test-report-${Date.now()}.html`);
          ReportGenerator.generateHTMLReport(reportData.results, htmlReportPath);
          
          console.log(`\n📊 HTML 報告已生成: ${htmlReportPath}`);
          console.log('\n打開報告: open ' + htmlReportPath);
        }
      } catch (error) {
        console.error('生成 HTML 報告時出錯:', error);
      }
    } else {
      console.error(`\n❌ 測試失敗，退出碼: ${code}`);
    }
  });
  
  jestProcess.on('error', (error) => {
    console.error('執行測試時出錯:', error);
  });
}

// 直接運行
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests };