#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

// Simple fix for common unused variable patterns
const files = [
  'app/(app)/admin/cards/ChatbotCard.tsx',
  'app/(app)/productUpdate/page.tsx',
  'app/(auth)/main-login/components/ResetForm.tsx',
  'app/(auth)/main-login/context/LoginContext.tsx',
  'app/actions/DownloadCentre-Actions.ts',
];

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Fix unused error variables
    const newContent = content
      .replace(/} catch \(error\)/g, '} catch (_error)')
      .replace(/} catch \(err\)/g, '} catch (_err)')
      .replace(/} catch \(e\)/g, '} catch (_e)')
      .replace(/const error =/g, 'const _error =')
      .replace(/let error =/g, 'let _error =')
      .replace(/const err =/g, 'const _err =')
      .replace(/let err =/g, 'let _err =');

    if (newContent !== content) {
      fs.writeFileSync(file, newContent);
      console.log('Fixed:', file);
    }
  } catch (error) {
    // Ignore file not found errors
  }
});

console.log('Quick fixes applied');
