#!/usr/bin/env tsx
/**
 * 遷移驗證腳本
 * 驗證組件遷移是否成功，並檢查系統是否正常運作
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const COMPONENTS_DIR = path.join(PROJECT_ROOT, 'components');

interface VerificationResult {
  component: string;
  oldPath: string;
  newPath: string;
  exists: boolean;
  hasIndex: boolean;
  errors: string[];
}

const VERIFICATION_MAP = [
  {
    name: 'Dialog Components',
    oldPath: 'ui/core/Dialog',
    newPath: 'molecules/dialogs',
    files: ['Dialog.tsx', 'ConfirmDialog.tsx', 'NotificationDialog.tsx', 'DialogPresets.tsx'],
  },
  {
    name: 'Loading Components',
    oldPath: 'ui/loading',
    newPath: 'molecules/loading',
    files: ['LoadingScreen.tsx', 'LoadingSpinner.tsx', 'LoadingButton.tsx'],
  },
  {
    name: 'Mobile Components',
    oldPath: 'ui/mobile',
    newPath: 'molecules/mobile',
    files: ['MobileButton.tsx', 'MobileCard.tsx', 'MobileDialog.tsx', 'MobileInput.tsx'],
  },
  {
    name: 'Universal Layout',
    oldPath: 'layout/universal',
    newPath: 'templates/universal',
    files: ['UniversalCard.tsx', 'UniversalContainer.tsx', 'UniversalGrid.tsx'],
  },
  {
    name: 'Printing Components',
    oldPath: 'print-label-pdf',
    newPath: 'business/printing',
    files: ['PrintLabelPdf.tsx', 'index.ts'],
  },
  {
    name: 'Scanning Components',
    oldPath: 'qr-scanner',
    newPath: 'business/scanning',
    files: ['simple-qr-scanner.tsx'],
  },
];

class MigrationVerifier {
  private results: VerificationResult[] = [];
  private totalChecks = 0;
  private passedChecks = 0;
  private failedChecks = 0;

  async verify(): Promise<void> {
    console.log(chalk.cyan('🔍 開始驗證組件遷移\n'));

    // 驗證每個組件群
    for (const component of VERIFICATION_MAP) {
      await this.verifyComponent(component);
    }

    // 驗證相容層
    await this.verifyCompatibilityLayer();

    // 驗證 TypeScript 編譯
    await this.verifyTypeScriptCompilation();

    // 生成報告
    this.generateReport();
  }

  private async verifyComponent(component: {
    name: string;
    oldPath: string;
    newPath: string;
    files: string[];
  }): Promise<void> {
    console.log(chalk.blue(`📦 驗證 ${component.name}`));

    const oldFullPath = path.join(COMPONENTS_DIR, component.oldPath);
    const newFullPath = path.join(COMPONENTS_DIR, component.newPath);
    const errors: string[] = [];

    // 檢查新目錄是否存在
    const newPathExists = await fs.pathExists(newFullPath);

    if (!newPathExists) {
      errors.push(`新目錄不存在: ${component.newPath}`);
      this.failedChecks++;
    } else {
      this.passedChecks++;
      console.log(chalk.green(`  ✓ 新目錄存在: ${component.newPath}`));
    }

    // 檢查每個檔案
    for (const file of component.files) {
      this.totalChecks++;
      const newFilePath = path.join(newFullPath, file);

      if (await fs.pathExists(newFilePath)) {
        this.passedChecks++;
        console.log(chalk.green(`  ✓ ${file}`));
      } else {
        this.failedChecks++;
        errors.push(`檔案缺失: ${file}`);
        console.log(chalk.red(`  ✗ ${file} - 未找到`));
      }
    }

    // 檢查是否有 index 檔案
    const indexPath = path.join(newFullPath, 'index.ts');
    const hasIndex = await fs.pathExists(indexPath);

    this.results.push({
      component: component.name,
      oldPath: component.oldPath,
      newPath: component.newPath,
      exists: newPathExists,
      hasIndex,
      errors,
    });

    if (errors.length === 0) {
      console.log(chalk.green(`  ✅ ${component.name} 遷移成功\n`));
    } else {
      console.log(chalk.yellow(`  ⚠️  ${component.name} 有 ${errors.length} 個問題\n`));
    }
  }

  private async verifyCompatibilityLayer(): Promise<void> {
    console.log(chalk.blue('🔗 驗證相容層'));

    const compatPath = path.join(COMPONENTS_DIR, 'compatibility.ts');

    if (await fs.pathExists(compatPath)) {
      this.passedChecks++;
      console.log(chalk.green('  ✓ 相容層檔案存在'));

      // 檢查檔案內容
      const content = await fs.readFile(compatPath, 'utf-8');

      if (content.includes('MIGRATION_STATUS')) {
        this.passedChecks++;
        console.log(chalk.green('  ✓ 包含遷移狀態追蹤'));
      }

      if (content.includes('checkDeprecatedImport')) {
        this.passedChecks++;
        console.log(chalk.green('  ✓ 包含過時檢查函數'));
      }
    } else {
      this.failedChecks++;
      console.log(chalk.red('  ✗ 相容層檔案不存在'));
    }

    console.log();
  }

  private async verifyTypeScriptCompilation(): Promise<void> {
    console.log(chalk.blue('📝 驗證 TypeScript 編譯'));

    try {
      // 執行 TypeScript 類型檢查（不實際編譯）
      execSync('npx tsc --noEmit', {
        cwd: PROJECT_ROOT,
        stdio: 'pipe',
      });

      this.passedChecks++;
      console.log(chalk.green('  ✓ TypeScript 編譯成功'));
    } catch (error: any) {
      this.failedChecks++;
      console.log(chalk.red('  ✗ TypeScript 編譯失敗'));

      // 顯示部分錯誤訊息
      if (error.stdout) {
        const lines = error.stdout.toString().split('\n').slice(0, 5);
        lines.forEach((line: string) => {
          console.log(chalk.gray(`    ${line}`));
        });
        console.log(chalk.gray('    ...'));
      }
    }

    console.log();
  }

  private generateReport(): void {
    console.log(chalk.cyan('📊 遷移驗證報告\n'));

    // 統計摘要
    console.log(chalk.blue('統計摘要:'));
    console.log(`  總檢查項目: ${this.totalChecks}`);
    console.log(chalk.green(`  ✓ 通過: ${this.passedChecks}`));

    if (this.failedChecks > 0) {
      console.log(chalk.red(`  ✗ 失敗: ${this.failedChecks}`));
    }

    const successRate = (
      (this.passedChecks / (this.passedChecks + this.failedChecks)) *
      100
    ).toFixed(1);
    console.log(`  成功率: ${successRate}%\n`);

    // 詳細結果
    console.log(chalk.blue('組件遷移詳情:'));
    for (const result of this.results) {
      const status = result.errors.length === 0 ? '✅' : '⚠️';
      console.log(`  ${status} ${result.component}`);
      console.log(chalk.gray(`     從: ${result.oldPath}`));
      console.log(chalk.gray(`     到: ${result.newPath}`));

      if (!result.hasIndex) {
        console.log(chalk.yellow(`     ⚠️  缺少 index.ts 檔案`));
      }

      if (result.errors.length > 0) {
        result.errors.forEach(err => {
          console.log(chalk.red(`     ✗ ${err}`));
        });
      }
    }

    // 建議
    console.log(chalk.blue('\n建議:'));

    if (this.failedChecks === 0) {
      console.log(chalk.green('  ✅ 所有遷移驗證通過！'));
      console.log(chalk.green('  ✅ 可以安全地刪除舊組件目錄'));
      console.log(chalk.green('  ✅ 建議運行完整測試套件確認功能正常'));
    } else {
      console.log(chalk.yellow('  ⚠️  發現一些問題需要處理'));
      console.log(chalk.yellow('  ⚠️  請檢查錯誤並手動修復'));
      console.log(chalk.yellow('  ⚠️  修復後再次運行驗證'));
    }

    // 下一步
    console.log(chalk.blue('\n下一步:'));
    console.log('  1. 運行 `npm run build` 確認構建成功');
    console.log('  2. 運行 `npm run test` 確認測試通過');
    console.log('  3. 在開發環境測試功能');
    console.log('  4. 確認無誤後，可刪除舊組件目錄');
    console.log('  5. 更新文檔說明新的組件結構');
  }
}

// 主執行函數
async function main() {
  const verifier = new MigrationVerifier();

  try {
    await verifier.verify();
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('驗證失敗:'), error);
    process.exit(1);
  }
}

// 執行
if (require.main === module) {
  main();
}

export { MigrationVerifier };
