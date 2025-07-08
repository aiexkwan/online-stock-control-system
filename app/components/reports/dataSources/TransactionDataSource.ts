/**
 * Transaction Report Data Source
 */

import { ReportDataSource } from '../core/ReportConfig';
import { createClient } from '@/app/utils/supabase/client';

// Transaction data source
const transactionDataSource: ReportDataSource = {
  id: 'transaction-data',

  async fetch(filters: Record<string, any>) {
    const supabase = createClient();
    const { startDate, endDate } = filters || {};

    if (!startDate || !endDate) {
      throw new Error('Date range is required');
    }

    const { data, error } = await supabase
      .from('stock_updates')
      .select(
        `
        *,
        users!stock_updates_user_id_fkey(name)
      `
      )
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch transaction data: ${error.message}`);
    }

    return data || [];
  },

  transform(data: any[]) {
    return data.map(item => ({
      transfer_date: item.created_at,
      pallet_number: item.pallet_number,
      product_code: item.product_code,
      quantity: item.qty,
      from_location: item.from_location || 'N/A',
      to_location: item.to_location || 'N/A',
      operator: item.users?.name || item.user_id || 'Unknown',
      transfer_type: item.action_type || 'Transfer',
    }));
  },
};

// Export data sources map
export const transactionDataSources = new Map([['transaction-data', transactionDataSource]]);
