/**
 * Script to add React.memo to all widget components
 * 為所有 widget 組件加入 React.memo 優化
 */

const fs = require('fs');
const path = require('path');

const widgetsDir = path.join(__dirname, '../app/admin/components/dashboard/widgets');

// Get all .tsx files in widgets directory
const widgetFiles = fs.readdirSync(widgetsDir)
  .filter(file => file.endsWith('.tsx') && !file.includes('test'));

console.log(`Found ${widgetFiles.length} widget files to optimize\n`);

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

widgetFiles.forEach(file => {
  const filePath = path.join(widgetsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has React.memo
  if (content.includes('React.memo')) {
    console.log(`✅ ${file} - Already optimized`);
    skipCount++;
    return;
  }
  
  // Pattern to match export function ComponentName
  const exportFunctionPattern = /export\s+function\s+(\w+)\s*\(/g;
  const matches = [...content.matchAll(exportFunctionPattern)];
  
  if (matches.length === 0) {
    // Try const pattern
    const exportConstPattern = /export\s+const\s+(\w+)\s*=\s*\(/g;
    const constMatches = [...content.matchAll(exportConstPattern)];
    
    if (constMatches.length === 0) {
      console.log(`⚠️  ${file} - No exported function found`);
      errorCount++;
      return;
    }
  }
  
  // Replace export function with export const + React.memo
  let modified = false;
  
  // Handle export function pattern
  content = content.replace(
    /export\s+function\s+(\w+)\s*\((.*?)\)\s*{/g,
    (match, componentName, params) => {
      modified = true;
      return `export const ${componentName} = React.memo(function ${componentName}(${params}) {`;
    }
  );
  
  // Add closing parenthesis for React.memo at the end
  if (modified) {
    // Find the last closing brace of the component
    const lastBraceIndex = content.lastIndexOf('}');
    if (lastBraceIndex !== -1) {
      content = content.substring(0, lastBraceIndex + 1) + ');' + content.substring(lastBraceIndex + 1);
      
      // Save the file
      fs.writeFileSync(filePath, content);
      console.log(`✨ ${file} - Optimized with React.memo`);
      successCount++;
    } else {
      console.log(`❌ ${file} - Could not find closing brace`);
      errorCount++;
    }
  } else {
    console.log(`⚠️  ${file} - Could not apply optimization`);
    errorCount++;
  }
});

console.log(`
Summary:
✨ Optimized: ${successCount}
✅ Already optimized: ${skipCount}
❌ Errors: ${errorCount}
`);

// Create a report of complex widgets that might need further optimization
console.log('\nWidgets that might benefit from additional optimization:');
const complexWidgets = [
  'AnalyticsDashboardWidget.tsx',
  'ProductionReportWidget.tsx',
  'ReportsWidget.tsx',
  'MaterialReceivedWidget.tsx',
  'InventorySearchWidget.tsx'
];

complexWidgets.forEach(widget => {
  if (widgetFiles.includes(widget)) {
    console.log(`  - ${widget} (Consider lazy loading heavy components)`);
  }
});