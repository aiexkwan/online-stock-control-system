/**
 * 儀表板類型定義
 */

import { Layout } from 'react-grid-layout';

// 小部件類型枚舉
export enum WidgetType {
  STATS_CARD = 'stats_card',
  ANALYTICS_CHART = 'analytics_chart',
  RECENT_ACTIVITY = 'recent_activity',
  QUICK_ACTIONS = 'quick_actions',
  STOCK_SUMMARY = 'stock_summary',
  ALERTS = 'alerts',
  ASK_DATABASE = 'ask_database',
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
  CUSTOM = 'custom'
}

// 小部件尺寸
export enum WidgetSize {
  SMALL = 'small',    // 2x2 - 只顯示統計數值
  MEDIUM = 'medium',  // 4x4 - 添加更多資訊
  LARGE = 'large'     // 6x6 - 完整功能包括圖表
}

// iOS 風格尺寸預設 - 更新為指定尺寸
export const WidgetSizeConfig = {
  [WidgetSize.SMALL]: { w: 2, h: 2 },   // 2x2
  [WidgetSize.MEDIUM]: { w: 4, h: 4 },  // 4x4
  [WidgetSize.LARGE]: { w: 6, h: 6 }    // 6x6
};

// 用於編輯模式的彈性尺寸配置 - 允許在範圍內拖動
export const FlexibleWidgetSizeConfig = {
  [WidgetSize.SMALL]: { minW: 1, maxW: 3, minH: 1, maxH: 3 },
  [WidgetSize.MEDIUM]: { minW: 3, maxW: 5, minH: 3, maxH: 5 },
  [WidgetSize.LARGE]: { minW: 4, maxW: 8, minH: 4, maxH: 8 }
};

// 小部件配置
export interface WidgetConfig {
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
  config: WidgetConfig;         // 小部件配置
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

// 小部件組件屬性
export interface WidgetComponentProps {
  widget: DashboardWidget;
  isEditMode?: boolean;
  onUpdate?: (config: WidgetConfig) => void;
  onRemove?: () => void;
}

// 小部件註冊表項目
export interface WidgetRegistryItem {
  type: WidgetType;
  name: string;
  description: string;
  icon?: React.ComponentType;
  component: React.ComponentType<WidgetComponentProps>;
  defaultConfig: WidgetConfig;
  defaultSize: {
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
}