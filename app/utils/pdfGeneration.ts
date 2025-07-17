/**
 * Unified PDF Generation Module
 * 統一的 PDF 生成模組
 *
 * This module provides a consistent interface for PDF generation across the application.
 * 這個模組為整個應用提供一致的 PDF 生成介面。
 */

import { renderReactPDFToBlob } from '@/lib/services/unified-pdf-service';
import { type ReactElement } from 'react';

/**
 * PDF Generation Options
 * PDF 生成選項
 */
export interface PdfGenerationOptions {
  /** The React PDF component to render */
  component: ReactElement;
  /** Optional filename (without extension) */
  filename?: string;
  /** Whether to upload to storage */
  upload?: boolean;
  /** Storage path if uploading */
  storagePath?: string;
  /** Progress callback */
  onProgress?: (progress: number) => void;
}

/**
 * PDF Generation Result
 * PDF 生成結果
 */
export interface PdfGenerationResult {
  success: boolean;
  blob?: Blob;
  url?: string;
  publicUrl?: string;
  error?: string;
  filename?: string;
}

/**
 * Batch PDF Generation Options
 * 批量 PDF 生成選項
 */
export interface BatchPdfGenerationOptions {
  components: ReactElement[];
  filenames?: string[];
  upload?: boolean;
  storagePath?: string;
  batchSize?: number;
  onProgress?: (
    current: number,
    total: number,
    status: 'processing' | 'completed' | 'failed'
  ) => void;
  onItemComplete?: (index: number, result: PdfGenerationResult) => void;
}

/**
 * Generate a single PDF
 * 生成單個 PDF
 */
export async function generatePdf(options: PdfGenerationOptions): Promise<PdfGenerationResult> {
  try {
    const { component, filename, upload = false, storagePath, onProgress } = options;

    // Report initial progress
    onProgress?.(10);

    // Generate PDF blob
    const blob = await renderReactPDFToBlob(component);

    onProgress?.(50);

    // Create object URL
    const url = URL.createObjectURL(blob);

    const result: PdfGenerationResult = {
      success: true,
      blob,
      url,
      filename: filename ? `${filename}.pdf` : undefined,
    };

    // Upload to storage if requested
    if (upload && filename) {
      onProgress?.(70);

      const uploadResult = await uploadPdfToStorage(blob, `${filename}.pdf`, storagePath);
      if (uploadResult.success) {
        result.publicUrl = uploadResult.publicUrl;
      } else {
        result.error = uploadResult.error;
        result.success = false;
      }
    }

    onProgress?.(100);

    return result;
  } catch (error) {
    console.error('[generatePdf] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Generate multiple PDFs in batches
 * 批量生成多個 PDF
 */
export async function generatePdfsBatch(
  options: BatchPdfGenerationOptions
): Promise<PdfGenerationResult[]> {
  const {
    components,
    filenames = [],
    upload = false,
    storagePath,
    batchSize = 5,
    onProgress,
    onItemComplete,
  } = options;

  const results: PdfGenerationResult[] = [];
  const total = components.length;

  // Process in batches
  for (let i = 0; i < total; i += batchSize) {
    const batch = components.slice(i, i + batchSize);
    const batchFilenames = filenames.slice(i, i + batchSize);

    // Process batch in parallel
    const batchPromises = batch.map(async (component, index) => {
      const actualIndex = i + index;
      const filename = batchFilenames[index];

      onProgress?.(actualIndex + 1, total, 'processing');

      const result = await generatePdf({
        component,
        filename,
        upload,
        storagePath,
      });

      onProgress?.(actualIndex + 1, total, result.success ? 'completed' : 'failed');
      onItemComplete?.(actualIndex, result);

      return result;
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Merge multiple PDFs into one
 * 合併多個 PDF 為一個
 */
export async function mergePdfs(pdfBlobs: Blob[]): Promise<Blob | null> {
  try {
    // Dynamic import to avoid loading pdf-lib unless needed
    const { PDFDocument } = await import('pdf-lib');

    const mergedPdf = await PDFDocument.create();

    for (const blob of pdfBlobs) {
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    return new Blob([mergedBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error('[mergePdfs] Error:', error);
    return null;
  }
}

/**
 * Print PDFs
 * 列印 PDF
 */
export async function printPdfs(pdfBlobs: Blob[], merge: boolean = true): Promise<void> {
  try {
    let blobToPrint: Blob;

    if (merge && pdfBlobs.length > 1) {
      const mergedBlob = await mergePdfs(pdfBlobs);
      if (!mergedBlob) {
        throw new Error('Failed to merge PDFs');
      }
      blobToPrint = mergedBlob;
    } else if (pdfBlobs.length === 1) {
      blobToPrint = pdfBlobs[0];
    } else {
      throw new Error('No PDFs to print');
    }

    // Create iframe for printing
    const url = URL.createObjectURL(blobToPrint);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;

    document.body.appendChild(iframe);

    // Wait for iframe to load then print
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        // Clean up after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 1000);
      }, 100);
    };
  } catch (error) {
    console.error('[printPdfs] Error:', error);
    throw error;
  }
}

/**
 * Upload PDF to storage
 * 上傳 PDF 到儲存空間
 */
async function uploadPdfToStorage(
  blob: Blob,
  filename: string,
  storagePath: string = 'pdfs'
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    // Convert blob to array buffer then to number array for server action
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const numberArray = Array.from(uint8Array);

    // Use the appropriate upload action based on storage path
    let uploadResult;
    if (storagePath === 'qc-labels' || storagePath === 'grn-labels') {
      // Use server action for these paths
      const importedModule =
        storagePath === 'qc-labels'
          ? await import('@/app/actions/qcActions')
          : await import('@/app/actions/grnActions');

      uploadResult = await importedModule.uploadPdfToStorage(numberArray, filename, storagePath);
    } else {
      // Use API route for other paths
      const formData = new FormData();
      formData.append('file', blob, filename);
      formData.append('path', storagePath);

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      uploadResult = {
        publicUrl: data.publicUrl,
        error: data.error,
      };
    }

    if (uploadResult.error) {
      return { success: false, error: uploadResult.error };
    }

    return { success: true, publicUrl: uploadResult.publicUrl };
  } catch (error) {
    console.error('[uploadPdfToStorage] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Create a data URL from a PDF blob
 * 從 PDF blob 創建 data URL
 */
export function createPdfDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
