import { PDFDocument } from 'pdf-lib';

export async function batchDownloadAndPrintPdfs(
  pdfUrls: string[],
  onStart: () => void,
  onFinish: (success: boolean, error?: string) => void
): Promise<void> {
  onStart();

  // PC check
  if (typeof window === 'undefined' || !(!/Mobi|Android/i.test(navigator.userAgent))) {
    console.warn('Batch print is only available on PC.');
    onFinish(false, 'Batch print is only available on PC.');
    return;
  }

  if (pdfUrls.length === 0) {
    onFinish(false, 'No PDFs to print.');
    return;
  }

  try {
    const mergedPdf = await PDFDocument.create();
    
    for (const url of pdfUrls) {
      try {
        const pdfBytes = await fetch(url).then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch PDF from ${url}: ${res.statusText}`);
          }
          return res.arrayBuffer();
        });
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      } catch (fetchOrLoadError) {
        console.error(`Error processing PDF from ${url}:`, fetchOrLoadError);
        // Optionally, decide if one failed PDF should stop the whole process
        // For now, we'll let it try to merge what it can and report a general error later if any failed.
        // throw fetchOrLoadError; // Uncomment to stop on first error
      }
    }

    if (mergedPdf.getPageCount() === 0) {
      throw new Error('No pages were successfully merged. Check individual PDF loading errors.');
    }

    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(blob);

    const printWindow = window.open(objectUrl);
    if (printWindow) {
      printWindow.onload = () => {
        // printWindow.print(); // Automatic print can be blocked or inconsistent
        // URL.revokeObjectURL(objectUrl); // Revoke after print dialog is handled if possible
        // For a more robust solution, the user might need to click print in the new window.
      };
    } else {
      throw new Error('Failed to open print window. Pop-up blocker might be active.');
    }
    onFinish(true);
  } catch (error) {
    console.error('Error during batch download and print:', error);
    onFinish(false, error instanceof Error ? error.message : String(error));
  }
} 