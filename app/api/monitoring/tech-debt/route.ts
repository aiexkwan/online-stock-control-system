/**
 * 技術債務監控 API
 *
 * 收集和提供技術債務相關指標
 * 包括 TypeScript 錯誤、ESLint 問題、測試覆蓋率等
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import type { ApiResult } from '@/lib/types/api';

const execAsync = promisify(exec);

// 技術債務數據結構
const TechDebtMetricsSchema = z.object({
  timestamp: z.string(),
  source: z.enum(['manual', 'ci', 'scheduled']),
  metrics: z.object({
    typescript: z.object({
      errorCount: z.number(),
      warningCount: z.number(),
      details: z.array(
        z.object({
          file: z.string(),
          line: z.number().optional(),
          message: z.string(),
          severity: z.enum(['error', 'warning']),
          category: z.string().optional(),
        })
      ),
    }),
    eslint: z.object({
      errorCount: z.number(),
      warningCount: z.number(),
      fixableCount: z.number(),
      details: z.array(
        z.object({
          file: z.string(),
          line: z.number().optional(),
          rule: z.string(),
          message: z.string(),
          severity: z.enum(['error', 'warning']),
          fixable: z.boolean(),
        })
      ),
    }),
    testing: z.object({
      totalTests: z.number(),
      passedTests: z.number(),
      failedTests: z.number(),
      coverage: z
        .object({
          lines: z.number(),
          statements: z.number(),
          functions: z.number(),
          branches: z.number(),
        })
        .optional(),
    }),
    build: z.object({
      status: z.enum(['success', 'failure']),
      duration: z.number().optional(),
      warnings: z.number().optional(),
    }),
  }),
});

type TechDebtMetrics = z.infer<typeof TechDebtMetricsSchema>;

/**
 * 執行 TypeScript 檢查並解析結果
 */
async function collectTypeScriptMetrics() {
  try {
    // 執行 TypeScript 檢查
    const { stdout, stderr } = await execAsync('npm run typecheck 2>&1 || true');
    const output = stdout + stderr;

    // 解析 TypeScript 錯誤
    interface TypeScriptError {
      file: string;
      line: number;
      severity: string;
      message: string;
    }

    const errorPattern = /(.+?)\((\d+),\d+\):\s+(error|warning)\s+TS\d+:\s+(.+)/g;
    const errors: TypeScriptError[] = [];
    const warnings: TypeScriptError[] = [];

    let match;
    while ((match = errorPattern.exec(output)) !== null) {
      const [, file, line, severity, message] = match;
      const item = {
        file: file.trim(),
        line: parseInt(line),
        message: message.trim(),
        severity: severity as 'error' | 'warning',
        category: 'type-checking',
      };

      if (severity === 'error') {
        errors.push(item);
      } else {
        warnings.push(item);
      }
    }

    return {
      errorCount: errors.length,
      warningCount: warnings.length,
      details: [...errors, ...warnings],
    };
  } catch (error) {
    console.error('TypeScript metrics collection failed:', error);
    return {
      errorCount: -1,
      warningCount: -1,
      details: [],
    };
  }
}

/**
 * 執行 ESLint 檢查並解析結果
 */
interface ESLintMessage {
  file: string;
  line: number;
  column: number;
  severity: number;
  message: string;
  ruleId: string | null;
  fixable: boolean;
}

interface ESLintFileResult {
  filePath: string;
  messages: Array<{
    line: number;
    column: number;
    severity: number;
    message: string;
    ruleId: string | null;
    fix?: unknown;
  }>;
}

async function collectESLintMetrics() {
  try {
    // 執行 ESLint 檢查，輸出 JSON 格式
    const { stdout } = await execAsync(
      'npx eslint . --format json --ext .ts,.tsx,.js,.jsx 2>/dev/null || echo "[]"'
    );
    const eslintResults: ESLintFileResult[] = JSON.parse(stdout);

    const errors: ESLintMessage[] = [];
    const warnings: ESLintMessage[] = [];
    let fixableCount = 0;

    eslintResults.forEach((fileResult: ESLintFileResult) => {
      fileResult.messages.forEach(message => {
        const item: ESLintMessage = {
          file: fileResult.filePath.replace(process.cwd(), ''),
          line: message.line,
          column: message.column,
          severity: message.severity,
          message: message.message,
          ruleId: message.ruleId || 'unknown',
          fixable: !!message.fix,
        };

        if (message.fix) fixableCount++;

        if (message.severity === 2) {
          errors.push(item);
        } else {
          warnings.push(item);
        }
      });
    });

    return {
      errorCount: errors.length,
      warningCount: warnings.length,
      fixableCount,
      details: [...errors, ...warnings],
    };
  } catch (error) {
    console.error('ESLint metrics collection failed:', error);
    return {
      errorCount: -1,
      warningCount: -1,
      fixableCount: -1,
      details: [],
    };
  }
}

/**
 * 執行測試並收集覆蓋率
 */
async function collectTestingMetrics() {
  try {
    // 執行測試（如果有的話）
    const { stdout } = await execAsync('npm run test:ci 2>/dev/null || echo "{}"');

    // 基本測試指標（需要根據實際輸出格式調整）
    const testCount = (stdout.match(/\d+ passing/g) || ['0 passing'])[0];
    const passed = parseInt(testCount.match(/\d+/)?.[0] || '0');

    return {
      totalTests: passed,
      passedTests: passed,
      failedTests: 0,
      coverage: {
        lines: 0,
        statements: 0,
        functions: 0,
        branches: 0,
      },
    };
  } catch (error) {
    console.error('Testing metrics collection failed:', error);
    return {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
    };
  }
}

/**
 * 檢查構建狀態
 */
async function collectBuildMetrics() {
  try {
    const startTime = Date.now();
    await execAsync('npm run build >/dev/null 2>&1');
    const duration = Date.now() - startTime;

    return {
      status: 'success' as const,
      duration,
      warnings: 0,
    };
  } catch (error) {
    return {
      status: 'failure' as const,
      duration: undefined,
      warnings: undefined,
    };
  }
}

/**
 * GET: 獲取最新的技術債務指標
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResult<{
  current: TechDebtMetrics | null;
  historical: TechDebtMetrics[];
  summary: {
    totalRecords: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}>>> {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d'; // 7d, 30d, 90d
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = await createClient();

    // 計算時間範圍
    const now = new Date();
    const rangeMap = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
    };
    const days = rangeMap[range as keyof typeof rangeMap] || 7;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // 從數據庫查詢歷史數據 (注意：監控表可能尚未建立)
    const { data: historicalData, error } = await supabase
      .from('monitoring_tech_debt')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Database query error:', error);
    }

    // 如果需要實時數據，收集當前指標
    const includeRealtime = searchParams.get('realtime') === 'true';
    let currentMetrics = null;

    if (includeRealtime) {
      const [typescript, eslint, testing, build] = await Promise.all([
        collectTypeScriptMetrics(),
        collectESLintMetrics(),
        collectTestingMetrics(),
        collectBuildMetrics(),
      ]);

      currentMetrics = {
        timestamp: new Date().toISOString(),
        source: 'manual' as const,
        metrics: {
          typescript,
          eslint,
          testing,
          build,
        },
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        // @types-migration:todo(phase3) [P2] 重構API響應結構匹配TechDebtMetrics接口 - Target: 2025-08 - Owner: @backend-team
        current: currentMetrics as any,
        historical: (historicalData || []) as any,
        summary: {
          totalRecords: historicalData?.length || 0,
          dateRange: {
            start: startDate.toISOString(),
            end: now.toISOString(),
          },
        },
      },
    } satisfies ApiResult<{
      current: TechDebtMetrics | null;
      historical: TechDebtMetrics[];
      summary: {
        totalRecords: number;
        dateRange: {
          start: string;
          end: string;
        };
      };
    }>);
  } catch (error) {
    console.error('Tech debt monitoring API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tech debt metrics',
      },
      { status: 500 }
    );
  }
}

/**
 * POST: 提交新的技術債務指標
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResult<unknown>>> {
  try {
    const body = await request.json();

    // 驗證數據格式
    const validatedData = TechDebtMetricsSchema.parse(body);

    const supabase = await createClient();

    // 儲存到數據庫 (注意：監控表可能尚未建立)
    const { data, error } = await supabase.from('monitoring_tech_debt').insert([
      {
        timestamp: validatedData.timestamp,
        source: validatedData.source,
        metrics: validatedData.metrics,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save tech debt metrics',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid data format',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Tech debt submission API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process tech debt metrics',
      },
      { status: 500 }
    );
  }
}
