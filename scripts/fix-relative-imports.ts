#!/usr/bin/env tsx
/**
 * 修復相對路徑導入腳本
 * 自動修復遷移後組件的相對路徑問題
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const COMPONENTS_DIR = path.join(PROJECT_ROOT, 'components');

interface ImportFix {
  file: string;
  fixes: { old: string; new: string }[];
}

const IMPORT_FIXES: ImportFix[] = [
  // Dialog 組件修復
  {
    file: 'molecules/dialogs/Dialog.tsx',
    fixes: [
      { old: "from '../../../../lib/utils'", new: "from '@/lib/utils'" },
      {
        old: "from '../../../../lib/hooks/use-media-query'",
        new: "from '@/lib/hooks/use-media-query'",
      },
    ],
  },
  {
    file: 'molecules/dialogs/DialogExample.tsx',
    fixes: [
      { old: "from '../../button'", new: "from '@/components/ui/button'" },
      { old: "from '../../input'", new: "from '@/components/ui/input'" },
      { old: "from '../../label'", new: "from '@/components/ui/label'" },
      { old: "from '../../checkbox'", new: "from '@/components/ui/checkbox'" },
      { old: "from '../../select'", new: "from '@/components/ui/select'" },
      { old: "from '../../textarea'", new: "from '@/components/ui/textarea'" },
      { old: "from '../../switch'", new: "from '@/components/ui/switch'" },
      { old: "from '../../toast'", new: "from '@/components/ui/toast'" },
    ],
  },
  {
    file: 'molecules/dialogs/ConfirmDialog.tsx',
    fixes: [
      { old: "from '../../button'", new: "from '@/components/ui/button'" },
      { old: "from '../../../ui/button'", new: "from '@/components/ui/button'" },
    ],
  },
  {
    file: 'molecules/dialogs/NotificationDialog.tsx',
    fixes: [
      { old: "from '../../button'", new: "from '@/components/ui/button'" },
      { old: "from '../../../ui/button'", new: "from '@/components/ui/button'" },
    ],
  },
  // Loading 組件修復
  {
    file: 'molecules/loading/LoadingScreen.tsx',
    fixes: [
      { old: "from '../../../../lib/utils'", new: "from '@/lib/utils'" },
      { old: "from '../../../lib/utils'", new: "from '@/lib/utils'" },
    ],
  },
  {
    file: 'molecules/loading/LoadingSpinner.tsx',
    fixes: [
      { old: "from '../../../../lib/utils'", new: "from '@/lib/utils'" },
      { old: "from '../../../lib/utils'", new: "from '@/lib/utils'" },
    ],
  },
  {
    file: 'molecules/loading/LoadingButton.tsx',
    fixes: [
      { old: "from '../../button'", new: "from '@/components/ui/button'" },
      { old: "from '../../../ui/button'", new: "from '@/components/ui/button'" },
    ],
  },
  // Mobile 組件修復
  {
    file: 'molecules/mobile/MobileButton.tsx',
    fixes: [
      { old: "from '../../button'", new: "from '@/components/ui/button'" },
      { old: "from '../../../ui/button'", new: "from '@/components/ui/button'" },
    ],
  },
  {
    file: 'molecules/mobile/MobileCard.tsx',
    fixes: [
      { old: "from '../../card'", new: "from '@/components/ui/card'" },
      { old: "from '../../../ui/card'", new: "from '@/components/ui/card'" },
    ],
  },
  {
    file: 'molecules/mobile/MobileDialog.tsx',
    fixes: [
      { old: "from '../../dialog'", new: "from '@/components/ui/dialog'" },
      { old: "from '../../../ui/dialog'", new: "from '@/components/ui/dialog'" },
    ],
  },
  {
    file: 'molecules/mobile/MobileInput.tsx',
    fixes: [
      { old: "from '../../input'", new: "from '@/components/ui/input'" },
      { old: "from '../../../ui/input'", new: "from '@/components/ui/input'" },
    ],
  },
  // Universal 組件修復
  {
    file: 'templates/universal/UniversalCard.tsx',
    fixes: [
      { old: "from '../../ui/card'", new: "from '@/components/ui/card'" },
      { old: "from '../../../ui/card'", new: "from '@/components/ui/card'" },
    ],
  },
  {
    file: 'templates/universal/UniversalContainer.tsx',
    fixes: [
      { old: "from '../../../../lib/utils'", new: "from '@/lib/utils'" },
      { old: "from '../../../lib/utils'", new: "from '@/lib/utils'" },
    ],
  },
  {
    file: 'templates/universal/UniversalErrorCard.tsx',
    fixes: [
      { old: "from '../../ui/card'", new: "from '@/components/ui/card'" },
      { old: "from '../../ui/button'", new: "from '@/components/ui/button'" },
    ],
  },
  {
    file: 'templates/universal/UniversalGrid.tsx',
    fixes: [
      { old: "from '../../../../lib/utils'", new: "from '@/lib/utils'" },
      { old: "from '../../../lib/utils'", new: "from '@/lib/utils'" },
    ],
  },
  {
    file: 'templates/universal/UniversalProvider.tsx',
    fixes: [
      { old: "from '../../../../lib/utils'", new: "from '@/lib/utils'" },
      { old: "from '../../../lib/utils'", new: "from '@/lib/utils'" },
    ],
  },
  {
    file: 'templates/universal/UniversalStack.tsx',
    fixes: [
      { old: "from '../../../../lib/utils'", new: "from '@/lib/utils'" },
      { old: "from '../../../lib/utils'", new: "from '@/lib/utils'" },
    ],
  },
];

class ImportFixer {
  private fixedCount = 0;
  private errors: string[] = [];

  async fixImports(): Promise<void> {
    console.log(chalk.cyan('🔧 開始修復相對路徑導入\n'));

    for (const fix of IMPORT_FIXES) {
      await this.fixFile(fix);
    }

    this.generateReport();
  }

  private async fixFile(fix: ImportFix): Promise<void> {
    const filePath = path.join(COMPONENTS_DIR, fix.file);

    if (!(await fs.pathExists(filePath))) {
      console.log(chalk.yellow(`⚠️  檔案不存在: ${fix.file}`));
      return;
    }

    try {
      let content = await fs.readFile(filePath, 'utf-8');
      let hasChanges = false;

      for (const { old: oldImport, new: newImport } of fix.fixes) {
        if (content.includes(oldImport)) {
          content = content.replace(
            new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            newImport
          );
          hasChanges = true;
          this.fixedCount++;
          console.log(chalk.green(`  ✓ 修復 ${fix.file}`));
          console.log(chalk.gray(`    ${oldImport} → ${newImport}`));
        }
      }

      if (hasChanges) {
        await fs.writeFile(filePath, content);
      }
    } catch (error) {
      const errorMsg = `無法修復 ${fix.file}: ${error}`;
      this.errors.push(errorMsg);
      console.log(chalk.red(`  ✗ ${errorMsg}`));
    }
  }

  private generateReport(): void {
    console.log(chalk.cyan('\n📊 修復報告\n'));
    console.log(chalk.green(`✅ 成功修復 ${this.fixedCount} 個導入語句`));

    if (this.errors.length > 0) {
      console.log(chalk.red(`❌ 發生 ${this.errors.length} 個錯誤`));
      this.errors.forEach(err => console.log(chalk.red(`  - ${err}`)));
    }
  }
}

// 主執行函數
async function main() {
  const fixer = new ImportFixer();

  try {
    await fixer.fixImports();
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('修復失敗:'), error);
    process.exit(1);
  }
}

// 執行
if (require.main === module) {
  main();
}

export { ImportFixer };
