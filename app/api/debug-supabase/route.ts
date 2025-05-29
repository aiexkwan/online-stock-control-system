import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Supabase 診斷開始 ===');
    
    // 檢查環境變數
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('環境變數檢查:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ 已設置' : '✗ 未設置');
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', anonKey ? '✓ 已設置' : '✗ 未設置');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? '✓ 已設置' : '✗ 未設置');
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({
        success: false,
        error: '環境變數未正確設置',
        details: {
          supabaseUrl: !!supabaseUrl,
          serviceKey: !!serviceKey
        }
      });
    }
    
    // 解碼 Service Role Key
    let jwtInfo = null;
    try {
      const parts = serviceKey.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        jwtInfo = {
          role: payload.role,
          iss: payload.iss,
          ref: payload.ref,
          exp: new Date(payload.exp * 1000).toISOString(),
          isExpired: Date.now() > payload.exp * 1000
        };
      }
    } catch (error) {
      console.error('JWT 解碼失敗:', error);
    }
    
    // 創建 Supabase 客戶端
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // 測試基本連接
    console.log('測試 Supabase 連接...');
    const { data: testData, error: testError } = await supabase
      .from('data_id')
      .select('count(*)')
      .limit(1);
    
    if (testError) {
      console.error('Supabase 連接測試失敗:', testError);
      return NextResponse.json({
        success: false,
        error: 'Supabase 連接失敗',
        details: {
          message: testError.message,
          code: testError.code,
          hint: testError.hint
        },
        jwtInfo
      });
    }
    
    // 測試寫入權限
    console.log('測試寫入權限...');
    const testRecord = {
      time: new Date().toISOString(),
      id: 999999,
      action: 'API Test',
      plt_num: 'TEST001',
      loc: 'Test',
      remark: 'API 診斷測試'
    };
    
    const { error: writeError } = await supabase
      .from('record_history')
      .insert(testRecord);
    
    if (writeError) {
      console.error('寫入權限測試失敗:', writeError);
      return NextResponse.json({
        success: false,
        error: '寫入權限測試失敗',
        details: {
          message: writeError.message,
          code: writeError.code,
          hint: writeError.hint
        },
        jwtInfo,
        connectionTest: '✓ 成功'
      });
    }
    
    // 清理測試記錄
    await supabase
      .from('record_history')
      .delete()
      .eq('plt_num', 'TEST001');
    
    console.log('=== Supabase 診斷完成 ===');
    
    return NextResponse.json({
      success: true,
      message: 'Supabase 連接和權限測試成功',
      jwtInfo,
      connectionTest: '✓ 成功',
      writeTest: '✓ 成功'
    });
    
  } catch (error: any) {
    console.error('診斷過程中發生錯誤:', error);
    return NextResponse.json({
      success: false,
      error: '診斷過程中發生錯誤',
      details: error.message
    }, { status: 500 });
  }
} 