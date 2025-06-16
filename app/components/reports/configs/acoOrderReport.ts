/**
 * ACO Order Report Configuration
 */

import { ReportConfig } from '../core/ReportConfig';

export const acoOrderReportConfig: ReportConfig = {
  id: 'aco-order-report',
  name: 'ACO Order Report',
  description: 'Export ACO order reports',
  category: 'operational',
  formats: ['excel'],
  sections: [
    {
      id: 'aco-data',
      title: 'ACO Order Data',
      dataSource: 'aco-order-data',
      columns: [
        { key: 'product_code', label: 'Product Code', type: 'string' },
        { key: 'pallet_number', label: 'Pallet Number', type: 'string' },
        { key: 'qty', label: 'Quantity', type: 'number' },
        { key: 'qc_date', label: 'QC Date', type: 'date' },
        { key: 'required_qty', label: 'Required Qty', type: 'number' },
        { key: 'aco_order', label: 'ACO Order', type: 'string' },
      ],
      enableSorting: true,
      enableFiltering: true,
    }
  ],
  parameters: [
    {
      id: 'acoOrder',
      label: 'ACO Order',
      type: 'select',
      required: true,
      options: 'dynamic', // Will be populated from database
    }
  ],
};