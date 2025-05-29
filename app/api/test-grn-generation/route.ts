import { NextRequest, NextResponse } from 'next/server';
import { generateGrnPalletNumbersAndSeries } from '@/app/actions/grnActions';

export async function GET(request: NextRequest) {
  try {
    console.log('[Test GRN Generation] 開始測試 GRN 棧板號碼生成...');
    
    // 測試環境變數
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
        first10: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10)
      }
    };
    
    console.log('[Test GRN Generation] 環境變數:', envCheck);
    
    // 測試生成 1 個棧板號碼
    const result = await generateGrnPalletNumbersAndSeries(1);
    
    console.log('[Test GRN Generation] 生成結果:', result);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      generationResult: result,
      success: !result.error,
      palletCount: result.palletNumbers?.length || 0,
      seriesCount: result.series?.length || 0
    });
    
  } catch (error: any) {
    console.error('[Test GRN Generation] 測試失敗:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 