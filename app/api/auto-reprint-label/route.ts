import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generatePalletNumbers } from '@/lib/palletNumUtils';
import { generateMultipleUniqueSeries } from '@/lib/seriesUtils';
import { prepareQcLabelData, generateAndUploadPdf, type QcInputData } from '@/lib/pdfUtils';
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

    // Generate pallet number and series
    console.log('[Auto Reprint API] Generating pallet number and series...');
    const palletNumbers = await generatePalletNumbers(supabase, 1);
    const series = await generateMultipleUniqueSeries(1, supabase);
    
    if (palletNumbers.length === 0 || series.length === 0) {
      console.error('[Auto Reprint API] Failed to generate pallet number or series');
      throw new Error('Failed to generate pallet number or series');
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
      plt_remark: `Auto-reprinted from ${data.originalPltNum} | Reason: ${data.reason}`
    };

    const historyRecord: QcHistoryPayload = {
      time: new Date().toISOString(),
      id: data.operatorClockNum,
      action: 'Auto Reprint',
      plt_num: palletNum,
      loc: data.targetLocation || 'Pipeline',
      remark: `Auto-reprinted from ${data.originalPltNum} | Reason: ${data.reason}`
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

    // Prepare PDF data
    console.log('[Auto Reprint API] Preparing PDF data...');
    const qcInputData: QcInputData = {
      productCode: productInfo.code,
      productDescription: productInfo.description,
      quantity: data.quantity,
      series: seriesValue,
      palletNum: palletNum,
      operatorClockNum: data.operatorClockNum,
      qcClockNum: data.operatorClockNum,
      workOrderNumber: '-',
      productType: productInfo.type || 'Standard'
    };

    const qcLabelData = await prepareQcLabelData(qcInputData);
    console.log('[Auto Reprint API] PDF data prepared');

    // Generate and upload PDF
    console.log('[Auto Reprint API] Generating PDF...');
    const { publicUrl, blob } = await generateAndUploadPdf({
      pdfProps: qcLabelData,
      supabaseClient: supabase
    });

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