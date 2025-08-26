#!/usr/bin/env node
/**
 * 快速測試 PDF 提取 API 的診斷工具
 * 用於驗證 Vercel 部署的 PDF 提取功能
 */

const fs = require('fs');
const path = require('path');

// 測試配置
const TEST_CONFIG = {
  // 本地測試
  local: 'http://localhost:3000/api/pdf-extract',
  // 生產環境 (需要替換為實際 URL)
  production: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/pdf-extract` : null,
};

/**
 * 測試 API 端點
 */
async function testPDFAPI(apiUrl) {
  console.log(`🧪 Testing API: ${apiUrl}`);

  try {
    // 檢查是否有測試 PDF 文件
    const testPDFPath = path.join(__dirname, '../docs/Others/281513-Picking List.pdf');
    if (!fs.existsSync(testPDFPath)) {
      console.log(`⚠️  Test PDF not found at: ${testPDFPath}`);
      console.log('📋 Creating mock test data...');

      // 創建模擬 FormData (無實際文件)
      const testResult = await testWithoutFile(apiUrl);
      return testResult;
    }

    // 讀取測試 PDF
    const pdfBuffer = fs.readFileSync(testPDFPath);
    console.log(`📄 Found test PDF: ${path.basename(testPDFPath)} (${pdfBuffer.length} bytes)`);

    // 準備 FormData
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', pdfBuffer, {
      filename: '281513-Picking List.pdf',
      contentType: 'application/pdf',
    });
    formData.append('fileName', '281513-Picking List.pdf');

    // 發送請求
    const startTime = Date.now();
    const fetch = require('node-fetch');

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
      timeout: 60000, // 60秒超時
    });

    const responseTime = Date.now() - startTime;

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Response Time: ${responseTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const result = await response.json();

    // 分析結果
    if (result.success && result.data) {
      console.log('✅ API Test Successful!');
      console.log(`📋 Order Ref: ${result.data.order_ref}`);
      console.log(`📦 Products Found: ${result.data.products.length}`);
      console.log(`🔧 Extraction Method: ${result.metadata?.method || 'unknown'}`);
      console.log(`🎯 Tokens Used: ${result.metadata?.tokensUsed || 'unknown'}`);

      if (result.data.products.length > 0) {
        console.log('📦 Sample Products:');
        result.data.products.slice(0, 3).forEach((product, i) => {
          console.log(
            `   ${i + 1}. ${product.product_code} - ${product.product_desc} (qty: ${product.product_qty})`
          );
        });
      }

      return { success: true, data: result };
    } else {
      console.error('❌ API returned failure:', result.error || 'Unknown error');
      return { success: false, error: result.error || 'API returned failure' };
    }
  } catch (error) {
    console.error('❌ Test Error:', error.message);

    // 詳細錯誤分析
    if (error.code === 'ECONNREFUSED') {
      console.log('🔍 Diagnosis: Server not running or wrong URL');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('🔍 Diagnosis: Request timeout - server may be overloaded');
    } else if (error.message.includes('fetch')) {
      console.log('🔍 Diagnosis: Network connectivity issue');
    }

    return { success: false, error: error.message };
  }
}

/**
 * 測試不帶文件的 API 調用 (檢查端點可達性)
 */
async function testWithoutFile(apiUrl) {
  try {
    const fetch = require('node-fetch');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const status = response.status;
    console.log(`📡 Endpoint Status: ${status}`);

    if (status === 400) {
      console.log('✅ API endpoint is reachable (returns expected 400 for missing file)');
      return { success: true, reachable: true };
    } else {
      const text = await response.text();
      console.log(`⚠️  Unexpected response: ${text}`);
      return { success: false, error: `Unexpected status: ${status}` };
    }
  } catch (error) {
    console.error('❌ Endpoint not reachable:', error.message);
    return { success: false, error: `Endpoint unreachable: ${error.message}` };
  }
}

/**
 * 環境變數診斷
 */
function diagnoseEnvironment() {
  console.log('🔍 Environment Diagnosis:');
  console.log(`   VERCEL_URL: ${process.env.VERCEL_URL || 'Not set'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
  console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'Set ✅' : 'Not set ❌'}`);
  console.log(`   NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || 'Not set'}`);
}

/**
 * 主測試函數
 */
async function runTests() {
  console.log('🚀 PDF API Diagnostic Tool');
  console.log('='.repeat(50));

  // 環境診斷
  diagnoseEnvironment();
  console.log('');

  // 測試本地開發環境
  if (process.argv.includes('--local') || !process.env.VERCEL_URL) {
    console.log('🏠 Testing Local Development Server');
    console.log('-'.repeat(30));
    const localResult = await testPDFAPI(TEST_CONFIG.local);
    console.log('');
  }

  // 測試生產環境
  if (TEST_CONFIG.production && (process.argv.includes('--prod') || process.env.VERCEL_URL)) {
    console.log('☁️  Testing Production Environment');
    console.log('-'.repeat(30));
    const prodResult = await testPDFAPI(TEST_CONFIG.production);
    console.log('');
  }

  // 使用說明
  if (
    !process.argv.includes('--local') &&
    !process.argv.includes('--prod') &&
    !process.env.VERCEL_URL
  ) {
    console.log('💡 Usage:');
    console.log('   node scripts/test-pdf-api.js --local   # Test local development');
    console.log('   node scripts/test-pdf-api.js --prod    # Test production');
    console.log(
      '   VERCEL_URL=your-app.vercel.app node scripts/test-pdf-api.js  # Test specific URL'
    );
  }

  console.log('✨ Diagnostic complete!');
}

// 執行測試
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testPDFAPI, diagnoseEnvironment };
