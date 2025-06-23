/**
 * 儀表板類型定義
 */

// 小部件類型枚舉
export enum WidgetType {
  STATS_CARD = 'stats_card',
  ANALYTICS_CHART = 'analytics_chart',
  RECENT_ACTIVITY = 'recent_activity',
  QUICK_ACTIONS = 'quick_actions',
  STOCK_SUMMARY = 'stock_summary',
  ALERTS = 'alerts',
  OUTPUT_STATS = 'output_stats',
  BOOKED_OUT_STATS = 'booked_out_stats',
  PRODUCT_MIX_CHART = 'product_mix_chart',
  ACO_ORDER_PROGRESS = 'aco_order_progress',
  INVENTORY_SEARCH = 'inventory_search',
  FINISHED_PRODUCT = 'finished_product',
  MATERIAL_RECEIVED = 'material_received',
  PALLET_OVERVIEW = 'pallet_overview',
  VOID_STATS = 'void_stats',
  VOID_PALLET = 'void_pallet',
  VIEW_HISTORY = 'view_history',
  DATABASE_UPDATE = 'database_update',
  UPLOAD_FILES = 'upload_files',
  UPLOAD_ORDER_PDF = 'upload_order_pdf',
  PRODUCT_SPEC = 'product_spec',
  ANALYTICS_DASHBOARD = 'analytics_dashboard',
  REPORTS = 'reports',
  CUSTOM = 'custom',
  TODAY_PRODUCTION = 'today_production',
  MACHINE_EFFICIENCY = 'machine_efficiency',
  TARGET_HIT_RATE = 'target_hit_rate'
}

// 小部件尺寸
export enum WidgetSize {
  SMALL = 'small',    // 1x1 - 只顯示統計數值
  MEDIUM = 'medium',  // 3x3 - 添加更多資訊
  LARGE = 'large',    // 5x5 - 完整功能包括圖表
  XLARGE = 'xlarge',  // 6x6 - 擴展功能（如 Ask Database）
  TALL_MEDIUM = 'tall_medium' // 2x5 - 高瘦型佈局
}

// iOS 風格尺寸預設 - 正方形比例
export const WidgetSizeConfig = {
  [WidgetSize.SMALL]: { w: 1, h: 1 },     // 1x1 (正方形)
  [WidgetSize.MEDIUM]: { w: 3, h: 3 },    // 3x3 (正方形)
  [WidgetSize.LARGE]: { w: 5, h: 5 },     // 5x5 (正方形)
  [WidgetSize.XLARGE]: { w: 6, h: 6 },    // 6x6 (正方形)
  [WidgetSize.TALL_MEDIUM]: { w: 2, h: 5 } // 2x5 (高瘦型)
};

// 用於編輯模式的彈性尺寸配置 - 允許在範圍內拖動（保持正方形比例）
export const FlexibleWidgetSizeConfig = {
  [WidgetSize.SMALL]: { minW: 1, maxW: 2, minH: 1, maxH: 2 },
  [WidgetSize.MEDIUM]: { minW: 2, maxW: 4, minH: 2, maxH: 4 },
  [WidgetSize.LARGE]: { minW: 4, maxW: 6, minH: 4, maxH: 6 },
  [WidgetSize.XLARGE]: { minW: 6, maxW: 6, minH: 6, maxH: 6 },
  [WidgetSize.TALL_MEDIUM]: { minW: 2, maxW: 2, minH: 5, maxH: 5 }
};

// 小部件基礎配置
export interface WidgetBaseConfig {
  refreshInterval?: number;     // 自動刷新間隔（毫秒）
  dataSource?: string;          // 數據源
  displayOptions?: any;         // 顯示選項
  size?: WidgetSize;           // 小部件尺寸
  timeRange?: string;          // 時間範圍
  [key: string]: any;          // 擴展配置
}

// 儀表板小部件
export interface DashboardWidget {
  id: string;                    // 唯一標識
  type: WidgetType;             // 小部件類型
  title: string;                // 顯示標題
  config: WidgetBaseConfig;     // 小部件配置
  permissions?: string[];       // 權限要求
}

// 儀表板佈局項目
export interface DashboardLayoutItem extends Layout {
  i: string;  // widget id
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
    size?: WidgetSize;
    refreshInterval?: number;
    timeRange?: string;
    [key: string]: any;
  };
}

// 小部件組件屬性
export interface WidgetComponentProps {
  widget: DashboardWidget | WidgetConfig;
  isEditMode?: boolean;
  onUpdate?: (config: WidgetBaseConfig) => void;
  onRemove?: () => void;
}

// 小部件註冊表項目
export interface WidgetRegistryItem {
  type: WidgetType;
  name: string;
  description: string;
  icon?: React.ComponentType | string;
  component: React.ComponentType<WidgetComponentProps>;
  defaultConfig: WidgetBaseConfig;
  defaultSize: {
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
}