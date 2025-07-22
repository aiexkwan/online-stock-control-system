import { NextRequest, NextResponse } from 'next/server';
import { orderLoadingDataSources } from '@/app/components/reports/dataSources/OrderLoadingDataSource';
import { safeGet, safeString, safeNumber, toRecordArray } from '@/types/database/helpers';
import { createJsPDF } from '@/lib/services/unified-pdf-service';
import { ApiResult, successResult, errorResult, handleAsync } from '@/lib/types/api';

interface OrderLoadingReportRequest {
  startDate: string;
  endDate: string;
  orderRef?: string;
  productCode?: string;
  actionBy?: string;
  format: 'excel' | 'pdf';
}

interface LoadingRecord {
  timestamp: string;
  order_number: string;
  product_code: string;
  loaded_qty: number;
  user_name: string;
  action: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  // 解析請求參數
  const body: OrderLoadingReportRequest = await request.json();

  const result = await handleAsync(async (): Promise<ArrayBuffer> => {

    // 使用新的 DataSource 架構
    const dataSource = orderLoadingDataSources.get('loading-details');
    if (!dataSource) {
      throw new Error('Loading details data source not found');
    }

    const filters: Record<string, string | number | boolean | Date | string[]> = {
      dateRange: `${body.startDate}|${body.endDate}`,
      ...(body.orderRef && { orderNumber: body.orderRef }),
      ...(body.productCode && { productCode: body.productCode }),
      ...(body.actionBy && { userId: body.actionBy }),
    };

    // 獲取報表數據
    const rawData = await dataSource.fetch(filters);

    if (!rawData) {
      throw new Error('No data found for the specified criteria');
    }

    // Strategy 4: unknown + type narrowing for records transformation
    const transformedData = dataSource.transform
      ? dataSource.transform(rawData)
      : toRecordArray(rawData);
    const records = Array.isArray(transformedData) ? transformedData : [];

    // 生成報表
    const format = body.format || 'excel';
    let blob: Blob;
    let contentType: string;
    let extension: string;

    if (format === 'pdf') {
      // 生成 PDF
      const doc = await createJsPDF();
      doc.text('Order Loading Report', 14, 15);
      doc.text(`Period: ${body.startDate} to ${body.endDate}`, 14, 25);

      // Type guard for record properties (Strategy 4: unknown + type narrowing)
      (doc as { autoTable: (config: Record<string, unknown>) => void }).autoTable({
        head: [['Timestamp', 'Order', 'Product', 'Qty', 'User', 'Action']],
        body: records.map(r => {
          // Strategy 4: Safe type narrowing for each record
          if (typeof r === 'object' && r !== null) {
            const record = r as Record<string, unknown>;
            return [
              record.timestamp ? new Date(String(record.timestamp)).toLocaleString() : 'N/A',
              record.order_number ? String(record.order_number) : 'N/A',
              record.product_code ? String(record.product_code) : 'N/A',
              record.loaded_qty ? Number(record.loaded_qty) : 0,
              record.user_name ? String(record.user_name) : 'N/A',
              record.action ? String(record.action) : 'N/A',
            ];
          }
          return ['N/A', 'N/A', 'N/A', 0, 'N/A', 'N/A'];
        }),
        startY: 35,
      });

      blob = doc.output('blob');
      contentType = 'application/pdf';
      extension = 'pdf';
    } else {
      // 生成 Excel
      // Dynamic import ExcelJS
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Loading Report');

      worksheet.columns = [
        { header: 'Timestamp', key: 'timestamp', width: 20 },
        { header: 'Order Number', key: 'order_number', width: 15 },
        { header: 'Product Code', key: 'product_code', width: 15 },
        { header: 'Loaded Qty', key: 'loaded_qty', width: 12 },
        { header: 'User', key: 'user_name', width: 20 },
        { header: 'Action', key: 'action', width: 10 },
      ];

      worksheet.addRows(toRecordArray(records));

      const buffer = await workbook.xlsx.writeBuffer();
      blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = 'xlsx';
    }

    // 轉換 Blob 為 Buffer
    return await blob.arrayBuffer();
  }, 'Failed to generate order loading report');

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  const format = body.format || 'excel';
  const extension = format === 'pdf' ? 'pdf' : 'xlsx';
  const contentType = format === 'pdf' 
    ? 'application/pdf' 
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  // 返回文件
  return new NextResponse(result.data, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="order-loading-report-${new Date().toISOString().split('T')[0]}.${extension}"`,
    },
  });
}
