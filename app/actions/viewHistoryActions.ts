'use server';

// import { createServerActionClient } from '@supabase/auth-helpers-nextjs'; // OLD
// import { cookies } from 'next/headers'; // Not needed directly, createClient handles it
import { createClient } from '@/app/utils/supabase/server'; // NEW: Using @supabase/ssr helper
// import { Database } from '@/types_db'; // Assuming you have a types_db.ts for your DB schema for better type safety

// New interface for details from data_code table
interface DataCodeProductDetails {
  code?: string; // This should match palletInfo.productCode
  description?: string;
  colour?: string;
  standard_qty?: number;
  type?: string;
  [key: string]: any; 
}

// 基本的數據結構，詳細欄位待定
interface PalletInfo {
  palletNum?: string;
  productCode?: string; // This will be used to link to data_code
  series?: string;
  // description?: string; // This was a placeholder, will now come from productDetails
  generate_time?: string; // from record_palletinfo
  product_qty?: number;   // from record_palletinfo
  plt_remark?: string;    // from record_palletinfo
  productDetails?: DataCodeProductDetails | null; // New field for data_code info
  // ... 其他 palletInfo 欄位
  [key: string]: any; // 允許額外欄位
}

interface HistoryEvent {
  time?: string; // ISO string
  action?: string;
  loc?: string; // from record_history
  id?: number; // operator id from record_history
  remark?: string; // from record_history
  // ... 其他 history 欄位
  [key: string]: any;
}

interface StockDetails {
    // All fields from record_inventory
    uuid?: string;
    product_code?: string; // Will be present
    injection?: number | null;
    pipeline?: number | null;
    prebook?: number | null;
    await?: number | null;
    fold?: number | null;
    bulk?: number | null;
    backcarpark?: number | null;
    latest_update?: string | null;
    [key: string]: any;
}

export interface ViewHistoryResult {
  palletInfo: PalletInfo | null;
  palletHistory: HistoryEvent[];
  stockInfo: StockDetails | null;
  error?: string | null; // 錯誤訊息
  queryType?: 'palletNum' | 'series' | null; // 實際執行的查詢類型
  queryValue?: string | null; // 實際執行的查詢值
}

// 模擬的 Server Action
export async function getPalletHistoryAndStockInfo(
  identifier: { type: 'palletNum'; value: string } | { type: 'series'; value: string }
): Promise<ViewHistoryResult> {
  // const cookieStore = cookies(); // OLD
  const supabase = createClient(); // NEW: Create Supabase client instance

  const { type, value } = identifier;

  let palletInfoData: PalletInfo | null = null;
  let palletHistoryData: HistoryEvent[] = [];
  let stockInfoData: StockDetails | null = null;
  let errorMsg: string | null = null;

  let productCodeForSearch: string | undefined = undefined; // Renamed for clarity
  let palletNumForHistorySearch: string | undefined = undefined;

  console.log(`Server Action: Real DB Search for ${type} - ${value}`);
  // await new Promise(resolve => setTimeout(resolve, 500)); // Shorter delay for real search, or remove for production

  try {
    if (type === 'series' && value.trim() !== '') {
      const { data: pallet, error: palletError } = await supabase
        .from('record_palletinfo')
        .select('*') // Select all for now for debug
        .eq('series', value.trim())
        .single();

      if (palletError && palletError.code !== 'PGRST116') { // PGRST116: single row not found, treat as not found
        console.error('Supabase error fetching pallet by series:', palletError);
        throw new Error(`Error fetching pallet by series: ${palletError.message}`);
      }
      if (!pallet) {
        errorMsg = `No pallet found for series: ${value.trim()}`;
        // throw new Error(errorMsg); // Don't throw, let it proceed to return with errorMsg
      } else {
        palletInfoData = pallet as PalletInfo;
        productCodeForSearch = pallet.product_code;
        palletNumForHistorySearch = pallet.plt_num;
      }

    } else if (type === 'palletNum' && value.trim() !== '') {
      const { data: pallet, error: palletError } = await supabase
        .from('record_palletinfo')
        .select('*') // Select all for now for debug
        .eq('plt_num', value.trim())
        .single();
      
      if (palletError && palletError.code !== 'PGRST116') { // PGRST116: single row not found
        console.error('Supabase error fetching pallet by plt_num:', palletError);
        throw new Error(`Error fetching pallet by plt_num: ${palletError.message}`);
      }
      if (!pallet) {
         errorMsg = `No pallet found for pallet number: ${value.trim()}`;
        // throw new Error(errorMsg);
      } else {
        palletInfoData = pallet as PalletInfo;
        productCodeForSearch = pallet.product_code;
        palletNumForHistorySearch = pallet.plt_num;
      }
    } else {
      errorMsg = 'Invalid search type or empty value provided.';
      // throw new Error(errorMsg);
    }

    // Fetch product details from data_code if productCodeForSearch is set and no major error yet
    let productDetailsData: DataCodeProductDetails | null = null;
    if (productCodeForSearch && palletInfoData && !errorMsg) { // Ensure palletInfoData exists before trying to attach to it
      const { data: dcDetails, error: dcError } = await supabase
        .from('data_code')
        .select('*') // Fetch all columns as requested
        .eq('code', productCodeForSearch)
        .single(); // Use single() as code should be unique. PGRST116 will be handled.

      if (dcError && dcError.code !== 'PGRST116') { 
        console.warn(`Could not fetch product details from data_code for ${productCodeForSearch}: ${dcError.message}`);
        // Not throwing error, palletInfo will just lack these details.
      }
      if (dcDetails) {
        productDetailsData = dcDetails as DataCodeProductDetails;
        palletInfoData.productDetails = productDetailsData; // Attach to palletInfoData
      }
    }

    // Fetch history if palletNumForHistorySearch is set and no major error yet
    if (palletNumForHistorySearch && !errorMsg) {
      const { data: history, error: historyError } = await supabase
        .from('record_history')
        .select('*') // Select all for debug
        .eq('plt_num', palletNumForHistorySearch)
        .order('time', { ascending: false });
      
      if (historyError) {
        console.error('Supabase error fetching history:', historyError);
        throw new Error(`Error fetching history: ${historyError.message}`);
      }
      palletHistoryData = history || [];
      if (palletHistoryData.length === 0 && palletInfoData) {
        // If pallet info was found but no history, it's not an error itself
        // but good to note. The UI will handle display of empty history.
      }
    }

    // Fetch stock info if productCodeForSearch is set and no major error yet
    if (productCodeForSearch && !errorMsg) {
      const { data: inventoryEntries, error: stockError } = await supabase
        .from('record_inventory')
        .select('injection, pipeline, prebook, await, fold, bulk, backcarpark') // Select only relevant columns
        .eq('product_code', productCodeForSearch);

      if (stockError) {
          console.error('Supabase error fetching stock info from record_inventory:', stockError);
          throw new Error(`Error fetching stock info: ${stockError.message}`);
      }
      
      if (inventoryEntries && inventoryEntries.length > 0) {
        const totals: StockDetails = {
          // uuid can be omitted or set to a generic value if not directly applicable for aggregated view
          product_code: productCodeForSearch,
          injection: 0,
          pipeline: 0,
          prebook: 0,
          await: 0,
          fold: 0,
          bulk: 0,
          backcarpark: 0,
          latest_update: new Date().toISOString(), // Represents the time of aggregation
        };

        for (const entry of inventoryEntries) {
          totals.injection = (totals.injection || 0) + (entry.injection || 0);
          totals.pipeline = (totals.pipeline || 0) + (entry.pipeline || 0);
          totals.prebook = (totals.prebook || 0) + (entry.prebook || 0);
          totals.await = (totals.await || 0) + (entry.await || 0);
          totals.fold = (totals.fold || 0) + (entry.fold || 0);
          totals.bulk = (totals.bulk || 0) + (entry.bulk || 0);
          totals.backcarpark = (totals.backcarpark || 0) + (entry.backcarpark || 0);
        }
        stockInfoData = totals;
      } else {
        // No inventory entries found for this product code, stockInfoData remains null
        // The UI will show "No associated stock information found..."
        stockInfoData = null; 
      }
    }

    // If palletInfoData is still null here and no specific error was set for it,
    // it means the initial pallet lookup failed silently (e.g. due to PGRST116 handled as !pallet).
    // Ensure errorMsg reflects this if not already set.
    if (!palletInfoData && !errorMsg && (type === 'series' || type === 'palletNum') && value.trim() !== '') {
        errorMsg = `No pallet found for ${type}: ${value.trim()}`;
    }


  } catch (e: any) {
    console.error('Error in getPalletHistoryAndStockInfo during processing:', e);
    if (!errorMsg) { // If errorMsg wasn't set by a specific check, use the caught error message
        errorMsg = e.message || 'An unexpected error occurred during data retrieval.';
    }
    // Ensure data is reset if a general error occurs
    if (palletInfoData && errorMsg) palletInfoData = null; // Don't show partial pallet if general error
    palletHistoryData = [];
    if (stockInfoData && errorMsg) stockInfoData = null; // Don't show partial stock if general error
  }

  return {
    palletInfo: palletInfoData,
    palletHistory: palletHistoryData,
    stockInfo: stockInfoData,
    error: errorMsg,
    queryType: type,
    queryValue: value,
  };
} 