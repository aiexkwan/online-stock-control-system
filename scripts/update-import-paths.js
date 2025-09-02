#!/usr/bin/env node

/**
 * 組件架構遷移 - 自動更新 Import 路徑腳本
 *
 * 此腳本會系統性地更新所有組件的 import 路徑，從舊的架構遷移到新的 Atomic Design 結構
 *
 * 主要功能：
 * 1. 分析所有 TypeScript 文件中的 import 語句
 * 2. 識別需要更新的舊路徑模式
 * 3. 自動轉換為新的路徑結構
 * 4. 生成詳細的變更報告
 *
 * 運行方式：node scripts/update-import-paths.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 配置
const CONFIG = {
  // 要掃描的文件模式
  filePatterns: ['**/*.ts', '**/*.tsx'],
  // 排除的目錄
  excludePatterns: [
    'node_modules/**',
    '.archon/**',
    '.next/**',
    'build/**',
    'dist/**',
    'coverage/**',
  ],
  // 專案根目錄
  rootDir: process.cwd(),
  // 備份目錄
  backupDir: '.import-migration-backup',
  // 是否實際執行更新（false 為預覽模式）
  dryRun: process.argv.includes('--dry-run'),
  // 是否詳細輸出
  verbose: process.argv.includes('--verbose'),
};

// 路徑映射規則
const PATH_MAPPINGS = {
  // 舊的 app/components 路徑映射
  '@/app/components/qc-label-form/': '@/components/business/forms/qc-label/',
  '@/app/components/analytics/': '@/components/business/analytics/',
  '@/app/components/reports/': '@/components/business/reports/',
  '@/app/components/admin/': '@/components/domain/admin/',
  '@/app/components/shared/': '@/components/business/shared/',
  '@/app/components/providers/': '@/components/providers/',
  '@/app/components/visual-system/': '@/components/utilities/visual-system/',
  '@/app/components/print-label-pdf/': '@/components/business/printing/',

  // 相對路徑映射（需要更智能的處理）
  '../components/qc-label-form/': '@/components/business/forms/qc-label/',
  '../components/analytics/': '@/components/business/analytics/',
  '../components/reports/': '@/components/business/reports/',
  '../components/admin/': '@/components/domain/admin/',
  '../components/shared/': '@/components/business/shared/',
  '../components/': '@/components/business/shared/',

  // 特定組件的映射
  '@/app/(app)/admin/components/EnhancedProgressBar':
    '@/components/business/shared/EnhancedProgressBar',
  '@/app/(app)/admin/components/ClockNumberConfirmDialog':
    '@/components/business/shared/ClockNumberConfirmDialog',

  // 其他常見路徑
  '@/components/ui/core/Dialog': '@/components/molecules/dialogs/Dialog',
  '@/components/ui/loading': '@/components/molecules/loading',
  '@/components/ui/mobile': '@/components/molecules/mobile',
  '@/components/layout/universal': '@/components/templates/universal',
  '@/components/print-label-pdf': '@/components/business/printing',
  '@/components/qr-scanner': '@/components/business/scanning',
};

// 統計資訊
const STATS = {
  filesScanned: 0,
  filesWithChanges: 0,
  totalChanges: 0,
  backupCreated: false,
  errors: [],
  warnings: [],
  changes: [],
};

/**
 * 記錄訊息
 * @param {string} level - 訊息級別 (info, warn, error, success)
 * @param {string} message - 訊息內容
 */
function log(level, message) {
  const colors = {
    info: '\x1b[36m', // cyan
    warn: '\x1b[33m', // yellow
    error: '\x1b[31m', // red
    success: '\x1b[32m', // green
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
 * 創建備份目錄
 */
function createBackup() {
  const backupPath = path.join(CONFIG.rootDir, CONFIG.backupDir);

  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(
      path.join(backupPath, `backup-info-${timestamp}.json`),
      JSON.stringify(
        {
          timestamp,
          reason: '組件架構遷移 - Import 路徑更新',
          totalFiles: STATS.filesScanned,
          version: require('../package.json').version,
        },
        null,
        2
      )
    );
    STATS.backupCreated = true;
    log('success', `備份目錄已創建: ${backupPath}`);
  }
}

/**
 * 分析文件中的 import 語句
 * @param {string} content - 文件內容
 * @param {string} filePath - 文件路徑
 * @returns {Array} 需要更新的 import 語句列表
 */
function analyzeImports(content, filePath) {
  const imports = [];

  // 匹配各種 import 模式
  const importRegexes = [
    // import ... from '...'
    /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"`]([^'"`]+)['"`]/g,
    // import('...')
    /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    // require('...')
    /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  ];

  importRegexes.forEach(regex => {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const importPath = match[1];
      const fullMatch = match[0];

      // 檢查是否需要更新
      const newPath = findNewPath(importPath, filePath);
      if (newPath && newPath !== importPath) {
        imports.push({
          original: fullMatch,
          oldPath: importPath,
          newPath: newPath,
          line: content.substring(0, match.index).split('\n').length,
        });
      }
    }
  });

  return imports;
}

/**
 * 根據舊路徑找到新路徑
 * @param {string} oldPath - 舊的 import 路徑
 * @param {string} currentFilePath - 當前文件路徑
 * @returns {string|null} 新路徑或 null
 */
function findNewPath(oldPath, currentFilePath) {
  // 直接映射檢查
  for (const [oldPattern, newPattern] of Object.entries(PATH_MAPPINGS)) {
    if (oldPath.startsWith(oldPattern)) {
      return oldPath.replace(oldPattern, newPattern);
    }
  }

  // 處理相對路徑
  if (oldPath.startsWith('../') || oldPath.startsWith('./')) {
    return handleRelativePath(oldPath, currentFilePath);
  }

  return null;
}

/**
 * 處理相對路徑的轉換
 * @param {string} relativePath - 相對路徑
 * @param {string} currentFilePath - 當前文件路徑
 * @returns {string|null} 轉換後的絕對路徑或 null
 */
function handleRelativePath(relativePath, currentFilePath) {
  // 解析絕對路徑
  const currentDir = path.dirname(currentFilePath);
  const absolutePath = path.resolve(currentDir, relativePath);
  const relativeToProjRoot = path.relative(CONFIG.rootDir, absolutePath);

  // 檢查是否指向組件目錄
  if (relativeToProjRoot.includes('components')) {
    // 根據路徑模式判斷新的位置
    if (relativeToProjRoot.includes('qc-label-form')) {
      return relativePath.replace(
        /\.\.\/.*?components\/qc-label-form\//,
        '@/components/business/forms/qc-label/'
      );
    }
    if (relativeToProjRoot.includes('analytics')) {
      return relativePath.replace(
        /\.\.\/.*?components\/analytics\//,
        '@/components/business/analytics/'
      );
    }
    if (relativeToProjRoot.includes('reports')) {
      return relativePath.replace(
        /\.\.\/.*?components\/reports\//,
        '@/components/business/reports/'
      );
    }
    if (relativeToProjRoot.includes('admin')) {
      return relativePath.replace(/\.\.\/.*?components\/admin\//, '@/components/domain/admin/');
    }
    if (relativeToProjRoot.includes('shared')) {
      return relativePath.replace(/\.\.\/.*?components\/shared\//, '@/components/business/shared/');
    }
    // 一般組件
    if (relativePath.includes('../components/')) {
      return relativePath.replace(/\.\.\/.*?components\//, '@/components/business/shared/');
    }
  }

  return null;
}

/**
 * 更新文件內容
 * @param {string} filePath - 文件路徑
 * @param {Array} importsToUpdate - 需要更新的 import 列表
 * @returns {boolean} 是否有進行更新
 */
function updateFileContent(filePath, importsToUpdate) {
  if (importsToUpdate.length === 0) return false;

  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  // 按行號倒序處理，避免位置偏移
  importsToUpdate.sort((a, b) => b.line - a.line);

  importsToUpdate.forEach(importInfo => {
    const newImportStatement = importInfo.original.replace(importInfo.oldPath, importInfo.newPath);

    if (content.includes(importInfo.original)) {
      content = content.replace(importInfo.original, newImportStatement);
      hasChanges = true;

      STATS.changes.push({
        file: filePath,
        line: importInfo.line,
        from: importInfo.oldPath,
        to: importInfo.newPath,
        statement: {
          old: importInfo.original,
          new: newImportStatement,
        },
      });

      if (CONFIG.verbose) {
        log(
          'info',
          `  ${path.basename(filePath)}:${importInfo.line} ${importInfo.oldPath} → ${importInfo.newPath}`
        );
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
 * @param {string} filePath - 文件路徑
 */
function processFile(filePath) {
  try {
    STATS.filesScanned++;

    const content = fs.readFileSync(filePath, 'utf8');
    const importsToUpdate = analyzeImports(content, filePath);

    if (importsToUpdate.length > 0) {
      STATS.filesWithChanges++;
      STATS.totalChanges += importsToUpdate.length;

      if (CONFIG.verbose) {
        log(
          'info',
          `處理文件: ${path.relative(CONFIG.rootDir, filePath)} (${importsToUpdate.length} 個變更)`
        );
      }

      const updated = updateFileContent(filePath, importsToUpdate);

      if (!updated) {
        STATS.warnings.push(`文件 ${filePath} 分析出變更但更新失敗`);
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
 * 生成變更報告
 */
function generateReport() {
  const reportPath = path.join(CONFIG.rootDir, 'import-migration-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    config: {
      dryRun: CONFIG.dryRun,
      rootDir: CONFIG.rootDir,
    },
    statistics: STATS,
    pathMappings: PATH_MAPPINGS,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log('success', `變更報告已生成: ${reportPath}`);

  // 控制台摘要
  console.log('\n' + '='.repeat(60));
  console.log('組件 Import 路徑更新摘要');
  console.log('='.repeat(60));
  console.log(`掃描文件數量: ${STATS.filesScanned}`);
  console.log(`有變更的文件: ${STATS.filesWithChanges}`);
  console.log(`總變更數量: ${STATS.totalChanges}`);
  console.log(`錯誤數量: ${STATS.errors.length}`);
  console.log(`警告數量: ${STATS.warnings.length}`);
  console.log(`執行模式: ${CONFIG.dryRun ? '預覽模式 (未實際修改)' : '實際更新模式'}`);

  if (STATS.errors.length > 0) {
    console.log('\n錯誤詳情:');
    STATS.errors.forEach(error => {
      console.log(`  ${error.file}: ${error.error}`);
    });
  }

  if (STATS.warnings.length > 0) {
    console.log('\n警告詳情:');
    STATS.warnings.forEach(warning => {
      console.log(`  ${warning}`);
    });
  }
}

/**
 * 主執行函數
 */
async function main() {
  log('info', '開始組件 Import 路徑更新...');
  log('info', `執行模式: ${CONFIG.dryRun ? '預覽模式' : '實際更新模式'}`);

  if (!CONFIG.dryRun) {
    createBackup();
  }

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
    log('warn', '預覽模式完成！要實際執行更新，請使用: node scripts/update-import-paths.js');
  } else {
    log('success', '組件 Import 路徑更新完成！');
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

module.exports = { main, CONFIG, PATH_MAPPINGS };
