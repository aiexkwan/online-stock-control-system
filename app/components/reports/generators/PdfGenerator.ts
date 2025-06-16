/**
 * PDF 報表生成器
 * 支援新舊格式兼容，確保現有報表外觀不變
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  ReportGenerator, 
  ProcessedReportData, 
  ReportConfig,
  ColumnConfig,
  ReportFormat 
} from '../core/ReportConfig';

// 擴展 jsPDF 類型以包含 autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export class PdfGenerator implements ReportGenerator {
  format: ReportFormat = 'pdf';
  supportLegacyMode = true;
  private useLegacyStyles: boolean;
  
  constructor(useLegacyStyles = false) {
    this.useLegacyStyles = useLegacyStyles;
  }
  
  async generate(data: ProcessedReportData, config: ReportConfig): Promise<Blob> {
    // 如果報表要求使用舊版樣式，調用舊版生成方法
    if (this.useLegacyStyles || config.styleOverrides?.pdf?.useLegacyStyles) {
      return this.generateLegacyPdf(data, config);
    }
    
    // 新版 PDF 生成
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const margins = config.styleOverrides?.pdf?.margins || {
      top: 20,
      right: 15,
      bottom: 20,
      left: 15
    };
    
    let currentY = margins.top;
    
    // 添加報表標題
    this.addHeader(doc, config, margins, currentY);
    currentY += 20;
    
    // 添加元數據
    this.addMetadata(doc, data, margins, currentY);
    currentY += 15;
    
    // 添加各區段
    for (const section of config.sections) {
      // 檢查是否在 PDF 中隱藏此區段
      if (section.hideInFormats?.includes('pdf')) {
        continue;
      }
      
      const sectionData = data.sections[section.id];
      if (!sectionData) continue;
      
      // 添加區段標題
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, margins.left, currentY);
      currentY += 8;
      
      // 根據區段類型渲染內容
      switch (section.type) {
        case 'summary':
          currentY = this.addSummarySection(doc, section, sectionData, margins, currentY);
          break;
        case 'table':
          currentY = this.addTableSection(doc, section, sectionData, margins, currentY);
          break;
        default:
          // 其他類型暫時跳過
          currentY += 10;
      }
      
      currentY += 10; // 區段間距
      
      // 檢查是否需要新頁
      if (currentY > 250) {
        doc.addPage();
        currentY = margins.top;
      }
    }
    
    // 添加頁尾
    this.addFooter(doc, config);
    
    return doc.output('blob');
  }
  
  /**
   * 生成舊版格式 PDF（保持現有報表外觀）
   */
  private async generateLegacyPdf(data: ProcessedReportData, config: ReportConfig): Promise<Blob> {
    // 根據報表 ID 使用特定的舊版生成器
    if (config.id === 'void-pallet-report') {
      // 使用 Void Pallet 專用的舊版生成器
      const { LegacyVoidPalletAdapter } = await import('./LegacyVoidPalletAdapter');
      return LegacyVoidPalletAdapter.generatePdf(data, config);
    }
    
    if (config.id === 'order-loading-report') {
      // 使用 Order Loading 專用的舊版生成器
      const { LegacyOrderLoadingAdapter } = await import('./LegacyOrderLoadingAdapter');
      return LegacyOrderLoadingAdapter.generatePdf(data, config);
    }
    
    // 其他報表的舊版生成邏輯...
    const doc = new jsPDF();
    
    // 使用舊版樣式設置
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // 通用舊版佈局
    doc.text(config.name, 20, 20);
    doc.text('Legacy Format Report', 20, 30);
    doc.text(JSON.stringify(data.metadata.filters), 20, 40);
    
    return doc.output('blob');
  }
  
  private addHeader(doc: jsPDF, config: ReportConfig, margins: any, y: number): void {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(config.name, margins.left, y);
    
    if (config.description) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(config.description, margins.left, y + 6);
    }
  }
  
  private addMetadata(doc: jsPDF, data: ProcessedReportData, margins: any, y: number): void {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const generatedDate = new Date(data.metadata.generatedAt).toLocaleString();
    doc.text(`Generated: ${generatedDate}`, margins.left, y);
    
    // 顯示過濾條件
    if (Object.keys(data.metadata.filters).length > 0) {
      let filterText = 'Filters: ';
      for (const [key, value] of Object.entries(data.metadata.filters)) {
        if (value) {
          filterText += `${key}: ${value}, `;
        }
      }
      doc.text(filterText.slice(0, -2), margins.left, y + 5);
    }
  }
  
  private addSummarySection(
    doc: jsPDF, 
    section: any, 
    data: any, 
    margins: any, 
    y: number
  ): number {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    let currentY = y;
    const summaryFields = section.config?.summaryFields || [];
    
    for (const field of summaryFields) {
      const value = data[field.id];
      if (value !== undefined) {
        const formattedValue = this.formatValue(value, field.format);
        doc.text(`${field.label}: ${formattedValue}`, margins.left + 5, currentY);
        currentY += 6;
      }
    }
    
    return currentY;
  }
  
  private addTableSection(
    doc: jsPDF, 
    section: any, 
    data: any[], 
    margins: any, 
    y: number
  ): number {
    if (!Array.isArray(data) || data.length === 0) {
      doc.setFontSize(10);
      doc.text('No data available', margins.left, y);
      return y + 10;
    }
    
    const columns = section.config?.columns || this.inferColumns(data[0]);
    
    // 準備表格數據
    const headers = columns.map((col: ColumnConfig) => col.label);
    const rows = data.map(item => 
      columns.map((col: ColumnConfig) => {
        const value = item[col.id];
        return this.formatValue(value, col.format || col.type);
      })
    );
    
    // 使用 autoTable 插件生成表格
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: y,
      margin: { left: margins.left, right: margins.right },
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
    
    return doc.lastAutoTable.finalY;
  }
  
  private addFooter(doc: jsPDF, config: ReportConfig): void {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // 頁碼
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
      
      // 報表 ID（用於追蹤）
      doc.setFontSize(8);
      doc.text(
        `Report ID: ${config.id}`,
        15,
        doc.internal.pageSize.height - 10
      );
    }
  }
  
  private inferColumns(dataItem: any): ColumnConfig[] {
    // 自動推斷列配置
    return Object.keys(dataItem).map(key => ({
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      type: typeof dataItem[key] === 'number' ? 'number' : 'text'
    }));
  }
  
  private formatValue(value: any, format?: string): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    switch (format) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'currency':
        return `$${Number(value).toFixed(2)}`;
      case 'percentage':
        return `${(Number(value) * 100).toFixed(2)}%`;
      case 'number':
        return Number(value).toLocaleString();
      default:
        return String(value);
    }
  }
}