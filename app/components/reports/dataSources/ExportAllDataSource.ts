/**
 * Export All Data Source
 */

import { ReportDataSource } from '../core/ReportConfig';
import type { DatabaseRecord } from '@/types/database/tables';

// Export all data source
const exportAllDataSource: ReportDataSource = {
  id: 'all-data',

  async fetch(filters: Record<string, unknown>): Promise<DatabaseRecord[]> {
    // This data source is special - it doesn't actually fetch data
    // The export is handled directly in the dialog component
    return [] as DatabaseRecord[];
  },

  transform(data: DatabaseRecord[]): DatabaseRecord[] {
    // No transformation needed
    return data;
  },
};

// Export data sources map
export const exportAllDataSources = new Map([['all-data', exportAllDataSource]]);
