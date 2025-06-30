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

    const supabase = await createClient();

    // 從輸入中提取 PALLET NUMBER 或 SERIES
    const input = qrCode.trim();

    // 判斷輸入類型
    // Pallet number 格式: DDMMYY/X 或 DDMMYY/XX 或 DDMMYY/XXX (例如: 241224/1, 241224/01, 241224/101)
    // Series 格式: 包含 "-" (例如: 240001-001)，只能通過 QR 掃描獲得
    const isPalletNumber = /^\d{6}\/\d{1,3}$/.test(input); // 匹配 6位數字/1-3位數字
    const isSeries = input.includes('-');

    let palletData = null;

    if (isPalletNumber) {
      // Manual input - 用 pallet number 搜尋
      const { data, error } = await supabase
        .from('record_palletinfo')
        .select('plt_num, product_code, product_qty, series')
        .eq('plt_num', input)
        .single();
      
      if (!error && data) {
        palletData = data;
      }
    } else if (isSeries) {
      // QR scan - 用 series 搜尋
      const { data, error } = await supabase
        .from('record_palletinfo')
        .select('plt_num, product_code, product_qty, series')
        .eq('series', input)
        .single();
      
      if (!error && data) {
        palletData = data;
      }
    } else {
      // 如果格式不符，返回錯誤
      console.error('Invalid format:', input);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid format. Expected pallet number (DDMMYY/X, DDMMYY/XX or DDMMYY/XXX) or series (contains "-")' 
        },
        { status: 400 }
      );
    }

    if (palletData) {
      return NextResponse.json({
        success: true,
        data: {
          plt_num: palletData.plt_num,
          product_code: palletData.product_code,
          product_qty: palletData.product_qty,
          series: palletData.series
        }
      });
    }

    // 如果搵唔到
    const searchType = isPalletNumber ? 'pallet number' : 'series';
    console.error(`Pallet not found for ${searchType}:`, input);
    return NextResponse.json(
      { success: false, error: `Pallet not found for ${searchType}: ${input}` },
      { status: 404 }
    );

  } catch (error) {
    console.error('Stock count scan error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 