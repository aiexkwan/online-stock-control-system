import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// Series generation is now handled by unified pallet generation
import { type QcInputData } from '@/lib/pdfUtils';
import { LocationMapper } from '@/lib/inventory/utils/locationMapper';
import { 
  createQcDatabaseEntriesWithTransaction,
  type QcDatabaseEntryPayload,
  type QcPalletInfoPayload,
  type QcHistoryPayload,
  type QcInventoryPayload
} from '@/app/actions/qcActions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'nodejs';

interface AutoReprintRequest {
  productCode: string;
  quantity: number;
  originalPltNum: string;
  originalLocation: string;
  sourceAction: string;
  targetLocation?: string;
  reason: string;
  operatorClockNum: string;
}

/**
 * Get product information from database
 */
async function getProductInfo(productCode: string) {
  const { data, error } = await supabase.rpc('get_product_details_by_code', { 
    p_code: productCode 
  });

  if (error || !data || data.length === 0) {
    throw new Error(`Product code ${productCode} not found`);
  }

  return data[0];
}

/**
 * 映射位置名稱到數據庫欄位名稱
 * @deprecated Use LocationMapper.toDbColumn() directly
 */
function mapLocationToDbField(location: string): string {
  // Use the unified LocationMapper
  return LocationMapper.toDbColumn(location) || 'await'; // Default to 'await' if not found
}

export async function POST(request: NextRequest) {
  try {
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Auto Reprint API] Starting auto reprint process...');
    const data: AutoReprintRequest = await request.json();
    
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Auto Reprint API] Received request data:', data);

    // Validate input
    if (!data.productCode || !data.quantity || !data.operatorClockNum) {
      console.error('[Auto Reprint API] Missing required fields:', {
        productCode: !!data.productCode,
        quantity: !!data.quantity,
        operatorClockNum: !!data.operatorClockNum
      });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get product information
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[Auto Reprint API] Getting product info for: ${data.productCode}`);
    const productInfo = await getProductInfo(data.productCode);
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Auto Reprint API] Product info retrieved:', productInfo);

    // Generate pallet number and series using unified V6 generation
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Auto Reprint API] Generating pallet number and series using V6 generation...');
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Auto Reprint API] Using unified generatePalletNumbers function');
    
    // Import the unified generation function
    const { generatePalletNumbers } = await import('@/app/actions/palletActions');
    
    const generationResult = await generatePalletNumbers(1, 'auto-reprint');
    
    if (generationResult.error) {
      console.error('[Auto Reprint API] Pallet number generation failed:', generationResult.error);
      throw new Error(`Failed to generate pallet numbers: ${generationResult.error}`);
    }
    
    if (!generationResult.palletNumbers || generationResult.palletNumbers.length === 0) {
      console.error('[Auto Reprint API] Invalid pallet numbers returned from generation');
      throw new Error('Failed to generate pallet number');
    }
    
    const palletNumbers = generationResult.palletNumbers;
    const series = generationResult.series;

    const palletNum = palletNumbers[0];
    const seriesValue = series[0];
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[Auto Reprint API] Generated pallet: ${palletNum}, series: ${seriesValue}`);
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[Auto Reprint API] About to create database records with pallet: ${palletNum}`);

    // Prepare database records
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Auto Reprint API] Preparing database records...');
    const palletInfoRecord: QcPalletInfoPayload = {
      plt_num: palletNum,
      series: seriesValue,
      product_code: productInfo.code,
      product_qty: data.quantity,
      plt_remark: `Auto-reprinted from ${data.originalPltNum}`
    };

    const historyRecord: QcHistoryPayload = {
      time: new Date().toISOString(),
      id: data.operatorClockNum,
      action: 'Auto Reprint',
      plt_num: palletNum,
      loc: data.targetLocation || 'Pipeline',
      remark: `Auto-reprinted from ${data.originalPltNum}`
    };

    // 創建動態庫存記錄
    const inventoryRecord: any = {
      product_code: productInfo.code,
      plt_num: palletNum
    };
    
    // 根據原棧板位置設置對應的庫存欄位
    const mappedLocation = mapLocationToDbField(data.originalLocation);
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[Auto Reprint API] Location mapping: "${data.originalLocation}" -> "${mappedLocation}"`);
    inventoryRecord[mappedLocation] = data.quantity;

    const databasePayload: QcDatabaseEntryPayload = {
      palletInfo: palletInfoRecord,
      historyRecord: historyRecord,
      inventoryRecord: inventoryRecord
    };

    // Insert database records
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Auto Reprint API] Inserting database records...');
    const dbResult = await createQcDatabaseEntriesWithTransaction(databasePayload, data.operatorClockNum);
    if (dbResult.error) {
      console.error('[Auto Reprint API] Database operation failed:', dbResult.error);
      throw new Error(`Database operation failed: ${dbResult.error}`);
    }
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Auto Reprint API] Database records inserted successfully');

    // 🚀 新增：更新原始棧板的歷史記錄，將 "XX" 替換為實際的新棧板號
    try {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Auto Reprint API] Updating original pallet history record...');
      
      // 查找原始棧板的 "Partially Damaged" 記錄
      const { data: historyRecords, error: findError } = await supabase
        .from('record_history')
        .select('*')
        .eq('plt_num', data.originalPltNum)
        .eq('action', 'Partially Damaged')
        .order('time', { ascending: false })
        .limit(1);

      if (findError) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[Auto Reprint API] Failed to find original history record:', findError);
      } else if (historyRecords && historyRecords.length > 0) {
        const originalRecord = historyRecords[0];
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Auto Reprint API] Found original history record:', originalRecord);
        
        // 更新 remark，將 "XX" 替換為實際的新棧板號
        if (originalRecord.remark && originalRecord.remark.includes('/XX')) {
          const updatedRemark = originalRecord.remark.replace('/XX', `/${palletNum.split('/')[1]}`);
          
          const { error: updateError } = await supabase
            .from('record_history')
            .update({ remark: updatedRemark })
            .eq('uuid', originalRecord.uuid);

          if (updateError) {
            process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[Auto Reprint API] Failed to update original history record:', updateError);
          } else {
            process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Auto Reprint API] Successfully updated original history record:', {
              original_remark: originalRecord.remark,
              updated_remark: updatedRemark
            });
          }
        }
      } else {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Auto Reprint API] No "Partially Damaged" history record found for original pallet');
      }
    } catch (historyUpdateError: any) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[Auto Reprint API] Error updating original history record:', historyUpdateError);
      // 不中斷主要流程
    }

    // 🚀 新增：更新 stock_level 表
    try {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Auto Reprint API] Updating stock_level for product:', {
        product_code: productInfo.code,
        quantity: data.quantity,
        operation: 'auto_reprint'
      });

      const { data: stockResult, error: stockError } = await supabase.rpc('update_stock_level_void', {
        p_product_code: productInfo.code,
        p_quantity: -data.quantity, // 負數表示增加庫存（因為是重印新托盤）
        p_operation: 'auto_reprint'
      });

      if (stockError) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[Auto Reprint API] Stock level update failed:', stockError);
        // 記錄警告但不中斷主要流程
      } else {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Auto Reprint API] Stock level updated successfully:', stockResult);
      }
    } catch (stockUpdateError: any) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('[Auto Reprint API] Stock level update error:', stockUpdateError);
      // 記錄錯誤但不中斷主要流程
    }

    // Return success data for client-side PDF generation (same as QC Label)
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Auto Reprint API] Preparing data for client-side PDF generation...');
    
    // Prepare QC input data (same format as QC Label)
    const qcInputData = {
      productCode: productInfo.code,
      productDescription: productInfo.description,
      quantity: data.quantity,
      series: seriesValue,
      palletNum: palletNum,
      operatorClockNum: data.operatorClockNum,
      qcClockNum: data.operatorClockNum,
      workOrderNumber: '-', // Auto-reprint doesn't have work order
      workOrderName: undefined,
      productType: productInfo.type
    };

    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[Auto Reprint API] QC input data prepared:', qcInputData);

    // Return QC input data for client-side PDF generation (same as QC Label)
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[Auto Reprint API] Returning QC input data for client-side PDF generation`);
    
    return NextResponse.json({
      success: true,
      message: `New pallet ${palletNum} created successfully`,
      data: {
        newPalletNumber: palletNum,
        fileName: `${palletNum.replace(/\//g, '_')}.pdf`,
        qcInputData: qcInputData, // Same data format as QC Label
        autoprint: true
      }
    });

  } catch (error: any) {
    console.error('[Auto Reprint API] Error in auto reprint process:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Auto reprint failed: ${error.message}` 
      },
      { status: 500 }
    );
  }
} 