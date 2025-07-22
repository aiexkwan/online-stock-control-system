#!/usr/bin/env ts-node
/**
 * TypeScript 類型重構工具
 *
 * 多專家協作方案：
 * - 分析師：問題識別和分類
 * - 架構專家：類型系統設計
 * - DevOps：自動化重構流程
 * - 優化專家：性能優化重構
 * - QA專家：類型安全驗證
 * - 代碼品質專家：技術債管理
 */

import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';

interface TypeRefactorConfig {
  // 重構優先級
  priority: 'high' | 'medium' | 'low';
  // 重構類型
  refactorType: 'error-handling' | 'data-mapping' | 'api-response' | 'generic' | 'function-params';
  // 建議的類型替換
  suggestedType: string;
  // 重構複雜度
  complexity: 'simple' | 'medium' | 'complex';
}

interface AnyTypeOccurrence {
  file: string;
  line: number;
  column: number;
  context: string;
  category: string;
  config: TypeRefactorConfig;
}

class TypeRefactorTool {
  private occurrences: AnyTypeOccurrence[] = [];
  private sourceFiles: string[] = [];

  constructor() {}

  async initialize() {
    // 掃描所有 TypeScript 文件
    const patterns = [
      'app/**/*.ts',
      'app/**/*.tsx',
      'lib/**/*.ts',
      'lib/**/*.tsx',
      'components/**/*.ts',
      'components/**/*.tsx',
      'e2e/**/*.ts',
      'scripts/**/*.ts'
    ];

    for (const pattern of patterns) {
      const files = await glob(pattern, {
        ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**']
      });
      this.sourceFiles.push(...files);
    }

    console.log(`🔍 分析師報告: 找到 ${this.sourceFiles.length} 個 TypeScript 文件`);
  }

  async analyzeAnyTypes() {
    for (const file of this.sourceFiles) {
      await this.analyzeFile(file);
    }

    console.log(`📊 統計結果: 發現 ${this.occurrences.length} 個 any 類型使用`);
    this.generateReport();
  }

  private async analyzeFile(filePath: string) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const anyMatches = this.findAnyTypeUsages(line);

        anyMatches.forEach(match => {
          const occurrence: AnyTypeOccurrence = {
            file: filePath,
            line: index + 1,
            column: match.column,
            context: line.trim(),
            category: this.categorizeAnyUsage(line),
            config: this.generateRefactorConfig(line)
          };

          this.occurrences.push(occurrence);
        });
      });
    } catch (error) {
      console.error(`❌ 無法分析文件 ${filePath}:`, error);
    }
  }

  private findAnyTypeUsages(line: string): Array<{ column: number }> {
    const matches: Array<{ column: number }> = [];
    const anyRegex = /\b(:\s*any\b|<any>|\bany\[\]|\bany\s*\||\|\s*any\b|Promise<any>|Array<any>)/g;

    let match;
    while ((match = anyRegex.exec(line)) !== null) {
      matches.push({ column: match.index });
    }

    return matches;
  }

  private categorizeAnyUsage(line: string): string {
    if (line.includes('catch') && line.includes('error')) {
      return 'error-handling';
    }
    if (line.includes('.map(') || line.includes('.filter(') || line.includes('.reduce(')) {
      return 'data-mapping';
    }
    if (line.includes('data?:') || line.includes('response:') || line.includes('result:')) {
      return 'api-response';
    }
    if (line.includes('function') || line.includes('=>')) {
      return 'function-params';
    }
    if (line.includes('props:') || line.includes('state:')) {
      return 'component-props';
    }

    return 'generic';
  }

  private generateRefactorConfig(line: string): TypeRefactorConfig {
    const category = this.categorizeAnyUsage(line);

    switch (category) {
      case 'error-handling':
        return {
          priority: 'high',
          refactorType: 'error-handling',
          suggestedType: 'Error | unknown',
          complexity: 'simple'
        };

      case 'data-mapping':
        return {
          priority: 'high',
          refactorType: 'data-mapping',
          suggestedType: 'Record<string, unknown> | T[]',
          complexity: 'medium'
        };

      case 'api-response':
        return {
          priority: 'medium',
          refactorType: 'api-response',
          suggestedType: 'ApiResponse<T> | unknown',
          complexity: 'medium'
        };

      case 'function-params':
        return {
          priority: 'medium',
          refactorType: 'function-params',
          suggestedType: 'T | unknown',
          complexity: 'complex'
        };

      default:
        return {
          priority: 'low',
          refactorType: 'generic',
          suggestedType: 'unknown',
          complexity: 'simple'
        };
    }
  }

  private generateReport() {
    const categoryStats = this.occurrences.reduce((stats, occurrence) => {
      stats[occurrence.category] = (stats[occurrence.category] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

    const priorityStats = this.occurrences.reduce((stats, occurrence) => {
      stats[occurrence.config.priority] = (stats[occurrence.config.priority] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

    console.log('\n🏗️ 架構專家報告: 類型分佈分析');
    console.log('================================');
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`${category}: ${count} 個`);
    });

    console.log('\n🎯 優化專家報告: 重構優先級');
    console.log('================================');
    Object.entries(priorityStats).forEach(([priority, count]) => {
      console.log(`${priority}: ${count} 個`);
    });

    console.log('\n⚡ DevOps 專家報告: 重構建議');
    console.log('================================');
    console.log('1. 優先修復 error-handling 類型');
    console.log('2. 批量處理 data-mapping 類型');
    console.log('3. 建立 API 響應類型庫');
    console.log('4. 逐步替換 generic any 類型');
  }

  async generateRefactorPlan() {
    const highPriorityItems = this.occurrences
      .filter(item => item.config.priority === 'high')
      .slice(0, 50); // 限制前 50 個高優先級項目

    const refactorPlan = {
      summary: {
        totalOccurrences: this.occurrences.length,
        highPriority: this.occurrences.filter(item => item.config.priority === 'high').length,
        mediumPriority: this.occurrences.filter(item => item.config.priority === 'medium').length,
        lowPriority: this.occurrences.filter(item => item.config.priority === 'low').length,
      },
      phases: [
        {
          phase: 1,
          name: 'Error Handling 類型修復',
          items: highPriorityItems.filter(item => item.category === 'error-handling'),
          estimatedTime: '2-3 小時'
        },
        {
          phase: 2,
          name: 'Data Mapping 類型修復',
          items: highPriorityItems.filter(item => item.category === 'data-mapping'),
          estimatedTime: '4-6 小時'
        },
        {
          phase: 3,
          name: 'API Response 類型修復',
          items: this.occurrences.filter(item => item.category === 'api-response').slice(0, 30),
          estimatedTime: '6-8 小時'
        }
      ]
    };

    await fs.writeFile(
      'docs/type-refactor-plan.json',
      JSON.stringify(refactorPlan, null, 2)
    );

    console.log('\n✅ QA 專家驗證: 重構計劃已生成');
    console.log('詳細計劃保存至: docs/type-refactor-plan.json');

    return refactorPlan;
  }
}

// 主執行函數
async function main() {
  console.log('🚀 啟動 TypeScript 類型重構工具');
  console.log('多專家協作模式已啟動...\n');

  const tool = new TypeRefactorTool();
  await tool.initialize();
  await tool.analyzeAnyTypes();
  await tool.generateRefactorPlan();

  console.log('\n🎉 類型分析完成！');
  console.log('請查看 docs/type-refactor-plan.json 了解詳細重構計劃');
}

if (require.main === module) {
  main().catch(console.error);
}

export { TypeRefactorTool };
