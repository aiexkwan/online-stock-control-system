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
  defaultFormat: 'excel',
  sections: [
    {
      id: 'transaction-data',
      title: 'Transaction Data',
      type: 'table',
      dataSource: 'transaction-data',
      config: {
        columns: [
          { id: 'transfer_date', label: 'Transfer Date', type: 'date' },
          { id: 'pallet_number', label: 'Pallet Number', type: 'text' },
          { id: 'product_code', label: 'Product Code', type: 'text' },
          { id: 'quantity', label: 'Quantity', type: 'number' },
          { id: 'from_location', label: 'From Location', type: 'text' },
          { id: 'to_location', label: 'To Location', type: 'text' },
          { id: 'operator', label: 'Operator', type: 'text' },
          { id: 'transfer_type', label: 'Transfer Type', type: 'text' },
        ],
      }
    }
  ],
  filters: [
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