#!/usr/bin/env node
/**
 * 直接測試PDF提取API
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testPDFExtraction(pdfPath) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`測試PDF: ${path.basename(pdfPath)}`);
  console.log('='.repeat(60));
  
  try {
    // 讀取PDF文件
    const fileBuffer = fs.readFileSync(pdfPath);
    console.log(`文件大小: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
    
    // 創建FormData
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: path.basename(pdfPath),
      contentType: 'application/pdf'
    });
    formData.append('fileName', path.basename(pdfPath));
    
    console.log('\n開始調用PDF提取API...');
    const startTime = Date.now();
    
    // 調用API (假設開發服務器在3000端口)
    const response = await fetch('http://localhost:3000/api/pdf-extract', {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders(),
        'x-internal-request': 'true'
      }
    });
    
    const processingTime = Date.now() - startTime;
    console.log(`處理時間: ${processingTime}ms`);
    console.log(`狀態碼: ${response.status}`);
    
    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('\n✅ 提取成功！');
      console.log(`訂單號: ${result.data.order_ref}`);
      console.log(`客戶號: ${result.data.account_num}`);
      console.log(`產品數量: ${result.data.products.length}`);
      
      console.log('\n產品列表:');
      console.log('-'.repeat(80));
      console.log('產品代碼\t\t描述\t\t\t\t數量');
      console.log('-'.repeat(80));
      
      result.data.products.forEach((product) => {
        const code = product.product_code.padEnd(16, ' ');
        const desc = (product.product_desc || '-').substring(0, 40).padEnd(40, ' ');
        const qty = product.product_qty.toString().padStart(6, ' ');
        console.log(`${code}${desc}${qty}`);
        
        // 特別標記MHEASYB相關的產品
        if (product.product_code.includes('MHEASY')) {
          console.log(`  ⚠️  注意: 識別為 "${product.product_code}"`);
        }
      });
      
      console.log('-'.repeat(80));
      
      // 檢查MHEASYB相關錯誤
      const mheasyProducts = result.data.products.filter(p => 
        p.product_code.startsWith('MHEASY')
      );
      
      if (mheasyProducts.length > 0) {
        console.log('\n🔍 MHEASY系列產品檢查:');
        mheasyProducts.forEach(p => {
          if (p.product_code === 'MHEASYB1') {
            console.log(`  ❌ 錯誤: "${p.product_code}" (應該是 "MHEASYB")`);
          } else if (p.product_code === 'MHEASYB') {
            console.log(`  ✅ 正確: "${p.product_code}"`);
          } else {
            console.log(`  ℹ️  其他: "${p.product_code}"`);
          }
        });
      }
      
      // 顯示元數據
      if (result.metadata) {
        console.log('\n提取元數據:');
        console.log(`- 方法: ${result.metadata.extractionMethod || 'unknown'}`);
        console.log(`- Token使用: ${result.metadata.tokensUsed || 'N/A'}`);
        console.log(`- 處理時間: ${result.metadata.processingTime}ms`);
      }
      
    } else {
      console.log('\n❌ 提取失敗！');
      console.log(`錯誤: ${result.error || '未知錯誤'}`);
    }
    
  } catch (error) {
    console.error('\n❌ 測試失敗:', error.message);
    console.error('請確保開發服務器正在運行 (npm run dev)');
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('PDF提取API測試 - 產品代碼識別準確性測試');
  console.log('='.repeat(60));
  
  const testFiles = [
    '/Users/chun/Library/Mobile Documents/com~apple~CloudDocs/280481 Picking List.pdf',
    '/Users/chun/Downloads/281513-Picking List.pdf'
  ];
  
  for (const file of testFiles) {
    // 檢查文件是否存在
    if (fs.existsSync(file)) {
      await testPDFExtraction(file);
    } else {
      console.error(`\n❌ 文件不存在: ${file}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('測試完成');
  console.log('='.repeat(60));
}

// 執行測試
main().catch(console.error);