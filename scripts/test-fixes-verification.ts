import { widgetRegistry, preloader as smartPreloader } from '../lib/widgets/unified-registry';
import { WidgetDefinition } from '../lib/widgets/types';

async function runTests() {
  console.log('🧪 Testing Phase 1.2 Fixes...\n');

  let test1Passed = false;
  let test2Passed = false;

  // Test 1: Widget Categorization
  console.log('1️⃣ Testing Widget Categorization (getWidgetsByCategory)');
  try {
    // Auto-register widgets first
    await widgetRegistry.autoRegisterWidgets();
    
    const categories = widgetRegistry.getCategories();
    const categorizedWidgets: Record<string, WidgetDefinition[]> = {};
    let totalCount = 0;
    
    // Get widgets for each category
    categories.forEach(category => {
      const widgets = widgetRegistry.getByCategory(category);
      categorizedWidgets[category] = widgets;
      totalCount += widgets.length;
    });
    
    console.log(`   ✅ Categories found: ${categories.length}`);
    console.log(`   ✅ Total widgets: ${totalCount}`);
    console.log(`   ✅ Categories: ${categories.join(', ')}`);
    
    // Show widget count per category
    Object.entries(categorizedWidgets).forEach(([category, widgets]) => {
      if (widgets.length > 0) {
        console.log(`      - ${category}: ${widgets.length} widgets`);
      }
    });
    
    test1Passed = true;
    console.log('   ✅ Widget Categorization: PASSED\n');
  } catch (error) {
    console.error('   ❌ Widget Categorization: FAILED');
    console.error(`   Error: ${error}\n`);
  }

  // Test 2: Network-Aware Loading
  console.log('2️⃣ Testing Network-Aware Loading (smartPreloader)');
  try {
    // Check if smartPreloader is exported
    if (!smartPreloader) {
      throw new Error('smartPreloader is not exported');
    }
    
    console.log('   ✅ smartPreloader is properly exported');
    
    // Check if preloadForRoute method exists
    if (typeof smartPreloader.preloadForRoute !== 'function') {
      throw new Error('preloadForRoute method not found');
    }
    
    console.log('   ✅ preloadForRoute method exists');
    
    // Test calling preloadForRoute
    await smartPreloader.preloadForRoute('/admin/warehouse');
    console.log('   ✅ preloadForRoute executed successfully');
    
    test2Passed = true;
    console.log('   ✅ Network-Aware Loading: PASSED\n');
  } catch (error) {
    console.error('   ❌ Network-Aware Loading: FAILED');
    console.error(`   Error: ${error}\n`);
  }

  // Summary
  console.log('═══════════════════════════════════════════');
  console.log('📊 Test Summary:');
  console.log(`   1. Widget Categorization: ${test1Passed ? '✅ FIXED' : '❌ FAILED'}`);
  console.log(`   2. Network-Aware Loading: ${test2Passed ? '✅ FIXED' : '❌ FAILED'}`);
  console.log(`   Overall: ${test1Passed && test2Passed ? 'All issues have been resolved!' : 'Some issues remain'}`);
  console.log('═══════════════════════════════════════════');
}

// Run the tests
runTests().catch(console.error);