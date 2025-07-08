/**
 * 測試 Excel Generator 遷移
 * 運行方法: npx ts-node scripts/test-excel-generator.ts
 */

import { ExcelGenerator } from '../../app/components/reports/generators/ExcelGenerator';
import { testData, testConfig } from '../../app/components/reports/generators/ExcelGenerator.test';
import * as fs from 'fs';
import * as path from 'path';

async function testExcelGeneration() {
  console.log('開始測試 Excel Generator...\n');
  
  // 測試兩種實現
  const tests = [
    { name: 'Legacy (xlsx)', env: 'false' },
    { name: 'New (ExcelJS)', env: 'true' }
  ];
  
  for (const test of tests) {
    console.log(`\n測試 ${test.name} 實現...`);
    console.log('='.repeat(50));
    
    // 設置環境變數
    process.env.USE_EXCELJS = test.env;
    
    try {
      const startTime = Date.now();
      const generator = new ExcelGenerator();
      const blob = await generator.generate(testData, testConfig);
      const endTime = Date.now();
      
      console.log(`✅ 生成成功！`);
      console.log(`   文件大小: ${blob.size} bytes`);
      console.log(`   生成時間: ${endTime - startTime}ms`);
      
      // 保存文件以供比較
      const buffer = await blob.arrayBuffer();
      const outputDir = path.join(__dirname, 'test-output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const filename = `test-report-${test.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.xlsx`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, Buffer.from(buffer));
      console.log(`   文件保存到: ${filepath}`);
      
    } catch (error) {
      console.error(`❌ 測試失敗: ${error}`);
    }
  }
  
  console.log('\n\n測試完成！');
  console.log('請檢查 scripts/test-output 目錄中嘅文件以確保格式一致。');
}

// 運行測試
testExcelGeneration().catch(console.error);