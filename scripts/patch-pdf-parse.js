#!/usr/bin/env node
/**
 * Patch pdf-parse module to remove test file references
 * This fixes build issues when the test file doesn't exist
 */

const fs = require('fs');
const path = require('path');

const pdfParseIndexPath = path.join(__dirname, '..', 'node_modules', 'pdf-parse', 'index.js');

if (fs.existsSync(pdfParseIndexPath)) {
  let content = fs.readFileSync(pdfParseIndexPath, 'utf8');

  // Remove ALL references to test files and debug mode
  // This is more aggressive to ensure no references remain
  content = content.replace(/let PDF_FILE = '\.\/test\/data\/05-versions-space\.pdf';?/g, '');
  content = content.replace(
    /\/\/\s*let PDF_FILE = '\.\/test\/data\/05-versions-space\.pdf';?/g,
    ''
  );
  content = content.replace(/const PDF_FILE = '\.\/test\/data\/05-versions-space\.pdf';?/g, '');
  content = content.replace(/var PDF_FILE = '\.\/test\/data\/05-versions-space\.pdf';?/g, '');

  // Remove any readFileSync that references test data
  content = content.replace(/.*readFileSync\s*\(\s*['"`]\.\/test\/data\/.*?['"`]\s*\).*;?/g, '');
  content = content.replace(/.*Fs\.readFileSync\s*\(\s*PDF_FILE\s*\).*;?/g, '');

  // Remove entire debug block if it exists
  content = content.replace(/if\s*\(\s*isDebugMode\s*\)\s*\{[\s\S]*?\n\}/g, '');

  // Ensure isDebugMode is always false
  if (!content.includes('let isDebugMode = false')) {
    content = content.replace(/let isDebugMode = .*;/, 'let isDebugMode = false;');
    content = content.replace(/var isDebugMode = .*;/, 'let isDebugMode = false;');
    content = content.replace(/const isDebugMode = .*;/, 'let isDebugMode = false;');
  }

  fs.writeFileSync(pdfParseIndexPath, content, 'utf8');
  console.log('✅ pdf-parse module patched successfully');

  // Also check and patch test files if they exist
  const testFilePath = path.join(
    __dirname,
    '..',
    'node_modules',
    'pdf-parse',
    'test',
    '05-versions-space-default.js'
  );
  if (fs.existsSync(testFilePath)) {
    // Just empty the test file to prevent any execution
    fs.writeFileSync(testFilePath, '// Test file disabled\n', 'utf8');
    console.log('✅ pdf-parse test file disabled');
  }
} else {
  console.log('⚠️ pdf-parse module not found, skipping patch');
}
