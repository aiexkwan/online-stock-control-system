/**
 * Alert History API
 * 告警歷史記錄 API - 支援告警歷史查詢和統計
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { AlertStateManager } from '@/lib/alerts/core/AlertStateManager';
import { AlertLevel, AlertState } from '@/lib/alerts/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

let alertStateManager: AlertStateManager;

// 初始化告警狀態管理器
async function getAlertStateManager() {
  if (!alertStateManager) {
    alertStateManager = new AlertStateManager();
  }
  return alertStateManager;
}

// 查詢告警歷史的 Schema
const QueryAlertHistorySchema = z.object({
  ruleIds: z.array(z.string()).optional(),
  levels: z.array(z.nativeEnum(AlertLevel)).optional(),
  states: z.array(z.nativeEnum(AlertState)).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(['triggered_at', 'level', 'state']).default('triggered_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * GET /api/v1/alerts/history
 * 查詢告警歷史
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    
    // 解析查詢參數
    const query = QueryAlertHistorySchema.parse({
      ruleIds: queryParams.ruleIds ? queryParams.ruleIds.split(',') : undefined,
      levels: queryParams.levels ? queryParams.levels.split(',') : undefined,
      states: queryParams.states ? queryParams.states.split(',') : undefined,
      startTime: queryParams.startTime,
      endTime: queryParams.endTime,
      limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
      offset: queryParams.offset ? parseInt(queryParams.offset) : undefined,
      sortBy: queryParams.sortBy,
      sortOrder: queryParams.sortOrder
    });

    const manager = await getAlertStateManager();
    
    // 構建查詢條件
    const alertQuery = {
      ruleIds: query.ruleIds,
      levels: query.levels,
      states: query.states,
      startTime: query.startTime ? new Date(query.startTime) : undefined,
      endTime: query.endTime ? new Date(query.endTime) : undefined,
      limit: query.limit,
      offset: query.offset,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    };

    // 查詢告警歷史
    const alerts = await manager.queryAlerts(alertQuery);

    // 獲取總數
    let totalCount = 0;
    try {
      let countQuery = supabase.from('alerts').select('*', { count: 'exact', head: true });
      
      if (query.ruleIds && query.ruleIds.length > 0) {
        countQuery = countQuery.in('rule_id', query.ruleIds);
      }
      
      if (query.levels && query.levels.length > 0) {
        countQuery = countQuery.in('level', query.levels);
      }
      
      if (query.states && query.states.length > 0) {
        countQuery = countQuery.in('state', query.states);
      }
      
      if (query.startTime) {
        countQuery = countQuery.gte('triggered_at', query.startTime);
      }
      
      if (query.endTime) {
        countQuery = countQuery.lte('triggered_at', query.endTime);
      }
      
      const { count } = await countQuery;
      totalCount = count || 0;
    } catch (error) {
      console.error('Failed to get total count:', error);
    }

    return NextResponse.json({
      success: true,
      data: alerts,
      pagination: {
        total: totalCount,
        limit: query.limit,
        offset: query.offset,
        hasMore: totalCount > query.offset + query.limit
      }
    });
  } catch (error) {
    console.error('Failed to get alert history:', error);
    
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
 * GET /api/v1/alerts/history/stats
 * 獲取告警統計
 */
export async function POST(request: NextRequest) {
  try {
    const manager = await getAlertStateManager();
    const stats = await manager.getAlertStats();

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Failed to get alert stats:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}