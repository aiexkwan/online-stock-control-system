import { NextRequest, NextResponse } from 'next/server';
import { 
  createQcDatabaseEntriesWithTransaction,
  type QcDatabaseEntryPayload,
  type QcPalletInfoPayload,
  type QcHistoryPayload,
  type QcInventoryPayload
} from '@/app/actions/qcActions';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('=== 測試 QC Action 開始 ===');
    
    // 首先測試 qcActions.ts 中使用的相同 Supabase 客戶端配置
    console.log('測試 qcActions.ts 中的 Supabase 客戶端配置...');
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // 測試環境變數
    console.log('環境變數檢查:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ 已設置' : '✗ 未設置');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ 已設置' : '✗ 未設置');
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: '環境變數未正確設置',
        details: {
          url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      });
    }
    
    // 測試基本連接
    console.log('測試 qcActions 中的 Supabase 客戶端連接...');
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from('data_id')
        .select('id')
        .limit(1);
        
      if (testError) {
        console.error('qcActions Supabase 客戶端連接失敗:', testError);
        return NextResponse.json({
          success: false,
          error: 'qcActions Supabase 客戶端連接失敗',
          details: testError
        });
      }
      
      console.log('qcActions Supabase 客戶端連接成功，查詢到', testData?.length || 0, '條記錄');
    } catch (connectionError: any) {
      console.error('qcActions Supabase 客戶端連接異常:', connectionError);
      return NextResponse.json({
        success: false,
        error: 'qcActions Supabase 客戶端連接異常',
        details: connectionError.message
      });
    }
    
    // 測試寫入權限
    console.log('測試 qcActions 中的寫入權限...');
    const testPalletNum = `TEST${Date.now()}`;
    
    try {
      // 先測試插入 record_palletinfo
      const { error: palletError } = await supabaseAdmin
        .from('record_palletinfo')
        .insert({
          plt_num: testPalletNum,
          series: `TEST-${Date.now()}`,
          product_code: 'MEP9090150',
          product_qty: 1,
          plt_remark: 'API 測試'
        });
        
      if (palletError) {
        console.error('qcActions 寫入 record_palletinfo 失敗:', palletError);
        return NextResponse.json({
          success: false,
          error: 'qcActions 寫入 record_palletinfo 失敗',
          details: palletError
        });
      }
      
      console.log('qcActions 寫入 record_palletinfo 成功');
      
      // 清理測試數據
      await supabaseAdmin
        .from('record_palletinfo')
        .delete()
        .eq('plt_num', testPalletNum);
        
    } catch (writeError: any) {
      console.error('qcActions 寫入測試異常:', writeError);
      return NextResponse.json({
        success: false,
        error: 'qcActions 寫入測試異常',
        details: writeError.message
      });
    }
    
    // 現在測試完整的 QC Action 函數
    console.log('測試完整的 createQcDatabaseEntriesWithTransaction 函數...');
    
    // 使用存在的產品代碼和唯一的測試棧板號碼
    const finalTestPalletNum = `TEST${Date.now()}`;
    const testSeries = `TEST-${Date.now()}`;
    
    // 準備測試數據
    const palletInfoRecord: QcPalletInfoPayload = {
      plt_num: finalTestPalletNum,
      series: testSeries,
      product_code: 'MEP9090150', // 使用存在的產品代碼
      product_qty: 10,
      plt_remark: 'API 測試棧板'
    };

    const historyRecord: QcHistoryPayload = {
      time: new Date().toISOString(),
      id: '5942', // 使用最新的用戶 ID
      action: 'API Test',
      plt_num: finalTestPalletNum,
      loc: 'Test',
      remark: 'API 測試記錄'
    };

    const inventoryRecord: QcInventoryPayload = {
      product_code: 'MEP9090150',
      plt_num: finalTestPalletNum,
      await: 10
    };

    const databasePayload: QcDatabaseEntryPayload = {
      palletInfo: palletInfoRecord,
      historyRecord: historyRecord,
      inventoryRecord: inventoryRecord
    };

    console.log('測試數據準備完成，調用 createQcDatabaseEntriesWithTransaction...');
    console.log('使用棧板號碼:', finalTestPalletNum);
    console.log('使用產品代碼:', 'MEP9090150');
    console.log('使用用戶 ID:', '5942');
    
    // 調用 server action
    const result = await createQcDatabaseEntriesWithTransaction(databasePayload, '5942');
    
    console.log('QC Action 調用結果:', result);
    
    if (result.error) {
      return NextResponse.json({
        success: false,
        error: 'QC Action 調用失敗',
        details: result.error,
        testData: {
          palletNum: finalTestPalletNum,
          productCode: 'MEP9090150',
          userId: '5942'
        }
      });
    }
    
    console.log('QC Action 測試成功！');
    
    return NextResponse.json({
      success: true,
      message: 'QC Action 測試成功 - 這證明 Service Role Key 工作正常！',
      result: result,
      testData: {
        palletNum: finalTestPalletNum,
        productCode: 'MEP9090150',
        userId: '5942'
      }
    });
    
  } catch (error: any) {
    console.error('QC Action 測試失敗:', error);
    return NextResponse.json({
      success: false,
      error: 'QC Action 測試過程中發生錯誤',
      details: error.message
    }, { status: 500 });
  }
} 