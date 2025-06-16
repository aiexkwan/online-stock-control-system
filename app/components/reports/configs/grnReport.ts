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
  defaultFormat: 'excel',
  sections: [
    {
      id: 'grn-data',
      title: 'GRN Data',
      type: 'table',
      dataSource: 'grn-data',
      config: {
        columns: [
          { id: 'grn_ref', label: 'GRN Reference', type: 'text' },
          { id: 'material_code', label: 'Material Code', type: 'text' },
          { id: 'material_description', label: 'Description', type: 'text' },
          { id: 'supplier_name', label: 'Supplier', type: 'text' },
          { id: 'total_weight', label: 'Total Weight', type: 'number' },
          { id: 'pallet_count', label: 'Pallet Count', type: 'number' },
          { id: 'package_type', label: 'Package Type', type: 'text' },
          { id: 'print_date', label: 'Print Date', type: 'date' },
        ],
      }
    }
  ],
  filters: [
    {
      id: 'grnRef',
      label: 'GRN Reference',
      type: 'select',
      required: true,
      dataSource: {
        type: 'rpc',
        name: 'getUniqueGrnRefs',
      }
    }
  ],
};