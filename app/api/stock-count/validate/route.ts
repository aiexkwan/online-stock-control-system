import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_code, counted_qty } = body;

    if (!product_code || counted_qty === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // 調用數據庫驗證函數
    const { data, error } = await supabase.rpc('validate_stocktake_count', {
      p_product_code: product_code,
      p_counted_qty: counted_qty
    });

    if (error) {
      console.error('Validation error:', error);
      
      // 如果函數不存在，返回默認驗證結果
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        // 基本驗證邏輯
        const validationResult = {
          is_valid: counted_qty >= 0,
          warnings: [],
          errors: counted_qty < 0 ? ['Negative quantity not allowed'] : [],
          message: counted_qty < 0 ? 'Invalid quantity' : 'Valid'
        };
        
        return NextResponse.json({
          success: true,
          data: validationResult
        });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Validation failed'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}