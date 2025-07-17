/**
 * Alert Rules API
 * 告警規則管理 API - 支援規則的 CRUD 操作
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { AlertRuleEngine } from '@/lib/alerts/core/AlertRuleEngine';
import { AlertRule, AlertLevel, AlertCondition, NotificationChannel } from '@/lib/alerts/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

let alertEngine: AlertRuleEngine;

// 初始化告警引擎
async function getAlertEngine() {
  if (!alertEngine) {
    alertEngine = new AlertRuleEngine();
  }
  return alertEngine;
}

// 創建告警規則的 Schema
const CreateAlertRuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000),
  enabled: z.boolean().default(true),
  level: z.nativeEnum(AlertLevel),
  metric: z.string().min(1),
  condition: z.nativeEnum(AlertCondition),
  threshold: z.union([z.number(), z.string()]),
  timeWindow: z.number().min(1),
  evaluationInterval: z.number().min(1),
  dependencies: z.array(z.string()).optional(),
  silenceTime: z.number().min(0).optional(),
  notifications: z.array(z.object({
    id: z.string(),
    channel: z.nativeEnum(NotificationChannel),
    enabled: z.boolean(),
    config: z.record(z.any()),
    conditions: z.object({
      levels: z.array(z.nativeEnum(AlertLevel)).optional(),
      timeRanges: z.array(z.object({
        start: z.string(),
        end: z.string(),
        timezone: z.string().optional(),
        daysOfWeek: z.array(z.number().min(0).max(6)).optional()
      })).optional()
    }).optional(),
    template: z.string().optional()
  })),
  tags: z.record(z.string()).optional()
});

// 更新告警規則的 Schema
const UpdateAlertRuleSchema = CreateAlertRuleSchema.partial();

// 查詢告警規則的 Schema
const QueryAlertRulesSchema = z.object({
  enabled: z.boolean().optional(),
  levels: z.array(z.nativeEnum(AlertLevel)).optional(),
  tags: z.record(z.string()).optional(),
  createdBy: z.string().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(['name', 'created_at', 'updated_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * GET /api/v1/alerts/rules
 * 查詢告警規則
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    
    // 解析查詢參數
    const query = QueryAlertRulesSchema.parse({
      enabled: queryParams.enabled ? queryParams.enabled === 'true' : undefined,
      levels: queryParams.levels ? queryParams.levels.split(',') : undefined,
      tags: queryParams.tags ? JSON.parse(queryParams.tags) : undefined,
      createdBy: queryParams.createdBy,
      limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
      offset: queryParams.offset ? parseInt(queryParams.offset) : undefined,
      sortBy: queryParams.sortBy,
      sortOrder: queryParams.sortOrder
    });

    // 構建查詢
    let queryBuilder = supabase.from('alert_rules').select('*');

    if (query.enabled !== undefined) {
      queryBuilder = queryBuilder.eq('enabled', query.enabled);
    }

    if (query.levels && query.levels.length > 0) {
      queryBuilder = queryBuilder.in('level', query.levels);
    }

    if (query.createdBy) {
      queryBuilder = queryBuilder.eq('created_by', query.createdBy);
    }

    // 排序
    queryBuilder = queryBuilder.order(query.sortBy, { ascending: query.sortOrder === 'asc' });

    // 分頁
    queryBuilder = queryBuilder.range(query.offset, query.offset + query.limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data?.map(deserializeRule) || [],
      pagination: {
        total: count,
        limit: query.limit,
        offset: query.offset
      }
    });
  } catch (error) {
    console.error('Failed to get alert rules:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * POST /api/v1/alerts/rules
 * 創建告警規則
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateAlertRuleSchema.parse(body);

    // 生成規則 ID
    const ruleId = generateId();

    // 獲取用戶 ID (應該從認證中獲取)
    const userId = 'system'; // 臨時使用

    const rule: AlertRule = {
      id: ruleId,
      name: validated.name,
      description: validated.description,
      enabled: validated.enabled,
      level: validated.level,
      metric: validated.metric,
      condition: validated.condition,
      threshold: validated.threshold,
      timeWindow: validated.timeWindow,
      evaluationInterval: validated.evaluationInterval,
      dependencies: validated.dependencies || [],
      silenceTime: validated.silenceTime,
      notifications: validated.notifications,
      tags: validated.tags || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    };

    // 保存到數據庫
    const { error } = await supabase
      .from('alert_rules')
      .insert(serializeRule(rule));

    if (error) {
      throw error;
    }

    // 重新載入告警引擎規則
    const engine = await getAlertEngine();
    await engine.reloadRules();

    return NextResponse.json({
      success: true,
      data: rule,
      message: 'Alert rule created successfully'
    });
  } catch (error) {
    console.error('Failed to create alert rule:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * 序列化規則
 */
function serializeRule(rule: AlertRule): any {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description,
    enabled: rule.enabled,
    level: rule.level,
    metric: rule.metric,
    condition: rule.condition,
    threshold: rule.threshold,
    time_window: rule.timeWindow,
    evaluation_interval: rule.evaluationInterval,
    dependencies: JSON.stringify(rule.dependencies || []),
    silence_time: rule.silenceTime,
    notifications: JSON.stringify(rule.notifications),
    tags: JSON.stringify(rule.tags || {}),
    created_at: rule.createdAt.toISOString(),
    updated_at: rule.updatedAt.toISOString(),
    created_by: rule.createdBy
  };
}

/**
 * 反序列化規則
 */
function deserializeRule(data: any): AlertRule {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    enabled: data.enabled,
    level: data.level,
    metric: data.metric,
    condition: data.condition,
    threshold: data.threshold,
    timeWindow: data.time_window,
    evaluationInterval: data.evaluation_interval,
    dependencies: JSON.parse(data.dependencies || '[]'),
    silenceTime: data.silence_time,
    notifications: JSON.parse(data.notifications || '[]'),
    tags: JSON.parse(data.tags || '{}'),
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    createdBy: data.created_by
  };
}

/**
 * 生成 ID
 */
function generateId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}