/**
 * Fix getDateRangeForTimeRange issues in widgets
 * 修復 widgets 中的 getDateRangeForTimeRange 問題
 */

const fs = require('fs');
const path = require('path');

const widgetsWithIssue = [
  'ResponsiveOutputStatsWidget.tsx',
  'ResponsiveBookedOutStatsWidget.tsx',
  'ResponsiveBookedOutStatsWidget-Fixed.tsx',
  'ResponsiveMaterialReceivedWidget.tsx'
];

const widgetsDir = path.join(__dirname, '../app/admin/components/dashboard/widgets');

console.log('Fixing getDateRangeForTimeRange issues...\n');

widgetsWithIssue.forEach(file => {
  const filePath = path.join(widgetsDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${file} - File not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if it has the getDateRangeForTimeRange function
  if (content.includes('getDateRangeForTimeRange')) {
    // Make sure it's wrapped with useCallback if not already
    if (!content.includes('const getDateRangeForTimeRange = useCallback')) {
      content = content.replace(
        /const getDateRangeForTimeRange = \((.*?)\) => {/,
        'const getDateRangeForTimeRange = useCallback(($1) => {'
      );
      
      // Find the closing brace and add useCallback dependencies
      const functionStart = content.indexOf('const getDateRangeForTimeRange');
      let braceCount = 0;
      let foundStart = false;
      let closingBraceIndex = -1;
      
      for (let i = functionStart; i < content.length; i++) {
        if (content[i] === '{') {
          braceCount++;
          foundStart = true;
        }
        if (content[i] === '}' && foundStart) {
          braceCount--;
          if (braceCount === 0) {
            closingBraceIndex = i;
            break;
          }
        }
      }
      
      if (closingBraceIndex !== -1) {
        content = content.substring(0, closingBraceIndex + 1) + ', [])' + content.substring(closingBraceIndex + 1);
        modified = true;
      }
    }
    
    // Update loadData dependencies to include getDateRangeForTimeRange
    const loadDataMatch = content.match(/}, \[([^\]]*)\]\);[\s\S]*?\/\/ Initial load/);
    if (loadDataMatch) {
      const currentDeps = loadDataMatch[1];
      if (!currentDeps.includes('getDateRangeForTimeRange')) {
        const newDeps = currentDeps ? `${currentDeps}, getDateRangeForTimeRange` : 'getDateRangeForTimeRange';
        content = content.replace(
          new RegExp(`}, \\[${currentDeps.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\);([\\s\\S]*?\\/\\/ Initial load)`),
          `}, [${newDeps}]);$1`
        );
        modified = true;
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${file} - Fixed`);
  } else {
    console.log(`✔️  ${file} - Already correct`);
  }
});

console.log('\n✅ All files checked and fixed!');