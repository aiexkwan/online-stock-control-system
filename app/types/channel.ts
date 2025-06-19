/**
 * Channel 系統類型定義
 * 用於 Admin Dashboard 的訂閱式介面
 */

import { WidgetType } from './dashboard';

// Channel 類型枚舉
export enum ChannelType {
  PRODUCTION_MONITORING = 'production_monitoring',
  WAREHOUSE_MONITORING = 'warehouse_monitoring', 
  INVENTORY_MONITORING = 'inventory_monitoring',
  SYSTEM_TOOLS = 'system_tools',
  SEARCHING_TOOLS = 'searching_tools',
  ASSISTANT_TOOLS = 'assistant_tools'
}

// Widget 顯示模式
export enum WidgetDisplayMode {
  SQUARE = 'square',      // 正方形
  WIDE = 'wide',          // 橫向長方形 (2:1)
  TALL = 'tall',          // 縱向長方形 (1:2)
  AUTO = 'auto'           // 自動根據內容決定
}

// Channel 定義
export interface Channel {
  id: ChannelType;
  name: string;
  nameZh: string;        // 中文名稱
  description: string;
  icon: string;
  widgets: WidgetType[];
  defaultExpanded?: boolean;
  order?: number;        // 顯示順序
}

// Widget 在 Channel 中的配置
export interface ChannelWidgetConfig {
  widgetType: WidgetType;
  displayMode: WidgetDisplayMode;
  compactMetrics?: string[];  // 在 compact 模式下顯示的指標
}

// 用戶 Channel 訂閱狀態
export interface UserChannelSubscription {
  userId: string;
  subscribedChannels: ChannelType[];
  channelOrder?: Record<ChannelType, number>;  // 自定義順序
  expandedChannels?: ChannelType[];           // 展開的 channels
}

// Channel 配置映射
export const CHANNEL_CONFIG: Record<ChannelType, Channel> = {
  [ChannelType.PRODUCTION_MONITORING]: {
    id: ChannelType.PRODUCTION_MONITORING,
    name: 'Production Monitoring',
    nameZh: '生產監控',
    description: '監控生產流程相關數據',
    icon: '🏭',
    widgets: [
      WidgetType.OUTPUT_STATS,
      WidgetType.FINISHED_PRODUCT,
      WidgetType.ACO_ORDER_PROGRESS,
      WidgetType.MATERIAL_RECEIVED
    ],
    order: 1
  },
  [ChannelType.WAREHOUSE_MONITORING]: {
    id: ChannelType.WAREHOUSE_MONITORING,
    name: 'Warehouse Monitoring',
    nameZh: '倉庫監控',
    description: '監控倉庫進出貨活動',
    icon: '📦',
    widgets: [
      WidgetType.BOOKED_OUT_STATS,
      WidgetType.MATERIAL_RECEIVED
    ],
    order: 2
  },
  [ChannelType.INVENTORY_MONITORING]: {
    id: ChannelType.INVENTORY_MONITORING,
    name: 'Inventory Monitoring',
    nameZh: '庫存監控',
    description: '監控庫存水平同狀態',
    icon: '📊',
    widgets: [
      WidgetType.PRODUCT_MIX_CHART,
      WidgetType.VOID_PALLET
    ],
    order: 3
  },
  [ChannelType.SYSTEM_TOOLS]: {
    id: ChannelType.SYSTEM_TOOLS,
    name: 'System Tools',
    nameZh: '系統工具',
    description: '系統管理同操作工具',
    icon: '🔧',
    widgets: [
      WidgetType.DATABASE_UPDATE,
      WidgetType.REPORTS,
      WidgetType.RECENT_ACTIVITY,
      WidgetType.UPLOAD_FILES
    ],
    order: 4
  },
  [ChannelType.SEARCHING_TOOLS]: {
    id: ChannelType.SEARCHING_TOOLS,
    name: 'Searching Tools',
    nameZh: '搜尋工具',
    description: '快速搜尋功能',
    icon: '🔍',
    widgets: [
      WidgetType.INVENTORY_SEARCH,
      WidgetType.VIEW_HISTORY
    ],
    order: 5
  },
  [ChannelType.ASSISTANT_TOOLS]: {
    id: ChannelType.ASSISTANT_TOOLS,
    name: 'Assistant Tools',
    nameZh: 'AI 助手',
    description: 'AI 智能助手',
    icon: '🤖',
    widgets: [
      WidgetType.ASK_DATABASE
    ],
    order: 6
  }
};

// Widget 顯示模式配置
export const WIDGET_DISPLAY_CONFIG: Record<WidgetType, ChannelWidgetConfig> = {
  // Production Monitoring
  [WidgetType.OUTPUT_STATS]: {
    widgetType: WidgetType.OUTPUT_STATS,
    displayMode: WidgetDisplayMode.SQUARE,
    compactMetrics: ['todayCount', 'percentage']
  },
  [WidgetType.FINISHED_PRODUCT]: {
    widgetType: WidgetType.FINISHED_PRODUCT,
    displayMode: WidgetDisplayMode.WIDE,
    compactMetrics: ['recentCount', 'trend']
  },
  [WidgetType.ACO_ORDER_PROGRESS]: {
    widgetType: WidgetType.ACO_ORDER_PROGRESS,
    displayMode: WidgetDisplayMode.WIDE,
    compactMetrics: ['incompleteCount', 'progress']
  },
  
  // Warehouse & Inventory
  [WidgetType.BOOKED_OUT_STATS]: {
    widgetType: WidgetType.BOOKED_OUT_STATS,
    displayMode: WidgetDisplayMode.SQUARE,
    compactMetrics: ['todayCount', 'percentage']
  },
  [WidgetType.MATERIAL_RECEIVED]: {
    widgetType: WidgetType.MATERIAL_RECEIVED,
    displayMode: WidgetDisplayMode.WIDE,
    compactMetrics: ['todayReceived', 'totalWeight']
  },
  [WidgetType.PRODUCT_MIX_CHART]: {
    widgetType: WidgetType.PRODUCT_MIX_CHART,
    displayMode: WidgetDisplayMode.WIDE,
    compactMetrics: ['totalProducts', 'topCategory']
  },
  [WidgetType.VOID_PALLET]: {
    widgetType: WidgetType.VOID_PALLET,
    displayMode: WidgetDisplayMode.SQUARE,
    compactMetrics: ['voidCount', 'percentage']
  },
  
  // System Tools
  [WidgetType.DATABASE_UPDATE]: {
    widgetType: WidgetType.DATABASE_UPDATE,
    displayMode: WidgetDisplayMode.SQUARE,
    compactMetrics: ['lastUpdate', 'pendingUpdates']
  },
  [WidgetType.REPORTS]: {
    widgetType: WidgetType.REPORTS,
    displayMode: WidgetDisplayMode.SQUARE,
    compactMetrics: ['availableReports']
  },
  [WidgetType.RECENT_ACTIVITY]: {
    widgetType: WidgetType.RECENT_ACTIVITY,
    displayMode: WidgetDisplayMode.TALL,
    compactMetrics: ['recentActions', 'activeUsers']
  },
  [WidgetType.UPLOAD_FILES]: {
    widgetType: WidgetType.UPLOAD_FILES,
    displayMode: WidgetDisplayMode.SQUARE,
    compactMetrics: ['uploadedToday']
  },
  
  // Searching Tools
  [WidgetType.INVENTORY_SEARCH]: {
    widgetType: WidgetType.INVENTORY_SEARCH,
    displayMode: WidgetDisplayMode.WIDE,
    compactMetrics: []
  },
  [WidgetType.VIEW_HISTORY]: {
    widgetType: WidgetType.VIEW_HISTORY,
    displayMode: WidgetDisplayMode.WIDE,
    compactMetrics: []
  },
  
  // Assistant Tools
  [WidgetType.ASK_DATABASE]: {
    widgetType: WidgetType.ASK_DATABASE,
    displayMode: WidgetDisplayMode.WIDE,
    compactMetrics: ['queriesAnswered']
  },
  
  // Other widgets (set defaults)
  [WidgetType.STATS_CARD]: {
    widgetType: WidgetType.STATS_CARD,
    displayMode: WidgetDisplayMode.SQUARE,
    compactMetrics: []
  },
  [WidgetType.ANALYTICS_CHART]: {
    widgetType: WidgetType.ANALYTICS_CHART,
    displayMode: WidgetDisplayMode.WIDE,
    compactMetrics: []
  },
  [WidgetType.QUICK_ACTIONS]: {
    widgetType: WidgetType.QUICK_ACTIONS,
    displayMode: WidgetDisplayMode.SQUARE,
    compactMetrics: []
  },
  [WidgetType.STOCK_SUMMARY]: {
    widgetType: WidgetType.STOCK_SUMMARY,
    displayMode: WidgetDisplayMode.WIDE,
    compactMetrics: []
  },
  [WidgetType.ALERTS]: {
    widgetType: WidgetType.ALERTS,
    displayMode: WidgetDisplayMode.TALL,
    compactMetrics: []
  },
  [WidgetType.VOID_STATS]: {
    widgetType: WidgetType.VOID_STATS,
    displayMode: WidgetDisplayMode.SQUARE,
    compactMetrics: []
  },
  [WidgetType.UPLOAD_ORDER_PDF]: {
    widgetType: WidgetType.UPLOAD_ORDER_PDF,
    displayMode: WidgetDisplayMode.SQUARE,
    compactMetrics: []
  },
  [WidgetType.PRODUCT_SPEC]: {
    widgetType: WidgetType.PRODUCT_SPEC,
    displayMode: WidgetDisplayMode.SQUARE,
    compactMetrics: []
  },
  [WidgetType.ANALYTICS_DASHBOARD]: {
    widgetType: WidgetType.ANALYTICS_DASHBOARD,
    displayMode: WidgetDisplayMode.WIDE,
    compactMetrics: []
  },
  [WidgetType.PALLET_OVERVIEW]: {
    widgetType: WidgetType.PALLET_OVERVIEW,
    displayMode: WidgetDisplayMode.SQUARE,
    compactMetrics: []
  },
  [WidgetType.CUSTOM]: {
    widgetType: WidgetType.CUSTOM,
    displayMode: WidgetDisplayMode.AUTO,
    compactMetrics: []
  }
};

// Helper functions
export const getWidgetDisplayMode = (widgetType: WidgetType): WidgetDisplayMode => {
  return WIDGET_DISPLAY_CONFIG[widgetType]?.displayMode || WidgetDisplayMode.AUTO;
};

export const getChannelWidgets = (channelType: ChannelType): WidgetType[] => {
  return CHANNEL_CONFIG[channelType]?.widgets || [];
};

export const getWidgetChannels = (widgetType: WidgetType): ChannelType[] => {
  return Object.values(CHANNEL_CONFIG)
    .filter(channel => channel.widgets.includes(widgetType))
    .map(channel => channel.id);
};