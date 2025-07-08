'use server';

// import { createSupabaseServerClient } from '@/lib/supabase/server'; // 舊的錯誤路徑
// import { createServerActionClient } from '@supabase/auth-helpers-nextjs'; // OLD
// import { cookies } from 'next/headers'; // Not needed directly, createClient handles it
import { createClient } from '@/app/utils/supabase/server'; // NEW: Using @supabase/ssr helper
import { getUserIdFromEmail } from '@/lib/utils/getUserId'; // 統一的用戶 ID 獲取函數
import { format, isValid } from 'date-fns'; // 用於日期格式化
// Database record types
interface AcoOrderRecord {
  order_ref: number;
  code: string;
  required_qty: number | null;
}

interface PalletRecord {
  plt_num: string;
  product_code: string;
  product_qty: number;
  generate_time: string;
}

interface GrnRecord {
  grn_ref: number;
  material_code: string;
  sup_code: string;
  gross_weight: number;
  net_weight: number;
  pallet: string;
  package: string;
  pallet_count: number;
  package_count: number;
}

interface MaterialRecord {
  description: string;
}

interface SupplierRecord {
  supplier_name: string;
}


interface OperatorRecord {
  id: number;
  name: string;
}

/**
 * Fetches unique, non-null ACO order references from the 'record_aco' table.
 * @returns A promise that resolves to an array of unique order reference strings, sorted numerically.
 *          Returns an empty array if an error occurs or no data is found.
 */
export async function getUniqueAcoOrderRefs(): Promise<string[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.from('record_aco').select('order_ref');

    if (error) {
      console.error('Error fetching aco_order_refs:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      process.env.NODE_ENV === 'development' &&
        console.log('No ACO order references found in database.');
      return [];
    }

    // 正確處理 number 到 string 的轉換，並過濾無效值
    const uniqueRefs = Array.from(
      new Set(
        data
          .map((item: { order_ref: any }) => item.order_ref)
          .filter((ref: number) => ref != null && !isNaN(Number(ref)))
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
      console.error(
        `Error fetching product codes for orderRef ${orderRefNum}:`,
        acoCodesError.message
      );
      return [];
    }

    if (!acoCodesData || acoCodesData.length === 0) {
      process.env.NODE_ENV === 'development' &&
        console.log(`No product codes found for orderRef ${orderRefNum}.`);
      return [];
    }

    // 創建產品代碼到 required_qty 的映射
    const productCodeToRequiredQty = new Map<string, number>();
    const uniqueProductCodes: string[] = [];

    acoCodesData.forEach((item: { code: any; required_qty: any }) => {
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
      process.env.NODE_ENV === 'development' &&
        process.env.NODE_ENV === 'development' &&
        console.log(`No valid product codes extracted for orderRef ${orderRefNum}.`);
      return [];
    }

    // 步驟 2: 使用批量查詢優化性能 - 一次性獲取所有產品的棧板資訊
    const { data: allPalletDetails, error: palletError } = await supabase
      .from('record_palletinfo')
      .select('product_code, plt_num, product_qty, generate_time')
      .in('product_code', uniqueProductCodes)
      .or(
        `plt_remark.ilike.%ACO Ref : ${orderRefNum}%,plt_remark.ilike.%ACO Ref: ${orderRefNum}%,plt_remark.ilike.%ACO_Ref_${orderRefNum}%,plt_remark.ilike.%ACO-Ref-${orderRefNum}%`
      ); // 改進容錯性

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
              process.env.NODE_ENV === 'development' &&
                process.env.NODE_ENV === 'development' &&
                console.warn(
                  `Invalid date value for generate_time: ${p.generate_time} for product ${productCode}`
                );
            }
          } catch (dateError) {
            process.env.NODE_ENV === 'development' &&
              process.env.NODE_ENV === 'development' &&
              console.warn(
                `Error parsing date ${p.generate_time} for product ${productCode}:`,
                dateError
              );
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

    process.env.NODE_ENV === 'development' &&
      process.env.NODE_ENV === 'development' &&
      console.log(
        `Successfully fetched ACO report data for orderRef ${orderRefNum}: ${reportData.length} products, ${reportData.reduce((sum, p) => sum + p.pallets.length, 0)} pallets`
      );
    return reportData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(
      `Unexpected error in getAcoReportData for orderRef ${orderRefNum}:`,
      errorMessage
    );
    return [];
  }
}

export async function getUniqueGrnRefs(): Promise<string[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.from('record_grn').select('grn_ref');

    if (error) {
      console.error('Error fetching GRN refs:', error.message);
      throw new Error('Could not fetch GRN references. ' + error.message);
    }

    if (!data || data.length === 0) {
      process.env.NODE_ENV === 'development' &&
        process.env.NODE_ENV === 'development' &&
        console.log('No GRN references found in database.');
      return [];
    }

    // 正確處理 number 到 string 的轉換，並過濾無效值
    const uniqueRefs = Array.from(
      new Set(
        data
          .map((item: { grn_ref: number }) => item.grn_ref)
          .filter((ref: number) => ref !== null && ref !== undefined && !isNaN(Number(ref)))
          .map((ref: any) => ref.toString())
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
      process.env.NODE_ENV === 'development' &&
        process.env.NODE_ENV === 'development' &&
        console.log(`No material codes found for grnRef ${grnRefNum}.`);
      return [];
    }

    const uniqueMaterialCodes = Array.from(
      new Set(
        data
          .map((item: { material_code: string }) => item.material_code)
          .filter((code: string) => code != null && typeof code === 'string' && code.trim() !== '')
      )
    ) as string[];

    return uniqueMaterialCodes.sort();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(
      `Unexpected error in getMaterialCodesForGrnRef for grnRef ${grnRefNum}:`,
      errorMessage
    );
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
    // 🆕 使用統一的 getUserIdFromEmail 函數
    const userIdResult = await getUserIdFromEmail(trimmedUserEmail);

    if (!userIdResult) {
      console.error(`No user ID found for email ${trimmedUserEmail}`);
      return null;
    }

    userId = userIdResult.toString();
    process.env.NODE_ENV === 'development' &&
      process.env.NODE_ENV === 'development' &&
      console.log(`Found user ID ${userId} for email ${trimmedUserEmail}`);

    // 1. Fetch GRN records for the given grn_ref and material_code
    const { data: grnRecords, error: grnError } = await supabase
      .from('record_grn')
      .select(
        'sup_code, material_code, gross_weight, net_weight, pallet, package, pallet_count, package_count'
      )
      .eq('grn_ref', grnRefNum) // 使用數字類型
      .eq('material_code', trimmedMaterialCode);

    if (grnError) {
      console.error(
        `Error fetching GRN records for grnRef ${grnRefNum} and materialCode ${trimmedMaterialCode}:`,
        grnError.message
      );
      return null;
    }

    if (!grnRecords || grnRecords.length === 0) {
      process.env.NODE_ENV === 'development' &&
        process.env.NODE_ENV === 'development' &&
        console.log(
          `No GRN records found for grnRef ${grnRefNum} and materialCode ${trimmedMaterialCode}.`
        );
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
    process.env.NODE_ENV === 'development' &&
      process.env.NODE_ENV === 'development' &&
      console.log(
        `[DEBUG] GRN Ref: ${grnRefNum}, Material: ${trimmedMaterialCode}, User ID: ${userId}`
      );
    process.env.NODE_ENV === 'development' &&
      process.env.NODE_ENV === 'development' &&
      console.log('[DEBUG] grnRecords from DB:', JSON.stringify(grnRecords, null, 2));
    process.env.NODE_ENV === 'development' &&
      process.env.NODE_ENV === 'development' &&
      console.log('[DEBUG] Mapped recordsDetails:', JSON.stringify(recordsDetails, null, 2));
    // DEBUGGING LOG END

    // 2. Fetch material description from data_code
    let materialDescription: string | null = null;
    const { data: materialData, error: materialError } = await supabase
      .from('data_code')
      .select('description')
      .eq('code', trimmedMaterialCode)
      .single();

    if (materialError) {
      process.env.NODE_ENV === 'development' &&
        process.env.NODE_ENV === 'development' &&
        console.warn(
          `Could not fetch description for materialCode ${trimmedMaterialCode}:`,
          materialError.message
        );
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
        process.env.NODE_ENV === 'development' &&
          process.env.NODE_ENV === 'development' &&
          console.warn(
            `Could not fetch supplier name for sup_code ${supplierCode}:`,
            supplierError.message
          );
      }
      if (supplierData && supplierData.supplier_name) {
        supplierName = supplierData.supplier_name;
      }
    } else {
      process.env.NODE_ENV === 'development' &&
        process.env.NODE_ENV === 'development' &&
        console.warn('Supplier code was not found in GRN records, cannot fetch supplier name.');
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

    process.env.NODE_ENV === 'development' &&
      process.env.NODE_ENV === 'development' &&
      console.log(
        `Successfully generated GRN report data for grnRef ${grnRefNum}, materialCode ${trimmedMaterialCode}, userId ${userId}: ${recordsDetails.length} records`
      );
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(
      `Unexpected error in getGrnReportData for grnRef ${grnRefNum}, materialCode ${trimmedMaterialCode}:`,
      errorMessage
    );
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
    process.env.NODE_ENV === 'development' &&
      process.env.NODE_ENV === 'development' &&
      console.log(`[DEBUG] Searching for transfers between ${startDate} and ${endDate}`);

    // 🆕 修復日期查詢：處理帶時間戳的日期格式
    // 將結束日期設為當天的 23:59:59 以包含整天的記錄
    const startDateTime = `${startDate}T00:00:00.000Z`;
    const endDateTime = `${endDate}T23:59:59.999Z`;

    process.env.NODE_ENV === 'development' &&
      process.env.NODE_ENV === 'development' &&
      console.log(`[DEBUG] Using datetime range: ${startDateTime} to ${endDateTime}`);

    const { data: transferRecords, error: transferError } = await supabase
      .from('record_transfer')
      .select(
        `
        f_loc,
        t_loc,
        plt_num,
        tran_date,
        operator_id
      `
      )
      .gte('tran_date', startDateTime)
      .lte('tran_date', endDateTime)
      .order('tran_date', { ascending: true });

    process.env.NODE_ENV === 'development' &&
      process.env.NODE_ENV === 'development' &&
      console.log(`[DEBUG] Transfer query result:`, {
        recordCount: transferRecords?.length || 0,
        error: transferError?.message,
        sampleRecord: transferRecords?.[0],
      });

    if (transferError) {
      console.error('Error fetching transfer records:', transferError.message);
      return null;
    }

    // 如果沒有轉移記錄，返回空數據結構
    if (!transferRecords || transferRecords.length === 0) {
      process.env.NODE_ENV === 'development' &&
        process.env.NODE_ENV === 'development' &&
        console.log(`No transfer records found for date range ${startDate} to ${endDate}`);

      // 🆕 嘗試更寬鬆的日期查詢，以防日期格式問題
      process.env.NODE_ENV === 'development' &&
        process.env.NODE_ENV === 'development' &&
        console.log(`[DEBUG] Trying broader date search...`);
      const { data: allRecords, error: allError } = await supabase
        .from('record_transfer')
        .select('tran_date')
        .order('tran_date', { ascending: false })
        .limit(10);

      if (allRecords && allRecords.length > 0) {
        process.env.NODE_ENV === 'development' &&
          process.env.NODE_ENV === 'development' &&
          console.log(
            `[DEBUG] Sample dates in database:`,
            allRecords.map(r => r.tran_date)
          );
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
      process.env.NODE_ENV === 'development' &&
        process.env.NODE_ENV === 'development' &&
        console.warn('Error fetching pallet info:', palletError.message);
    }

    // 3. 獲取操作員資訊 - 確保 operator_id 是 number 類型
    const operatorIds = [
      ...new Set(transferRecords.map(r => Number(r.operator_id)).filter(id => !isNaN(id))),
    ];
    const { data: operatorInfo, error: operatorError } = await supabase
      .from('data_id')
      .select('id, name')
      .in('id', operatorIds);

    if (operatorError) {
      process.env.NODE_ENV === 'development' &&
        process.env.NODE_ENV === 'development' &&
        console.warn('Error fetching operator info:', operatorError.message);
    }

    // 4. 創建查找映射
    const palletMap = new Map((palletInfo || []).map(p => [p.plt_num, p]));
    const operatorMap = new Map((operatorInfo || []).map(o => [o.id, o.name]));

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
    const locations = [
      'Fold Mill',
      'Extrusion Room',
      'Pipe Extrusion',
      'Production',
      'Back Car Park',
      'Bulk Room',
    ];

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

    process.env.NODE_ENV === 'development' &&
      process.env.NODE_ENV === 'development' &&
      console.log(
        `Successfully fetched transaction report data: ${transfers.length} transfers, ${palletNumbers.length} unique pallets`
      );
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error in getTransactionReportData:', errorMessage);
    return null;
  }
}

// ===== Warehouse Work Level Analytics =====

import {
  WarehouseWorkLevelParams,
  WarehouseWorkLevelResponse,
  isWarehouseWorkLevelError,
  formatDateForRPC,
  getDefaultDateRange,
} from '@/app/types/warehouse-work-level';

/**
 * Get warehouse work level data
 * Server Action for fetching warehouse work level analytics
 */
export async function getWarehouseWorkLevel(params?: WarehouseWorkLevelParams): Promise<{
  success: boolean;
  data?: WarehouseWorkLevelResponse;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Prepare parameters with defaults
    const defaultRange = getDefaultDateRange();
    const startDate = params?.startDate || defaultRange.startDate;
    const endDate = params?.endDate || defaultRange.endDate;
    const department = params?.department || 'Warehouse';

    // Call RPC function
    const { data: result, error: rpcError } = await supabase.rpc('rpc_get_warehouse_work_level', {
      p_start_date: formatDateForRPC(startDate),
      p_end_date: formatDateForRPC(endDate),
      p_department: department,
    });

    if (rpcError) {
      throw new Error(`RPC Error: ${rpcError.message}`);
    }

    const typedResult = result as WarehouseWorkLevelResponse;

    // Check if result is an error
    if (isWarehouseWorkLevelError(typedResult)) {
      return {
        success: false,
        error: typedResult.message,
      };
    }

    return {
      success: true,
      data: typedResult,
    };
  } catch (error) {
    console.error('[reportActions] Error fetching warehouse work level:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get today's warehouse work level
 * Convenience Server Action for today's data
 */
export async function getTodayWarehouseWorkLevel(): Promise<{
  success: boolean;
  data?: WarehouseWorkLevelResponse;
  error?: string;
}> {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getWarehouseWorkLevel({
    startDate: today,
    endDate: tomorrow,
  });
}

/**
 * Get this week's warehouse work level
 * Convenience Server Action for this week's data
 */
export async function getThisWeekWarehouseWorkLevel(): Promise<{
  success: boolean;
  data?: WarehouseWorkLevelResponse;
  error?: string;
}> {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  return getWarehouseWorkLevel({
    startDate: startOfWeek,
    endDate: now,
  });
}

/**
 * Get this month's warehouse work level
 * Convenience Server Action for this month's data
 */
export async function getThisMonthWarehouseWorkLevel(): Promise<{
  success: boolean;
  data?: WarehouseWorkLevelResponse;
  error?: string;
}> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return getWarehouseWorkLevel({
    startDate: startOfMonth,
    endDate: now,
  });
}

// --- Void Pallet Report Functions ---

interface VoidPalletFilters {
  startDate: string;
  endDate: string;
  productCode?: string;
  operatorId?: number;
  voidReason?: string;
}

interface VoidPalletRecord {
  plt_num: string;
  time: string;
  remark: string;
  id: number;
  record_palletinfo: {
    product_code: string;
    product_qty: number;
  };
  data_id?: {
    name: string;
  };
  data_code?: {
    description: string;
  };
}

interface VoidPalletSummary {
  totalVoided: number;
  totalQuantity: number;
  uniqueProducts: number;
  topReason: string;
}

interface VoidReasonStats {
  void_reason: string;
  count: number;
  total_quantity: number;
  percentage: number;
}

interface VoidPalletDetails {
  void_date: string;
  plt_num: string;
  product_code: string;
  product_description: string;
  quantity: number;
  void_reason: string;
  operator_name: string;
  remark: string;
}

interface VoidProductStats {
  product_code: string;
  product_description: string;
  void_count: number;
  total_quantity: number;
  avg_quantity: number;
}

/**
 * Extract void reason from remark text
 */
function extractVoidReason(remark: string): string {
  if (!remark) return 'Unknown';

  const patterns = [/Reason:\s*([^,]+)/i, /void reason:\s*([^,]+)/i, /\(([^)]+)\)/];

  for (const pattern of patterns) {
    const match = remark.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return 'Other';
}

/**
 * Get void pallet summary statistics
 */
export async function getVoidPalletSummary(filters: VoidPalletFilters): Promise<{
  success: boolean;
  data?: VoidPalletSummary;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    let query = supabase
      .from('record_history')
      .select(
        `
        plt_num,
        time,
        remark,
        record_palletinfo!inner(
          product_code,
          product_qty
        )
      `
      )
      .eq('action', 'Void')
      .gte('time', filters.startDate)
      .lte('time', filters.endDate + 'T23:59:59');

    if (filters.productCode) {
      query = query.eq('record_palletinfo.product_code', filters.productCode);
    }

    if (filters.operatorId) {
      query = query.eq('id', filters.operatorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching void pallet summary:', error.message);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, data: { totalVoided: 0, totalQuantity: 0, uniqueProducts: 0, topReason: 'Unknown' } };
    }

    // Calculate summary statistics
    const totalVoided = data.length;
    const totalQuantity = data.reduce(
      (sum: number, item: any) => sum + (item.record_palletinfo?.product_qty || 0),
      0
    );
    const uniqueProducts = new Set(
      data.map((item: any) => item.record_palletinfo?.product_code).filter(Boolean)
    ).size;

    // Calculate most common reason
    const reasons = data.map((item: any) => extractVoidReason(item.remark));
    const reasonCounts = new Map<string, number>();

    reasons.forEach((reason: string) => {
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    });

    let topReason = 'Unknown';
    let maxCount = 0;

    reasonCounts.forEach((count, reason) => {
      if (count > maxCount) {
        maxCount = count;
        topReason = reason;
      }
    });

    return {
      success: true,
      data: {
        totalVoided,
        totalQuantity,
        uniqueProducts,
        topReason,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unexpected error in getVoidPalletSummary:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get void reason statistics
 */
export async function getVoidReasonStats(filters: VoidPalletFilters): Promise<{
  success: boolean;
  data?: VoidReasonStats[];
  error?: string;
}> {
  const supabase = await createClient();

  try {
    let query = supabase
      .from('record_history')
      .select(
        `
        plt_num,
        time,
        remark,
        record_palletinfo!inner(
          product_code,
          product_qty
        )
      `
      )
      .eq('action', 'Void')
      .gte('time', filters.startDate)
      .lte('time', filters.endDate + 'T23:59:59');

    if (filters.productCode) {
      query = query.eq('record_palletinfo.product_code', filters.productCode);
    }

    if (filters.operatorId) {
      query = query.eq('id', filters.operatorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching void reason stats:', error.message);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, data: [] };
    }

    // Calculate reason statistics
    const reasonStats = new Map<string, { count: number; quantity: number }>();

    data.forEach((item: any) => {
      const reason = extractVoidReason(item.remark);
      const quantity = item.record_palletinfo?.product_qty || 0;

      if (!reasonStats.has(reason)) {
        reasonStats.set(reason, { count: 0, quantity: 0 });
      }

      const stats = reasonStats.get(reason)!;
      stats.count++;
      stats.quantity += quantity;
    });

    const total = data.length;

    const result = Array.from(reasonStats.entries())
      .map(([reason, stats]) => ({
        void_reason: reason,
        count: stats.count,
        total_quantity: stats.quantity,
        percentage: total > 0 ? stats.count / total : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { success: true, data: result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unexpected error in getVoidReasonStats:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get void pallet details
 */
export async function getVoidPalletDetails(filters: VoidPalletFilters): Promise<{
  success: boolean;
  data?: VoidPalletDetails[];
  error?: string;
}> {
  const supabase = await createClient();

  try {
    let query = supabase
      .from('record_history')
      .select(
        `
        plt_num,
        time,
        remark,
        id,
        record_palletinfo!inner(
          product_code,
          product_qty
        ),
        data_id!inner(
          name
        ),
        data_code!inner(
          description
        )
      `
      )
      .eq('action', 'Void')
      .gte('time', filters.startDate)
      .lte('time', filters.endDate + 'T23:59:59')
      .order('time', { ascending: false });

    if (filters.productCode) {
      query = query.eq('record_palletinfo.product_code', filters.productCode);
    }

    if (filters.operatorId) {
      query = query.eq('id', filters.operatorId);
    }

    if (filters.voidReason) {
      query = query.ilike('remark', `%${filters.voidReason}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching void pallet details:', error.message);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, data: [] };
    }

    const result = data.map((item: any) => ({
      void_date: item.time,
      plt_num: item.plt_num,
      product_code: item.record_palletinfo?.product_code || '',
      product_description: item.data_code?.description || '',
      quantity: item.record_palletinfo?.product_qty || 0,
      void_reason: extractVoidReason(item.remark),
      operator_name: item.data_id?.name || `ID: ${item.id}`,
      remark: item.remark || '',
    }));

    return { success: true, data: result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unexpected error in getVoidPalletDetails:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get void product statistics
 */
export async function getVoidProductStats(filters: VoidPalletFilters): Promise<{
  success: boolean;
  data?: VoidProductStats[];
  error?: string;
}> {
  const supabase = await createClient();

  try {
    let query = supabase
      .from('record_history')
      .select(
        `
        plt_num,
        time,
        remark,
        id,
        record_palletinfo!inner(
          product_code,
          product_qty
        ),
        data_code!inner(
          description
        )
      `
      )
      .eq('action', 'Void')
      .gte('time', filters.startDate)
      .lte('time', filters.endDate + 'T23:59:59');

    if (filters.productCode) {
      query = query.eq('record_palletinfo.product_code', filters.productCode);
    }

    if (filters.operatorId) {
      query = query.eq('id', filters.operatorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching void product stats:', error.message);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, data: [] };
    }

    // Calculate product statistics
    const productStats = new Map<
      string,
      {
        description: string;
        count: number;
        totalQty: number;
      }
    >();

    data.forEach((item: any) => {
      const code = item.record_palletinfo?.product_code;
      if (!code) return;

      if (!productStats.has(code)) {
        productStats.set(code, {
          description: item.data_code?.description || '',
          count: 0,
          totalQty: 0,
        });
      }

      const stats = productStats.get(code)!;
      stats.count++;
      stats.totalQty += item.record_palletinfo?.product_qty || 0;
    });

    const result = Array.from(productStats.entries())
      .map(([code, stats]) => ({
        product_code: code,
        product_description: stats.description,
        void_count: stats.count,
        total_quantity: stats.totalQty,
        avg_quantity: stats.count > 0 ? stats.totalQty / stats.count : 0,
      }))
      .sort((a, b) => b.void_count - a.void_count);

    return { success: true, data: result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unexpected error in getVoidProductStats:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// --- Stock Take Report Functions ---

interface StockTakeFilters {
  stockTakeDate: string;
  productCode?: string;
  minVariance?: number;
  countStatus?: 'counted' | 'not_counted' | 'high_variance' | '' | null;
}

interface StockTakeRecord {
  count_time: string;
  product_code: string;
  plt_num: string;
  system_qty: string;
  counted_qty: string;
}

interface StockLevelRecord {
  stock: string;
  stock_level: number;
  description: string;
}

interface StockTakeSummary {
  totalProducts: number;
  countedProducts: number;
  completionRate: number;
  completionPercentage: number;
  totalVariance: number;
  highVarianceCount: number;
}

interface StockTakeDetails {
  product_code: string;
  description: string;
  system_stock: number;
  counted_qty: number;
  variance: number;
  variance_percentage: number;
  pallet_count: number;
  status: 'Counted' | 'Not Counted';
  last_updated: string | null;
}

interface NotCountedItem {
  product_code: string;
  description: string;
  system_stock: number;
}

/**
 * Get stock take summary statistics
 */
export async function getStockTakeSummary(filters: StockTakeFilters): Promise<{
  success: boolean;
  data?: StockTakeSummary;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    const { stockTakeDate } = filters;

    if (!stockTakeDate) {
      return { success: false, error: 'Stock take date is required' };
    }

    // Get stock take records for the date
    const { data: stockTakeData, error: stockTakeError } = await supabase
      .from('record_stocktake')
      .select('*')
      .gte('count_time', stockTakeDate)
      .lt('count_time', `${stockTakeDate}T23:59:59`);

    if (stockTakeError) {
      console.error('Error fetching stock take data:', stockTakeError.message);
      return { success: false, error: stockTakeError.message };
    }

    // Get all stock levels
    const { data: stockLevels, error: stockError } = await supabase
      .from('stock_level')
      .select('stock, stock_level, description');

    if (stockError) {
      console.error('Error fetching stock levels:', stockError.message);
      return { success: false, error: stockError.message };
    }

    if (!stockTakeData || !stockLevels) {
      return { success: true, data: { totalProducts: 0, countedProducts: 0, completionRate: 0, completionPercentage: 0, totalVariance: 0, highVarianceCount: 0 } };
    }

    // Group stock take data by product
    const productGroups = groupStockTakeByProduct(stockTakeData);
    const stockMap = new Map(stockLevels.map((item: StockLevelRecord) => [item.stock, item]));

    let totalProducts = stockMap.size;
    let countedProducts = 0;
    let totalVariance = 0;
    let highVarianceCount = 0;

    // Calculate statistics
    productGroups.forEach((items, productCode) => {
      const stockInfo = stockMap.get(productCode);
      const systemStock = stockInfo?.stock_level || 0;
      const countedQty = calculateStockTakeTotalQty(items);
      const variance = countedQty - systemStock;
      const variancePercentage = systemStock > 0 ? Math.abs(variance / systemStock) : 0;

      if (countedQty > 0) {
        countedProducts++;
      }

      totalVariance += variance;

      if (variancePercentage > 0.1) { // 10% variance
        highVarianceCount++;
      }
    });

    const completionRate = totalProducts > 0 ? countedProducts / totalProducts : 0;

    return {
      success: true,
      data: {
        totalProducts,
        countedProducts,
        completionRate,
        completionPercentage: completionRate,
        totalVariance,
        highVarianceCount,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unexpected error in getStockTakeSummary:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get stock take details
 */
export async function getStockTakeDetails(filters: StockTakeFilters): Promise<{
  success: boolean;
  data?: StockTakeDetails[];
  error?: string;
}> {
  const supabase = await createClient();

  try {
    const { stockTakeDate } = filters;

    if (!stockTakeDate) {
      return { success: false, error: 'Stock take date is required' };
    }

    // Get stock take records for the date
    const { data: stockTakeData, error: stockTakeError } = await supabase
      .from('record_stocktake')
      .select('*')
      .gte('count_time', stockTakeDate)
      .lt('count_time', `${stockTakeDate}T23:59:59`);

    if (stockTakeError) {
      console.error('Error fetching stock take data:', stockTakeError.message);
      return { success: false, error: stockTakeError.message };
    }

    // Get all stock levels
    const { data: stockLevels, error: stockError } = await supabase
      .from('stock_level')
      .select('stock, stock_level, description');

    if (stockError) {
      console.error('Error fetching stock levels:', stockError.message);
      return { success: false, error: stockError.message };
    }

    if (!stockTakeData || !stockLevels) {
      return { success: true, data: [] };
    }

    // Group stock take data by product
    const productGroups = groupStockTakeByProduct(stockTakeData);
    const stockMap = new Map(stockLevels.map((item: StockLevelRecord) => [item.stock, item]));

    const results: StockTakeDetails[] = [];

    // Process each product
    productGroups.forEach((items, productCode) => {
      const stockInfo = stockMap.get(productCode);
      const systemStock = stockInfo?.stock_level || 0;
      const countedQty = calculateStockTakeTotalQty(items);
      const variance = countedQty - systemStock;
      const variancePercentage = systemStock > 0 ? (variance / systemStock) * 100 : 0;

      // Apply filters
      if (shouldIncludeStockTakeItem(productCode, variance, variancePercentage, countedQty, filters)) {
        results.push({
          product_code: productCode,
          description: stockInfo?.description || '',
          system_stock: systemStock,
          counted_qty: countedQty,
          variance: variance,
          variance_percentage: variancePercentage,
          pallet_count: items.filter(item => item.plt_num && item.plt_num !== '').length,
          status: countedQty > 0 ? 'Counted' : 'Not Counted',
          last_updated: items[0]?.count_time || null,
        });
      }
    });

    // Add not counted products if needed
    if (!filters.countStatus || filters.countStatus === null || filters.countStatus === '' || filters.countStatus === 'not_counted') {
      stockLevels.forEach((stockItem: StockLevelRecord) => {
        if (!productGroups.has(stockItem.stock) && stockItem.stock_level > 0) {
          if (shouldIncludeStockTakeItem(stockItem.stock, -stockItem.stock_level, -100, 0, filters)) {
            results.push({
              product_code: stockItem.stock,
              description: stockItem.description || '',
              system_stock: stockItem.stock_level,
              counted_qty: 0,
              variance: -stockItem.stock_level,
              variance_percentage: -100,
              pallet_count: 0,
              status: 'Not Counted',
              last_updated: null,
            });
          }
        }
      });
    }

    // Sort by variance percentage descending
    const sortedResults = results.sort(
      (a, b) => Math.abs(b.variance_percentage) - Math.abs(a.variance_percentage)
    );

    return { success: true, data: sortedResults };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unexpected error in getStockTakeDetails:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get not counted items
 */
export async function getNotCountedItems(filters: StockTakeFilters): Promise<{
  success: boolean;
  data?: NotCountedItem[];
  error?: string;
}> {
  const supabase = await createClient();

  try {
    const { stockTakeDate } = filters;

    if (!stockTakeDate) {
      return { success: false, error: 'Stock take date is required' };
    }

    // Get stock take records for the date
    const { data: stockTakeData, error: stockTakeError } = await supabase
      .from('record_stocktake')
      .select('*')
      .gte('count_time', stockTakeDate)
      .lt('count_time', `${stockTakeDate}T23:59:59`);

    if (stockTakeError) {
      console.error('Error fetching stock take data:', stockTakeError.message);
      return { success: false, error: stockTakeError.message };
    }

    // Get all stock levels
    const { data: stockLevels, error: stockError } = await supabase
      .from('stock_level')
      .select('stock, stock_level, description');

    if (stockError) {
      console.error('Error fetching stock levels:', stockError.message);
      return { success: false, error: stockError.message };
    }

    if (!stockTakeData || !stockLevels) {
      return { success: true, data: [] };
    }

    // Get counted products
    const countedProducts = new Set(stockTakeData.map((item: StockTakeRecord) => item.product_code));

    // Find not counted products
    const notCountedItems = stockLevels
      .filter((item: StockLevelRecord) => !countedProducts.has(item.stock) && item.stock_level > 0)
      .map((item: StockLevelRecord) => ({
        product_code: item.stock,
        description: item.description || '',
        system_stock: item.stock_level,
      }))
      .sort((a: NotCountedItem, b: NotCountedItem) => b.system_stock - a.system_stock);

    return { success: true, data: notCountedItems };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unexpected error in getNotCountedItems:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Helper function to group stock take data by product
 */
function groupStockTakeByProduct(stockTakeData: StockTakeRecord[]): Map<string, StockTakeRecord[]> {
  const groups = new Map<string, StockTakeRecord[]>();

  stockTakeData.forEach(item => {
    const productCode = item.product_code;
    if (!groups.has(productCode)) {
      groups.set(productCode, []);
    }
    groups.get(productCode)!.push(item);
  });

  return groups;
}

/**
 * Helper function to calculate total quantity for stock take items
 */
function calculateStockTakeTotalQty(items: StockTakeRecord[]): number {
  return items.reduce((sum, item) => {
    // Handle initial records (without pallet number)
    if (!item.plt_num || item.plt_num === '') {
      return sum + (parseInt(item.system_qty || '0') || 0);
    }
    return sum + (parseInt(item.counted_qty || '0') || 0);
  }, 0);
}

/**
 * Helper function to determine if stock take item should be included based on filters
 */
function shouldIncludeStockTakeItem(
  productCode: string,
  variance: number,
  variancePercentage: number,
  countedQty: number,
  filters: StockTakeFilters
): boolean {
  // Product code filter
  if (filters.productCode && !productCode.includes(filters.productCode)) {
    return false;
  }

  // Variance percentage filter
  if (filters.minVariance && Math.abs(variancePercentage) < filters.minVariance) {
    return false;
  }

  // Count status filter
  if (filters.countStatus) {
    switch (filters.countStatus) {
      case 'counted':
        return countedQty > 0;
      case 'not_counted':
        return countedQty === 0;
      case 'high_variance':
        return Math.abs(variancePercentage) > 10;
    }
  }

  return true;
}

// --- Order Loading Report Functions ---

interface OrderLoadingFilters {
  dateRange: string; // "startDate|endDate" format
  orderNumber?: string;
  productCode?: string;
  userId?: number;
}

interface OrderLoadingRecord {
  order_number: string;
  product_code: string;
  product_qty: string;
  loaded_qty: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  data_order: {
    order_date: string;
    status: string;
  };
}

interface OrderLoadingHistoryRecord {
  id: number;
  order_number: string;
  product_code: string;
  loaded_qty: number;
  action: string;
  user_id: number;
  created_at: string;
  data_id: {
    name: string;
  };
  data_code: {
    description: string;
  };
}

interface OrderLoadingSummary {
  totalOrders: number;
  completedOrders: number;
  totalItemsLoaded: number;
  avgCompletionRate: number;
}

interface OrderProgress {
  order_number: string;
  order_date: string;
  total_items: number;
  loaded_items: number;
  completion_rate: number;
  status: 'Completed' | 'Partial' | 'Pending';
}

interface LoadingDetails {
  timestamp: string;
  order_number: string;
  product_code: string;
  product_description: string;
  loaded_qty: number;
  user_name: string;
  action: string;
}

interface UserPerformance {
  user_id: string;
  user_name: string;
  total_loads: number;
  total_quantity: number;
  avg_load_time: string;
}

/**
 * Parse date range in format "startDate|endDate"
 */
function parseDateRange(dateRange: string): [string, string] {
  if (dateRange && dateRange.includes('|')) {
    return dateRange.split('|') as [string, string];
  }
  return ['', ''];
}

/**
 * Get order loading summary statistics
 */
export async function getOrderLoadingSummary(filters: OrderLoadingFilters): Promise<{
  success: boolean;
  data?: OrderLoadingSummary;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    const [startDate, endDate] = parseDateRange(filters.dateRange);

    if (!startDate || !endDate) {
      return { success: false, error: 'Valid date range is required' };
    }

    let query = supabase
      .from('record_order_loading')
      .select(
        `
        order_number,
        product_code,
        product_qty,
        loaded_qty,
        user_id,
        created_at,
        updated_at,
        data_order!inner(
          order_date,
          status
        )
      `
      )
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59');

    // Apply filters
    if (filters.orderNumber) {
      query = query.eq('order_number', filters.orderNumber);
    }

    if (filters.productCode) {
      query = query.eq('product_code', filters.productCode);
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching order loading summary:', error.message);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, data: { totalOrders: 0, completedOrders: 0, totalItemsLoaded: 0, avgCompletionRate: 0 } };
    }

    // Group by order to calculate statistics
    const orderMap = new Map<
      string,
      {
        totalQty: number;
        loadedQty: number;
        status: string;
      }
    >();

    data.forEach((item: any) => {
      const orderNumber = item.order_number;
      if (!orderMap.has(orderNumber)) {
        orderMap.set(orderNumber, {
          totalQty: 0,
          loadedQty: 0,
          status: (item as any).data_order?.status || 'pending',
        });
      }

      const order = orderMap.get(orderNumber)!;
      order.totalQty += parseInt(item.product_qty || '0');
      order.loadedQty += parseInt(item.loaded_qty || '0');
    });

    // Calculate statistics
    const completedOrders = Array.from(orderMap.values()).filter(
      order => order.loadedQty >= order.totalQty
    ).length;

    const totalItemsLoaded = data.reduce((sum, item) => sum + parseInt(item.loaded_qty || '0'), 0);

    const completionRates = Array.from(orderMap.values()).map(order =>
      order.totalQty > 0 ? order.loadedQty / order.totalQty : 0
    );

    const avgCompletionRate =
      completionRates.length > 0
        ? completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length
        : 0;

    return {
      success: true,
      data: {
        totalOrders: orderMap.size,
        completedOrders,
        totalItemsLoaded,
        avgCompletionRate,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unexpected error in getOrderLoadingSummary:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get order progress data
 */
export async function getOrderProgress(filters: OrderLoadingFilters): Promise<{
  success: boolean;
  data?: OrderProgress[];
  error?: string;
}> {
  const supabase = await createClient();

  try {
    const [startDate, endDate] = parseDateRange(filters.dateRange);

    if (!startDate || !endDate) {
      return { success: false, error: 'Valid date range is required' };
    }

    let query = supabase
      .from('record_order_loading')
      .select(
        `
        order_number,
        product_code,
        product_qty,
        loaded_qty,
        user_id,
        created_at,
        updated_at,
        data_order!inner(
          order_date,
          status
        )
      `
      )
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59');

    // Apply filters
    if (filters.orderNumber) {
      query = query.eq('order_number', filters.orderNumber);
    }

    if (filters.productCode) {
      query = query.eq('product_code', filters.productCode);
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    const { data: rawData, error } = await query;

    if (error) {
      console.error('Error fetching order progress:', error.message);
      return { success: false, error: error.message };
    }

    if (!rawData) {
      return { success: true, data: [] };
    }

    // Group by order
    const orderMap = new Map<string, any>();

    rawData.forEach(item => {
      const orderNumber = item.order_number;
      if (!orderMap.has(orderNumber)) {
        orderMap.set(orderNumber, {
          order_number: orderNumber,
          order_date: (item as any).data_order?.order_date,
          total_qty: 0,
          loaded_qty: 0,
          products: new Set(),
        });
      }

      const order = orderMap.get(orderNumber)!;
      order.total_qty += parseInt(item.product_qty || '0');
      order.loaded_qty += parseInt(item.loaded_qty || '0');
      order.products.add(item.product_code);
    });

    const result = Array.from(orderMap.values())
      .map(order => {
        const completionRate = order.total_qty > 0 ? order.loaded_qty / order.total_qty : 0;

        return {
          order_number: order.order_number,
          order_date: order.order_date,
          total_items: order.total_qty,
          loaded_items: order.loaded_qty,
          completion_rate: completionRate,
          status: completionRate >= 1 ? 'Completed' : completionRate > 0 ? 'Partial' : 'Pending',
        } as OrderProgress;
      })
      .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());

    return { success: true, data: result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unexpected error in getOrderProgress:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get loading details history
 */
export async function getLoadingDetails(filters: OrderLoadingFilters): Promise<{
  success: boolean;
  data?: LoadingDetails[];
  error?: string;
}> {
  const supabase = await createClient();

  try {
    const [startDate, endDate] = parseDateRange(filters.dateRange);

    if (!startDate || !endDate) {
      return { success: false, error: 'Valid date range is required' };
    }

    let query = supabase
      .from('record_order_loading_history')
      .select(
        `
        id,
        order_number,
        product_code,
        loaded_qty,
        action,
        user_id,
        created_at,
        data_id!inner(
          name
        ),
        data_code!inner(
          description
        )
      `
      )
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.orderNumber) {
      query = query.eq('order_number', filters.orderNumber);
    }

    if (filters.productCode) {
      query = query.eq('product_code', filters.productCode);
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching loading details:', error.message);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, data: [] };
    }

    const result = data.map(item => ({
      timestamp: item.created_at,
      order_number: item.order_number,
      product_code: item.product_code,
      product_description: (item as any).data_code?.description || '',
      loaded_qty: item.loaded_qty,
      user_name: (item as any).data_id?.name || `User ${item.user_id}`,
      action: item.action || 'Load',
    }));

    return { success: true, data: result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unexpected error in getLoadingDetails:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get user performance statistics
 */
export async function getUserPerformance(filters: OrderLoadingFilters): Promise<{
  success: boolean;
  data?: UserPerformance[];
  error?: string;
}> {
  const supabase = await createClient();

  try {
    const [startDate, endDate] = parseDateRange(filters.dateRange);

    if (!startDate || !endDate) {
      return { success: false, error: 'Valid date range is required' };
    }

    let query = supabase
      .from('record_order_loading_history')
      .select(
        `
        id,
        order_number,
        product_code,
        loaded_qty,
        action,
        user_id,
        created_at,
        data_id!inner(
          name
        ),
        data_code!inner(
          description
        )
      `
      )
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59')
      .order('created_at', { ascending: true });

    // Apply filters
    if (filters.orderNumber) {
      query = query.eq('order_number', filters.orderNumber);
    }

    if (filters.productCode) {
      query = query.eq('product_code', filters.productCode);
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user performance:', error.message);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, data: [] };
    }

    // Group by user for statistics
    const userStats = new Map<
      string,
      {
        user_name: string;
        total_loads: number;
        total_quantity: number;
        load_times: number[];
      }
    >();

    data.forEach((item: any) => {
      const userId = item.user_id?.toString() || 'unknown';

      if (!userStats.has(userId)) {
        userStats.set(userId, {
          user_name: (item as any).data_id?.name || `User ${item.user_id}`,
          total_loads: 0,
          total_quantity: 0,
          load_times: [],
        });
      }

      const stats = userStats.get(userId)!;
      stats.total_loads++;
      stats.total_quantity += item.loaded_qty || 0;
    });

    const result = Array.from(userStats.entries())
      .map(([userId, stats]) => ({
        user_id: userId,
        user_name: stats.user_name,
        total_loads: stats.total_loads,
        total_quantity: stats.total_quantity,
        avg_load_time: 'N/A', // Would need more complex calculation
      }))
      .sort((a, b) => b.total_loads - a.total_loads);

    return { success: true, data: result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Unexpected error in getUserPerformance:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
