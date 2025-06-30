import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
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

    // 創建 Excel 工作簿
    const workbook = XLSX.utils.book_new();
    
    // 準備數據
    const worksheetData = data?.map(pallet => ({
      'Pallet Number': pallet.plt_num,
      'Product Code': pallet.product_code,
      'Product Description': pallet.product_des,
      'Quantity': pallet.qty,
      'Void Time': pallet.void_time ? new Date(pallet.void_time).toLocaleString() : '',
      'Void Reason': pallet.void_reason || '',
      'Voided By': pallet.void_by || '',
      'Original Generate Time': pallet.generate_time ? new Date(pallet.generate_time).toLocaleString() : '',
      'Location': pallet.loc || '',
      'Remark': pallet.plt_remark || ''
    })) || [];

    // 創建工作表
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // 設置列寬
    const columnWidths = [
      { wch: 15 }, // Pallet Number
      { wch: 15 }, // Product Code
      { wch: 30 }, // Product Description
      { wch: 10 }, // Quantity
      { wch: 20 }, // Void Time
      { wch: 20 }, // Void Reason
      { wch: 15 }, // Voided By
      { wch: 20 }, // Original Generate Time
      { wch: 15 }, // Location
      { wch: 30 }  // Remark
    ];
    worksheet['!cols'] = columnWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Void Pallet Report');

    // 生成 Excel 文件
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 返回文件
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="void-pallet-report-${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });
  } catch (error) {
    console.error('Error generating void pallet report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}