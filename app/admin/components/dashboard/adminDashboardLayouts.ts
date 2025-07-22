/**
 * Admin Dashboard Layouts
 * 定義每個主題的固定佈局和 widget 配置
 */

import { AdminWidgetConfig, AdminDashboardLayout } from '@/types/components/dashboard';

// Default/overview layout for fallback
const defaultLayout: AdminDashboardLayout = {
  theme: 'overview',
  gridTemplate: `
    "widget1 widget1 widget1 widget1 widget2 widget2 widget2 widget2"
    "widget1 widget1 widget1 widget1 widget2 widget2 widget2 widget2"
    "widget3 widget3 widget3 widget3 widget4 widget4 widget4 widget4"
    "widget3 widget3 widget3 widget3 widget4 widget4 widget4 widget4"
  `,
  widgets: [
    {
      type: 'stats',
      title: 'Welcome to Admin Dashboard',
      gridArea: 'widget1',
      dataSource: 'overview',
      metrics: ['total_products'],
    },
    {
      type: 'stats',
      title: 'System Status',
      gridArea: 'widget2',
      dataSource: 'system_status',
      metrics: ['active_users'],
    },
    {
      type: 'chart',
      title: 'Daily Activity',
      gridArea: 'widget3',
      dataSource: 'daily_activity',
      chartType: 'line',
    },
    {
      type: 'table',
      title: 'Recent Actions',
      gridArea: 'widget4',
      dataSource: 'recent_actions',
    },
  ],
};

// v2.0.2: 主題系統簡化 - 11個主題合併為3個
export const adminDashboardLayouts: Record<string, AdminDashboardLayout> = {
  overview: defaultLayout,

  // 統一營運監控主題 (整合 injection, pipeline, warehouse, stock-management)
  'operations-monitoring': {
    theme: 'operations-monitoring',
    gridTemplate: `
      "stats-1 stats-1 stats-2 stats-2 stats-3 stats-3 stats-4 stats-4 history history history history"
      "stats-1 stats-1 stats-2 stats-2 stats-3 stats-3 stats-4 stats-4 history history history history"
      "table-1 table-1 table-1 table-1 chart chart chart chart history history history history"
      "table-1 table-1 table-1 table-1 chart chart chart chart history history history history"
      "table-1 table-1 table-1 table-1 chart chart chart chart history history history history"
      "table-2 table-2 table-2 table-2 chart-2 chart-2 chart-2 chart-2 history history history history"
      "table-2 table-2 table-2 table-2 chart-2 chart-2 chart-2 chart-2 history history history history"
    `,
    widgets: [
      {
        type: 'stats',
        title: 'Primary Metric',
        gridArea: 'stats-1',
        dataSource: 'record_palletinfo',
        metrics: ['dynamic_metric_1'],
        component: 'UnifiedStatsWidget', // 統一統計組件
      },
      {
        type: 'stats',
        title: 'Secondary Metric',
        gridArea: 'stats-2',
        dataSource: 'record_palletinfo',
        metrics: ['dynamic_metric_2'],
        component: 'UnifiedStatsWidget', // 統一統計組件
      },
      {
        type: 'stats',
        title: 'Tertiary Metric',
        gridArea: 'stats-3',
        dataSource: 'record_inventory',
        metrics: ['dynamic_metric_3'],
        component: 'UnifiedStatsWidget',
      },
      {
        type: 'stats',
        title: 'Department',
        gridArea: 'stats-4',
        component: 'DepartmentSelectorWidget', // 部門選擇器
        dataSource: 'system_status',
        metrics: ['department_selection'],
      },
      {
        type: 'history-tree',
        title: '',
        gridArea: 'history',
        component: 'HistoryTreeV2',
      },
      {
        type: 'chart',
        title: 'Performance Chart',
        gridArea: 'table-1',
        dataSource: 'record_palletinfo',
        chartType: 'bar',
        component: 'UnifiedChartWidget', // 統一圖表組件
      },
      {
        type: 'chart',
        title: 'Distribution Chart',
        gridArea: 'chart',
        dataSource: 'record_palletinfo',
        chartType: 'donut',
        component: 'UnifiedChartWidget', // 統一圖表組件
      },
      {
        type: 'table',
        title: 'Operations Details',
        gridArea: 'table-2',
        dataSource: 'unified_operations',
        component: 'UnifiedTableWidget', // 統一表格組件
      },
      {
        type: 'chart',
        title: 'Staff Workload',
        gridArea: 'chart-2',
        dataSource: 'work_level',
        chartType: 'line',
        component: 'UnifiedChartWidget', // 統一圖表組件
      },
    ],
  },

  // 統一數據管理主題 (整合 upload, update, system)
  'data-management': {
    theme: 'data-management',
    gridTemplate: `
      "upload-history upload-history file-history file-history upload-actions upload-actions"
      "upload-history upload-history file-history file-history upload-actions upload-actions"
      "product-update supplier-update void-pallet void-pallet upload-stats statistics"
      "product-update supplier-update void-pallet void-pallet upload-stats statistics"
      "product-update supplier-update void-pallet void-pallet upload-stats statistics"
    `,
    widgets: [
      // Upload 功能區域
      {
        type: 'orders-list',
        title: 'Order Upload History',
        gridArea: 'upload-history',
        component: 'OrdersListWidgetV2',
        description: 'View and manage order upload history',
      },
      {
        type: 'other-files-list',
        title: 'File Upload History',
        gridArea: 'file-history',
        component: 'OtherFilesListWidgetV2',
        description: 'View and manage file upload history',
      },
      {
        type: 'unified-upload',
        title: 'Upload Center',
        gridArea: 'upload-actions',
        component: 'UnifiedUploadWidget',
        description: 'Unified upload interface for all file types',
        uploadTypes: ['files', 'orders', 'product-spec', 'photo'],
      },
      // Update 功能區域
      {
        type: 'product-update',
        title: 'Product Management',
        gridArea: 'product-update',
        dataSource: 'products',
        component: 'ProductUpdateWidgetV2',
        description: 'Update product information and specifications',
      },
      {
        type: 'supplier-update',
        title: 'Supplier Management',
        gridArea: 'supplier-update',
        dataSource: 'suppliers',
        component: 'SupplierUpdateWidgetV2',
        description: 'Update supplier information and contacts',
      },
      {
        type: 'void-pallet',
        title: 'Pallet Management',
        gridArea: 'void-pallet',
        dataSource: 'void_pallets',
        component: 'VoidPalletWidget',
        description: 'Handle damaged or void pallets',
      },
      // 統計和監控區域
      {
        type: 'upload-stats',
        title: 'Upload Statistics',
        gridArea: 'upload-stats',
        dataSource: 'upload_stats',
        component: 'UnifiedStatsWidget',
        metrics: ['today_uploads', 'success_rate'],
        description: 'Upload performance and statistics',
      },
      {
        type: 'update-stats',
        title: 'Update Statistics',
        gridArea: 'statistics',
        dataSource: 'update_stats',
        component: 'UnifiedStatsWidget',
        metrics: ['pending_count', 'completed_today'],
        description: 'Update operations and pending tasks',
      },
    ],
  },

  // 統一分析主題 (合併 analysis + analysis-full)
  analytics: {
    theme: 'analytics',
    gridTemplate: `
      "analysis-dashboard analysis-dashboard analysis-dashboard analysis-dashboard analysis-dashboard analysis-dashboard"
      "analysis-dashboard analysis-dashboard analysis-dashboard analysis-dashboard analysis-dashboard analysis-dashboard"
      "stats1 stats1 stats2 stats2 stats3 stats3"
      "stats4 stats4 stats5 stats5 stats6 stats6"
      "stats7 stats7 stats8 stats8 stats9 stats9"
      "performance-metrics performance-metrics performance-metrics system-health system-health system-health"
    `,
    widgets: [
      // 主要分析儀表板 (來自 analysis)
      {
        type: 'analysis',
        title: 'Comprehensive Analytics Dashboard',
        gridArea: 'analysis-dashboard',
        component: 'AnalysisExpandableCards',
        description: 'Interactive analysis charts and advanced metrics visualization',
      },
      // 關鍵統計組件 (來自 analysis-full，優化版)
      {
        type: 'stats',
        title: 'Production Overview',
        gridArea: 'stats1',
        dataSource: 'record_palletinfo',
        metrics: ['total_products', 'today_production'],
        component: 'UnifiedStatsWidget',
        description: 'Production statistics and trends',
      },
      {
        type: 'stats',
        title: 'Inventory Status',
        gridArea: 'stats2',
        dataSource: 'record_inventory',
        metrics: ['total_quantity', 'await_total'],
        component: 'UnifiedStatsWidget',
        description: 'Real-time inventory levels',
      },
      {
        type: 'stats',
        title: 'Transfer Activity',
        gridArea: 'stats3',
        dataSource: 'record_transfer',
        metrics: ['transfer_count'],
        component: 'UnifiedStatsWidget',
        description: 'Warehouse transfer operations',
      },
      {
        type: 'stats',
        title: 'Quality Metrics',
        gridArea: 'stats4',
        dataSource: 'quality_metrics',
        metrics: ['quality_score', 'defect_rate'],
        component: 'UnifiedStatsWidget',
        description: 'Quality control indicators',
      },
      {
        type: 'stats',
        title: 'Efficiency Score',
        gridArea: 'stats5',
        dataSource: 'efficiency_metrics',
        metrics: ['efficiency_rate', 'productivity_index'],
        component: 'UnifiedStatsWidget',
        description: 'Operational efficiency metrics',
      },
      {
        type: 'stats',
        title: 'User Activity',
        gridArea: 'stats6',
        dataSource: 'system_status',
        metrics: ['active_users', 'session_count'],
        component: 'UnifiedStatsWidget',
        description: 'System usage analytics',
      },
      // 高級分析組件
      {
        type: 'advanced-chart',
        title: 'Trend Analysis',
        gridArea: 'stats7',
        dataSource: 'trend_analysis',
        chartType: 'line',
        component: 'UnifiedChartWidget',
        description: 'Multi-dimensional trend analysis',
      },
      {
        type: 'advanced-chart',
        title: 'Distribution Analysis',
        gridArea: 'stats8',
        dataSource: 'distribution_analysis',
        chartType: 'donut',
        component: 'UnifiedChartWidget',
        description: 'Data distribution visualization',
      },
      {
        type: 'predictive-chart',
        title: 'Predictive Analytics',
        gridArea: 'stats9',
        dataSource: 'predictive_analysis',
        chartType: 'area',
        component: 'UnifiedChartWidget',
        description: 'AI-powered predictions and forecasts',
      },
      // 系統性能和健康監控
      {
        type: 'performance-monitor',
        title: 'Performance Metrics',
        gridArea: 'performance-metrics',
        dataSource: 'system_performance',
        component: 'UnifiedStatsWidget',
        metrics: ['response_time', 'throughput', 'error_rate'],
        description: 'Real-time system performance monitoring',
      },
      {
        type: 'system-health',
        title: 'System Health',
        gridArea: 'system-health',
        dataSource: 'system_status',
        component: 'UnifiedStatsWidget',
        metrics: ['system_health', 'uptime', 'resource_usage'],
        description: 'Comprehensive system health dashboard',
      },
    ],
  },
};
