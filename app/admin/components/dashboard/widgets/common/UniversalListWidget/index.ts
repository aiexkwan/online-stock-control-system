/**
 * Universal List Widget Module
 * 統一的列表 Widget 模組導出
 */

// 主要組件
export { UniversalListWidget as default } from './UniversalListWidget';
export { UniversalListWidget } from './UniversalListWidget';

// Hook
export { useUniversalList, createListConfig, listDataProcessor } from './useUniversalList';

// 類型定義
export type {
  UniversalListWidgetConfig,
  UniversalListWidgetProps,
  UseUniversalListReturn,
  PaginationConfig,
  RealtimeConfig,
  FilterConfig,
  ConnectionStatus,
  PerformanceMetrics,
  WidgetPlugin,
  DataSourceConfig,
  ListDisplayConfig,
  InteractionConfig,
  PerformanceConfig,
  ListDataState,
  OrderItem,
  TransferItem,
  FileItem,
  ProductionItem,
  ListWidgetType,
  SortDirection,
  SortConfig,
  FilterState,
  CreateListConfigFunction,
} from './types';

// 配置
export {
  OrdersListConfig,
  OtherFilesListConfig,
  WarehouseTransferListConfig,
  OrderStateListConfig,
  ProductionDetailsConfig,
  LIST_WIDGET_CONFIGS,
  getListWidgetConfig,
  validateListConfig,
  getAvailableListWidgetIds,
  createDefaultListConfig,
} from './listConfigs';