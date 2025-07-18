import { DatabaseRecord } from '@/lib/types/database';

/**
 * Alert System Types
 * 告警系統類型定義 - 支援多級告警、通知管理、規則引擎
 */

// 告警級別
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// 告警狀態
export enum AlertState {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  SILENCED = 'silenced',
  ACKNOWLEDGED = 'acknowledged'
}

// 告警觸發條件
export enum AlertCondition {
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  CONTAINS = 'contains',
  REGEX = 'regex'
}

// 通知渠道
export enum NotificationChannel {
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  SMS = 'sms'
}

// 告警規則定義
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  level: AlertLevel;
  
  // 監控指標
  metric: string;
  condition: AlertCondition;
  threshold: number | string;
  
  // 時間窗口 (秒)
  timeWindow: number;
  
  // 評估間隔 (秒)
  evaluationInterval: number;
  
  // 告警依賴
  dependencies?: string[];
  
  // 靜默時間 (秒)
  silenceTime?: number;
  
  // 通知設定
  notifications: NotificationConfig[];
  
  // 元數據
  tags?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// 通知配置
export interface NotificationConfig {
  id: string;
  channel: NotificationChannel;
  enabled: boolean;
  config: EmailConfig | SlackConfig | WebhookConfig | SmsConfig;
  
  // 通知條件
  conditions?: {
    levels: AlertLevel[];
    timeRanges?: TimeRange[];
  };
  
  // 通知模板
  template?: string;
}

// Email 配置
export interface EmailConfig {
  recipients: string[];
  subject?: string;
  template?: string;
  priority?: 'low' | 'normal' | 'high';
}

// Slack 配置
export interface SlackConfig {
  webhook: string;
  channel: string;
  username?: string;
  iconEmoji?: string;
  template?: string;
}

// Webhook 配置
export interface WebhookConfig {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  template?: string;
  timeout?: number;
}

// SMS 配置
export interface SmsConfig {
  recipients: string[];
  template?: string;
  priority?: 'low' | 'normal' | 'high';
}

// 時間範圍
export interface TimeRange {
  start: string; // HH:MM
  end: string;   // HH:MM
  timezone?: string;
  daysOfWeek?: number[]; // 0-6, 0 = Sunday
}

// 告警實例
export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  level: AlertLevel;
  state: AlertState;
  
  // 觸發信息
  message: string;
  value: number | string;
  threshold: number | string;
  
  // 時間戳
  triggeredAt: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  
  // 通知歷史
  notifications: NotificationHistory[];
  
  // 元數據
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

// 通知歷史
export interface NotificationHistory {
  id: string;
  channel: NotificationChannel;
  sentAt: Date;
  status: 'pending' | 'sent' | 'failed' | 'retry';
  error?: string;
  retryCount?: number;
}

// 告警統計
export interface AlertStats {
  total: number;
  byLevel: Record<AlertLevel, number>;
  byState: Record<AlertState, number>;
  activeCount: number;
  resolvedCount: number;
  avgResolutionTime: number;
}

// 告警查詢條件
export interface AlertQuery {
  ruleIds?: string[];
  levels?: AlertLevel[];
  states?: AlertState[];
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'triggeredAt' | 'level' | 'state';
  sortOrder?: 'asc' | 'desc';
}

// 告警規則查詢條件
export interface AlertRuleQuery {
  enabled?: boolean;
  levels?: AlertLevel[];
  tags?: Record<string, string>;
  createdBy?: string;
  limit?: number;
  offset?: number;
}

// 告警測試結果
export interface AlertTestResult {
  success: boolean;
  message: string;
  value?: number | string;
  wouldTrigger: boolean;
  errors?: string[];
}

// 告警升級配置
export interface AlertEscalation {
  ruleId: string;
  enabled: boolean;
  levels: {
    level: AlertLevel;
    delay: number; // 延遲時間（秒）
    notifications: NotificationConfig[];
  }[];
}

// 告警依賴關係
export interface AlertDependency {
  ruleId: string;
  dependsOn: string[];
  type: 'and' | 'or';
}

// 告警抑制配置
export interface AlertSuppression {
  id: string;
  ruleId: string;
  reason: string;
  suppressedBy: string;
  suppressedAt: Date;
  expiresAt?: Date;
  active: boolean;
}

// 告警模板
export interface AlertTemplate {
  id: string;
  name: string;
  description: string;
  channel: NotificationChannel;
  template: string;
  variables: string[];
  defaultValues?: Record<string, string>;
}

// 告警配置
export interface AlertConfig {
  // 全局設定
  global: {
    enabled: boolean;
    evaluationInterval: number;
    maxAlertsPerRule: number;
    defaultSilenceTime: number;
    retentionDays: number;
  };
  
  // 通知設定
  notifications: {
    maxRetries: number;
    retryDelay: number;
    timeout: number;
    rateLimit: {
      enabled: boolean;
      maxPerMinute: number;
      maxPerHour: number;
    };
  };
  
  // 儲存設定
  storage: {
    redis: {
      keyPrefix: string;
      ttl: number;
    };
    supabase: {
      alertsTable: string;
      rulesTable: string;
      notificationsTable: string;
    };
  };
}

// 告警引擎事件
export interface AlertEngineEvent {
  type: 'alert_triggered' | 'alert_resolved' | 'notification_sent' | 'rule_created' | 'rule_updated';
  timestamp: Date;
  data: DatabaseRecord[];
}

// 告警引擎狀態
export interface AlertEngineStatus {
  running: boolean;
  uptime: number;
  rulesCount: number;
  activeAlertsCount: number;
  lastEvaluation?: Date;
  errors?: string[];
}

// 告警指標
export interface AlertMetric {
  name: string;
  value: number | string;
  timestamp: Date;
  labels?: Record<string, string>;
}

// 告警上下文
export interface AlertContext {
  ruleId: string;
  metric: AlertMetric;
  previousValues?: AlertMetric[];
  evaluationTime: Date;
  environment: string;
}

// 告警響應
export interface AlertResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

// 批量操作結果
export interface BatchOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}