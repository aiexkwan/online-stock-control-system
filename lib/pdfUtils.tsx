import { SupabaseClient } from '@supabase/supabase-js'; // For type hinting Supabase client
import { renderReactPDFToBlob, loadPDF, createPDFDocument } from './services/unified-pdf-service';
import { PrintLabelPdf, PrintLabelPdfProps } from '../components/print-label-pdf/PrintLabelPdf';

// Define an interface for the expected structure of getPublicUrl response
interface StoragePublicUrlResponse {
  data: { publicUrl: string } | null;
  error: Error | null; // Or import a more specific StorageError type from Supabase if available
}

/**
 * Generates a PDF filename based on the pallet number.
 * Example: if palletNum is "080808/14", returns "080808_14.pdf".
 * @param palletNum - The pallet number string.
 * @returns The formatted PDF filename.
 * @throws Error if palletNum is empty.
 */
export function generatePalletPdfFileName(palletNum: string): string {
  if (!palletNum || palletNum.trim() === '') {
    //throw new Error('Pallet number cannot be empty for PDF naming.');
  }
  // Replace all occurrences of '/' with '_'
  const safePalletNum = palletNum.replace(/\//g, '_');
  return `${safePalletNum}.pdf`;
}

// ============================================================================
// 向後兼容性：重新導出統一映射器
// ============================================================================

// 導入新的統一映射器
import {
  prepareQcLabelData as newPrepareQcLabelData,
  prepareGrnLabelData as newPrepareGrnLabelData,
  type QcLabelInputData,
  type GrnLabelInputData,
} from './mappers/pdf-data-mappers';

// 向後兼容性：保持原有的類型別名
export type QcInputData = QcLabelInputData;
export type GrnInputData = GrnLabelInputData;

// 向後兼容性：重新導出函數，保持現有接口不變
export const prepareQcLabelData = newPrepareQcLabelData;
export const prepareGrnLabelData = newPrepareGrnLabelData;

// Generic function to generate PDF and upload to Supabase storage
export async function generateAndUploadPdf({
  pdfProps,
  fileName,
  storagePath, // e.g., 'grn_labels' or 'qc_labels'
  supabaseClient,
  useApiUpload = false, // 新參數：是否使用 API 路由上傳
}: {
  pdfProps: PrintLabelPdfProps;
  fileName?: string;
  storagePath?: string;
  supabaseClient: SupabaseClient;
  useApiUpload?: boolean;
}): Promise<{ publicUrl: string; blob: Blob }> {
  const palletNum = pdfProps.palletNum;
  if (!palletNum) {
    console.error(
      '[pdfUtils.generateAndUploadPdf] Pallet number is missing in pdfProps. This is critical for naming and potentially content.'
    );
  }

  console.log('[pdfUtils.generateAndUploadPdf] 開始生成 PDF...', {
    palletNum,
    useApiUpload,
    storagePath: storagePath || 'pallet-label-pdf',
    pdfPropsKeys: Object.keys(pdfProps),
  });

  let blob: Blob | null = null;
  try {
    console.log('[pdfUtils.generateAndUploadPdf] 調用 @react-pdf/renderer...');
    blob = await renderReactPDFToBlob(<PrintLabelPdf {...pdfProps} />);
    console.log('[pdfUtils.generateAndUploadPdf] PDF 渲染完成:', {
      blobExists: !!blob,
      blobSize: blob?.size,
      blobType: blob?.type,
    });
  } catch (renderError: unknown) {
    console.error(
      '[pdfUtils.generateAndUploadPdf] Error during @react-pdf/renderer toBlob():',
      renderError
    );
    throw new Error(
      `PDF render failed for ${palletNum || 'UNKNOWN'}: ${renderError instanceof Error ? renderError.message : 'Unknown error'}`
    );
  }

  if (!blob) {
    console.error(
      '[pdfUtils.generateAndUploadPdf] PDF generation returned a null or undefined blob.'
    );
    throw new Error(
      `[pdfUtils.generateAndUploadPdf] PDF generation did not return a Blob for pallet ${palletNum || 'UNKNOWN'}.`
    );
  }

  console.log(
    `[pdfUtils.generateAndUploadPdf] Generated blob for pallet ${palletNum || 'UNKNOWN'}. Size: ${blob.size}, Type: ${blob.type}`
  );

  if (blob.size === 0) {
    console.warn(
      `[pdfUtils.generateAndUploadPdf] Generated PDF blob for pallet ${palletNum || 'UNKNOWN'} has a size of 0. This will likely result in an empty PDF.`
    );
  }

  const finalSupabaseFileName = palletNum
    ? generatePalletPdfFileName(palletNum)
    : `unknown_pallet_${Date.now()}.pdf`;
  const bucketName = storagePath || 'pallet-label-pdf';

  console.log(`[pdfUtils.generateAndUploadPdf] 準備上傳...`, {
    fileName: finalSupabaseFileName,
    bucketName,
    useApiUpload,
  });

  if (useApiUpload) {
    console.log('[pdfUtils.generateAndUploadPdf] 使用 API 路由上傳...');
    try {
      // 使用 API 路由上傳
      const formData = new FormData();
      formData.append('file', blob, finalSupabaseFileName);
      formData.append('fileName', finalSupabaseFileName);
      formData.append('storagePath', bucketName);

      console.log('[pdfUtils.generateAndUploadPdf] 發送到 /api/upload-pdf...');
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[pdfUtils.generateAndUploadPdf] API upload failed:', errorData);
        throw new Error(`API upload failed: ${errorData.error}`);
      }

      const result = await response.json();
      console.log('[pdfUtils.generateAndUploadPdf] API 上傳成功:', result);

      return { publicUrl: result.publicUrl, blob };
    } catch (apiError: unknown) {
      console.error('[pdfUtils.generateAndUploadPdf] API upload error:', apiError);
      throw new Error(
        `API upload failed for ${finalSupabaseFileName}: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`
      );
    }
  } else {
    console.log('[pdfUtils.generateAndUploadPdf] 使用直接 Supabase 客戶端上傳...');
    // 原有的直接上傳邏輯
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from(bucketName)
      .upload(finalSupabaseFileName, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });

    if (uploadError) {
      console.error('[pdfUtils.generateAndUploadPdf] Supabase Upload Error:', uploadError);
      throw new Error(
        `[pdfUtils.generateAndUploadPdf] Supabase Upload Failed for ${finalSupabaseFileName}: ${uploadError.message}`
      );
    }

    if (!uploadData || !uploadData.path) {
      console.error(
        `[pdfUtils.generateAndUploadPdf] Upload for ${finalSupabaseFileName} succeeded but no path was returned from Supabase.`
      );
      throw new Error(
        `[pdfUtils.generateAndUploadPdf] Upload for ${finalSupabaseFileName} succeeded but no path was returned from Supabase.`
      );
    }

    console.log(
      `[pdfUtils.generateAndUploadPdf] File uploaded successfully to Supabase. Path: ${uploadData.path}`
    );

    const publicUrlResult = (await supabaseClient.storage
      .from(bucketName)
      .getPublicUrl(uploadData.path)) as StoragePublicUrlResponse;

    const urlError = publicUrlResult.error;
    const urlData = publicUrlResult.data;

    if (urlError) {
      console.error(
        `[pdfUtils.generateAndUploadPdf] Error getting public URL for ${uploadData.path}:`,
        urlError
      );
      throw new Error(
        `[pdfUtils.generateAndUploadPdf] Failed to get public URL for ${uploadData.path}: ${urlError.message}`
      );
    }

    if (!urlData || !urlData.publicUrl) {
      console.error(
        `[pdfUtils.generateAndUploadPdf] Failed to get public URL for ${uploadData.path} (no URL in data).`
      );
      throw new Error(
        `[pdfUtils.generateAndUploadPdf] Failed to get public URL for ${uploadData.path}.`
      );
    }

    const publicUrl = urlData.publicUrl;
    console.log(`[pdfUtils.generateAndUploadPdf] Public URL: ${publicUrl}`);
    return { publicUrl: publicUrl, blob };
  }
}

/**
 * Merges multiple PDF documents (provided as ArrayBuffers) into a single PDF
 * and triggers the browser's print dialog.
 *
 * @param pdfArrayBuffers - An array of ArrayBuffers, each representing a PDF file.
 * @param mergedPdfName - Optional. The suggested filename for the merged PDF.
 * @returns Promise<void>
 */
export async function mergeAndPrintPdfs(
  pdfArrayBuffers: ArrayBuffer[],
  mergedPdfName: string = 'merged_document.pdf'
): Promise<void> {
  if (!pdfArrayBuffers || pdfArrayBuffers.length === 0) {
    console.error('[mergeAndPrintPdfs] No PDF documents provided.');
    return;
  }

  try {
    const mergedPdf = await createPDFDocument();
    for (const pdfBuffer of pdfArrayBuffers) {
      if (pdfBuffer.byteLength === 0) {
        console.warn('[mergeAndPrintPdfs] Encountered an empty ArrayBuffer, skipping.');
        continue;
      }
      try {
        const pdfToMerge = await loadPDF(pdfBuffer);
        const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
        copiedPages.forEach(page => {
          mergedPdf.addPage(page);
        });
      } catch (loadError) {
        console.error('[mergeAndPrintPdfs] Error loading one of the PDFs for merging:', loadError);
        // Optionally, decide if you want to continue merging other PDFs or stop
      }
    }

    if (mergedPdf.getPageCount() === 0) {
      console.error('[mergeAndPrintPdfs] Merged PDF has no pages.');
      return;
    }

    const mergedPdfBytes = await mergedPdf.save();
    // 轉換 Uint8Array 到 ArrayBuffer 以確保類型相容性
    const arrayBuffer = new ArrayBuffer(mergedPdfBytes.length);
    const uint8View = new Uint8Array(arrayBuffer);
    uint8View.set(mergedPdfBytes);

    const pdfBlob = new Blob([arrayBuffer], {
      type: 'application/pdf',
    });

    const url = URL.createObjectURL(pdfBlob);

    try {
      console.log('[mergeAndPrintPdfs] Using Web Print API for direct PDF printing.');

      // Use iframe method for better PDF rendering compatibility
      try {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Print Document</title>
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  html, body { width: 100%; height: 100%; overflow: hidden; }
                  iframe { 
                    width: 100%; 
                    height: 100vh; 
                    border: none; 
                    display: block;
                  }
                </style>
              </head>
              <body>
                <iframe id="pdfFrame" src="${url}" type="application/pdf"></iframe>
                <script>
                  let printAttempted = false;
                  
                  function attemptPrint() {
                    if (printAttempted) return;
                    printAttempted = true;
                    
                    try {
                      // Try to access iframe content and print
                      const iframe = document.getElementById('pdfFrame');
                      if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                      } else {
                        // Fallback to window print
                        window.focus();
                        window.print();
                      }
                      
                      // Close window after print dialog
                      setTimeout(function() {
                        window.close();
                      }, 2000);
                    } catch (e) {
                      console.log('Print access restricted, using window.print()');
                      window.focus();
                      window.print();
                      setTimeout(function() {
                        window.close();
                      }, 2000);
                    }
                  }
                  
                  // Multiple methods to ensure printing triggers
                  document.getElementById('pdfFrame').onload = function() {
                    setTimeout(attemptPrint, 1000);
                  };
                  
                  // Backup timer
                  setTimeout(attemptPrint, 3000);
                  
                  // Manual print trigger for user
                  document.addEventListener('keydown', function(e) {
                    if (e.ctrlKey && e.key === 'p') {
                      e.preventDefault();
                      attemptPrint();
                    }
                  });
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();

          // Clean up after some time
          setTimeout(() => {
            URL.revokeObjectURL(url);
            console.log('[mergeAndPrintPdfs] Print window method completed, blob URL cleaned up.');
          }, 10000);
        } else {
          throw new Error('Could not open print window');
        }
      } catch (windowError) {
        console.error('[mergeAndPrintPdfs] Print window method failed:', windowError);
        // Fallback: Direct download
        const link = document.createElement('a');
        link.href = url;
        link.download = mergedPdfName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('[mergeAndPrintPdfs] Fallback to download completed.');
      }
    } catch (error) {
      console.error('[mergeAndPrintPdfs] Error in print process:', error);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('[mergeAndPrintPdfs] Failed to merge and print PDFs:', error);
  }
}
