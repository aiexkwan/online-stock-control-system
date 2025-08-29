/**
 * GRN Report Data Source
 */

import { ReportDataSource } from '../core/ReportConfig';
import { createClient } from '@/app/utils/supabase/client';

interface GrnTransformedData {
  material_code: string;
  description: string;
  quantity: number;
  unit: string;
  lot_no: string;
}

// GRN data source
const grnDataSource: ReportDataSource = {
  id: 'grn-data',

  async fetch(filters: Record<string, unknown>) {
    const supabase = createClient();
    const grnRef = filters?.grnRef;

    if (!grnRef) {
      throw new Error('GRN Reference is required');
    }

    const { data, error } = await supabase
      .from('record_grn')
      .select('*')
      .eq('grn_ref', Number(grnRef))
      .order('material_code', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch GRN data: ${error.message}`);
    }

    return data || [];
  },

  transform(data: Record<string, unknown>[]): GrnTransformedData[] {
    interface GrnGroupedData {
      material_code: string;
      description: string;
      quantity: number;
      unit: string;
      lot_no: string;
    }

    // 策略4: unknown + type narrowing - 安全的分組聚合
    const grouped = data.reduce(
      (acc: Record<string, GrnGroupedData>, item: Record<string, unknown>) => {
        // 安全的字符串轉換
        const key =
          typeof item.material_code === 'string'
            ? item.material_code
            : String(item.material_code || '');
        if (!acc[key]) {
          acc[key] = {
            material_code:
              typeof item.material_code === 'string'
                ? item.material_code
                : String(item.material_code || ''),
            description:
              typeof item.material_description === 'string'
                ? item.material_description
                : String(item.material_description || ''),
            quantity: 0,
            unit:
              typeof item.package_type === 'string'
                ? item.package_type
                : String(item.package_type || ''),
            lot_no: typeof item.lot_no === 'string' ? item.lot_no : String(item.lot_no || ''),
          };
        }
        // 安全的數字轉換
        const weight =
          typeof item.weight === 'number'
            ? item.weight
            : typeof item.weight === 'string'
              ? parseFloat(item.weight)
              : 0;
        acc[key].quantity += weight || 0;
        return acc;
      },
      {}
    );

    return Object.values(grouped) as GrnTransformedData[];
  },
};

// Export data sources map
export const grnDataSources = new Map([['grn-data', grnDataSource]]);
