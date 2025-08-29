/**
 * UnifiedPdfService 使用範例
 * 展示如何使用統一 PDF 服務生成 QC 和 GRN 標籤
 */

import { unifiedPdfService, PdfType } from './unified-pdf-service';
import type { QcInputData, GrnInputData } from '@/lib/pdfUtils';

// ==========================================
// 範例 1: 生成單個 QC 標籤
// ==========================================
async function generateSingleQcLabel() {
  const qcData: QcInputData = {
    productCode: 'PROD-001',
    productDescription: 'Premium Widget',
    quantity: 100,
    series: 'SER-2024-001',
    palletNum: 'PLT/2024/001',
    operatorClockNum: 'OP-123',
    qcClockNum: 'QC-456',
    workOrderNumber: 'WO-2024-001',
    workOrderName: 'Production Batch 1',
    productType: 'Standard',
  };

  const result = await unifiedPdfService.generateSingle(PdfType.QC_LABEL, qcData, {
    uploadEnabled: true,
  });

  if (result.success) {
    console.log('QC 標籤生成成功:', {
      fileName: result.metadata?.fileName,
      fileSize: result.metadata?.fileSize,
      uploadUrl: result.url,
    });
    // 可以使用 result.blob 進行列印或其他操作
  } else {
    console.error('QC 標籤生成失敗:', result.error);
  }
}

// ==========================================
// 範例 2: 生成單個 GRN 標籤
// ==========================================
async function generateSingleGrnLabel() {
  const grnData: GrnInputData = {
    grnNumber: 'GRN-2024-001',
    materialSupplier: 'ABC Suppliers Ltd',
    productCode: 'MAT-001',
    productDescription: 'Raw Material - Steel',
    productType: 'Raw Material',
    netWeight: 500,
    series: 'SER-2024-002',
    palletNum: 'PLT/2024/002',
    receivedBy: 'REC-789',
    labelMode: 'weight',
  };

  const result = await unifiedPdfService.generateSingle(PdfType.GRN_LABEL, grnData, {
    uploadEnabled: true,
  });

  if (result.success) {
    console.log('GRN 標籤生成成功:', {
      fileName: result.metadata?.fileName,
      fileSize: result.metadata?.fileSize,
      uploadUrl: result.url,
    });
  } else {
    console.error('GRN 標籤生成失敗:', result.error);
  }
}

// ==========================================
// 範例 3: 批量生成 QC 標籤
// ==========================================
async function generateBatchQcLabels() {
  const qcDataArray: QcInputData[] = [
    {
      productCode: 'PROD-001',
      productDescription: 'Premium Widget',
      quantity: 100,
      series: 'SER-2024-001',
      palletNum: 'PLT/2024/001',
      operatorClockNum: 'OP-123',
      qcClockNum: 'QC-456',
    },
    {
      productCode: 'PROD-002',
      productDescription: 'Standard Widget',
      quantity: 200,
      series: 'SER-2024-002',
      palletNum: 'PLT/2024/002',
      operatorClockNum: 'OP-123',
      qcClockNum: 'QC-456',
    },
    {
      productCode: 'PROD-003',
      productDescription: 'Basic Widget',
      quantity: 300,
      series: 'SER-2024-003',
      palletNum: 'PLT/2024/003',
      operatorClockNum: 'OP-123',
      qcClockNum: 'QC-456',
    },
  ];

  const batchResult = await unifiedPdfService.generateBatch(
    PdfType.QC_LABEL,
    qcDataArray,
    { uploadEnabled: true },
    (current, total, status) => {
      console.log(`處理進度: ${current}/${total} - ${status}`);
    }
  );

  console.log('批量生成結果:', {
    成功: batchResult.successful,
    失敗: batchResult.failed,
    上傳的URLs: batchResult.uploadedUrls,
    錯誤: batchResult.errors,
  });

  // 如果需要合併所有 PDFs
  if (batchResult.blobs.length > 0) {
    const mergedPdf = await unifiedPdfService.mergePdfs(batchResult.blobs);
    console.log('合併後的 PDF 大小:', mergedPdf.size);
  }
}

// ==========================================
// 範例 4: 自定義配置
// ==========================================
async function generateWithCustomConfig() {
  // 更新 QC 標籤的默認配置
  unifiedPdfService.updateConfig(PdfType.QC_LABEL, {
    paperSize: 'Letter',
    orientation: 'landscape',
    margin: { top: 30, right: 30, bottom: 30, left: 30 },
  });

  const qcData: QcInputData = {
    productCode: 'PROD-CUSTOM',
    productDescription: 'Custom Product',
    quantity: 50,
    series: 'SER-CUSTOM',
    palletNum: 'PLT/CUSTOM/001',
    operatorClockNum: 'OP-999',
    qcClockNum: 'QC-999',
  };

  // 也可以在單次生成時覆蓋配置
  const result = await unifiedPdfService.generateSingle(PdfType.QC_LABEL, qcData, {
    uploadEnabled: false, // 這次不上傳
    paperSize: 'A3', // 覆蓋默認的 Letter 尺寸
  });

  if (result.success && result.blob) {
    // 直接使用 blob，例如創建下載連結
    const url = URL.createObjectURL(result.blob);
    console.log('PDF 下載連結:', url);
    // 記得在使用後釋放 URL
    // URL.revokeObjectURL(url);
  }
}

// ==========================================
// 範例 5: 錯誤處理
// ==========================================
async function demonstrateErrorHandling() {
  try {
    // 嘗試使用無效數據
    const invalidData = {
      // 缺少必要欄位
      productCode: 'INVALID',
    };

    const result = await unifiedPdfService.generateSingle(PdfType.QC_LABEL, invalidData as any, {
      uploadEnabled: false,
    });

    if (!result.success) {
      console.error('預期的錯誤:', result.error);
      // 處理錯誤，例如顯示錯誤訊息給用戶
    }
  } catch (error) {
    console.error('未預期的錯誤:', error);
    // 處理未預期的錯誤
  }
}

// ==========================================
// 範例 6: 清理資源
// ==========================================
function cleanupResources() {
  // 在應用關閉或不再需要時清理緩存
  unifiedPdfService.clearCache();
  console.log('PDF 服務緩存已清理');
}

// 導出範例函數供測試使用
export {
  generateSingleQcLabel,
  generateSingleGrnLabel,
  generateBatchQcLabels,
  generateWithCustomConfig,
  demonstrateErrorHandling,
  cleanupResources,
};
