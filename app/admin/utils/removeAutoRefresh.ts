/**
 * Script to remove auto-refresh from all widgets
 * This updates the common patterns used for setInterval in widgets
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function removeAutoRefresh() {
  const widgetsDir = join(process.cwd(), 'app/admin/components/dashboard/widgets');
  const files = await readdir(widgetsDir);

  for (const file of files) {
    if (file.endsWith('.tsx') && file !== 'index.ts') {
      const filePath = join(widgetsDir, file);
      let content = await readFile(filePath, 'utf-8');

      // Pattern 1: Remove setInterval blocks
      content = content.replace(
        /if \(widget\.config\.refreshInterval[\s\S]*?\n\s*}\n\s*}, \[.*?\]\);/g,
        match => {
          // Check if this is inside a useEffect
          if (match.includes('setInterval')) {
            return '}, []);';
          }
          return match;
        }
      );

      // Pattern 2: Remove refreshInterval from useEffect dependencies
      content = content.replace(
        /}, \[([^,\]]*,\s*)?widget\.config\.refreshInterval(,\s*[^,\]]+)?\]\);/g,
        (match, before, after) => {
          const deps = [];
          if (before) deps.push(before.replace(/,\s*$/, ''));
          if (after) deps.push(after.replace(/^,\s*/, ''));
          return deps.length > 0 ? `}, [${deps.join(', ')}]);` : '}, []);';
        }
      );

      // Pattern 3: Add useWidgetData import if not present
      if (!content.includes('useWidgetData') && content.includes('loadData')) {
        content = content.replace(
          /import\s+{([^}]+)}\s+from\s+['"]@\/app\/types\/dashboard['"]/,
          "import {$1} from '@/app/types/dashboard';\nimport { useWidgetData } from '@/app/admin/hooks/useWidgetData'"
        );
      }

      await writeFile(filePath, content, 'utf-8');
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Updated: ${file}`);
      }
    }
  }
}

// Run the script
removeAutoRefresh().catch(console.error);
