#!/usr/bin/env node

/**
 * 修復 Import 路徑腳本
 *
 * 修正上一次更新中指向不存在位置的 import 路徑，
 * 將它們指向實際存在的組件位置
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 配置
const CONFIG = {
  filePatterns: ['**/*.ts', '**/*.tsx'],
  excludePatterns: [
    'node_modules/**',
    '.archon/**',
    '.next/**',
    'build/**',
    'dist/**',
    'coverage/**',
  ],
  rootDir: process.cwd(),
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
};

// 修正的路徑映射 - 將錯誤的新路徑映射回實際存在的位置
const CORRECTIVE_MAPPINGS = {
  // ChatBot相關組件 - 映射回 admin components
  '@/components/business/shared/ChatHeader': '../components/ChatHeader',
  '@/components/business/shared/ChatMessages': '../components/ChatMessages',
  '@/components/business/shared/ChatInput': '../components/ChatInput',
  '@/components/business/shared/QuerySuggestions': '../components/QuerySuggestions',
  '@/components/business/shared/MemoryDashboard': '../components/MemoryDashboard',

  // QC Label 相關組件 - 映射回實際位置
  '@/components/business/shared/qc-label-constants': '../components/qc-label-constants',
  '@/components/business/shared/GridBasicProductFormGraphQL':
    '../components/GridBasicProductFormGraphQL',
  '@/components/business/shared/UserIdVerificationDialog': '../components/UserIdVerificationDialog',
  '@/components/business/forms/qc-label/ProductCodeInputGraphQL':
    '@/app/components/qc-label-form/ProductCodeInputGraphQL',
  '@/components/business/forms/qc-label/RemarkFormatter':
    '@/app/components/qc-label-form/RemarkFormatter',
  '@/components/business/forms/qc-label/types': '@/app/components/qc-label-form/types',
  '@/components/business/forms/qc-label/ProductCodeInput':
    '@/app/components/qc-label-form/ProductCodeInput',
  '@/components/business/forms/qc-label/hooks/useMediaQuery':
    '@/app/components/qc-label-form/hooks/useMediaQuery',
  '@/components/business/forms/qc-label/services/ErrorHandler':
    '@/app/components/qc-label-form/services/ErrorHandler',

  // Shared 組件 - 映射回 admin components/shared
  '@/components/business/shared/shared': '../components/shared',

  // UI 組件 - 映射回正確的 UI 路徑
  '@/components/business/shared/ui/button': '@/components/ui/button',
  '@/components/business/shared/ui/card': '@/components/ui/card',
  '@/components/business/shared/ui/alert': '@/components/ui/alert',
  '@/components/business/shared/ui/input': '@/components/ui/input',
  '@/components/business/shared/ui/dialog': '@/components/ui/dialog',
  '@/components/business/shared/ui/calendar': '@/components/ui/calendar',

  // Provider 組件 - 移動到正確位置
  '@/components/providers/FullProviders': '@/app/components/providers/FullProviders',
  '@/components/utilities/visual-system/core/ClientVisualSystemProvider':
    '@/app/components/visual-system/core/ClientVisualSystemProvider',
  '@/components/utilities/visual-system/core/UnifiedBackground':
    '@/app/components/visual-system/core/UnifiedBackground',
  '@/components/utilities/visual-system/core/VisualSystemProvider':
    '@/app/components/visual-system/core/VisualSystemProvider',

  // 報告系統組件 - 映射回實際位置
  '@/components/business/reports/UnifiedExportAllDataDialog':
    '@/app/components/reports/UnifiedExportAllDataDialog',
  '@/components/business/reports/core/UnifiedReportDialog':
    '@/app/components/reports/core/UnifiedReportDialog',
  '@/components/business/reports/core/ReportRegistry':
    '@/app/components/reports/core/ReportRegistry',
  '@/components/business/reports/core/ReportConfig': '@/app/components/reports/core/ReportConfig',
  '@/components/business/reports/dataSources/OrderLoadingDataSource':
    '@/app/components/reports/dataSources/OrderLoadingDataSource',

  // Auth 相關組件 - 映射到實際位置（如果存在）
  '@/components/business/shared/ChangePasswordForm':
    '@/app/(auth)/main-login/components/ChangePasswordForm',
  '@/components/business/shared/RegisterForm': '@/app/(auth)/main-login/components/RegisterForm',
  '@/components/business/shared/EmailConfirmation':
    '@/app/(auth)/main-login/components/EmailConfirmation',

  // 列印相關組件
  '@/components/business/shared/print-label-pdf/PrintLabelPdf':
    '@/components/print-label-pdf/PrintLabelPdf',

  // 掃描相關組件 - 已正確映射到新位置
  // '@/components/business/scanning/simple-qr-scanner': '@/components/qr-scanner/simple-qr-scanner',
};

// 統計
const STATS = {
  filesScanned: 0,
  filesFixed: 0,
  totalFixes: 0,
  errors: [],
  fixes: [],
};

/**
 * 記錄訊息
 */
function log(level, message) {
  const colors = {
    info: '\x1b[36m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
    success: '\x1b[32m',
    reset: '\x1b[0m',
  };

  const prefix = {
    info: 'ℹ',
    warn: '⚠',
    error: '✗',
    success: '✓',
  };

  console.log(`${colors[level]}${prefix[level]} ${message}${colors.reset}`);
}

/**
 * 檢查文件是否需要修復特定的 import
 */
function needsImportFix(content, filePath) {
  const fixes = [];

  Object.entries(CORRECTIVE_MAPPINGS).forEach(([badPath, correctPath]) => {
    // 處理相對路徑：需要根據當前文件位置調整
    let actualCorrectPath = correctPath;
    if (correctPath.startsWith('../')) {
      // 相對路徑需要保持原樣，因為它們是相對於各個文件的
      actualCorrectPath = correctPath;
    }

    // 匹配各種 import 模式
    const importRegexes = [
      new RegExp(
        `import\\s+(?:{[^}]*}|\\*\\s+as\\s+\\w+|\\w+)\\s+from\\s+['"\`]${badPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`,
        'g'
      ),
      new RegExp(
        `import\\s*\\(\\s*['"\`]${badPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]\\s*\\)`,
        'g'
      ),
      new RegExp(
        `require\\s*\\(\\s*['"\`]${badPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]\\s*\\)`,
        'g'
      ),
    ];

    importRegexes.forEach(regex => {
      const matches = [...content.matchAll(regex)];
      matches.forEach(match => {
        fixes.push({
          original: match[0],
          badPath: badPath,
          correctPath: actualCorrectPath,
          line: content.substring(0, match.index).split('\n').length,
        });
      });
    });
  });

  return fixes;
}

/**
 * 修復文件中的 import 語句
 */
function fixFileImports(filePath, fixes) {
  if (fixes.length === 0) return false;

  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  // 按行號倒序處理
  fixes.sort((a, b) => b.line - a.line);

  fixes.forEach(fix => {
    const newStatement = fix.original.replace(fix.badPath, fix.correctPath);

    if (content.includes(fix.original)) {
      content = content.replace(fix.original, newStatement);
      hasChanges = true;

      STATS.fixes.push({
        file: filePath,
        line: fix.line,
        from: fix.badPath,
        to: fix.correctPath,
        statement: {
          old: fix.original,
          new: newStatement,
        },
      });

      if (CONFIG.verbose) {
        log('info', `  ${path.basename(filePath)}:${fix.line} ${fix.badPath} → ${fix.correctPath}`);
      }
    }
  });

  if (hasChanges && !CONFIG.dryRun) {
    fs.writeFileSync(filePath, content);
  }

  return hasChanges;
}

/**
 * 處理單個文件
 */
function processFile(filePath) {
  try {
    STATS.filesScanned++;

    const content = fs.readFileSync(filePath, 'utf8');
    const fixes = needsImportFix(content, filePath);

    if (fixes.length > 0) {
      STATS.filesFixed++;
      STATS.totalFixes += fixes.length;

      if (CONFIG.verbose) {
        log(
          'info',
          `修復文件: ${path.relative(CONFIG.rootDir, filePath)} (${fixes.length} 個修復)`
        );
      }

      const fixed = fixFileImports(filePath, fixes);

      if (!fixed && !CONFIG.dryRun) {
        STATS.errors.push({
          file: filePath,
          error: '分析出修復但更新失敗',
        });
      }
    }
  } catch (error) {
    STATS.errors.push({
      file: filePath,
      error: error.message,
    });

    if (CONFIG.verbose) {
      log('error', `處理文件時出錯 ${filePath}: ${error.message}`);
    }
  }
}

/**
 * 生成修復報告
 */
function generateReport() {
  const reportPath = path.join(CONFIG.rootDir, 'import-fix-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    config: {
      dryRun: CONFIG.dryRun,
      rootDir: CONFIG.rootDir,
    },
    statistics: STATS,
    correctiveMappings: CORRECTIVE_MAPPINGS,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log('success', `修復報告已生成: ${reportPath}`);

  // 控制台摘要
  console.log('\n' + '='.repeat(60));
  console.log('Import 路徑修復摘要');
  console.log('='.repeat(60));
  console.log(`掃描文件數量: ${STATS.filesScanned}`);
  console.log(`修復的文件: ${STATS.filesFixed}`);
  console.log(`總修復數量: ${STATS.totalFixes}`);
  console.log(`錯誤數量: ${STATS.errors.length}`);
  console.log(`執行模式: ${CONFIG.dryRun ? '預覽模式 (未實際修改)' : '實際修復模式'}`);

  if (STATS.errors.length > 0) {
    console.log('\n錯誤詳情:');
    STATS.errors.forEach(error => {
      console.log(`  ${error.file}: ${error.error}`);
    });
  }
}

/**
 * 主執行函數
 */
async function main() {
  log('info', '開始 Import 路徑修復...');
  log('info', `執行模式: ${CONFIG.dryRun ? '預覽模式' : '實際修復模式'}`);

  // 查找所有要處理的文件
  const allFiles = [];
  CONFIG.filePatterns.forEach(pattern => {
    const files = glob.sync(pattern, {
      cwd: CONFIG.rootDir,
      ignore: CONFIG.excludePatterns,
      absolute: true,
    });
    allFiles.push(...files);
  });

  log('info', `找到 ${allFiles.length} 個文件待處理`);

  // 處理所有文件
  allFiles.forEach(processFile);

  // 生成報告
  generateReport();

  if (CONFIG.dryRun) {
    log('warn', '預覽模式完成！要實際執行修復，請使用: node scripts/fix-import-paths.js');
  } else {
    log('success', 'Import 路徑修復完成！');
  }
}

// 錯誤處理
process.on('unhandledRejection', error => {
  log('error', `未處理的錯誤: ${error.message}`);
  process.exit(1);
});

// 執行主函數
if (require.main === module) {
  main().catch(error => {
    log('error', `執行失敗: ${error.message}`);
    process.exit(1);
  });
}
