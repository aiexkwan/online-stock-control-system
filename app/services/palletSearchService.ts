import { createClient } from '@/app/utils/supabase/client';
import { getErrorMessage } from '@/types/core/error';
import { toast } from 'sonner';

// 統一的托盤信息類型
export interface PalletInfo {
  plt_num: string;
  product_code: string;
  product_qty: number;
  plt_remark?: string | null;
  current_plt_loc?: string | null;
  series?: string | null;
  is_voided?: boolean;
}

// 搜尋參數類型
export interface SearchParams {
  searchType: 'series' | 'pallet_num';
  searchValue: string;
  checkVoided?: boolean;
}

// 搜尋結果類型
export interface SearchResult {
  success: boolean;
  data?: PalletInfo;
  error?: string;
}

/**
 * 統一的托盤搜尋服務
 * 可在任何組件或 hook 中重用
 */
export class PalletSearchService {
  private supabase = createClient();

  /**
   * 搜尋托盤信息
   * @param params 搜尋參數
   * @returns 搜尋結果
   */
  async searchPallet(params: SearchParams): Promise<SearchResult> {
    const { searchType, searchValue, checkVoided = false } = params;

    if (!searchValue.trim()) {
      return {
        success: false,
        error: `Please enter ${searchType === 'series' ? 'series number' : 'pallet number'}`,
      };
    }

    try {
      // 1. 從 record_palletinfo 獲取基本信息
      let palletData;

      if (searchType === 'series') {
        const { data, error } = await this.supabase
          .from('record_palletinfo')
          .select('plt_num, product_code, product_qty, plt_remark, series')
          .eq('series', searchValue.trim())
          .single();

        if (error) throw error;
        palletData = data;
      } else {
        const { data, error } = await this.supabase
          .from('record_palletinfo')
          .select('plt_num, product_code, product_qty, plt_remark, series')
          .eq('plt_num', searchValue.trim())
          .single();

        if (error) throw error;
        palletData = data;
      }

      if (!palletData) {
        return {
          success: false,
          error: `${searchType === 'series' ? 'Series' : 'Pallet'} ${searchValue} not found`,
        };
      }

      // 2. 獲取最新位置
      const { data: historyData, error: historyError } = await this.supabase
        .from('record_history')
        .select('loc, action')
        .eq('plt_num', palletData.plt_num)
        .order('time', { ascending: false })
        .limit(1);

      if (historyError) throw historyError;

      let currentLocation = 'Await'; // 默認位置
      let isVoided = false;

      if (historyData && historyData.length > 0) {
        const latestRecord = historyData[0];
        currentLocation = latestRecord.loc || 'Await';

        // 檢查是否已作廢
        if (checkVoided && latestRecord.loc === 'Voided') {
          isVoided = true;
        }
      }

      // 3. 返回統一格式的結果
      return {
        success: true,
        data: {
          plt_num: palletData.plt_num,
          product_code: palletData.product_code,
          product_qty: palletData.product_qty,
          plt_remark: palletData.plt_remark,
          series: palletData.series,
          current_plt_loc: currentLocation,
          is_voided: isVoided,
        },
      };
    } catch (error: unknown) {
      console.error('Pallet search failed:', error);
      return {
        success: false,
        error: getErrorMessage(error) || 'Search failed',
      };
    }
  }

  /**
   * 批量搜尋托盤
   * @param palletNumbers 托盤號數組
   * @returns 托盤信息數組
   */
  async batchSearchPallets(palletNumbers: string[]): Promise<PalletInfo[]> {
    try {
      const { data, error } = await this.supabase
        .from('record_palletinfo')
        .select('plt_num, product_code, product_qty, plt_remark, series')
        .in('plt_num', palletNumbers);

      if (error) throw error;

      // 獲取所有托盤的最新位置
      const palletInfos: PalletInfo[] = [];

      for (const pallet of data || []) {
        const { data: historyData } = await this.supabase
          .from('record_history')
          .select('loc')
          .eq('plt_num', pallet.plt_num)
          .order('time', { ascending: false })
          .limit(1);

        palletInfos.push({
          ...pallet,
          current_plt_loc: historyData?.[0]?.loc || 'Await',
        });
      }

      return palletInfos;
    } catch (error) {
      console.error('Batch pallet search failed:', error);
      return [];
    }
  }
}

// 創建單例實例
export const palletSearchService = new PalletSearchService();
