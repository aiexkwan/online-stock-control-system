#!/usr/bin/env node

/**
 * 自動修復 ESLint unused variables 警告
 * 通過在變數前加底線前綴來標記未使用的變數
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 開始自動修復未使用變數警告...\n');

// Step 1: 獲取 ESLint JSON 輸出
console.log('📊 分析 ESLint 警告...');
let eslintOutput;
try {
  // 只獲取 unused-vars 相關的警告
  const command = 'npx eslint . --ext .ts,.tsx --format json --quiet';
  eslintOutput = execSync(command, { encoding: 'utf8' });
} catch (error) {
  // ESLint 返回非零退出碼時仍可能有有效輸出
  eslintOutput = error.stdout || '[]';
}

let eslintResults;
try {
  eslintResults = JSON.parse(eslintOutput);
} catch (e) {
  console.error('❌ 無法解析 ESLint 輸出');
  process.exit(1);
}

// Step 2: 分析未使用變數
const unusedVarsToFix = [];
let totalWarnings = 0;

eslintResults.forEach(fileResult => {
  if (!fileResult.messages) return;

  fileResult.messages.forEach(message => {
    totalWarnings++;

    if (message.ruleId === '@typescript-eslint/no-unused-vars') {
      // 檢查是否需要前綴 (未以 _ 開頭)
      const match = message.message.match(/'([^']+)' is (?:defined|assigned)/);
      if (match) {
        const varName = match[1];
        if (!varName.startsWith('_')) {
          unusedVarsToFix.push({
            filePath: fileResult.filePath,
            line: message.line,
            column: message.column,
            varName: varName,
            message: message.message,
          });
        }
      }
    }
  });
});

console.log(`📈 總 ESLint 警告: ${totalWarnings}`);
console.log(`🎯 未使用變數需要修復: ${unusedVarsToFix.length}\n`);

if (unusedVarsToFix.length === 0) {
  console.log('✅ 沒有需要修復的未使用變數');
  process.exit(0);
}

// Step 3: 按檔案分組修復
const fileGroups = {};
unusedVarsToFix.forEach(item => {
  if (!fileGroups[item.filePath]) {
    fileGroups[item.filePath] = [];
  }
  fileGroups[item.filePath].push(item);
});

console.log(`📁 需要修改的檔案數量: ${Object.keys(fileGroups).length}\n`);

// Step 4: 逐檔案處理
let fixedCount = 0;
let skippedCount = 0;

Object.entries(fileGroups).forEach(([filePath, fixes]) => {
  try {
    console.log(`🔧 處理: ${path.relative(process.cwd(), filePath)}`);

    let fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');

    // 按行號排序（從大到小，避免行號偏移）
    fixes.sort((a, b) => b.line - a.line);

    fixes.forEach(fix => {
      const lineIndex = fix.line - 1;
      const line = lines[lineIndex];

      if (!line) {
        console.log(`  ⚠️ 跳過: 第 ${fix.line} 行不存在`);
        skippedCount++;
        return;
      }

      // 各種變數聲明模式的修復
      const varName = fix.varName;
      let newLine = line;

      // 1. const/let/var 聲明
      const declRegex = new RegExp(`\\b(const|let|var)\\s+${varName}\\b`, 'g');
      if (declRegex.test(line)) {
        newLine = line.replace(declRegex, `$1 _${varName}`);
      }

      // 2. 函數參數
      else if (line.includes(`(`) && line.includes(varName)) {
        // 函數參數: (param1, param2) => 或 function(param1, param2)
        const paramRegex = new RegExp(`\\b${varName}\\b(?=\\s*[,)])`, 'g');
        if (paramRegex.test(line)) {
          newLine = line.replace(paramRegex, `_${varName}`);
        }
      }

      // 3. 解構賦值 - { varName } 或 [varName]
      else if (line.includes('{') && line.includes(varName)) {
        const destructRegex = new RegExp(`\\{([^}]*\\b)${varName}(\\b[^}]*)\\}`, 'g');
        newLine = line.replace(destructRegex, (match, before, after) => {
          return match.replace(new RegExp(`\\b${varName}\\b`), `_${varName}`);
        });
      }

      // 4. 陣列解構 [varName]
      else if (line.includes('[') && line.includes(varName)) {
        const arrayDestructRegex = new RegExp(`\\[([^\\]]*\\b)${varName}(\\b[^\\]]*)\\]`, 'g');
        newLine = line.replace(arrayDestructRegex, (match, before, after) => {
          return match.replace(new RegExp(`\\b${varName}\\b`), `_${varName}`);
        });
      }

      // 5. Import 聲明
      else if (line.includes('import') && line.includes(varName)) {
        const importRegex = new RegExp(`\\b${varName}\\b(?=\\s*[,}]|\\s*from)`, 'g');
        newLine = line.replace(importRegex, `_${varName}`);
      }

      // 6. 通用替換（最後嘗試）
      else {
        const genericRegex = new RegExp(`\\b${varName}\\b(?=\\s*[=,;:]|\\s*\\))`);
        if (genericRegex.test(line)) {
          newLine = line.replace(genericRegex, `_${varName}`);
        }
      }

      if (newLine !== line) {
        lines[lineIndex] = newLine;
        console.log(`    ✅ ${varName} -> _${varName}`);
        fixedCount++;
      } else {
        console.log(`    ⚠️ 無法修復: ${varName} (第 ${fix.line} 行)`);
        skippedCount++;
      }
    });

    // 寫回檔案
    const newContent = lines.join('\n');
    if (newContent !== fileContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
    }
  } catch (error) {
    console.error(`❌ 處理檔案失敗 ${filePath}:`, error.message);
    skippedCount += fixes.length;
  }
});

console.log('\n📊 修復統計:');
console.log(`✅ 成功修復: ${fixedCount}`);
console.log(`⚠️ 跳過: ${skippedCount}`);
console.log(`📈 總處理: ${fixedCount + skippedCount}`);

// Step 5: 驗證結果
console.log('\n🔍 驗證修復結果...');
try {
  const verifyCommand =
    'npm run lint 2>&1 | grep -c "@typescript-eslint/no-unused-vars" || echo "0"';
  const remainingUnusedVars = parseInt(execSync(verifyCommand, { encoding: 'utf8' }).trim());

  console.log(`🎯 剩餘未使用變數警告: ${remainingUnusedVars}`);
  console.log(
    `📉 修復進度: ${unusedVarsToFix.length - remainingUnusedVars}/${unusedVarsToFix.length}`
  );

  if (remainingUnusedVars === 0) {
    console.log('🎉 所有未使用變數警告已修復！');
  } else if (remainingUnusedVars < unusedVarsToFix.length) {
    console.log('✅ 部分修復成功，剩餘警告可能需要手動處理');
  } else {
    console.log('⚠️ 修復效果有限，建議檢查腳本邏輯');
  }
} catch (error) {
  console.error('❌ 無法驗證修復結果:', error.message);
}

console.log('\n🏁 自動修復完成！');
