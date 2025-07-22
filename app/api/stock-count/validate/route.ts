import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { createInventoryService } from '@/lib/inventory/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_code, counted_qty } = body;

    if (!product_code || counted_qty === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // 創建 Supabase 客戶端和服務
    const supabase = await createClient();
    const inventoryService = createInventoryService(supabase);

    // 調用數據庫驗證函數
    const { data, error } = await supabase.rpc('validate_stocktake_count', {
      p_product_code: product_code,
      p_counted_qty: counted_qty,
    });

    if (error) {
      console.error('[Stock Count Validate] RPC error:', error);

      // 如果函數不存在，使用基本驗證邏輯
      if (
        (error as { message: string }).message.includes('function') &&
        (error as { message: string }).message.includes('does not exist')
      ) {
        console.log('[Stock Count Validate] Using fallback validation logic');

        // 基本驗證規則
        const warnings: string[] = [];
        const errors: string[] = [];

        // 驗證數量
        if (counted_qty < 0) {
          errors.push('Negative quantity not allowed');
        }

        // 檢查產品代碼是否存在（使用統一服務）
        try {
          const { data: productData } = await supabase
            .from('data_code')
            .select('code, description')
            .eq('code', product_code)
            .single();

          if (!productData) {
            errors.push(`Product code ${product_code} not found`);
          }

          // 大數量警告
          if (counted_qty > 10000) {
            warnings.push('Unusually high quantity - please verify');
          }
        } catch (err) {
          console.error('[Stock Count Validate] Product lookup error:', err);
          errors.push('Failed to verify product code');
        }

        const validationResult = {
          is_valid: errors.length === 0,
          warnings,
          errors,
          message: errors.length > 0 ? 'Validation failed' : 'Valid',
        };

        return NextResponse.json({
          success: true,
          data: validationResult,
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed: ' + (error as { message: string }).message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
