'use server';

// import { createSupabaseServerClient } from '@/lib/supabase/server'; // 舊的錯誤路徑
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { format, isValid } from 'date-fns'; // 用於日期格式化
// import type { Database } from '../lib/database.types'; // Path still incorrect, commenting out for now
// 如果您有資料庫類型定義，例如： import { Database } from '@/types_db';

/**
 * Fetches unique, non-null ACO order references from the 'record_aco' table.
 * @returns A promise that resolves to an array of unique order reference strings, sorted alphabetically.
 *          Returns an empty array if an error occurs or no data is found.
 */
export async function getUniqueAcoOrderRefs(): Promise<string[]> {
  const supabase = createServerActionClient<any>({ cookies }); // Using any for now

  const { data, error } = await supabase
    .from('record_aco') // <<-- 假設表名
    .select('order_ref'); // <<-- 假設欄位名

  if (error) {
    console.error('Error fetching aco_order_refs:', error.message);
    return [];
  }

  if (!data) {
    return [];
  }

  // 從結果中提取唯一且非空的 order_ref 值
  const uniqueRefs = Array.from(
    new Set(data.map((item: any) => item.order_ref).filter((ref: any) => ref != null))
  ) as string[];

  return uniqueRefs.sort(); // 按字母順序排序 (可選)
}

// --- 新增的類型定義 ---
export interface PalletInfo {
  plt_num: string | null;
  product_qty: number | null;
  generate_time: string | null; // Formatted as DD-MM-YY
}

export interface AcoProductData {
  product_code: string;
  pallets: PalletInfo[];
}
// --- 結束新增的類型定義 ---

/**
 * Fetches data for the ACO report based on a specific order reference.
 * @param orderRef The ACO order reference to fetch data for.
 * @returns A promise that resolves to an array of AcoProductData.
 */
export async function getAcoReportData(orderRef: string): Promise<AcoProductData[]> {
  if (!orderRef) {
    console.error('getAcoReportData: orderRef is required');
    return [];
  }

  const cookieStore = cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  try {
    // 步驟 1: 根據 orderRef 從 record_aco 獲取唯一的 product_code
    const { data: acoCodesData, error: acoCodesError } = await supabase
      .from('record_aco')
      .select('code') // 假設欄位名是 'code'
      .eq('order_ref', orderRef);

    if (acoCodesError) {
      console.error(`Error fetching product codes for orderRef ${orderRef}:`, acoCodesError.message);
      return [];
    }
    if (!acoCodesData) {
      console.log(`No product codes found for orderRef ${orderRef}.`);
      return [];
    }

    const uniqueProductCodes = Array.from(
      new Set(acoCodesData.map((item: any) => item.code).filter((code: any) => code != null))
    ) as string[];

    if (uniqueProductCodes.length === 0) {
      console.log(`No valid product codes extracted for orderRef ${orderRef}.`);
      return [];
    }

    // 步驟 2: 為每個 product_code 獲取棧板資訊
    const reportData: AcoProductData[] = [];

    for (const productCode of uniqueProductCodes) {
      const { data: palletDetails, error: palletError } = await supabase
        .from('record_palletinfo') // 假設表名
        .select('plt_num, product_qty, generate_time') // 假設欄位名
        .eq('product_code', productCode)
        .eq('plt_remark', `ACO Ref : ${orderRef}`); // 假設 plt_remark 格式

      if (palletError) {
        console.error(`Error fetching pallet info for productCode ${productCode} and orderRef ${orderRef}:`, palletError.message);
        // 即使一個產品代碼查詢失敗，也繼續處理其他的
        continue;
      }

      const formattedPallets: PalletInfo[] = (palletDetails || []).map((p: any) => {
        let formattedDate: string | null = null;
        if (p.generate_time) {
          const dateObj = new Date(p.generate_time);
          if (isValid(dateObj)) { // 檢查日期物件是否有效
            formattedDate = format(dateObj, 'dd-MMM-yy');
          } else {
            console.warn(`Invalid date value for generate_time: ${p.generate_time} for product ${productCode}`);
            // formattedDate 保持 null，或者您可以設定為一個特定的錯誤提示字串
          }
        }
        return {
          plt_num: p.plt_num,
          product_qty: p.product_qty,
          generate_time: formattedDate,
        };
      });

      reportData.push({
        product_code: productCode,
        pallets: formattedPallets,
      });
    }
    return reportData;

  } catch (error) {
    // 更通用的錯誤處理
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`Unexpected error in getAcoReportData for orderRef ${orderRef}:`, errorMessage);
    return [];
  }
}

export async function getUniqueGrnRefs(): Promise<string[]> {
  const supabase = createServerActionClient<any>({ cookies }); // Using any for now

  const { data, error } = await supabase
    .from('record_grn')
    .select('grn_ref');

  if (error) {
    console.error('Error fetching GRN refs:', error);
    throw new Error('Could not fetch GRN references. ' + error.message);
  }

  if (!data) {
    return [];
  }

  // Extract unique grn_ref values
  const uniqueRefs = Array.from(new Set(data.map(item => item.grn_ref).filter(ref => ref !== null) as string[]));
  return uniqueRefs.sort(); // Optional: sort the references
}

export async function getMaterialCodesForGrnRef(grnRef: string): Promise<string[]> {
  if (!grnRef) {
    console.error('getMaterialCodesForGrnRef: grnRef is required');
    return [];
  }
  const supabase = createServerActionClient<any>({ cookies });
  const { data, error } = await supabase
    .from('record_grn')
    .select('material_code')
    .eq('grn_ref', grnRef);

  if (error) {
    console.error(`Error fetching material codes for grnRef ${grnRef}:`, error.message);
    return [];
  }
  if (!data) {
    return [];
  }
  const uniqueMaterialCodes = Array.from(
    new Set(data.map((item: any) => item.material_code).filter((code: any) => code != null))
  ) as string[];
  return uniqueMaterialCodes.sort();
}

// --- GRN Report Types ---
export interface GrnRecordDetail {
  gross_weight: number | null;
  net_weight: number | null;
  pallet: string | null;
  package_type: string | null; // Changed from package to package_type to avoid conflict with keyword
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
  userId: string // For now, can be a placeholder like "CurrentUser"
): Promise<GrnReportPageData | null> {
  if (!grnRef || !materialCode) {
    console.error('getGrnReportData: grnRef and materialCode are required');
    return null;
  }

  const supabase = createServerActionClient<any>({ cookies });
  let supplierCode: string | null = null;

  try {
    // 1. Fetch GRN records for the given grn_ref and material_code
    const { data: grnRecords, error: grnError } = await supabase
      .from('record_grn')
      .select('sup_code, material_code, gross_weight, net_weight, pallet, package') // Assuming 'package' is the column name
      .eq('grn_ref', grnRef)
      .eq('material_code', materialCode);

    if (grnError) {
      console.error(`Error fetching GRN records for grnRef ${grnRef} and materialCode ${materialCode}:`, grnError.message);
      return null;
    }
    if (!grnRecords || grnRecords.length === 0) {
      console.log(`No GRN records found for grnRef ${grnRef} and materialCode ${materialCode}.`);
      return null;
    }

    // Store supplier code from the first record to fetch supplier name later
    supplierCode = grnRecords[0].sup_code;

    const recordsDetails: GrnRecordDetail[] = grnRecords.map(r => ({
      gross_weight: r.gross_weight,
      net_weight: r.net_weight,
      pallet: r.pallet,
      package_type: r.package, // map to package_type
    }));

    // 2. Fetch material description from data_code
    let materialDescription: string | null = null;
    const { data: materialData, error: materialError } = await supabase
      .from('data_code')
      .select('description')
      .eq('code', materialCode)
      .single(); // Expecting a single record

    if (materialError) {
      console.warn(`Could not fetch description for materialCode ${materialCode}:`, materialError.message);
      // Continue without description if not found or error
    }
    if (materialData) {
      materialDescription = materialData.description;
    }

    // 3. Fetch supplier name from data_supplier using supplierCode
    let supplierName: string | null = null;
    if (supplierCode) {
      const { data: supplierData, error: supplierError } = await supabase
        .from('data_supplier')
        .select('supplier_name')
        .eq('supplier_code', supplierCode)
        .single(); // Expecting a single record

      if (supplierError) {
        console.warn(`Could not fetch supplier name for sup_code ${supplierCode}:`, supplierError.message);
        // Continue without supplier name if not found or error
      }
      if (supplierData) {
        supplierName = supplierData.supplier_name;
      }
    } else {
        console.warn('Supplier code was not found in GRN records, cannot fetch supplier name.');
    }

    // 4. Calculate totals
    const totalGrossWeight = recordsDetails.reduce((sum, rec) => sum + (rec.gross_weight || 0), 0);
    const totalNetWeight = recordsDetails.reduce((sum, rec) => sum + (rec.net_weight || 0), 0);
    const weightDifference = totalGrossWeight - totalNetWeight;

    // 5. Format report date
    const reportDate = format(new Date(), 'dd-MMM-yyyy').toUpperCase();

    return {
      grn_ref: grnRef,
      user_id: userId, // Using the passed userId
      material_code: materialCode,
      material_description: materialDescription,
      supplier_name: supplierName,
      report_date: reportDate,
      records: recordsDetails,
      total_gross_weight: totalGrossWeight,
      total_net_weight: totalNetWeight,
      weight_difference: weightDifference,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`Unexpected error in getGrnReportData for grnRef ${grnRef}, materialCode ${materialCode}:`, errorMessage);
    return null;
  }
} 