import { NextRequest, NextResponse } from 'next/server';
import { 
  createQcDatabaseEntriesWithTransaction,
  type QcDatabaseEntryPayload,
  type QcPalletInfoPayload,
  type QcHistoryPayload,
  type QcInventoryPayload
} from '@/app/actions/qcActions';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('=== 測試 QC Action 開始 ===');
    
    // 準備測試數據
    const palletInfoRecord: QcPalletInfoPayload = {
      plt_num: 'TEST001',
      series: 'TEST-123456',
      product_code: 'TEST001',
      product_qty: 10,
      plt_remark: 'API 測試棧板'
    };

    const historyRecord: QcHistoryPayload = {
      time: new Date().toISOString(),
      id: '1', // 使用一個存在的用戶 ID
      action: 'API Test',
      plt_num: 'TEST001',
      loc: 'Test',
      remark: 'API 測試記錄'
    };

    const inventoryRecord: QcInventoryPayload = {
      product_code: 'TEST001',
      plt_num: 'TEST001',
      await: 10
    };

    const databasePayload: QcDatabaseEntryPayload = {
      palletInfo: palletInfoRecord,
      historyRecord: historyRecord,
      inventoryRecord: inventoryRecord
    };

    console.log('測試數據準備完成，調用 createQcDatabaseEntriesWithTransaction...');
    
    // 調用 server action
    const result = await createQcDatabaseEntriesWithTransaction(databasePayload, '1');
    
    console.log('QC Action 調用結果:', result);
    
    if (result.error) {
      return NextResponse.json({
        success: false,
        error: 'QC Action 調用失敗',
        details: result.error
      });
    }
    
    // 清理測試數據
    console.log('清理測試數據...');
    // 這裡可以添加清理邏輯，但為了簡單起見先跳過
    
    return NextResponse.json({
      success: true,
      message: 'QC Action 測試成功',
      result: result
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