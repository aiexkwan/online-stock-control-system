#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixImportSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;

    // Fix syntax like ", Loader2," to "Loader2,"
    newContent = newContent.replace(/,\s*,\s*([A-Za-z_][A-Za-z0-9_]*),/g, ', $1,');

    // Fix syntax like ", Button }" to "Button }"
    newContent = newContent.replace(/,\s*,\s*([A-Za-z_][A-Za-z0-9_]*)\s*}/g, ', $1 }');

    // Fix syntax like "{ , Button" to "{ Button"
    newContent = newContent.replace(/{\s*,\s*([A-Za-z_][A-Za-z0-9_]*)/g, '{ $1');

    // Fix multiple commas and spaces
    newContent = newContent.replace(/,\s*,\s*/g, ', ');

    // Fix trailing commas in imports
    newContent = newContent.replace(/,\s*}/g, ' }');

    if (newContent !== content) {
      hasChanges = true;
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed syntax in: ${filePath}`);
    }

    return hasChanges;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findTSXFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!item.startsWith('.') && item !== 'node_modules') {
            traverse(fullPath);
          }
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${currentDir}:`, error.message);
    }
  }

  traverse(dir);
  return files;
}

const projectRoot = process.cwd();
const tsxFiles = findTSXFiles(projectRoot);

console.log(`🔍 Found ${tsxFiles.length} TypeScript files`);
console.log('🚀 Fixing import syntax...\n');

let fixedCount = 0;

tsxFiles.forEach(file => {
  if (fixImportSyntax(file)) {
    fixedCount++;
  }
});

console.log(`\n✨ Import syntax fix completed!`);
console.log(`📊 Fixed syntax in ${fixedCount} files`);
