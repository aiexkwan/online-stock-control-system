/**
 * Transaction Report Configuration
 */

import { ReportConfig } from '../core/ReportConfig';

export const transactionReportConfig: ReportConfig = {
  id: 'transaction-report',
  name: 'Transaction Report',
  description: 'Export transfer reports with date range',
  category: 'operational',
  formats: ['excel'],
  sections: [
    {
      id: 'transaction-data',
      title: 'Transaction Data',
      dataSource: 'transaction-data',
      columns: [
        { key: 'transfer_date', label: 'Transfer Date', type: 'date' },
        { key: 'pallet_number', label: 'Pallet Number', type: 'string' },
        { key: 'product_code', label: 'Product Code', type: 'string' },
        { key: 'quantity', label: 'Quantity', type: 'number' },
        { key: 'from_location', label: 'From Location', type: 'string' },
        { key: 'to_location', label: 'To Location', type: 'string' },
        { key: 'operator', label: 'Operator', type: 'string' },
        { key: 'transfer_type', label: 'Transfer Type', type: 'string' },
      ],
      enableSorting: true,
      enableFiltering: true,
    }
  ],
  parameters: [
    {
      id: 'startDate',
      label: 'Start Date',
      type: 'date',
      required: true,
    },
    {
      id: 'endDate',
      label: 'End Date',
      type: 'date',
      required: true,
    }
  ],
};