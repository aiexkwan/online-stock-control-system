#!/usr/bin/env node
/**
 * 批量修復 TS2352 類型轉換錯誤
 */

const fs = require('fs');
const path = require('path');

// 需要修復的模式
const fixPatterns = [
  // Response 類型轉換
  {
    pattern: /\$\{\(response as \{ status: string; \}\)\.statusText\}/g,
    replacement: '${response.statusText}',
  },
  {
    pattern: /\$\{\(response as \{ status: string; \}\)\.status\}/g,
    replacement: '${response.status}',
  },
  // useEffect 依賴數組中的類型轉換
  {
    pattern: /\}, \[([^[\]]+) as string\]\)/g,
    replacement: '}, [$1])',
  },
  {
    pattern: /\}, \[([^[\]]+) as number\]\)/g,
    replacement: '}, [$1])',
  },
  {
    pattern: /\}, \[([^[\]]+) as boolean\]\)/g,
    replacement: '}, [$1])',
  },
  {
    pattern: /\}, \[([^[\]]+) as any\]\)/g,
    replacement: '}, [$1])',
  },
  // 數組索引類型轉換
  {
    pattern: /\[([^[\]]+) as string\]/g,
    replacement: '[$1]',
  },
  {
    pattern: /\[([^[\]]+) as number\]/g,
    replacement: '[$1]',
  },
  // PDF 相關類型轉換
  {
    pattern: /\[pdfBytes as string\]/g,
    replacement: '[pdfBytes]',
  },
  {
    pattern: /\[pdfData as string\]/g,
    replacement: '[pdfData]',
  },
  // 其他常見類型轉換
  {
    pattern: /(\w+) as string/g,
    replacement: '$1',
  },
];

// 掃描所有 TypeScript 文件
function scanDirectory(dir) {
  const files = [];
  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      try {
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files.push(...scanDirectory(fullPath));
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          files.push(fullPath);
        }
      } catch (e) {
        // 忽略無法訪問的文件
      }
    }
  } catch (e) {
    // 忽略無法訪問的目錄
  }

  return files;
}

// 修復單個文件
function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = content;
    let changed = false;

    // 應用所有修復模式
    for (const { pattern, replacement } of fixPatterns) {
      const newContent = modified.replace(pattern, (match, ...args) => {
        // 避免修復已經正確的代碼
        if (match.includes('as string]') && match.includes('useEffect')) {
          console.log(`Fixing ${filePath}: ${match.trim()} -> ${replacement}`);
          changed = true;
          return replacement.replace(/\$1/g, args[0]);
        } else if (match.includes('response as { status: string }')) {
          console.log(`Fixing ${filePath}: ${match.trim()} -> ${replacement}`);
          changed = true;
          return replacement;
        } else if (match.includes(' as string') && !match.includes('theme as string')) {
          console.log(`Fixing ${filePath}: ${match.trim()} -> ${replacement}`);
          changed = true;
          return replacement.replace(/\$1/g, args[0]);
        }
        return match;
      });
      modified = newContent;
    }

    if (changed) {
      fs.writeFileSync(filePath, modified);
      return true;
    }
  } catch (e) {
    console.error(`Error processing ${filePath}:`, e.message);
  }

  return false;
}

// 主程序
function main() {
  const startDir = process.argv[2] || './app';
  const files = scanDirectory(startDir);

  let fixedCount = 0;

  for (const file of files) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }

  console.log(`Fixed ${fixedCount} files`);
}

main();
