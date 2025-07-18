/**
 * Admin Dashboard Layouts
 * 定義每個主題的固定佈局和 widget 配置
 */

export interface AdminWidgetConfig {
  type: string;
  title: string;
  gridArea: string;
  dataSource?: string;
  chartType?: 'line' | 'bar' | 'pie' | 'donut' | 'area';
  metrics?: string[];
  component?: string; // 特殊組件名稱
  reportType?: string;
  apiEndpoint?: string;
  description?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  selectLabel?: string;
  dataTable?: string;
  referenceField?: string;
  useGraphQL?: boolean; // 是否使用 GraphQL 優化版本
  department?: 'injection' | 'pipeline' | 'warehouse' | 'all'; // 部門過濾支援
  uploadTypes?: string[]; // 統一上傳組件支援的文件類型
}

export interface AdminDashboardLayout {
  theme: string;
  gridTemplate: string;
  widgets: AdminWidgetConfig[];
}

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

export const adminDashboardLayouts: Record<string, AdminDashboardLayout> = {
  overview: defaultLayout,
  
  // 統一營運監控主題 (合併 injection + pipeline + warehouse)
  'operations-monitoring': {
    theme: 'operations-monitoring',
    gridTemplate: `"widget2 widget2 widget3 widget3 widget4 widget4 widget5 widget5 widget1 widget1" "widget2 widget2 widget3 widget3 widget4 widget4 widget5 widget5 widget1 widget1" "widget6 widget6 widget6 widget7 widget7 widget7 widget8 widget8 widget1 widget1" "widget6 widget6 widget6 widget7 widget7 widget7 widget8 widget8 widget1 widget1" "widget6 widget6 widget6 widget7 widget7 widget7 widget8 widget8 widget1 widget1" "widget9 widget9 widget9 widget9 widget10 widget10 widget10 widget10 widget1 widget1" "widget9 widget9 widget9 widget9 widget10 widget10 widget10 widget10 widget1 widget1"`,
    widgets: [
      {
        type: 'history-tree',
        title: '',
        gridArea: 'widget1',
        component: 'HistoryTree',
      },
      {
        type: 'stats',
        title: 'Primary Metric',
        gridArea: 'widget2',
        dataSource: 'record_palletinfo',
        metrics: ['dynamic_metric_1'],
        component: 'UnifiedStatsWidget', // 統一統計組件
      },
      {
        type: 'stats',
        title: 'Secondary Metric',
        gridArea: 'widget3',
        dataSource: 'record_palletinfo',
        metrics: ['dynamic_metric_2'],
        component: 'UnifiedStatsWidget', // 統一統計組件
      },
      {
        type: 'department-selector',
        title: 'Department',
        gridArea: 'widget4',
        component: 'DepartmentSelectorWidget', // 部門選擇器
      },
      {
        type: 'stats',
        title: 'Tertiary Metric',
        gridArea: 'widget5',
        dataSource: 'record_inventory',
        metrics: ['dynamic_metric_3'],
        component: 'UnifiedStatsWidget',
      },
      {
        type: 'chart',
        title: 'Performance Chart',
        gridArea: 'widget6',
        dataSource: 'record_palletinfo',
        chartType: 'bar',
        component: 'UnifiedChartWidget', // 統一圖表組件
        useGraphQL: true,
      },
      {
        type: 'chart',
        title: 'Distribution Chart',
        gridArea: 'widget7',
        dataSource: 'record_palletinfo',
        chartType: 'donut',
        component: 'UnifiedChartWidget', // 統一圖表組件
        useGraphQL: true,
      },
      {
        type: 'available-soon',
        title: 'Coming Soon',
        gridArea: 'widget8',
        component: 'AvailableSoonWidget',
      },
      {
        type: 'table',
        title: 'Operations Details',
        gridArea: 'widget9',
        dataSource: 'unified_operations',
        component: 'UnifiedTableWidget', // 統一表格組件
        useGraphQL: true,
      },
      {
        type: 'chart',
        title: 'Staff Workload',
        gridArea: 'widget10',
        dataSource: 'work_level',
        chartType: 'line',
        component: 'UnifiedChartWidget', // 統一圖表組件
        useGraphQL: true,
      },
    ],
  },

  // 向後兼容性 - injection 主題指向新的 production-monitoring
  injection: {
    theme: 'injection',
    gridTemplate: `"widget2 widget2 widget3 widget3 widget4 widget4 widget5 widget5 widget1 widget1" "widget2 widget2 widget3 widget3 widget4 widget4 widget5 widget5 widget1 widget1" "widget6 widget6 widget6 widget7 widget7 widget7 widget8 widget8 widget1 widget1" "widget6 widget6 widget6 widget7 widget7 widget7 widget8 widget8 widget1 widget1" "widget6 widget6 widget6 widget7 widget7 widget7 widget8 widget8 widget1 widget1" "widget9 widget9 widget9 widget9 widget10 widget10 widget10 widget10 widget1 widget1" "widget9 widget9 widget9 widget9 widget10 widget10 widget10 widget10 widget1 widget1"`,
    widgets: [
      {
        type: 'history-tree',
        title: '',
        gridArea: 'widget1',
        component: 'HistoryTree',
      },
      {
        type: 'stats',
        title: 'Today Produced (PLT)',
        gridArea: 'widget2',
        dataSource: 'record_palletinfo',
        metrics: ['pallet_count'],
        component: 'ProductionStatsWidget',
        department: 'injection', // 指定部門
      },
      {
        type: 'stats',
        title: 'Today Produced (QTY)',
        gridArea: 'widget3',
        dataSource: 'record_palletinfo',
        metrics: ['quantity_sum'],
        component: 'ProductionStatsWidget',
        department: 'injection', // 指定部門
      },
      {
        type: 'available-soon',
        title: 'Coming Soon',
        gridArea: 'widget4',
        component: 'AvailableSoonWidget',
      },
      {
        type: 'available-soon',
        title: 'Coming Soon',
        gridArea: 'widget5',
        component: 'AvailableSoonWidget',
      },
      {
        type: 'chart',
        title: 'Top 10 Products by Quantity',
        gridArea: 'widget6',
        dataSource: 'record_palletinfo',
        chartType: 'bar',
        component: 'TopProductsByQuantityWidget',
        useGraphQL: true,
        department: 'injection',
      },
      {
        type: 'chart',
        title: 'Top 10 Products Distribution',
        gridArea: 'widget7',
        dataSource: 'record_palletinfo',
        chartType: 'donut',
        component: 'TopProductsDistributionWidget',
        useGraphQL: true,
        department: 'injection',
      },
      {
        type: 'available-soon',
        title: 'Coming Soon',
        gridArea: 'widget8',
        component: 'AvailableSoonWidget',
      },
      {
        type: 'table',
        title: 'Production Details',
        gridArea: 'widget9',
        dataSource: 'production_details',
        component: 'ProductionDetailsWidget',
        department: 'injection',
      },
      {
        type: 'chart',
        title: 'Staff Workload',
        gridArea: 'widget10',
        dataSource: 'work_level',
        chartType: 'line',
        component: 'StaffWorkloadWidget',
        department: 'injection',
      },
    ],
  },

  // 向後兼容性 - pipeline 主題指向新的 production-monitoring
  pipeline: {
    theme: 'pipeline',
    gridTemplate: `"widget2 widget2 widget3 widget3 widget4 widget4 widget5 widget5 widget1 widget1" "widget2 widget2 widget3 widget3 widget4 widget4 widget5 widget5 widget1 widget1" "widget6 widget6 widget6 widget7 widget7 widget7 widget8 widget8 widget1 widget1" "widget6 widget6 widget6 widget7 widget7 widget7 widget8 widget8 widget1 widget1" "widget6 widget6 widget6 widget7 widget7 widget7 widget8 widget8 widget1 widget1" "widget9 widget9 widget9 widget9 widget10 widget10 widget10 widget10 widget1 widget1" "widget9 widget9 widget9 widget9 widget10 widget10 widget10 widget10 widget1 widget1"`,
    widgets: [
      {
        type: 'history-tree',
        title: '',
        gridArea: 'widget1',
        component: 'HistoryTree',
      },
      {
        type: 'stats',
        title: 'Today Produced (PLT)',
        gridArea: 'widget2',
        dataSource: 'record_palletinfo',
        metrics: ['pipeline_pallet_count'],
        component: 'ProductionStatsWidget',
        department: 'pipeline', // 指定部門
      },
      {
        type: 'stats',
        title: 'Today Produced (QTY)',
        gridArea: 'widget3',
        dataSource: 'record_palletinfo',
        metrics: ['pipeline_quantity_sum'],
        component: 'ProductionStatsWidget',
        department: 'pipeline', // 指定部門
      },
      {
        type: 'available-soon',
        title: 'Coming Soon',
        gridArea: 'widget4',
        component: 'AvailableSoonWidget',
      },
      {
        type: 'available-soon',
        title: 'Coming Soon',
        gridArea: 'widget5',
        component: 'AvailableSoonWidget',
      },
      {
        type: 'available-soon',
        title: 'Coming Soon',
        gridArea: 'widget6',
        component: 'AvailableSoonWidget',
      },
      {
        type: 'chart',
        title: 'Top 5 Products by Quantity',
        gridArea: 'widget7',
        dataSource: 'record_palletinfo',
        chartType: 'bar',
        metrics: ['pipeline_products'],
        component: 'TopProductsByQuantityWidget',
        department: 'pipeline',
      },
      {
        type: 'chart',
        title: 'Top 10 Products Distribution',
        gridArea: 'widget8',
        dataSource: 'record_palletinfo',
        chartType: 'donut',
        metrics: ['pipeline_products_top10'],
        component: 'TopProductsDistributionWidget',
        department: 'pipeline',
      },
      {
        type: 'table',
        title: 'Production Details',
        gridArea: 'widget9',
        dataSource: 'pipeline_production_details',
        component: 'ProductionDetailsWidget',
        useGraphQL: true,
        department: 'pipeline',
      },
      {
        type: 'chart',
        title: 'Staff Workload',
        gridArea: 'widget10',
        dataSource: 'pipeline_work_level',
        chartType: 'line',
        component: 'StaffWorkloadWidget',
        useGraphQL: true,
        department: 'pipeline',
      },
    ],
  },

  warehouse: {
    theme: 'warehouse',
    gridTemplate: `"widget2 widget2 widget2 widget2 widget2 widget3 widget3 widget4 widget1 widget1" "widget2 widget2 widget2 widget2 widget2 widget5 widget5 widget6 widget1 widget1" "widget2 widget2 widget2 widget2 widget2 widget7 widget7 widget7 widget1 widget1" "widget2 widget2 widget2 widget2 widget2 widget8 widget8 widget8 widget1 widget1" "widget7 widget7 widget8 widget8 widget8 widget9 widget9 widget9 widget1 widget1" "widget10 widget10 widget10 widget10 widget10 widget10 widget10 widget10 widget1 widget1" "widget10 widget10 widget10 widget10 widget10 widget10 widget10 widget10 widget1 widget1"`,
    widgets: [
      {
        type: 'history-tree',
        title: '',
        gridArea: 'widget1',
        component: 'HistoryTree',
      },
      {
        type: 'stats',
        title: 'Await Location Qty',
        gridArea: 'widget2',
        dataSource: 'record_inventory',
        metrics: ['await_total'],
        component: 'AwaitLocationQtyWidget',
      },
      {
        type: 'stats',
        title: 'Transfer Done',
        gridArea: 'widget3',
        dataSource: 'record_transfer',
        metrics: ['yesterday_count'],
        component: 'YesterdayTransferCountWidget',
      },
      {
        type: 'stats',
        title: 'Still In Await',
        gridArea: 'widget4',
        dataSource: 'record_palletinfo',
        metrics: ['still_in_await_qty'],
        component: 'StillInAwaitWidget',
      },
      {
        type: 'stats',
        title: 'Still In Await %',
        gridArea: 'widget5',
        dataSource: 'record_palletinfo',
        metrics: ['still_in_await_percentage'],
        component: 'StillInAwaitPercentageWidget',
      },
      {
        type: 'list',
        title: 'Order Progress',
        gridArea: 'widget6',
        dataSource: 'data_order',
        metrics: ['order_progress'],
        component: 'OrderStateListWidgetV2',
      },
      {
        type: 'chart',
        title: 'Transfer Time Distribution',
        gridArea: 'widget7',
        dataSource: 'record_transfer',
        chartType: 'line',
        component: 'TransferTimeDistributionWidget',
      },
      {
        type: 'available-soon',
        title: 'Coming Soon',
        gridArea: 'widget8',
        component: 'AvailableSoonWidget',
      },
      {
        type: 'table',
        title: 'Transfer List',
        gridArea: 'widget9',
        dataSource: 'record_transfer',
        component: 'WarehouseTransferListWidget',
      },
      {
        type: 'chart',
        title: 'Work Level',
        gridArea: 'widget10',
        dataSource: 'work_level',
        chartType: 'area',
        component: 'WarehouseWorkLevelAreaChart',
      },
    ],
  },

  upload: {
    theme: 'upload',
    gridTemplate: `
      "widget1 widget1 widget1 widget2 widget2 widget2 widget3 widget3 widget7 widget7" 
      "widget1 widget1 widget1 widget2 widget2 widget2 widget4 widget4 widget7 widget7" 
      "widget1 widget1 widget1 widget2 widget2 widget2 widget5 widget5 widget7 widget7" 
      "widget1 widget1 widget1 widget2 widget2 widget2 widget6 widget6 widget7 widget7"
    `,
    widgets: [
      {
        type: 'history-tree',
        title: '',
        gridArea: 'widget7',
        component: 'HistoryTree',
      },
      {
        type: 'orders-list',
        title: 'Order Upload History',
        gridArea: 'widget1',
        component: 'OrdersListWidgetV2',
        useGraphQL: true, // GraphQL optimized for large datasets
      },
      {
        type: 'other-files-list',
        title: 'Other File Upload History',
        gridArea: 'widget2',
        component: 'OtherFilesListWidgetV2',
        useGraphQL: true, // GraphQL optimized for large datasets
      },
      {
        type: 'upload-files',
        title: 'Upload Files',
        gridArea: 'widget3',
        component: 'UploadFilesWidget',
      },
      {
        type: 'upload-orders',
        title: 'Upload Orders',
        gridArea: 'widget4',
        component: 'UploadOrdersWidget',
      },
      {
        type: 'upload-product-spec',
        title: 'Upload Product Spec',
        gridArea: 'widget5',
        component: 'UploadProductSpecWidget',
      },
      {
        type: 'upload-photo',
        title: 'Upload Photo',
        gridArea: 'widget6',
        component: 'UploadPhotoWidget',
      },
    ],
  },

  update: {
    theme: 'update',
    gridTemplate: `
      "widget2 widget2 widget2 widget4 widget4 widget4 widget4 widget4 widget1 widget1" 
      "widget2 widget2 widget2 widget4 widget4 widget4 widget4 widget4 widget1 widget1" 
      "widget3 widget3 widget3 widget4 widget4 widget4 widget4 widget4 widget1 widget1" 
      "widget3 widget3 widget3 widget5 widget5 widget5 widget5 widget5 widget1 widget1"
    `,
    widgets: [
      {
        type: 'history-tree',
        title: '',
        gridArea: 'widget1',
        component: 'HistoryTree',
      },
      {
        type: 'product-update',
        title: 'Product Update',
        gridArea: 'widget2',
        dataSource: 'products',
        component: 'ProductUpdateWidgetV2',
      },
      {
        type: 'supplier-update',
        title: 'Supplier Update',
        gridArea: 'widget3',
        dataSource: 'suppliers',
        component: 'SupplierUpdateWidgetV2',
      },
      {
        type: 'void-pallet',
        title: 'Void Pallet',
        gridArea: 'widget4',
        dataSource: 'void_pallets',
        component: 'VoidPalletWidget',
      },
      {
        type: 'stats',
        title: 'Pending Updates',
        gridArea: 'widget5',
        dataSource: 'update_stats',
        metrics: ['pending_count'],
      },
    ],
  },

  'stock-management': {
    theme: 'stock-management',
    gridTemplate: `
      "widget2 widget2 widget2 widget2 widget2 widget4 widget4 widget4 widget1 widget1"
      "widget2 widget2 widget2 widget2 widget2 widget4 widget4 widget4 widget1 widget1"
      "widget3 widget3 widget3 widget3 widget3 widget5 widget5 widget5 widget1 widget1"
      "widget3 widget3 widget3 widget3 widget3 widget5 widget5 widget5 widget1 widget1"
    `,
    widgets: [
      {
        type: 'history-tree',
        title: '',
        gridArea: 'widget1',
        component: 'HistoryTree',
      },
      {
        type: 'table',
        title: 'Stock Type Selector',
        gridArea: 'widget2',
        dataSource: 'stock_level',
        component: 'StockTypeSelector',
        useGraphQL: true, // GraphQL optimized for complex queries
      },
      {
        type: 'chart',
        title: 'Stock Level History',
        gridArea: 'widget3',
        dataSource: 'stock_level',
        chartType: 'line',
        component: 'StockLevelHistoryChart',
      },
      {
        type: 'custom',
        title: 'Inventory Ordered Analysis',
        gridArea: 'widget4',
        component: 'InventoryOrderedAnalysisWidget',
      },
      {
        type: 'chart',
        title: 'Stock Distribution',
        gridArea: 'widget5',
        dataSource: 'stock_level',
        chartType: 'pie',
        component: 'StockDistributionChart',
        useGraphQL: true, // GraphQL optimized for frequent interaction
      },
    ],
  },

  system: {
    theme: 'system',
    gridTemplate: `
      "widget2 widget2 widget2 widget5 widget5 widget5 widget1 widget1"
      "widget3 widget3 widget3 widget6 widget6 widget6 widget1 widget1"
      "widget4 widget4 widget4 widget7 widget7 widget7 widget1 widget1"
      "widget8 widget8 widget8 widget9 widget9 widget9 widget1 widget1"
      "widget10 widget10 widget10 widget10 widget10 widget10 widget10 widget10"
    `,
    widgets: [
      {
        type: 'history-tree',
        title: '',
        gridArea: 'widget1',
        component: 'HistoryTree',
      },
      {
        type: 'report-generator',
        title: 'Void Pallet Report',
        gridArea: 'widget2',
        component: 'ReportGeneratorWithDialogWidgetV2',
        reportType: 'void-pallet',
        description: 'Damage Report',
        apiEndpoint: '/api/reports/void-pallet',
      },
      {
        type: 'report-generator',
        title: 'Order Loading Report',
        gridArea: 'widget3',
        component: 'ReportGeneratorWithDialogWidgetV2',
        reportType: 'order-loading',
        description: 'Loading Report',
        apiEndpoint: '/api/reports/order-loading',
      },
      {
        type: 'report-generator',
        title: 'Stock Take Report',
        gridArea: 'widget4',
        component: 'ReportGeneratorWithDialogWidgetV2',
        reportType: 'stock-take',
        description: 'StockTake Report',
        apiEndpoint: '/api/reports/stock-take',
      },
      {
        type: 'aco-order-report',
        title: 'ACO Order Report',
        gridArea: 'widget5',
        component: 'AcoOrderReportWidget',
        reportType: 'aco-order',
        description: 'ACO Order Report',
        apiEndpoint: '/api/reports/aco-order',
      },
      {
        type: 'transaction-report',
        title: 'Transaction Report',
        gridArea: 'widget6',
        component: 'TransactionReportWidget',
        reportType: 'transaction',
        description: 'Stock Transfer Report',
        apiEndpoint: '/api/reports/transaction',
      },
      {
        type: 'grn-report',
        title: 'GRN Report',
        gridArea: 'widget7',
        component: 'GrnReportWidget',
        reportType: 'grn',
        description: 'GRN Report',
        apiEndpoint: '/api/reports/grn',
      },
      {
        type: 'report-generator',
        title: 'Export All Data',
        gridArea: 'widget8',
        component: 'ReportGeneratorWithDialogWidgetV2',
        reportType: 'export-all',
        description: 'Export System Data',
        apiEndpoint: '/api/reports/export-all',
      },
      {
        type: 'reprint-label',
        title: 'Reprint Label',
        gridArea: 'widget9',
        component: 'ReprintLabelWidget',
      },
      {
        type: 'performance-test',
        title: 'Performance Test Tool',
        gridArea: 'widget10',
        component: 'PerformanceTestWidget',
        description: 'Widget performance testing and analysis tool',
      },
    ],
  },

  analysis: {
    theme: 'analysis',
    gridTemplate: `
      "widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget1 widget1"
      "widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget1 widget1"
      "widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget1 widget1"
      "widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget1 widget1"
      "widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget1 widget1"
      "widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget1 widget1"
      "widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget1 widget1"
      "widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget2 widget1 widget1"
    `,
    widgets: [
      {
        type: 'history-tree',
        title: '',
        gridArea: 'widget1',
        component: 'HistoryTree',
      },
      {
        type: 'analysis',
        title: 'Analysis Dashboard',
        gridArea: 'widget2',
        component: 'AnalysisExpandableCards',
        description: 'Comprehensive analysis charts and metrics',
      },
    ],
  },

  // 完整版 analysis（用於生產環境）
  'analysis-full': {
    theme: 'analysis-full',
    gridTemplate: `
      "widget1 widget1 widget1 widget2 widget2 widget2 widget3 widget3 widget3 widget4"
      "widget1 widget1 widget1 widget2 widget2 widget2 widget3 widget3 widget3 widget4"
      "widget5 widget5 widget5 widget6 widget6 widget6 widget7 widget7 widget7 widget4"
      "widget5 widget5 widget5 widget6 widget6 widget6 widget7 widget7 widget7 widget4"
      "widget8 widget8 widget8 widget8 widget9 widget9 widget9 widget9 widget9 widget4"
      "widget8 widget8 widget8 widget8 widget9 widget9 widget9 widget9 widget9 widget4"
    `,
    widgets: [
      {
        type: 'stats',
        title: 'Total Products',
        gridArea: 'widget1',
        dataSource: 'record_palletinfo',
        metrics: ['total_products'],
      },
      {
        type: 'stats',
        title: 'Today Production',
        gridArea: 'widget2',
        dataSource: 'record_palletinfo',
        metrics: ['today_production'],
      },
      {
        type: 'stats',
        title: 'Total Quantity',
        gridArea: 'widget3',
        dataSource: 'record_palletinfo',
        metrics: ['total_quantity'],
      },
      {
        type: 'history-tree',
        title: '',
        gridArea: 'widget4',
        component: 'HistoryTree',
      },
      {
        type: 'stats',
        title: 'Await Location',
        gridArea: 'widget5',
        dataSource: 'record_inventory',
        metrics: ['await_total'],
      },
      {
        type: 'stats',
        title: 'Transfer Count',
        gridArea: 'widget6',
        dataSource: 'record_transfer',
        metrics: ['transfer_count'],
      },
      {
        type: 'stats',
        title: 'Active Users',
        gridArea: 'widget7',
        dataSource: 'system_status',
        metrics: ['active_users'],
      },
      {
        type: 'stats',
        title: 'System Status',
        gridArea: 'widget8',
        dataSource: 'system_status',
        metrics: ['system_health'],
      },
      {
        type: 'stats',
        title: 'Performance Score',
        gridArea: 'widget9',
        dataSource: 'system_status',
        metrics: ['performance_score'],
      },
    ],
  },

  // 統一數據管理主題 (合併 upload + update)
  'data-management': {
    theme: 'data-management',
    gridTemplate: `
      "upload-history upload-history file-history file-history upload-actions upload-actions history-tree history-tree"
      "upload-history upload-history file-history file-history upload-actions upload-actions history-tree history-tree"
      "product-update supplier-update void-pallet void-pallet upload-stats statistics history-tree history-tree"
      "product-update supplier-update void-pallet void-pallet upload-stats statistics history-tree history-tree"
      "product-update supplier-update void-pallet void-pallet upload-stats statistics history-tree history-tree"
    `,
    widgets: [
      {
        type: 'history-tree',
        title: '',
        gridArea: 'history-tree',
        component: 'HistoryTree',
      },
      // Upload 功能區域
      {
        type: 'orders-list',
        title: 'Order Upload History',
        gridArea: 'upload-history',
        component: 'OrdersListWidgetV2',
        useGraphQL: true,
        description: 'View and manage order upload history',
      },
      {
        type: 'other-files-list',
        title: 'File Upload History',
        gridArea: 'file-history',
        component: 'OtherFilesListWidgetV2',
        useGraphQL: true,
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
      "analysis-dashboard analysis-dashboard analysis-dashboard analysis-dashboard analysis-dashboard analysis-dashboard history-tree history-tree"
      "analysis-dashboard analysis-dashboard analysis-dashboard analysis-dashboard analysis-dashboard analysis-dashboard history-tree history-tree"
      "stats1 stats1 stats2 stats2 stats3 stats3 history-tree history-tree"
      "stats4 stats4 stats5 stats5 stats6 stats6 history-tree history-tree"
      "stats7 stats7 stats8 stats8 stats9 stats9 history-tree history-tree"
      "performance-metrics performance-metrics performance-metrics system-health system-health system-health history-tree history-tree"
    `,
    widgets: [
      {
        type: 'history-tree',
        title: '',
        gridArea: 'history-tree',
        component: 'HistoryTree',
      },
      // 主要分析儀表板 (來自 analysis)
      {
        type: 'analysis',
        title: 'Comprehensive Analytics Dashboard',
        gridArea: 'analysis-dashboard',
        component: 'AnalysisExpandableCards',
        description: 'Interactive analysis charts and advanced metrics visualization',
        useGraphQL: true,
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
        useGraphQL: true,
        description: 'Multi-dimensional trend analysis',
      },
      {
        type: 'advanced-chart',
        title: 'Distribution Analysis',
        gridArea: 'stats8',
        dataSource: 'distribution_analysis',
        chartType: 'donut',
        component: 'UnifiedChartWidget',
        useGraphQL: true,
        description: 'Data distribution visualization',
      },
      {
        type: 'predictive-chart',
        title: 'Predictive Analytics',
        gridArea: 'stats9',
        dataSource: 'predictive_analysis',
        chartType: 'area',
        component: 'UnifiedChartWidget',
        useGraphQL: true,
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
