#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const FormData = require('form-data');
const axios = require('axios');

// 測試配置
const testConfig = {
  email: 'akwan@pennineindustries.com',
  password: 'X315Y316',
  baseUrl: 'http://localhost:3000',
  apiUrl: 'http://localhost:3000/api/analyze-order-pdf-new',
  pdfFile: '280813-Picking List.pdf',
  uploadedBy: '1'
};

// 獲取身份驗證 cookie
async function getAuthCookies() {
  console.log('🔐 獲取身份驗證 cookies...\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // 訪問登錄頁面
    await page.goto(`${testConfig.baseUrl}/main-login`, { waitUntil: 'networkidle0' });
    
    // 填寫登錄表單
    await page.type('input[type="email"]', testConfig.email);
    await page.type('input[type="password"]', testConfig.password);
    
    // 提交表單
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    // 檢查是否登錄成功
    const currentUrl = page.url();
    if (currentUrl.includes('main-login')) {
      throw new Error('登錄失敗！請檢查用戶名和密碼');
    }
    
    console.log('✅ 登錄成功！');
    
    // 獲取所有 cookies
    const cookies = await page.cookies();
    
    // 過濾出認證相關的 cookies
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('auth-token') || 
      cookie.name.includes('supabase') ||
      cookie.name.includes('sb-')
    );
    
    console.log(`📋 獲取到 ${authCookies.length} 個認證 cookies\n`);
    
    return authCookies;
    
  } finally {
    await browser.close();
  }
}

// 使用認證 cookies 測試 API
async function testWithAuth(cookies) {
  console.log(`📄 測試 PDF: ${testConfig.pdfFile}\n`);
  
  try {
    // 準備文件
    const pdfPath = path.join(process.cwd(), 'public/pdf', testConfig.pdfFile);
    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ 找唔到 PDF 文件: ${pdfPath}`);
      return;
    }
    
    const fileContent = fs.readFileSync(pdfPath);
    console.log(`📄 文件大小: ${(fileContent.length / 1024).toFixed(1)} KB`);
    
    // 創建 FormData
    const formData = new FormData();
    formData.append('file', fileContent, testConfig.pdfFile);
    formData.append('uploadedBy', testConfig.uploadedBy);
    formData.append('saveToStorage', 'false');
    
    // 構建 cookie 字符串
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    console.log('📤 發送到 API...\n');
    
    // 發送請求
    const response = await axios.post(testConfig.apiUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'Cookie': cookieString
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000
    });
    
    const data = response.data;
    
    if (data.success) {
      console.log('✅ 分析成功！\n');
      console.log(`📊 統計信息:`);
      console.log(`- 提取記錄數: ${data.recordCount}`);
      console.log(`- Token 使用: ${data.totalTokensUsed || 'N/A'}`);
      console.log(`- 文本縮減: ${data.textProcessing?.reductionPercentage || 'N/A'}%`);
      console.log(`- 是否緩存: ${data.cached ? '是' : '否'}`);
      
      if (data.extractedData && data.extractedData.length > 0) {
        console.log(`\n📋 提取嘅數據:\n`);
        data.extractedData.forEach((order, index) => {
          console.log(`記錄 ${index + 1}:`);
          console.log(`  訂單號: ${order.order_ref}`);
          console.log(`  帳號: ${order.account_num}`);
          console.log(`  產品代碼: ${order.product_code}`);
          console.log(`  產品描述: ${order.product_desc}`);
          console.log(`  數量: ${order.product_qty}`);
          console.log(`  送貨地址: ${order.delivery_add}`);
          console.log('');
        });
      }
      
      // 顯示處理後嘅文本（如果有）
      if (data.extractedText) {
        console.log(`\n📝 發送給 OpenAI 嘅文本:\n`);
        console.log('=' .repeat(80));
        console.log(data.extractedText);
        console.log('=' .repeat(80));
      }
      
    } else {
      console.log(`❌ 分析失敗: ${data.message || data.error}`);
      console.log('詳細響應:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error(`\n❌ 錯誤: ${error.message}`);
    if (error.response?.data) {
      console.error('詳細錯誤:', error.response.data);
    }
  }
}

// 主函數
async function main() {
  console.log('🚀 Order PDF API 認證測試\n');
  
  // 檢查服務器
  try {
    await axios.get(testConfig.baseUrl);
  } catch (error) {
    console.error('❌ 開發服務器未運行！請先運行 npm run dev');
    process.exit(1);
  }
  
  try {
    // 獲取認證 cookies
    const cookies = await getAuthCookies();
    
    // 使用認證 cookies 測試 API
    await testWithAuth(cookies);
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    process.exit(1);
  }
}

// 運行
main().catch(console.error);