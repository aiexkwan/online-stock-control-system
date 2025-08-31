/**
 * Void Pallet Report 配置
 * 使用統一報表框架，但保持現有報表格式不變
 */

import { ReportConfig } from '../core/ReportConfig';

export const voidPalletReportConfig: ReportConfig = {
  id: 'void-pallet-report',
  _name: 'Void Pallet Report',
  description: 'Report of void stock inventory',
  category: 'operational',
  formats: ['pdf', 'excel'],
  defaultFormat: 'pdf',

  // 過濾器配置
  filters: [
    {
      id: 'startDate',
      label: 'Start Date',
      type: 'date',
      required: true,
      defaultValue: new Date(new Date().setDate(new Date().getDate() - 7))
        .toISOString()
        .split('T')[0],
    },
    {
      id: 'endDate',
      label: 'End Date',
      type: 'date',
      required: true,
      defaultValue: new Date().toISOString().split('T')[0],
    },
    {
      id: 'productCode',
      label: 'Product Code',
      type: 'text',
      required: false,
      placeholder: 'Enter product code (optional)',
    },
    {
      id: 'voidReason',
      label: 'Void Reason',
      type: 'select',
      required: false,
      options: [
        { value: '', label: 'All Reasons' },
        { value: 'Damaged', label: 'Damaged' },
        { value: 'Wrong Product', label: 'Wrong Product' },
        { value: 'Expired', label: 'Expired' },
        { value: 'Quality Issue', label: 'Quality Issue' },
        { value: 'Other', label: 'Other' },
      ],
    },
    {
      id: 'operatorId',
      label: 'Operator',
      type: 'select',
      required: false,
      placeholder: 'Select operator',
      dataSource: {
        type: 'table',
        _name: 'data_id',
        params: { active: true },
      },
    },
  ],

  // 報表區段配置
  sections: [
    {
      id: 'summary',
      title: 'Summary Statistics',
      type: 'summary',
      dataSource: 'voidPalletSummary',
      config: {
        summaryFields: [
          {
            id: 'totalVoided',
            label: 'Total Pallets Voided',
            type: 'count',
          },
          {
            id: 'totalQuantity',
            label: 'Total Quantity Voided',
            type: 'sum',
            field: 'quantity',
          },
          {
            id: 'uniqueProducts',
            label: 'Unique Products',
            type: 'custom',
            customCalculation: 'countDistinct:product_code',
          },
          {
            id: 'topReason',
            label: 'Most Common Reason',
            type: 'custom',
            customCalculation: 'mode:void_reason',
          },
        ],
      },
    },
    {
      id: 'reasonBreakdown',
      title: 'Breakdown by Void Reason',
      type: 'table',
      dataSource: 'voidReasonStats',
      config: {
        columns: [
          {
            id: 'void_reason',
            label: 'Void Reason',
            type: 'text',
            width: 120,
          },
          {
            id: 'count',
            label: 'Count',
            type: 'number',
            width: 60,
            align: 'right',
          },
          {
            id: 'total_quantity',
            label: 'Total Quantity',
            type: 'number',
            width: 80,
            align: 'right',
          },
          {
            id: 'percentage',
            label: 'Percentage',
            type: 'percentage',
            width: 60,
            align: 'right',
          },
        ],
      },
    },
    {
      id: 'details',
      title: 'Void Details',
      type: 'table',
      dataSource: 'voidPalletDetails',
      config: {
        columns: [
          {
            id: 'void_date',
            label: 'Date',
            type: 'date',
            width: 80,
          },
          {
            id: 'plt_num',
            label: 'Pallet Number',
            type: 'text',
            width: 100,
          },
          {
            id: 'product_code',
            label: 'Product Code',
            type: 'text',
            width: 80,
          },
          {
            id: 'product_description',
            label: 'Description',
            type: 'text',
            width: 150,
          },
          {
            id: 'quantity',
            label: 'Quantity',
            type: 'number',
            width: 60,
            align: 'right',
          },
          {
            id: 'void_reason',
            label: 'Reason',
            type: 'text',
            width: 100,
          },
          {
            id: 'operator_name',
            label: 'Operator',
            type: 'text',
            width: 100,
          },
          {
            id: 'remark',
            label: 'Remark',
            type: 'text',
            width: 150,
            exportOnly: true, // 只在導出時顯示
          },
        ],
      },
    },
    {
      id: 'productAnalysis',
      title: 'Product Analysis',
      type: 'table',
      dataSource: 'voidProductStats',
      hideInFormats: ['csv'], // CSV 不包含此區段
      config: {
        columns: [
          {
            id: 'product_code',
            label: 'Product Code',
            type: 'text',
            width: 80,
          },
          {
            id: 'product_description',
            label: 'Description',
            type: 'text',
            width: 150,
          },
          {
            id: 'void_count',
            label: 'Times Voided',
            type: 'number',
            width: 80,
            align: 'right',
          },
          {
            id: 'total_quantity',
            label: 'Total Quantity',
            type: 'number',
            width: 80,
            align: 'right',
          },
          {
            id: 'avg_quantity',
            label: 'Avg Quantity',
            type: 'number',
            width: 80,
            align: 'right',
            format: 'decimal:2',
          },
        ],
      },
    },
  ],

  // 樣式配置 - 保持現有 PDF 格式
  styleOverrides: {
    pdf: {
      fontSize: 10,
      fontFamily: 'helvetica',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      headerHeight: 30,
      footerHeight: 20,
      // 使用舊版樣式以確保格式一致
      useLegacyStyles: true,
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
          fgColor: { rgb: '424242' },
        },
      },
      dataStyle: {
        font: { size: 10 },
      },
      summaryStyle: {
        font: { bold: true, size: 11 },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { rgb: 'E0E0E0' },
        },
      },
    },
  },
};
