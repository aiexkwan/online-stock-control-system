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
    
    // 使用存在的產品代碼和唯一的測試棧板號碼
    const testPalletNum = `TEST${Date.now()}`;
    const testSeries = `TEST-${Date.now()}`;
    
    // 準備測試數據
    const palletInfoRecord: QcPalletInfoPayload = {
      plt_num: testPalletNum,
      series: testSeries,
      product_code: 'MEP9090150', // 使用存在的產品代碼
      product_qty: 10,
      plt_remark: 'API 測試棧板'
    };

    const historyRecord: QcHistoryPayload = {
      time: new Date().toISOString(),
      id: '5942', // 使用最新的用戶 ID
      action: 'API Test',
      plt_num: testPalletNum,
      loc: 'Test',
      remark: 'API 測試記錄'
    };

    const inventoryRecord: QcInventoryPayload = {
      product_code: 'MEP9090150',
      plt_num: testPalletNum,
      await: 10
    };

    const databasePayload: QcDatabaseEntryPayload = {
      palletInfo: palletInfoRecord,
      historyRecord: historyRecord,
      inventoryRecord: inventoryRecord
    };

    console.log('測試數據準備完成，調用 createQcDatabaseEntriesWithTransaction...');
    console.log('使用棧板號碼:', testPalletNum);
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
          palletNum: testPalletNum,
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
        palletNum: testPalletNum,
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