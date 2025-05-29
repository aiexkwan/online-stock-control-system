import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('=== Supabase 診斷開始 ===');
    
    // 檢查環境變數
    console.log('環境變數檢查:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ 已設置' : '✗ 未設置');
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ 已設置' : '✗ 未設置');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ 已設置' : '✗ 未設置');
    
    // 詳細環境變數信息
    const envDetails = {
      supabaseUrl: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        format: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') && 
                process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('.supabase.co') ? '✓ 正確格式' : '✗ 格式錯誤'
      },
      anonKey: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        format: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('.') ? '✓ JWT 格式' : '✗ 非 JWT 格式'
      },
      serviceKey: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        format: process.env.SUPABASE_SERVICE_ROLE_KEY?.includes('.') ? '✓ JWT 格式' : '✗ 非 JWT 格式'
      }
    };
    
    console.log('環境變數詳細信息:', envDetails);
    
    // 如果環境變數缺失，返回錯誤
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: '關鍵環境變數缺失',
        envDetails
      });
    }
    
    // JWT 解碼測試
    let jwtDecoded = null;
    try {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceKey) {
        const payload = serviceKey.split('.')[1];
        if (payload) {
          const decoded = JSON.parse(atob(payload));
          const exp = decoded.exp ? new Date(decoded.exp * 1000) : null;
          jwtDecoded = {
            role: decoded.role,
            iss: decoded.iss,
            ref: decoded.ref,
            exp: exp?.toISOString(),
            isExpired: exp ? exp < new Date() : null
          };
          console.log('JWT 解碼成功:', jwtDecoded);
        }
      }
    } catch (jwtError) {
      console.error('JWT 解碼失敗:', jwtError);
    }
    
    // 創建 Supabase 客戶端 (與 qcActions.ts 相同的配置)
    console.log('創建 Supabase 客戶端...');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // 測試 Supabase 連接
    console.log('測試 Supabase 連接...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('data_id')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('連接測試失敗:', testError);
      return NextResponse.json({
        success: false,
        error: 'Supabase 連接失敗',
        details: testError,
        envDetails,
        jwtDecoded
      });
    }
    
    console.log('連接測試成功，查詢到', testData?.length || 0, '條記錄');
    
    // 測試寫入權限
    console.log('測試寫入權限...');
    const testPalletNum = 'TEST001';
    
    // 首先檢查用戶 ID 是否存在
    console.log('檢查用戶 ID...');
    const { data: userData, error: userError } = await supabaseAdmin
      .from('data_id')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    
    let testUserId = '5942'; // 默認用戶 ID
    if (userError) {
      console.error('獲取用戶 ID 失敗:', userError);
    } else if (userData && userData.length > 0) {
      testUserId = userData[0].id.toString();
      console.log('使用測試用戶 ID:', testUserId);
    }
    
    // 測試寫入 record_palletinfo
    const { error: writeError } = await supabaseAdmin
      .from('record_palletinfo')
      .insert({
        plt_num: testPalletNum,
        series: 'TEST-SERIES',
        product_code: 'MEP9090150',
        product_qty: 1,
        plt_remark: '診斷測試'
      });
    
    if (writeError) {
      console.error('寫入權限測試失敗:', writeError);
      return NextResponse.json({
        success: false,
        error: '寫入權限測試失敗',
        details: writeError,
        envDetails,
        jwtDecoded,
        connectionTest: '成功',
        testUserId
      });
    }
    
    console.log('寫入權限測試成功');
    
    // 清理測試數據
    await supabaseAdmin
      .from('record_palletinfo')
      .delete()
      .eq('plt_num', testPalletNum);
    
    console.log('=== Supabase 診斷完成 ===');
    
    return NextResponse.json({
      success: true,
      message: 'Supabase 診斷完全成功 - 所有功能正常！',
      envDetails,
      jwtDecoded,
      connectionTest: '成功',
      writeTest: '成功',
      testUserId,
      timestamp: new Date().toISOString()
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