import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 查詢交易記錄，連同棧板資料
    const { data, error } = await supabase
      .from('record_transfer')
      .select(`
        *,
        record_palletinfo!plt_num (
          product_code,
          product_qty,
          series,
          plt_remark
        ),
        data_id!operator_id (
          name,
          department,
          position
        )
      `)
      .order('tran_date', { ascending: false });

    if (error) {
      throw error;
    }

    // 創建 Excel 工作簿
    const workbook = XLSX.utils.book_new();
    
    // 準備數據
    const worksheetData = data?.map(transaction => ({
      'Transaction ID': transaction.uuid,
      'Pallet Number': transaction.plt_num,
      'Product Code': transaction.record_palletinfo?.product_code || '',
      'Series': transaction.record_palletinfo?.series || '',
      'Quantity': transaction.record_palletinfo?.product_qty || 0,
      'From Location': transaction.f_loc || '',
      'To Location': transaction.t_loc || '',
      'Transfer Time': transaction.tran_date ? new Date(transaction.tran_date).toLocaleString() : '',
      'Operator': transaction.data_id?.name || `ID: ${transaction.operator_id}`,
      'Department': transaction.data_id?.department || '',
      'Position': transaction.data_id?.position || '',
      'Remarks': transaction.record_palletinfo?.plt_remark || ''
    })) || [];

    // 創建工作表
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // 設置列寬
    const columnWidths = [
      { wch: 35 }, // Transaction ID (UUID)
      { wch: 15 }, // Pallet Number
      { wch: 15 }, // Product Code
      { wch: 15 }, // Series
      { wch: 10 }, // Quantity
      { wch: 15 }, // From Location
      { wch: 15 }, // To Location
      { wch: 20 }, // Transfer Time
      { wch: 15 }, // Operator
      { wch: 15 }, // Department
      { wch: 15 }, // Position
      { wch: 30 }  // Remarks
    ];
    worksheet['!cols'] = columnWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaction Report');

    // 生成 Excel 文件
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 返回文件
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="transaction-report-${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });
  } catch (error) {
    console.error('Error generating transaction report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}