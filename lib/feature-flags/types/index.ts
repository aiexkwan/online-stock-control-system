/**
 * Feature Flag 系統類型定義
 */

/**
 * Feature Flag 類型
 */
export type FeatureFlagType = 'boolean' | 'percentage' | 'variant' | 'release';

/**
 * Feature Flag 狀態
 */
export enum FeatureFlagStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  PARTIAL = 'partial',
}

/**
 * Feature Flag 規則類型
 */
export type FeatureRuleType = 'user' | 'group' | 'percentage' | 'date' | 'environment' | 'custom';

/**
 * Feature Flag 規則
 */
export interface FeatureRule {
  type: FeatureRuleType;
  value: any;
  operator?: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte';
}

/**
 * Feature Flag 變體
 */
export interface FeatureVariant {
  key: string;
  name: string;
  weight?: number; // 權重百分比
  payload?: any;
}

/**
 * Feature Flag 定義
 */
export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  type: FeatureFlagType;
  status: FeatureFlagStatus;
  defaultValue: boolean | string | number;
  rules?: FeatureRule[];
  variants?: FeatureVariant[];
  rolloutPercentage?: number;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Feature Flag 評估上下文
 */
export interface FeatureContext {
  userId?: string;
  userEmail?: string;
  userGroups?: string[];
  environment?: 'development' | 'staging' | 'production';
  customAttributes?: Record<string, any>;
  timestamp?: Date;
}

/**
 * Feature Flag 評估結果
 */
export interface FeatureEvaluation {
  enabled: boolean;
  variant?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Feature Flag 提供者接口
 */
export interface FeatureFlagProvider {
  /**
   * 初始化提供者
   */
  initialize(): Promise<void>;

  /**
   * 獲取所有 Feature Flags
   */
  getAllFlags(): Promise<FeatureFlag[]>;

  /**
   * 獲取單個 Feature Flag
   */
  getFlag(key: string): Promise<FeatureFlag | null>;

  /**
   * 評估 Feature Flag
   */
  evaluate(key: string, context: FeatureContext): Promise<FeatureEvaluation>;

  /**
   * 批量評估 Feature Flags
   */
  evaluateAll(context: FeatureContext): Promise<Record<string, FeatureEvaluation>>;

  /**
   * 更新 Feature Flag
   */
  updateFlag(key: string, updates: Partial<FeatureFlag>): Promise<void>;

  /**
   * 訂閱 Feature Flag 變更
   */
  subscribe(callback: (flags: FeatureFlag[]) => void): () => void;
}

/**
 * Feature Flag 配置
 */
export interface FeatureFlagConfig {
  provider: 'supabase' | 'local' | 'custom';
  cacheEnabled?: boolean;
  cacheTTL?: number; // 毫秒
  pollingInterval?: number; // 毫秒
  defaultContext?: Partial<FeatureContext>;
  onError?: (error: Error) => void;
}

/**
 * Feature Flag 事件
 */
export interface FeatureFlagEvent {
  type: 'evaluated' | 'updated' | 'error';
  flagKey: string;
  context?: FeatureContext;
  result?: FeatureEvaluation;
  error?: Error;
  timestamp: Date;
}

/**
 * Feature Flag 監控接口
 */
export interface FeatureFlagMonitor {
  /**
   * 記錄評估事件
   */
  trackEvaluation(event: FeatureFlagEvent): void;

  /**
   * 獲取統計數據
   */
  getStats(flagKey?: string): Promise<{
    evaluations: number;
    enabledCount: number;
    disabledCount: number;
    variantDistribution?: Record<string, number>;
  }>;

  /**
   * 清除統計數據
   */
  clearStats(): void;
}

/**
 * 預定義的 Feature Flags
 */
export enum KnownFeatureFlags {
  // UI 功能
  NEW_DASHBOARD = 'new_dashboard',
  DARK_MODE = 'dark_mode',
  ADVANCED_SEARCH = 'advanced_search',
  BATCH_OPERATIONS = 'batch_operations',

  // 性能優化
  LAZY_LOADING = 'lazy_loading',
  VIRTUAL_SCROLLING = 'virtual_scrolling',
  CODE_SPLITTING = 'code_splitting',

  // 實驗性功能
  AI_PREDICTIONS = 'ai_predictions',
  VOICE_COMMANDS = 'voice_commands',
  AR_SCANNING = 'ar_scanning',

  // 系統功能
  MAINTENANCE_MODE = 'maintenance_mode',
  READ_ONLY_MODE = 'read_only_mode',
  DEBUG_MODE = 'debug_mode',

  // API 遷移功能 (v1.2.3)
  ENABLE_REST_API = 'enable_rest_api',
  REST_API_PERCENTAGE = 'rest_api_percentage',
  FALLBACK_TO_GRAPHQL = 'fallback_to_graphql',
  API_MONITORING = 'api_monitoring',
}
