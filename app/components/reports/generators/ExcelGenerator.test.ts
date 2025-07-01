/**
 * ExcelGenerator 測試文件
 * 用於驗證從 xlsx 到 ExcelJS 遷移嘅正確性
 */

import { ExcelGenerator } from './ExcelGenerator';
import { ProcessedReportData, ReportConfig } from '../core/ReportConfig';

// 測試數據
export const testData: ProcessedReportData = {
  summary: {
    totalRecords: 100,
    totalValue: 50000,
    averageValue: 500
  },
  sections: {
    'inventory': [
      { id: 1, product: 'Product A', quantity: 50, value: 1000 },
      { id: 2, product: 'Product B', quantity: 30, value: 750 },
      { id: 3, product: 'Product C', quantity: 20, value: 500 }
    ],
    'orders': [
      { orderId: 'ORD-001', customer: 'Customer A', amount: 2500, date: '2025-01-01' },
      { orderId: 'ORD-002', customer: 'Customer B', amount: 1800, date: '2025-01-02' }
    ]
  },
  metadata: {
    generatedAt: new Date().toISOString(),
    recordCount: 5,
    filters: {
      dateFrom: '2025-01-01',
      dateTo: '2025-01-31'
    }
  }
};

export const testConfig: ReportConfig = {
  id: 'test-report',
  name: 'Test Report',
  description: 'Test report for Excel generation',
  category: 'inventory',
  formats: ['excel'],
  defaultFormat: 'excel',
  sections: [
    {
      id: 'summary',
      title: 'Summary',
      type: 'summary',
      dataSource: 'summary',
      config: {
        summaryFields: [
          { id: 'totalRecords', label: 'Total Records', type: 'count', format: 'number' },
          { id: 'totalValue', label: 'Total Value', type: 'sum', format: 'currency' },
          { id: 'averageValue', label: 'Average Value', type: 'average', format: 'decimal:2' }
        ]
      }
    },
    {
      id: 'inventory',
      title: 'Inventory Report',
      type: 'table',
      dataSource: 'inventory',
      config: {
        columns: [
          { id: 'id', label: 'ID', type: 'number', width: 50 },
          { id: 'product', label: 'Product Name', type: 'text', width: 150 },
          { id: 'quantity', label: 'Quantity', type: 'number', width: 80 },
          { id: 'value', label: 'Value', type: 'currency', width: 100 }
        ]
      }
    },
    {
      id: 'orders',
      title: 'Order Report',
      type: 'table',
      dataSource: 'orders',
      config: {
        columns: [
          { id: 'orderId', label: 'Order ID', type: 'text', width: 100 },
          { id: 'customer', label: 'Customer', type: 'text', width: 150 },
          { id: 'amount', label: 'Amount', type: 'currency', width: 100 },
          { id: 'date', label: 'Date', type: 'date', width: 100 }
        ]
      }
    }
  ],
  filters: [
    { id: 'dateFrom', label: 'From Date', type: 'date', required: false },
    { id: 'dateTo', label: 'To Date', type: 'date', required: false }
  ],
  permissions: ['admin']
};

// 測試函數
export async function testExcelGeneration() {
  const generator = new ExcelGenerator();
  
  try {
    console.log('開始生成測試報表...');
    const blob = await generator.generate(testData, testConfig);
    
    console.log('報表生成成功！');
    console.log(`文件大小: ${blob.size} bytes`);
    console.log(`文件類型: ${blob.type}`);
    
    // 保存到文件進行驗證
    if (typeof window !== 'undefined') {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test-report.xlsx';
      a.click();
    }
    
    return true;
  } catch (error) {
    console.error('生成報表時出錯:', error);
    return false;
  }
}