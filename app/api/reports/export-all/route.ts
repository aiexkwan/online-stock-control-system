import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 創建 Excel 工作簿
    const workbook = XLSX.utils.book_new();

    // 1. 匯出產品資料
    const { data: products } = await supabase
      .from('data_product')
      .select('*')
      .order('code');
    
    if (products) {
      const productSheet = XLSX.utils.json_to_sheet(products);
      XLSX.utils.book_append_sheet(workbook, productSheet, 'Products');
    }

    // 2. 匯出棧板資料
    const { data: pallets } = await supabase
      .from('record_palletinfo')
      .select('*')
      .order('generate_time', { ascending: false })
      .limit(10000);
    
    if (pallets) {
      const palletSheet = XLSX.utils.json_to_sheet(pallets);
      XLSX.utils.book_append_sheet(workbook, palletSheet, 'Pallets');
    }

    // 3. 匯出庫存資料
    const { data: inventory } = await supabase
      .from('record_inventory')
      .select('*')
      .order('product_code');
    
    if (inventory) {
      const inventorySheet = XLSX.utils.json_to_sheet(inventory);
      XLSX.utils.book_append_sheet(workbook, inventorySheet, 'Inventory');
    }

    // 4. 匯出客戶訂單
    const { data: customerOrders } = await supabase
      .from('data_customerorder')
      .select('*')
      .order('order_date', { ascending: false });
    
    if (customerOrders) {
      const orderSheet = XLSX.utils.json_to_sheet(customerOrders);
      XLSX.utils.book_append_sheet(workbook, orderSheet, 'Customer Orders');
    }

    // 5. 匯出轉移記錄
    const { data: transfers } = await supabase
      .from('record_transfer')
      .select('*')
      .order('transfer_time', { ascending: false })
      .limit(10000);
    
    if (transfers) {
      const transferSheet = XLSX.utils.json_to_sheet(transfers);
      XLSX.utils.book_append_sheet(workbook, transferSheet, 'Transfers');
    }

    // 6. 匯出位置資料
    const { data: locations } = await supabase
      .from('data_location')
      .select('*')
      .order('code');
    
    if (locations) {
      const locationSheet = XLSX.utils.json_to_sheet(locations);
      XLSX.utils.book_append_sheet(workbook, locationSheet, 'Locations');
    }

    // 7. 創建摘要表
    const summary = [{
      'Export Date': new Date().toLocaleString(),
      'Total Products': products?.length || 0,
      'Total Pallets': pallets?.length || 0,
      'Total Inventory Items': inventory?.length || 0,
      'Total Customer Orders': customerOrders?.length || 0,
      'Total Transfers': transfers?.length || 0,
      'Total Locations': locations?.length || 0
    }];
    
    const summarySheet = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // 生成 Excel 文件
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 返回文件
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="all-data-export-${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });
  } catch (error) {
    console.error('Error exporting all data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}