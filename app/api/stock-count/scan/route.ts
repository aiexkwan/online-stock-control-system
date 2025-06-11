import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { qrCode } = await request.json();
    
    if (!qrCode) {
      return NextResponse.json(
        { success: false, error: 'QR Code is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 從 QR Code 中提取 PALLET SERIES
    // 假設 QR Code 包含 series 信息
    const series = qrCode.trim();

    // 查詢 record_palletinfo 表
    const { data: palletData, error: palletError } = await supabase
      .from('record_palletinfo')
      .select('plt_num, product_code, product_qty, series')
      .eq('series', series)
      .single();

    if (palletError || !palletData) {
      return NextResponse.json(
        { success: false, error: 'Pallet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        plt_num: palletData.plt_num,
        product_code: palletData.product_code,
        product_qty: palletData.product_qty,
        series: palletData.series
      }
    });

  } catch (error) {
    console.error('Stock count scan error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 