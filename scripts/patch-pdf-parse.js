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
  
  // Replace the problematic debug code completely
  const debugCodePattern = /let isDebugMode[\s\S]*?\/\/ Debug mode[\s\S]*?\/\/ }/g;
  
  // Also remove any remaining references to test files
  content = content.replace(/\/\/\s*let PDF_FILE = '\.\/test\/data\/05-versions-space\.pdf';/g, '');
  content = content.replace(/let PDF_FILE = '\.\/test\/data\/05-versions-space\.pdf';/g, '');
  
  // Ensure isDebugMode is always false
  if (!content.includes('let isDebugMode = false;')) {
    content = content.replace(/let isDebugMode = .*;/, 'let isDebugMode = false;');
  }
  
  fs.writeFileSync(pdfParseIndexPath, content, 'utf8');
  console.log('✅ pdf-parse module patched successfully');
} else {
  console.log('⚠️ pdf-parse module not found, skipping patch');
}