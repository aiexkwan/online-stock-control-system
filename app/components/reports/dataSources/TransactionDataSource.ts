/**
 * Transaction Report Data Source
 */

import { ReportDataSource } from '../core/ReportConfig';
import { createClient } from '@/app/utils/supabase/client';
import { safeString } from '@/types/core/guards';

// 定義變換後的數據介面
interface TransactionTransformedData {
  transfer_date: unknown;
  pallet_number: unknown;
  product_code: unknown;
  quantity: unknown;
  from_location: string;
  to_location: string;
  operator: string;
  transfer_type: string;
}

// Transaction data source
const transactionDataSource: ReportDataSource = {
  id: 'transaction-data',

  async fetch(filters: Record<string, unknown>) {
    const supabase = createClient();
    const { startDate, endDate } = filters || ({} as Record<string, unknown>);

    if (!startDate || !endDate) {
      throw new Error('Date range is required');
    }

    const { data, error } = await supabase
      .from('record_transfer')
      .select('*')
      .gte('tran_date', `${startDate}T00:00:00`)
      .lte('tran_date', `${endDate}T23:59:59`)
      .order('tran_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch transaction data: ${error.message}`);
    }

    return data || [];
  },

  transform(data: Record<string, unknown>[]): TransactionTransformedData[] {
    return data.map(item => {
      return {
        transfer_date: item.tran_date,
        pallet_number: item.plt_num,
        product_code: item.plt_num, // 使用 pallet number 作為產品參考
        quantity: 1, // 每次轉移計為1個單位
        from_location: safeString(item.f_loc, 'N/A'),
        to_location: safeString(item.t_loc, 'N/A'),
        operator: safeString(item.operator_id, 'Unknown'),
        transfer_type: 'Transfer',
      };
    });
  },
};

// Export data sources map
export const transactionDataSources = new Map([['transaction-data', transactionDataSource]]);
