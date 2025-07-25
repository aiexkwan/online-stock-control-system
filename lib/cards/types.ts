/**
 * Card 系統類型定義
 * 定義所有 Card 相關的 TypeScript 類型和接口
 * 
 * @module types
 * @version 1.0.0
 */

import { ComponentType, CSSProperties, ReactNode } from 'react';

/**
 * Card 分類
 */
export type CardCategory = 
  | 'data-display'      // 數據展示
  | 'chart'            // 圖表視覺化
  | 'form'             // 表單交互
  | 'table'            // 表格展示
  | 'upload'           // 文件上傳
  | 'analysis'         // 數據分析
  | 'operation'        // 業務操作
  | 'report'           // 報表生成
  | 'custom';          // 自定義

/**
 * Card 主題配置
 */
export interface CardTheme {
  // 顏色
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  // 間距
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  // 圓角
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  
  // 陰影
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  
  // 動畫
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

/**
 * Card Manifest - 元數據系統
 */
export interface CardManifest {
  type: string;                    // 唯一標識
  name: string;                    // 顯示名稱
  version: string;                 // 版本號
  category: CardCategory;          // 分類
  description: string;             // 描述
  
  // 配置架構
  configSchema: {
    properties: Record<string, any>;
    required?: string[];
  };
  
  // 性能預算
  performance?: {
    maxBundleSize?: number;        // KB
    maxRenderTime?: number;        // ms
    preloadPriority?: 'high' | 'normal' | 'low';
  };
  
  // 依賴關係
  dependencies?: {
    cards?: string[];             // 依賴的其他 Cards
    data?: string[];              // 數據源依賴
  };
  
  // 能力聲明
  capabilities?: {
    realtime?: boolean;           // 支援實時更新
    export?: boolean;             // 支援導出
    print?: boolean;              // 支援列印
    mobile?: boolean;             // 移動端優化
  };
}

/**
 * Card 交互事件
 */
export interface CardInteractionEvent {
  type: 'click' | 'hover' | 'focus' | 'custom';
  target: string;
  data?: any;
  timestamp: number;
}

/**
 * 數據查詢接口
 */
export interface DataQuery {
  source: string;
  method: string;
  params?: Record<string, any>;
  variables?: Record<string, any>;
  cache?: {
    enabled: boolean;
    ttl?: number;
  };
}

/**
 * Card 組件屬性
 */
export interface CardProps<TConfig = any> {
  // 核心配置
  config: TConfig;
  manifest?: CardManifest;
  
  // 佈局和樣式
  className?: string;
  style?: CSSProperties;
  theme?: CardTheme;
  
  // 數據和狀態
  data?: any;
  loading?: boolean;
  error?: Error | null;
  
  // 生命週期
  onMount?: () => void;
  onUnmount?: () => void;
  onUpdate?: (config: TConfig) => void;
  
  // 交互回調
  onInteraction?: (event: CardInteractionEvent) => void;
  onDataRequest?: (query: DataQuery) => Promise<any>;
  
  // 編輯模式
  isEditMode?: boolean;
  onConfigChange?: (config: Partial<TConfig>) => void;
  onRemove?: () => void;
  
  // 子組件
  children?: ReactNode;
}

/**
 * Card 組件類型
 */
export type CardComponent<TConfig = any> = ComponentType<CardProps<TConfig>>;

/**
 * Card 定義
 */
export interface CardDefinition {
  type: string;
  manifest: CardManifest;
  component?: CardComponent;
  loadComponent?: () => Promise<CardComponent>;
}

/**
 * Card 實例
 */
export interface CardInstance {
  id: string;
  type: string;
  config: any;
  state: 'loading' | 'ready' | 'error';
  error?: Error;
}

/**
 * Card 配置遷移
 */
export interface ConfigMigration {
  from: string;
  to: string;
  transform: (config: any) => any;
}

/**
 * Card 錯誤
 */
export class CardError extends Error {
  constructor(
    message: string,
    public code: string,
    public cardType?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CardError';
  }
}

/**
 * Card 配置錯誤
 */
export class CardConfigError extends CardError {
  constructor(errors: any[]) {
    super('Card configuration validation failed', 'CONFIG_INVALID');
    this.details = errors;
  }
}

/**
 * Card 註冊選項
 */
export interface CardRegistrationOptions {
  override?: boolean;
  validate?: boolean;
}

/**
 * Card 渲染器配置
 */
export interface CardRendererConfig {
  errorBoundary?: boolean;
  suspenseFallback?: ReactNode;
  performanceTracking?: boolean;
  theme?: CardTheme;
}

/**
 * Card 佈局配置
 */
export interface CardLayoutConfig {
  id: string;
  type: string;
  gridArea?: string;
  width?: string | number;
  height?: string | number;
  config?: any;
}

/**
 * Card 性能指標
 */
export interface CardPerformanceMetrics {
  cardType: string;
  phase: 'mount' | 'update' | 'render';
  duration: number;
  timestamp: number;
  details?: {
    componentSize?: number;
    propsSize?: number;
    renderCount?: number;
  };
}

/**
 * 訂閱取消函數
 */
export type Unsubscribe = () => void;

/**
 * Card 生命週期鉤子
 */
export interface CardLifecycleHooks {
  beforeMount?: () => void | Promise<void>;
  afterMount?: () => void | Promise<void>;
  beforeUpdate?: (prevConfig: any, nextConfig: any) => void | Promise<void>;
  afterUpdate?: (prevConfig: any, nextConfig: any) => void | Promise<void>;
  beforeUnmount?: () => void | Promise<void>;
  afterUnmount?: () => void | Promise<void>;
}

/**
 * Card 註冊裝飾器類型
 */
export type CardDecorator = (
  target: any,
  propertyKey?: string,
  descriptor?: PropertyDescriptor
) => any;

/**
 * Card 命令
 */
export interface CardCommand {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  execute: (context: CardCommandContext) => void | Promise<void>;
  isEnabled?: (context: CardCommandContext) => boolean;
  isVisible?: (context: CardCommandContext) => boolean;
}

/**
 * Card 命令上下文
 */
export interface CardCommandContext {
  cardId: string;
  cardType: string;
  config: any;
  data?: any;
  selection?: any;
}

/**
 * Card 插件接口
 */
export interface CardPlugin {
  name: string;
  version: string;
  
  // 生命週期鉤子
  onCardRegister?: (card: CardDefinition) => void;
  onCardMount?: (instance: CardInstance) => void;
  onCardUnmount?: (instance: CardInstance) => void;
  onCardUpdate?: (instance: CardInstance, prevConfig: any) => void;
  
  // 功能擴展
  enhanceCard?: (CardComponent: ComponentType) => ComponentType;
  provideContext?: () => React.Context<any>;
  registerCommands?: () => CardCommand[];
}