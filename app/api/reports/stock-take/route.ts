import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';


export async function POST(request: NextRequest) {
  try {
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
    data?.forEach(record => {
      const variance = (record.actual_qty || 0) - (record.expected_qty || 0);
      const variancePct = record.expected_qty
        ? (variance / record.expected_qty * 100).toFixed(2) + '%'
        : 'N/A';

      const row = worksheet.addRow({
        stocktake_date: record.stocktake_date
          ? new Date(record.stocktake_date).toLocaleDateString()
          : '',
        location: record.location || '',
        product_code: record.product_code,
        product_des: record.product_des,
        expected_qty: record.expected_qty || 0,
        actual_qty: record.actual_qty || 0,
        variance: variance,
        variance_pct: variancePct,
        status: record.status || 'Pending',
        counted_by: record.counted_by || '',
        verified_by: record.verified_by || '',
        notes: record.notes || '',
      });

      // 高亮顯示差異行
      if (variance !== 0) {
        row.getCell('variance').font = { color: { argb: variance > 0 ? 'FF008000' : 'FFFF0000' } };
        row.getCell('variance_pct').font = { color: { argb: variance > 0 ? 'FF008000' : 'FFFF0000' } };
      }
    });

    // 添加邊框
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
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

    // 返回文件
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="stock-take-report-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error generating stock take report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
