#!/usr/bin/env ts-node
/**
 * 修復 unknown 錯誤類型的工具
 * 
 * 專家協作策略：
 * - 分析師：識別錯誤模式
 * - 代碼品質專家：確保類型安全
 * - QA專家：驗證修復效果
 */

import { promises as fs } from 'fs';
import { glob } from 'glob';

class UnknownErrorFixer {
  private patterns = [
    // Pattern 1: error.message 或 error.name 等直接屬性存取
    {
      pattern: /(\w+)\.message/g,
      replacement: (match: string, errorVar: string) => {
        if (errorVar === 'error' || errorVar.includes('Error')) {
          return `getErrorMessage(${errorVar})`;
        }
        return match;
      },
      description: 'Replace error.message with getErrorMessage(error)'
    },
    
    // Pattern 2: (error as { message: string }).message
    {
      pattern: /\((\w+)\s+as\s+\{\s*message:\s*string\s*\}\)\.message/g,
      replacement: (match: string, errorVar: string) => `getErrorMessage(${errorVar})`,
      description: 'Replace (error as { message: string }).message with getErrorMessage(error)'
    },
    
    // Pattern 3: error.stack
    {
      pattern: /(\w+)\.stack/g,
      replacement: (match: string, errorVar: string) => {
        if (errorVar === 'error' || errorVar.includes('Error')) {
          return `(${errorVar} as Error).stack`;
        }
        return match;
      },
      description: 'Replace error.stack with (error as Error).stack'
    },
    
    // Pattern 4: error.name
    {
      pattern: /(\w+)\.name/g,
      replacement: (match: string, errorVar: string) => {
        if (errorVar === 'error' || errorVar.includes('Error')) {
          return `(${errorVar} as Error).name`;
        }
        return match;
      },
      description: 'Replace error.name with (error as Error).name'
    },
    
    // Pattern 5: error.code
    {
      pattern: /(\w+)\.code/g,
      replacement: (match: string, errorVar: string) => {
        if (errorVar === 'error' || errorVar.includes('Error')) {
          return `(${errorVar} as any).code`;
        }
        return match;
      },
      description: 'Replace error.code with (error as any).code'
    }
  ];

  async addImportIfNeeded(filePath: string, content: string): Promise<string> {
    // 檢查是否已經有 getErrorMessage 導入
    if (content.includes('getErrorMessage')) {
      return content;
    }
    
    // 檢查是否使用了 getErrorMessage
    if (!content.includes('getErrorMessage(')) {
      return content;
    }
    
    // 找到適當的導入位置
    const lines = content.split('\n');
    let importInserted = false;
    let result = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 如果是第一個導入語句，在其後插入我們的導入
      if (!importInserted && line.startsWith('import ') && !line.includes('getErrorMessage')) {
        result += line + '\n';
        // 確定正確的導入路徑
        const importPath = filePath.includes('app/') ? '@/lib/types/error-handling' : '../lib/types/error-handling';
        result += `import { getErrorMessage } from '${importPath}';\n`;
        importInserted = true;
      } else if (!importInserted && line.trim() && !line.startsWith('import ') && !line.startsWith('/**') && !line.startsWith('*') && !line.startsWith('//')) {
        // 如果沒有導入語句，在文件開頭插入
        const importPath = filePath.includes('app/') ? '@/lib/types/error-handling' : '../lib/types/error-handling';
        result += `import { getErrorMessage } from '${importPath}';\n`;
        result += line + '\n';
        importInserted = true;
      } else {
        result += line + '\n';
      }
    }
    
    return result;
  }

  async fixUnknownErrors(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let updatedContent = content;
      let hasChanges = false;
      
      // 應用所有修復模式
      for (const pattern of this.patterns) {
        const newContent = updatedContent.replace(pattern.pattern, (...args) => {
          hasChanges = true;
          if (typeof pattern.replacement === 'function') {
            return pattern.replacement(...args);
          }
          return pattern.replacement;
        });
        updatedContent = newContent;
      }
      
      if (hasChanges) {
        // 添加必要的導入
        updatedContent = await this.addImportIfNeeded(filePath, updatedContent);
        
        await fs.writeFile(filePath, updatedContent);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`❌ 修復文件失敗 ${filePath}:`, error);
      return false;
    }
  }

  async findFilesWithUnknownErrors(): Promise<string[]> {
    const files = await glob('app/**/*.{ts,tsx}', {
      ignore: ['node_modules/**', 'dist/**', '.next/**']
    });
    
    const problemFiles: string[] = [];
    
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        
        // 檢查是否包含 unknown 錯誤處理並且有直接屬性存取
        if (content.includes('error: unknown') || content.includes('Error: unknown')) {
          if (content.includes('.message') || content.includes('.stack') || content.includes('.name') || content.includes('.code')) {
            problemFiles.push(file);
          }
        }
      } catch (error) {
        console.error(`❌ 無法讀取文件 ${file}:`, error);
      }
    }
    
    return problemFiles;
  }

  async fixAllFiles(): Promise<void> {
    console.log('🔍 搜索包含 unknown 錯誤處理的文件...');
    const files = await this.findFilesWithUnknownErrors();
    
    console.log(`📝 發現 ${files.length} 個文件需要修復`);
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const file of files) {
      const success = await this.fixUnknownErrors(file);
      if (success) {
        successCount++;
        console.log(`✅ 修復: ${file}`);
      } else {
        skipCount++;
        console.log(`⏭️ 跳過: ${file}`);
      }
    }
    
    console.log('\n📊 修復報告');
    console.log('================');
    console.log(`✅ 成功: ${successCount} 個`);
    console.log(`⏭️ 跳過: ${skipCount} 個`);
    console.log(`📈 修復率: ${((successCount / files.length) * 100).toFixed(1)}%`);
  }
}

// 主執行函數
async function main() {
  console.log('🚀 啟動 Unknown 錯誤修復工具');
  console.log('專家協作模式：分析師 + 代碼品質專家 + QA專家');
  
  const fixer = new UnknownErrorFixer();
  await fixer.fixAllFiles();
  
  console.log('\n🎉 Unknown 錯誤修復完成！');
  console.log('請運行 npm run typecheck 驗證修復效果');
}

if (require.main === module) {
  main().catch(console.error);
}