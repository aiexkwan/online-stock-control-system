/**
 * Transaction Report Data Source
 */

import { ReportDataSource, FilterValues } from '../core/ReportConfig';
import { createClient } from '../../../utils/supabase/client';
import { safeString } from '../../../../lib/types/type-guards';
import { DatabaseRecord } from '../../../../types/database/tables';

// 定義變換後的數據介面
interface TransactionTransformedData {
  transfer_date: string | null;
  pallet_number: string | null;
  product_code: string | null;
  quantity: number;
  from_location: string;
  to_location: string;
  operator: string;
  transfer_type: string;
}

// Transaction data source
const transactionDataSource: ReportDataSource = {
  id: 'transaction-data',

  async fetch(filters: FilterValues): Promise<DatabaseRecord[]> {
    const supabase = createClient();
    const { startDate, endDate } = filters;

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

    return (data || []) as DatabaseRecord[];
  },

  transform(data: DatabaseRecord[]): TransactionTransformedData[] {
    return data.map(item => {
      return {
        transfer_date: safeString(item.tran_date) || null,
        pallet_number: safeString(item.plt_num) || null,
        product_code: safeString(item.plt_num) || null, // 使用 pallet number 作為產品參考
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
