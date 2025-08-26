#!/usr/bin/env tsx
/**
 * 測試PDF上載功能
 * 測試現有系統對產品代碼的識別準確性
 */

import { analyzeOrderPDF } from '../app/actions/orderUploadActions';
import * as fs from 'fs/promises';
import * as path from 'path';

async function testPDFUpload(pdfPath: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`測試PDF: ${path.basename(pdfPath)}`);
  console.log('='.repeat(60));

  try {
    // 讀取PDF文件
    const fileBuffer = await fs.readFile(pdfPath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    console.log(`文件大小: ${(fileBuffer.length / 1024).toFixed(2)} KB`);

    // 分析PDF
    console.log('\n開始分析PDF...');
    const startTime = Date.now();

    const result = await analyzeOrderPDF(
      {
        buffer: arrayBuffer,
        name: path.basename(pdfPath),
      },
      '999', // 測試用戶ID
      false // 不保存到storage
    );

    const processingTime = Date.now() - startTime;
    console.log(`處理時間: ${processingTime}ms`);

    if (result.success && result.data) {
      console.log('\n✅ 分析成功！');
      console.log(`訂單號: ${result.data.order_ref}`);
      console.log(`客戶號: ${result.data.account_num}`);
      console.log(`產品數量: ${result.data.products.length}`);

      console.log('\n產品列表:');
      console.log('-'.repeat(80));
      console.log('產品代碼\t\t描述\t\t\t\t數量');
      console.log('-'.repeat(80));

      result.data.products.forEach((product, index) => {
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

      // 統計資訊
      if (result.extractedCount) {
        console.log(`\n提取統計:`);
        console.log(`- 總提取數: ${result.extractedCount}`);
        console.log(`- 記錄數: ${result.recordCount}`);
      }

      // 檢查是否有MHEASYB相關錯誤
      const mheasyProducts = result.data.products.filter(p => p.product_code.startsWith('MHEASY'));

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
    } else {
      console.log('\n❌ 分析失敗！');
      console.log(`錯誤: ${result.error}`);
    }
  } catch (error) {
    console.error('\n❌ 測試失敗:', error);
    if (error instanceof Error) {
      console.error('錯誤詳情:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('PDF上載測試 - 產品代碼識別準確性測試');
  console.log('='.repeat(60));

  const testFiles = [
    '/Users/chun/Library/Mobile Documents/com~apple~CloudDocs/280481 Picking List.pdf',
    '/Users/chun/Downloads/281513-Picking List.pdf',
  ];

  for (const file of testFiles) {
    // 檢查文件是否存在
    try {
      await fs.access(file);
      await testPDFUpload(file);
    } catch (error) {
      console.error(`\n❌ 文件不存在: ${file}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('測試完成');
  console.log('='.repeat(60));
}

// 執行測試
main().catch(console.error);
