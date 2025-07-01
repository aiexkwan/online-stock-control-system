import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[debug-pallet-generation] 開始調試托盤編號生成問題...');
    
    // 檢查環境變數
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!serviceRoleKey
        }
      }, { status: 500 });
    }
    
    // 創建 Supabase 客戶端
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // 獲取當前日期字符串
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear().toString().slice(-2);
    const dateStr = `${day}${month}${year}`;
    
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[debug-pallet-generation] 當前日期字符串:', dateStr);
    
    // 檢查序列號狀態
    const { data: sequenceData, error: sequenceError } = await supabase
      .from('daily_pallet_sequence')
      .select('*')
      .eq('date_str', dateStr)
      .single();
    
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[debug-pallet-generation] 序列號查詢結果:', { sequenceData, sequenceError });
    
    // 檢查今日已存在的托盤編號
    const { data: existingPallets, error: palletsError } = await supabase
      .from('record_palletinfo')
      .select('plt_num, generate_time')
      .like('plt_num', `${dateStr}/%`)
      .order('generate_time', { ascending: false })
      .limit(10);
    
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[debug-pallet-generation] 現有托盤編號:', { existingPallets, palletsError });
    
    // 測試 RPC 函數
    let rpcTestResult = null;
    let rpcTestError = null;
    
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('generate_atomic_pallet_numbers_v6', {
        p_count: 1,
        p_session_id: `debug-${Date.now()}`
      });
      rpcTestResult = rpcData;
      rpcTestError = rpcError;
    } catch (error: any) {
      rpcTestError = error.message;
    }
    
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[debug-pallet-generation] RPC 測試結果:', { rpcTestResult, rpcTestError });
    
    // 檢查環境信息
    const environmentInfo = {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString(),
      dateStr: dateStr
    };
    
    return NextResponse.json({
      success: true,
      environment: environmentInfo,
      sequence: {
        data: sequenceData,
        error: sequenceError
      },
      existingPallets: {
        data: existingPallets,
        error: palletsError
      },
      rpcTest: {
        result: rpcTestResult,
        error: rpcTestError
      }
    });
    
  } catch (error: any) {
    console.error('[debug-pallet-generation] 調試過程中發生錯誤:', error);
    return NextResponse.json({
      error: 'Debug process failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { count = 1 } = await request.json();
    
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[debug-pallet-generation] 測試生成托盤編號，數量:', count);
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        error: 'Missing environment variables'
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // 測試生成托盤編號
    const { data: v6Result, error: generateError } = await supabase.rpc('generate_atomic_pallet_numbers_v6', {
      p_count: count,
      p_session_id: `debug-test-${Date.now()}`
    });
    
    // 轉換 V6 格式到陣列格式
    const palletNumbers = v6Result ? v6Result.map((item: any) => item.pallet_number) : [];
    
    if (generateError) {
      console.error('[debug-pallet-generation] 生成失敗:', generateError);
      return NextResponse.json({
        error: 'Generation failed',
        details: generateError
      }, { status: 500 });
    }
    
    // 檢查生成的托盤編號是否已存在
    const duplicateChecks = [];
    if (palletNumbers && Array.isArray(palletNumbers)) {
      for (const palletNum of palletNumbers) {
        const { data: existing, error: checkError } = await supabase
          .from('record_palletinfo')
          .select('plt_num')
          .eq('plt_num', palletNum)
          .single();
        
        duplicateChecks.push({
          palletNumber: palletNum,
          exists: !!existing,
          checkError: checkError
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      generated: palletNumbers,
      duplicateChecks: duplicateChecks,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[debug-pallet-generation] POST 請求處理失敗:', error);
    return NextResponse.json({
      error: 'POST request failed',
      message: error.message
    }, { status: 500 });
  }
} 