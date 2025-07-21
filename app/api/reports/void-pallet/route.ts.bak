import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();

    // 查詢作廢棧板記錄
    const { data, error } = await supabase
      .from('record_palletinfo')
      .select('*')
      .eq('is_voided', true)
      .order('void_time', { ascending: false });

    if (error) {
      throw error;
    }

    // Dynamic import ExcelJS
    const ExcelJS = await import('exceljs');

    // 創建 Excel 工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Void Pallet Report');

    // 定義列
    worksheet.columns = [
      { header: 'Pallet Number', key: 'plt_num', width: 15 },
      { header: 'Product Code', key: 'product_code', width: 15 },
      { header: 'Product Description', key: 'product_des', width: 30 },
      { header: 'Quantity', key: 'qty', width: 10 },
      { header: 'Void Time', key: 'void_time', width: 20 },
      { header: 'Void Reason', key: 'void_reason', width: 20 },
      { header: 'Voided By', key: 'void_by', width: 15 },
      { header: 'Original Generate Time', key: 'generate_time', width: 20 },
      { header: 'Location', key: 'loc', width: 15 },
      { header: 'Remark', key: 'plt_remark', width: 30 },
    ];

    // 設置標題行樣式
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // 添加數據
    data?.forEach(pallet => {
      worksheet.addRow({
        plt_num: pallet.plt_num,
        product_code: pallet.product_code,
        product_des: '', // Field not available in current schema
        qty: pallet.product_qty || 0,
        void_time: '', // Field not available
        void_reason: '', // Field not available
        void_by: '', // Field not available
        generate_time: pallet.generate_time ? new Date(pallet.generate_time).toLocaleString() : '',
        loc: '', // Field not available
        plt_remark: pallet.plt_remark || '',
      });
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

    // 返回文件
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="void-pallet-report-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error generating void pallet report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
