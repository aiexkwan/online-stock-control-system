/**
 * Alert Rule Management API
 * 單個告警規則管理 API - 支援獲取、更新、刪除單個規則
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseRecord } from '@/types/database/tables';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { AlertRuleEngine } from '@/lib/alerts/core/AlertRuleEngine';
import { AlertRule, NotificationChannel } from '@/lib/alerts/types';
import { getErrorMessage } from '@/types/core/error';
import {
  toRecord,
  safeGet,
  safeString,
  safeBoolean,
  safeAlertLevel,
  safeAlertCondition,
} from '@/types/database/helpers';
import { AlertLevel, AlertCondition } from '@/lib/alerts/types';

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

// 更新告警規則的 Schema
const UpdateAlertRuleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  enabled: z.boolean().optional(),
  level: z.nativeEnum(AlertLevel).optional(),
  metric: z.string().min(1).optional(),
  condition: z.nativeEnum(AlertCondition).optional(),
  threshold: z.union([z.number(), z.string()]).optional(),
  timeWindow: z.number().min(1).optional(),
  evaluationInterval: z.number().min(1).optional(),
  dependencies: z.array(z.string()).optional(),
  silenceTime: z.number().min(0).optional(),
  notifications: z
    .array(
      z.object({
        id: z.string(),
        channel: z.nativeEnum(NotificationChannel),
        enabled: z.boolean(),
        config: z.record(z.any()),
        conditions: z
          .object({
            levels: z.array(z.nativeEnum(AlertLevel)).optional(),
            timeRanges: z
              .array(
                z.object({
                  start: z.string(),
                  end: z.string(),
                  timezone: z.string().optional(),
                  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
                })
              )
              .optional(),
          })
          .optional(),
        template: z.string().optional(),
      })
    )
    .optional(),
  tags: z.record(z.string()).optional(),
});

/**
 * GET /api/v1/alerts/rules/[id as string]
 * 獲取單個告警規則
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data, error } = await supabase.from('alert_rules').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Alert rule not found',
          },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: deserializeRule(data),
    });
  } catch (error) {
    console.error('Failed to get alert rule:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? (error as { message: string }).message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/alerts/rules/[id as string]
 * 更新告警規則
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = UpdateAlertRuleSchema.parse(body);

    // 獲取現有規則
    const { data: existingRule, error: fetchError } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Alert rule not found',
          },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // 合併更新
    const updatedRule = {
      ...existingRule,
      ...validated,
      updated_at: new Date().toISOString(),
    };

    // 更新數據庫
    const { error: updateError } = await supabase
      .from('alert_rules')
      .update(updatedRule)
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // 重新載入告警引擎規則
    const engine = await getAlertEngine();
    await engine.reloadRules();

    return NextResponse.json({
      success: true,
      data: deserializeRule(updatedRule),
      message: 'Alert rule updated successfully',
    });
  } catch (error) {
    console.error('Failed to update alert rule:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? (error as { message: string }).message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/alerts/rules/[id as string]
 * 刪除告警規則
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 檢查規則是否存在
    const { data: existingRule, error: fetchError } = await supabase
      .from('alert_rules')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Alert rule not found',
          },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // 刪除相關告警
    await supabase.from('alerts').delete().eq('rule_id', id);

    // 刪除規則
    const { error: deleteError } = await supabase.from('alert_rules').delete().eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    // 重新載入告警引擎規則
    const engine = await getAlertEngine();
    await engine.reloadRules();

    return NextResponse.json({
      success: true,
      message: 'Alert rule deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete alert rule:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? (error as { message: string }).message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * 反序列化規則 (Strategy 4: unknown + type narrowing)
 */
function deserializeRule(data: unknown): AlertRule {
  const record = toRecord(data);
  return {
    id: safeString(safeGet(record, 'id')) || '',
    name: safeString(safeGet(record, 'name')) || '',
    description: safeString(safeGet(record, 'description')) || '',
    enabled: safeBoolean(safeGet(record, 'enabled')) || false,
    level: safeAlertLevel(safeGet(record, 'level'), AlertLevel.INFO),
    metric: safeString(safeGet(record, 'metric')) || '',
    condition: safeAlertCondition(safeGet(record, 'condition'), AlertCondition.GREATER_THAN),
    threshold: safeGet(record, 'threshold') || (0 as number),
    timeWindow: safeGet(record, 'time_window') || (300 as number),
    evaluationInterval: safeGet(record, 'evaluation_interval') || (60 as number),
    dependencies: JSON.parse(safeString(safeGet(record, 'dependencies')) || '[]'),
    silenceTime: safeGet(record, 'silence_time') || (0 as number),
    notifications: JSON.parse(safeString(safeGet(record, 'notifications')) || '[]'),
    tags: JSON.parse(safeString(safeGet(record, 'tags')) || '{}'),
    createdAt: new Date(safeString(safeGet(record, 'created_at')) || new Date().toISOString()),
    updatedAt: new Date(safeString(safeGet(record, 'updated_at')) || new Date().toISOString()),
    createdBy: safeString(safeGet(record, 'created_by')) || '',
  };
}
