/**
 * GRN Report Data Source
 */

import { ReportDataSource } from '../core/ReportConfig';
import { createClient } from '@/app/utils/supabase/client';

// GRN data source
const grnDataSource: ReportDataSource = {
  id: 'grn-data',
  
  async fetch(filters: Record<string, any>) {
    const supabase = createClient();
    const grnRef = filters?.grnRef;
    
    if (!grnRef) {
      throw new Error('GRN Reference is required');
    }
    
    const { data, error } = await supabase
      .from('grn_label')
      .select('*')
      .eq('grn_ref', grnRef)
      .order('material_code', { ascending: true });
    
    if (error) {
      throw new Error(`Failed to fetch GRN data: ${error.message}`);
    }
    
    return data || [];
  },
  
  transform(data: any[]) {
    // Group by material code for aggregation
    const grouped = data.reduce((acc: any, item: any) => {
      const key = item.material_code;
      if (!acc[key]) {
        acc[key] = {
          grn_ref: item.grn_ref,
          material_code: item.material_code,
          material_description: item.material_description,
          supplier_name: item.supplier_name,
          total_weight: 0,
          pallet_count: 0,
          package_type: item.package_type,
          print_date: item.print_date,
        };
      }
      acc[key].total_weight += item.weight || 0;
      acc[key].pallet_count += 1;
      return acc;
    }, {});
    
    return Object.values(grouped);
  }
};

// Export data sources map
export const grnDataSources = new Map([
  ['grn-data', grnDataSource],
]);