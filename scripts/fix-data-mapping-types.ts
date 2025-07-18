#!/usr/bin/env ts-node
/**
 * Phase 2: Data Mapping 類型修復工具
 * 
 * 專家協作策略：
 * - 架構專家：設計泛型數據映射類型
 * - 代碼品質專家：確保類型安全
 * - 優化專家：性能優化映射
 */

import { promises as fs } from 'fs';
import { DatabaseRecord } from '@/lib/types/database';

interface DataMappingPattern {
  pattern: RegExp;
  replacement: string;
  description: string;
}

class DataMappingTypeFixer {
  private patterns: DataMappingPattern[] = [];
  
  constructor() {
    this.setupPatterns();
  }
  
  private setupPatterns() {
    // 添加泛型數據映射類型
    this.patterns.push({
      pattern: /\.map\(\(item: DatabaseRecord\) => /g,
      replacement: '.map((item: Record<string, unknown>) => ',
      description: 'Replace any in map function with Record<string, unknown>'
    });
    
    this.patterns.push({
      pattern: /\.map\(\(([^:]+): any\) => /g,
      replacement: '.map(($1: Record<string, unknown>) => ',
      description: 'Replace any in map function with Record<string, unknown>'
    });
    
    this.patterns.push({
      pattern: /\.filter\(\(item: DatabaseRecord\) => /g,
      replacement: '.filter((item: Record<string, unknown>) => ',
      description: 'Replace any in filter function with Record<string, unknown>'
    });
    
    this.patterns.push({
      pattern: /\.filter\(\(([^:]+): any\) => /g,
      replacement: '.filter(($1: Record<string, unknown>) => ',
      description: 'Replace any in filter function with Record<string, unknown>'
    });
    
    this.patterns.push({
      pattern: /\.reduce\(\(([^,]+), ([^:]+): any\) => /g,
      replacement: '.reduce(($1, $2: Record<string, unknown>) => ',
      description: 'Replace any in reduce function with Record<string, unknown>'
    });
    
    this.patterns.push({
      pattern: /\.forEach\(\(item: DatabaseRecord\) => /g,
      replacement: '.forEach((item: Record<string, unknown>) => ',
      description: 'Replace any in forEach function with Record<string, unknown>'
    });
    
    this.patterns.push({
      pattern: /\.forEach\(\(([^:]+): any\) => /g,
      replacement: '.forEach(($1: Record<string, unknown>) => ',
      description: 'Replace any in forEach function with Record<string, unknown>'
    });
    
    this.patterns.push({
      pattern: /\.find\(\(item: DatabaseRecord\) => /g,
      replacement: '.find((item: Record<string, unknown>) => ',
      description: 'Replace any in find function with Record<string, unknown>'
    });
    
    this.patterns.push({
      pattern: /\.find\(\(([^:]+): any\) => /g,
      replacement: '.find(($1: Record<string, unknown>) => ',
      description: 'Replace any in find function with Record<string, unknown>'
    });
    
    this.patterns.push({
      pattern: /\.some\(\(item: DatabaseRecord\) => /g,
      replacement: '.some((item: Record<string, unknown>) => ',
      description: 'Replace any in some function with Record<string, unknown>'
    });
    
    this.patterns.push({
      pattern: /\.some\(\(([^:]+): any\) => /g,
      replacement: '.some(($1: Record<string, unknown>) => ',
      description: 'Replace any in some function with Record<string, unknown>'
    });
    
    this.patterns.push({
      pattern: /\.every\(\(item: DatabaseRecord\) => /g,
      replacement: '.every((item: Record<string, unknown>) => ',
      description: 'Replace any in every function with Record<string, unknown>'
    });
    
    this.patterns.push({
      pattern: /\.every\(\(([^:]+): any\) => /g,
      replacement: '.every(($1: Record<string, unknown>) => ',
      description: 'Replace any in every function with Record<string, unknown>'
    });
  }
  
  async fixAllFiles() {
    // 獲取重構計劃中的 data mapping 文件
    const plan = JSON.parse(
      await fs.readFile('docs/type-refactor-plan.json', 'utf-8')
    );
    
    const dataMappingItems = plan.phases[1].items; // Phase 2 items
    const files = [...new Set(dataMappingItems.map((item: Record<string, unknown>) => String(item.file)))];
    
    console.log(`🔧 開始修復 ${files.length} 個文件的 data mapping 類型`);
    
    for (const file of files) {
      await this.fixFile(String(file));
    }
    
    console.log('✅ 所有 data mapping 類型已修復');
  }
  
  private async fixFile(filePath: string) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      let updatedContent = content;
      
      // 應用所有模式
      for (const pattern of this.patterns) {
        updatedContent = updatedContent.replace(pattern.pattern, pattern.replacement);
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
}

// 主執行函數
async function main() {
  console.log('🚀 啟動 Phase 2: Data Mapping 類型修復');
  
  const fixer = new DataMappingTypeFixer();
  await fixer.fixAllFiles();
  
  console.log('\n🎉 Phase 2 完成！');
  console.log('請運行 npm run typecheck 驗證修復效果');
}

if (require.main === module) {
  main().catch(console.error);
}