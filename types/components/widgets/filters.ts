/**
 * Widget 過濾器相關類型
 * Widget filter types and configurations
 */

/**
 * 過濾器值類型
 */
export type FilterValue = string | number | Date | boolean | null | (string | number)[];

/**
 * 過濾器操作符
 */
export type FilterOperator =
  | 'eq' // 等於
  | 'ne' // 不等於
  | 'gt' // 大於
  | 'gte' // 大於等於
  | 'lt' // 小於
  | 'lte' // 小於等於
  | 'contains' // 包含
  | 'notContains' // 不包含
  | 'startsWith' // 開頭是
  | 'endsWith' // 結尾是
  | 'in' // 在...中
  | 'notIn' // 不在...中
  | 'between' // 在...之間
  | 'isNull' // 為空
  | 'isNotNull'; // 不為空

/**
 * 過濾器條件
 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: FilterValue;
  dataType?: 'string' | 'number' | 'date' | 'boolean';
}

/**
 * 過濾器組
 */
export interface FilterGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: FilterCondition[];
  groups?: FilterGroup[];
}

/**
 * 過濾器狀態
 */
export interface FilterState {
  rootGroup: FilterGroup;
  activeFilters: FilterCondition[];
  isActive: boolean;
  lastApplied?: Date;
}

/**
 * 日期範圍過濾器
 */
export interface DateRangeFilter {
  type: 'dateRange';
  startDate?: Date;
  endDate?: Date;
  preset?:
    | 'today'
    | 'yesterday'
    | 'thisWeek'
    | 'lastWeek'
    | 'thisMonth'
    | 'lastMonth'
    | 'thisYear'
    | 'lastYear'
    | 'custom';
  includeTime?: boolean;
}

/**
 * 文本搜尋過濾器
 */
export interface TextSearchFilter {
  type: 'textSearch';
  query: string;
  fields: string[];
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
}

/**
 * 下拉選擇過濾器
 */
export interface SelectFilter {
  type: 'select';
  field: string;
  options: Array<{
    label: string;
    value: string | number;
    count?: number;
  }>;
  multiple?: boolean;
  selected: FilterValue;
}

/**
 * 數值範圍過濾器
 */
export interface NumberRangeFilter {
  type: 'numberRange';
  field: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

/**
 * 標籤過濾器
 */
export interface TagFilter {
  type: 'tag';
  field: string;
  tags: string[];
  mode: 'include' | 'exclude';
}

/**
 * 聯合過濾器類型
 */
export type Filter =
  | DateRangeFilter
  | TextSearchFilter
  | SelectFilter
  | NumberRangeFilter
  | TagFilter;

/**
 * 過濾器配置
 */
export interface FilterConfig {
  id: string;
  type: Filter['type'];
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: FilterValue;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  dependencies?: string[]; // 依賴的其他過濾器ID
}

/**
 * 過濾器組件屬性
 */
export interface FilterComponentProps {
  config: FilterConfig;
  value: FilterValue;
  onChange: (value: FilterValue) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
}

/**
 * 過濾器面板屬性
 */
export interface FilterPanelProps {
  filters: FilterConfig[];
  state: FilterState;
  onChange: (state: FilterState) => void;
  onApply: (filters: FilterCondition[]) => void;
  onReset: () => void;
  onClose?: () => void;
  className?: string;
}

/**
 * 快速過濾器屬性
 */
export interface QuickFilterProps {
  presets: Array<{
    label: string;
    filters: FilterCondition[];
    icon?: string;
  }>;
  onSelect: (filters: FilterCondition[]) => void;
  className?: string;
}

/**
 * 過濾器歷史記錄
 */
export interface FilterHistory {
  id: string;
  name: string;
  filters: FilterCondition[];
  createdAt: Date;
  usageCount: number;
}

/**
 * 過濾器存儲配置
 */
export interface FilterStorage {
  enabled: boolean;
  key: string;
  maxHistory: number;
  autoSave: boolean;
}
