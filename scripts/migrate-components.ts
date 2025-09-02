#!/usr/bin/env tsx
/**
 * Component Migration Script
 * Automates the migration of components to the new architecture
 */

import * as fs from 'fs';
import * as path from 'path';

// Define migration mappings
const migrationMap = {
  // UI Core Dialog components
  '/components/ui/core/Dialog/ConfirmDialog.tsx': '/components/molecules/dialogs/ConfirmDialog.tsx',
  '/components/ui/core/Dialog/Dialog.tsx': '/components/molecules/dialogs/Dialog.tsx',
  '/components/ui/core/Dialog/DialogExample.tsx': '/components/molecules/dialogs/DialogExample.tsx',
  '/components/ui/core/Dialog/DialogPresets.tsx': '/components/molecules/dialogs/DialogPresets.tsx',
  '/components/ui/core/Dialog/index.ts': '/components/molecules/dialogs/index.ts',
  '/components/ui/core/Dialog/NotificationDialog.tsx':
    '/components/molecules/dialogs/NotificationDialog.tsx',
  '/components/ui/core/ThemeProvider.tsx': '/components/providers/ThemeProvider.tsx',

  // Loading components
  '/components/ui/loading/index.ts': '/components/molecules/loading/index.ts',
  '/components/ui/loading/LoadingButton.tsx': '/components/molecules/loading/LoadingButton.tsx',
  '/components/ui/loading/LoadingScreen.tsx': '/components/molecules/loading/LoadingScreen.tsx',
  '/components/ui/loading/LoadingSpinner.tsx': '/components/molecules/loading/LoadingSpinner.tsx',

  // Mobile components
  '/components/ui/mobile/index.ts': '/components/molecules/mobile/index.ts',
  '/components/ui/mobile/MobileButton.tsx': '/components/molecules/mobile/MobileButton.tsx',
  '/components/ui/mobile/MobileCard.tsx': '/components/molecules/mobile/MobileCard.tsx',
  '/components/ui/mobile/MobileDialog.tsx': '/components/molecules/mobile/MobileDialog.tsx',
  '/components/ui/mobile/MobileInput.tsx': '/components/molecules/mobile/MobileInput.tsx',

  // Layout components
  '/components/layout/universal/constants.ts': '/components/templates/universal/constants.ts',
  '/components/layout/universal/index.ts': '/components/templates/universal/index.ts',
  '/components/layout/universal/types.ts': '/components/templates/universal/types.ts',
  '/components/layout/universal/UniversalCard.tsx':
    '/components/templates/universal/UniversalCard.tsx',
  '/components/layout/universal/UniversalContainer.tsx':
    '/components/templates/universal/UniversalContainer.tsx',
  '/components/layout/universal/UniversalErrorCard.tsx':
    '/components/templates/universal/UniversalErrorCard.tsx',
  '/components/layout/universal/UniversalGrid.tsx':
    '/components/templates/universal/UniversalGrid.tsx',
  '/components/layout/universal/UniversalProvider.tsx':
    '/components/templates/universal/UniversalProvider.tsx',
  '/components/layout/universal/UniversalStack.tsx':
    '/components/templates/universal/UniversalStack.tsx',

  // Business components
  '/components/print-label-pdf/index.ts': '/components/business/printing/index.ts',
  '/components/print-label-pdf/PrintLabelPdf.tsx':
    '/components/business/printing/PrintLabelPdf.tsx',
  '/components/qr-scanner/simple-qr-scanner.tsx':
    '/components/business/scanning/simple-qr-scanner.tsx',
};

function migrateFile(oldPath: string, newPath: string) {
  const fullOldPath = path.join(process.cwd(), oldPath);
  const fullNewPath = path.join(process.cwd(), newPath);

  if (!fs.existsSync(fullOldPath)) {
    console.log(`⚠️  Source file not found: ${oldPath}`);
    return false;
  }

  const dir = path.dirname(fullNewPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const content = fs.readFileSync(fullOldPath, 'utf8');
  fs.writeFileSync(fullNewPath, content);
  console.log(`✅ Migrated: ${oldPath} -> ${newPath}`);
  return true;
}

function createCompatibilityExport(oldPath: string, newPath: string) {
  const fullOldPath = path.join(process.cwd(), oldPath);
  const dir = path.dirname(fullOldPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const relativePath = path.relative(dir, path.join(process.cwd(), newPath));
  const exportPath = relativePath.replace(/\.tsx?$/, '');

  const compatibilityContent = `// Compatibility export - component has been moved
export * from '${exportPath}';
`;

  fs.writeFileSync(fullOldPath, compatibilityContent);
  console.log(`🔄 Created compatibility export: ${oldPath}`);
}

console.log('🚀 Starting component migration...\n');

let successCount = 0;
let failCount = 0;

Object.entries(migrationMap).forEach(([oldPath, newPath]) => {
  if (migrateFile(oldPath, newPath)) {
    // Create compatibility export at old location
    createCompatibilityExport(oldPath, newPath);
    successCount++;
  } else {
    failCount++;
  }
});

console.log('\n📊 Migration Summary:');
console.log(`✅ Successfully migrated: ${successCount} files`);
console.log(`❌ Failed migrations: ${failCount} files`);
console.log('\n✨ Migration script completed!');
