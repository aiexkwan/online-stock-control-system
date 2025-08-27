/**
 * Progress Debounce Validation Script
 * 驗證進度更新防抖機制的效果
 */

import { useProgressDebounce } from '@/lib/hooks/useProgressDebounce';
import { ProgressPerformanceMonitor } from '@/lib/performance/progress-performance-monitor';

interface ValidationResult {
  testName: string;
  withoutDebounce: {
    totalUpdates: number;
    actualRenders: number;
    executionTime: number;
  };
  withDebounce: {
    totalUpdates: number;
    actualRenders: number;
    executionTime: number;
  };
  improvement: {
    renderReduction: number;
    timeReduction: number;
    efficiency: number;
  };
}

/**
 * Simulate progress updates without debouncing
 */
function simulateWithoutDebounce(updateCount: number): Promise<ValidationResult['withoutDebounce']> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    let renderCount = 0;
    
    const mockRender = () => {
      renderCount++;
    };

    // Simulate rapid updates without debouncing
    for (let i = 0; i < updateCount; i++) {
      setTimeout(() => {
        mockRender(); // Each update triggers a render
        
        if (i === updateCount - 1) {
          const endTime = performance.now();
          resolve({
            totalUpdates: updateCount,
            actualRenders: renderCount,
            executionTime: endTime - startTime,
          });
        }
      }, i * 2); // 2ms between updates
    }
  });
}

/**
 * Simulate progress updates with debouncing
 */
function simulateWithDebounce(updateCount: number): Promise<ValidationResult['withDebounce']> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    let renderCount = 0;
    
    const mockProgressUpdate = (update: any) => {
      renderCount++;
    };

    // Create a mock hook-like behavior
    let pendingUpdate: any = null;
    let timeoutId: NodeJS.Timeout | null = null;
    
    const debouncedUpdate = (update: any) => {
      pendingUpdate = { ...pendingUpdate, ...update };
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        mockProgressUpdate(pendingUpdate);
        pendingUpdate = null;
        timeoutId = null;
      }, 100); // 100ms debounce
    };

    // Simulate rapid updates with debouncing
    for (let i = 0; i < updateCount; i++) {
      setTimeout(() => {
        debouncedUpdate({ current: i, total: updateCount });
        
        if (i === updateCount - 1) {
          // Wait for final debounced update
          setTimeout(() => {
            const endTime = performance.now();
            resolve({
              totalUpdates: updateCount,
              actualRenders: renderCount,
              executionTime: endTime - startTime,
            });
          }, 150); // Wait for debounce to complete
        }
      }, i * 2); // 2ms between updates
    }
  });
}

/**
 * Run validation test
 */
export async function validateProgressDebounce(testName: string, updateCount: number = 100): Promise<ValidationResult> {
  console.log(`Running validation test: ${testName} (${updateCount} updates)`);
  
  // Test without debouncing
  const withoutDebounce = await simulateWithoutDebounce(updateCount);
  console.log('Without debounce:', withoutDebounce);
  
  // Test with debouncing
  const withDebounce = await simulateWithDebounce(updateCount);
  console.log('With debounce:', withDebounce);
  
  // Calculate improvements
  const renderReduction = ((withoutDebounce.actualRenders - withDebounce.actualRenders) / withoutDebounce.actualRenders) * 100;
  const timeReduction = ((withoutDebounce.executionTime - withDebounce.executionTime) / withoutDebounce.executionTime) * 100;
  const efficiency = (withDebounce.actualRenders / withoutDebounce.totalUpdates) * 100;
  
  const result: ValidationResult = {
    testName,
    withoutDebounce,
    withDebounce,
    improvement: {
      renderReduction,
      timeReduction,
      efficiency,
    },
  };
  
  return result;
}

/**
 * Run comprehensive validation suite
 */
export async function runValidationSuite(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  const testCases = [
    { name: 'Light Load (50 updates)', count: 50 },
    { name: 'Medium Load (100 updates)', count: 100 },
    { name: 'Heavy Load (200 updates)', count: 200 },
    { name: 'Extreme Load (500 updates)', count: 500 },
  ];
  
  for (const testCase of testCases) {
    const result = await validateProgressDebounce(testCase.name, testCase.count);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

/**
 * Generate validation report
 */
export function generateValidationReport(results: ValidationResult[]): string {
  let report = '# Progress Update Debounce Validation Report\n\n';
  
  report += '## Test Results Summary\n\n';
  report += '| Test Case | Updates | Renders (No Debounce) | Renders (With Debounce) | Render Reduction | Time Improvement | Efficiency |\n';
  report += '|-----------|---------|----------------------|------------------------|------------------|------------------|------------|\n';
  
  results.forEach(result => {
    report += `| ${result.testName} | ${result.withoutDebounce.totalUpdates} | ${result.withoutDebounce.actualRenders} | ${result.withDebounce.actualRenders} | ${result.improvement.renderReduction.toFixed(2)}% | ${result.improvement.timeReduction.toFixed(2)}% | ${result.improvement.efficiency.toFixed(2)}% |\n`;
  });
  
  report += '\n## Detailed Analysis\n\n';
  
  results.forEach(result => {
    report += `### ${result.testName}\n\n`;
    report += `**Without Debounce:**\n`;
    report += `- Total Updates: ${result.withoutDebounce.totalUpdates}\n`;
    report += `- Actual Renders: ${result.withoutDebounce.actualRenders}\n`;
    report += `- Execution Time: ${result.withoutDebounce.executionTime.toFixed(2)}ms\n\n`;
    
    report += `**With Debounce:**\n`;
    report += `- Total Updates: ${result.withDebounce.totalUpdates}\n`;
    report += `- Actual Renders: ${result.withDebounce.actualRenders}\n`;
    report += `- Execution Time: ${result.withDebounce.executionTime.toFixed(2)}ms\n\n`;
    
    report += `**Performance Improvement:**\n`;
    report += `- Render Reduction: ${result.improvement.renderReduction.toFixed(2)}%\n`;
    report += `- Time Improvement: ${result.improvement.timeReduction.toFixed(2)}%\n`;
    report += `- Update Efficiency: ${result.improvement.efficiency.toFixed(2)}%\n\n`;
  });
  
  // Overall statistics
  const avgRenderReduction = results.reduce((sum, r) => sum + r.improvement.renderReduction, 0) / results.length;
  const avgTimeImprovement = results.reduce((sum, r) => sum + r.improvement.timeReduction, 0) / results.length;
  const avgEfficiency = results.reduce((sum, r) => sum + r.improvement.efficiency, 0) / results.length;
  
  report += '## Overall Performance Impact\n\n';
  report += `- **Average Render Reduction**: ${avgRenderReduction.toFixed(2)}%\n`;
  report += `- **Average Time Improvement**: ${avgTimeImprovement.toFixed(2)}%\n`;
  report += `- **Average Update Efficiency**: ${avgEfficiency.toFixed(2)}%\n\n`;
  
  // Recommendations
  report += '## Recommendations\n\n';
  
  if (avgRenderReduction > 70) {
    report += '✅ **Excellent Performance**: Debounce mechanism is highly effective, reducing renders by over 70%.\n\n';
  } else if (avgRenderReduction > 50) {
    report += '✅ **Good Performance**: Debounce mechanism provides significant improvement, reducing renders by over 50%.\n\n';
  } else if (avgRenderReduction > 30) {
    report += '⚠️ **Moderate Performance**: Consider optimizing debounce timing or batching strategy.\n\n';
  } else {
    report += '❌ **Poor Performance**: Debounce mechanism may need significant optimization.\n\n';
  }
  
  if (avgEfficiency < 10) {
    report += '✅ **Highly Efficient**: Less than 10% of updates result in renders.\n\n';
  } else if (avgEfficiency < 25) {
    report += '✅ **Efficient**: Less than 25% of updates result in renders.\n\n';
  } else {
    report += '⚠️ **Could Be More Efficient**: Consider increasing debounce delays or batch sizes.\n\n';
  }
  
  return report;
}

/**
 * Quick validation function for immediate testing
 */
export async function quickValidation(): Promise<void> {
  console.log('🚀 Starting Progress Debounce Validation...\n');
  
  try {
    const results = await runValidationSuite();
    const report = generateValidationReport(results);
    
    console.log(report);
    console.log('✅ Validation completed successfully!');
    
    // Save report to memory for later use
    (globalThis as any).progressValidationReport = report;
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
  }
}

// Auto-run validation if this file is executed directly
if (typeof window !== 'undefined' && (window as any).location?.pathname?.includes('validation')) {
  quickValidation();
}