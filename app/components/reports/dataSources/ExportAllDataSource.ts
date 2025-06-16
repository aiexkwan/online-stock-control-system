/**
 * Export All Data Source
 */

import { ReportDataSource } from '../core/ReportConfig';
import { createClient } from '@/app/utils/supabase/client';

// Export all data source
const exportAllDataSource: ReportDataSource = {
  id: 'all-data',
  name: 'All Data Export',
  
  async fetchData(filters?: Record<string, any>) {
    // This data source is special - it doesn't actually fetch data
    // The export is handled directly in the dialog component
    return [];
  },
  
  transformData(data: any[]) {
    // No transformation needed
    return data;
  }
};

// Export data sources map
export const exportAllDataSources = new Map([
  ['all-data', exportAllDataSource],
]);