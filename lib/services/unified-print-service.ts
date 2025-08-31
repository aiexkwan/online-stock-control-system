/**
 * 統一打印服務
 * 提供統一的 PDF 打印介面，支援批量打印和單個打印
 *
 * @author AI Assistant
 * @version 1.0.0
 */

import { logger } from '../logger';

// ============================================================================
// 類型定義與品牌類型
// ============================================================================

/**
 * 品牌類型：確保打印 URL 的類型安全
 */
export type PrintUrl = string & { readonly __brand: 'PrintUrl' };

/**
 * 品牌類型：確保打印視窗的類型安全
 */
export type PrintWindow = Window & { readonly __brand: 'PrintWindow' };

/**
 * 打印元數據
 */
export interface PrintMetadata {
  /** 產品代碼 */
  readonly productCode?: string;
  /** 棧板號碼陣列 */
  readonly palletNumbers?: ReadonlyArray<string>;
  /** 系列號陣列 */
  readonly series?: ReadonlyArray<string>;
  /** 數量 */
  readonly quantity?: number;
  /** 操作員 */
  readonly operator?: string;
  /** GRN 編號 */
  readonly grnNumber?: string;
  /** 供應商代碼 */
  readonly supplierCode?: string;
}

/**
 * 打印配置
 */
export interface PrintConfig {
  /** 是否自動打印 */
  readonly autoPrint?: boolean;
  /** 打印份數 */
  readonly copies?: number;
  /** 是否在新視窗打開 */
  readonly openInNewWindow?: boolean;
  /** URL 清理延遲時間（毫秒）*/
  readonly cleanupDelay?: number;
}

/**
 * 打印結果
 */
export interface PrintResult {
  /** 是否成功 */
  readonly success: boolean;
  /** 錯誤訊息 */
  readonly error?: string;
  /** 打印的文件數量 */
  readonly fileCount: number;
}

/**
 * 環境檢查結果
 */
interface EnvironmentCheck {
  readonly isBrowser: boolean;
  readonly hasWindowObject: boolean;
  readonly hasUrlApi: boolean;
}

// ============================================================================
// 環境檢查工具函數
// ============================================================================

/**
 * 檢查是否在瀏覽器環境中
 * @returns 環境檢查結果
 */
const checkEnvironment = (): EnvironmentCheck => {
  const isBrowser = typeof window !== 'undefined';
  const hasWindowObject = isBrowser && typeof window.open === 'function';
  const hasUrlApi =
    isBrowser && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';

  return {
    isBrowser,
    hasWindowObject,
    hasUrlApi,
  };
};

/**
 * 創建品牌類型的打印 URL
 * @param blob PDF Blob
 * @returns 品牌類型的 URL
 */
const createPrintUrl = (blob: Blob): PrintUrl => {
  const env = checkEnvironment();

  if (!env.hasUrlApi) {
    throw new Error('URL API not available in current environment');
  }

  return URL.createObjectURL(blob) as PrintUrl;
};

/**
 * 安全地清理 URL
 * @param url 要清理的 URL
 */
const safeRevokeUrl = (url: PrintUrl): void => {
  const env = checkEnvironment();

  if (env.hasUrlApi) {
    try {
      URL.revokeObjectURL(url);
      logger.debug('[PrintService] URL revoked successfully');
    } catch (error) {
      logger.warn({ error }, '[PrintService] Failed to revoke URL');
    }
  }
};

// ============================================================================
// 統一打印服務類
// ============================================================================

class UnifiedPrintService {
  /**
   * 批量打印 PDF
   * @param blobs PDF Blob 陣列
   * @param metadata 打印元數據
   * @param config 打印配置
   * @returns 打印結果
   */
  async printBatch(
    blobs: ReadonlyArray<Blob>,
    metadata?: PrintMetadata,
    config?: PrintConfig
  ): Promise<PrintResult> {
    const env = checkEnvironment();

    // 環境檢查
    if (!env.isBrowser) {
      const error = 'Print service can only be used in browser environment';
      logger.error({ error }, '[PrintBatch] Environment error');
      return { success: false, error, fileCount: 0 };
    }

    if (!env.hasWindowObject || !env.hasUrlApi) {
      const error = 'Required browser APIs not available';
      logger.error(
        {
          error,
          hasWindow: env.hasWindowObject,
          hasUrl: env.hasUrlApi,
        },
        '[PrintBatch] API error'
      );
      return { success: false, error, fileCount: 0 };
    }

    if (blobs.length === 0) {
      const error = 'No PDF files provided for printing';
      logger.warn({ error }, '[PrintBatch] Invalid input');
      return { success: false, error, fileCount: 0 };
    }

    try {
      logger.info({
        msg: '[PrintBatch] Starting batch print',
        blobCount: blobs.length,
        metadata: metadata ? Object.keys(metadata) : [],
        config: config ? Object.keys(config) : [],
      });

      // 合併所有 PDF 為一個
      const mergedBlob = await this.mergePdfsForPrint(blobs);

      // 創建打印 URL
      const printUrl = createPrintUrl(mergedBlob);

      // 打開打印視窗
      const printWindow = window.open(printUrl, '_blank') as PrintWindow | null;

      if (printWindow) {
        // 等待視窗載入後自動觸發打印
        printWindow.onload = () => {
          if (config?.autoPrint !== false) {
            try {
              printWindow.print();
              logger.info('[PrintBatch] Print dialog opened successfully');
            } catch (printError) {
              logger.error({ error: printError }, '[PrintBatch] Failed to trigger print');
            }
          }
        };

        // 清理 URL（延遲以確保打印完成）
        const cleanupDelay = config?.cleanupDelay ?? 60000; // 預設 60 秒
        setTimeout(() => {
          safeRevokeUrl(printUrl);
        }, cleanupDelay);

        logger.info('[PrintBatch] Print window opened successfully');
        return { success: true, fileCount: blobs.length };
      } else {
        const error = 'Failed to open print window - popup may be blocked';
        logger.error({ error }, '[PrintBatch] Window error');
        safeRevokeUrl(printUrl); // 立即清理 URL
        return { success: false, error, fileCount: blobs.length };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown print error';
      logger.error({ error: errorMessage }, '[PrintBatch] Print error');
      return { success: false, error: errorMessage, fileCount: blobs.length };
    }
  }

  /**
   * 打印單個 PDF
   * @param blob PDF Blob
   * @param metadata 打印元數據
   * @param config 打印配置
   * @returns 打印結果
   */
  async printSingle(
    blob: Blob,
    metadata?: PrintMetadata,
    config?: PrintConfig
  ): Promise<PrintResult> {
    if (!blob || blob.size === 0) {
      const error = 'Invalid or empty PDF blob provided';
      logger.warn({ error }, '[PrintSingle] Invalid input');
      return { success: false, error, fileCount: 0 };
    }

    return this.printBatch([blob], metadata, config);
  }

  /**
   * 合併多個 PDF 為一個（用於打印）
   * @param blobs PDF Blob 陣列
   * @returns 合併後的 PDF Blob
   */
  private async mergePdfsForPrint(blobs: ReadonlyArray<Blob>): Promise<Blob> {
    if (blobs.length === 0) {
      throw new Error('No PDFs to merge');
    }

    if (blobs.length === 1) {
      return blobs[0]!; // 已檢查長度，安全使用非空斷言
    }

    try {
      logger.debug({ fileCount: blobs.length }, '[MergePDFs] Starting PDF merge process');

      // 動態導入 pdf-lib
      const { PDFDocument } = await import('pdf-lib');

      const mergedPdf = await PDFDocument.create();
      let totalPages = 0;

      for (let i = 0; i < blobs.length; i++) {
        const blob = blobs[i]!; // 在迴圈中安全使用

        try {
          const pdfBytes = await blob.arrayBuffer();
          const pdf = await PDFDocument.load(pdfBytes);
          const pageIndices = pdf.getPageIndices();
          const pages = await mergedPdf.copyPages(pdf, pageIndices);

          pages.forEach(page => {
            mergedPdf.addPage(page);
          });

          totalPages += pages.length;
          logger.debug({ pages: pages.length }, `[MergePDFs] Merged PDF ${i + 1}/${blobs.length}`);
        } catch (blobError) {
          const errorMessage =
            blobError instanceof Error ? blobError.message : 'Unknown blob error';
          logger.error({ error: errorMessage }, `[MergePDFs] Failed to process PDF ${i + 1}`);
          throw new Error(`Failed to process PDF file ${i + 1}: ${errorMessage}`);
        }
      }

      const mergedPdfBytes = await mergedPdf.save();
      // 確保類型兼容：直接使用 Uint8Array，類型斷言為 BlobPart
      const resultBlob = new Blob([mergedPdfBytes as BlobPart], {
        type: 'application/pdf',
      });

      logger.info(
        {
          totalFiles: blobs.length,
          totalPages,
          outputSize: resultBlob.size,
        },
        '[MergePDFs] PDF merge completed successfully'
      );

      return resultBlob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown merge error';
      logger.error({ error: errorMessage }, '[MergePDFs] Merge error');
      throw new Error(`Failed to merge PDFs for printing: ${errorMessage}`);
    }
  }

  /**
   * 檢查打印服務是否可用
   * @returns 服務可用性檢查結果
   */
  public isAvailable(): EnvironmentCheck {
    return checkEnvironment();
  }

  /**
   * 獲取服務狀態資訊
   * @returns 服務狀態
   */
  public getServiceStatus(): {
    readonly available: boolean;
    readonly environment: EnvironmentCheck;
    readonly version: string;
  } {
    const environment = checkEnvironment();
    return {
      available: environment.isBrowser && environment.hasWindowObject && environment.hasUrlApi,
      environment,
      version: '1.0.0',
    };
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
