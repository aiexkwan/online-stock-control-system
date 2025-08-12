/**
 * Alert Rule Test API
 * 告警規則測試 API - 支援規則測試和驗證
 */

import { NextRequest, NextResponse } from 'next/server';
import { AlertRuleEngine } from '@/lib/alerts/core/AlertRuleEngine';

let alertEngine: AlertRuleEngine;

// 初始化告警引擎
async function getAlertEngine() {
  if (!alertEngine) {
    alertEngine = new AlertRuleEngine();
  }
  return alertEngine;
}

/**
 * POST /api/v1/alerts/rules/[id as string]/test
 * 測試告警規則
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 獲取告警引擎
    const engine = await getAlertEngine();

    // 測試規則
    const testResult = await engine.testRule(id);

    return NextResponse.json({
      success: true,
      data: testResult,
    });
  } catch (error) {
    console.error('Failed to test alert rule:', error);
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
