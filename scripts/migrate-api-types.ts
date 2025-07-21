#!/usr/bin/env node

/**
 * Phase 2: API 類型遷移工具
 * 自動將現有的 any 類型替換為標準化的 ApiResult/ActionResult
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { glob } from 'glob';

interface MigrationStats {
  filesProcessed: number;
  anyTypesFound: number;
  anyTypesReplaced: number;
  errors: string[];
}

class ApiTypeMigrator {
  private stats: MigrationStats = {
    filesProcessed: 0,
    anyTypesFound: 0,
    anyTypesReplaced: 0,
    errors: [],
  };

  /**
   * 執行遷移
   */
  async migrate(patterns: string[]): Promise<void> {
    console.log('🚀 Starting API type migration...\n');

    for (const pattern of patterns) {
      const files = await glob(pattern);
      console.log(`Found ${files.length} files matching pattern: ${pattern}`);

      for (const file of files) {
        await this.processFile(file);
      }
    }

    this.printStats();
  }

  /**
   * 處理單個文件
   */
  private async processFile(filePath: string): Promise<void> {
    console.log(`\n📄 Processing: ${filePath}`);
    this.stats.filesProcessed++;

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      const result = this.transformFile(sourceFile, filePath);
      
      if (result.transformed) {
        fs.writeFileSync(filePath, result.content);
        console.log(`✅ Updated ${filePath} - Replaced ${result.replacements} any types`);
        this.stats.anyTypesReplaced += result.replacements;
      } else {
        console.log(`⏭️  No changes needed for ${filePath}`);
      }
    } catch (error) {
      const errorMsg = `Error processing ${filePath}: ${error}`;
      console.error(`❌ ${errorMsg}`);
      this.stats.errors.push(errorMsg);
    }
  }

  /**
   * 轉換文件內容
   */
  private transformFile(
    sourceFile: ts.SourceFile,
    filePath: string
  ): { transformed: boolean; content: string; replacements: number } {
    const printer = ts.createPrinter();
    let replacements = 0;
    let hasApiImport = false;

    // 檢查是否已有 api types import
    ts.forEachChild(sourceFile, (node) => {
      if (
        ts.isImportDeclaration(node) &&
        node.moduleSpecifier.getText().includes('@/lib/types/api')
      ) {
        hasApiImport = true;
      }
    });

    // 轉換函數
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
      return (sourceFile) => {
        const visit: ts.Visitor = (node) => {
          // 處理函數返回類型
          if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) {
            const returnType = node.type;
            
            // 檢查是否返回 any 或 Promise<any>
            if (returnType && this.isAnyType(returnType)) {
              replacements++;
              const isAsync = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) ||
                             (ts.isArrowFunction(node) && node.body && ts.isBlock(node.body) &&
                              this.hasAsyncContent(node.body));
              
              // 根據文件路徑決定使用的類型
              const newType = filePath.includes('/actions/') ? 'ActionResult' : 'ApiResult';
              const typeNode = isAsync
                ? ts.factory.createTypeReferenceNode(`Promise<${newType}<unknown>>`)
                : ts.factory.createTypeReferenceNode(`${newType}<unknown>`);
              
              if (ts.isFunctionDeclaration(node)) {
                return ts.factory.updateFunctionDeclaration(
                  node,
                  node.modifiers,
                  node.asteriskToken,
                  node.name,
                  node.typeParameters,
                  node.parameters,
                  typeNode,
                  node.body
                );
              } else if (ts.isMethodDeclaration(node)) {
                return ts.factory.updateMethodDeclaration(
                  node,
                  node.modifiers,
                  node.asteriskToken,
                  node.name,
                  node.questionToken,
                  node.typeParameters,
                  node.parameters,
                  typeNode,
                  node.body
                );
              } else if (ts.isArrowFunction(node)) {
                return ts.factory.updateArrowFunction(
                  node,
                  node.modifiers,
                  node.typeParameters,
                  node.parameters,
                  typeNode,
                  node.equalsGreaterThanToken,
                  node.body
                );
              }
            }
          }

          // 處理變量聲明中的 any
          if (ts.isVariableDeclaration(node) && node.type && this.isAnyType(node.type)) {
            const parent = node.parent.parent;
            // 檢查是否為 API 響應相關變量
            if (this.isApiRelatedVariable(node)) {
              replacements++;
              const newType = filePath.includes('/actions/') ? 'ActionResult<unknown>' : 'ApiResult<unknown>';
              return ts.factory.updateVariableDeclaration(
                node,
                node.name,
                node.exclamationToken,
                ts.factory.createTypeReferenceNode(newType),
                node.initializer
              );
            }
          }

          return ts.visitEachChild(node, visit, context);
        };

        return ts.visitNode(sourceFile, visit) as ts.SourceFile;
      };
    };

    // 應用轉換
    const result = ts.transform(sourceFile, [transformer]);
    let content = printer.printFile(result.transformed[0]);

    // 如果有替換且沒有 import，添加 import
    if (replacements > 0 && !hasApiImport) {
      const importStatement = filePath.includes('/actions/')
        ? `import type { ActionResult } from '@/lib/types/api';\n`
        : `import type { ApiResult } from '@/lib/types/api';\n`;
      
      // 在第一個 import 後插入，或在文件開頭
      const firstImportMatch = content.match(/^import\s+.*$/m);
      if (firstImportMatch) {
        const index = content.indexOf(firstImportMatch[0]) + firstImportMatch[0].length;
        content = content.slice(0, index) + '\n' + importStatement + content.slice(index);
      } else {
        content = importStatement + '\n' + content;
      }
    }

    return {
      transformed: replacements > 0,
      content,
      replacements,
    };
  }

  /**
   * 檢查是否為 any 類型
   */
  private isAnyType(type: ts.TypeNode): boolean {
    if (type.kind === ts.SyntaxKind.AnyKeyword) {
      this.stats.anyTypesFound++;
      return true;
    }
    
    // 檢查 Promise<any>
    if (ts.isTypeReferenceNode(type) && 
        type.typeName.getText() === 'Promise' &&
        type.typeArguments?.length === 1 &&
        type.typeArguments[0].kind === ts.SyntaxKind.AnyKeyword) {
      this.stats.anyTypesFound++;
      return true;
    }
    
    return false;
  }

  /**
   * 檢查函數體是否包含異步內容
   */
  private hasAsyncContent(body: ts.Block): boolean {
    let hasAsync = false;
    
    const visit = (node: ts.Node): void => {
      if (ts.isAwaitExpression(node) || 
          (ts.isCallExpression(node) && node.expression.getText().includes('await'))) {
        hasAsync = true;
      }
      ts.forEachChild(node, visit);
    };
    
    visit(body);
    return hasAsync;
  }

  /**
   * 檢查變量是否與 API 相關
   */
  private isApiRelatedVariable(node: ts.VariableDeclaration): boolean {
    const name = node.name.getText().toLowerCase();
    const apiRelatedPatterns = [
      'response', 'result', 'data', 'error', 'res', 'ret',
      'apiresponse', 'apiresult', 'actionresult'
    ];
    
    return apiRelatedPatterns.some(pattern => name.includes(pattern));
  }

  /**
   * 打印統計信息
   */
  private printStats(): void {
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Statistics:');
    console.log('='.repeat(50));
    console.log(`Files processed: ${this.stats.filesProcessed}`);
    console.log(`Any types found: ${this.stats.anyTypesFound}`);
    console.log(`Any types replaced: ${this.stats.anyTypesReplaced}`);
    console.log(`Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n✨ Migration complete!');
  }
}

// 執行遷移
async function main() {
  const args = process.argv.slice(2);
  
  // 默認遷移模式
  let patterns: string[] = [];
  
  if (args.length === 0 || args[0] === '--all') {
    // 遷移所有相關文件
    patterns = [
      'app/actions/**/*.ts',
      'app/api/**/*.ts',
    ];
  } else if (args[0] === '--priority') {
    // 只遷移高優先級文件
    patterns = [
      'app/actions/reportActions.ts',
      'app/api/ask-database/route.ts',
      'app/api/monitoring/tech-debt/route.ts',
      'app/api/v1/alerts/notifications/route.ts',
      'app/api/v1/alerts/rules/route.ts',
    ];
  } else {
    // 自定義模式
    patterns = args;
  }

  const migrator = new ApiTypeMigrator();
  await migrator.migrate(patterns);
}

// 錯誤處理
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// 執行
main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});