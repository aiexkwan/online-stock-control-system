/**
 * GRN Report Configuration
 */

import { ReportConfig } from '../core/ReportConfig';

export const grnReportConfig: ReportConfig = {
  id: 'grn-report',
  name: 'GRN Report',
  description: 'Export GRN reports',
  category: 'inventory',
  formats: ['excel'],
  sections: [
    {
      id: 'grn-data',
      title: 'GRN Data',
      dataSource: 'grn-data',
      columns: [
        { key: 'grn_ref', label: 'GRN Reference', type: 'string' },
        { key: 'material_code', label: 'Material Code', type: 'string' },
        { key: 'material_description', label: 'Description', type: 'string' },
        { key: 'supplier_name', label: 'Supplier', type: 'string' },
        { key: 'total_weight', label: 'Total Weight', type: 'number' },
        { key: 'pallet_count', label: 'Pallet Count', type: 'number' },
        { key: 'package_type', label: 'Package Type', type: 'string' },
        { key: 'print_date', label: 'Print Date', type: 'date' },
      ],
      enableSorting: true,
      enableFiltering: true,
    }
  ],
  parameters: [
    {
      id: 'grnRef',
      label: 'GRN Reference',
      type: 'select',
      required: true,
      options: 'dynamic', // Will be populated from database
    }
  ],
};