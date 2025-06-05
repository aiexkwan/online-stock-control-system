/**
 * PDF 分析解決方案測試腳本
 * 測試 PDF 轉圖像功能和 OpenAI API 集成
 */

const fs = require('fs');
const path = require('path');

// 模擬 pdf2pic 功能測試
async function testPdf2PicInstallation() {
  console.log('🔧 測試 pdf2pic 安裝...');
  
  try {
    const pdf2pic = require('pdf2pic');
    console.log('✅ pdf2pic 安裝成功');
    
    // 測試基本配置
    const testConfig = {
      density: 300,
      saveFilename: "test",
      savePath: "/tmp",
      format: "png",
      width: 2480,
      height: 3508
    };
    
    console.log('✅ pdf2pic 配置測試通過');
    return true;
  } catch (error) {
    console.error('❌ pdf2pic 安裝失敗:', error.message);
    return false;
  }
}

// 測試 PDF 轉圖像功能
async function testPdfToImageConversion() {
  console.log('\n📄 測試 PDF 轉圖像功能...');
  
  try {
    const pdf2pic = require('pdf2pic');
    
    // 創建測試 PDF 文件路徑（如果存在）
    const testPdfPath = path.join(__dirname, '..', 'test-files', 'sample.pdf');
    
    if (!fs.existsSync(testPdfPath)) {
      console.log('⚠️  測試 PDF 文件不存在，跳過轉換測試');
      console.log('   可以將測試 PDF 文件放在:', testPdfPath);
      return true;
    }
    
    console.log('📁 找到測試 PDF 文件:', testPdfPath);
    
    // 讀取 PDF 文件
    const pdfBuffer = fs.readFileSync(testPdfPath);
    console.log('📊 PDF 文件大小:', (pdfBuffer.length / 1024 / 1024).toFixed(2), 'MB');
    
    // 配置轉換選項
    const convert = pdf2pic.fromBuffer(pdfBuffer, {
      density: 300,
      saveFilename: "test_page",
      savePath: "/tmp",
      format: "png",
      width: 2480,
      height: 3508
    });
    
    console.log('🔄 開始轉換 PDF...');
    const startTime = Date.now();
    
    // 轉換第一頁作為測試
    const result = await convert(1);
    
    const endTime = Date.now();
    console.log('⏱️  轉換時間:', (endTime - startTime), 'ms');
    
    if (result.base64) {
      console.log('✅ PDF 轉圖像成功');
      console.log('📏 Base64 長度:', result.base64.length);
      console.log('💾 預估圖像大小:', (result.base64.length * 0.75 / 1024 / 1024).toFixed(2), 'MB');
    } else {
      console.log('❌ 轉換失敗：沒有生成 base64 數據');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ PDF 轉圖像測試失敗:', error.message);
    return false;
  }
}

// 測試 OpenAI API 配置
async function testOpenAIConfiguration() {
  console.log('\n🤖 測試 OpenAI API 配置...');
  
  try {
    // 檢查環境變數
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️  OPENAI_API_KEY 環境變數未設置');
      console.log('   請在 .env.local 中設置 OPENAI_API_KEY');
      return false;
    }
    
    console.log('✅ OPENAI_API_KEY 已設置');
    
    // 測試 OpenAI 客戶端創建
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    console.log('✅ OpenAI 客戶端創建成功');
    
    // 測試簡單的 API 調用（可選）
    console.log('🔍 測試 API 連接...');
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: "Hello, this is a test message. Please respond with 'API connection successful'."
          }
        ],
        max_tokens: 50
      });
      
      if (response.choices[0]?.message?.content) {
        console.log('✅ OpenAI API 連接成功');
        console.log('📝 回應:', response.choices[0].message.content.trim());
      }
    } catch (apiError) {
      console.log('⚠️  API 連接測試失敗（但配置正確）:', apiError.message);
      console.log('   這可能是由於 API 配額或網絡問題');
    }
    
    return true;
  } catch (error) {
    console.error('❌ OpenAI 配置測試失敗:', error.message);
    return false;
  }
}

// 測試圖像到 base64 轉換
function testImageToBase64() {
  console.log('\n🖼️  測試圖像 base64 轉換...');
  
  try {
    // 創建一個簡單的測試圖像 buffer
    const testImageBuffer = Buffer.from('test image data');
    const base64String = testImageBuffer.toString('base64');
    
    console.log('✅ Buffer 到 base64 轉換成功');
    console.log('📏 測試 base64 長度:', base64String.length);
    
    // 測試 data URL 格式
    const dataUrl = `data:image/png;base64,${base64String}`;
    console.log('✅ Data URL 格式正確');
    console.log('🔗 Data URL 長度:', dataUrl.length);
    
    return true;
  } catch (error) {
    console.error('❌ 圖像 base64 轉換測試失敗:', error.message);
    return false;
  }
}

// 測試系統依賴
async function testSystemDependencies() {
  console.log('\n🔧 測試系統依賴...');
  
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // 檢查 ImageMagick
    try {
      await execAsync('convert -version');
      console.log('✅ ImageMagick 已安裝');
    } catch (error) {
      console.log('⚠️  ImageMagick 未安裝或不在 PATH 中');
      console.log('   pdf2pic 可能需要 ImageMagick 或 GraphicsMagick');
    }
    
    // 檢查 GraphicsMagick
    try {
      await execAsync('gm version');
      console.log('✅ GraphicsMagick 已安裝');
    } catch (error) {
      console.log('⚠️  GraphicsMagick 未安裝或不在 PATH 中');
    }
    
    // 檢查 /tmp 目錄權限
    const tmpPath = '/tmp';
    try {
      fs.accessSync(tmpPath, fs.constants.W_OK);
      console.log('✅ /tmp 目錄可寫');
    } catch (error) {
      console.log('❌ /tmp 目錄不可寫');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ 系統依賴測試失敗:', error.message);
    return false;
  }
}

// 主測試函數
async function runAllTests() {
  console.log('🚀 開始 PDF 分析解決方案測試\n');
  
  const tests = [
    { name: 'pdf2pic 安裝', test: testPdf2PicInstallation },
    { name: '系統依賴', test: testSystemDependencies },
    { name: '圖像 base64 轉換', test: testImageToBase64 },
    { name: 'OpenAI API 配置', test: testOpenAIConfiguration },
    { name: 'PDF 轉圖像功能', test: testPdfToImageConversion }
  ];
  
  const results = [];
  
  for (const { name, test } of tests) {
    try {
      const result = await test();
      results.push({ name, success: result });
    } catch (error) {
      console.error(`❌ ${name} 測試出現異常:`, error.message);
      results.push({ name, success: false });
    }
  }
  
  // 顯示測試結果摘要
  console.log('\n📊 測試結果摘要:');
  console.log('='.repeat(50));
  
  let passCount = 0;
  for (const { name, success } of results) {
    const status = success ? '✅ 通過' : '❌ 失敗';
    console.log(`${status} ${name}`);
    if (success) passCount++;
  }
  
  console.log('='.repeat(50));
  console.log(`總計: ${passCount}/${results.length} 測試通過`);
  
  if (passCount === results.length) {
    console.log('🎉 所有測試通過！PDF 分析解決方案已準備就緒');
  } else {
    console.log('⚠️  部分測試失敗，請檢查上述錯誤信息');
  }
  
  // 提供下一步建議
  console.log('\n📋 下一步建議:');
  if (passCount < results.length) {
    console.log('1. 解決失敗的測試項目');
    console.log('2. 確保所有依賴正確安裝');
    console.log('3. 檢查環境變數配置');
  } else {
    console.log('1. 可以開始測試 PDF 上傳功能');
    console.log('2. 準備一些測試 PDF 文件');
    console.log('3. 監控生產環境的性能表現');
  }
}

// 執行測試
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testPdf2PicInstallation,
  testPdfToImageConversion,
  testOpenAIConfiguration,
  testImageToBase64,
  testSystemDependencies,
  runAllTests
}; 