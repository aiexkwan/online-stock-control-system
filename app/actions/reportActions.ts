'use server';

// import { createSupabaseServerClient } from '@/lib/supabase/server'; // 舊的錯誤路徑
// import { createServerActionClient } from '@supabase/auth-helpers-nextjs'; // OLD
// import { cookies } from 'next/headers'; // Not needed directly, createClient handles it
import { createClient } from '@/app/utils/supabase/server'; // NEW: Using @supabase/ssr helper
import { format, isValid } from 'date-fns'; // 用於日期格式化
// import type { Database } from '../lib/database.types'; // Path still incorrect, commenting out for now
// 如果您有資料庫類型定義，例如： import { Database } from '@/types_db';

/**
 * Fetches unique, non-null ACO order references from the 'record_aco' table.
 * @returns A promise that resolves to an array of unique order reference strings, sorted numerically.
 *          Returns an empty array if an error occurs or no data is found.
 */
export async function getUniqueAcoOrderRefs(): Promise<string[]> {
  const supabase = await createClient();

  try {
  const { data, error } = await supabase
      .from('record_aco')
      .select('order_ref');

  if (error) {
    console.error('Error fetching aco_order_refs:', error.message);
    return [];
  }

    if (!data || data.length === 0) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('No ACO order references found in database.');
    return [];
  }

    // 正確處理 number 到 string 的轉換，並過濾無效值
  const uniqueRefs = Array.from(
      new Set(
        data
          .map((item: any) => item.order_ref)
          .filter((ref: any) => ref != null && !isNaN(Number(ref)))
          .map((ref: number) => ref.toString())
      )
  ) as string[];

    // 按數字大小排序而非字母順序
    return uniqueRefs.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unexpected error in getUniqueAcoOrderRefs:', errorMessage);
    return [];
  }
}

// --- 新增的類型定義 ---
export interface PalletInfo {
  plt_num: string | null;
  product_qty: number | null;
  generate_time: string | null; // Formatted as DD-MM-YY
}

export interface AcoProductData {
  product_code: string;
  required_qty: number | null; // 新增 required_qty 欄位
  pallets: PalletInfo[];
}
// --- 結束新增的類型定義 ---

/**
 * Fetches data for the ACO report based on a specific order reference.
 * @param orderRef The ACO order reference to fetch data for.
 * @returns A promise that resolves to an array of AcoProductData.
 */
export async function getAcoReportData(orderRef: string): Promise<AcoProductData[]> {
  // 加強輸入驗證
  if (!orderRef || typeof orderRef !== 'string') {
    console.error('getAcoReportData: orderRef is required and must be a string');
    return [];
  }

  const trimmedOrderRef = orderRef.trim();
  if (trimmedOrderRef === '') {
    console.error('getAcoReportData: orderRef cannot be empty');
    return [];
  }

  // 驗證 orderRef 是否為有效數字
  const orderRefNum = parseInt(trimmedOrderRef, 10);
  if (isNaN(orderRefNum) || orderRefNum <= 0) {
    console.error('getAcoReportData: orderRef must be a valid positive number');
    return [];
  }

  const supabase = await createClient();

  try {
    // 步驟 1: 根據 orderRef 從 record_aco 獲取產品代碼和對應的 required_qty
    const { data: acoCodesData, error: acoCodesError } = await supabase
      .from('record_aco')
      .select('code, required_qty')
      .eq('order_ref', orderRefNum); // 使用數字類型進行查詢

    if (acoCodesError) {
      console.error(`Error fetching product codes for orderRef ${orderRefNum}:`, acoCodesError.message);
      return [];
    }
    
    if (!acoCodesData || acoCodesData.length === 0) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`No product codes found for orderRef ${orderRefNum}.`);
      return [];
    }

    // 創建產品代碼到 required_qty 的映射
    const productCodeToRequiredQty = new Map<string, number>();
    const uniqueProductCodes: string[] = [];

    acoCodesData.forEach((item: any) => {
      if (item.code && typeof item.code === 'string' && item.code.trim() !== '') {
        const productCode = item.code.trim();
        if (!uniqueProductCodes.includes(productCode)) {
          uniqueProductCodes.push(productCode);
        }
        // 存儲 required_qty，如果有多個相同產品代碼，取最後一個值
        if (typeof item.required_qty === 'number') {
          productCodeToRequiredQty.set(productCode, item.required_qty);
        }
      }
    });

    if (uniqueProductCodes.length === 0) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`No valid product codes extracted for orderRef ${orderRefNum}.`);
      return [];
    }

    // 步驟 2: 使用批量查詢優化性能 - 一次性獲取所有產品的棧板資訊
    const { data: allPalletDetails, error: palletError } = await supabase
      .from('record_palletinfo')
      .select('product_code, plt_num, product_qty, generate_time')
      .in('product_code', uniqueProductCodes)
      .or(`plt_remark.ilike.%ACO Ref : ${orderRefNum}%,plt_remark.ilike.%ACO Ref: ${orderRefNum}%,plt_remark.ilike.%ACO_Ref_${orderRefNum}%,plt_remark.ilike.%ACO-Ref-${orderRefNum}%`); // 改進容錯性

    if (palletError) {
      console.error(`Error fetching pallet info for orderRef ${orderRefNum}:`, palletError.message);
      return [];
    }

    // 步驟 3: 按產品代碼分組處理數據
    const reportData: AcoProductData[] = [];
    const palletsByProduct = new Map<string, any[]>();

    // 將棧板數據按產品代碼分組
    (allPalletDetails || []).forEach((pallet: any) => {
      const productCode = pallet.product_code;
      if (!palletsByProduct.has(productCode)) {
        palletsByProduct.set(productCode, []);
      }
      palletsByProduct.get(productCode)!.push(pallet);
    });

    // 為每個產品代碼生成報表數據
    for (const productCode of uniqueProductCodes) {
      const palletDetails = palletsByProduct.get(productCode) || [];

      const formattedPallets: PalletInfo[] = palletDetails.map((p: any) => {
        let formattedDate: string | null = null;
        if (p.generate_time) {
          try {
          const dateObj = new Date(p.generate_time);
            if (isValid(dateObj)) {
            formattedDate = format(dateObj, 'dd-MMM-yy');
          } else {
            process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn(`Invalid date value for generate_time: ${p.generate_time} for product ${productCode}`);
            }
          } catch (dateError) {
            process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn(`Error parsing date ${p.generate_time} for product ${productCode}:`, dateError);
          }
        }

        return {
          plt_num: p.plt_num || null,
          product_qty: typeof p.product_qty === 'number' ? p.product_qty : null,
          generate_time: formattedDate,
        };
      });

      // 按棧板號碼排序（如果存在）
      formattedPallets.sort((a, b) => {
        if (!a.plt_num && !b.plt_num) return 0;
        if (!a.plt_num) return 1;
        if (!b.plt_num) return -1;
        return a.plt_num.localeCompare(b.plt_num);
      });

      reportData.push({
        product_code: productCode,
        required_qty: productCodeToRequiredQty.get(productCode) || null,
        pallets: formattedPallets,
      });
    }

    // 按產品代碼排序
    reportData.sort((a, b) => a.product_code.localeCompare(b.product_code));

    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`Successfully fetched ACO report data for orderRef ${orderRefNum}: ${reportData.length} products, ${reportData.reduce((sum, p) => sum + p.pallets.length, 0)} pallets`);
    return reportData;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`Unexpected error in getAcoReportData for orderRef ${orderRefNum}:`, errorMessage);
    return [];
  }
}

export async function getUniqueGrnRefs(): Promise<string[]> {
  const supabase = await createClient();

  try {
  const { data, error } = await supabase
    .from('record_grn')
    .select('grn_ref');

  if (error) {
      console.error('Error fetching GRN refs:', error.message);
    throw new Error('Could not fetch GRN references. ' + error.message);
  }

    if (!data || data.length === 0) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('No GRN references found in database.');
    return [];
  }

    // 正確處理 number 到 string 的轉換，並過濾無效值
    const uniqueRefs = Array.from(
      new Set(
        data
          .map(item => item.grn_ref)
          .filter(ref => ref !== null && ref !== undefined && !isNaN(Number(ref)))
          .map(ref => ref.toString())
      )
    ) as string[];

    // 按數字大小排序
    return uniqueRefs.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unexpected error in getUniqueGrnRefs:', errorMessage);
    throw error; // 重新拋出錯誤，因為原函數設計為拋出錯誤
  }
}

export async function getMaterialCodesForGrnRef(grnRef: string): Promise<string[]> {
  // 加強輸入驗證
  if (!grnRef || typeof grnRef !== 'string') {
    console.error('getMaterialCodesForGrnRef: grnRef is required and must be a string');
    return [];
  }

  const trimmedGrnRef = grnRef.trim();
  if (trimmedGrnRef === '') {
    console.error('getMaterialCodesForGrnRef: grnRef cannot be empty');
    return [];
  }

  // 驗證 grnRef 是否為有效數字
  const grnRefNum = parseInt(trimmedGrnRef, 10);
  if (isNaN(grnRefNum)) {
    console.error('getMaterialCodesForGrnRef: grnRef must be a valid number');
    return [];
  }

  const supabase = await createClient();

  try {
  const { data, error } = await supabase
    .from('record_grn')
    .select('material_code')
      .eq('grn_ref', grnRefNum); // 使用數字類型進行查詢

  if (error) {
      console.error(`Error fetching material codes for grnRef ${grnRefNum}:`, error.message);
      return [];
    }

    if (!data || data.length === 0) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`No material codes found for grnRef ${grnRefNum}.`);
    return [];
  }

    const uniqueMaterialCodes = Array.from(
      new Set(
        data
          .map((item: any) => item.material_code)
          .filter((code: any) => code != null && typeof code === 'string' && code.trim() !== '')
      )
    ) as string[];

    return uniqueMaterialCodes.sort();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Unexpected error in getMaterialCodesForGrnRef for grnRef ${grnRefNum}:`, errorMessage);
    return [];
  }
}

// --- GRN Report Types ---
export interface GrnRecordDetail {
  gross_weight: number | null;
  net_weight: number | null;
  pallet: string | null;
  package_type: string | null; // Changed from package to package_type to avoid conflict with keyword
  pallet_count: number | null;
  package_count: number | null;
}

export interface GrnReportPageData {
  grn_ref: string;
  user_id: string; // Placeholder for now, will need to get actual user ID
  material_code: string;
  material_description: string | null;
  supplier_name: string | null;
  report_date: string; // Formatted as dd-MMM-yyyy
  records: GrnRecordDetail[];
  total_gross_weight: number;
  total_net_weight: number;
  weight_difference: number;
}
// --- End GRN Report Types ---

export async function getGrnReportData(
  grnRef: string, 
  materialCode: string, 
  userEmail: string
): Promise<GrnReportPageData | null> {
  // 加強輸入驗證
  if (!grnRef || typeof grnRef !== 'string') {
    console.error('getGrnReportData: grnRef is required and must be a string');
    return null;
  }

  if (!materialCode || typeof materialCode !== 'string') {
    console.error('getGrnReportData: materialCode is required and must be a string');
    return null;
  }

  if (!userEmail || typeof userEmail !== 'string') {
    console.error('getGrnReportData: userEmail is required and must be a string');
    return null;
  }

  const trimmedGrnRef = grnRef.trim();
  const trimmedMaterialCode = materialCode.trim();
  const trimmedUserEmail = userEmail.trim();

  if (trimmedGrnRef === '' || trimmedMaterialCode === '' || trimmedUserEmail === '') {
    console.error('getGrnReportData: grnRef, materialCode, and userEmail cannot be empty');
    return null;
  }

  // 驗證 grnRef 是否為有效數字
  const grnRefNum = parseInt(trimmedGrnRef, 10);
  if (isNaN(grnRefNum)) {
    console.error('getGrnReportData: grnRef must be a valid number');
    return null;
  }

  const supabase = await createClient();
  let supplierCode: string | null = null;
  let userId: string | null = null;

  try {
    // 🆕 首先從 data_id 表中根據 email 查找對應的 id
    const { data: userIdData, error: userIdError } = await supabase
      .from('data_id')
      .select('id')
      .eq('email', trimmedUserEmail)
      .single();

    if (userIdError) {
      console.error(`Error fetching user ID for email ${trimmedUserEmail}:`, userIdError.message);
      return null;
    }

    if (!userIdData || !userIdData.id) {
      console.error(`No user ID found for email ${trimmedUserEmail}`);
      return null;
    }

    userId = userIdData.id.toString();
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`Found user ID ${userId} for email ${trimmedUserEmail}`);

    // 1. Fetch GRN records for the given grn_ref and material_code
    const { data: grnRecords, error: grnError } = await supabase
      .from('record_grn')
      .select('sup_code, material_code, gross_weight, net_weight, pallet, package, pallet_count, package_count')
      .eq('grn_ref', grnRefNum) // 使用數字類型
      .eq('material_code', trimmedMaterialCode);

    if (grnError) {
      console.error(`Error fetching GRN records for grnRef ${grnRefNum} and materialCode ${trimmedMaterialCode}:`, grnError.message);
      return null;
    }
    
    if (!grnRecords || grnRecords.length === 0) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`No GRN records found for grnRef ${grnRefNum} and materialCode ${trimmedMaterialCode}.`);
      return null;
    }

    // Store supplier code from the first record to fetch supplier name later
    supplierCode = grnRecords[0].sup_code;

    const recordsDetails: GrnRecordDetail[] = grnRecords.map(r => ({
      gross_weight: typeof r.gross_weight === 'number' ? r.gross_weight : null,
      net_weight: typeof r.net_weight === 'number' ? r.net_weight : null,
      pallet: r.pallet || null,
      package_type: r.package || null,
      pallet_count: typeof r.pallet_count === 'number' ? r.pallet_count : null,
      package_count: typeof r.package_count === 'number' ? r.package_count : null,
    }));

    // DEBUGGING LOG START
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[DEBUG] GRN Ref: ${grnRefNum}, Material: ${trimmedMaterialCode}, User ID: ${userId}`);
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[DEBUG] grnRecords from DB:', JSON.stringify(grnRecords, null, 2));
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('[DEBUG] Mapped recordsDetails:', JSON.stringify(recordsDetails, null, 2));
    // DEBUGGING LOG END

    // 2. Fetch material description from data_code
    let materialDescription: string | null = null;
    const { data: materialData, error: materialError } = await supabase
      .from('data_code')
      .select('description')
      .eq('code', trimmedMaterialCode)
      .single();

    if (materialError) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn(`Could not fetch description for materialCode ${trimmedMaterialCode}:`, materialError.message);
    }
    if (materialData && materialData.description) {
      materialDescription = materialData.description;
    }

    // 3. Fetch supplier name from data_supplier using supplierCode
    let supplierName: string | null = null;
    if (supplierCode && supplierCode.trim() !== '') {
      const { data: supplierData, error: supplierError } = await supabase
        .from('data_supplier')
        .select('supplier_name')
        .eq('supplier_code', supplierCode.trim())
        .single();

      if (supplierError) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn(`Could not fetch supplier name for sup_code ${supplierCode}:`, supplierError.message);
      }
      if (supplierData && supplierData.supplier_name) {
        supplierName = supplierData.supplier_name;
      }
    } else {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('Supplier code was not found in GRN records, cannot fetch supplier name.');
    }

    // 4. Calculate totals with proper number validation
    const totalGrossWeight = recordsDetails.reduce((sum, rec) => {
      const weight = rec.gross_weight;
      return sum + (typeof weight === 'number' && !isNaN(weight) ? weight : 0);
    }, 0);
    
    const totalNetWeight = recordsDetails.reduce((sum, rec) => {
      const weight = rec.net_weight;
      return sum + (typeof weight === 'number' && !isNaN(weight) ? weight : 0);
    }, 0);
    
    const weightDifference = totalGrossWeight - totalNetWeight;

    // 5. Format report date
    const reportDate = format(new Date(), 'dd-MMM-yyyy').toUpperCase();

    const result: GrnReportPageData = {
      grn_ref: trimmedGrnRef,
      user_id: userId!,
      material_code: trimmedMaterialCode,
      material_description: materialDescription,
      supplier_name: supplierName,
      report_date: reportDate,
      records: recordsDetails,
      total_gross_weight: Math.round(totalGrossWeight * 100) / 100, // 保留兩位小數
      total_net_weight: Math.round(totalNetWeight * 100) / 100,
      weight_difference: Math.round(weightDifference * 100) / 100,
    };

    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`Successfully generated GRN report data for grnRef ${grnRefNum}, materialCode ${trimmedMaterialCode}, userId ${userId}: ${recordsDetails.length} records`);
    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`Unexpected error in getGrnReportData for grnRef ${grnRefNum}, materialCode ${trimmedMaterialCode}:`, errorMessage);
    return null;
  }
}

// --- Transaction Report Types ---
export interface TransferRecord {
  transfer_date: string;
  pallet_number: string;
  product_code: string;
  quantity: number;
  from_location: string;
  to_location: string;
  operator_name: string;
  operator_id: number;
}

export interface LocationSummary {
  [location: string]: {
    transfers_in: number;
    transfers_out: number;
    net_change: number;
  };
}

export interface TransactionReportData {
  date_range: {
    start_date: string;
    end_date: string;
  };
  transfers: TransferRecord[];
  summary: LocationSummary;
  total_transfers: number;
  total_pallets: number;
}
// --- End Transaction Report Types ---

/**
 * Fetches transaction report data for a given date range
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @returns Promise that resolves to TransactionReportData or null
 */
export async function getTransactionReportData(
  startDate: string,
  endDate: string
): Promise<TransactionReportData | null> {
  // 輸入驗證
  if (!startDate || !endDate) {
    console.error('getTransactionReportData: startDate and endDate are required');
    return null;
  }

  // 驗證日期格式
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  
  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    console.error('getTransactionReportData: Invalid date format');
    return null;
  }

  if (startDateObj > endDateObj) {
    console.error('getTransactionReportData: Start date cannot be after end date');
    return null;
  }

  const supabase = await createClient();

  try {
    // 1. 獲取指定日期範圍內的轉移記錄
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[DEBUG] Searching for transfers between ${startDate} and ${endDate}`);
    
    // 🆕 修復日期查詢：處理帶時間戳的日期格式
    // 將結束日期設為當天的 23:59:59 以包含整天的記錄
    const startDateTime = `${startDate}T00:00:00.000Z`;
    const endDateTime = `${endDate}T23:59:59.999Z`;
    
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[DEBUG] Using datetime range: ${startDateTime} to ${endDateTime}`);
    
    const { data: transferRecords, error: transferError } = await supabase
      .from('record_transfer')
      .select(`
        f_loc,
        t_loc,
        plt_num,
        tran_date,
        operator_id
      `)
      .gte('tran_date', startDateTime)
      .lte('tran_date', endDateTime)
      .order('tran_date', { ascending: true });

    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[DEBUG] Transfer query result:`, { 
      recordCount: transferRecords?.length || 0, 
      error: transferError?.message,
      sampleRecord: transferRecords?.[0] 
    });

    if (transferError) {
      console.error('Error fetching transfer records:', transferError.message);
      return null;
    }

    // 如果沒有轉移記錄，返回空數據結構
    if (!transferRecords || transferRecords.length === 0) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`No transfer records found for date range ${startDate} to ${endDate}`);
      
      // 🆕 嘗試更寬鬆的日期查詢，以防日期格式問題
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[DEBUG] Trying broader date search...`);
      const { data: allRecords, error: allError } = await supabase
        .from('record_transfer')
        .select('tran_date')
        .order('tran_date', { ascending: false })
        .limit(10);
      
      if (allRecords && allRecords.length > 0) {
        process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`[DEBUG] Sample dates in database:`, allRecords.map(r => r.tran_date));
      }
      
      return {
        date_range: { start_date: startDate, end_date: endDate },
        transfers: [],
        summary: {},
        total_transfers: 0,
        total_pallets: 0,
      };
    }

    // 2. 獲取相關的棧板資訊
    const palletNumbers = [...new Set(transferRecords.map(r => r.plt_num))];
    const { data: palletInfo, error: palletError } = await supabase
      .from('record_palletinfo')
      .select('plt_num, product_code, product_qty')
      .in('plt_num', palletNumbers);

    if (palletError) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('Error fetching pallet info:', palletError.message);
    }

    // 3. 獲取操作員資訊 - 確保 operator_id 是 number 類型
    const operatorIds = [...new Set(transferRecords.map(r => Number(r.operator_id)).filter(id => !isNaN(id)))];
    const { data: operatorInfo, error: operatorError } = await supabase
      .from('data_id')
      .select('id, name')
      .in('id', operatorIds);

    if (operatorError) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.warn('Error fetching operator info:', operatorError.message);
    }

    // 4. 創建查找映射
    const palletMap = new Map(
      (palletInfo || []).map(p => [p.plt_num, p])
    );
    const operatorMap = new Map(
      (operatorInfo || []).map(o => [o.id, o.name])
    );

    // 5. 處理轉移記錄
    const transfers: TransferRecord[] = transferRecords.map(record => {
      const pallet = palletMap.get(record.plt_num);
      const operatorId = Number(record.operator_id);
      const operatorName = operatorMap.get(operatorId) || `ID: ${operatorId}`;

      return {
        transfer_date: record.tran_date,
        pallet_number: record.plt_num,
        product_code: pallet?.product_code || 'Unknown',
        quantity: pallet?.product_qty || 0,
        from_location: record.f_loc,
        to_location: record.t_loc,
        operator_name: operatorName,
        operator_id: operatorId,
      };
    });

    // 6. 計算位置統計
    const summary: LocationSummary = {};
    const locations = ['Fold Mill', 'Extrusion Room', 'Pipe Extrusion', 'Production', 'Back Car Park', 'Bulk Room'];
    
    // 初始化所有位置
    locations.forEach(loc => {
      summary[loc] = { transfers_in: 0, transfers_out: 0, net_change: 0 };
    });

    // 統計轉移
    transfers.forEach(transfer => {
      const fromLoc = transfer.from_location;
      const toLoc = transfer.to_location;

      if (summary[fromLoc]) {
        summary[fromLoc].transfers_out++;
      }
      if (summary[toLoc]) {
        summary[toLoc].transfers_in++;
      }
    });

    // 計算淨變化
    Object.keys(summary).forEach(loc => {
      summary[loc].net_change = summary[loc].transfers_in - summary[loc].transfers_out;
    });

    const result: TransactionReportData = {
      date_range: { start_date: startDate, end_date: endDate },
      transfers,
      summary,
      total_transfers: transfers.length,
      total_pallets: palletNumbers.length,
    };

    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`Successfully fetched transaction report data: ${transfers.length} transfers, ${palletNumbers.length} unique pallets`);
    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error in getTransactionReportData:', errorMessage);
    return null;
  }
} 