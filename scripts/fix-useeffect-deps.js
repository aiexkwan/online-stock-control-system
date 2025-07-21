#!/usr/bin/env node
/**
 * 批量修復 useEffect 依賴數組中的類型轉換問題
 * 修復 TS2352 錯誤：Conversion of type 'X' to type 'string' may be a mistake
 */

const fs = require('fs');
const path = require('path');

// 需要修復的文件模式
const patterns = [
  /\}, \[([^[\]]+) as string\]\)/g,
  /\}, \[([^[\]]+) as number\]\)/g,
  /\}, \[([^[\]]+) as boolean\]\)/g,
  /\}, \[([^[\]]+) as any\]\)/g,
];

// 掃描所有 TypeScript 文件
function scanDirectory(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...scanDirectory(fullPath));
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

// 修復單個文件
function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = content;
  let changed = false;

  // 修復 useEffect 依賴數組中的類型轉換
  for (const pattern of patterns) {
    const newContent = modified.replace(pattern, (match, dep) => {
      console.log(`Fixing ${filePath}: ${match.trim()} -> }, [${dep}])`);
      changed = true;
      return `}, [${dep}])`;
    });
    modified = newContent;
  }

  if (changed) {
    fs.writeFileSync(filePath, modified);
    return true;
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
