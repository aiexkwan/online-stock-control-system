/**
 * Export All Data Configuration
 */

import { ReportConfig } from '../core/ReportConfig';

export const exportAllDataReportConfig: ReportConfig = {
  id: 'export-all-data',
  name: 'Export All Data',
  description: 'Export selected tables',
  category: 'operational',
  formats: ['excel'], // Using excel to represent CSV export
  defaultFormat: 'excel',
  sections: [
    {
      id: 'all-data',
      title: 'Database Export',
      type: 'table',
      dataSource: 'all-data',
      config: {
        columns: [], // Dynamic based on selected tables
      }
    }
  ],
  filters: [
    {
      id: 'selectedTables',
      label: 'Tables to Export',
      type: 'multiSelect',
      required: true,
      options: [
        { value: 'record_palletinfo', label: 'Pallet Information' },
        { value: 'data_code', label: 'Code List' },
        { value: 'report_void', label: 'Voided Inventory' },
        { value: 'record_history', label: 'Operation History' },
        { value: 'record_inventory', label: 'Full Inventory' },
      ],
    },
    {
      id: 'startDate',
      label: 'Start Date',
      type: 'date',
      required: false, // Only required for certain tables
    },
    {
      id: 'endDate', 
      label: 'End Date',
      type: 'date',
      required: false, // Only required for certain tables
    }
  ],
};