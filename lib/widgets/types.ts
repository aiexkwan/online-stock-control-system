// Widget 註冊系統類型定義
// 版本: 2.0 - 統一 Widget 接口定義

import { ReactElement } from 'react';

// Widget 分類
export type WidgetCategory =
  | 'core' // 核心組件
  | 'stats' // 統計卡片類
  | 'charts' // 圖表類
  | 'lists' // 列表類
  | 'operations' // 操作類
  | 'uploads' // 上傳類
  | 'reports' // 報表類
  | 'analysis' // 分析類
  | 'special'; // 特殊類

// 導入必要的類型
import { 
  DashboardWidget, 
  WidgetConfig, 
  WidgetBaseConfig, 
  WidgetComponentProps 
} from '@/app/types/dashboard';

// 重新導出 WidgetComponentProps 以保持兼容性
export type { WidgetComponentProps };

// Widget 定義接口
export interface WidgetDefinition {
  // 基本信息
  id: string;
  name: string;
  category: WidgetCategory;
  description?: string;

  // 布局配置（保持現有設定）
  defaultLayout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };

  // GraphQL 支援
  graphqlQuery?: string;
  useGraphQL?: boolean;
  graphqlVersion?: string; // 對應的 GraphQL widget ID

  // 性能配置
  lazyLoad?: boolean;
  preloadPriority?: number; // 1-10, 10 最高
  cacheStrategy?: 'aggressive' | 'normal' | 'minimal';

  // 權限
  requiredRoles?: string[];
  requiredFeatures?: string[];

  // 渲染組件
  component?: React.ComponentType<WidgetComponentProps>;

  // 元數據
  metadata?: {
    registryVersion?: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

// Widget 註冊項接口
export interface WidgetRegistryItem extends WidgetDefinition {
  // 加載狀態
  loadStatus?: 'pending' | 'loading' | 'loaded' | 'error';
  loadError?: Error;

  // 性能數據
  loadTime?: number;
  lastUsed?: number;
  useCount?: number;
}

// Widget 布局項接口（兼容現有系統）
export interface WidgetLayoutItem {
  i: string; // widget ID
  x: number;
  y: number;
  w: number;
  h: number;
  static?: boolean;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  metadata?: {
    registryVersion?: string;
    [key: string]: unknown; // 允許更靈活的metadata值
  };
}

// 路由預加載映射
export interface RoutePreloadMap {
  [route: string]: string[]; // route -> widget IDs
}

// Widget 註冊表接口
export interface IWidgetRegistry {
  // 註冊和獲取
  register(definition: WidgetDefinition): void;
  unregister(widgetId: string): void;
  getDefinition(widgetId: string): WidgetDefinition | undefined;
  getComponent(widgetId: string): React.ComponentType<WidgetComponentProps> | undefined;

  // GraphQL 版本切換
  getWidgetComponent(
    widgetId: string,
    enableGraphQL: boolean
  ): React.ComponentType<WidgetComponentProps> | undefined;

  // 批量操作
  getAllDefinitions(): Map<string, WidgetDefinition>;
  getByCategory(category: WidgetCategory): WidgetDefinition[];

  // 自動發現和註冊 - v2.0.5 已移除，系統自動從配置初始化
  // autoRegisterWidgets(): Promise<void>;

  // 性能和統計
  getLoadStatistics(): Map<string, WidgetRegistryItem>;
  preloadWidgets(widgetIds: string[]): Promise<void>;
}

// Widget 映射配置（用於第一階段的定義映射）
export interface WidgetMapping {
  // 現有 widget 到分類的映射
  categoryMap: {
    [widgetId: string]: WidgetCategory;
  };

  // GraphQL 版本映射
  graphqlVersionMap: {
    [standardWidgetId: string]: string; // standard -> GraphQL version ID
  };

  // 預加載優先級映射
  preloadPriorityMap: {
    [widgetId: string]: number;
  };
}

// 布局兼容性管理器接口
export interface ILayoutCompatibilityManager {
  validateLayoutIntegrity(oldLayout: WidgetLayoutItem[], newLayout: WidgetLayoutItem[]): boolean;

  migrateLayout(existingLayout: WidgetLayoutItem[]): WidgetLayoutItem[];

  captureCurrentLayout(route: string): Promise<WidgetLayoutItem[]>;
  restoreLayout(route: string, layout: WidgetLayoutItem[]): Promise<void>;
}

// Widget 加載器類型
export type WidgetLoader = () => Promise<{ default: React.ComponentType<WidgetComponentProps> }>;

// Widget 渲染器 Props
export interface WidgetRendererProps {
  widgetId: string;
  enableGraphQL?: boolean;
  fallback?: ReactElement;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  [key: string]: unknown;
}
