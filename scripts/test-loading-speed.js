#!/usr/bin/env node

/**
 * 載入速度測試腳本
 * 測試首次載入時間是否 < 3s
 */

const { chromium } = require('playwright');

async function testLoadingSpeed() {
  console.log('🚀 開始載入速度測試...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 監聽網絡事件
  let loadStartTime = Date.now();
  let domContentLoadedTime = null;
  let fullyLoadedTime = null;
  
  page.on('domcontentloaded', () => {
    domContentLoadedTime = Date.now() - loadStartTime;
    console.log(`📄 DOM Content Loaded: ${domContentLoadedTime}ms`);
  });
  
  page.on('load', () => {
    fullyLoadedTime = Date.now() - loadStartTime;
    console.log(`🎯 Page Fully Loaded: ${fullyLoadedTime}ms`);
  });
  
  // 測試主要頁面
  const testPages = [
    { url: 'http://localhost:3000/', name: '首頁' },
    { url: 'http://localhost:3000/main-login', name: '登入頁' },
    { url: 'http://localhost:3000/admin/warehouse', name: '倉庫管理' },
    { url: 'http://localhost:3000/admin/injection', name: '注塑管理' },
  ];
  
  const results = [];
  
  for (const testPage of testPages) {
    try {
      console.log(`\n📊 測試頁面: ${testPage.name} (${testPage.url})`);
      
      loadStartTime = Date.now();
      domContentLoadedTime = null;
      fullyLoadedTime = null;
      
      // 開始載入頁面
      await page.goto(testPage.url, { waitUntil: 'networkidle' });
      
      // 等待 JavaScript 執行完成
      await page.waitForTimeout(1000);
      
      const finalLoadTime = Date.now() - loadStartTime;
      
      const result = {
        name: testPage.name,
        url: testPage.url,
        domContentLoaded: domContentLoadedTime,
        fullyLoaded: fullyLoadedTime,
        finalLoadTime: finalLoadTime,
        passed: finalLoadTime < 3000
      };
      
      results.push(result);
      
      console.log(`  📈 最終載入時間: ${finalLoadTime}ms`);
      console.log(`  ${result.passed ? '✅' : '❌'} 目標 < 3000ms: ${result.passed ? '通過' : '未通過'}`);
      
    } catch (error) {
      console.error(`❌ 測試頁面 ${testPage.name} 失敗:`, error.message);
      results.push({
        name: testPage.name,
        url: testPage.url,
        error: error.message,
        passed: false
      });
    }
  }
  
  await browser.close();
  
  // 輸出總結
  console.log('\n📊 載入速度測試結果總結:');
  console.log('=' * 50);
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.name}: 錯誤 - ${result.error}`);
    } else {
      console.log(`${result.passed ? '✅' : '❌'} ${result.name}: ${result.finalLoadTime}ms`);
    }
  });
  
  console.log(`\n📈 總體結果: ${passedCount}/${totalCount} 頁面通過測試`);
  console.log(`🎯 目標達成率: ${((passedCount / totalCount) * 100).toFixed(1)}%`);
  
  if (passedCount === totalCount) {
    console.log('✅ 所有頁面載入速度都符合 < 3s 目標！');
  } else {
    console.log('⚠️  部分頁面載入時間超過 3s 目標');
  }
  
  return passedCount === totalCount;
}

// 檢查服務器是否運行
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/');
    return response.ok;
  } catch (error) {
    return false;
  }
}

// 主執行函數
async function main() {
  console.log('🔍 檢查開發服務器...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ 開發服務器未運行，請先運行 npm run dev');
    process.exit(1);
  }
  
  console.log('✅ 開發服務器運行中');
  
  const allPassed = await testLoadingSpeed();
  
  if (allPassed) {
    console.log('\n🎉 載入優化測試通過！');
    process.exit(0);
  } else {
    console.log('\n⚠️  載入優化需要進一步改進');
    process.exit(1);
  }
}

main().catch(console.error);