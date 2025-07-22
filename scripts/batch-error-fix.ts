#!/usr/bin/env ts-node
/**
 * 批量錯誤處理類型修復工具
 *
 * 專家協作：代碼品質專家主導的自動化重構
 */

import { promises as fs } from 'fs';
import { DatabaseRecord } from '@/types/database/tables';
import { TypeRefactorTool } from './type-refactor-tool';

interface ErrorFixResult {
  file: string;
  lineNumber: number;
  oldCode: string;
  newCode: string;
  success: boolean;
  error?: string;
}

class BatchErrorFixer {
  private results: ErrorFixResult[] = [];

  async fixErrorHandling() {
    const plan = JSON.parse(
      await fs.readFile('docs/type-refactor-plan.json', 'utf-8')
    );

    const errorHandlingItems = plan.phases[0].items; // Phase 1 items

    console.log(`🔧 開始修復 ${errorHandlingItems.length} 個錯誤處理類型`);

    // 批量處理錯誤修復
    for (const item of errorHandlingItems) {
      await this.fixSingleErrorHandling(item);
    }

    this.generateReport();
    return this.results;
  }

  private async fixSingleErrorHandling(item: DatabaseRecord) {
    try {
      const filePath = item.file as string;
      const lineNumber = item.line as number;
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // 找到目標行
      const targetLine = lines[lineNumber - 1];
      if (!targetLine || !targetLine.includes('error: unknown')) {
        this.results.push({
          file: filePath,
          lineNumber: lineNumber,
          oldCode: targetLine || 'LINE_NOT_FOUND',
          newCode: 'SKIP',
          success: false,
          error: 'Target line not found or already fixed'
        });
        return;
      }

      // 替換 error: unknown 為 error: unknown
      const newLine = targetLine.replace('error: unknown', 'error: unknown');
      lines[lineNumber - 1] = newLine;

      // 寫回文件
      await fs.writeFile(filePath, lines.join('\n'));

      this.results.push({
        file: filePath,
        lineNumber: lineNumber,
        oldCode: targetLine,
        newCode: newLine,
        success: true
      });

      console.log(`✅ 修復: ${filePath}:${lineNumber}`);

    } catch (error) {
      this.results.push({
        file: item.file as string,
        lineNumber: item.line as number,
        oldCode: 'ERROR',
        newCode: 'ERROR',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      console.error(`❌ 失敗: ${item.file}:${item.line} - ${error}`);
    }
  }

  private generateReport() {
    const successCount = this.results.filter(r => r.success).length;
    const failCount = this.results.filter(r => !r.success).length;

    console.log('\n📊 批量修復報告');
    console.log('================');
    console.log(`✅ 成功: ${successCount} 個`);
    console.log(`❌ 失敗: ${failCount} 個`);
    console.log(`📈 成功率: ${((successCount / this.results.length) * 100).toFixed(1)}%`);

    if (failCount > 0) {
      console.log('\n失敗項目:');
      this.results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.file}:${r.lineNumber} (${r.error})`);
      });
    }
  }
}

// 主執行
async function main() {
  console.log('🚀 啟動批量錯誤處理類型修復');

  const fixer = new BatchErrorFixer();
  const results = await fixer.fixErrorHandling();

  console.log('\n🎉 Phase 1 完成！');
  console.log('接下來請運行 TypeScript 檢查驗證修復效果');
}

if (require.main === module) {
  main().catch(console.error);
}

export { BatchErrorFixer };
