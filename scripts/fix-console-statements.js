#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 定義替換規則
const replacements = [
  {
    pattern: /console\.error\(['"`]([^'"`]+)['"`],?\s*([^)]*)\)/g,
    replacement: (match, message, args) => {
      const cleanArgs = args.trim();
      if (cleanArgs) {
        return `systemLogger.error(${cleanArgs}, '${message}')`;
      } else {
        return `systemLogger.error('${message}')`;
      }
    }
  },
  {
    pattern: /console\.error\(([^,)]+),?\s*(['"`][^'"`]*['"`])\)/g,
    replacement: (match, errorObj, message) => {
      return `systemLogger.error(${errorObj.trim()}, ${message})`;
    }
  },
  {
    pattern: /console\.log\(['"`]([^'"`]+)['"`],?\s*([^)]*)\)/g,
    replacement: (match, message, args) => {
      const cleanArgs = args.trim();
      if (cleanArgs) {
        return `systemLogger.debug({ data: ${cleanArgs} }, '${message}')`;
      } else {
        return `systemLogger.debug('${message}')`;
      }
    }
  },
  {
    pattern: /console\.warn\(['"`]([^'"`]+)['"`],?\s*([^)]*)\)/g,
    replacement: (match, message, args) => {
      const cleanArgs = args.trim();
      if (cleanArgs) {
        return `systemLogger.warn({ data: ${cleanArgs} }, '${message}')`;
      } else {
        return `systemLogger.warn('${message}')`;
      }
    }
  }
];

// 需要添加 import 的檔案類型
const needsImport = (content) => {
  return content.includes('systemLogger') && !content.includes('from \'@/lib/logger\'');
};

// 添加 import statement
const addLoggerImport = (content) => {
  // 檢查是否已經有其他 import
  const importMatch = content.match(/import\s+.*?from\s+['"`][^'"`]+['"`];?\n/);
  if (importMatch) {
    // 在最後一個 import 後添加
    const lastImportIndex = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
    return content.slice(0, lastImportIndex) + 
           "import { systemLogger } from '@/lib/logger';\n" +
           content.slice(lastImportIndex);
  } else {
    // 在檔案開頭添加（'use server' 後）
    if (content.startsWith("'use server'")) {
      return "'use server'\n\nimport { systemLogger } from '@/lib/logger';\n" + 
             content.slice(13);
    } else {
      return "import { systemLogger } from '@/lib/logger';\n\n" + content;
    }
  }
};

// 處理單個檔案
const processFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // 應用替換規則
    replacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });
    
    // 如果有修改且需要 import，添加 import
    if (modified && needsImport(content)) {
      content = addLoggerImport(content);
    }
    
    // 寫回檔案
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 已處理: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ 處理檔案失敗 ${filePath}:`, error.message);
    return false;
  }
};

// 主程序
const main = () => {
  console.log('🔧 開始修復 Console 語句...\n');
  
  // 定義要處理的目錄
  const patterns = [
    'app/actions/**/*.ts',
    'app/admin/components/dashboard/widgets/**/*.tsx',
    'app/components/**/*.tsx',
    'app/hooks/**/*.tsx'
  ];
  
  let totalProcessed = 0;
  let totalModified = 0;
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { 
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/coverage-lib/**']
    });
    
    console.log(`📂 處理模式: ${pattern} (${files.length} 個檔案)`);
    
    files.forEach(file => {
      totalProcessed++;
      if (processFile(file)) {
        totalModified++;
      }
    });
  });
  
  console.log(`\n📊 完成統計:`);
  console.log(`   總處理檔案: ${totalProcessed}`);
  console.log(`   修改檔案: ${totalModified}`);
  console.log(`   未修改檔案: ${totalProcessed - totalModified}`);
};

// 執行
if (require.main === module) {
  main();
}

module.exports = { processFile, addLoggerImport, replacements };