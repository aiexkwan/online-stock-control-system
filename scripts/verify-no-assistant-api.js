#!/usr/bin/env node

/**
 * 驗證腳本：確保項目中沒有 Assistant API 調用
 * 使用方法: node scripts/verify-no-assistant-api.js
 */

const fs = require('fs');
const path = require('path');

// 需要檢查的關鍵詞
const ASSISTANT_API_PATTERNS = [
  'AssistantService.getInstance',
  'assistantService.getAssistant',
  'assistantService.createThread',
  'assistantService.uploadFile',
  'assistantService.sendMessage',
  'assistantService.runAndWait',
  'openai.beta.assistants',
  'openai.beta.threads',
  '/api/analyze-order-pdf-assistant',
  'analyze-order-pdf-assistant',
];

// 排除的目錄和文件
const EXCLUDED_PATHS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'scripts/', // 排除所有腳本文件
  'app/services/assistantService.ts', // 已知的 Assistant 服務文件（已禁用）
  'app/services/assistantService.ts.disabled', // 已禁用的文件
  'app/api/analyze-order-pdf-assistant/', // 已知的 Assistant API endpoint（已移除）
  'lib/openai-assistant-config.ts', // Assistant 配置文件（已禁用）
  'lib/openai-assistant-config.ts.disabled', // 已禁用的文件
];

// 需要檢查的文件擴展名
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * 檢查文件是否應該被排除
 */
function shouldExclude(filePath) {
  return EXCLUDED_PATHS.some(excluded => filePath.includes(excluded));
}

/**
 * 遞歸搜索目錄中的文件
 */
function searchFiles(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (shouldExclude(fullPath)) {
      continue;
    }
    
    if (entry.isDirectory()) {
      searchFiles(fullPath, results);
    } else if (FILE_EXTENSIONS.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  
  return results;
}

/**
 * 檢查文件內容是否包含 Assistant API 調用
 */
function checkFileForAssistantAPI(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const findings = [];
  
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    
    for (const pattern of ASSISTANT_API_PATTERNS) {
      if (line.includes(pattern)) {
        findings.push({
          pattern,
          line: lineNum + 1,
          content: line.trim(),
        });
      }
    }
  }
  
  return findings;
}

/**
 * 主要執行函數
 */
function main() {
  console.log('🔍 開始驗證項目中是否有 Assistant API 調用...\n');
  
  const projectRoot = path.join(__dirname, '..');
  const allFiles = searchFiles(projectRoot);
  
  console.log(`📁 檢查 ${allFiles.length} 個文件...\n`);
  
  let totalFindings = 0;
  const problemFiles = [];
  
  for (const filePath of allFiles) {
    const findings = checkFileForAssistantAPI(filePath);
    
    if (findings.length > 0) {
      const relativePath = path.relative(projectRoot, filePath);
      problemFiles.push({ path: relativePath, findings });
      totalFindings += findings.length;
      
      console.log(`❌ ${relativePath}:`);
      for (const finding of findings) {
        console.log(`   第 ${finding.line} 行: ${finding.pattern}`);
        console.log(`   內容: ${finding.content}`);
        console.log('');
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (totalFindings === 0) {
    console.log('✅ 驗證完成！沒有發現 Assistant API 調用。');
    console.log('🎉 系統現在完全使用 Chat Completions API，不會觸發地區限制錯誤。');
  } else {
    console.log(`❌ 發現 ${totalFindings} 個 Assistant API 調用，分佈在 ${problemFiles.length} 個文件中：`);
    
    for (const file of problemFiles) {
      console.log(`   📄 ${file.path} (${file.findings.length} 個調用)`);
    }
    
    console.log('\n⚠️  需要修改這些文件以移除 Assistant API 調用。');
    process.exit(1);
  }
}

// 如果直接運行此腳本
if (require.main === module) {
  main();
}