/**
 * Stock Take Report 配置
 * 遷移自現有的 stock-take/report 頁面
 */

import { ReportConfig } from '../core/ReportConfig';

export const stockTakeReportConfig: ReportConfig = {
  id: 'stock-take-report',
  _name: 'Stock Take Report',
  description: 'Stock Take Report',
  category: 'operational',
  formats: ['csv', 'pdf', 'excel'], // 新增 PDF 和 Excel 支援
  defaultFormat: 'csv', // 保持 CSV 為默認格式

  // 過濾器配置
  filters: [
    {
      id: 'stockTakeDate',
      label: 'Stock Take Date',
      type: 'date',
      required: true,
      defaultValue: new Date().toISOString().split('T')[0],
    },
    {
      id: 'minVariance',
      label: 'Min Variance %',
      type: 'number',
      required: false,
      placeholder: 'Show items with variance % above',
      validation: {
        min: 0,
        max: 100,
        message: 'Variance must be between 0 and 100',
      },
    },
    {
      id: 'productCode',
      label: 'Product Code',
      type: 'text',
      required: false,
      placeholder: 'Filter by product code',
    },
    {
      id: 'countStatus',
      label: 'Count Status',
      type: 'select',
      required: false,
      options: [
        { value: '', label: 'All Items' },
        { value: 'counted', label: 'Counted Only' },
        { value: 'not_counted', label: 'Not Counted Only' },
        { value: 'high_variance', label: 'High Variance (>10%)' },
      ],
    },
  ],

  // 報表區段配置
  sections: [
    {
      id: 'summary',
      title: 'Stock Take Summary',
      type: 'summary',
      dataSource: 'stockTakeSummary',
      config: {
        summaryFields: [
          {
            id: 'totalProducts',
            label: 'Total Products',
            type: 'count',
          },
          {
            id: 'countedProducts',
            label: 'Products Counted',
            type: 'custom',
            customCalculation: 'countedProducts',
          },
          {
            id: 'completionRate',
            label: 'Completion Rate',
            type: 'custom',
            customCalculation: 'completionPercentage',
            format: 'percentage',
          },
          {
            id: 'totalVariance',
            label: 'Total Variance',
            type: 'sum',
            field: 'variance',
          },
          {
            id: 'highVarianceCount',
            label: 'High Variance Items',
            type: 'custom',
            customCalculation: 'highVarianceCount',
          },
        ],
      },
    },
    {
      id: 'details',
      title: 'Stock Count Details',
      type: 'table',
      dataSource: 'stockTakeDetails',
      config: {
        columns: [
          {
            id: 'product_code',
            label: 'Product Code',
            type: 'text',
            width: 100,
          },
          {
            id: 'description',
            label: 'Description',
            type: 'text',
            width: 200,
          },
          {
            id: 'system_stock',
            label: 'System Stock',
            type: 'number',
            width: 80,
            align: 'right',
          },
          {
            id: 'counted_qty',
            label: 'Counted Qty',
            type: 'number',
            width: 80,
            align: 'right',
          },
          {
            id: 'variance',
            label: 'Variance',
            type: 'number',
            width: 70,
            align: 'right',
          },
          {
            id: 'variance_percentage',
            label: 'Variance %',
            type: 'percentage',
            width: 80,
            align: 'right',
            format: 'decimal:1',
          },
          {
            id: 'pallet_count',
            label: 'Pallets',
            type: 'number',
            width: 60,
            align: 'right',
          },
          {
            id: 'status',
            label: 'Status',
            type: 'text',
            width: 80,
          },
          {
            id: 'last_updated',
            label: 'Last Updated',
            type: 'date',
            format: 'datetime',
            width: 120,
            exportOnly: true, // 只在導出時顯示
          },
        ],
      },
    },
    {
      id: 'notCountedItems',
      title: 'Items Not Counted',
      type: 'table',
      dataSource: 'notCountedItems',
      hideInFormats: ['csv'], // CSV 不包含此區段以保持向後兼容
      config: {
        columns: [
          {
            id: 'product_code',
            label: 'Product Code',
            type: 'text',
            width: 100,
          },
          {
            id: 'description',
            label: 'Description',
            type: 'text',
            width: 250,
          },
          {
            id: 'system_stock',
            label: 'System Stock',
            type: 'number',
            width: 100,
            align: 'right',
          },
        ],
      },
    },
  ],

  // 樣式配置
  styleOverrides: {
    pdf: {
      fontSize: 10,
      fontFamily: 'helvetica',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      headerHeight: 30,
      footerHeight: 20,
    },
    excel: {
      headerStyle: {
        font: {
          bold: true,
          size: 12,
          color: { rgb: 'FFFFFF' },
        },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { rgb: '1E3A8A' },
        }, // 深藍色
      },
      dataStyle: {
        font: { size: 10 },
      },
      summaryStyle: {
        font: { bold: true, size: 11 },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { rgb: 'DBEAFE' },
        }, // 淺藍色
      },
    },
  },
};
