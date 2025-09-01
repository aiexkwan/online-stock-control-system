#!/usr/bin/env node

/**
 * 最終 Assistant API 清理腳本
 * 徹底移除或禁用所有 Assistant API 相關代碼
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

// 要處理的文件清單
const filesToProcess = [
  // 完全移除或重命名這些文件
  {
    path: 'app/services/assistantService.ts',
    action: 'rename',
    newPath: 'app/services/assistantService.ts.disabled',
  },
  {
    path: 'app/api/analyze-order-pdf-assistant',
    action: 'rename',
    newPath: 'app/api/analyze-order-pdf-assistant.disabled',
  },
  {
    path: 'lib/openai-assistant-config.ts',
    action: 'rename',
    newPath: 'lib/openai-assistant-config.ts.disabled',
  },
];

/**
 * 重命名文件或目錄
 */
function renameFileOrDir(oldPath, newPath) {
  const fullOldPath = path.join(projectRoot, oldPath);
  const fullNewPath = path.join(projectRoot, newPath);

  if (fs.existsSync(fullOldPath)) {
    console.log(`📁 重命名: ${oldPath} → ${newPath}`);
    fs.renameSync(fullOldPath, fullNewPath);
    return true;
  } else {
    console.log(`✅ 文件不存在: ${oldPath}`);
    return false;
  }
}

/**
 * 創建禁用標記文件
 */
function createDisabledMarker(filePath, reason) {
  const markerPath = path.join(projectRoot, filePath + '.DISABLED');
  const content = `// This file has been disabled: ${reason}
// Original file moved to: ${filePath}.disabled
// Date: ${new Date().toISOString()}
// Reason: Vercel regional restrictions for Assistant API (403 error)

export {};
`;

  fs.writeFileSync(markerPath, content);
  console.log(`🚫 創建禁用標記: ${filePath}.DISABLED`);
}

/**
 * 主要執行函數
 */
function main() {
  console.log('🧹 最終 Assistant API 清理\n');

  let totalProcessed = 0;

  // 處理每個文件
  for (const file of filesToProcess) {
    if (file.action === 'rename') {
      const renamed = renameFileOrDir(file.path, file.newPath);
      if (renamed) {
        createDisabledMarker(file.path, 'Assistant API disabled due to regional restrictions');
        totalProcessed++;
      }
    }
  }

  // 檢查是否有其他 Assistant 引用
  console.log('\n🔍 檢查剩餘的 Assistant API 引用...');

  const checkFiles = [
    'app/actions/orderUploadActions.ts',
    'app/services/enhancedOrderExtractionService.ts',
    'app/api/pdf-extract/route.ts',
  ];

  for (const file of checkFiles) {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');

      // 檢查是否仍有 Assistant 相關引用
      const assistantRefs = [
        'AssistantService',
        'assistantService',
        'openai.beta',
        '/api/analyze-order-pdf-assistant',
      ];

      const foundRefs = assistantRefs.filter(ref => content.includes(ref));

      if (foundRefs.length > 0) {
        console.log(`⚠️  ${file} 仍包含引用: ${foundRefs.join(', ')}`);
      } else {
        console.log(`✅ ${file} 已清理`);
      }
    }
  }

  // 創建部署驗證文件
  const deploymentGuide = `# Vercel 部署驗證清單

## ✅ Assistant API 清理完成

### 已禁用的文件
- app/services/assistantService.ts → 重命名為 .disabled
- app/api/analyze-order-pdf-assistant/ → 重命名為 .disabled  
- lib/openai-assistant-config.ts → 重命名為 .disabled

### 當前 PDF 處理流程
1. Frontend → orderUploadActions.analyzeOrderPDF()
2. orderUploadActions → /api/pdf-extract
3. /api/pdf-extract → EnhancedOrderExtractionService
4. EnhancedOrderExtractionService → ChatCompletionService (只用 OpenAI Chat API)

### 驗證步驟
1. 部署到 Vercel
2. 測試 PDF 上傳功能
3. 檢查 Vercel 函數日誌
4. 確認沒有 403 錯誤

### 如果仍然有問題
1. 檢查 Vercel 環境變數:
   - [API_KEY_REDACTED]
   - NEXT_PUBLIC_SUPABASE_URL
   - [SENSITIVE_KEY_REDACTED]
2. 檢查 Next.js 編譯日誌
3. 檢查是否有動態導入

生成時間: ${new Date().toISOString()}
`;

  fs.writeFileSync(path.join(projectRoot, 'VERCEL_DEPLOYMENT_GUIDE.md'), deploymentGuide);
  console.log('\n📝 創建部署驗證指南: VERCEL_DEPLOYMENT_GUIDE.md');

  console.log(`\n✅ 清理完成！處理了 ${totalProcessed} 個文件`);
  console.log('🚀 現在可以重新部署到 Vercel');
  console.log('💡 系統將完全使用 Chat Completions API，不會觸發地區限制');
}

if (require.main === module) {
  main();
}
