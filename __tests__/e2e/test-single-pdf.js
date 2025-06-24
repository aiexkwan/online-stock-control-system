#!/usr/bin/env node

// 簡單測試腳本，測試單個 PDF 文件

const fs = require('fs');
const path = require('path');

// 測試配置
const testConfig = {
  pdfFile: '280813-Picking List.pdf', // 可以改為其他 PDF
  uploadedBy: '1'
};

async function testPDF() {
  console.log(`\n🧪 測試 PDF: ${testConfig.pdfFile}\n`);
  
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
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', fileContent, testConfig.pdfFile);
    formData.append('uploadedBy', testConfig.uploadedBy);
    formData.append('saveToStorage', 'false'); // 測試時不保存到 storage
    
    console.log('📤 發送到 API...\n');
    
    // 發送請求
    const axios = require('axios');
    const response = await axios.post('http://localhost:3000/api/analyze-order-pdf-new', formData, {
      headers: {
        ...formData.getHeaders()
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

// 檢查是否有開發服務器運行
async function checkServer() {
  try {
    const axios = require('axios');
    await axios.get('http://localhost:3000');
    return true;
  } catch (error) {
    return false;
  }
}

// 主函數
async function main() {
  console.log('🚀 Order PDF 單一測試\n');
  
  // 檢查服務器
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ 開發服務器未運行！請先運行 npm run dev');
    process.exit(1);
  }
  
  await testPDF();
}

// 運行
main().catch(console.error);