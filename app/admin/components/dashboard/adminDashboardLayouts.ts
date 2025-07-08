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
        component: 'InjectionProductionStatsWidget', // GraphQL optimized version
      },
      {
        type: 'stats',
        title: 'Today Produced (QTY)',
        gridArea: 'widget3',
        dataSource: 'record_palletinfo',
        metrics: ['quantity_sum'],
        component: 'InjectionProductionStatsWidget', // GraphQL optimized version
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
      },
      {
        type: 'chart',
        title: 'Top 10 Products Distribution',
        gridArea: 'widget7',
        dataSource: 'record_palletinfo',
        chartType: 'donut',
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
      },
      {
        type: 'chart',
        title: 'Staff Workload',
        gridArea: 'widget10',
        dataSource: 'work_level',
        chartType: 'line',
      },
    ],
  },

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
      },
      {
        type: 'stats',
        title: 'Today Produced (QTY)',
        gridArea: 'widget3',
        dataSource: 'record_palletinfo',
        metrics: ['pipeline_quantity_sum'],
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
      },
      {
        type: 'chart',
        title: 'Top 10 Products Distribution',
        gridArea: 'widget8',
        dataSource: 'record_palletinfo',
        chartType: 'donut',
        metrics: ['pipeline_products_top10'],
      },
      {
        type: 'table',
        title: 'Production Details',
        gridArea: 'widget9',
        dataSource: 'pipeline_production_details',
        component: 'ProductionDetailsWidget',
        useGraphQL: true, // GraphQL optimized for frequent time switching
      },
      {
        type: 'chart',
        title: 'Staff Workload',
        gridArea: 'widget10',
        dataSource: 'pipeline_work_level',
        chartType: 'line',
        component: 'StaffWorkloadWidget',
        useGraphQL: true, // GraphQL optimized for frequent time switching
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
        component: 'ProductUpdateWidget',
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
        component: 'StockDistributionChartV2',
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
        component: 'AcoOrderReportWidgetV2',
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
        component: 'GrnReportWidgetV2',
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
        type: 'custom',
        title: 'Data Analysis Center',
        gridArea: 'widget2',
        component: 'AnalysisExpandableCards',
        description: 'Comprehensive data analysis dashboard',
      },
    ],
  },
};
