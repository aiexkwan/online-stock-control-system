import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generatePalletNumbers } from '@/lib/palletNumUtils';

// 創建 Supabase 服務端客戶端的函數
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
  }
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  }
  
  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      }
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    console.log('[Test Pallet Generation] 開始測試棧板號碼生成...');
    
    // 檢查環境變數
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL || 'using fallback',
      keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 'using fallback'
    };
    
    console.log('[Test Pallet Generation] 環境變數檢查:', envCheck);
    
    // 創建 Supabase 客戶端
    const supabaseAdmin = createSupabaseAdmin();
    
    // 測試基本連接
    console.log('[Test Pallet Generation] 測試基本連接...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('record_palletinfo')
      .select('plt_num')
      .limit(1);
    
    if (testError) {
      console.error('[Test Pallet Generation] 基本連接測試失敗:', testError);
      return NextResponse.json({
        success: false,
        error: 'Basic connection test failed',
        details: testError,
        envCheck
      }, { status: 500 });
    }
    
    console.log('[Test Pallet Generation] 基本連接測試成功，查詢到', testData?.length, '條記錄');
    
    // 測試棧板號碼生成
    console.log('[Test Pallet Generation] 測試棧板號碼生成...');
    const palletNumbers = await generatePalletNumbers(supabaseAdmin, 1);
    
    console.log('[Test Pallet Generation] 棧板號碼生成成功:', palletNumbers);
    
    return NextResponse.json({
      success: true,
      message: 'Pallet number generation test successful',
      palletNumbers,
      envCheck,
      testDataCount: testData?.length || 0
    });
    
  } catch (error: any) {
    console.error('[Test Pallet Generation] 測試失敗:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 