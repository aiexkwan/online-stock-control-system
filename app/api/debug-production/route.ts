import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('[Production Debug] ========== 生產環境診斷開始 ==========');
    
    // 1. 檢查環境變數
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL,
        length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
        first10: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10),
        startsWithEyJ: process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ')
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length,
        first10: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10)
      }
    };
    
    console.log('[Production Debug] 環境變數檢查:', envCheck);
    
    // 2. 測試 Supabase 連接
    let supabaseTest = null;
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      
      console.log('[Production Debug] 創建 Supabase 客戶端...');
      
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
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
      });
      
      console.log('[Production Debug] 測試數據庫查詢...');
      
      // 測試基本查詢
      const { data: testData, error: testError } = await supabase
        .from('data_product')
        .select('code')
        .limit(1);
      
      if (testError) {
        console.error('[Production Debug] 數據庫查詢錯誤:', testError);
        supabaseTest = {
          success: false,
          error: testError.message,
          details: testError
        };
      } else {
        console.log('[Production Debug] 數據庫查詢成功:', testData);
        supabaseTest = {
          success: true,
          recordCount: testData?.length || 0,
          firstRecord: testData?.[0] || null
        };
      }
    } catch (supabaseError: any) {
      console.error('[Production Debug] Supabase 測試失敗:', supabaseError);
      supabaseTest = {
        success: false,
        error: supabaseError.message,
        stack: supabaseError.stack
      };
    }
    
    // 3. 測試棧板號碼生成
    let palletTest = null;
    try {
      console.log('[Production Debug] 測試棧板號碼生成...');
      
      // 直接測試 RPC 調用
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          }
        }
      });
      
      const { data: palletData, error: palletError } = await supabase.rpc('get_next_pallet_number');
      
      if (palletError) {
        console.error('[Production Debug] 棧板號碼生成錯誤:', palletError);
        palletTest = {
          success: false,
          error: palletError.message,
          details: palletError
        };
      } else {
        console.log('[Production Debug] 棧板號碼生成成功:', palletData);
        palletTest = {
          success: true,
          generatedNumber: palletData
        };
      }
    } catch (palletError: any) {
      console.error('[Production Debug] 棧板測試失敗:', palletError);
      palletTest = {
        success: false,
        error: palletError.message
      };
    }
    
    const responseData = {
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - startTime,
      environment: envCheck,
      supabaseTest,
      palletTest,
      userAgent: request.headers.get('user-agent'),
      origin: request.headers.get('origin'),
      host: request.headers.get('host')
    };
    
    console.log('[Production Debug] ========== 診斷完成 ==========');
    console.log('[Production Debug] 完整結果:', JSON.stringify(responseData, null, 2));
    
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error('[Production Debug] 診斷過程中發生錯誤:', error);
    
    const errorResponse = {
      timestamp: new Date().toISOString(),
      executionTime: Date.now() - startTime,
      success: false,
      error: error.message,
      stack: error.stack
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 