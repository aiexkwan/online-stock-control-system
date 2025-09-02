#!/usr/bin/env tsx
/**
 * Import 路徑更新腳本
 * 自動更新所有受組件遷移影響的 import 語句
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { Project, SourceFile, ImportDeclaration } from 'ts-morph';
import { format } from 'date-fns';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const MIGRATION_LOG_DIR = path.join(PROJECT_ROOT, 'logs', 'migration');

interface ImportMapping {
  [oldPath: string]: string;
}

class ImportUpdater {
  private project: Project;
  private importMap: ImportMapping = {};
  private dryRun: boolean;
  private verbose: boolean;
  private updatedFiles: Set<string> = new Set();
  private updateCount: number = 0;
  private errors: string[] = [];
  private backupDir: string;

  constructor(options: { dryRun?: boolean; verbose?: boolean } = {}) {
    this.dryRun = options.dryRun ?? false;
    this.verbose = options.verbose ?? true;
    this.backupDir = path.join(PROJECT_ROOT, 'backup', format(new Date(), 'yyyy-MM-dd-HH-mm-ss'));

    // 初始化 TypeScript 專案
    this.project = new Project({
      tsConfigFilePath: path.join(PROJECT_ROOT, 'tsconfig.json'),
      skipAddingFilesFromTsConfig: true,
    });
  }

  async updateImports(importMapPath?: string): Promise<void> {
    console.log(chalk.cyan('🔄 開始更新 import 路徑'));

    if (this.dryRun) {
      console.log(chalk.yellow('⚠️  乾運行模式 - 不會實際修改檔案'));
    }

    // 載入 import 映射
    await this.loadImportMap(importMapPath);

    if (Object.keys(this.importMap).length === 0) {
      console.log(chalk.yellow('⚠️  沒有找到 import 映射'));
      return;
    }

    console.log(chalk.blue(`📝 載入了 ${Object.keys(this.importMap).length} 個映射規則`));

    // 獲取所有需要檢查的檔案
    const files = await this.getSourceFiles();
    console.log(chalk.blue(`🔍 檢查 ${files.length} 個檔案`));

    // 創建備份目錄
    if (!this.dryRun) {
      await fs.ensureDir(this.backupDir);
    }

    // 處理每個檔案
    for (const file of files) {
      await this.processFile(file);
    }

    // 生成報告
    await this.generateReport();

    if (this.errors.length > 0) {
      console.log(chalk.red(`\n❌ 更新完成，但有 ${this.errors.length} 個錯誤`));
      this.errors.forEach(err => console.log(chalk.red(`  - ${err}`)));
    } else {
      console.log(chalk.green(`\n✅ 成功更新 ${this.updateCount} 個 import 語句`));
      console.log(chalk.green(`📁 共修改 ${this.updatedFiles.size} 個檔案`));
    }
  }

  private async loadImportMap(importMapPath?: string): Promise<void> {
    // 嘗試從指定路徑或默認路徑載入
    const mapPath = importMapPath || path.join(MIGRATION_LOG_DIR, 'import-map.json');

    if (!(await fs.pathExists(mapPath))) {
      // 如果沒有現成的映射檔案，創建默認映射
      this.importMap = this.createDefaultImportMap();
      return;
    }

    try {
      this.importMap = await fs.readJSON(mapPath);
    } catch (error) {
      console.log(chalk.yellow(`⚠️  無法載入 import 映射: ${error}`));
      this.importMap = this.createDefaultImportMap();
    }
  }

  private createDefaultImportMap(): ImportMapping {
    return {
      // Core Dialog 組件映射
      '@/components/ui/core/Dialog': '@/components/molecules/dialogs',
      '@/components/ui/core/Dialog/Dialog': '@/components/molecules/dialogs/Dialog',
      '@/components/ui/core/Dialog/ConfirmDialog': '@/components/molecules/dialogs/ConfirmDialog',
      '@/components/ui/core/Dialog/NotificationDialog':
        '@/components/molecules/dialogs/NotificationDialog',
      '@/components/ui/core/Dialog/DialogPresets': '@/components/molecules/dialogs/DialogPresets',

      // Loading 組件映射
      '@/components/ui/loading': '@/components/molecules/loading',
      '@/components/ui/loading/LoadingScreen': '@/components/molecules/loading/LoadingScreen',
      '@/components/ui/loading/LoadingSpinner': '@/components/molecules/loading/LoadingSpinner',
      '@/components/ui/loading/LoadingButton': '@/components/molecules/loading/LoadingButton',

      // Mobile 組件映射
      '@/components/ui/mobile': '@/components/molecules/mobile',
      '@/components/ui/mobile/MobileButton': '@/components/molecules/mobile/MobileButton',
      '@/components/ui/mobile/MobileCard': '@/components/molecules/mobile/MobileCard',
      '@/components/ui/mobile/MobileDialog': '@/components/molecules/mobile/MobileDialog',
      '@/components/ui/mobile/MobileInput': '@/components/molecules/mobile/MobileInput',

      // Layout Universal 組件映射
      '@/components/layout/universal': '@/components/templates/universal',

      // 業務組件映射
      '@/components/print-label-pdf': '@/components/business/printing',
      '@/components/qr-scanner': '@/components/business/scanning',
      '@/components/qr-code': '@/components/business/scanning/qr-code',

      // 相對路徑映射
      '../ui/core/Dialog': '../molecules/dialogs',
      '../ui/loading': '../molecules/loading',
      '../ui/mobile': '../molecules/mobile',
      '../layout/universal': '../templates/universal',
      '../../ui/core/Dialog': '../../molecules/dialogs',
      '../../ui/loading': '../../molecules/loading',
      '../../ui/mobile': '../../molecules/mobile',
      '../../layout/universal': '../../templates/universal',
    };
  }

  private async getSourceFiles(): Promise<SourceFile[]> {
    // 添加所有 TypeScript 和 JavaScript 檔案
    const patterns = [
      'app/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'lib/**/*.{ts,tsx}',
      'hooks/**/*.{ts,tsx}',
      'utils/**/*.{ts,tsx}',
    ];

    const files: SourceFile[] = [];

    for (const pattern of patterns) {
      const globPattern = path.join(PROJECT_ROOT, pattern);
      this.project.addSourceFilesAtPaths(globPattern);
    }

    return this.project.getSourceFiles();
  }

  private async processFile(sourceFile: SourceFile): Promise<void> {
    const filePath = sourceFile.getFilePath();
    const relativePath = path.relative(PROJECT_ROOT, filePath);

    let hasChanges = false;
    const imports = sourceFile.getImportDeclarations();

    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();

      // 檢查是否需要更新
      const newPath = this.findNewPath(moduleSpecifier);
      if (newPath) {
        if (this.verbose) {
          console.log(chalk.gray(`  📝 ${relativePath}`));
          console.log(chalk.yellow(`     ${moduleSpecifier} → ${newPath}`));
        }

        // 更新 import 路徑
        importDecl.setModuleSpecifier(newPath);
        hasChanges = true;
        this.updateCount++;
      }
    }

    // 如果有變更，保存檔案
    if (hasChanges) {
      this.updatedFiles.add(relativePath);

      if (!this.dryRun) {
        // 備份原始檔案
        const backupPath = path.join(this.backupDir, relativePath);
        await fs.ensureDir(path.dirname(backupPath));
        await fs.copy(filePath, backupPath);

        // 保存修改
        await sourceFile.save();
      }
    }
  }

  private findNewPath(oldPath: string): string | null {
    // 直接匹配
    if (this.importMap[oldPath]) {
      return this.importMap[oldPath];
    }

    // 嘗試部分匹配
    for (const [oldImport, newImport] of Object.entries(this.importMap)) {
      if (oldPath.includes(oldImport)) {
        return oldPath.replace(oldImport, newImport);
      }
    }

    return null;
  }

  private async generateReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      dryRun: this.dryRun,
      totalUpdates: this.updateCount,
      filesModified: this.updatedFiles.size,
      backupLocation: this.dryRun ? 'N/A (dry run)' : this.backupDir,
      modifiedFiles: Array.from(this.updatedFiles),
      errors: this.errors,
    };

    const reportPath = path.join(
      MIGRATION_LOG_DIR,
      `import-update-report-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`
    );

    if (!this.dryRun) {
      await fs.ensureDir(MIGRATION_LOG_DIR);
      await fs.writeJSON(reportPath, report, { spaces: 2 });
      console.log(chalk.blue(`\n📊 更新報告已保存至: ${reportPath}`));
    }
  }

  async rollback(backupPath: string): Promise<void> {
    console.log(chalk.cyan(`🔄 開始回滾 import 更新`));
    console.log(chalk.blue(`📁 從備份恢復: ${backupPath}`));

    if (!(await fs.pathExists(backupPath))) {
      console.log(chalk.red('❌ 備份目錄不存在'));
      return;
    }

    // 獲取所有備份檔案
    const backupFiles = await this.getBackupFiles(backupPath);

    for (const file of backupFiles) {
      const relativePath = path.relative(backupPath, file);
      const targetPath = path.join(PROJECT_ROOT, relativePath);

      try {
        await fs.copy(file, targetPath, { overwrite: true });
        console.log(chalk.green(`  ✓ 恢復 ${relativePath}`));
      } catch (error) {
        console.log(chalk.red(`  ✗ 無法恢復 ${relativePath}: ${error}`));
      }
    }

    console.log(chalk.green('\n✅ 回滾完成'));
  }

  private async getBackupFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    async function walk(currentDir: string) {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    }

    await walk(dir);
    return files;
  }
}

// 主執行函數
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const verbose = !args.includes('--quiet') && !args.includes('-q');
  const rollbackPath = args.find(arg => arg.startsWith('--rollback='))?.split('=')[1];

  const updater = new ImportUpdater({ dryRun, verbose });

  try {
    if (rollbackPath) {
      await updater.rollback(rollbackPath);
    } else {
      await updater.updateImports();
    }
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('更新失敗:'), error);
    process.exit(1);
  }
}

// 執行
if (require.main === module) {
  main();
}

export { ImportUpdater };
