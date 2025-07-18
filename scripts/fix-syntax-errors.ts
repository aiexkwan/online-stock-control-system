#!/usr/bin/env tsx
/**
 * 修復語法錯誤腳本
 * 處理批量修復後的語法問題
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import path from 'path';

// 修復函數
function fixSyntaxErrors(content: string): string {
  let fixed = content;
  
  // 修復 TODO 註釋造成的語法錯誤
  fixed = fixed.replace(/\/\/ TODO: Replace GraphQL -\s*\/\/ TODO: Replace GraphQL -\s*/g, '// TODO: Replace GraphQL - ');
  fixed = fixed.replace(/\/\/ TODO: Replace GraphQL -\s*([^\/\n])/g, '// TODO: Replace GraphQL\n    // $1');
  
  // 修復無效的註釋語法
  fixed = fixed.replace(/\/\/ TODO: Replace GraphQL -\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/g, '// TODO: Replace GraphQL\n    // $1');
  
  // 修復多餘的 TODO 註釋
  fixed = fixed.replace(/\/\/ TODO: Replace GraphQL -\s*$/gm, '// TODO: Replace GraphQL');
  
  return fixed;
}

// 主函數
async function main() {
  console.log('🔧 修復語法錯誤...\n');

  const files = [
    'app/admin/components/dashboard/charts/RealTimeInventoryMap.tsx',
    'app/admin/components/dashboard/charts/StocktakeAccuracyTrend.tsx',
    'app/admin/components/dashboard/charts/TopProductsInventoryChart.tsx',
    'app/admin/components/dashboard/widgets/OrderStateListWidgetV2.tsx',
  ];

  let fixedCount = 0;

  for (const file of files) {
    const filePath = path.resolve(file);
    if (!existsSync(filePath)) {
      console.log(`❌ 文件不存在: ${file}`);
      continue;
    }

    const content = readFileSync(filePath, 'utf-8');
    const fixed = fixSyntaxErrors(content);
    
    if (fixed !== content) {
      writeFileSync(filePath, fixed);
      console.log(`✅ 修復: ${file}`);
      fixedCount++;
    } else {
      console.log(`⚪ 無需修復: ${file}`);
    }
  }

  console.log(`\n✨ 完成！共修復 ${fixedCount} 個文件`);
  
  // 運行 TypeScript 檢查
  console.log('\n📊 運行 TypeScript 檢查...');
  const { execSync } = require('child_process');
  try {
    const result = execSync('npx tsc --noEmit 2>&1', { encoding: 'utf8' });
    console.log('✅ TypeScript 檢查通過！');
  } catch (error) {
    const errorOutput = (error as any).stdout || (error as Error).message;
    const errorCount = (errorOutput.match(/error TS\d+:/g) || []).length;
    console.log(`⚠️  剩餘 ${errorCount} 個 TypeScript 錯誤`);
  }
}

// 運行腳本
main().catch(console.error);