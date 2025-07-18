/**
 * 儀表板類型定義
 */

// 小部件類型枚舉
export enum WidgetType {
  STATS_CARD = 'stats_card',
  ANALYTICS_CHART = 'analytics_chart',
  RECENT_ACTIVITY = 'recent_activity',
  STOCK_SUMMARY = 'stock_summary',
  ALERTS = 'alerts',
  PRODUCT_MIX_CHART = 'product_mix_chart',
  ACO_ORDER_PROGRESS = 'aco_order_progress',
  VOID_STATS = 'void_stats',
  VOID_PALLET = 'void_pallet',
  UPLOAD_FILES = 'upload_files',
  PRODUCT_SPEC = 'product_spec',
  ANALYTICS_DASHBOARD = 'analytics_dashboard',
  REPORTS = 'reports',
  CUSTOM = 'custom',
  TODAY_PRODUCTION = 'today_production',
  MACHINE_EFFICIENCY = 'machine_efficiency',
  TARGET_HIT_RATE = 'target_hit_rate',
}

// Widget size 相關定義已移除 - admin dashboard 使用固定佈局

// 小部件基礎配置
export interface WidgetBaseConfig {
  refreshInterval?: number; // 自動刷新間隔（毫秒）
  dataSource?: string; // 數據源
  displayOptions?: Record<string, unknown>; // 顯示選項
  // size 已移除 - admin dashboard 使用固定佈局
  timeRange?: string; // 時間範圍
  [key: string]: unknown; // 擴展配置
}

// 儀表板小部件
export interface DashboardWidget {
  id: string; // 唯一標識
  type: WidgetType; // 小部件類型
  title: string; // 顯示標題
  config: WidgetBaseConfig; // 小部件配置
  permissions?: string[]; // 權限要求
}

// 儀表板佈局項目
export interface DashboardLayoutItem {
  i: string; // widget id
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

// 儀表板配置
export interface DashboardConfig {
  id?: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layouts: {
    lg?: DashboardLayoutItem[];
    md?: DashboardLayoutItem[];
    sm?: DashboardLayoutItem[];
    xs?: DashboardLayoutItem[];
    xxs?: DashboardLayoutItem[];
  };
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// 簡化的 Dashboard Layout（用於 admin page）
export interface DashboardLayout {
  widgets: WidgetConfig[];
}

// Widget 配置（用於 admin page）
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  gridProps: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
  config: {
    // size 已移除 - admin dashboard 使用固定佈局
    refreshInterval?: number;
    timeRange?: string;
    [key: string]: unknown;
  };
}

// 小部件組件屬性基礎接口
export interface BaseWidgetComponentProps {
  isEditMode?: boolean;
  onUpdate?: (config: WidgetBaseConfig) => void;
  onRemove?: () => void;
  timeFrame?: {
    start: Date;
    end: Date;
  };
}

// 傳統 Widget 組件屬性（使用 widget 對象）
export interface TraditionalWidgetComponentProps extends BaseWidgetComponentProps {
  widget: DashboardWidget | WidgetConfig;
  widgetId?: never;
}

// 批量查詢 Widget 組件屬性（使用 widgetId 字符串）
export interface BatchQueryWidgetComponentProps extends BaseWidgetComponentProps {
  widgetId: string;
  widget?: never;
}

// 聯合類型，支持兩種模式
export type WidgetComponentProps = TraditionalWidgetComponentProps | BatchQueryWidgetComponentProps;

// 小部件註冊表項目
export interface WidgetRegistryItem {
  type: WidgetType;
  name: string;
  description: string;
  icon?: React.ComponentType | string;
  component: React.ComponentType<WidgetComponentProps>;
  defaultConfig: WidgetBaseConfig;
}
