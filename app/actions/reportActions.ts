'use server';

// import { createSupabaseServerClient } from '@/lib/supabase/server'; // 舊的錯誤路徑
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { format, isValid } from 'date-fns'; // 用於日期格式化
// 如果您有資料庫類型定義，例如： import { Database } from '@/types_db';

/**
 * Fetches unique, non-null ACO order references from the 'record_aco' table.
 * @returns A promise that resolves to an array of unique order reference strings, sorted alphabetically.
 *          Returns an empty array if an error occurs or no data is found.
 */
export async function getUniqueAcoOrderRefs(): Promise<string[]> {
  const cookieStore = cookies();
  // 如果您有 Database 類型，請使用: const supabase = createServerActionClient<Database>({ cookies: () => cookieStore });
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  // 假設表名是 'record_aco' 且欄位名是 'order_ref'
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