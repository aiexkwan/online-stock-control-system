/**
 * 統一 PDF 服務
 * 集中管理所有 PDF 相關庫的使用，提供統一的 PDF 生成介面
 * 遵循 SOLID 原則，使用工廠模式處理不同類型的 PDF
 */

import type { PDFDocument as PDFDocumentType } from 'pdf-lib';
import type { jsPDF as jsPDFType } from 'jspdf';
import type { pdf as ReactPDFType } from '@react-pdf/renderer';
import { PrintLabelPdf, PrintLabelPdfProps } from '@/components/print-label-pdf/PrintLabelPdf';
import {
  prepareQcLabelData,
  prepareGrnLabelData,
  type QcInputData,
  type GrnInputData,
} from '@/lib/pdfUtils';
import type { QcLabelInputData, GrnLabelInputData } from '@/lib/mappers/pdf-data-mappers';
import {
  uploadPdfToStorage as uploadPdfToStorageGrn,
  updatePalletPdfUrl as updatePalletPdfUrlGrn,
} from '@/app/actions/grnActions';
import {
  uploadPdfToStorage as uploadPdfToStorageQc,
  updatePalletPdfUrl as updatePalletPdfUrlQc,
} from '@/app/actions/qcActions';
import React from 'react';
import { getUnifiedPrintingService } from '@/lib/printing/services/unified-printing-service';
import {
  PrintType,
  PrintOptions,
  PrintResult,
  PrintPriority,
  PaperSize,
} from '@/lib/printing/types';

// PDF 類型枚舉
export enum PdfType {
  QC_LABEL = 'QC_LABEL',
  GRN_LABEL = 'GRN_LABEL',
  REPORT = 'REPORT',
  CUSTOM = 'CUSTOM',
}

// PDF 生成配置介面
export interface PdfConfig {
  type: PdfType;
  paperSize?: 'A4' | 'A3' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  uploadEnabled?: boolean;
  storageFolder?: string;
}

// PDF 生成結果介面
export interface PdfGenerationResult {
  success: boolean;
  blob?: Blob;
  url?: string;
  error?: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    palletNumber?: string;
    timestamp?: string;
  };
}

// 批量生成結果介面
export interface BatchPdfResult {
  successful: number;
  failed: number;
  results: PdfGenerationResult[];
  blobs: Blob[];
  uploadedUrls: string[];
  errors: string[];
}

// 打印選項介面
export interface PdfPrintOptions {
  copies?: number;
  priority?: 'high' | 'normal' | 'low';
  printerPreference?: string;
  immediateMode?: boolean;
  uploadBeforePrint?: boolean;
}

// 打印結果介面
export interface PdfPrintResult extends PrintResult {
  pdfGenerated: boolean;
  generationTime?: number;
  printTime?: number;
}

// 緩存已載入的 PDF 庫
const pdfLibraryCache = {
  pdfLib: null as typeof import('pdf-lib') | null,
  jsPDF: null as typeof import('jspdf') | null,
  reactPdf: null as typeof import('@react-pdf/renderer') | null,
  jsPDFAutoTable: null as typeof import('jspdf-autotable') | null,
};

/**
 * 動態載入 pdf-lib
 */
export async function getPDFLib() {
  if (!pdfLibraryCache.pdfLib) {
    safeLog('[UnifiedPDFService] Loading pdf-lib...');
    pdfLibraryCache.pdfLib = await import('pdf-lib');
  }
  return pdfLibraryCache.pdfLib;
}

/**
 * 動態載入 jsPDF
 */
export async function getJsPDF() {
  if (!pdfLibraryCache.jsPDF) {
    safeLog('[UnifiedPDFService] Loading jsPDF...');
    pdfLibraryCache.jsPDF = await import('jspdf');
    // 同時載入 autotable 插件
    await import('jspdf-autotable');
  }
  return pdfLibraryCache.jsPDF;
}

/**
 * 動態載入 @react-pdf/renderer
 */
export async function getReactPDF() {
  if (!pdfLibraryCache.reactPdf) {
    safeLog('[UnifiedPDFService] Loading @react-pdf/renderer...');
    pdfLibraryCache.reactPdf = await import('@react-pdf/renderer');
  }
  return pdfLibraryCache.reactPdf;
}

/**
 * 創建新的 PDFDocument (pdf-lib)
 */
export async function createPDFDocument() {
  const { PDFDocument } = await getPDFLib();
  return PDFDocument.create();
}

/**
 * 創建新的 jsPDF 實例
 */
export async function createJsPDF(options?: {
  orientation?: 'portrait' | 'landscape';
  unit?: 'pt' | 'mm' | 'cm' | 'in';
  format?: string | [number, number];
}) {
  const { jsPDF } = await getJsPDF();
  return new jsPDF(options);
}

/**
 * 渲染 React PDF 組件到 Blob
 */
export async function renderReactPDFToBlob(element: React.ReactElement): Promise<Blob> {
  safeLog('[UnifiedPDFService] Starting PDF rendering...');

  try {
    const { pdf } = await getReactPDF();
    safeLog('[UnifiedPDFService] ReactPDF loaded, creating PDF instance...');

    const pdfInstance = pdf(element);
    safeLog('[UnifiedPDFService] PDF instance created, converting to blob...');

    // Add timeout protection
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('PDF generation timed out after 30 seconds'));
      }, 30000);
    });

    const blob = await Promise.race([pdfInstance.toBlob(), timeoutPromise]);

    safeLog('[UnifiedPDFService] PDF blob generated successfully', {
      size: blob.size,
      type: blob.type,
    });

    return blob;
  } catch (error) {
    safeError('[UnifiedPDFService] PDF generation failed:', error);
    throw error;
  }
}

/**
 * 合併多個 PDF 文件
 */
export async function mergePDFs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  const { PDFDocument } = await getPDFLib();
  const mergedPdf = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    if (buffer.byteLength === 0) {
      safeWarn('[UnifiedPDFService] Skipping empty PDF buffer');
      continue;
    }

    try {
      const pdfDoc = await PDFDocument.load(buffer);
      const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    } catch (error) {
      safeError('[UnifiedPDFService] Error loading PDF for merging:', error);
    }
  }

  return await mergedPdf.save();
}

/**
 * 載入 PDF 文件
 */
export async function loadPDF(buffer: ArrayBuffer): Promise<PDFDocumentType> {
  const { PDFDocument } = await getPDFLib();
  return await PDFDocument.load(buffer);
}

/**
 * 檢查 PDF 庫是否已載入
 */
export function isPDFLibLoaded(library: 'pdfLib' | 'jsPDF' | 'reactPdf'): boolean {
  return pdfLibraryCache[library] !== null;
}

/**
 * 清除 PDF 庫緩存（主要用於測試）
 */
export function clearPDFCache() {
  pdfLibraryCache.pdfLib = null;
  pdfLibraryCache.jsPDF = null;
  pdfLibraryCache.reactPdf = null;
  pdfLibraryCache.jsPDFAutoTable = null;
}

// Export types for convenience
export type { PDFDocumentType, jsPDFType };

// Font 管理
type FontStyle = 'normal' | 'italic' | 'oblique';
type FontWeight =
  | number
  | 'thin'
  | 'ultralight'
  | 'light'
  | 'normal'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'ultrabold'
  | 'heavy';

export async function registerFont(config: {
  family: string;
  fonts: Array<{ src: string; fontWeight?: FontWeight; fontStyle?: FontStyle }>;
}): Promise<void> {
  const { Font } = await getReactPDF();
  Font.register(config);
}

/**
 * 安全的 console 方法，保護敏感資訊
 */
function safeLog(message: string, data?: any) {
  const sanitizedData = data ? sanitizeData(data) : undefined;
  if (process.env.NODE_ENV !== 'production') {
    console.log(message, sanitizedData || '');
  }
}

function safeError(message: string, error?: any) {
  const sanitizedError = error ? sanitizeData(error) : undefined;
  console.error(message, sanitizedError || '');
}

function safeWarn(message: string, data?: any) {
  const sanitizedData = data ? sanitizeData(data) : undefined;
  console.warn(message, sanitizedData || '');
}

/**
 * 簡單的數據消毒函數
 */
function sanitizeData(data: any): any {
  if (typeof data === 'string') {
    return data.length > 100 ? data.substring(0, 100) + '...' : data;
  }
  if (typeof data === 'object' && data !== null) {
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'auth'];
    const sanitized: any = Array.isArray(data) ? [] : {};

    for (const key in data) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = data[key];
      }
    }
    return sanitized;
  }
  return data;
}

/**
 * 統一 PDF 服務類
 * 提供單一入口點管理所有 PDF 生成需求
 */
export class UnifiedPdfService {
  private static instance: UnifiedPdfService;
  private config: Map<PdfType, PdfConfig> = new Map();

  private constructor() {
    // 初始化默認配置
    this.initializeDefaultConfigs();
  }

  /**
   * 獲取服務單例
   */
  public static getInstance(): UnifiedPdfService {
    if (!UnifiedPdfService.instance) {
      UnifiedPdfService.instance = new UnifiedPdfService();
    }
    return UnifiedPdfService.instance;
  }

  /**
   * 初始化默認配置
   */
  private initializeDefaultConfigs() {
    // QC 標籤配置
    this.config.set(PdfType.QC_LABEL, {
      type: PdfType.QC_LABEL,
      paperSize: 'A4',
      orientation: 'portrait',
      uploadEnabled: true,
      storageFolder: 'qc-labels',
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
    });

    // GRN 標籤配置
    this.config.set(PdfType.GRN_LABEL, {
      type: PdfType.GRN_LABEL,
      paperSize: 'A4',
      orientation: 'portrait',
      uploadEnabled: true,
      storageFolder: 'grn-labels',
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
    });

    // 報告配置
    this.config.set(PdfType.REPORT, {
      type: PdfType.REPORT,
      paperSize: 'A4',
      orientation: 'landscape',
      uploadEnabled: false,
      margin: { top: 15, right: 15, bottom: 15, left: 15 },
    });
  }

  /**
   * 更新特定類型的配置
   */
  public updateConfig(type: PdfType, config: Partial<PdfConfig>) {
    const existingConfig = this.config.get(type) || { type };
    this.config.set(type, { ...existingConfig, ...config });
  }

  /**
   * 生成單個 PDF
   */
  public async generateSingle(
    type: PdfType,
    data: QcInputData | GrnInputData | QcLabelInputData | GrnLabelInputData | any,
    options?: Partial<PdfConfig>
  ): Promise<PdfGenerationResult> {
    try {
      safeLog(`[UnifiedPdfService] Generating single PDF of type ${type}`);

      // 獲取配置
      const config = this.getConfig(type, options);

      // 根據類型準備數據
      let pdfProps: PrintLabelPdfProps;
      let palletNumber: string = '';

      switch (type) {
        case PdfType.QC_LABEL:
          if (!this.isQcInputData(data)) {
            throw new Error('Invalid QC label data');
          }
          pdfProps = await prepareQcLabelData(data);
          palletNumber = data.palletNum;
          break;

        case PdfType.GRN_LABEL:
          if (!this.isGrnInputData(data)) {
            throw new Error('Invalid GRN label data');
          }
          pdfProps = await prepareGrnLabelData(data);
          palletNumber = data.palletNum;
          break;

        default:
          throw new Error(`Unsupported PDF type: ${type}`);
      }

      // 生成 PDF blob
      const element = React.createElement(PrintLabelPdf, pdfProps);
      const blob = await renderReactPDFToBlob(element);

      if (!blob) {
        throw new Error('PDF generation failed to return a blob');
      }

      // 處理上傳（如果啟用）
      let uploadUrl: string | undefined;
      if (config.uploadEnabled && palletNumber) {
        uploadUrl = await this.uploadPdf(blob, palletNumber, type);
      }

      return {
        success: true,
        blob,
        url: uploadUrl,
        metadata: {
          fileName: `${palletNumber.replace('/', '_')}.pdf`,
          fileSize: blob.size,
          palletNumber,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      safeError('[UnifiedPdfService] PDF generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * 批量生成 PDFs
   */
  public async generateBatch(
    type: PdfType,
    dataArray: Array<QcInputData | GrnInputData | QcLabelInputData | GrnLabelInputData | any>,
    options?: Partial<PdfConfig>,
    onProgress?: (
      current: number,
      total: number,
      status: 'Processing' | 'Success' | 'Failed'
    ) => void
  ): Promise<BatchPdfResult> {
    const results: PdfGenerationResult[] = [];
    const blobs: Blob[] = [];
    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    safeLog(`[UnifiedPdfService] Starting batch generation of ${dataArray.length} PDFs`);

    for (let i = 0; i < dataArray.length; i++) {
      if (onProgress) {
        onProgress(i + 1, dataArray.length, 'Processing');
      }

      const result = await this.generateSingle(type, dataArray[i], options);
      results.push(result);

      if (result.success && result.blob) {
        blobs.push(result.blob);
        if (result.url) {
          uploadedUrls.push(result.url);
        }
        if (onProgress) {
          onProgress(i + 1, dataArray.length, 'Success');
        }
      } else {
        errors.push(result.error || `Failed to generate PDF ${i + 1}`);
        if (onProgress) {
          onProgress(i + 1, dataArray.length, 'Failed');
        }
      }
    }

    return {
      successful: blobs.length,
      failed: errors.length,
      results,
      blobs,
      uploadedUrls,
      errors,
    };
  }

  /**
   * 合併多個 PDFs
   */
  public async mergePdfs(blobs: Blob[]): Promise<Blob> {
    if (blobs.length === 0) {
      throw new Error('No PDFs to merge');
    }

    if (blobs.length === 1) {
      return blobs[0];
    }

    safeLog(`[UnifiedPdfService] Merging ${blobs.length} PDFs`);

    try {
      const buffers = await Promise.all(blobs.map(blob => blob.arrayBuffer()));
      const mergedBytes = await mergePDFs(buffers);
      // 轉換為標準 ArrayBuffer 以解決類型兼容性問題
      const arrayBuffer = new ArrayBuffer(mergedBytes.length);
      const view = new Uint8Array(arrayBuffer);
      view.set(mergedBytes);
      const mergedBlob = new Blob([arrayBuffer], { type: 'application/pdf' });

      safeLog(`[UnifiedPdfService] Successfully merged ${blobs.length} PDFs`);
      return mergedBlob;
    } catch (error) {
      safeError('[UnifiedPdfService] PDF merge failed:', error);
      throw new Error(
        `Failed to merge PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 上傳 PDF 到存儲
   */
  private async uploadPdf(
    blob: Blob,
    palletNumber: string,
    type: PdfType
  ): Promise<string | undefined> {
    try {
      // 轉換 blob 為 number array
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const numberArray = Array.from(uint8Array);

      // 生成檔案名
      const fileName = `${palletNumber.replace('/', '_')}.pdf`;

      // 根據類型選擇上傳函數
      let uploadResult: { publicUrl?: string; error?: string };
      let updateResult: { success?: boolean; error?: string } | undefined;

      if (type === PdfType.QC_LABEL) {
        uploadResult = await uploadPdfToStorageQc(numberArray, fileName, 'qc-labels');
        if (uploadResult.publicUrl) {
          updateResult = await updatePalletPdfUrlQc(palletNumber, uploadResult.publicUrl);
        }
      } else if (type === PdfType.GRN_LABEL) {
        uploadResult = await uploadPdfToStorageGrn(numberArray, fileName, 'grn-labels');
        if (uploadResult.publicUrl) {
          updateResult = await updatePalletPdfUrlGrn(palletNumber, uploadResult.publicUrl);
        }
      } else {
        return undefined;
      }

      if (uploadResult.error) {
        throw new Error(`Upload failed: ${uploadResult.error}`);
      }

      if (updateResult && updateResult.error) {
        safeWarn(
          `[UnifiedPdfService] Failed to update PDF URL for pallet ${palletNumber}:`,
          updateResult.error
        );
      }

      return uploadResult.publicUrl;
    } catch (error) {
      safeError('[UnifiedPdfService] PDF upload failed:', error);
      throw error;
    }
  }

  /**
   * 獲取配置（合併默認和自定義）
   */
  private getConfig(type: PdfType, customConfig?: Partial<PdfConfig>): PdfConfig {
    const defaultConfig = this.config.get(type) || { type };
    return { ...defaultConfig, ...customConfig };
  }

  /**
   * 類型守衛：檢查是否為 QC 輸入數據
   */
  private isQcInputData(data: any): data is QcInputData | QcLabelInputData {
    return (
      data &&
      typeof data.productCode === 'string' &&
      typeof data.productDescription === 'string' &&
      typeof data.quantity === 'number' &&
      typeof data.series === 'string' &&
      typeof data.palletNum === 'string'
    );
  }

  /**
   * 類型守衛：檢查是否為 GRN 輸入數據
   */
  private isGrnInputData(data: any): data is GrnInputData | GrnLabelInputData {
    return (
      data &&
      (typeof data.grnNumber === 'string' || typeof data.receivedBy === 'string') &&
      typeof data.productCode === 'string' &&
      typeof data.productDescription === 'string' &&
      typeof data.series === 'string' &&
      typeof data.palletNum === 'string'
    );
  }

  /**
   * 清理緩存（用於測試或資源釋放）
   */
  public clearCache() {
    clearPDFCache();
  }

  /**
   * 生成並打印 PDF
   * 整合 PDF 生成和打印服務，提供一站式解決方案
   */
  public async generateAndPrint<
    T extends QcInputData | GrnInputData | QcLabelInputData | GrnLabelInputData | any,
  >(
    type: PdfType,
    data: T,
    printOptions?: PdfPrintOptions,
    pdfOptions?: Partial<PdfConfig>
  ): Promise<PdfPrintResult> {
    const startTime = Date.now();

    try {
      safeLog(`[UnifiedPdfService] Starting generate and print for type ${type}`);

      // 1. 生成 PDF
      const pdfResult = await this.generateSingle(type, data, pdfOptions);

      if (!pdfResult.success || !pdfResult.blob) {
        return {
          success: false,
          jobId: this.generatePrintJobId(),
          error: pdfResult.error || 'PDF generation failed',
          pdfGenerated: false,
        };
      }

      const generationTime = Date.now() - startTime;
      safeLog(`[UnifiedPdfService] PDF generated in ${generationTime}ms`);

      // 2. 準備打印服務
      const printingService = getUnifiedPrintingService();

      // 確保打印服務已初始化
      if (!printingService.isInitialized()) {
        await printingService.initialize();
      }

      // 3. 映射 PDF 類型到打印類型
      const printType = this.mapToPrintType(type);

      // 4. 準備打印請求
      const printRequest = {
        type: printType,
        pdfBlobs: [pdfResult.blob],
        options: {
          copies: printOptions?.copies || 1,
          paperSize: PaperSize.A4,
          orientation: 'portrait' as const,
          priority: (printOptions?.priority as PrintPriority) || PrintPriority.NORMAL,
          printerPreference: printOptions?.printerPreference,
        },
        metadata: {
          userId: 'system', // 可從當前用戶會話獲取
          source: 'unified-pdf-service',
          timestamp: new Date().toISOString(),
          uploadEnabled: printOptions?.uploadBeforePrint && !!pdfResult.metadata?.palletNumber,
          palletNumbers: pdfResult.metadata?.palletNumber
            ? [pdfResult.metadata.palletNumber]
            : undefined,
        },
      };

      // 5. 執行打印
      const printStartTime = Date.now();
      const printResult = await printingService.print(printRequest);
      const printTime = Date.now() - printStartTime;

      safeLog(
        `[UnifiedPdfService] Print job submitted in ${printTime}ms, jobId: ${printResult.jobId}`
      );

      // 6. 返回組合結果
      return {
        ...printResult,
        pdfGenerated: true,
        generationTime,
        printTime,
        pdfUrl: pdfResult.url,
      };
    } catch (error) {
      safeError('[UnifiedPdfService] Generate and print failed:', error);
      return {
        success: false,
        jobId: this.generatePrintJobId(),
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        pdfGenerated: false,
      };
    }
  }

  /**
   * 批量生成並打印 PDFs
   */
  public async generateAndPrintBatch<
    T extends QcInputData | GrnInputData | QcLabelInputData | GrnLabelInputData | any,
  >(
    type: PdfType,
    dataArray: T[],
    printOptions?: PdfPrintOptions,
    pdfOptions?: Partial<PdfConfig>,
    onProgress?: (
      current: number,
      total: number,
      status: 'Generating' | 'Printing' | 'Success' | 'Failed'
    ) => void
  ): Promise<{
    batchResult: BatchPdfResult;
    printResult?: PrintResult;
  }> {
    try {
      safeLog(
        `[UnifiedPdfService] Starting batch generate and print for ${dataArray.length} items`
      );

      // 1. 批量生成 PDFs
      const batchResult = await this.generateBatch(
        type,
        dataArray,
        pdfOptions,
        (current, total, status) => {
          if (onProgress) {
            onProgress(current, total, status === 'Processing' ? 'Generating' : status);
          }
        }
      );

      if (batchResult.blobs.length === 0) {
        safeWarn('[UnifiedPdfService] No PDFs generated for printing');
        return { batchResult };
      }

      // 2. 合併 PDFs（如果需要）
      let pdfToProcess: Blob;
      if (batchResult.blobs.length > 1 && printOptions?.immediateMode) {
        safeLog('[UnifiedPdfService] Merging PDFs for single print job');
        pdfToProcess = await this.mergePdfs(batchResult.blobs);
      } else {
        pdfToProcess = batchResult.blobs[0];
      }

      // 3. 準備打印
      const printingService = getUnifiedPrintingService();

      if (!printingService.isInitialized()) {
        await printingService.initialize();
      }

      const printType = this.mapToPrintType(type);

      // 4. 執行打印
      if (onProgress) {
        onProgress(dataArray.length, dataArray.length, 'Printing');
      }

      const printRequest = {
        type: printType,
        pdfBlobs:
          batchResult.blobs.length > 1 && !printOptions?.immediateMode
            ? batchResult.blobs
            : [pdfToProcess],
        options: {
          copies: printOptions?.copies || 1,
          paperSize: PaperSize.A4,
          orientation: 'portrait' as const,
          priority: (printOptions?.priority as PrintPriority) || PrintPriority.NORMAL,
          printerPreference: printOptions?.printerPreference,
        },
        metadata: {
          userId: 'system',
          source: 'unified-pdf-service-batch',
          timestamp: new Date().toISOString(),
          labelCount: batchResult.blobs.length,
          uploadEnabled: printOptions?.uploadBeforePrint,
          palletNumbers: batchResult.results
            .filter(r => r.metadata?.palletNumber)
            .map(r => r.metadata!.palletNumber!),
        },
      };

      const printResult = await printingService.print(printRequest);

      if (onProgress) {
        onProgress(dataArray.length, dataArray.length, printResult.success ? 'Success' : 'Failed');
      }

      safeLog(
        `[UnifiedPdfService] Batch print completed: ${printResult.success ? 'Success' : 'Failed'}`
      );

      return {
        batchResult,
        printResult,
      };
    } catch (error) {
      safeError('[UnifiedPdfService] Batch generate and print failed:', error);
      throw error;
    }
  }

  /**
   * 映射 PDF 類型到打印類型
   */
  private mapToPrintType(pdfType: PdfType): PrintType {
    switch (pdfType) {
      case PdfType.QC_LABEL:
        return PrintType.QC_LABEL;
      case PdfType.GRN_LABEL:
        return PrintType.GRN_LABEL;
      case PdfType.REPORT:
        return PrintType.INVENTORY_REPORT;
      case PdfType.CUSTOM:
        return PrintType.CUSTOM_DOCUMENT;
      default:
        return PrintType.CUSTOM_DOCUMENT;
    }
  }

  /**
   * 生成打印作業 ID
   */
  private generatePrintJobId(): string {
    return `pdf-print-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 導出便捷函數
export const unifiedPdfService = UnifiedPdfService.getInstance();
