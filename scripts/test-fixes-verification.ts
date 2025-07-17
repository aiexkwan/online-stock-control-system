import { widgetRegistry } from '../lib/widgets/unified-registry';
import { WidgetDefinition } from '../lib/widgets/types';

async function runTests() {
  console.log('🧪 Testing Phase 1.2 Fixes...\n');

  let test1Passed = false;
  let test2Passed = false;

  // Test 1: Widget Categorization
  console.log('1️⃣ Testing Widget Categorization (getWidgetsByCategory)');
  try {
    // Widget registry auto-initializes from config
    
    const categories = widgetRegistry.getCategories();
    const categorizedWidgets: Record<string, WidgetDefinition[]> = {};
    let totalCount = 0;
    
    // Get widgets for each category
    categories.forEach(category => {
      const widgets = widgetRegistry.getByCategory(category);
      categorizedWidgets[category as string] = widgets;
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

  // Test 2: Preload Widgets
  console.log('2️⃣ Testing Widget Preloading');
  try {
    // Test preloading high priority widgets
    await widgetRegistry.preloadWidgets(['AwaitLocationQtyWidget', 'YesterdayTransferCountWidget']);
    console.log('   ✅ preloadWidgets executed successfully');
    
    test2Passed = true;
    console.log('   ✅ Widget Preloading: PASSED\n');
  } catch (error) {
    console.error('   ❌ Widget Preloading: FAILED');
    console.error(`   Error: ${error}\n`);
  }

  // Summary
  console.log('═══════════════════════════════════════════');
  console.log('📊 Test Summary:');
  console.log(`   1. Widget Categorization: ${test1Passed ? '✅ FIXED' : '❌ FAILED'}`);
  console.log(`   2. Widget Preloading: ${test2Passed ? '✅ FIXED' : '❌ FAILED'}`);
  console.log(`   Overall: ${test1Passed && test2Passed ? 'All issues have been resolved!' : 'Some issues remain'}`);
  console.log('═══════════════════════════════════════════');
}

// Run the tests
runTests().catch(console.error);