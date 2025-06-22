/**
 * Script to optimize remaining widgets that were missed
 * 優化之前漏咗嘅 widgets
 */

const fs = require('fs');
const path = require('path');

const widgetsDir = path.join(__dirname, '../app/admin/components/dashboard/widgets');

// List of files that need manual optimization
const remainingWidgets = [
  'ResponsiveBookedOutStatsWidget-Fixed.tsx',
  'ResponsiveBookedOutStatsWidget.tsx',
  'ResponsiveChartWidget.tsx',
  'ResponsiveOutputStatsWidget.tsx',
  'ResponsiveRecentActivityWidget.tsx',
  'TestClickWidget.tsx'
];

console.log(`Optimizing ${remainingWidgets.length} remaining widgets\n`);

remainingWidgets.forEach(file => {
  const filePath = path.join(widgetsDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${file} - File not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has React.memo
  if (content.includes('React.memo')) {
    console.log(`✅ ${file} - Already optimized`);
    return;
  }
  
  // Pattern for export default function
  if (content.includes('export default function')) {
    // Replace with const + React.memo
    content = content.replace(
      /export\s+default\s+function\s+(\w+)\s*\((.*?)\)\s*{/,
      (match, componentName, params) => {
        return `const ${componentName} = React.memo(function ${componentName}(${params}) {`;
      }
    );
    
    // Add export default at the end
    const lastBraceIndex = content.lastIndexOf('}');
    if (lastBraceIndex !== -1) {
      content = content.substring(0, lastBraceIndex + 1) + ');\n\nexport default ' + 
        content.match(/const\s+(\w+)\s*=/)[1] + ';' + 
        content.substring(lastBraceIndex + 1);
    }
  } 
  // Pattern for arrow function
  else if (content.includes('=>')) {
    // Find the component name and wrap with React.memo
    const componentMatch = content.match(/(?:export\s+default\s+)?(?:const|let)\s+(\w+)\s*=\s*\(/);
    if (componentMatch) {
      const componentName = componentMatch[1];
      
      // Wrap the entire component with React.memo
      content = content.replace(
        /(?:export\s+default\s+)?(?:const|let)\s+(\w+)\s*=\s*\((.*?)\)\s*=>\s*{/,
        `const $1 = React.memo(($2) => {`
      );
      
      // Find the last closing brace and add closing parenthesis
      let braceCount = 0;
      let lastClosingBraceIndex = -1;
      
      for (let i = content.indexOf(componentName); i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            lastClosingBraceIndex = i;
            break;
          }
        }
      }
      
      if (lastClosingBraceIndex !== -1) {
        content = content.substring(0, lastClosingBraceIndex + 1) + ');' + 
          (content.includes('export default') ? '' : '\n\nexport default ' + componentName + ';') +
          content.substring(lastClosingBraceIndex + 1);
      }
    }
  }
  
  // Save the file
  fs.writeFileSync(filePath, content);
  console.log(`✨ ${file} - Optimized with React.memo`);
});

console.log('\n✅ All remaining widgets optimized!');