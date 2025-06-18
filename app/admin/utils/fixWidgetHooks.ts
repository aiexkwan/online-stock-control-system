/**
 * Script to fix useWidgetData hook usage in all widgets
 * Ensures loadFunction is defined before being used
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function fixWidgetHooks() {
  const widgetsDir = join(process.cwd(), 'app/admin/components/dashboard/widgets');
  const files = await readdir(widgetsDir);
  
  for (const file of files) {
    if (file.endsWith('Widget.tsx')) {
      const filePath = join(widgetsDir, file);
      let content = await readFile(filePath, 'utf-8');
      
      // Pattern to find useWidgetData usage before function definition
      const useWidgetDataPattern = /useWidgetData\s*\(\s*{[^}]*loadFunction:\s*(\w+)[^}]*}\s*\)/g;
      const matches = [...content.matchAll(useWidgetDataPattern)];
      
      for (const match of matches) {
        const functionName = match[1];
        const useWidgetDataCall = match[0];
        
        // Check if function is defined after the useWidgetData call
        const functionDefinitionPattern = new RegExp(`const\\s+${functionName}\\s*=\\s*async\\s*\\(`);
        const functionIndex = content.indexOf(content.match(functionDefinitionPattern)?.[0] || '');
        const useWidgetDataIndex = content.indexOf(useWidgetDataCall);
        
        if (functionIndex > useWidgetDataIndex && functionIndex !== -1) {
          console.log(`Fixing ${file}: Moving ${functionName} definition before useWidgetData`);
          
          // Extract the function definition
          const functionStart = functionIndex;
          let braceCount = 0;
          let functionEnd = functionStart;
          let inFunction = false;
          
          for (let i = functionStart; i < content.length; i++) {
            if (content[i] === '{') {
              braceCount++;
              inFunction = true;
            } else if (content[i] === '}') {
              braceCount--;
              if (inFunction && braceCount === 0) {
                functionEnd = i + 1;
                // Find the semicolon after the function
                while (functionEnd < content.length && content[functionEnd] !== ';') {
                  functionEnd++;
                }
                functionEnd++; // Include the semicolon
                break;
              }
            }
          }
          
          const functionDefinition = content.substring(functionStart, functionEnd);
          
          // Remove the function from its current location
          content = content.substring(0, functionStart) + content.substring(functionEnd);
          
          // Find where to insert the function (before useWidgetData)
          const insertIndex = content.lastIndexOf('\n', useWidgetDataIndex) + 1;
          
          // Insert the function before useWidgetData
          content = content.substring(0, insertIndex) + 
                   functionDefinition + '\n\n' + 
                   content.substring(insertIndex);
        }
      }
      
      await writeFile(filePath, content, 'utf-8');
      console.log(`Processed: ${file}`);
    }
  }
}

// Run the script
fixWidgetHooks().catch(console.error);