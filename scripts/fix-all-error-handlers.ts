#!/usr/bin/env ts-node
/**
 * 全面錯誤處理修復工具
 * 
 * 專家協作策略：
 * - 分析師：識別所有錯誤處理模式
 * - 架構專家：確保類型安全
 * - QA專家：驗證修復效果
 * - 代碼品質專家：保持代碼清潔
 */

import { promises as fs } from 'fs';
import { getErrorMessage } from '@/lib/types/error-handling';
import { glob } from 'glob';

class ComprehensiveErrorFixer {
  private fixedFiles: string[] = [];
  private errorPatterns = [
    /catch\s*\(\s*error\s*:\s*any\s*\)/g,
    /catch\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*any\s*\)/g,
    /catch\s*\(\s*error\s*:\s*any\s*\)\s*\{/g,
    /catch\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*any\s*\)\s*\{/g,
  ];

  async findAllErrorHandlers(): Promise<string[]> {
    const files = await glob('app/**/*.{ts,tsx}', {
      ignore: ['node_modules/**', 'dist/**', '.next/**']
    });
    
    const filesWithErrorHandlers: string[] = [];
    
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        
        // 檢查是否包含 catch (error: unknown)
        if (content.includes('catch') && content.includes('error: unknown')) {
          filesWithErrorHandlers.push(file);
        }
      } catch (error) {
        console.error(`❌ 無法讀取文件 ${file}:`, error);
      }
    }
    
    return filesWithErrorHandlers;
  }

  async fixErrorHandlers(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let updatedContent = content;
      let hasChanges = false;

      // 修復所有錯誤處理模式
      for (const pattern of this.errorPatterns) {
        const newContent = updatedContent.replace(pattern, (match) => {
          hasChanges = true;
          if (match.includes('(error:')) {
            return match.replace('error: unknown', 'error: unknown');
          } else {
            // 處理自定義變量名
            return match.replace(/:\s*any/, ': unknown');
          }
        });
        updatedContent = newContent;
      }

      // 檢查是否需要添加 getErrorMessage 導入
      if (hasChanges && updatedContent.includes('error.message') && !updatedContent.includes('getErrorMessage')) {
        // 檢查是否已有其他導入
        const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+error-handling[^'"]*)['"]/;
        const existingImport = updatedContent.match(importRegex);
        
        if (existingImport) {
          // 添加到現有導入
          const imports = existingImport[1];
          if (!imports.includes('getErrorMessage')) {
            updatedContent = updatedContent.replace(
              existingImport[0],
              `import { ${imports.trim()}, getErrorMessage } from '${existingImport[2]}'`
            );
          }
        } else {
          // 添加新導入
          const importPath = filePath.includes('app/') ? '@/lib/types/error-handling' : '../lib/types/error-handling';
          const firstImport = updatedContent.match(/^import\s+.*$/m);
          
          if (firstImport) {
            updatedContent = updatedContent.replace(
              firstImport[0],
              `${firstImport[0]}\nimport { getErrorMessage } from '${importPath}';`
            );
          } else {
            updatedContent = `import { getErrorMessage } from '${importPath}';\n${updatedContent}`;
          }
        }
      }

      if (hasChanges) {
        await fs.writeFile(filePath, updatedContent);
        this.fixedFiles.push(filePath);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`❌ 修復文件失敗 ${filePath}:`, error);
      return false;
    }
  }

  async fixAllErrorHandlers(): Promise<void> {
    console.log('🔍 搜索所有包含錯誤處理的文件...');
    const files = await this.findAllErrorHandlers();
    
    console.log(`📝 發現 ${files.length} 個文件包含錯誤處理`);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const file of files) {
      const success = await this.fixErrorHandlers(file);
      if (success) {
        successCount++;
        console.log(`✅ 修復: ${file}`);
      } else {
        failureCount++;
        console.log(`⏭️ 跳過: ${file} (無需修復)`);
      }
    }
    
    console.log('\n📊 修復報告');
    console.log('================');
    console.log(`✅ 成功: ${successCount} 個`);
    console.log(`⏭️ 跳過: ${failureCount} 個`);
    console.log(`📈 修復率: ${((successCount / files.length) * 100).toFixed(1)}%`);
  }
}

// 主執行函數
async function main() {
  console.log('🚀 啟動全面錯誤處理修復工具');
  console.log('專家協作模式：分析師 + 架構專家 + QA專家 + 代碼品質專家');
  
  const fixer = new ComprehensiveErrorFixer();
  await fixer.fixAllErrorHandlers();
  
  console.log('\n🎉 全面錯誤處理修復完成！');
  console.log('請運行 npm run typecheck 驗證修復效果');
}

if (require.main === module) {
  main().catch(console.error);
}