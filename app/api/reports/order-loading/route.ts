import { NextRequest, NextResponse } from 'next/server';
import { LoadingDetailsDataSource } from '@/app/components/reports/dataSources/OrderLoadingDataSource';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export async function POST(request: NextRequest) {
  try {
    // 解析請求參數
    const body = await request.json();
    
    // 使用新的 DataSource 架構
    const dataSource = new LoadingDetailsDataSource();
    const filters = {
      dateRange: `${body.startDate}|${body.endDate}`,
      orderNumber: body.orderRef,
      productCode: body.productCode,
      userId: body.actionBy
    };
    
    // 獲取報表數據
    const rawData = await dataSource.fetch(filters);
    const records = dataSource.transform(rawData);
    
    // 生成報表
    const format = body.format || 'excel';
    let blob: Blob;
    let contentType: string;
    let extension: string;
    
    if (format === 'pdf') {
      // 生成 PDF
      const doc = new jsPDF();
      doc.text('Order Loading Report', 14, 15);
      doc.text(`Period: ${body.startDate} to ${body.endDate}`, 14, 25);
      
      (doc as any).autoTable({
        head: [['Timestamp', 'Order', 'Product', 'Qty', 'User', 'Action']],
        body: records.map(r => [
          new Date(r.timestamp).toLocaleString(),
          r.order_number,
          r.product_code,
          r.loaded_qty,
          r.user_name,
          r.action
        ]),
        startY: 35
      });
      
      blob = doc.output('blob');
      contentType = 'application/pdf';
      extension = 'pdf';
    } else {
      // 生成 Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Loading Report');
      
      worksheet.columns = [
        { header: 'Timestamp', key: 'timestamp', width: 20 },
        { header: 'Order Number', key: 'order_number', width: 15 },
        { header: 'Product Code', key: 'product_code', width: 15 },
        { header: 'Loaded Qty', key: 'loaded_qty', width: 12 },
        { header: 'User', key: 'user_name', width: 20 },
        { header: 'Action', key: 'action', width: 10 }
      ];
      
      worksheet.addRows(records);
      
      const buffer = await workbook.xlsx.writeBuffer();
      blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = 'xlsx';
    }
    
    // 轉換 Blob 為 Buffer
    const buffer = Buffer.from(await blob.arrayBuffer());
    
    // 返回文件
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="order-loading-report-${new Date().toISOString().split('T')[0]}.${extension}"`
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