/**
 * Alert System Type Definitions
 * 為Alert系統提供統一的類型定義，替代any類型使用
 */

// 基礎標籤和註解類型
export type AlertTags = Record<string, string | number | boolean>;
export type AlertLabels = Record<string, string | number>;
export type AlertAnnotations = Record<string, string | number | boolean>;

// 告警條件類型
export type AlertCondition =
  | 'gt' // greater than
  | 'gte' // greater than or equal
  | 'lt' // less than
  | 'lte' // less than or equal
  | 'eq' // equal
  | 'neq' // not equal
  | string; // 支持自定義條件

// 規則上下文類型
export interface RuleEvaluationContext {
  metric: {
    name: string;
    value: number;
    labels?: AlertLabels;
    timestamp: Date;
  };
  environment: string;
  [key: string]: unknown;
}

// 規則定義類型
export interface AlertRuleDefinition {
  name: string;
  description?: string;
  condition: AlertCondition;
  threshold: number | string;
  tags?: AlertTags;
  [key: string]: unknown;
}

// 規則評估結果
export interface RuleEvaluationResult {
  evaluated: number;
  triggered: AlertRuleDefinition[];
}

// 規則添加結果
export interface AddRuleResult {
  success: boolean;
  ruleId: string;
  error?: string;
}

// 類型守衛函數
export function isValidAlertTags(value: unknown): value is AlertTags {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isValidAlertLabels(value: unknown): value is AlertLabels {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isValidAlertAnnotations(value: unknown): value is AlertAnnotations {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isValidAlertCondition(value: unknown): value is AlertCondition {
  if (typeof value === 'string') {
    return ['gt', 'gte', 'lt', 'lte', 'eq', 'neq'].includes(value) || value.length > 0;
  }
  return false;
}

// 安全的默認值
export const DEFAULT_ALERT_TAGS: AlertTags = {};
export const DEFAULT_ALERT_LABELS: AlertLabels = {};
export const DEFAULT_ALERT_ANNOTATIONS: AlertAnnotations = {};
