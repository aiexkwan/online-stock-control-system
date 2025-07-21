#!/usr/bin/env node

/**
 * Quick test script to verify API call optimizations
 * 快速測試腳本驗證 API 調用優化
 */

const puppeteer = require('puppeteer');

async function testDashboardAPICallsn() {
  console.log('🚀 Starting API call optimization test...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  });

  const page = await browser.newPage();

  // Track API calls
  let apiCalls = [];

  page.on('request', request => {
    if (request.url().includes('/api/admin/dashboard')) {
      apiCalls.push({
        url: request.url(),
        timestamp: new Date().toISOString(),
        method: request.method(),
      });
      console.log(`🔥 API CALL #${apiCalls.length}: ${request.url()}`);
    }
  });

  try {
    // Go to admin dashboard
    console.log('📱 Navigating to admin dashboard...');
    await page.goto('http://localhost:3000/admin/injection', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait a bit to see if there are any polling calls
    console.log('⏳ Waiting 10 seconds to monitor for polling...');
    await page.waitForTimeout(10000);

    // Try switching themes to test if that triggers excessive calls
    console.log('🔄 Testing theme switching...');
    await page.goto('http://localhost:3000/admin/warehouse', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await page.waitForTimeout(5000);

    // Try analysis page (our simplified version)
    console.log('📊 Testing analysis page...');
    await page.goto('http://localhost:3000/admin/analysis', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await page.waitForTimeout(5000);

    // Final report
    console.log('\n📊 FINAL TEST RESULTS:');
    console.log(`   Total API calls: ${apiCalls.length}`);
    console.log(`   Target: < 20 calls`);

    if (apiCalls.length <= 15) {
      console.log('✅ SUCCESS: API calls optimized successfully!');
    } else if (apiCalls.length <= 25) {
      console.log('⚠️  MODERATE: Some improvement but still room for optimization');
    } else {
      console.log('❌ FAILURE: Too many API calls, further optimization needed');
    }

    // Show detailed call log
    console.log('\n📋 API Call Details:');
    apiCalls.forEach((call, index) => {
      console.log(`   ${index + 1}. ${call.timestamp} - ${call.url}`);
    });
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  await browser.close();
}

// Check if Next.js server is running
const http = require('http');

function checkServer() {
  return new Promise(resolve => {
    const req = http.get('http://localhost:3000', res => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.log('❌ Next.js server not running on localhost:3000');
    console.log('💡 Please run: npm run dev');
    process.exit(1);
  }

  await testDashboardAPICallsn();
}

main().catch(console.error);
