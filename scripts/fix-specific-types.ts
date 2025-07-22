#!/usr/bin/env ts-node
/**
 * 智能類型替換工具
 *
 * 根據上下文將 Record<string, unknown> 替換為特定類型
 */

import { promises as fs } from 'fs';
import { DatabaseRecord } from '@/types/database/tables';

interface TypeReplacement {
  file: string;
  pattern: RegExp;
  replacement: string;
  imports: string[];
}

class SpecificTypeFixer {
  private replacements: TypeReplacement[] = [];

  constructor() {
    this.setupReplacements();
  }

  private setupReplacements() {
    // Dashboard Actions 文件
    this.replacements.push({
      file: 'app/actions/dashboardActions.ts',
      pattern: /\.map\(\(item: Record<string, unknown>\) => \{[\s\S]*?stock_level/g,
      replacement: '.map((item: DatabaseRecord) => {\n      const stockItem = convertToStockDistributionItem(item);',
      imports: [
        "import { DatabaseRecord, StockDistributionItem, convertToStockDistributionItem } from '@/lib/types/database-types';"
      ]
    });

    // Report Actions 文件
    this.replacements.push({
      file: 'app/actions/reportActions.ts',
      pattern: /\.map\(\(item: Record<string, unknown>\) => \{[\s\S]*?product_code/g,
      replacement: '.map((item: DatabaseRecord) => {\n      const reportItem = convertToReportItem(item);',
      imports: [
        "import { DatabaseRecord, ReportItem, convertToReportItem } from '@/lib/types/database-types';"
      ]
    });

    // Order Upload Actions 文件
    this.replacements.push({
      file: 'app/actions/orderUploadActions.ts',
      pattern: /\.map\(\(product: Record<string, unknown>\) => \{[\s\S]*?product_code/g,
      replacement: '.map((product: DatabaseRecord) => {\n      const orderItem = convertToOrderItem(product);',
      imports: [
        "import { DatabaseRecord, OrderItem, convertToOrderItem } from '@/lib/types/database-types';"
      ]
    });

    // Void Report Service 文件
    this.replacements.push({
      file: 'app/void-pallet/services/voidReportService.ts',
      pattern: /\.map\(\(voidRecord: Record<string, unknown>\) => \{[\s\S]*?uuid/g,
      replacement: '.map((voidRecord: DatabaseRecord) => {\n      const voidItem = convertToVoidItem(voidRecord);',
      imports: [
        "import { DatabaseRecord, VoidItem, convertToVoidItem } from '@/lib/types/database-types';"
      ]
    });

    // Search History 文件
    this.replacements.push({
      file: 'app/void-pallet/utils/searchHistory.ts',
      pattern: /\.map\(\(item: Record<string, unknown>\) => \{[\s\S]*?timestamp/g,
      replacement: '.map((item: DatabaseRecord) => {\n      const historyItem = convertToSearchHistoryItem(item);',
      imports: [
        "import { DatabaseRecord, SearchHistoryItem, convertToSearchHistoryItem } from '@/lib/types/database-types';"
      ]
    });
  }

  async fixAllFiles() {
    const files = [...new Set(this.replacements.map(r => r.file))];

    console.log(`🔧 開始修復 ${files.length} 個文件的特定類型`);

    for (const file of files) {
      await this.fixFile(file);
    }

    console.log('✅ 所有特定類型已修復');
  }

  private async fixFile(filePath: string) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let updatedContent = content;

      // 獲取該文件的所有替換規則
      const fileReplacements = this.replacements.filter(r => r.file === filePath);

      // 添加必要的導入
      const allImports = [...new Set(fileReplacements.flatMap(r => r.imports))];

      for (const importStatement of allImports) {
        if (!updatedContent.includes(importStatement)) {
          // 找到第一個 import 語句後添加
          const importRegex = /^import.*?;$/m;
          const match = updatedContent.match(importRegex);
          if (match) {
            updatedContent = updatedContent.replace(
              match[0],
              `${match[0]}\n${importStatement}`
            );
          }
        }
      }

      // 手動修復特定文件的特定問題
      if (filePath === 'app/actions/dashboardActions.ts') {
        updatedContent = this.fixDashboardActions(updatedContent);
      } else if (filePath === 'app/actions/reportActions.ts') {
        updatedContent = this.fixReportActions(updatedContent);
      } else if (filePath === 'app/actions/orderUploadActions.ts') {
        updatedContent = this.fixOrderUploadActions(updatedContent);
      } else if (filePath === 'app/void-pallet/services/voidReportService.ts') {
        updatedContent = this.fixVoidReportService(updatedContent);
      } else if (filePath === 'app/void-pallet/utils/searchHistory.ts') {
        updatedContent = this.fixSearchHistory(updatedContent);
      }

      // 只有內容改變時才寫回
      if (updatedContent !== content) {
        await fs.writeFile(filePath, updatedContent);
        console.log(`✅ 修復文件: ${filePath}`);
      } else {
        console.log(`⏭️ 跳過文件: ${filePath} (無需修復)`);
      }

    } catch (error) {
      console.error(`❌ 修復文件失敗 ${filePath}:`, error);
    }
  }

  private fixDashboardActions(content: string): string {
    // 替換 Record<string, unknown> 為 DatabaseRecord
    content = content.replace(
      /const items = data\.map\(\(item: Record<string, unknown>\) => \{/g,
      'const items = data.map((item: DatabaseRecord) => {\n      const stockItem = convertToStockDistributionItem(item);'
    );

    // 修復屬性訪問
    content = content.replace(
      /\(item\.injection \|\| 0\)/g,
      '(stockItem.injection || 0)'
    );

    content = content.replace(
      /\(item\.pipeline \|\| 0\)/g,
      '(stockItem.pipeline || 0)'
    );

    content = content.replace(
      /\(item\.prebook \|\| 0\)/g,
      '(stockItem.prebook || 0)'
    );

    content = content.replace(
      /\(item\.await \|\| 0\)/g,
      '(stockItem.await || 0)'
    );

    content = content.replace(
      /\(item\.fold \|\| 0\)/g,
      '(stockItem.fold || 0)'
    );

    content = content.replace(
      /\(item\.bulk \|\| 0\)/g,
      '(stockItem.bulk || 0)'
    );

    // 修復返回語句
    content = content.replace(
      /return \{\s*stock: item\.stock,\s*stock_level: stockTotal,\s*description: item\.description \|\| '-',\s*type: item\.type \|\| '-',\s*\}/g,
      'return {\n        stock: stockItem.stock,\n        stock_level: stockTotal,\n        description: stockItem.description || \'-\',\n        type: stockItem.type || \'-\',\n      }'
    );

    // 修復其他 Record<string, unknown>
    content = content.replace(
      /\.filter\(\(item: Record<string, unknown>\) => item\.stock_level > 0\)/g,
      '.filter((item: StockDistributionItem) => item.stock_level > 0)'
    );

    content = content.replace(
      /\.sort\(\(a: any, b: any\) => b\.stock_level - a\.stock_level\)/g,
      '.sort((a: StockDistributionItem, b: StockDistributionItem) => b.stock_level - a.stock_level)'
    );

    content = content.replace(
      /\.map\(\(item: DatabaseRecord, index: number\) => \(/g,
      '.map((item: StockDistributionItem, index: number) => ('
    );

    content = content.replace(
      /\.map\(\(item: Record<string, unknown>\) => \(/g,
      '.map((item: DatabaseRecord) => {\n      const stockItem = convertToStockDistributionItem(item);\n      return ('
    );

    return content;
  }

  private fixReportActions(content: string): string {
    // 簡化修復，只替換基本類型
    content = content.replace(
      /Record<string, unknown>/g,
      'DatabaseRecord'
    );

    return content;
  }

  private fixOrderUploadActions(content: string): string {
    content = content.replace(
      /Record<string, unknown>/g,
      'DatabaseRecord'
    );

    return content;
  }

  private fixVoidReportService(content: string): string {
    content = content.replace(
      /Record<string, unknown>/g,
      'DatabaseRecord'
    );

    return content;
  }

  private fixSearchHistory(content: string): string {
    content = content.replace(
      /Record<string, unknown>/g,
      'DatabaseRecord'
    );

    return content;
  }
}

// 主執行函數
async function main() {
  console.log('🚀 啟動智能類型替換工具');

  const fixer = new SpecificTypeFixer();
  await fixer.fixAllFiles();

  console.log('\n🎉 智能類型替換完成！');
  console.log('請運行 npm run typecheck 驗證修復效果');
}

if (require.main === module) {
  main().catch(console.error);
}
