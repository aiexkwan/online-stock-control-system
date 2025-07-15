/**
 * Universal List Widget Types
 * 統一的列表 Widget 類型定義，替代 5 個現有的 list widgets
 */

// Note: DocumentNode removed with GraphQL migration
import { DataTableColumn } from '@/app/admin/components/dashboard/widgets/common/data-display/DataTable';
import { WidgetComponentProps } from '@/app/types/dashboard';

/**
 * 分頁配置
 */
export interface PaginationConfig {
  type: 'infinite' | 'fixed';
  pageSize: number;
  maxPages?: number;
}

/**
 * 實時更新配置
 */
export interface RealtimeConfig {
  enabled: boolean;
  pollInterval: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
}

/**
 * 過濾配置
 */
export interface FilterConfig {
  enabled: boolean;
  filters: {
    id: string;
    type: 'text' | 'select' | 'date' | 'dateRange';
    label: string;
    options?: { value: string; label: string }[];
    defaultValue?: any;
  }[];
}

/**
 * 連接狀態
 */
export interface ConnectionStatus {
  type: 'realtime' | 'polling' | 'offline' | 'error';
  label: string;
  optimized?: boolean;
}

/**
 * 性能指標
 */
export interface PerformanceMetrics {
  source?: string;
  queryTime?: number;
  optimized?: boolean;
  fetchTime?: number;
}

/**
 * 插件接口
 */
export interface WidgetPlugin<T = any> {
  id: string;
  name: string;
  process: (data: T[], context?: any) => T[];
  config?: Record<string, any>;
}

/**
 * 數據源配置
 */
export interface DataSourceConfig<T = any> {
  // Server Action (primary data source)
  serverAction: (variables?: any) => Promise<T[]>;
  
  // 查詢變數
  variables?: Record<string, any>;
  
  // 從 Context 提取數據 (批量查詢優化)
  extractFromContext?: (context: any) => T[] | undefined;
  
  // 數據轉換函數
  transform?: (data: any) => T[];
}

/**
 * 顯示配置
 */
export interface ListDisplayConfig<T = any> {
  // 基本顯示
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  
  // 列定義
  columns: DataTableColumn<T>[];
  keyField: keyof T;
  
  // 表格配置
  showHeader?: boolean;
  striped?: boolean;
  hover?: boolean;
  
  // 空狀態
  emptyMessage?: string;
  emptyIcon?: React.ComponentType<{ className?: string }>;
  
  // 樣式
  className?: string;
  tableClassName?: string;
}

/**
 * 交互配置
 */
export interface InteractionConfig<T = any> {
  // 點擊行為
  rowClickable?: boolean;
  onRowClick?: (item: T) => void;
  
  // 選擇功能
  selectable?: boolean;
  onSelectionChange?: (selectedItems: T[]) => void;
  
  // 刷新功能
  refreshable?: boolean;
  onRefresh?: () => void;
  
  // 下鑽功能
  drillDown?: {
    enabled: boolean;
    getUrl: (item: T) => string;
    target?: '_blank' | '_self';
  };
  
  // 編輯模式
  editMode?: {
    enabled: boolean;
    mockData?: T[];
    placeholder?: string;
  };
}

/**
 * 性能配置
 */
export interface PerformanceConfig {
  // 漸進式加載
  progressiveLoading?: boolean;
  
  // 記憶化
  memoization?: boolean;
  
  // 虛擬化 (大數據列表)
  virtualization?: {
    enabled: boolean;
    itemHeight: number;
    containerHeight: number;
  };
  
  // 緩存策略
  caching?: {
    enabled: boolean;
    duration: number;
    key?: string;
  };
  
  // fallback 數據
  fallbackData?: any[];
}

/**
 * UniversalListWidget 主配置接口
 */
export interface UniversalListWidgetConfig<T = any> {
  // 數據源配置
  dataSource: DataSourceConfig<T>;
  
  // 顯示配置
  display: ListDisplayConfig<T>;
  
  // 分頁配置
  pagination?: PaginationConfig;
  
  // 實時更新配置
  realtime?: RealtimeConfig;
  
  // 過濾配置
  filters?: FilterConfig;
  
  // 交互配置
  interaction?: InteractionConfig<T>;
  
  // 性能配置
  performance?: PerformanceConfig;
  
  // 插件系統
  plugins?: WidgetPlugin<T>[];
}

/**
 * UniversalListWidget 組件 Props
 */
export interface UniversalListWidgetProps<T = any> extends WidgetComponentProps {
  config: UniversalListWidgetConfig<T>;
}

/**
 * 列表數據狀態
 */
export interface ListDataState<T = any> {
  data: T[];
  loading: boolean;
  error: Error | null;
  total?: number;
  hasMore?: boolean;
  page?: number;
}

/**
 * Hook 返回值
 */
export interface UseUniversalListReturn<T = any> extends ListDataState<T> {
  // 操作函數
  refetch: () => void;
  loadMore: () => void;
  refresh: () => void;
  
  // 狀態
  mode: 'context' | 'server-action' | 'fallback';
  lastUpdated: Date | null;
  source: string;
  
  // 性能指標
  performanceMetrics: PerformanceMetrics;
}

/**
 * 常用數據類型定義 (基於現有 widgets)
 */

// Orders 相關
export interface OrderItem {
  id: string;
  orderNumber: string;
  status: string;
  customer?: string;
  date: string;
  amount?: number;
  progress?: number;
  [key: string]: any;
}

// Transfer 相關
export interface TransferItem {
  id: string;
  transferNumber: string;
  fromLocation: string;
  toLocation: string;
  date: string;
  status: string;
  quantity?: number;
  [key: string]: any;
}

// Files 相關
export interface FileItem {
  id: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  size?: number;
  status?: string;
  url?: string;
  [key: string]: any;
}

// Production 相關
export interface ProductionItem {
  id: string;
  productCode: string;
  productName: string;
  quantity: number;
  status: string;
  department?: string;
  date: string;
  [key: string]: any;
}

/**
 * 輔助類型
 */
export type ListWidgetType = 'orders' | 'transfers' | 'files' | 'production' | 'generic';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T = any> {
  field: keyof T;
  direction: SortDirection;
}

export interface FilterState {
  [key: string]: any;
}

/**
 * 創建配置的輔助函數類型
 */
export type CreateListConfigFunction<T> = (
  overrides?: Partial<UniversalListWidgetConfig<T>>
) => UniversalListWidgetConfig<T>;