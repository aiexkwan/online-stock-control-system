/**
 * Mock Performance Scenarios
 * 用於展示優化前後嘅性能差異
 */

export const performanceScenarios = {
  // 優化前 - 多個獨立 GraphQL 查詢
  baseline: {
    description: 'Multiple independent GraphQL queries',
    metrics: {
      FCP: 2850, // First Contentful Paint (ms)
      LCP: 4200, // Largest Contentful Paint (ms)
      TTI: 5500, // Time to Interactive (ms)
      TBT: 850, // Total Blocking Time (ms)
      CLS: 0.15, // Cumulative Layout Shift
      networkRequests: 47,
      totalTransferSize: 2.8 * 1024 * 1024, // 2.8 MB
      domContentLoaded: 3200,
      loadComplete: 6100,
      jsHeapUsed: 45 * 1024 * 1024, // 45 MB
      widgetRenderTime: 1800,
      graphqlQueries: {
        count: 12,
        totalTime: 2400,
        queries: [
          { name: 'GetTodayOrders', time: 350 },
          { name: 'GetInventoryStatus', time: 280 },
          { name: 'GetMonthlyPerformance', time: 420 },
          { name: 'GetUserActivity', time: 180 },
          { name: 'GetPendingTransfers', time: 310 },
          { name: 'GetLowStockAlerts', time: 260 },
          { name: 'GetSupplierMetrics', time: 290 },
          { name: 'GetRecentActivities', time: 310 },
        ],
      },
    },
    bundleAnalysis: {
      totalSize: 5.2 * 1024 * 1024, // 5.2 MB
      chunks: {
        main: 1.8 * 1024 * 1024,
        vendor: 2.5 * 1024 * 1024,
        widgets: 0.9 * 1024 * 1024,
      },
    },
  },

  // 優化後 - 批量查詢 + SSR + Lazy Loading
  optimized: {
    description: 'Batch query + SSR + Lazy loading',
    metrics: {
      FCP: 1680, // -41% improvement
      LCP: 2520, // -40% improvement
      TTI: 3300, // -40% improvement
      TBT: 340, // -60% improvement
      CLS: 0.05, // -67% improvement
      networkRequests: 18, // -62% reduction
      totalTransferSize: 1.2 * 1024 * 1024, // -57% reduction (1.2 MB)
      domContentLoaded: 1920, // -40% improvement
      loadComplete: 3660, // -40% improvement
      jsHeapUsed: 28 * 1024 * 1024, // -38% reduction (28 MB)
      widgetRenderTime: 720, // -60% improvement
      graphqlQueries: {
        count: 2, // Batch queries
        totalTime: 580, // -76% improvement
        queries: [
          { name: 'GetDashboardData', time: 480 }, // Batched query
          { name: 'GetUserPreferences', time: 100 },
        ],
      },
    },
    bundleAnalysis: {
      totalSize: 3.5 * 1024 * 1024, // -33% reduction (3.5 MB)
      chunks: {
        main: 0.8 * 1024 * 1024, // -56% reduction
        vendor: 2.1 * 1024 * 1024, // -16% reduction
        widgets: 0.6 * 1024 * 1024, // -33% reduction (lazy loaded)
      },
    },
    optimizations: [
      {
        technique: 'GraphQL Batch Queries',
        impact: 'Reduced API calls from 12 to 2',
        improvement: '76% faster data fetching',
      },
      {
        technique: 'Server-Side Rendering',
        impact: 'Pre-rendered critical content',
        improvement: '41% faster FCP',
      },
      {
        technique: 'Dynamic Imports',
        impact: 'Lazy loaded widget components',
        improvement: '33% smaller initial bundle',
      },
      {
        technique: 'React Memoization',
        impact: 'Prevented unnecessary re-renders',
        improvement: '60% less blocking time',
      },
      {
        technique: 'Virtual Scrolling',
        impact: 'Efficient rendering of large lists',
        improvement: '38% less memory usage',
      },
      {
        technique: 'Image Optimization',
        impact: 'Next.js Image component with lazy loading',
        improvement: '45% less bandwidth',
      },
      {
        technique: 'Code Splitting',
        impact: 'Separate chunks for widgets',
        improvement: 'On-demand loading',
      },
      {
        technique: 'Request Deduplication',
        impact: 'Apollo Client cache',
        improvement: 'Zero duplicate requests',
      },
    ],
  },

  // 預期改進總結
  expectedImprovements: {
    performance: {
      'First Contentful Paint': 41,
      'Largest Contentful Paint': 40,
      'Time to Interactive': 40,
      'Total Blocking Time': 60,
      'Cumulative Layout Shift': 67,
      'Widget Render Time': 60,
    },
    resources: {
      'Network Requests': 62,
      'Transfer Size': 57,
      'Bundle Size': 33,
      'Memory Usage': 38,
      'API Response Time': 76,
    },
    userExperience: {
      'Perceived Performance': 'Significantly faster initial load',
      Interactivity: 'Reduced input delay by 60%',
      'Visual Stability': 'Minimal layout shifts',
      'Mobile Performance': '2x faster on 3G networks',
    },
  },
};

// 生成性能對比報告
export function generateComparisonReport() {
  const { baseline, optimized, expectedImprovements } = performanceScenarios;

  return {
    summary: {
      overallImprovement: 45, // Average improvement across all metrics
      criticalMetrics: {
        fcp: {
          baseline: baseline.metrics.FCP,
          optimized: optimized.metrics.FCP,
          improvement: (
            ((baseline.metrics.FCP - optimized.metrics.FCP) / baseline.metrics.FCP) *
            100
          ).toFixed(1),
        },
        tti: {
          baseline: baseline.metrics.TTI,
          optimized: optimized.metrics.TTI,
          improvement: (
            ((baseline.metrics.TTI - optimized.metrics.TTI) / baseline.metrics.TTI) *
            100
          ).toFixed(1),
        },
        bundleSize: {
          baseline: baseline.bundleAnalysis.totalSize,
          optimized: optimized.bundleAnalysis.totalSize,
          improvement: (
            ((baseline.bundleAnalysis.totalSize - optimized.bundleAnalysis.totalSize) /
              baseline.bundleAnalysis.totalSize) *
            100
          ).toFixed(1),
        },
      },
    },
    details: {
      baseline,
      optimized,
      improvements: expectedImprovements,
    },
    recommendations: [
      'Implement progressive enhancement for slower devices',
      'Add resource hints (preconnect, prefetch) for critical assets',
      'Consider edge caching for API responses',
      'Monitor real user metrics (RUM) in production',
      'Set performance budgets for bundle size and loading time',
    ],
  };
}

// 測試數據生成器
export function generateMockMetrics(scenario: 'baseline' | 'optimized') {
  const data = performanceScenarios[scenario];
  const variance = 0.1; // 10% variance for realistic data

  return {
    ...data.metrics,
    // Add some variance to make data more realistic
    FCP: data.metrics.FCP * (1 + (Math.random() - 0.5) * variance),
    LCP: data.metrics.LCP * (1 + (Math.random() - 0.5) * variance),
    TTI: data.metrics.TTI * (1 + (Math.random() - 0.5) * variance),
    TBT: data.metrics.TBT * (1 + (Math.random() - 0.5) * variance),
    widgetRenderTime: data.metrics.widgetRenderTime * (1 + (Math.random() - 0.5) * variance),
  };
}
