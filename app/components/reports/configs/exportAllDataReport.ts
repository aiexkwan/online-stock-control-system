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
  sections: [
    {
      id: 'all-data',
      title: 'Database Export',
      dataSource: 'all-data',
      columns: [], // Dynamic based on selected tables
      enableSorting: false,
      enableFiltering: false,
    }
  ],
  parameters: [
    {
      id: 'selectedTables',
      label: 'Tables to Export',
      type: 'multiselect',
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