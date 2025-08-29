/**
 * 統一打印服務
 * 提供統一的 PDF 打印介面，支援批量打印和單個打印
 *
 * @author AI Assistant
 * @version 1.0.0
 */

import { logger } from '@/lib/logger';

// ============================================================================
// 類型定義
// ============================================================================

/**
 * 打印元數據
 */
export interface PrintMetadata {
  /** 產品代碼 */
  productCode?: string;
  /** 棧板號碼陣列 */
  palletNumbers?: string[];
  /** 系列號陣列 */
  series?: string[];
  /** 數量 */
  quantity?: number;
  /** 操作員 */
  operator?: string;
  /** GRN 編號 */
  grnNumber?: string;
  /** 供應商代碼 */
  supplierCode?: string;
}

/**
 * 打印配置
 */
export interface PrintConfig {
  /** 是否自動打印 */
  autoPrint?: boolean;
  /** 打印份數 */
  copies?: number;
  /** 是否在新視窗打開 */
  openInNewWindow?: boolean;
}

// ============================================================================
// 統一打印服務類
// ============================================================================

class UnifiedPrintService {
  /**
   * 批量打印 PDF
   * @param blobs PDF Blob 陣列
   * @param metadata 打印元數據
   * @param config 打印配置
   */
  async printBatch(blobs: Blob[], metadata?: PrintMetadata, config?: PrintConfig): Promise<void> {
    try {
      logger.info({
        msg: '[PrintBatch] Starting batch print',
        blobCount: blobs.length,
        metadata,
        config,
      });

      // 合併所有 PDF 為一個
      const mergedBlob = await this.mergePdfsForPrint(blobs);

      // 創建打印 URL
      const printUrl = URL.createObjectURL(mergedBlob);

      // 打開打印視窗
      const printWindow = window.open(printUrl, '_blank');

      if (printWindow) {
        // 等待視窗載入後自動觸發打印
        printWindow.onload = () => {
          if (config?.autoPrint !== false) {
            printWindow.print();
          }
        };

        logger.info('[PrintBatch] Print window opened successfully');
      } else {
        throw new Error('Failed to open print window');
      }

      // 清理 URL（延遲以確保打印完成）
      setTimeout(() => {
        URL.revokeObjectURL(printUrl);
      }, 60000); // 60 秒後清理
    } catch (error) {
      logger.error('[PrintBatch] Print error');
      throw error;
    }
  }

  /**
   * 打印單個 PDF
   * @param blob PDF Blob
   * @param metadata 打印元數據
   * @param config 打印配置
   */
  async printSingle(blob: Blob, metadata?: PrintMetadata, config?: PrintConfig): Promise<void> {
    return this.printBatch([blob], metadata, config);
  }

  /**
   * 合併多個 PDF 為一個（用於打印）
   * @param blobs PDF Blob 陣列
   * @returns 合併後的 PDF Blob
   */
  private async mergePdfsForPrint(blobs: Blob[]): Promise<Blob> {
    if (blobs.length === 0) {
      throw new Error('No PDFs to merge');
    }

    if (blobs.length === 1) {
      return blobs[0];
    }

    try {
      // 動態導入 pdf-lib
      const { PDFDocument } = await import('pdf-lib');

      const mergedPdf = await PDFDocument.create();

      for (const blob of blobs) {
        const pdfBytes = await blob.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

        pages.forEach(page => {
          mergedPdf.addPage(page);
        });
      }

      const mergedPdfBytes = await mergedPdf.save();
      // 將 Uint8Array 轉換為 Blob
      return new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' });
    } catch (error) {
      logger.error('[MergePDFs] Merge error');
      throw new Error('Failed to merge PDFs for printing');
    }
  }
}

// ============================================================================
// 導出單例實例
// ============================================================================

export const unifiedPrintService = new UnifiedPrintService();

// ============================================================================
// 默認導出
// ============================================================================

export default unifiedPrintService;
