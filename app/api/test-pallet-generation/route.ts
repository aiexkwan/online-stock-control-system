import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generatePalletNumbers } from '@/lib/palletNumUtils';

// 備用環境變數（與 qcActions.ts 保持一致）
const FALLBACK_SUPABASE_URL = 'https://bbmkuiplnzvpudszrend.supabase.co';
const FALLBACK_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4MDAxNTYwNCwiZXhwIjoxOTk1NTkxNjA0fQ.lkRDHLCdZdP4YE5c3XFu_G26F1O_N1fxEP2Wa3M1NtM';

// 創建 Supabase 客戶端的函數
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE_KEY;
  
  console.log('[Test Pallet Generation] 創建服務端 Supabase 客戶端...');
  console.log('[Test Pallet Generation] URL:', supabaseUrl);
  console.log('[Test Pallet Generation] Service Key exists:', !!serviceRoleKey);
  console.log('[Test Pallet Generation] Service Key length:', serviceRoleKey?.length);
  
  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
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