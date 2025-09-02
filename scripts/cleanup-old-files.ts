#!/usr/bin/env tsx
/**
 * Cleanup Script for Old Component Files
 * Removes deprecated components after successful migration
 */

import * as fs from 'fs';
import * as path from 'path';

// Files to delete (already migrated or deprecated)
const filesToDelete = [
  // Deleted admin components
  '/app/(app)/admin/components/README.md',
  '/app/(app)/admin/components/StockCountErrorBoundary.tsx',
  '/app/(app)/admin/components/StockCountForm.tsx',
  '/app/(app)/admin/components/StockCountResult.tsx',
  '/app/(app)/admin/components/StockTransferErrorBoundary.tsx',
  '/app/(app)/admin/components/StockTransferLoadingState.tsx',
  '/app/(app)/admin/components/AIResponseRenderer.tsx',
  '/app/(app)/admin/components/ChatHeader.tsx',
  '/app/(app)/admin/components/ChatInput.tsx',
  '/app/(app)/admin/components/ChatMessages.tsx',
  '/app/(app)/admin/components/ClockNumberConfirmDialog.tsx',
  '/app/(app)/admin/components/EnhancedProgressBar.tsx',
  '/app/(app)/admin/components/GridBasicProductFormGraphQL.tsx',
  '/app/(app)/admin/components/MemoryDashboard.tsx',
  '/app/(app)/admin/components/QuerySuggestions.tsx',
  '/app/(app)/admin/components/QuickActions.tsx',
  '/app/(app)/admin/components/SuggestionCategories.tsx',
  '/app/(app)/admin/components/UserIdVerificationDialog.tsx',
  '/app/(app)/admin/components/qc-label-constants.ts',
  '/app/(app)/admin/components/shared/FormInputGroup.tsx',
  '/app/(app)/admin/components/shared/ProgressIndicator.tsx',
  '/app/(app)/admin/components/shared/SearchInput.tsx',
  '/app/(app)/admin/components/shared/StatusOverlay.tsx',
  '/app/(app)/admin/components/shared/StepIndicator.tsx',
  '/app/(app)/admin/components/shared/index.ts',

  // Stock count components
  '/app/(app)/admin/stock-count/components/ScanResult.tsx',
  '/app/(app)/admin/stock-count/components/StockCountForm.tsx',
  '/app/(app)/admin/stock-count/components/index.ts',

  // QC label form duplicates
  '/app/components/qc-label-form/ClockNumberConfirmDialog.tsx',
  '/app/components/qc-label-form/EnhancedProgressBar.tsx',
];

// Directories to check and potentially remove if empty
const directoriesToCheck = [
  '/app/(app)/admin/components/shared',
  '/app/(app)/admin/components',
  '/app/(app)/admin/cards/components',
  '/app/(app)/admin/stock-count/components',
];

function deleteFile(filePath: string): boolean {
  const fullPath = path.join(process.cwd(), filePath);

  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`✅ Deleted: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete ${filePath}:`, error);
      return false;
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
}

function removeEmptyDirectory(dirPath: string): boolean {
  const fullPath = path.join(process.cwd(), dirPath);

  if (fs.existsSync(fullPath)) {
    try {
      const files = fs.readdirSync(fullPath);
      if (files.length === 0) {
        fs.rmdirSync(fullPath);
        console.log(`📁 Removed empty directory: ${dirPath}`);
        return true;
      } else {
        console.log(`📁 Directory not empty: ${dirPath} (${files.length} files)`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Failed to remove directory ${dirPath}:`, error);
      return false;
    }
  }
  return false;
}

console.log('🧹 Starting cleanup of old component files...\n');

// Delete files
let deletedCount = 0;
let failedCount = 0;

filesToDelete.forEach(file => {
  if (deleteFile(file)) {
    deletedCount++;
  } else {
    failedCount++;
  }
});

console.log('\n📁 Checking for empty directories...\n');

// Remove empty directories
let removedDirs = 0;
directoriesToCheck.forEach(dir => {
  if (removeEmptyDirectory(dir)) {
    removedDirs++;
  }
});

console.log('\n📊 Cleanup Summary:');
console.log(`✅ Files deleted: ${deletedCount}`);
console.log(`❌ Files failed/not found: ${failedCount}`);
console.log(`📁 Empty directories removed: ${removedDirs}`);
console.log('\n✨ Cleanup completed!');
