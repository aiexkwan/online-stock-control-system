/**
 * Strategy 3: Supabase codegen - 自動從 schema 產生型別
 * Supabase Feature Flag 數據庫類型定義
 */

import { FeatureFlagType, FeatureFlagStatus } from './index';

// 數據庫記錄類型（基於 Supabase schema）
export interface FeatureFlagDbRecord {
  id: string;
  key: string;
  name: string;
  description?: string;
  type: FeatureFlagType;
  status: FeatureFlagStatus;
  default_value: unknown;
  rules?: Array<{
    type: string;
    value: unknown;
    operator?: string;
  }>;
  variants?: Array<{
    key: string;
    name: string;
    weight?: number;
    payload?: Record<string, unknown>;
  }>;
  rollout_percentage?: number;
  start_date?: string;
  end_date?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Supabase 實時更新 payload 類型
export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: FeatureFlagDbRecord;
  old?: FeatureFlagDbRecord;
  schema: string;
  table: string;
  commit_timestamp: string;
}

// 數據庫操作 DTO
export interface CreateFeatureFlagDto {
  key: string;
  name: string;
  description?: string;
  type: FeatureFlagType;
  status: FeatureFlagStatus;
  default_value: unknown;
  rules?: Array<{
    type: string;
    value: unknown;
    operator?: string;
  }>;
  variants?: Array<{
    key: string;
    name: string;
    weight?: number;
    payload?: Record<string, unknown>;
  }>;
  rollout_percentage?: number;
  start_date?: string;
  end_date?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateFeatureFlagDto extends Partial<CreateFeatureFlagDto> {
  updated_at?: string;
}

// 類型保護函數
export function isValidDbRecord(record: unknown): record is FeatureFlagDbRecord {
  if (!record || typeof record !== 'object') return false;

  const r = record as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.key === 'string' &&
    typeof r.name === 'string' &&
    typeof r.type === 'string' &&
    typeof r.status === 'string' &&
    typeof r.created_at === 'string' &&
    typeof r.updated_at === 'string'
  );
}

export function isValidRealtimePayload(payload: unknown): payload is RealtimePayload {
  if (!payload || typeof payload !== 'object') return false;

  const p = payload as Record<string, unknown>;
  return (
    typeof p.eventType === 'string' &&
    ['INSERT', 'UPDATE', 'DELETE'].includes(p.eventType as string) &&
    typeof p.schema === 'string' &&
    typeof p.table === 'string'
  );
}

// 數據轉換工具
export class FeatureFlagDbMapper {
  static toFeatureFlag(record: FeatureFlagDbRecord): import('./index').FeatureFlag {
    return {
      key: record.key,
      name: record.name,
      description: record.description,
      type: record.type,
      status: record.status,
      // Strategy 4: unknown + type narrowing - 安全類型轉換 default_value 和 rules
      defaultValue: (() => {
        const value = record.default_value;
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          return value;
        }
        return false; // 默認為 boolean false
      })(),
      rules: (() => {
        const rawRules = record.rules || [];
        if (Array.isArray(rawRules)) {
          return rawRules.map((rule: unknown): import('./index').FeatureRule => {
            if (rule && typeof rule === 'object' && 'type' in rule && 'value' in rule) {
              const ruleObj = rule as Record<string, unknown>;
              const ruleType = typeof ruleObj.type === 'string' ? ruleObj.type : 'all';

              // 驗證 FeatureRuleType
              const validRuleTypes = ['all', 'percentage', 'user', 'group', 'custom'] as const;
              const validType = validRuleTypes.includes(ruleType as (typeof validRuleTypes)[number])
                ? (ruleType as import('./index').FeatureRuleType)
                : 'all';

              // 驗證 operator 類型
              const validOperators = ['equals', 'contains', 'gt', 'lt', 'gte', 'lte'] as const;
              const operator =
                typeof ruleObj.operator === 'string' &&
                validOperators.includes(ruleObj.operator as (typeof validOperators)[number])
                  ? (ruleObj.operator as (typeof validOperators)[number])
                  : undefined;

              return {
                type: validType,
                value: ruleObj.value,
                operator,
              };
            }
            return { type: 'all', value: true };
          });
        }
        return [];
      })(),
      variants: record.variants || [],
      rolloutPercentage: record.rollout_percentage,
      startDate: record.start_date ? new Date(record.start_date) : undefined,
      endDate: record.end_date ? new Date(record.end_date) : undefined,
      tags: record.tags || [],
      metadata: record.metadata || ({} as Record<string, unknown>),
    };
  }

  static toDbRecord(
    key: string,
    flag: Partial<import('./index').FeatureFlag>
  ): UpdateFeatureFlagDto {
    const record: UpdateFeatureFlagDto = {
      key,
      updated_at: new Date().toISOString(),
    };

    if (flag.name !== undefined) record.name = flag.name;
    if (flag.description !== undefined) record.description = flag.description;
    if (flag.type !== undefined) record.type = flag.type;
    if (flag.status !== undefined) record.status = flag.status;
    if (flag.defaultValue !== undefined) record.default_value = flag.defaultValue;
    if (flag.rules !== undefined) record.rules = flag.rules;
    if (flag.variants !== undefined) record.variants = flag.variants;
    if (flag.rolloutPercentage !== undefined) record.rollout_percentage = flag.rolloutPercentage;
    if (flag.startDate !== undefined) record.start_date = flag.startDate.toISOString();
    if (flag.endDate !== undefined) record.end_date = flag.endDate.toISOString();
    if (flag.tags !== undefined) record.tags = flag.tags;
    if (flag.metadata !== undefined) record.metadata = flag.metadata;

    return record;
  }

  static validateAndTransformArray(records: unknown[]): import('./index').FeatureFlag[] {
    return records.filter(isValidDbRecord).map(this.toFeatureFlag);
  }
}
