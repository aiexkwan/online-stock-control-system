#!/usr/bin/env node
/**
 * 自動替換 any 類型為 Supabase 生成類型和 Zod 驗證
 *
 * 多專家協作設計：
 * - 分析師：any 類型使用模式分析
 * - 架構專家：類型系統整合
 * - DevOps 專家：自動化工具開發
 * - QA 專家：替換規則驗證
 */

import { promises as fs } from 'fs';
import { glob } from 'glob';
import { getErrorMessage } from '../lib/types/error-handling';

interface TypeReplacement {
  pattern: RegExp;
  replacement: string;
  description: string;
  category: 'database' | 'validation' | 'api' | 'generic';
  priority: 'high' | 'medium' | 'low';
}

class TypeReplacer {
  private replacements: TypeReplacement[] = [];
  private fixedCount = 0;
  private fileCount = 0;

  constructor() {
    this.setupReplacements();
  }

  private setupReplacements() {
    // 高優先級：數據庫相關類型替換
    this.replacements.push(
      // 數據庫記錄類型
      {
        pattern: /: any\[\]/g,
        replacement: ': DatabaseRecord[]',
        description: '數據庫記錄數組類型',
        category: 'database',
        priority: 'high'
      },
      {
        pattern: /: any\s*=/g,
        replacement: ': DatabaseRecord =',
        description: '數據庫記錄變量類型',
        category: 'database',
        priority: 'high'
      },
      {
        pattern: /data: DatabaseRecord[]/g,
        replacement: 'data: DatabaseRecord[]',
        description: '數據屬性類型',
        category: 'database',
        priority: 'high'
      },
      {
        pattern: /result: DatabaseRecord/g,
        replacement: 'result: DatabaseRecord',
        description: '結果對象類型',
        category: 'database',
        priority: 'high'
      },

      // 具體表格類型
      {
        pattern: /item: DatabaseRecord/g,
        replacement: 'item: DatabaseRecord',
        description: '項目對象類型',
        category: 'database',
        priority: 'high'
      },
      {
        pattern: /record: DatabaseRecord/g,
        replacement: 'record: DatabaseRecord',
        description: '記錄對象類型',
        category: 'database',
        priority: 'high'
      },
      {
        pattern: /row: DatabaseRecord/g,
        replacement: 'row: DatabaseRecord',
        description: '行對象類型',
        category: 'database',
        priority: 'high'
      },

      // 映射函數類型
      {
        pattern: /\.map\(\(item: DatabaseRecord\) => /g,
        replacement: '.map((item: DatabaseRecord) => ',
        description: '映射函數項目類型',
        category: 'database',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(record: DatabaseRecord\) => /g,
        replacement: '.map((record: DatabaseRecord) => ',
        description: '映射函數記錄類型',
        category: 'database',
        priority: 'high'
      },
      {
        pattern: /\.map\(\(row: DatabaseRecord\) => /g,
        replacement: '.map((row: DatabaseRecord) => ',
        description: '映射函數行類型',
        category: 'database',
        priority: 'high'
      },

      // 過濾函數類型
      {
        pattern: /\.filter\(\(item: DatabaseRecord\) => /g,
        replacement: '.filter((item: DatabaseRecord) => ',
        description: '過濾函數項目類型',
        category: 'database',
        priority: 'high'
      },
      {
        pattern: /\.filter\(\(record: DatabaseRecord\) => /g,
        replacement: '.filter((record: DatabaseRecord) => ',
        description: '過濾函數記錄類型',
        category: 'database',
        priority: 'high'
      },

      // 累加器函數類型
      {
        pattern: /\.reduce\(\(acc: any, item: DatabaseRecord\) => /g,
        replacement: '.reduce((acc: DatabaseRecord, item: DatabaseRecord) => ',
        description: '累加器函數類型',
        category: 'database',
        priority: 'high'
      },
      {
        pattern: /\.reduce\(\(sum: number, item: DatabaseRecord\) => /g,
        replacement: '.reduce((sum: number, item: DatabaseRecord) => ',
        description: '累加器函數項目類型',
        category: 'database',
        priority: 'high'
      },

      // API 相關類型
      {
        pattern: /response: ApiResponse/g,
        replacement: 'response: ApiResponse',
        description: 'API 響應類型',
        category: 'api',
        priority: 'high'
      },
      {
        pattern: /request: ApiRequest/g,
        replacement: 'request: ApiRequest',
        description: 'API 請求類型',
        category: 'api',
        priority: 'high'
      },
      {
        pattern: /params: QueryParams/g,
        replacement: 'params: QueryParams',
        description: '查詢參數類型',
        category: 'api',
        priority: 'high'
      },

      // 中優先級：驗證相關類型
      {
        pattern: /error: unknown/g,
        replacement: 'error: unknown',
        description: '錯誤對象類型',
        category: 'validation',
        priority: 'medium'
      },
      {
        pattern: /catch \(error: unknown\)/g,
        replacement: 'catch (error: unknown)',
        description: '錯誤捕獲類型',
        category: 'validation',
        priority: 'medium'
      },
      {
        pattern: /catch\(error: unknown\)/g,
        replacement: 'catch(error: unknown)',
        description: '錯誤捕獲類型（無空格）',
        category: 'validation',
        priority: 'medium'
      },

      // 通用對象類型
      {
        pattern: /obj: Record<string, unknown>/g,
        replacement: 'obj: Record<string, unknown>',
        description: '通用對象類型',
        category: 'generic',
        priority: 'medium'
      },
      {
        pattern: /value: unknown/g,
        replacement: 'value: unknown',
        description: '通用值類型',
        category: 'generic',
        priority: 'medium'
      },
      {
        pattern: /config: Record<string, unknown>/g,
        replacement: 'config: Record<string, unknown>',
        description: '配置對象類型',
        category: 'generic',
        priority: 'medium'
      },
      {
        pattern: /options: Record<string, unknown>/g,
        replacement: 'options: Record<string, unknown>',
        description: '選項對象類型',
        category: 'generic',
        priority: 'medium'
      },

      // 低優先級：測試相關類型
      {
        pattern: /mockData: Record<string, unknown>/g,
        replacement: 'mockData: Record<string, unknown>',
        description: '模擬數據類型',
        category: 'generic',
        priority: 'low'
      },
      {
        pattern: /testData: Record<string, unknown>/g,
        replacement: 'testData: Record<string, unknown>',
        description: '測試數據類型',
        category: 'generic',
        priority: 'low'
      }
    );
  }

  async replaceAllFiles() {
    console.log('🚀 開始自動替換 any 類型');
    console.log(`📋 共有 ${this.replacements.length} 個替換規則`);

    // 獲取所有需要處理的文件
    const files = await glob('**/*.{ts,tsx}', {
      ignore: [
        'node_modules/**',
        '.next/**',
        'dist/**',
        'build/**',
        'lib/types/supabase-generated.ts', // 跳過生成的文件
        'lib/validation/zod-schemas.ts'    // 跳過驗證文件
      ],
      cwd: process.cwd()
    });

    console.log(`📁 找到 ${files.length} 個文件需要處理`);

    // 按優先級分組處理
    const highPriorityReplacements = this.replacements.filter(r => r.priority === 'high');
    const mediumPriorityReplacements = this.replacements.filter(r => r.priority === 'medium');
    const lowPriorityReplacements = this.replacements.filter(r => r.priority === 'low');

    console.log('\n🔥 開始高優先級替換...');
    await this.processFiles(files, highPriorityReplacements);

    console.log('\n⚡ 開始中優先級替換...');
    await this.processFiles(files, mediumPriorityReplacements);

    console.log('\n🔧 開始低優先級替換...');
    await this.processFiles(files, lowPriorityReplacements);

    console.log(`\n✅ 替換完成！`);
    console.log(`📊 處理了 ${this.fileCount} 個文件`);
    console.log(`🎯 修復了 ${this.fixedCount} 個 any 類型`);
  }

  private async processFiles(files: string[], replacements: TypeReplacement[]) {
    for (const file of files) {
      await this.processFile(file, replacements);
    }
  }

  private async processFile(filePath: string, replacements: TypeReplacement[]) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let updatedContent = content;
      let fileFixCount = 0;
      let hasChanges = false;

      for (const replacement of replacements) {
        const matches = content.match(replacement.pattern);
        if (matches) {
          updatedContent = updatedContent.replace(replacement.pattern, replacement.replacement);
          fileFixCount += matches.length;
          this.fixedCount += matches.length;
          hasChanges = true;
        }
      }

      // 添加必要的 import 語句
      if (hasChanges) {
        updatedContent = this.addRequiredImports(updatedContent, filePath);
      }

      // 只有內容改變時才寫回文件
      if (updatedContent !== content) {
        await fs.writeFile(filePath, updatedContent);
        this.fileCount++;
        console.log(`✅ 處理文件: ${filePath} (${fileFixCount} 個修復)`);
      }
    } catch (error) {
      console.error(`❌ 處理文件失敗 ${filePath}:`, getErrorMessage(error));
    }
  }

  private addRequiredImports(content: string, filePath: string): string {
    let updatedContent = content;
    const needsImports = new Set<string>();

    // 檢查需要添加的 import
    if (content.includes('DatabaseRecord') && !content.includes('import.*DatabaseRecord')) {
      needsImports.add("import { DatabaseRecord } from '@/types/database/tables';");
    }

    if (content.includes('ApiResponse') && !content.includes('import.*ApiResponse')) {
      needsImports.add("import { ApiResponse, ApiRequest, QueryParams } from '@/lib/validation/zod-schemas';");
    }

    if (content.includes('getErrorMessage') && !content.includes('import.*getErrorMessage')) {
      needsImports.add("import { getErrorMessage } from '@/types/core/error';");
    }

    // 添加 import 語句
    if (needsImports.size > 0) {
      const importStatements = Array.from(needsImports).join('\n');
      const firstImportMatch = updatedContent.match(/^import.*?;$/m);

      if (firstImportMatch) {
        updatedContent = updatedContent.replace(
          firstImportMatch[0],
          `${firstImportMatch[0]}\n${importStatements}`
        );
      } else {
        // 如果沒有現有的 import，添加到文件開頭
        updatedContent = `${importStatements}\n\n${updatedContent}`;
      }
    }

    return updatedContent;
  }

  // 生成報告
  generateReport() {
    const report = {
      totalFiles: this.fileCount,
      totalFixes: this.fixedCount,
      categorySummary: {
        database: this.replacements.filter(r => r.category === 'database').length,
        validation: this.replacements.filter(r => r.category === 'validation').length,
        api: this.replacements.filter(r => r.category === 'api').length,
        generic: this.replacements.filter(r => r.category === 'generic').length,
      },
      prioritySummary: {
        high: this.replacements.filter(r => r.priority === 'high').length,
        medium: this.replacements.filter(r => r.priority === 'medium').length,
        low: this.replacements.filter(r => r.priority === 'low').length,
      }
    };

    return report;
  }
}

// 主執行函數
async function main() {
  try {
    console.log('🎯 自動類型替換工具 - Supabase + Zod 版本');
    console.log('👥 專家團隊：分析師、架構專家、DevOps、QA');

    const replacer = new TypeReplacer();
    await replacer.replaceAllFiles();

    const report = replacer.generateReport();
    console.log('\n📊 替換報告：');
    console.log(`- 處理文件數：${report.totalFiles}`);
    console.log(`- 修復數量：${report.totalFixes}`);
    console.log(`- 類別分佈：`);
    console.log(`  • 數據庫：${report.categorySummary.database} 個規則`);
    console.log(`  • 驗證：${report.categorySummary.validation} 個規則`);
    console.log(`  • API：${report.categorySummary.api} 個規則`);
    console.log(`  • 通用：${report.categorySummary.generic} 個規則`);

    console.log('\n🎉 自動替換完成！');
    console.log('📊 建議運行 npm run typecheck 檢查效果');
    console.log('🔍 建議運行 npm run lint 驗證代碼品質');
  } catch (error) {
    console.error('💥 替換過程中出現錯誤:', getErrorMessage(error));
    process.exit(1);
  }
}

// 執行主函數
main();
