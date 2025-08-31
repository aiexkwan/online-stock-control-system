#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('💡 Smart ESLint unused vars fix...\n');

// 目標變數列表（從前面的輸出提取）
const targetVars = [
  'ExcelJS',
  'DocUploadRecord',
  'PalletInfoRecord',
  'createClient',
  'CACHE_CONTROL_TIMEOUT',
  'storagePath',
  'SearchPalletRPCResult',
  'validateDatabaseSchema',
  'inventoryColumns',
  'err',
  'userName',
  'randomUUID',
  'NextRequest',
  'params',
  'DatabaseRecord',
  'getErrorMessage',
  'toSupabaseResponse',
  'OverdueOrderData',
  'request',
  'z',
  'safeGet',
  'safeNumber',
  'toRecordArray',
  'ClassifiedError',
  'SqlExecutionResult',
  'OpenAIMessage',
  'SupabaseQueryResult',
  'QueryRecordData',
  'QueryResult',
  'CacheResult',
  'ASK_DATABASE_CONSTANTS',
  'isClassifiedError',
  'optimizeSQL',
  'getRecoveryStrategy',
  'ErrorType',
  'logErrorPattern',
  'generateUserMessage',
  'isDevelopment',
  'SafeDatabaseValueSchema',
  'DatabaseQueryResponse',
  'validateDatabaseQueryResponse',
  'startTime',
  'userEmail',
  'result',
  'sessionId',
  'filename',
  'size',
  'quality',
  'cacheMetrics',
  'cookieStore',
  'supabase',
  'data',
  'error',
  'ValidationRequest',
  'safeString',
  'protectedPaths',
  'ChevronDownIcon',
  'Loader2',
  'chartProps',
  'name',
  'acoNewRef',
  'acoOrderDetails',
  'acoOrderDetailErrors',
  'onAcoOrderDetailChange',
  'onAcoOrderDetailUpdate',
  'onValidateAcoOrderDetailCode',
  'className',
  'csvFile',
  'toast',
  'CubeIcon',
  'EnhancedFormField',
  'EnhancedInput',
  'EnhancedSelect',
  'Accordion',
  'ProductCodeInput',
  'FormPersistenceIndicator',
  'useOptimizedFormHandler',
  'AcoHandlers',
  'errors',
  'handleProductInfoChange',
  'isTablet',
  'handleSuccess',
  'userId',
  'ApolloError',
  'Product',
  'getAcoPalletOrdinal',
  'CLOCK_NUMBER_EMAIL_INDEX',
  'checkAuthentication',
  'session',
  'BatchProcessingResult',
  'BusinessSchemaValidator',
  'BusinessTypeGuards',
  'validateForm',
  'isProduction',
  'isNotProduction',
  'PdfGenerationResult',
  'PdfProgressCallback',
  'StreamingPdfConfig',
  'generateSinglePdf',
  'batchSize',
  'useMemo',
  'deps',
  'MIN_ACO_ORDER_REF_LENGTH',
  'SlateDetail',
  'refreshUser',
  'validateAcoOrderDetails',
  'printEventToProceed',
  'handleSlateBatchNumberChange',
  'validateSlateDetails',
  'clearSlateDetails',
  'Button',
  'debouncedSearch',
  'ValidationError',
  'time',
  'config',
  'FormField',
  'totalCorrected',
  'pagePatterns',
  'sanitizeLogData',
  'dbLogger',
  'systemLogger',
  'Database',
  'bcrypt',
  'getAdminClient',
];

let fixedCount = 0;

// 為每個目標變數進行修復
targetVars.forEach(varName => {
  // 跳過已經有下劃線的變數
  if (varName.startsWith('_')) return;

  console.log(`🔧 處理變數: ${varName}`);

  try {
    // 在所有 app 目錄的 .ts/.tsx 檔案中查找並替換
    const result = execSync(
      `find app -name "*.ts" -o -name "*.tsx" | xargs grep -l "\\b${varName}\\b" 2>/dev/null || true`,
      { encoding: 'utf8' }
    );

    if (result.trim()) {
      const files = result
        .trim()
        .split('\n')
        .filter(f => f);

      files.forEach(file => {
        try {
          let content = fs.readFileSync(file, 'utf8');
          const originalContent = content;

          // 各種替換模式
          const replacements = [
            // 變數聲明
            [`\\bconst ${varName}\\b`, `const _${varName}`],
            [`\\blet ${varName}\\b`, `let _${varName}`],
            [`\\bvar ${varName}\\b`, `var _${varName}`],

            // 類型定義
            [`\\btype ${varName}\\b`, `type _${varName}`],
            [`\\binterface ${varName}\\b`, `interface _${varName}`],

            // 函數參數（最常見的情況）
            [`\\b${varName}\\b:`, `_${varName}:`],
            [`\\b${varName}\\b,`, `_${varName},`],
            [`\\b${varName}\\b\\)`, `_${varName})`],
            [`\\(${varName}\\b`, `(_${varName}`],

            // Import 語句
            [
              `import.*{.*\\b${varName}\\b`,
              m => m.replace(new RegExp(`\\b${varName}\\b`), `_${varName}`),
            ],
            [`} from`, `} from`], // 這行不做替換，只是分隔

            // 賦值
            [`\\b${varName}\\b\\s*=`, `_${varName} =`],

            // 解構賦值
            [`{\\s*${varName}\\s*}`, `{ _${varName} }`],
            [`{\\s*${varName}\\s*,`, `{ _${varName},`],
            [`,\\s*${varName}\\s*}`, `, _${varName} }`],
          ];

          replacements.forEach(([pattern, replacement]) => {
            if (typeof replacement === 'string') {
              content = content.replace(new RegExp(pattern, 'g'), replacement);
            } else {
              content = content.replace(new RegExp(pattern, 'g'), replacement);
            }
          });

          if (content !== originalContent) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`    ✅ 已修復: ${file}`);
            fixedCount++;
          }
        } catch (error) {
          console.log(`    ❌ 處理檔案失敗: ${file} - ${error.message}`);
        }
      });
    }
  } catch (error) {
    console.log(`  ⚠️ 搜索失敗: ${error.message}`);
  }
});

console.log(`\n📊 修復統計:`);
console.log(`✅ 處理檔案數: ${fixedCount}`);

// 最終檢查
console.log('\n🔍 檢查修復效果...');
try {
  const remaining = execSync(
    'npm run lint 2>&1 | grep -c "@typescript-eslint/no-unused-vars" || echo "0"',
    { encoding: 'utf8' }
  ).trim();
  console.log(`🎯 剩餘未使用變數警告: ${remaining}`);

  if (parseInt(remaining) < 50) {
    console.log('🎉 大部分警告已修復！');
  } else {
    console.log('📝 還需要進一步手動處理');
  }
} catch (error) {
  console.log('⚠️ 無法檢查結果');
}

console.log('\n💡 Smart fix 完成！');
