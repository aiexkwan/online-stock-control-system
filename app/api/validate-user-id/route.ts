/**
 * User ID Validation API
 *
 * 提供用戶 ID 驗證服務的 REST API 端點
 * 使用 RLS 策略進行安全驗證，要求用戶必須已認證
 *
 * 端點: POST /api/validate-user-id
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/app/utils/supabase/server';

// 請求驗證 Schema
const ValidationRequestSchema = z.object({
  userId: z.string().regex(/^\d+$/, 'User ID must be numeric'),
});

type ValidationRequest = z.infer<typeof ValidationRequestSchema>;

// 回應格式
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

interface UserValidationResponse {
  valid: boolean;
  user?: {
    id: number;
    name: string;
    email?: string;
    department?: string;
  };
}

/**
 * POST /api/validate-user-id
 * 驗證用戶 ID 是否有效
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 解析請求體
    const body = await request.json();

    // 驗證請求格式
    const validationResult = ValidationRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid request format',
            details: validationResult.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { userId } = validationResult.data;

    // 使用 Route Handler Client (遵循 RLS 策略)
    const supabase = await createClient();

    // 檢查用戶認證狀態
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required to validate user ID',
          },
        },
        { status: 401 }
      );
    }

    // 查詢用戶（遵循 RLS 策略）
    const { data, error } = await supabase
      .from('data_id')
      .select('id, name, email, department')
      .eq('id', parseInt(userId, 10))
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 用戶不存在
        return NextResponse.json<ApiResponse<UserValidationResponse>>({
          success: true,
          data: {
            valid: false,
          },
        });
      }

      // 其他錯誤（使用安全日誌記錄）
      console.error('[ValidateUserAPI] Database query failed');
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database query failed',
          },
        },
        { status: 500 }
      );
    }

    // 用戶存在
    return NextResponse.json<ApiResponse<UserValidationResponse>>({
      success: true,
      data: {
        valid: true,
        user: {
          id: data.id,
          name: data.name,
          email: data.email || undefined,
          department: data.department || undefined,
        },
      },
    });
  } catch (error) {
    // 安全日誌記錄，不洩露詳細錯誤資訊
    console.error('[ValidateUserAPI] Internal error occurred');

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error occurred',
        },
      },
      { status: 500 }
    );
  }
}
