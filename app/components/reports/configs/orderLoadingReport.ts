/**
 * Order Loading Report 配置
 * 使用統一報表框架，保持現有報表格式不變
 */

import { ReportConfig } from '../core/ReportConfig';

export const orderLoadingReportConfig: ReportConfig = {
  id: 'order-loading-report',
  name: 'Order Loading Report',
  description: 'Report of loading for orders',
  category: 'operational',
  formats: ['pdf', 'excel'],
  defaultFormat: 'pdf',

  // 過濾器配置
  filters: [
    {
      id: 'dateRange',
      label: 'Date Range',
      type: 'dateRange',
      required: true,
      defaultValue: (() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return `${start.toISOString().split('T')[0]}|${end.toISOString().split('T')[0]}`;
      })(),
    },
    {
      id: 'orderNumber',
      label: 'Order Number',
      type: 'text',
      required: false,
      placeholder: 'Enter order number (optional)',
    },
    {
      id: 'productCode',
      label: 'Product Code',
      type: 'text',
      required: false,
      placeholder: 'Enter product code (optional)',
    },
    {
      id: 'userId',
      label: 'User',
      type: 'select',
      required: false,
      placeholder: 'Select user',
      dataSource: {
        type: 'table',
        name: 'data_id',
        params: { role: 'operator' },
      },
    },
    {
      id: 'status',
      label: 'Loading Status',
      type: 'select',
      required: false,
      options: [
        { value: '', label: 'All Status' },
        { value: 'completed', label: 'Completed' },
        { value: 'partial', label: 'Partial' },
        { value: 'pending', label: 'Pending' },
      ],
    },
  ],

  // 報表區段配置
  sections: [
    {
      id: 'summary',
      title: 'Loading Summary',
      type: 'summary',
      dataSource: 'orderLoadingSummary',
      config: {
        summaryFields: [
          {
            id: 'totalOrders',
            label: 'Total Orders',
            type: 'count',
          },
          {
            id: 'completedOrders',
            label: 'Completed Orders',
            type: 'custom',
            customCalculation: 'countWhere:status=completed',
          },
          {
            id: 'totalItemsLoaded',
            label: 'Total Items Loaded',
            type: 'sum',
            field: 'loaded_qty',
          },
          {
            id: 'avgCompletionRate',
            label: 'Average Completion Rate',
            type: 'custom',
            customCalculation: 'avgCompletionRate',
          },
        ],
      },
    },
    {
      id: 'orderProgress',
      title: 'Order Progress',
      type: 'table',
      dataSource: 'orderProgress',
      config: {
        columns: [
          {
            id: 'order_number',
            label: 'Order #',
            type: 'text',
            width: 80,
          },
          {
            id: 'order_date',
            label: 'Order Date',
            type: 'date',
            width: 80,
          },
          {
            id: 'total_items',
            label: 'Total Items',
            type: 'number',
            width: 60,
            align: 'right',
          },
          {
            id: 'loaded_items',
            label: 'Loaded',
            type: 'number',
            width: 60,
            align: 'right',
          },
          {
            id: 'completion_rate',
            label: 'Completion',
            type: 'percentage',
            width: 70,
            align: 'right',
          },
          {
            id: 'status',
            label: 'Status',
            type: 'text',
            width: 70,
          },
        ],
      },
    },
    {
      id: 'loadingDetails',
      title: 'Loading Details',
      type: 'table',
      dataSource: 'loadingDetails',
      config: {
        columns: [
          {
            id: 'timestamp',
            label: 'Date/Time',
            type: 'date',
            format: 'datetime',
            width: 100,
          },
          {
            id: 'order_number',
            label: 'Order #',
            type: 'text',
            width: 80,
          },
          {
            id: 'product_code',
            label: 'Product',
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
            id: 'loaded_qty',
            label: 'Loaded Qty',
            type: 'number',
            width: 70,
            align: 'right',
          },
          {
            id: 'user_name',
            label: 'User',
            type: 'text',
            width: 100,
          },
          {
            id: 'action',
            label: 'Action',
            type: 'text',
            width: 80,
          },
        ],
      },
    },
    {
      id: 'userPerformance',
      title: 'User Performance',
      type: 'table',
      dataSource: 'userPerformance',
      hideInFormats: ['csv'],
      config: {
        columns: [
          {
            id: 'user_id',
            label: 'User ID',
            type: 'text',
            width: 60,
          },
          {
            id: 'user_name',
            label: 'User Name',
            type: 'text',
            width: 120,
          },
          {
            id: 'total_loads',
            label: 'Total Loads',
            type: 'number',
            width: 80,
            align: 'right',
          },
          {
            id: 'total_quantity',
            label: 'Total Quantity',
            type: 'number',
            width: 90,
            align: 'right',
          },
          {
            id: 'avg_load_time',
            label: 'Avg Load Time',
            type: 'text',
            width: 90,
            align: 'right',
          },
        ],
      },
    },
  ],

  // 樣式配置 - 保持現有格式
  styleOverrides: {
    pdf: {
      fontSize: 10,
      fontFamily: 'helvetica',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      headerHeight: 35,
      footerHeight: 20,
      // 使用舊版樣式以確保格式一致
      useLegacyStyles: true,
    },
    excel: {
      headerStyle: {
        font: { bold: true, size: 12 },
        fill: { fgColor: { rgb: '4A5568' } },
        font_color: { rgb: 'FFFFFF' },
      },
      dataStyle: {
        font: { size: 10 },
      },
      summaryStyle: {
        font: { bold: true, size: 11 },
        fill: { fgColor: { rgb: 'E2E8F0' } },
      },
    },
  },
};
