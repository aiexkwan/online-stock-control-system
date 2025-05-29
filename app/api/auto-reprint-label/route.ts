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

// 備用環境變數（與 qcActions.ts 保持一致）
const FALLBACK_SUPABASE_URL = 'https://bbmkuiplnzvpudszrend.supabase.co';
const FALLBACK_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibWt1aXBsbnp2cHVkc3pyZW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4MDAxNTYwNCwiZXhwIjoxOTk1NTkxNjA0fQ.lkRDHLCdZdP4YE5c3XFu_G26F1O_N1fxEP2Wa3M1NtM';

// 創建 Supabase 客戶端的函數（與 qcActions.ts 保持一致）
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE_KEY;
  
  console.log('[Auto Reprint] 創建服務端 Supabase 客戶端...');
  
  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

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
 * Get user ID from data_id table by email
 */
async function getUserIdFromEmail(email: string): Promise<number | null> {
  try {
    console.log(`[Auto Reprint] Looking up user ID for email: ${email}`);
    
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from('data_id')
      .select('id, name, email')
      .eq('email', email)
      .single();

    console.log(`[Auto Reprint] Query result:`, { data, error });

    if (error) {
      if (error.code === 'PGRST116') {
        // No user found with this email
        console.log(`[Auto Reprint] No user found for email: ${email}`);
        return null;
      }
      throw error;
    }

    const userId = data?.id;
    console.log(`[Auto Reprint] Found user ID: ${userId} for email: ${email}`);
    
    return userId || null;
  } catch (error: any) {
    console.error('[Auto Reprint] Error getting user ID from email:', error);
    return null;
  }
}

/**
 * Get current user ID from Supabase Auth
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    // Create a client for auth operations
    const authClient = createSupabaseAdmin();

    // Note: In server-side API routes, we need to get user info from the request
    // For now, we'll return null and handle this in the calling function
    console.log('[Auto Reprint] getCurrentUserId called - server-side context');
    return null;
  } catch (error: any) {
    console.error('[Auto Reprint] Error getting current user ID:', error);
    return null;
  }
}

/**
 * Get product information from database
 */
async function getProductInfo(productCode: string) {
  const supabase = createSupabaseAdmin();
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
    const data: AutoReprintRequest = await request.json();
    
    console.log('[Auto Reprint] Starting auto reprint process:', data);

    // Validate input
    if (!data.productCode || !data.quantity || !data.operatorClockNum) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase admin client for this request
    const supabase = createSupabaseAdmin();

    // Get product information
    const productInfo = await getProductInfo(data.productCode);
    console.log('[Auto Reprint] Product info retrieved:', productInfo);

    // Generate pallet number and series
    const palletNumbers = await generatePalletNumbers(supabase, 1);
    const series = await generateMultipleUniqueSeries(1, supabase);
    
    if (palletNumbers.length === 0 || series.length === 0) {
      throw new Error('Failed to generate pallet number or series');
    }

    const palletNum = palletNumbers[0];
    const seriesValue = series[0];

    // Get user ID for Q.C. Done By field
    // Since operatorClockNum is passed from the void pallet action, we can use it directly
    let qcUserId = data.operatorClockNum;
    
    // If operatorClockNum is 'unknown', try to get from current session
    if (data.operatorClockNum === 'unknown') {
      console.log('[Auto Reprint] Operator clock number is unknown, using fallback');
      qcUserId = '-'; // Fallback to '-' if we can't determine the user
    }

    console.log(`[Auto Reprint] Using Q.C. Done By: ${qcUserId}`);

    // Prepare database records
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
    console.log(`[Auto Reprint] Location mapping: "${data.originalLocation}" -> "${mappedLocation}"`);
    inventoryRecord[mappedLocation] = data.quantity;

    const databasePayload: QcDatabaseEntryPayload = {
      palletInfo: palletInfoRecord,
      historyRecord: historyRecord,
      inventoryRecord: inventoryRecord
    };

    // Insert database records
    const dbResult = await createQcDatabaseEntriesWithTransaction(databasePayload, data.operatorClockNum);
    if (dbResult.error) {
      throw new Error(`Database operation failed: ${dbResult.error}`);
    }

    // Prepare PDF data with correct user ID for Q.C. Done By
    const qcInputData: QcInputData = {
      productCode: productInfo.code,
      productDescription: productInfo.description,
      quantity: data.quantity,
      series: seriesValue,
      palletNum: palletNum,
      operatorClockNum: '-', // Operator Clock Num 保持為 "-"
      qcClockNum: qcUserId,   // Q.C. Done By 使用用戶 ID
      workOrderNumber: '-',
      productType: productInfo.type || 'Standard'
    };

    const qcLabelData = await prepareQcLabelData(qcInputData);

    // Generate and upload PDF
    const { publicUrl, blob } = await generateAndUploadPdf({
      pdfProps: qcLabelData,
      supabaseClient: supabase
    });

    console.log('[Auto Reprint] Successfully generated pallet:', palletNum);

    // Return PDF as response
    const pdfBuffer = await blob.arrayBuffer();
    
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
    console.error('[Auto Reprint] Error in auto reprint process:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Auto reprint failed: ${error.message}` 
      },
      { status: 500 }
    );
  }
} 