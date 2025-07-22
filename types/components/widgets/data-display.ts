/**
 * Widget 數據顯示相關類型
 * Data display widget types and configurations
 */

import type { FilterCondition } from './filters';

/**
 * 表格列配置
 */
export interface TableColumn<TData = unknown> {
  id: string;
  key: keyof TData;
  title: string;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  pinned?: 'left' | 'right' | false;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: TData, index: number) => React.ReactNode;
  headerRender?: () => React.ReactNode;
  footerRender?: (data: TData[]) => React.ReactNode;
}

/**
 * 表格排序配置
 */
export interface TableSort {
  column: string;
  direction: 'asc' | 'desc';
}

/**
 * 表格分頁配置
 */
export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  pageSizeOptions?: number[];
}

/**
 * 表格選擇配置
 */
export interface TableSelection<TData = unknown> {
  mode: 'single' | 'multiple' | 'none';
  selectedKeys: (string | number)[];
  onSelectionChange: (keys: (string | number)[], rows: TData[]) => void;
  getRowKey: (row: TData) => string | number;
}

/**
 * 表格配置
 */
export interface TableConfig<TData = unknown> {
  columns: TableColumn<TData>[];
  data: TData[];
  loading?: boolean;
  error?: string | null;
  sort?: TableSort;
  pagination?: TablePagination;
  selection?: TableSelection<TData>;
  filters?: FilterCondition[];
  expandable?: {
    enabled: boolean;
    renderExpanded: (row: TData) => React.ReactNode;
    expandedKeys?: (string | number)[];
  };
  virtual?: {
    enabled: boolean;
    itemHeight: number;
    overscan?: number;
  };
  sticky?: {
    header: boolean;
    footer: boolean;
  };
}

/**
 * 表格組件屬性
 */
export interface DataTableProps<TData = unknown> extends TableConfig<TData> {
  className?: string;
  height?: number | string;
  onSort?: (sort: TableSort) => void;
  onFilter?: (filters: FilterCondition[]) => void;
  onPageChange?: (page: number, pageSize: number) => void;
  onRowClick?: (row: TData, index: number) => void;
  onRowDoubleClick?: (row: TData, index: number) => void;
}

/**
 * 指標卡片配置
 */
export interface MetricCardConfig {
  title: string;
  value: string | number;
  unit?: string;
  description?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: number;
    label: string;
  };
  comparison?: {
    value: string | number;
    label: string;
    isPositive?: boolean;
  };
  icon?: string | React.ComponentType;
  color?: string;
  format?: {
    type: 'number' | 'currency' | 'percentage';
    decimals?: number;
    locale?: string;
    currency?: string;
  };
}

/**
 * 指標卡片組件屬性
 */
export interface MetricCardProps extends MetricCardConfig {
  loading?: boolean;
  error?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'detailed';
  onClick?: () => void;
}

/**
 * 列表項配置
 */
export interface ListItemConfig {
  id: string | number;
  title: string;
  subtitle?: string;
  description?: string;
  avatar?: {
    type: 'image' | 'icon' | 'text';
    src?: string;
    icon?: string | React.ComponentType;
    text?: string;
    color?: string;
  };
  badge?: {
    text: string;
    color?: string;
    variant?: 'default' | 'success' | 'warning' | 'error';
  };
  actions?: Array<{
    label: string;
    icon?: string | React.ComponentType;
    onClick: (item: ListItemConfig) => void;
    disabled?: boolean;
  }>;
  metadata?: Record<string, unknown>;
}

/**
 * 列表配置
 */
export interface ListConfig {
  items: ListItemConfig[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  variant?: 'default' | 'compact' | 'detailed';
  groupBy?: {
    key: string;
    renderGroup: (key: string, items: ListItemConfig[]) => React.ReactNode;
  };
  search?: {
    enabled: boolean;
    placeholder?: string;
    fields: string[];
  };
  infinite?: {
    enabled: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
  };
}

/**
 * 列表組件屬性
 */
export interface DataListProps extends ListConfig {
  className?: string;
  height?: number | string;
  onItemClick?: (item: ListItemConfig) => void;
  onItemSelect?: (items: ListItemConfig[]) => void;
}

/**
 * 統計摘要配置
 */
export interface StatsSummaryConfig {
  title?: string;
  metrics: MetricCardConfig[];
  layout: 'grid' | 'horizontal' | 'vertical';
  columns?: number;
  spacing?: 'sm' | 'md' | 'lg';
}

/**
 * 統計摘要組件屬性
 */
export interface StatsSummaryProps extends StatsSummaryConfig {
  className?: string;
  loading?: boolean;
  error?: string | null;
}

/**
 * 數據展示工具函數類型
 */
export interface DataDisplayUtils {
  formatValue: (value: unknown, format?: MetricCardConfig['format']) => string;
  sortData: <T>(data: T[], sort: TableSort) => T[];
  filterData: <T>(data: T[], filters: FilterCondition[]) => T[];
  paginateData: <T>(data: T[], pagination: TablePagination) => T[];
  exportData: <T>(data: T[], format: 'csv' | 'excel' | 'json') => Promise<Blob>;
}
