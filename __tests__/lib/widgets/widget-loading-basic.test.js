/**
 * Basic Widget Loading Test (JavaScript)
 * Phase 6B - Widget 載入測試驗證 (基本版本)
 */

// ====== Mock 設置 ======

// Mock Next.js components that might be imported
jest.mock('next/dynamic', () => {
  return (componentFactory) => {
    const DynamicComponent = (props) => {
      const Component = componentFactory();
      return Component(props);
    };
    DynamicComponent.displayName = 'DynamicComponent';
    return DynamicComponent;
  };
});

// ====== 測試核心功能 ======

describe('Widget Loading Basic Tests', () => {
  test('應該能夠載入性能監控器', () => {
    const performanceModule = require('@/lib/widgets/monitoring/performance-monitor');

    expect(performanceModule.globalPerformanceMonitor).toBeDefined();
    expect(performanceModule.WidgetPerformanceMonitor).toBeDefined();

    expect(typeof performanceModule.globalPerformanceMonitor.startMonitoring).toBe('function');
    expect(typeof performanceModule.globalPerformanceMonitor.getMetrics).toBeDefined();
  });

  test('應該能夠使用性能監控器記錄指標', () => {
    const { globalPerformanceMonitor } = require('@/lib/widgets/monitoring/performance-monitor');

    // 清理之前的測試
    globalPerformanceMonitor.clearMetrics();

    // 開始監控
    globalPerformanceMonitor.startMonitoring('TestWidget');
    globalPerformanceMonitor.recordLoadingStart('TestWidget');

    // 模擬加載完成
    globalPerformanceMonitor.recordLoadingComplete('TestWidget', {
      status: 'success',
      fromCache: false
    });

    const metrics = globalPerformanceMonitor.getMetrics('TestWidget');
    expect(metrics).toBeDefined();
    expect(metrics.loading.status).toBe('success');
    expect(metrics.loading.fromCache).toBe(false);

    // 清理
    globalPerformanceMonitor.clearMetrics();
  });

  test('應該能夠生成性能報告', () => {
    const { globalPerformanceMonitor } = require('@/lib/widgets/monitoring/performance-monitor');

    // 添加測試數據
    globalPerformanceMonitor.startMonitoring('Widget1');
    globalPerformanceMonitor.recordLoadingComplete('Widget1', { status: 'success' });

    globalPerformanceMonitor.startMonitoring('Widget2');
    globalPerformanceMonitor.recordLoadingComplete('Widget2', { status: 'success' });

    const report = globalPerformanceMonitor.generatePerformanceReport();

    expect(report).toBeDefined();
    expect(report.summary).toBeDefined();
    expect(report.summary.totalWidgets).toBe(2);
    expect(Array.isArray(report.widgets)).toBe(true);
    expect(Array.isArray(report.recommendations)).toBe(true);

    // 清理
    globalPerformanceMonitor.clearMetrics();
  });

  test('應該能夠載入 Widget 類型定義', () => {
    const enhancedTypes = require('@/lib/widgets/types/enhanced-widget-types');

    expect(enhancedTypes).toBeDefined();
    // 檢查基本類型定義是否存在
    expect(typeof enhancedTypes).toBe('object');
  });

  test('應該能夠載入驗證 Schema', () => {
    const schemas = require('@/lib/widgets/validation/widget-schemas');

    expect(schemas.validateWidgetProps).toBeDefined();
    expect(schemas.safeValidateWidgetProps).toBeDefined();
    expect(schemas.TypeGuards).toBeDefined();

    expect(typeof schemas.validateWidgetProps).toBe('function');
    expect(typeof schemas.safeValidateWidgetProps).toBe('function');
    expect(typeof schemas.TypeGuards.isWidgetComponentProps).toBe('function');
  });

  test('應該正確處理無效的 Props', () => {
    const { safeValidateWidgetProps } = require('@/lib/widgets/validation/widget-schemas');

    const invalidProps = {
      mode: 'batch-query'
      // 缺少 widgetId
    };

    const validation = safeValidateWidgetProps(invalidProps);
    expect(validation.success).toBe(false);
    expect(validation.error).toContain('Widget ID');
  });

  test('應該能夠載入 EnhancedDynamicLoader', () => {
    const loaderModule = require('@/lib/widgets/dynamic-imports/enhanced-loader');

    expect(loaderModule.EnhancedDynamicLoader).toBeDefined();
    expect(typeof loaderModule.EnhancedDynamicLoader).toBe('function');

    // 測試創建實例
    const loader = new loaderModule.EnhancedDynamicLoader({
      enablePerformanceMonitoring: true,
      maxCacheSize: 5,
    });

    expect(loader).toBeDefined();
    expect(typeof loader.load).toBe('function');
    expect(typeof loader.clearCache).toBe('function');
    expect(typeof loader.getCacheStats).toBe('function');
  });

  test('Dynamic Loader 緩存功能測試', () => {
    const { EnhancedDynamicLoader } = require('@/lib/widgets/dynamic-imports/enhanced-loader');

    const loader = new EnhancedDynamicLoader({
      maxCacheSize: 5,
      enablePerformanceMonitoring: false
    });

    // 測試緩存統計
    const initialStats = loader.getCacheStats();
    expect(initialStats).toBeDefined();
    expect(initialStats.size).toBe(0);
    expect(initialStats.maxSize).toBe(5);

    // 測試清理緩存
    loader.clearCache();
    const statsAfterClear = loader.getCacheStats();
    expect(statsAfterClear.size).toBe(0);
  });

  test('應該能夠載入 Widget 註冊系統', () => {
    const registryModule = require('@/lib/widgets/enhanced-registry');

    expect(registryModule.EnhancedWidgetRegistry).toBeDefined();

    const registry = new registryModule.EnhancedWidgetRegistry();
    expect(registry).toBeDefined();
    expect(typeof registry.register).toBe('function');
    expect(typeof registry.getRegistered).toBe('function');
    expect(typeof registry.getByCategory).toBe('function');
    expect(typeof registry.getByPriority).toBe('function');
  });

  test('應該能夠載入增強配置', () => {
    const configModule = require('@/lib/widgets/enhanced-config');

    expect(configModule.EnhancedWidgetConfigMap).toBeDefined();
    expect(configModule.createBatchQueryProps).toBeDefined();
    expect(configModule.createTraditionalProps).toBeDefined();

    expect(typeof configModule.createBatchQueryProps).toBe('function');
    expect(typeof configModule.createTraditionalProps).toBe('function');
  });

  test('應該能夠創建和驗證 Widget Props', () => {
    const { createBatchQueryProps } = require('@/lib/widgets/enhanced-config');
    const { safeValidateWidgetProps } = require('@/lib/widgets/validation/widget-schemas');

    const props = createBatchQueryProps('TestWidget', {
      isEditMode: false
    });

    expect(props).toBeDefined();
    expect(props.widgetId).toBe('TestWidget');
    expect(props.mode).toBe('batch-query');

    const validation = safeValidateWidgetProps(props);
    expect(validation.success).toBe(true);
  });

  test('Widget 載入狀態管理測試', () => {
    const { EnhancedDynamicLoader } = require('@/lib/widgets/dynamic-imports/enhanced-loader');

    const loader = new EnhancedDynamicLoader();

    // 測試初始狀態
    expect(loader.getLoadingState('TestWidget')).toBe('idle');

    // 清理
    loader.clearCache();
  });

  test('性能監控 API 完整性測試', () => {
    const { WidgetPerformanceMonitor } = require('@/lib/widgets/monitoring/performance-monitor');

    const monitor = new WidgetPerformanceMonitor();

    // 測試主要 API
    expect(typeof monitor.startMonitoring).toBe('function');
    expect(typeof monitor.stopMonitoring).toBe('function');
    expect(typeof monitor.getMetrics).toBe('function');
    expect(typeof monitor.generatePerformanceReport).toBe('function');
    expect(typeof monitor.clearMetrics).toBe('function');
    expect(typeof monitor.setMonitoringEnabled).toBe('function');

    // 測試初始狀態
    const initialReport = monitor.generatePerformanceReport();
    expect(initialReport.summary.totalWidgets).toBe(0);
  });
});
