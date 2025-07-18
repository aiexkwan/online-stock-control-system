#!/usr/bin/env node
/**
 * 批量修復關鍵 any 類型錯誤
 * 
 * 多專家協作設計：
 * - 角色1 分析師：錯誤模式分析
 * - 角色2 系統架構專家：類型系統設計
 * - 角色4 DevOps專家：自動化工具開發
 * - 角色6 優化專家：性能優化
 * - 角色7 QA專家：測試驗證
 * - 角色8 代碼品質專家：代碼清潔
 */

import { promises as fs } from 'fs';
import { DatabaseRecord } from '@/lib/types/database';
import { ApiResponse, ApiRequest, QueryParams } from '@/lib/validation/zod-schemas';
import { getErrorMessage } from '@/lib/types/error-handling';
import { glob } from 'glob';
import { getErrorMessage } from '../lib/types/error-handling';

interface FixPattern {
  pattern: RegExp;
  replacement: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

class CriticalAnyTypeFixer {
  private fixPatterns: FixPattern[] = [];
  private fixedCount = 0;

  constructor() {
    this.setupFixPatterns();
  }

  private setupFixPatterns() {
    // 高優先級修復模式
    this.fixPatterns.push(
      // 1. 基本數據映射 any 類型
      {
        pattern: /\.map\(\(item: DatabaseRecord\) => /g,
        replacement: '.map((item: Record<string, unknown>) => ',
        description: '數據映射 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(product: any\) => /g,
        replacement: '.map((product: Record<string, unknown>) => ',
        description: '產品映射 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(order: any\) => /g,
        replacement: '.map((order: Record<string, unknown>) => ',
        description: '訂單映射 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(record: DatabaseRecord\) => /g,
        replacement: '.map((record: Record<string, unknown>) => ',
        description: '記錄映射 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(entry: any\) => /g,
        replacement: '.map((entry: Record<string, unknown>) => ',
        description: '條目映射 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(row: DatabaseRecord\) => /g,
        replacement: '.map((row: Record<string, unknown>) => ',
        description: '行映射 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(line: any\) => /g,
        replacement: '.map((line: Record<string, unknown>) => ',
        description: '行映射 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(l: any\) => /g,
        replacement: '.map((l: Record<string, unknown>) => ',
        description: '行映射 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(col: any\) => /g,
        replacement: '.map((col: Record<string, unknown>) => ',
        description: '列映射 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(stat: any\) => /g,
        replacement: '.map((stat: Record<string, unknown>) => ',
        description: '統計映射 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(result: DatabaseRecord\) => /g,
        replacement: '.map((result: Record<string, unknown>) => ',
        description: '結果映射 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(r: any\) => /g,
        replacement: '.map((r: Record<string, unknown>) => ',
        description: '結果映射 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(i: any\) => /g,
        replacement: '.map((i: Record<string, unknown>) => ',
        description: '項目映射 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(p: any\) => /g,
        replacement: '.map((p: Record<string, unknown>) => ',
        description: '產品映射 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(n: any\) => /g,
        replacement: '.map((n: Record<string, unknown>) => ',
        description: '通知映射 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(s: any\) => /g,
        replacement: '.map((s: Record<string, unknown>) => ',
        description: '服務映射 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(t: any\) => /g,
        replacement: '.map((t: Record<string, unknown>) => ',
        description: '交易映射 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(d: any\) => /g,
        replacement: '.map((d: Record<string, unknown>) => ',
        description: '數據映射 any 類型修復',
        priority: 'high'
      },

      // 2. 過濾器函數 any 類型
      {
        pattern: /\.filter\(\(item: DatabaseRecord\) => /g,
        replacement: '.filter((item: Record<string, unknown>) => ',
        description: '過濾器 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.filter\(\(col: any\) => /g,
        replacement: '.filter((col: Record<string, unknown>) => ',
        description: '列過濾器 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.filter\(\(order: any\) => /g,
        replacement: '.filter((order: Record<string, unknown>) => ',
        description: '訂單過濾器 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.filter\(\(r: any\) => /g,
        replacement: '.filter((r: Record<string, unknown>) => ',
        description: '結果過濾器 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.filter\(\(s: any\) => /g,
        replacement: '.filter((s: Record<string, unknown>) => ',
        description: '服務過濾器 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.filter\(\(d: any\) => /g,
        replacement: '.filter((d: Record<string, unknown>) => ',
        description: '數據過濾器 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.filter\(\(p: any\) => /g,
        replacement: '.filter((p: Record<string, unknown>) => ',
        description: '產品過濾器 any 類型修復',
        priority: 'high'
      },

      // 3. 累加器函數 any 類型
      {
        pattern: /\.reduce\(\(acc: any, item: DatabaseRecord\) => /g,
        replacement: '.reduce((acc: Record<string, unknown>, item: Record<string, unknown>) => ',
        description: '累加器 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.reduce\(\(total, entry: any\) => /g,
        replacement: '.reduce((total, entry: Record<string, unknown>) => ',
        description: '累加器 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.reduce\(\(sum: number, item: DatabaseRecord\) => /g,
        replacement: '.reduce((sum: number, item: Record<string, unknown>) => ',
        description: '累加器 any 類型修復',
        priority: 'high'
      },
      {
        pattern: /\.reduce\(\(sum: number, record: DatabaseRecord\) => /g,
        replacement: '.reduce((sum: number, record: Record<string, unknown>) => ',
        description: '累加器 any 類型修復',
        priority: 'high'
      },

      // 4. 函數參數 any 類型
      {
        pattern: /\(result: DatabaseRecord\) => /g,
        replacement: '(result: Record<string, unknown>) => ',
        description: '函數參數 any 類型修復',
        priority: 'medium'
      },
      {
        pattern: /\(response: ApiResponse\) => /g,
        replacement: '(response: Record<string, unknown>) => ',
        description: '響應參數 any 類型修復',
        priority: 'medium'
      },
      {
        pattern: /\(data: DatabaseRecord[]\) => /g,
        replacement: '(data: Record<string, unknown>) => ',
        description: '數據參數 any 類型修復',
        priority: 'medium'
      },

      // 5. 屬性存取 any 類型
      {
        pattern: /: any\[\]/g,
        replacement: ': Record<string, unknown>[]',
        description: '數組屬性 any 類型修復',
        priority: 'medium'
      },
      {
        pattern: /data\?: any\[\]/g,
        replacement: 'data?: Record<string, unknown>[]',
        description: '數據屬性 any 類型修復',
        priority: 'medium'
      },

      // 6. 變量宣告 any 類型
      {
        pattern: /const emailData: Record<string, unknown> = /g,
        replacement: 'const emailData: Record<string, unknown> = ',
        description: '變量宣告 any 類型修復',
        priority: 'medium'
      },
      {
        pattern: /let result: Record<string, unknown>;/g,
        replacement: 'let result: Record<string, unknown>;',
        description: '變量宣告 any 類型修復',
        priority: 'medium'
      },
      {
        pattern: /const result: Record<string, unknown> = /g,
        replacement: 'const result: Record<string, unknown> = ',
        description: '變量宣告 any 類型修復',
        priority: 'medium'
      },

      // 7. 測試文件特定模式
      {
        pattern: /mockRPCCall = \(supabase: any, result: DatabaseRecord, error: DatabaseRecord = null\) => /g,
        replacement: 'mockRPCCall = (supabase: Record<string, unknown>, result: Record<string, unknown>, error: unknown = null) => ',
        description: '測試函數 any 類型修復',
        priority: 'low'
      },
      {
        pattern: /measureResponseTime\(response: ApiResponse\): Promise<number>/g,
        replacement: 'measureResponseTime(response: Record<string, unknown>): Promise<number>',
        description: '測試方法 any 類型修復',
        priority: 'low'
      }
    );
  }

  async fixAllFiles() {
    console.log('🚀 開始批量修復關鍵 any 類型錯誤');
    console.log(`📋 共有 ${this.fixPatterns.length} 個修復模式`);

    // 獲取所有需要修復的文件
    const files = await glob('**/*.{ts,tsx}', {
      ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**'],
      cwd: process.cwd()
    });

    console.log(`📁 找到 ${files.length} 個文件需要檢查`);

    // 按優先級分組修復
    const highPriorityPatterns = this.fixPatterns.filter(p => p.priority === 'high');
    const mediumPriorityPatterns = this.fixPatterns.filter(p => p.priority === 'medium');
    const lowPriorityPatterns = this.fixPatterns.filter(p => p.priority === 'low');

    console.log('\n🔥 開始高優先級修復...');
    await this.fixFilesByPatterns(files, highPriorityPatterns);

    console.log('\n⚡ 開始中優先級修復...');
    await this.fixFilesByPatterns(files, mediumPriorityPatterns);

    console.log('\n🔧 開始低優先級修復...');
    await this.fixFilesByPatterns(files, lowPriorityPatterns);

    console.log(`\n✅ 修復完成！共修復 ${this.fixedCount} 個 any 類型錯誤`);
  }

  private async fixFilesByPatterns(files: string[], patterns: FixPattern[]) {
    for (const file of files) {
      await this.fixFile(file, patterns);
    }
  }

  private async fixFile(filePath: string, patterns: FixPattern[]) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let updatedContent = content;
      let fileFixCount = 0;

      for (const pattern of patterns) {
        const matches = content.match(pattern.pattern);
        if (matches) {
          updatedContent = updatedContent.replace(pattern.pattern, pattern.replacement);
          fileFixCount += matches.length;
          this.fixedCount += matches.length;
        }
      }

      // 添加 getErrorMessage 導入（如果需要）
      if (updatedContent.includes('getErrorMessage') && !updatedContent.includes("import { getErrorMessage }")) {
        const importLine = "import { getErrorMessage } from '@/lib/types/error-handling';";
        const firstImportMatch = updatedContent.match(/^import.*?;$/m);
        if (firstImportMatch) {
          updatedContent = updatedContent.replace(firstImportMatch[0], `${firstImportMatch[0]}\n${importLine}`);
        }
      }

      // 只有內容改變時才寫回文件
      if (updatedContent !== content) {
        await fs.writeFile(filePath, updatedContent);
        console.log(`✅ 修復文件: ${filePath} (${fileFixCount} 個修復)`);
      }
    } catch (error) {
      console.error(`❌ 修復文件失敗 ${filePath}:`, getErrorMessage(error));
    }
  }
}

// 主執行函數
async function main() {
  try {
    console.log('🎯 關鍵 any 類型修復工具 - 多專家協作版本');
    console.log('👥 專家團隊：分析師、架構專家、DevOps、優化專家、QA、代碼品質');
    
    const fixer = new CriticalAnyTypeFixer();
    await fixer.fixAllFiles();
    
    console.log('\n🎉 批量修復完成！');
    console.log('📊 建議運行 npm run typecheck 檢查修復效果');
    console.log('🔍 建議運行 npm run lint 檢查代碼品質');
  } catch (error) {
    console.error('💥 修復過程中出現錯誤:', getErrorMessage(error));
    process.exit(1);
  }
}

// 執行主函數
main();