/**
 * PDF 庫動態導入包裝器
 * 統一處理 PDF 相關庫的導入，避免重複載入
 */

// Cache PDF 相關庫
let pdfLibraries: {
  jsPDF?: typeof import('jspdf');
  pdfLib?: typeof import('pdf-lib');
  reactPdf?: typeof import('@react-pdf/renderer');
} = {};

export async function getJsPDF() {
  if (!pdfLibraries.jsPDF) {
    pdfLibraries.jsPDF = await import('jspdf');
  }
  return pdfLibraries.jsPDF;
}

export async function getPdfLib() {
  if (!pdfLibraries.pdfLib) {
    pdfLibraries.pdfLib = await import('pdf-lib');
  }
  return pdfLibraries.pdfLib;
}

export async function getReactPDF() {
  if (!pdfLibraries.reactPdf) {
    pdfLibraries.reactPdf = await import('@react-pdf/renderer');
  }
  return pdfLibraries.reactPdf;
}