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
  defaultFormat: 'excel',
  sections: [
    {
      id: 'aco-data',
      title: 'ACO Order Data',
      type: 'table',
      dataSource: 'aco-order-data',
      config: {
        columns: [
          { id: 'product_code', label: 'Product Code', type: 'text' },
          { id: 'pallet_number', label: 'Pallet Number', type: 'text' },
          { id: 'qty', label: 'Quantity', type: 'number' },
          { id: 'qc_date', label: 'QC Date', type: 'date' },
          { id: 'required_qty', label: 'Required Qty', type: 'number' },
          { id: 'aco_order', label: 'ACO Order', type: 'text' },
        ],
      }
    }
  ],
  filters: [
    {
      id: 'acoOrder',
      label: 'ACO Order',
      type: 'select',
      required: true,
      dataSource: {
        type: 'rpc',
        name: 'getUniqueAcoOrderRefs',
      }
    }
  ],
};