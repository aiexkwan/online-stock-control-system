/**
 * 統一 PDF 服務
 * 集中管理所有 PDF 相關庫的使用，避免重複載入
 */

import type { PDFDocument as PDFDocumentType } from 'pdf-lib';
import type { jsPDF as jsPDFType } from 'jspdf';
import type { pdf as ReactPDFType } from '@react-pdf/renderer';

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
    console.log('[UnifiedPDFService] Loading pdf-lib...');
    pdfLibraryCache.pdfLib = await import('pdf-lib');
  }
  return pdfLibraryCache.pdfLib;
}

/**
 * 動態載入 jsPDF
 */
export async function getJsPDF() {
  if (!pdfLibraryCache.jsPDF) {
    console.log('[UnifiedPDFService] Loading jsPDF...');
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
    console.log('[UnifiedPDFService] Loading @react-pdf/renderer...');
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
  const { pdf } = await getReactPDF();
  return await pdf(element).toBlob();
}

/**
 * 合併多個 PDF 文件
 */
export async function mergePDFs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  const { PDFDocument } = await getPDFLib();
  const mergedPdf = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    if (buffer.byteLength === 0) {
      console.warn('[UnifiedPDFService] Skipping empty PDF buffer');
      continue;
    }

    try {
      const pdfDoc = await PDFDocument.load(buffer);
      const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    } catch (error) {
      console.error('[UnifiedPDFService] Error loading PDF for merging:', error);
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
