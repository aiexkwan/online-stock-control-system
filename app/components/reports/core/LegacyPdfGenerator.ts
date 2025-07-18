/**
 * 舊版 PDF 生成器
 * 完全複製現有 Void Pallet Report 的 PDF 格式
 * 確保生成的報表與現有格式 100% 一致
 *
 * @deprecated This legacy PDF generator is deprecated. Please use the new unified PDF generator in PdfGenerator.ts instead.
 * The new implementation provides better performance and unified styling across reports.
 *
 * @example
 * ```typescript
 * // OLD (deprecated)
 * import { LegacyVoidPalletPdfGenerator } from './LegacyPdfGenerator';
 *
 * // NEW (recommended)
 * import { PdfGenerator } from '../generators/PdfGenerator';
 * ```
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// 擴展 jsPDF 類型
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface VoidReportData {
  dateRange: { start: string; end: string };
  summary: {
    totalVoided: number;
    totalQuantity: number;
    uniqueProducts: number;
    averagePerDay: number;
  };
  byReason: Array<{
    reason: string;
    count: number;
    quantity: number;
    percentage: number;
  }>;
  details: Array<{
    date: string;
    pltNum: string;
    productCode: string;
    description: string;
    quantity: number;
    reason: string;
    operator: string;
    remark?: string;
  }>;
  byProduct: Array<{
    productCode: string;
    description: string;
    voidCount: number;
    totalQuantity: number;
    avgQuantity: number;
  }>;
}

export class LegacyVoidPalletPdfGenerator {
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

  generate(data: VoidReportData): Blob {
    // 設置字體
    this.doc.setFont('helvetica');

    // 添加標題
    this.addHeader(data);

    // 添加摘要統計
    this.addSummarySection(data.summary);

    // 添加按原因分類
    this.addReasonBreakdown(data.byReason);

    // 檢查是否需要新頁
    if (this.currentY > 200) {
      this.doc.addPage();
      this.currentY = 20;
    }

    // 添加詳細記錄
    this.addDetailsTable(data.details);

    // 添加按產品分析（如果有數據）
    if (data.byProduct && data.byProduct.length > 0) {
      this.addProductAnalysis(data.byProduct);
    }

    // 添加頁碼
    this.addPageNumbers();

    return this.doc.output('blob');
  }

  private addHeader(data: VoidReportData) {
    // 公司名稱
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('VOID PALLET REPORT', this.pageWidth / 2, this.currentY, { align: 'center' });

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

  private addSummarySection(summary: any) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Summary Statistics', this.margin, this.currentY);
    this.currentY += 8;

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');

    const summaryData = [
      ['Total Pallets Voided:', summary.totalVoided.toString()],
      ['Total Quantity Voided:', summary.totalQuantity.toLocaleString()],
      ['Unique Products:', summary.uniqueProducts.toString()],
      ['Average Per Day:', summary.averagePerDay.toFixed(1)],
    ];

    summaryData.forEach(([label, value]) => {
      this.doc.text(label, this.margin + 5, this.currentY);
      this.doc.text(value, this.margin + 60, this.currentY, { align: 'right' });
      this.currentY += 6;
    });

    this.currentY += 5;
  }

  private addReasonBreakdown(reasons: Record<string, unknown>[]) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Breakdown by Void Reason', this.margin, this.currentY);
    this.currentY += 8;

    if (reasons.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text('No void reasons found', this.margin + 5, this.currentY);
      this.currentY += 10;
      return;
    }

    // 使用 autoTable 生成表格
    this.doc.autoTable({
      startY: this.currentY,
      head: [['Void Reason', 'Count', 'Total Qty', 'Percentage']],
      body: reasons.map(r => [
        r.reason,
        r.count.toString(),
        r.quantity.toLocaleString(),
        `${(r.percentage * 100).toFixed(1)}%`,
      ]),
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
      },
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  private addDetailsTable(details: Record<string, unknown>[]) {
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Void Details', this.margin, this.currentY);
    this.currentY += 8;

    if (details.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text('No details found', this.margin + 5, this.currentY);
      this.currentY += 10;
      return;
    }

    // 準備表格數據
    const tableData = details.map(d => [
      this.formatDate(d.date),
      d.pltNum,
      d.productCode,
      this.truncateText(d.description, 30),
      d.quantity.toString(),
      d.reason,
      d.operator,
    ]);

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Date', 'Pallet #', 'Product', 'Description', 'Qty', 'Reason', 'Operator']],
      body: tableData,
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 45 },
        4: { cellWidth: 15, halign: 'right' },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 },
      },
      didDrawPage: (data: Record<string, unknown>) => {
        // 在新頁面添加標題
        if (data.pageNumber > 1) {
          this.doc.setFontSize(10);
          this.doc.setFont('helvetica', 'normal');
          this.doc.text('Void Pallet Report (Continued)', this.margin, 10);
        }
      },
    });

    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  private addProductAnalysis(products: Record<string, unknown>[]) {
    // 檢查是否需要新頁
    if (this.currentY > 200) {
      this.doc.addPage();
      this.currentY = 20;
    }

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Product Analysis', this.margin, this.currentY);
    this.currentY += 8;

    const tableData = products.map(p => [
      p.productCode,
      this.truncateText(p.description, 40),
      p.voidCount.toString(),
      p.totalQuantity.toLocaleString(),
      p.avgQuantity.toFixed(1),
    ]);

    this.doc.autoTable({
      startY: this.currentY,
      head: [['Product Code', 'Description', 'Times Voided', 'Total Qty', 'Avg Qty']],
      body: tableData,
      margin: { left: this.margin, right: this.margin },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 70 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 20, halign: 'right' },
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

  private truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }
}
