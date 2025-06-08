import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateMultipleUniqueSeries } from '@/lib/seriesUtils';
import { type QcInputData } from '@/lib/pdfUtils';
import { 
  createQcDatabaseEntriesWithTransaction,
  type QcDatabaseEntryPayload,
  type QcPalletInfoPayload,
  type QcHistoryPayload,
  type QcInventoryPayload
} from '@/app/actions/qcActions';

const supabase = createClient(
  process.env.SUPABASE_URL!,
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
 */
function mapLocationToDbField(location: string): string {
  const locationMap: { [key: string]: string } = {
    'injection': 'injection',
    'pipeline': 'pipeline', 
    'prebook': 'prebook',
    'await': 'await',
    'fold': 'fold',
    'bulk': 'bulk',
    'backcarpark': 'backcarpark',
    'damage': 'damage',
    // 常見的別名映射
    'Injection': 'injection',
    'Pipeline': 'pipeline',
    'Prebook': 'prebook',
    'Await': 'await',
    'Awaiting': 'await',
    'Fold Mill': 'fold',
    'Bulk': 'bulk',
    'Backcarpark': 'backcarpark',
    'Damage': 'damage',
    'Production': 'injection', // Production 映射到 pipeline
    'production': 'injection'
  };
  
  return locationMap[location] || 'await'; // 默認使用 await
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Auto Reprint API] Starting auto reprint process...');
    const data: AutoReprintRequest = await request.json();
    
    console.log('[Auto Reprint API] Received request data:', data);

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
    console.log(`[Auto Reprint API] Getting product info for: ${data.productCode}`);
    const productInfo = await getProductInfo(data.productCode);
    console.log('[Auto Reprint API] Product info retrieved:', productInfo);

    // Generate pallet number and series using atomic function
    console.log('[Auto Reprint API] Generating pallet number and series...');
    const { data: palletNumbers, error: palletError } = await supabase.rpc('generate_atomic_pallet_numbers_v2', {
      count: 1
    });
    
    if (palletError) {
      console.error('[Auto Reprint API] 原子性棧板號碼生成失敗:', palletError);
      throw new Error(`Failed to generate atomic pallet numbers: ${palletError.message}`);
    }
    
    if (!palletNumbers || !Array.isArray(palletNumbers) || palletNumbers.length === 0) {
      console.error('[Auto Reprint API] Invalid pallet numbers returned from atomic function');
      throw new Error('Failed to generate pallet number');
    }
    
    const series = await generateMultipleUniqueSeries(1, supabase);
    
    if (series.length === 0) {
      console.error('[Auto Reprint API] Failed to generate series');
      throw new Error('Failed to generate series');
    }

    const palletNum = palletNumbers[0];
    const seriesValue = series[0];
    console.log(`[Auto Reprint API] Generated pallet: ${palletNum}, series: ${seriesValue}`);

    // Prepare database records
    console.log('[Auto Reprint API] Preparing database records...');
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
    console.log(`[Auto Reprint API] Location mapping: "${data.originalLocation}" -> "${mappedLocation}"`);
    inventoryRecord[mappedLocation] = data.quantity;

    const databasePayload: QcDatabaseEntryPayload = {
      palletInfo: palletInfoRecord,
      historyRecord: historyRecord,
      inventoryRecord: inventoryRecord
    };

    // Insert database records
    console.log('[Auto Reprint API] Inserting database records...');
    const dbResult = await createQcDatabaseEntriesWithTransaction(databasePayload, data.operatorClockNum);
    if (dbResult.error) {
      console.error('[Auto Reprint API] Database operation failed:', dbResult.error);
      throw new Error(`Database operation failed: ${dbResult.error}`);
    }
    console.log('[Auto Reprint API] Database records inserted successfully');

    // 🚀 新增：更新 stock_level 表
    try {
      console.log('[Auto Reprint API] Updating stock_level for product:', {
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
        console.warn('[Auto Reprint API] Stock level update failed:', stockError);
        // 記錄警告但不中斷主要流程
      } else {
        console.log('[Auto Reprint API] Stock level updated successfully:', stockResult);
      }
    } catch (stockUpdateError: any) {
      console.warn('[Auto Reprint API] Stock level update error:', stockUpdateError);
      // 記錄錯誤但不中斷主要流程
    }

    // Generate PDF using Puppeteer API route (避免服務器端 React 組件問題)
    console.log('[Auto Reprint API] Generating PDF using Puppeteer API...');
    
    const pdfData = {
      productCode: productInfo.code,
      description: productInfo.description,
      quantity: data.quantity,
      date: new Date().toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }).replace(/ /g, '-'),
      operatorClockNum: data.operatorClockNum,
      qcClockNum: data.operatorClockNum,
      workOrderNumber: '-',
      palletNum: palletNum,
      qrValue: seriesValue
    };

    console.log('[Auto Reprint API] PDF data prepared:', pdfData);

    // 使用內部 API 調用
    const baseUrl = new URL(request.url).origin;
    const pdfApiUrl = `${baseUrl}/api/print-label-pdf`;
    console.log('[Auto Reprint API] Calling PDF API at:', pdfApiUrl);
    
    const pdfResponse = await fetch(pdfApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pdfData),
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error('[Auto Reprint API] PDF generation failed:', errorText);
      throw new Error(`PDF generation failed: ${pdfResponse.status} ${errorText}`);
    }

    const blob = await pdfResponse.blob();
    console.log('[Auto Reprint API] PDF generated successfully, size:', blob.size);

    // Upload PDF to Supabase storage
    const fileName = `${palletNum.replace(/\//g, '_')}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pallet-label-pdf')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });

    if (uploadError) {
      console.error('[Auto Reprint API] Upload failed:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    if (!uploadData?.path) {
      throw new Error('Upload succeeded but no path was returned');
    }

    const { data: urlData } = supabase.storage
      .from('pallet-label-pdf')
      .getPublicUrl(uploadData.path);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    const publicUrl = urlData.publicUrl;

    console.log(`[Auto Reprint API] PDF generated successfully. Size: ${blob.size} bytes`);
    console.log(`[Auto Reprint API] Public URL: ${publicUrl}`);

    // Return PDF as response
    const pdfBuffer = await blob.arrayBuffer();
    console.log(`[Auto Reprint API] Returning PDF buffer of size: ${pdfBuffer.byteLength} bytes`);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${palletNum.replace(/\//g, '_')}.pdf`,
        'X-New-Pallet-Number': palletNum,
        'X-Success-Message': `New pallet ${palletNum} created and printed successfully`,
        'X-Public-URL': publicUrl
      },
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