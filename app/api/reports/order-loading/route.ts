import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 查詢訂單裝載記錄
    const { data, error } = await supabase
      .from('record_customerorder_palletinfo')
      .select(`
        *,
        data_customerorder (
          customer_order_num,
          customer_name,
          order_date,
          delivery_date
        )
      `)
      .order('loading_time', { ascending: false });

    if (error) {
      throw error;
    }

    // 創建 Excel 工作簿
    const workbook = XLSX.utils.book_new();
    
    // 準備數據
    const worksheetData = data?.map(record => ({
      'Order Number': record.customer_order_num,
      'Customer Name': record.data_customerorder?.customer_name || '',
      'Pallet Number': record.plt_num,
      'Product Code': record.product_code,
      'Product Description': record.product_des,
      'Quantity': record.qty,
      'Loading Time': record.loading_time ? new Date(record.loading_time).toLocaleString() : '',
      'Loading Status': record.status || 'Pending',
      'Loaded By': record.loaded_by || '',
      'Order Date': record.data_customerorder?.order_date ? new Date(record.data_customerorder.order_date).toLocaleDateString() : '',
      'Delivery Date': record.data_customerorder?.delivery_date ? new Date(record.data_customerorder.delivery_date).toLocaleDateString() : ''
    })) || [];

    // 創建工作表
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // 設置列寬
    const columnWidths = [
      { wch: 15 }, // Order Number
      { wch: 25 }, // Customer Name
      { wch: 15 }, // Pallet Number
      { wch: 15 }, // Product Code
      { wch: 30 }, // Product Description
      { wch: 10 }, // Quantity
      { wch: 20 }, // Loading Time
      { wch: 15 }, // Loading Status
      { wch: 15 }, // Loaded By
      { wch: 15 }, // Order Date
      { wch: 15 }  // Delivery Date
    ];
    worksheet['!cols'] = columnWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Order Loading Report');

    // 生成 Excel 文件
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 返回文件
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="order-loading-report-${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });
  } catch (error) {
    console.error('Error generating order loading report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}