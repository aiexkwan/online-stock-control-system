import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { ApiResult, successResult, errorResult, handleAsync } from '@/lib/types/api';

interface StockTakeRecord {
  created_at: string | number;
  plt_num: string;
  product_code: string;
  product_desc: string;
  remain_qty: number;
  counted_qty: number;
  counted_name: string;
}

interface StockTakeRowData {
  stocktake_date: string;
  location: string;
  product_code: string;
  product_desc: string;
  expected_qty: number;
  actual_qty: number;
  variance: number;
  variance_pct: string;
  status: string;
  counted_by: string;
  verified_by: string;
  notes: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  const result = await handleAsync(async (): Promise<ArrayBuffer> => {
    const supabase = await createClient();

    // 查詢盤點記錄
    const { data, error } = await supabase
      .from('record_stocktake')
      .select('*')
      .order('stocktake_date', { ascending: false });

    if (error) {
      throw error;
    }

    // 創建 Excel 工作簿
    // Dynamic import ExcelJS
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stock Take Report');

    // 定義列
    worksheet.columns = [
      { header: 'Stocktake Date', key: 'stocktake_date', width: 15 },
      { header: 'Location', key: 'location', width: 15 },
      { header: 'Product Code', key: 'product_code', width: 15 },
      { header: 'Product Description', key: 'product_des', width: 30 },
      { header: 'Expected Quantity', key: 'expected_qty', width: 15 },
      { header: 'Actual Quantity', key: 'actual_qty', width: 15 },
      { header: 'Variance', key: 'variance', width: 10 },
      { header: 'Variance %', key: 'variance_pct', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Counted By', key: 'counted_by', width: 15 },
      { header: 'Verified By', key: 'verified_by', width: 15 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];

    // 設置標題行樣式
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // 添加數據
    data?.forEach((record: Record<string, unknown>) => {
      const typedRecord = record as unknown as StockTakeRecord;
      const countedQty = typeof typedRecord.counted_qty === 'number' ? typedRecord.counted_qty : 0;
      const remainQty = typeof typedRecord.remain_qty === 'number' ? typedRecord.remain_qty : 0;
      const variance = countedQty - remainQty;
      const variancePct = remainQty ? ((variance / remainQty) * 100).toFixed(2) + '%' : 'N/A';

      const rowData: StockTakeRowData = {
        stocktake_date:
          typedRecord.created_at &&
          (typeof typedRecord.created_at === 'string' || typeof typedRecord.created_at === 'number')
            ? new Date(typedRecord.created_at).toLocaleDateString()
            : '',
        location: typedRecord.plt_num || '',
        product_code: typedRecord.product_code,
        product_desc: typedRecord.product_desc,
        expected_qty: typedRecord.remain_qty || 0,
        actual_qty: typedRecord.counted_qty || 0,
        variance: variance,
        variance_pct: variancePct,
        status: 'Completed',
        counted_by: typedRecord.counted_name || '',
        verified_by: '',
        notes: '',
      };

      const row = worksheet.addRow(rowData);

      // 高亮顯示差異行
      if (variance !== 0) {
        row.getCell('variance').font = { color: { argb: variance > 0 ? 'FF008000' : 'FFFF0000' } };
        row.getCell('variance_pct').font = {
          color: { argb: variance > 0 ? 'FF008000' : 'FFFF0000' },
        };
      }
    });

    // 添加邊框
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: false }, cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // 生成 Excel 文件
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }, 'Failed to generate stock take report');

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  // 返回文件
  return new NextResponse(result.data, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="stock-take-report-${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}
