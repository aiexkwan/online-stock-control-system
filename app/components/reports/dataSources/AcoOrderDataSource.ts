/**
 * ACO Order Report Data Source
 */

import { ReportDataSource } from '../core/ReportConfig';
import { createClient } from '@/app/utils/supabase/client';

// ACO Order data source
const acoOrderDataSource: ReportDataSource = {
  id: 'aco-order-data',
  
  async fetch(filters: Record<string, any>) {
    const supabase = createClient();
    const acoOrder = filters?.acoOrder;
    
    if (!acoOrder) {
      throw new Error('ACO Order is required');
    }
    
    const { data, error } = await supabase
      .from('acos')
      .select('*')
      .eq('aco_order', acoOrder)
      .order('product_code', { ascending: true });
    
    if (error) {
      throw new Error(`Failed to fetch ACO data: ${error.message}`);
    }
    
    return data || [];
  },
  
  transform(data: any[]) {
    return data.map(item => ({
      product_code: item.product_code,
      pallet_number: item.pallet_number,
      qty: item.qty,
      qc_date: item.qc_date,
      required_qty: item.required_qty,
      aco_order: item.aco_order,
    }));
  }
};

// Export data sources map
export const acoOrderDataSources = new Map([
  ['aco-order-data', acoOrderDataSource],
]);