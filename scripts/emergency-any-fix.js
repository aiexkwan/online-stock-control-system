#!/usr/bin/env node
/**
 * 緊急 any 類型修復腳本
 * 專注修復最關鍵的 any 類型問題
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

class EmergencyAnyFixer {
  constructor() {
    this.fixedCount = 0;
    this.patterns = [
      // 基本數據映射
      { from: /\.map\(\(item: any\) => /g, to: '.map((item: Record<string, unknown>) => ' },
      { from: /\.map\(\(product: any\) => /g, to: '.map((product: Record<string, unknown>) => ' },
      { from: /\.map\(\(order: any\) => /g, to: '.map((order: Record<string, unknown>) => ' },
      { from: /\.map\(\(record: any\) => /g, to: '.map((record: Record<string, unknown>) => ' },
      { from: /\.map\(\(row: any\) => /g, to: '.map((row: Record<string, unknown>) => ' },
      { from: /\.map\(\(entry: any\) => /g, to: '.map((entry: Record<string, unknown>) => ' },
      { from: /\.map\(\(line: any\) => /g, to: '.map((line: Record<string, unknown>) => ' },
      { from: /\.map\(\(l: any\) => /g, to: '.map((l: Record<string, unknown>) => ' },
      { from: /\.map\(\(col: any\) => /g, to: '.map((col: Record<string, unknown>) => ' },
      { from: /\.map\(\(r: any\) => /g, to: '.map((r: Record<string, unknown>) => ' },
      { from: /\.map\(\(p: any\) => /g, to: '.map((p: Record<string, unknown>) => ' },
      { from: /\.map\(\(t: any\) => /g, to: '.map((t: Record<string, unknown>) => ' },
      { from: /\.map\(\(d: any\) => /g, to: '.map((d: Record<string, unknown>) => ' },
      { from: /\.map\(\(s: any\) => /g, to: '.map((s: Record<string, unknown>) => ' },
      { from: /\.map\(\(n: any\) => /g, to: '.map((n: Record<string, unknown>) => ' },
      { from: /\.map\(\(stat: any\) => /g, to: '.map((stat: Record<string, unknown>) => ' },
      { from: /\.map\(\(result: any\) => /g, to: '.map((result: Record<string, unknown>) => ' },
      { from: /\.map\(\(i: any\) => /g, to: '.map((i: Record<string, unknown>) => ' },

      // 過濾器
      { from: /\.filter\(\(item: any\) => /g, to: '.filter((item: Record<string, unknown>) => ' },
      { from: /\.filter\(\(col: any\) => /g, to: '.filter((col: Record<string, unknown>) => ' },
      { from: /\.filter\(\(r: any\) => /g, to: '.filter((r: Record<string, unknown>) => ' },
      { from: /\.filter\(\(p: any\) => /g, to: '.filter((p: Record<string, unknown>) => ' },
      { from: /\.filter\(\(s: any\) => /g, to: '.filter((s: Record<string, unknown>) => ' },
      { from: /\.filter\(\(d: any\) => /g, to: '.filter((d: Record<string, unknown>) => ' },

      // 累加器
      { from: /\.reduce\(\(acc: any, item: any\) => /g, to: '.reduce((acc: Record<string, unknown>, item: Record<string, unknown>) => ' },
      { from: /\.reduce\(\(total, entry: any\) => /g, to: '.reduce((total, entry: Record<string, unknown>) => ' },
      { from: /\.reduce\(\(sum: number, item: any\) => /g, to: '.reduce((sum: number, item: Record<string, unknown>) => ' },
      { from: /\.reduce\(\(sum: number, record: any\) => /g, to: '.reduce((sum: number, record: Record<string, unknown>) => ' },

      // 屬性聲明
      { from: /data\?: any\[\]/g, to: 'data?: Record<string, unknown>[]' },
      { from: /: any\[\]/g, to: ': Record<string, unknown>[]' },

      // 變量聲明
      { from: /const emailData: any = /g, to: 'const emailData: Record<string, unknown> = ' },
      { from: /let result: any;/g, to: 'let result: Record<string, unknown>;' },
      { from: /const result: any = /g, to: 'const result: Record<string, unknown> = ' },

      // 函數參數
      { from: /\(result: any\) => /g, to: '(result: Record<string, unknown>) => ' },
      { from: /\(response: any\) => /g, to: '(response: Record<string, unknown>) => ' },
      { from: /\(data: any\) => /g, to: '(data: Record<string, unknown>) => ' },
    ];
  }

  async fixAllFiles() {
    console.log('🚨 緊急 any 類型修復開始');

    const files = await glob('**/*.{ts,tsx}', {
      ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**'],
      cwd: process.cwd()
    });

    console.log(`📁 找到 ${files.length} 個文件`);

    for (const file of files) {
      await this.fixFile(file);
    }

    console.log(`✅ 修復完成！共修復 ${this.fixedCount} 個 any 類型`);
  }

  async fixFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      let updatedContent = content;
      let fileFixCount = 0;

      for (const pattern of this.patterns) {
        const matches = content.match(pattern.from);
        if (matches) {
          updatedContent = updatedContent.replace(pattern.from, pattern.to);
          fileFixCount += matches.length;
          this.fixedCount += matches.length;
        }
      }

      // 添加必要的導入
      if (updatedContent.includes('Record<string, unknown>') && !updatedContent.includes('Record<string, unknown>')) {
        // 不需要額外導入，Record<string, unknown> 是 TypeScript 內建類型
      }

      if (updatedContent !== content) {
        fs.writeFileSync(filePath, updatedContent);
        console.log(`✅ 修復: ${filePath} (${fileFixCount} 個)`);
      }
    } catch (error) {
      console.error(`❌ 修復失敗: ${filePath}`, error.message);
    }
  }
}

// 執行修復
const fixer = new EmergencyAnyFixer();
fixer.fixAllFiles().catch(console.error);
