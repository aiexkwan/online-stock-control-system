/**
 * 舊版 Order Loading PDF 生成器
 * 完全複製現有 Order Loading Report 的 PDF 格式
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
  toSafeString,
  toSafeNumber,
  toSafeOrderData,
  toSafeDetailData,
  toSafePageData,
  toSafeUserData,
  type SafeOrderData,
  type SafeDetailData,
  type SafePageData,
  type SafeUserData,
} from '@/lib/types/report-type-guards';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface OrderLoadingReportData {
  dateRange: { start: string; end: string };
  filters: {
    orderNumber?: string;
    productCode?: string;
    userId?: string;
    status?: string;
  };
  summary: {
    totalOrders: number;
    completedOrders: number;
    totalItemsLoaded: number;
    avgCompletionRate: number;
  };
  orderProgress: Array<{
    order_number: string;
    order_date: string;
    total_items: number;
    loaded_items: number;
    completion_rate: number;
    status: string;
  }>;
  loadingDetails: Array<{
    timestamp: string;
    order_number: string;
    product_code: string;
    product_description: string;
    loaded_qty: number;
    user_name: string;
    action: string;
  }>;
  userPerformance: Array<{
    user_id: string;
    user_name: string;
    total_loads: number;
    total_quantity: number;
    avg_load_time: string;
  }>;
}

export class LegacyOrderLoadingPdfGenerator {
  private doc: jsPDF;
  private pageHeight = 297;
  private pageWidth = 210;
  private margin = 15;
  private currentY = 20;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
  }

  generate(data: OrderLoadingReportData): Blob {
    // 設置字體
    this.doc.setFont('helvetica');

    // 添加標題
    this.addHeader(data);

    // 添加摘要
    this.addSummary(data.summary);

    // 添加訂單進度
    this.addOrderProgress(data.orderProgress);

    // 檢查是否需要新頁
    if (this.currentY > 200) {
      this.doc.addPage();
      this.currentY = 20;
    }

    // 添加加載詳情
    this.addLoadingDetails(data.loadingDetails);

    // 添加用戶績效
    if (data.userPerformance && data.userPerformance.length > 0) {
      this.addUserPerformance(data.userPerformance);
    }

    // 添加頁碼
    this.addPageNumbers();

    return this.doc.output('blob');
  }

  private addHeader(data: OrderLoadingReportData) {
    // 報表標題
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ORDER LOADING REPORT', this.pageWidth / 2, this.currentY, { align: 'center' });

    // 日期範圍
    this.currentY += 8;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(
      `Period: ${this.formatDate(data.dateRange.start)} to ${this.formatDate(data.dateRange.end)}`,
      this.pageWidth / 2,
      this.currentY,
      { align: 'center' }
    );

    // 過濾條件
    if (Object.keys(data.filters).some(key => data.filters[key as keyof typeof data.filters])) {
      this.currentY += 6;
      this.doc.setFontSize(10);
      const filterTexts = [];
      if (data.filters.orderNumber) filterTexts.push(`Order: ${data.filters.orderNumber}`);
      if (data.filters.productCode) filterTexts.push(`Product: ${data.filters.productCode}`);
      if (data.filters.userId) filterTexts.push(`User: ${data.filters.userId}`);
      if (data.filters.status) filterTexts.push(`Status: ${data.filters.status}`);

      this.doc.text(`Filters: ${filterTexts.join(', ')}`, this.pageWidth / 2, this.currentY, {
        align: 'center',
      });
    }

    // 生成時間
    this.currentY += 6;
    this.doc.setFontSize(10);
    this.doc.text(`Generated: ${new Date().toLocaleString()}`, this.pageWidth / 2, this.currentY, {
      align: 'center',
    });

    // 分隔線
    this.currentY += 5;
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private addSummary(summary: OrderLoadingReportData['summary']) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Loading Summary', this.margin, this.currentY);
    this.currentY += 8;

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');

    const summaryData = [
      ['Total Orders:', summary.totalOrders.toString()],
      ['Completed Orders:', summary.completedOrders.toString()],
      ['Total Items Loaded:', summary.totalItemsLoaded.toLocaleString()],
      ['Average Completion Rate:', `${(summary.avgCompletionRate * 100).toFixed(1)}%`],
    ];

    summaryData.forEach(([label, value]) => {
      this.doc.text(label, this.margin + 5, this.currentY);
      this.doc.text(value, this.margin + 70, this.currentY, { align: 'right' });
      this.currentY += 6;
    });

    this.currentY += 5;
  }

  private addOrderProgress(orders: Record<string, unknown>[]) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Order Progress', this.margin, this.currentY);
    this.currentY += 8;

    if (orders.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text('No orders found', this.margin + 5, this.currentY);
      this.currentY += 10;
      return;
    }

    // 表格數據
    const tableData = orders.map(order => {
      const safeOrder = toSafeOrderData(order);
      return [
        toSafeString(order.order_number),
        this.formatDate(toSafeString(order.order_date)),
        safeOrder.total_items.toString(),
        safeOrder.loaded_items.toString(),
        `${(safeOrder.completion_rate * 100).toFixed(1)}%`,
        toSafeString(order.status),
      ];
    });

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Order #', 'Order Date', 'Total Items', 'Loaded', 'Completion', 'Status']],
      body: tableData,
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [74, 85, 104],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30 },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  private addLoadingDetails(details: Record<string, unknown>[]) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Loading Details', this.margin, this.currentY);
    this.currentY += 8;

    if (details.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text('No loading details found', this.margin + 5, this.currentY);
      this.currentY += 10;
      return;
    }

    // 限制顯示的記錄數
    const displayDetails = details.slice(0, 50);

    const tableData = displayDetails.map(d => {
      const safeDetail = toSafeDetailData(d);
      return [
        this.formatDateTime(toSafeString(d.timestamp)),
        toSafeString(d.order_number),
        safeDetail.product_code,
        this.truncateText(toSafeString(d.product_description), 25),
        safeDetail.loaded_qty.toString(),
        this.truncateText(toSafeString(d.user_name), 15),
        toSafeString(d.action),
      ];
    });

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Date/Time', 'Order #', 'Product', 'Description', 'Qty', 'User', 'Action']],
      body: tableData,
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [74, 85, 104],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 40 },
        4: { cellWidth: 15, halign: 'right' },
        5: { cellWidth: 25 },
        6: { cellWidth: 20 },
      },
      didDrawPage: (data: Record<string, unknown>) => {
        const safePageData = toSafePageData(data);
        if (safePageData.pageNumber > 1) {
          this.doc.setFontSize(10);
          this.doc.setFont('helvetica', 'normal');
          this.doc.text('Order Loading Report (Continued)', this.margin, 10);
        }
      },
    });

    if (details.length > 50) {
      this.currentY = this.doc.lastAutoTable.finalY + 5;
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text(
        `Showing 50 of ${details.length} records. See Excel export for full details.`,
        this.margin,
        this.currentY
      );
      this.currentY += 5;
    }

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  private addUserPerformance(users: Record<string, unknown>[]) {
    // 檢查是否需要新頁
    if (this.currentY > 200) {
      this.doc.addPage();
      this.currentY = 20;
    }

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('User Performance', this.margin, this.currentY);
    this.currentY += 8;

    const tableData = users.map(u => {
      const safeUser = toSafeUserData(u);
      return [
        toSafeString(u.user_id),
        this.truncateText(safeUser.user_name, 25),
        safeUser.total_loads.toString(),
        safeUser.total_quantity.toLocaleString(),
        toSafeString(u.avg_load_time),
      ];
    });

    this.doc.autoTable({
      startY: this.currentY,
      head: [['User ID', 'User Name', 'Total Loads', 'Total Quantity', 'Avg Load Time']],
      body: tableData,
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [74, 85, 104],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 60 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
    });
  }

  private addPageNumbers() {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Page ${i} of ${pageCount}`, this.pageWidth / 2, this.pageHeight - 10, {
        align: 'center',
      });
    }
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }
}
