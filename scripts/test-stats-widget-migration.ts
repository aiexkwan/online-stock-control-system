#!/usr/bin/env tsx
/**
 * Stats Widget Migration Test Script
 * 驗證 Stats widgets 遷移成功
 */

import { widgetRegistry } from '../lib/widgets/unified-registry';
import { UNIFIED_WIDGET_CONFIG } from '../lib/widgets/unified-widget-config';

async function testStatsWidgetMigration() {
  console.log('\n🔍 Testing Stats Widget Migration...\n');

  try {
    // Widget registry auto-initializes from config

    // 要測試的 Stats widgets
    const statsWidgets = [
      'AwaitLocationQtyWidget',
      'YesterdayTransferCountWidget',
      'StillInAwaitWidget',
      'StillInAwaitPercentageWidget',
      'StatsCardWidget'
    ];

    console.log(`📊 Testing ${statsWidgets.length} Stats widgets:\n`);

    let successCount = 0;
    let failureCount = 0;

    for (const widgetId of statsWidgets) {
      console.log(`\nTesting ${widgetId}:`);
      console.log('─'.repeat(50));

      // 檢查是否已註冊
      const definition = widgetRegistry.getDefinition(widgetId);
      if (!definition) {
        console.error(`❌ Widget not registered: ${widgetId}`);
        failureCount++;
        continue;
      }

      console.log(`✅ Widget registered`);
      console.log(`   Name: ${definition.name}`);
      console.log(`   Category: ${definition.category}`);
      console.log(`   Priority: ${definition.preloadPriority || 'N/A'}`);

      // 檢查組件是否可加載
      const component = widgetRegistry.getComponent(widgetId);
      if (!component) {
        console.error(`❌ Component not found: ${widgetId}`);
        failureCount++;
        continue;
      }

      console.log(`✅ Component available`);

      // 在腳本環境中跳過實際加載測試（避免環境變量問題）
      if (widgetId === 'YesterdayTransferCountWidget') {
        console.log(`   ⚠️  Skipping load test (requires GraphQL environment)`);
      }

      // 檢查特殊配置
      const config = UNIFIED_WIDGET_CONFIG[widgetId as string];
      if (config?.metadata?.refreshInterval) {
        console.log(`   Refresh Interval: ${config.metadata.refreshInterval}ms`);
      }

      const hasTimeFrame = config?.metadata?.supportDateRange || false;
      console.log(`   Supports TimeFrame: ${hasTimeFrame ? 'Yes' : 'No'}`);

      // 檢查 API 架構
      const apiSource = config?.metadata?.dataSource || 'unknown';
      console.log(`   API Source: ${apiSource}`);

      successCount++;
    }

    // 檢查預加載功能
    console.log('\n\n📦 Testing Preload Functionality:');
    console.log('─'.repeat(50));

    const highPriorityWidgets = statsWidgets.filter(id => {
      const def = widgetRegistry.getDefinition(id);
      return def && (def.preloadPriority || 0) >= 8;
    });

    console.log(`High priority widgets (priority >= 8): ${highPriorityWidgets.join(', ')}`);

    const startTime = performance.now();
    await widgetRegistry.preloadWidgets(highPriorityWidgets);
    const preloadTime = performance.now() - startTime;

    console.log(`✅ Preloaded ${highPriorityWidgets.length} widgets in ${preloadTime.toFixed(2)}ms`);

    // 總結
    console.log('\n\n📈 Migration Test Summary:');
    console.log('═'.repeat(50));
    console.log(`Total widgets tested: ${statsWidgets.length}`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`Success rate: ${((successCount / statsWidgets.length) * 100).toFixed(1)}%`);

    // 檢查整體 registry 狀態
    const allDefinitions = widgetRegistry.getAllDefinitions();
    const statsCount = Array.from(allDefinitions.values())
      .filter(def => def.category === 'stats').length;

    console.log(`\nTotal Stats widgets in registry: ${statsCount}`);

    if (failureCount === 0) {
      console.log('\n✨ All Stats widgets successfully migrated!');
      process.exit(0);
    } else {
      console.error('\n❌ Some widgets failed migration');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Migration test failed:', error);
    process.exit(1);
  }
}

// 執行測試
testStatsWidgetMigration();
