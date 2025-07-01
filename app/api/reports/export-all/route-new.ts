import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import ExcelJS from 'exceljs';
import { 
  jsonToWorksheet, 
  setHeaderStyle, 
  addBorders, 
  autoFitColumns 
} from '@/lib/utils/exceljs-migration-helper';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 創建 Excel 工作簿
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NewPennine WMS';
    workbook.created = new Date();
    workbook.modified = new Date();

    // 1. 匯出產品資料
    const { data: products } = await supabase
      .from('data_product')
      .select('*')
      .order('code');
    
    if (products && products.length > 0) {
      const worksheet = await jsonToWorksheet(workbook, products, 'Products');
      setHeaderStyle(worksheet, { bold: true, bgColor: 'FFE0E0E0' });
      autoFitColumns(worksheet);
      addBorders(worksheet, 1, 1, worksheet.rowCount, worksheet.columnCount);
    }

    // 2. 匯出棧板資料
    const { data: pallets } = await supabase
      .from('record_palletinfo')
      .select('*')
      .order('generate_time', { ascending: false })
      .limit(10000);
    
    if (pallets && pallets.length > 0) {
      const worksheet = await jsonToWorksheet(workbook, pallets, 'Pallets');
      setHeaderStyle(worksheet, { bold: true, bgColor: 'FFE0E0E0' });
      autoFitColumns(worksheet);
      addBorders(worksheet, 1, 1, worksheet.rowCount, worksheet.columnCount);
    }

    // 3. 匯出庫存資料
    const { data: inventory } = await supabase
      .from('record_inventory')
      .select('*')
      .order('product_code');
    
    if (inventory && inventory.length > 0) {
      const worksheet = await jsonToWorksheet(workbook, inventory, 'Inventory');
      setHeaderStyle(worksheet, { bold: true, bgColor: 'FFE0E0E0' });
      autoFitColumns(worksheet);
      addBorders(worksheet, 1, 1, worksheet.rowCount, worksheet.columnCount);
    }

    // 4. 匯出客戶訂單
    const { data: customerOrders } = await supabase
      .from('data_customerorder')
      .select('*')
      .order('order_date', { ascending: false });
    
    if (customerOrders && customerOrders.length > 0) {
      const worksheet = await jsonToWorksheet(workbook, customerOrders, 'Customer Orders');
      setHeaderStyle(worksheet, { bold: true, bgColor: 'FFE0E0E0' });
      autoFitColumns(worksheet);
      addBorders(worksheet, 1, 1, worksheet.rowCount, worksheet.columnCount);
    }

    // 5. 匯出轉移記錄
    const { data: transfers } = await supabase
      .from('record_transfer')
      .select('*')
      .order('transfer_time', { ascending: false })
      .limit(10000);
    
    if (transfers && transfers.length > 0) {
      const worksheet = await jsonToWorksheet(workbook, transfers, 'Transfers');
      setHeaderStyle(worksheet, { bold: true, bgColor: 'FFE0E0E0' });
      autoFitColumns(worksheet);
      addBorders(worksheet, 1, 1, worksheet.rowCount, worksheet.columnCount);
    }

    // 6. 匯出位置資料
    const { data: locations } = await supabase
      .from('data_location')
      .select('*')
      .order('code');
    
    if (locations && locations.length > 0) {
      const worksheet = await jsonToWorksheet(workbook, locations, 'Locations');
      setHeaderStyle(worksheet, { bold: true, bgColor: 'FFE0E0E0' });
      autoFitColumns(worksheet);
      addBorders(worksheet, 1, 1, worksheet.rowCount, worksheet.columnCount);
    }

    // 7. 創建摘要表 - 使用更豐富嘅格式
    const summarySheet = workbook.addWorksheet('Summary');
    
    // 標題
    const titleRow = summarySheet.addRow(['Data Export Summary']);
    titleRow.font = { size: 18, bold: true, color: { argb: 'FF0066CC' } };
    titleRow.height = 35;
    summarySheet.mergeCells('A1:B1');
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F8FF' }
    };
    
    // 導出時間
    summarySheet.addRow([]);
    const dateRow = summarySheet.addRow(['Export Date & Time', new Date().toLocaleString()]);
    dateRow.font = { size: 12 };
    dateRow.getCell(1).font = { bold: true };
    
    summarySheet.addRow([]);
    
    // 統計標題
    const statsHeaderRow = summarySheet.addRow(['Data Type', 'Record Count']);
    statsHeaderRow.font = { bold: true, size: 12 };
    statsHeaderRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // 添加統計數據
    const stats = [
      ['Products', products?.length || 0],
      ['Pallets', pallets?.length || 0],
      ['Inventory Items', inventory?.length || 0],
      ['Customer Orders', customerOrders?.length || 0],
      ['Transfers', transfers?.length || 0],
      ['Locations', locations?.length || 0]
    ];
    
    let totalRecords = 0;
    stats.forEach(([type, count]) => {
      const row = summarySheet.addRow([type, count]);
      row.getCell(2).alignment = { horizontal: 'right' };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      totalRecords += count as number;
    });
    
    // 總計行
    const totalRow = summarySheet.addRow(['Total Records', totalRecords]);
    totalRow.font = { bold: true };
    totalRow.getCell(2).alignment = { horizontal: 'right' };
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
      cell.border = {
        top: { style: 'double' },
        left: { style: 'thin' },
        bottom: { style: 'double' },
        right: { style: 'thin' }
      };
    });
    
    // 設置列寬
    summarySheet.columns = [
      { width: 25 },
      { width: 15 }
    ];

    // 生成 Excel 文件
    const buffer = await workbook.xlsx.writeBuffer();

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