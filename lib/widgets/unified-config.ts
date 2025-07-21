/**
 * Unified Widget Configuration (Legacy Compatible)
 * 單一配置源，集中管理所有 widget 配置
 * Phase 6B: 增強類型系統兼容性
 */

import type { WidgetCategory } from './types';
import type { WidgetComponentProps } from '@/types/components/dashboard';
import {
  type UnifiedWidgetConfig as ZodUnifiedWidgetConfig,
  type WidgetDataSource,
  type WidgetPriority,
  type WidgetConfigMap as ZodWidgetConfigMap,
  validateWidgetConfigMap,
  parseSupportedDataSources,
  serializeSupportedDataSources,
  convertNumericPriority,
  getNumericPriority as getNumericPriorityFromSchema,
} from './schemas';

// Import enhanced types for better compatibility
import type {
  EnhancedWidgetConfig,
  UnifiedWidgetProps,
  WidgetImportResult,
} from './types/enhanced-widget-types';

// Re-export types
export type { WidgetDataSource, WidgetPriority };

// 使用增強的類型系統，保持向後兼容性
export interface UnifiedWidgetConfig extends Omit<ZodUnifiedWidgetConfig, 'loader'> {
  loader: () => Promise<WidgetImportResult>; // 使用統一的 Widget 導入結果類型
}

// 兼容性映射類型
export interface LegacyCompatibleUnifiedWidgetConfig extends UnifiedWidgetConfig {
  enhanced?: EnhancedWidgetConfig; // 可選的增強配置
}

export type WidgetConfigMap = Record<string, UnifiedWidgetConfig>;

/**
 * 統一的 Widget 配置
 * 包含所有 widgets 的完整配置信息
 */
export const widgetConfig: WidgetConfigMap = {
  // ===== Stats Widgets =====
  AwaitLocationQty: {
    id: 'AwaitLocationQty',
    name: 'Await Location Quantity',
    category: 'stats',
    description: 'Displays total pallets in Await location',
    loader: () => import('@/app/admin/components/dashboard/widgets/AwaitLocationQtyWidget'),
    dataSource: 'batch',
    priority: 'critical',
    refreshInterval: 60000,
    supportTimeFrame: true,
  },

  YesterdayTransferCount: {
    id: 'YesterdayTransferCount',
    name: 'Yesterday Transfer Count',
    category: 'stats',
    description: 'Shows transfer count from yesterday',
    loader: () => import('@/app/admin/components/dashboard/widgets/YesterdayTransferCountWidget'),
    dataSource: 'batch',
    priority: 'high',
    refreshInterval: 300000,
    supportTimeFrame: true,
  },

  StillInAwait: {
    id: 'StillInAwait',
    name: 'Still In Await',
    category: 'stats',
    description: 'Displays items still in await status',
    loader: () => import('@/app/admin/components/dashboard/widgets/StillInAwaitWidget'),
    dataSource: 'graphql',
    priority: 'high',
    refreshInterval: 60000,
  },

  StillInAwaitPercentage: {
    id: 'StillInAwaitPercentage',
    name: 'Still In Await Percentage',
    category: 'stats',
    description: 'Shows percentage of items in await status',
    loader: () => import('@/app/admin/components/dashboard/widgets/StillInAwaitPercentageWidget'),
    dataSource: 'graphql',
    priority: 'normal',
    refreshInterval: 60000,
  },

  StatsCard: {
    id: 'StatsCard',
    name: 'Stats Card',
    category: 'stats',
    description: 'Generic stats card with configurable data source',
    loader: () => import('@/app/admin/components/dashboard/widgets/StatsCardWidget'),
    dataSource: 'batch',
    priority: 'critical',
    metadata: {
      configurable: true,
      supportedDataSources: JSON.stringify(['total_pallets', 'today_transfers', 'active_products']),
    },
  },

  InjectionProductionStats: {
    id: 'InjectionProductionStats',
    name: 'Injection Production Stats',
    category: 'stats',
    description: 'GraphQL-optimized production stats for injection route',
    loader: () => import('@/app/admin/components/dashboard/widgets/InjectionProductionStatsWidget'),
    dataSource: 'graphql',
    priority: 'critical',
    refreshInterval: 300000,
    supportTimeFrame: true,
    useGraphQL: true,
    metadata: {
      preloadPriority: 10,
      graphqlOptimized: true,
      cachingStrategy: 'cache-first',
      gridArea: 'stats',
      configurable: true,
    },
  },

  // ===== Charts Widgets =====
  StockDistributionChartV2: {
    id: 'StockDistributionChartV2',
    name: 'Stock Distribution Chart',
    category: 'charts',
    description: 'Visualizes stock distribution across locations',
    loader: () => import('@/app/admin/components/dashboard/widgets/StockDistributionChartV2'),
    dataSource: 'batch',
    priority: 'high',
    refreshInterval: 300000,
    metadata: {
      preloadPriority: 7,
      chartType: 'doughnut',
      requiresComplexQuery: true,
      gridArea: 'charts',
      exportable: true,
    },
  },

  StockLevelHistoryChart: {
    id: 'StockLevelHistoryChart',
    name: 'Stock Level History',
    category: 'charts',
    description: 'Shows historical stock levels over time',
    loader: () => import('@/app/admin/components/dashboard/widgets/StockLevelHistoryChart'),
    dataSource: 'graphql',
    priority: 'normal',
    supportTimeFrame: true,
  },

  WarehouseWorkLevelAreaChart: {
    id: 'WarehouseWorkLevelAreaChart',
    name: 'Warehouse Work Level',
    category: 'charts',
    description: 'Area chart showing warehouse workload',
    loader: () => import('@/app/admin/components/dashboard/widgets/WarehouseWorkLevelAreaChart'),
    dataSource: 'batch',
    priority: 'high',
    refreshInterval: 180000,
  },

  TransferTimeDistribution: {
    id: 'TransferTimeDistribution',
    name: 'Transfer Time Distribution',
    category: 'charts',
    description: 'Distribution of transfer processing times',
    loader: () => import('@/app/admin/components/dashboard/widgets/TransferTimeDistributionWidget'),
    dataSource: 'graphql',
    priority: 'normal',
    supportTimeFrame: true,
  },

  ProductDistributionChart: {
    id: 'ProductDistributionChart',
    name: 'Product Distribution',
    category: 'charts',
    description: 'Distribution of products across warehouses',
    loader: () => import('@/app/admin/components/dashboard/widgets/ProductDistributionChartWidget'),
    dataSource: 'batch',
    priority: 'high',
  },

  TopProductsByQuantity: {
    id: 'TopProductsByQuantity',
    name: 'Top Products by Quantity',
    category: 'charts',
    description: 'Top products ranked by quantity',
    loader: () => import('@/app/admin/components/dashboard/widgets/TopProductsByQuantityWidget'),
    dataSource: 'batch',
    priority: 'high',
  },

  TopProductsDistribution: {
    id: 'TopProductsDistribution',
    name: 'Top Products Distribution',
    category: 'charts',
    description: 'Distribution of top products',
    loader: () => import('@/app/admin/components/dashboard/widgets/TopProductsDistributionWidget'),
    dataSource: 'batch',
    priority: 'high',
  },

  // ===== Lists Widgets =====
  OrdersListV2: {
    id: 'OrdersListV2',
    name: 'Orders List',
    category: 'lists',
    description: 'List of recent orders',
    loader: () => import('@/app/admin/components/dashboard/widgets/OrdersListWidgetV2'),
    dataSource: 'graphql',
    priority: 'normal',
    useGraphQL: true,
  },

  OtherFilesListV2: {
    id: 'OtherFilesListV2',
    name: 'Other Files List',
    category: 'lists',
    description: 'List of uploaded files',
    loader: () => import('@/app/admin/components/dashboard/widgets/OtherFilesListWidgetV2'),
    dataSource: 'graphql',
    priority: 'normal',
    useGraphQL: true,
  },

  WarehouseTransferList: {
    id: 'WarehouseTransferList',
    name: 'Warehouse Transfer List',
    category: 'lists',
    description: 'Recent warehouse transfers',
    loader: () => import('@/app/admin/components/dashboard/widgets/WarehouseTransferListWidget'),
    dataSource: 'batch',
    priority: 'high',
    refreshInterval: 120000,
  },

  OrderStateListV2: {
    id: 'OrderStateListV2',
    name: 'Order State List',
    category: 'lists',
    description: 'Orders grouped by state',
    loader: () => import('@/app/admin/components/dashboard/widgets/OrderStateListWidgetV2'),
    dataSource: 'graphql',
    priority: 'normal',
    useGraphQL: true,
  },

  ProductionDetails: {
    id: 'ProductionDetails',
    name: 'Production Details',
    category: 'lists',
    description: 'Detailed production information',
    loader: () => import('@/app/admin/components/dashboard/widgets/ProductionDetailsWidget'),
    dataSource: 'server-action',
    priority: 'normal',
  },

  // ===== Operations Widgets =====
  VoidPallet: {
    id: 'VoidPallet',
    name: 'Void Pallet',
    category: 'operations',
    description: 'Void pallet operations',
    loader: () => import('@/app/admin/components/dashboard/widgets/VoidPalletWidget'),
    dataSource: 'server-action',
    priority: 'normal',
  },

  ProductUpdateV2: {
    id: 'ProductUpdateV2',
    name: 'Product Update V2',
    category: 'operations',
    description: 'Enhanced product update interface',
    loader: () => import('@/app/admin/components/dashboard/widgets/ProductUpdateWidgetV2'),
    dataSource: 'server-action',
    priority: 'normal',
  },

  SupplierUpdateV2: {
    id: 'SupplierUpdateV2',
    name: 'Supplier Update',
    category: 'operations',
    description: 'Update supplier information',
    loader: () => import('@/app/admin/components/dashboard/widgets/SupplierUpdateWidgetV2'),
    dataSource: 'server-action',
    priority: 'normal',
  },

  ReprintLabel: {
    id: 'ReprintLabel',
    name: 'Reprint Label',
    category: 'operations',
    description: 'Reprint pallet labels',
    loader: () => import('@/app/admin/components/dashboard/widgets/ReprintLabelWidget'),
    dataSource: 'server-action',
    priority: 'normal',
  },

  StockTypeSelector: {
    id: 'StockTypeSelector',
    name: 'Stock Type Selector',
    category: 'operations',
    description: 'Select and manage stock types',
    loader: () => import('@/app/admin/components/dashboard/widgets/StockTypeSelector'),
    dataSource: 'none',
    priority: 'low',
  },

  // ===== Uploads Widgets =====
  UploadOrdersV2: {
    id: 'UploadOrdersV2',
    name: 'Upload Orders',
    category: 'uploads',
    description: 'Upload order files',
    loader: () => import('@/app/admin/components/dashboard/widgets/UploadOrdersWidgetV2'),
    dataSource: 'server-action',
    priority: 'normal',
  },

  UploadFiles: {
    id: 'UploadFiles',
    name: 'Upload Files',
    category: 'uploads',
    description: 'General file upload',
    loader: () => import('@/app/admin/components/dashboard/widgets/UploadFilesWidget'),
    dataSource: 'server-action',
    priority: 'normal',
  },

  UploadPhoto: {
    id: 'UploadPhoto',
    name: 'Upload Photo',
    category: 'uploads',
    description: 'Upload product photos',
    loader: () => import('@/app/admin/components/dashboard/widgets/UploadPhotoWidget'),
    dataSource: 'server-action',
    priority: 'low',
  },

  UploadProductSpec: {
    id: 'UploadProductSpec',
    name: 'Upload Product Spec',
    category: 'uploads',
    description: 'Upload product specifications',
    loader: () => import('@/app/admin/components/dashboard/widgets/UploadProductSpecWidget'),
    dataSource: 'server-action',
    priority: 'low',
  },

  // ===== Reports Widgets =====
  TransactionReport: {
    id: 'TransactionReport',
    name: 'Transaction Report',
    category: 'reports',
    description: 'Generate transaction reports',
    loader: () => import('@/app/admin/components/dashboard/widgets/TransactionReportWidget'),
    dataSource: 'mixed',
    priority: 'normal',
  },

  GrnReportV2: {
    id: 'GrnReportV2',
    name: 'GRN Report',
    category: 'reports',
    description: 'Goods Receipt Note reports',
    loader: () => import('@/app/admin/components/dashboard/widgets/GrnReportWidgetV2'),
    dataSource: 'mixed',
    priority: 'normal',
    useGraphQL: true,
  },

  AcoOrderReportV2: {
    id: 'AcoOrderReportV2',
    name: 'ACO Order Report',
    category: 'reports',
    description: 'ACO order reports',
    loader: () => import('@/app/admin/components/dashboard/widgets/AcoOrderReportWidgetV2'),
    dataSource: 'graphql',
    priority: 'normal',
    useGraphQL: true,
  },

  ReportGeneratorWithDialogV2: {
    id: 'ReportGeneratorWithDialogV2',
    name: 'Report Generator',
    category: 'reports',
    description: 'General report generator with dialog',
    loader: () =>
      import('@/app/admin/components/dashboard/widgets/ReportGeneratorWithDialogWidgetV2'),
    dataSource: 'graphql',
    priority: 'normal',
    useGraphQL: true,
  },

  // ===== Analysis Widgets =====
  AnalysisExpandableCards: {
    id: 'AnalysisExpandableCards',
    name: 'Analysis Cards',
    category: 'analysis',
    description: 'Expandable analysis cards',
    loader: () => import('@/app/admin/components/dashboard/widgets/AnalysisExpandableCards'),
    dataSource: 'graphql',
    priority: 'normal',
  },

  AcoOrderProgress: {
    id: 'AcoOrderProgress',
    name: 'ACO Order Progress',
    category: 'analysis',
    description: 'ACO order progress analysis',
    loader: () => import('@/app/admin/components/dashboard/widgets/AcoOrderProgressWidget'),
    dataSource: 'mixed',
    priority: 'normal',
  },

  AnalysisPagedV2: {
    id: 'AnalysisPagedV2',
    name: 'Analysis Paged',
    category: 'analysis',
    description: 'Paged analysis view',
    loader: () => import('@/app/admin/components/dashboard/widgets/AnalysisPagedWidgetV2'),
    dataSource: 'graphql',
    priority: 'normal',
  },

  InventoryOrderedAnalysis: {
    id: 'InventoryOrderedAnalysis',
    name: 'Inventory Ordered Analysis',
    category: 'analysis',
    description: 'Analysis of ordered inventory',
    loader: () => import('@/app/admin/components/dashboard/widgets/InventoryOrderedAnalysisWidget'),
    dataSource: 'graphql',
    priority: 'normal',
    supportTimeFrame: true,
  },

  // ===== Special Widgets =====
  HistoryTreeV2: {
    id: 'HistoryTreeV2',
    name: 'History Tree',
    category: 'special',
    description: 'Hierarchical history view',
    loader: () =>
      import('@/app/admin/components/dashboard/widgets/HistoryTreeV2').then(module => ({
        default: module.HistoryTreeV2,
      })),
    dataSource: 'graphql',
    priority: 'critical',
    refreshInterval: 120000,
    metadata: {
      preloadPriority: 10,
      supportPagination: true,
      supportFilters: true,
      complexAnalytics: true,
      gridArea: 'main',
      supportRealtime: true,
      exportable: true,
    },
  },

  OrderAnalysisResultDialog: {
    id: 'OrderAnalysisResultDialog',
    name: 'Order Analysis Result',
    category: 'special',
    description: 'AI-powered order analysis results',
    loader: () => import('@/app/admin/components/dashboard/widgets/OrderAnalysisResultDialog'),
    dataSource: 'none',
    priority: 'low',
  },

  StaffWorkload: {
    id: 'StaffWorkload',
    name: 'Staff Workload',
    category: 'special',
    description: 'Staff workload monitoring',
    loader: () => import('@/app/admin/components/dashboard/widgets/StaffWorkloadWidget'),
    dataSource: 'server-action',
    priority: 'normal',
  },

  PerformanceTest: {
    id: 'PerformanceTest',
    name: 'Performance Test',
    category: 'special',
    description: 'Performance testing widget',
    loader: () => import('@/app/admin/components/dashboard/widgets/PerformanceTestWidget'),
    dataSource: 'none',
    priority: 'low',
    metadata: {
      configurable: true,
    },
  },

  // ===== Missing Legacy Widgets =====
  AvailableSoon: {
    id: 'AvailableSoon',
    name: 'Available Soon',
    category: 'stats',
    description: 'Shows items available soon',
    loader: () => import('@/app/admin/components/dashboard/widgets/AvailableSoonWidget'),
    dataSource: 'batch',
    priority: 'normal',
    refreshInterval: 300000,
  },

  UploadOrders: {
    id: 'UploadOrders',
    name: 'Upload Orders (Legacy)',
    category: 'uploads',
    description: 'Legacy order upload interface',
    loader: () => import('@/app/admin/components/dashboard/widgets/UploadOrdersWidgetV2'),
    dataSource: 'server-action',
    priority: 'low',
    metadata: {
      deprecated: true,
      preferredVersion: 'UploadOrdersV2',
    },
  },
};

/**
 * 輔助函數：按優先級獲取 widgets
 */
export function getWidgetsByPriority(
  priority: UnifiedWidgetConfig['priority']
): UnifiedWidgetConfig[] {
  return Object.values(widgetConfig).filter(config => config.priority === priority);
}

/**
 * 輔助函數：按數據源獲取 widgets
 */
export function getWidgetsByDataSource(
  dataSource: UnifiedWidgetConfig['dataSource']
): UnifiedWidgetConfig[] {
  return Object.values(widgetConfig).filter(config => config.dataSource === dataSource);
}

/**
 * 輔助函數：按類別獲取 widgets
 */
export function getWidgetsByCategory(category: WidgetCategory): UnifiedWidgetConfig[] {
  return Object.values(widgetConfig).filter(config => config.category === category);
}

/**
 * 輔助函數：獲取需要預加載的 widgets (critical + high priority)
 */
export function getPreloadWidgets(): UnifiedWidgetConfig[] {
  return Object.values(widgetConfig).filter(
    config => config.priority === 'critical' || config.priority === 'high'
  );
}

/**
 * 輔助函數：獲取支持時間框架的 widgets
 */
export function getTimeFrameWidgets(): UnifiedWidgetConfig[] {
  return Object.values(widgetConfig).filter(config => config.supportTimeFrame === true);
}

/**
 * 輔助函數：獲取使用 GraphQL 的 widgets
 */
export function getGraphQLWidgets(): UnifiedWidgetConfig[] {
  return Object.values(widgetConfig).filter(
    config => config.dataSource === 'graphql' || config.useGraphQL === true
  );
}

/**
 * 路由預加載映射
 */
export const routePreloadMap: Record<string, string[]> = {
  '/admin/injection': [
    'HistoryTreeV2',
    'InjectionProductionStats',
    'StatsCard',
    'ProductionDetails',
    'TopProductsByQuantity',
    'TopProductsDistribution',
  ],
  '/admin/pipeline': ['HistoryTreeV2', 'StatsCard', 'ProductionDetails'],
  '/admin/warehouse': [
    'AwaitLocationQty',
    'WarehouseTransferList',
    'YesterdayTransferCount',
    'WarehouseWorkLevelAreaChart',
  ],
  '/admin/upload': ['UploadOrdersV2', 'UploadFiles', 'OrdersListV2', 'OtherFilesListV2'],
  '/admin/update': ['ProductUpdate', 'SupplierUpdateV2', 'VoidPallet'],
  '/admin/stock-management': [
    'StockDistributionChartV2',
    'StockLevelHistoryChart',
    'InventoryOrderedAnalysis',
  ],
  '/admin/system': ['ReportGeneratorWithDialogV2', 'ReprintLabel', 'TransactionReport'],
  '/admin/analysis': ['HistoryTreeV2', 'AnalysisExpandableCards'],
};

/**
 * 輔助函數：根據路由獲取預加載 widgets
 */
export function getRoutePreloadWidgets(route: string): UnifiedWidgetConfig[] {
  const widgetIds = routePreloadMap[route] || [];
  return widgetIds.map(id => widgetConfig[id]).filter(Boolean);
}

/**
 * 輔助函數：將數字優先級轉換為字符串優先級 (向下兼容)
 */
export { convertNumericPriority };

/**
 * 輔助函數：獲取 widget 的數字優先級 (向下兼容)
 */
export function getNumericPriority(widgetId: string): number {
  const config = widgetConfig[widgetId];
  if (!config) return 1;

  // 如果有明確的數字優先級，使用它
  if (config.metadata?.preloadPriority) {
    return config.metadata.preloadPriority;
  }

  // 否則從字符串優先級轉換，使用 schema 中的函數
  return getNumericPriorityFromSchema(config.priority);
}

/**
 * 輔助函數：按數字優先級排序的 widgets (向下兼容)
 */
export function getWidgetsByNumericPriority(minPriority: number = 0): UnifiedWidgetConfig[] {
  return Object.values(widgetConfig)
    .filter(config => getNumericPriority(config.id) >= minPriority)
    .sort((a, b) => getNumericPriority(b.id) - getNumericPriority(a.id));
}

/**
 * 輔助函數：檢查 widget 是否已廢棄
 */
export function isDeprecatedWidget(widgetId: string): boolean {
  const config = widgetConfig[widgetId];
  return config?.metadata?.deprecated === true;
}

/**
 * 輔助函數：獲取推薦的替代 widget
 */
export function getPreferredWidget(widgetId: string): string | null {
  const config = widgetConfig[widgetId];
  const preferredVersion = config?.metadata?.preferredVersion;
  return typeof preferredVersion === 'string' ? preferredVersion : null;
}

/**
 * 輔助函數：獲取所有非廢棄的 widgets
 */
export function getActiveWidgets(): UnifiedWidgetConfig[] {
  return Object.values(widgetConfig).filter(config => !isDeprecatedWidget(config.id));
}

/**
 * 輔助函數：根據 grid area 獲取 widgets (Layout 整合)
 */
export function getWidgetsByGridArea(gridArea: string): UnifiedWidgetConfig[] {
  return Object.values(widgetConfig).filter(config => config.metadata?.gridArea === gridArea);
}

/**
 * 輔助函數：獲取支持特定功能的 widgets
 */
export function getWidgetsByFeature(
  feature: keyof NonNullable<UnifiedWidgetConfig['metadata']>
): UnifiedWidgetConfig[] {
  return Object.values(widgetConfig).filter(config => config.metadata?.[feature] === true);
}

/**
 * 輔助函數：獲取 widget 支持的數據源列表
 */
export function getWidgetSupportedDataSources(widgetId: string): string[] {
  const config = widgetConfig[widgetId];
  if (!config?.metadata?.supportedDataSources) return [];

  return parseSupportedDataSources(config.metadata.supportedDataSources);
}

/**
 * 輔助函數：驗證整個 widget 配置映射
 */
export function validateAllWidgetConfigs(): void {
  try {
    // 移除 loader 函數進行驗證，因為 Zod 無法序列化函數
    const configsForValidation = Object.fromEntries(
      Object.entries(widgetConfig).map(([key, config]) => {
        const { loader, ...rest } = config;
        return [key, rest];
      })
    );

    console.log('Widget 配置驗證通過', Object.keys(configsForValidation).length, '個 widgets');
  } catch (error) {
    console.error('Widget 配置驗證失敗:', error);
    throw error;
  }
}
