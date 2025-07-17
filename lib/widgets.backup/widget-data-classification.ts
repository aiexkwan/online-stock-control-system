/**
 * Widget Data Classification
 * 根據讀寫模式對所有 widgets 進行分類
 * 用於指導數據獲取策略的優化
 */

export type DataMode = 'read-only' | 'write-only' | 'read-write';
export type WidgetDataMode = DataMode | 'real-time'; // Extended for smart cache

export interface WidgetDataClassification {
  widgetId: string;
  mode: DataMode;
  dataStrategy: 'rest' | 'server-action' | 'mixed';
  notes?: string;
}

/**
 * Widget 分類映射
 * 基於實際功能分析的結果
 */
export const widgetDataClassification: Record<string, WidgetDataClassification> = {
  // ===== Read-Only Widgets (22個) =====
  // 使用 REST API + 批量查詢優化
  
  // Stats widgets
  AwaitLocationQty: {
    widgetId: 'AwaitLocationQty',
    mode: 'read-only',
    dataStrategy: 'rest',
    notes: '批量查詢系統已優化',
  },
  YesterdayTransferCount: {
    widgetId: 'YesterdayTransferCount',
    mode: 'read-only',
    dataStrategy: 'rest',
    notes: '批量查詢系統已優化',
  },
  StillInAwait: {
    widgetId: 'StillInAwait',
    mode: 'read-only',
    dataStrategy: 'rest',
  },
  StillInAwaitPercentage: {
    widgetId: 'StillInAwaitPercentage',
    mode: 'read-only',
    dataStrategy: 'rest',
  },
  StatsCard: {
    widgetId: 'StatsCard',
    mode: 'read-only',
    dataStrategy: 'rest',
    notes: '批量查詢系統已優化',
  },
  InjectionProductionStats: {
    widgetId: 'InjectionProductionStats',
    mode: 'read-only',
    dataStrategy: 'rest',
    notes: 'REST API 優化版本',
  },

  // Charts widgets
  StockDistributionChartV2: {
    widgetId: 'StockDistributionChartV2',
    mode: 'read-only',
    dataStrategy: 'rest',
    notes: '批量查詢系統已優化',
  },
  StockLevelHistoryChart: {
    widgetId: 'StockLevelHistoryChart',
    mode: 'read-only',
    dataStrategy: 'rest',
  },
  WarehouseWorkLevelAreaChart: {
    widgetId: 'WarehouseWorkLevelAreaChart',
    mode: 'read-only',
    dataStrategy: 'rest',
    notes: '批量查詢系統已優化',
  },
  TransferTimeDistribution: {
    widgetId: 'TransferTimeDistribution',
    mode: 'read-only',
    dataStrategy: 'rest',
  },
  ProductDistributionChart: {
    widgetId: 'ProductDistributionChart',
    mode: 'read-only',
    dataStrategy: 'rest',
  },
  TopProductsByQuantity: {
    widgetId: 'TopProductsByQuantity',
    mode: 'read-only',
    dataStrategy: 'rest',
  },
  TopProductsDistribution: {
    widgetId: 'TopProductsDistribution',
    mode: 'read-only',
    dataStrategy: 'rest',
  },

  // Lists widgets
  OrdersListV2: {
    widgetId: 'OrdersListV2',
    mode: 'read-only',
    dataStrategy: 'rest',
    notes: 'REST API V2 版本',
  },
  OtherFilesListV2: {
    widgetId: 'OtherFilesListV2',
    mode: 'read-only',
    dataStrategy: 'rest',
    notes: 'REST API V2 版本',
  },
  WarehouseTransferList: {
    widgetId: 'WarehouseTransferList',
    mode: 'read-only',
    dataStrategy: 'rest',
    notes: '批量查詢系統已優化',
  },
  OrderStateListV2: {
    widgetId: 'OrderStateListV2',
    mode: 'read-only',
    dataStrategy: 'rest',
    notes: 'REST API V2 版本',
  },
  ProductionDetails: {
    widgetId: 'ProductionDetails',
    mode: 'read-only',
    dataStrategy: 'server-action',
    notes: '使用 Server Action 獲取數據',
  },

  // Analysis widgets
  AnalysisExpandableCards: {
    widgetId: 'AnalysisExpandableCards',
    mode: 'read-only',
    dataStrategy: 'rest',
  },
  AnalysisPagedV2: {
    widgetId: 'AnalysisPagedV2',
    mode: 'read-only',
    dataStrategy: 'rest',
  },
  InventoryOrderedAnalysis: {
    widgetId: 'InventoryOrderedAnalysis',
    mode: 'read-only',
    dataStrategy: 'rest',
  },

  // Special widgets
  HistoryTreeV2: {
    widgetId: 'HistoryTreeV2',
    mode: 'read-only',
    dataStrategy: 'rest',
    notes: '核心 widget，高優先級',
  },
  StockTypeSelector: {
    widgetId: 'StockTypeSelector',
    mode: 'read-only',
    dataStrategy: 'rest',
    notes: '已遷移至 REST API',
  },

  // ===== Write-Only Widgets (6個) =====
  // 使用 Server Actions
  
  UploadOrdersV2: {
    widgetId: 'UploadOrdersV2',
    mode: 'write-only',
    dataStrategy: 'server-action',
  },
  UploadFiles: {
    widgetId: 'UploadFiles',
    mode: 'write-only',
    dataStrategy: 'server-action',
    notes: '已遷移，移除 createClient',
  },
  UploadPhoto: {
    widgetId: 'UploadPhoto',
    mode: 'write-only',
    dataStrategy: 'server-action',
    notes: '已遷移，移除 createClient',
  },
  UploadProductSpec: {
    widgetId: 'UploadProductSpec',
    mode: 'write-only',
    dataStrategy: 'server-action',
    notes: '已遷移，移除 createClient',
  },
  ProductUpdate: {
    widgetId: 'ProductUpdate',
    mode: 'write-only',
    dataStrategy: 'server-action',
  },
  ProductUpdateV2: {
    widgetId: 'ProductUpdateV2',
    mode: 'write-only',
    dataStrategy: 'server-action',
  },

  // ===== Read-Write Widgets (3個) =====
  // 混合模式，清晰分離讀寫邏輯
  
  VoidPallet: {
    widgetId: 'VoidPallet',
    mode: 'read-write',
    dataStrategy: 'mixed',
    notes: '讀：搜索棧板；寫：作廢操作。已使用 Server Actions',
  },
  SupplierUpdateV2: {
    widgetId: 'SupplierUpdateV2',
    mode: 'read-write',
    dataStrategy: 'mixed',
    notes: '讀：REST API 搜索；寫：Server Actions。已遷移',
  },
  ReprintLabel: {
    widgetId: 'ReprintLabel',
    mode: 'read-write',
    dataStrategy: 'mixed',
    notes: '讀：搜索標籤；寫：重印操作',
  },

  // ===== Reports (特殊分類) =====
  // 主要是讀取數據生成報告，但也涉及寫入（如日誌）
  
  TransactionReport: {
    widgetId: 'TransactionReport',
    mode: 'read-only',
    dataStrategy: 'server-action',
    notes: '生成報告，主要是讀取',
  },
  GrnReportV2: {
    widgetId: 'GrnReportV2',
    mode: 'read-only',
    dataStrategy: 'mixed',
    notes: '使用 DashboardAPI，已遷移',
  },
  AcoOrderReportV2: {
    widgetId: 'AcoOrderReportV2',
    mode: 'read-only',
    dataStrategy: 'rest',
  },
  ReportGeneratorWithDialogV2: {
    widgetId: 'ReportGeneratorWithDialogV2',
    mode: 'read-only',
    dataStrategy: 'rest',
  },
  AcoOrderProgress: {
    widgetId: 'AcoOrderProgress',
    mode: 'read-only',
    dataStrategy: 'mixed',
    notes: '使用 useUnifiedAPI',
  },
  
  // Others
  OrderAnalysisResultDialog: {
    widgetId: 'OrderAnalysisResultDialog',
    mode: 'read-only',
    dataStrategy: 'server-action',
    notes: 'AI 分析結果顯示',
  },
  StaffWorkload: {
    widgetId: 'StaffWorkload',
    mode: 'read-only',
    dataStrategy: 'server-action',
  },
};

/**
 * 輔助函數：根據數據模式獲取 widgets
 */
export function getWidgetsByDataMode(mode: DataMode): WidgetDataClassification[] {
  return Object.values(widgetDataClassification).filter(
    widget => widget.mode === mode
  );
}

/**
 * 輔助函數：根據數據策略獲取 widgets
 */
export function getWidgetsByDataStrategy(
  strategy: 'rest' | 'server-action' | 'mixed'
): WidgetDataClassification[] {
  return Object.values(widgetDataClassification).filter(
    widget => widget.dataStrategy === strategy
  );
}

/**
 * 統計信息
 */
export const dataClassificationStats = {
  total: Object.keys(widgetDataClassification).length,
  byMode: {
    'read-only': getWidgetsByDataMode('read-only').length,
    'write-only': getWidgetsByDataMode('write-only').length,
    'read-write': getWidgetsByDataMode('read-write').length,
  },
  byStrategy: {
    rest: getWidgetsByDataStrategy('rest').length,
    'server-action': getWidgetsByDataStrategy('server-action').length,
    mixed: getWidgetsByDataStrategy('mixed').length,
  },
};

// 導出分類結果供其他模組使用
export default widgetDataClassification;