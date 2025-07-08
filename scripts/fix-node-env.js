#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to replace
const replacements = [
  {
    // Double NODE_ENV check
    pattern: /process\.env\.NODE_ENV !== 'production' &&\s*process\.env\.NODE_ENV !== 'production' &&/g,
    replacement: "isNotProduction() &&",
    import: "import { isNotProduction } from '@/lib/utils/env';"
  },
  {
    // Single !== 'production' check
    pattern: /process\.env\.NODE_ENV !== 'production'/g,
    replacement: "isNotProduction()",
    import: "import { isNotProduction } from '@/lib/utils/env';"
  },
  {
    // === 'production' check
    pattern: /process\.env\.NODE_ENV === 'production'/g,
    replacement: "isProduction()",
    import: "import { isProduction } from '@/lib/utils/env';"
  },
  {
    // === 'development' check
    pattern: /process\.env\.NODE_ENV === 'development'/g,
    replacement: "isDevelopment()",
    import: "import { isDevelopment } from '@/lib/utils/env';"
  },
  {
    // === 'test' check
    pattern: /process\.env\.NODE_ENV === 'test'/g,
    replacement: "isTest()",
    import: "import { isTest } from '@/lib/utils/env';"
  }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const importsNeeded = new Set();

  for (const { pattern, replacement, import: importStatement } of replacements) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      if (importStatement) {
        importsNeeded.add(importStatement);
      }
      modified = true;
    }
  }

  if (modified && importsNeeded.size > 0) {
    // Add imports at the top of the file
    const imports = Array.from(importsNeeded).join('\n');
    
    // Check if file already has imports
    const hasImports = content.includes("import ");
    
    if (hasImports) {
      // Add after the last import
      const lines = content.split('\n');
      let lastImportIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      
      if (lastImportIndex >= 0) {
        lines.splice(lastImportIndex + 1, 0, imports);
        content = lines.join('\n');
      }
    } else {
      // Add at the beginning
      content = imports + '\n\n' + content;
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
  }
}

// Find all TypeScript files
const files = glob.sync('**/*.{ts,tsx}', {
  ignore: [
    'node_modules/**',
    '.next/**',
    'dist/**',
    'lib/utils/env.ts',
    'scripts/**'
  ]
});

console.log(`Found ${files.length} files to process...`);

files.forEach(file => {
  try {
    processFile(file);
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log('Done!');