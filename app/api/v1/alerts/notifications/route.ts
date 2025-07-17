/**
 * Alert Notifications API
 * 告警通知管理 API - 支援通知配置和測試
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { NotificationService } from '@/lib/alerts/notifications/NotificationService';
import { NotificationChannel } from '@/lib/alerts/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

let notificationService: NotificationService;

// 初始化通知服務
async function getNotificationService() {
  if (!notificationService) {
    notificationService = new NotificationService();
  }
  return notificationService;
}

// 通知配置 Schema
const NotificationConfigSchema = z.object({
  channel: z.nativeEnum(NotificationChannel),
  enabled: z.boolean(),
  config: z.record(z.any()),
  conditions: z.object({
    levels: z.array(z.string()).optional(),
    timeRanges: z.array(z.object({
      start: z.string(),
      end: z.string(),
      timezone: z.string().optional(),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional()
    })).optional()
  }).optional(),
  template: z.string().optional()
});

// 測試通知 Schema
const TestNotificationSchema = z.object({
  channel: z.nativeEnum(NotificationChannel),
  config: z.record(z.any()),
  testMessage: z.string().optional()
});

/**
 * GET /api/v1/alerts/notifications
 * 獲取通知統計
 */
export async function GET(request: NextRequest) {
  try {
    const service = await getNotificationService();
    const stats = await service.getNotificationStats();

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Failed to get notification stats:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * POST /api/v1/alerts/notifications/test
 * 測試通知配置
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = TestNotificationSchema.parse(body);

    const service = await getNotificationService();
    
    // 創建測試通知配置
    const testConfig = {
      id: 'test',
      channel: validated.channel,
      enabled: true,
      config: validated.config,
      template: validated.testMessage
    };

    // 測試通知
    const result = await service.testNotification(testConfig);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Failed to test notification:', error);
    
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