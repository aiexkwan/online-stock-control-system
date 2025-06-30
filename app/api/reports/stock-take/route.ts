import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import * as XLSX from 'xlsx';

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
    const workbook = XLSX.utils.book_new();
    
    // 準備數據
    const worksheetData = data?.map(record => ({
      'Stocktake Date': record.stocktake_date ? new Date(record.stocktake_date).toLocaleDateString() : '',
      'Location': record.location || '',
      'Product Code': record.product_code,
      'Product Description': record.product_des,
      'Expected Quantity': record.expected_qty || 0,
      'Actual Quantity': record.actual_qty || 0,
      'Variance': (record.actual_qty || 0) - (record.expected_qty || 0),
      'Variance %': record.expected_qty ? (((record.actual_qty || 0) - (record.expected_qty || 0)) / record.expected_qty * 100).toFixed(2) + '%' : 'N/A',
      'Status': record.status || 'Pending',
      'Counted By': record.counted_by || '',
      'Verified By': record.verified_by || '',
      'Notes': record.notes || ''
    })) || [];

    // 創建工作表
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // 設置列寬
    const columnWidths = [
      { wch: 15 }, // Stocktake Date
      { wch: 15 }, // Location
      { wch: 15 }, // Product Code
      { wch: 30 }, // Product Description
      { wch: 15 }, // Expected Quantity
      { wch: 15 }, // Actual Quantity
      { wch: 10 }, // Variance
      { wch: 12 }, // Variance %
      { wch: 12 }, // Status
      { wch: 15 }, // Counted By
      { wch: 15 }, // Verified By
      { wch: 30 }  // Notes
    ];
    worksheet['!cols'] = columnWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Take Report');

    // 生成 Excel 文件
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 返回文件
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="stock-take-report-${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });
  } catch (error) {
    console.error('Error generating stock take report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}