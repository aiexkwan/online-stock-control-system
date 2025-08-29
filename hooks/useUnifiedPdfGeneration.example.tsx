/**
 * 統一 PDF 生成 Hook 使用示例
 * 統一化 PDF 組件計劃 - 階段一任務3
 *
 * 本文件提供 useUnifiedPdfGeneration Hook 的完整使用示例
 * 包括單個生成、批量生成、進度追蹤等各種使用場景
 *
 * @author AI Assistant
 * @version 1.0.0
 */

import React, { useCallback } from 'react';
import { useUnifiedPdfGeneration } from './useUnifiedPdfGeneration';
import { PdfType } from '../lib/services/unified-pdf-service';
import type { QcLabelInputData, GrnLabelInputData } from '../lib/mappers/pdf-data-mappers';

// ============================================================================
// 示例組件：QC 標籤生成
// ============================================================================

export const QcLabelGeneratorExample: React.FC = () => {
  const { state, generateSingle, generateBatch, reset, cancel, validateInput } =
    useUnifiedPdfGeneration();

  // 生成單個 QC 標籤
  const handleGenerateSingleQc = useCallback(async () => {
    const qcData: QcLabelInputData = {
      productCode: 'PROD001',
      productDescription: 'Test Product',
      quantity: 100,
      series: 'SER001',
      palletNum: 'PAL/001',
      operatorClockNum: 'OP123',
      qcClockNum: 'QC456',
      workOrderNumber: 'WO789',
      workOrderName: 'Test Work Order',
      productType: 'ACO',
    };

    try {
      const result = await generateSingle({
        type: PdfType.QC_LABEL,
        data: qcData,
        config: {
          uploadEnabled: true,
          storageFolder: 'qc-labels-custom',
        },
        showSuccessToast: true,
        showErrorToast: true,
      });

      console.log('QC PDF generation result:', result);
    } catch (error) {
      console.error('QC PDF generation error:', error);
    }
  }, [generateSingle]);

  // 批量生成 QC 標籤
  const handleGenerateBatchQc = useCallback(async () => {
    const qcDataArray: QcLabelInputData[] = [
      {
        productCode: 'PROD001',
        productDescription: 'Test Product 1',
        quantity: 100,
        series: 'SER001',
        palletNum: 'PAL/001',
        operatorClockNum: 'OP123',
        qcClockNum: 'QC456',
      },
      {
        productCode: 'PROD002',
        productDescription: 'Test Product 2',
        quantity: 200,
        series: 'SER002',
        palletNum: 'PAL/002',
        operatorClockNum: 'OP123',
        qcClockNum: 'QC456',
      },
      {
        productCode: 'PROD003',
        productDescription: 'Test Product 3',
        quantity: 150,
        series: 'SER003',
        palletNum: 'PAL/003',
        operatorClockNum: 'OP123',
        qcClockNum: 'QC456',
      },
    ];

    try {
      const result = await generateBatch({
        type: PdfType.QC_LABEL,
        dataArray: qcDataArray,
        config: {
          uploadEnabled: true,
          storageFolder: 'qc-labels-batch',
        },
        autoMerge: true, // 自動合併為單個 PDF
        onProgress: (current, total, status, message) => {
          console.log(`Progress: ${current}/${total} - ${status} - ${message}`);
        },
        showSuccessToast: true,
        showErrorToast: true,
      });

      console.log('Batch QC PDF generation result:', result);

      // 如果啟用了自動合併，可以獲取合併後的 PDF
      if ('mergedBlob' in result && result.mergedBlob) {
        console.log('Merged PDF size:', result.mergedBlob.size);
        // 可以下載或進一步處理合併後的 PDF
      }
    } catch (error) {
      console.error('Batch QC PDF generation error:', error);
    }
  }, [generateBatch]);

  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold'>QC 標籤生成示例</h2>

      <div className='flex space-x-2'>
        <button
          onClick={handleGenerateSingleQc}
          disabled={state.isGenerating}
          className='rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50'
        >
          生成單個 QC 標籤
        </button>

        <button
          onClick={handleGenerateBatchQc}
          disabled={state.isGenerating}
          className='rounded bg-green-500 px-4 py-2 text-white disabled:opacity-50'
        >
          批量生成 QC 標籤
        </button>

        <button onClick={reset} className='rounded bg-gray-500 px-4 py-2 text-white'>
          重置
        </button>

        <button
          onClick={cancel}
          disabled={!state.isGenerating}
          className='rounded bg-red-500 px-4 py-2 text-white disabled:opacity-50'
        >
          取消
        </button>
      </div>

      {/* 進度顯示 */}
      {state.isGenerating && (
        <div className='rounded bg-blue-50 p-4'>
          <div className='mb-2 flex items-center justify-between'>
            <span>生成進度:</span>
            <span>
              {state.progress.current}/{state.progress.total}
            </span>
          </div>
          <div className='h-2 w-full rounded-full bg-gray-200'>
            <div
              className={`h-2 rounded-full ${
                state.progress.status === 'Success'
                  ? 'bg-green-500'
                  : state.progress.status === 'Failed'
                    ? 'bg-red-500'
                    : 'bg-blue-500'
              }`}
              style={{
                width: `${(state.progress.current / state.progress.total) * 100}%`,
              }}
            />
          </div>
          {state.progress.message && (
            <p className='mt-2 text-sm text-gray-600'>{state.progress.message}</p>
          )}
        </div>
      )}

      {/* 錯誤顯示 */}
      {state.error && (
        <div className='rounded bg-red-50 p-4'>
          <h3 className='font-medium text-red-800'>錯誤:</h3>
          <p className='text-red-600'>{state.error}</p>
        </div>
      )}

      {/* 結果顯示 */}
      {state.lastResult && (
        <div className='rounded bg-green-50 p-4'>
          <h3 className='font-medium text-green-800'>生成結果:</h3>
          <pre className='mt-2 text-sm text-green-600'>
            {JSON.stringify(state.lastResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 示例組件：GRN 標籤生成
// ============================================================================

export const GrnLabelGeneratorExample: React.FC = () => {
  const { state, generateSingle, generateBatch, mergePdfs, validateInput } =
    useUnifiedPdfGeneration();

  // 生成單個 GRN 標籤
  const handleGenerateSingleGrn = useCallback(async () => {
    const grnData: GrnLabelInputData = {
      grnNumber: 'GRN001',
      materialSupplier: 'SUP001',
      productCode: 'PROD001',
      productDescription: 'Raw Material A',
      netWeight: 25.5,
      series: 'SER001',
      palletNum: 'PAL/001',
      receivedBy: 'REC123',
      labelMode: 'weight',
    };

    // 先驗證數據
    const validation = validateInput(PdfType.GRN_LABEL, grnData);
    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors);
      return;
    }

    try {
      const result = await generateSingle({
        type: PdfType.GRN_LABEL,
        data: grnData,
        config: {
          uploadEnabled: true,
          storageFolder: 'grn-labels-custom',
        },
      });

      console.log('GRN PDF generation result:', result);
    } catch (error) {
      console.error('GRN PDF generation error:', error);
    }
  }, [generateSingle, validateInput]);

  // 批量生成 GRN 標籤（無自動合併）
  const handleGenerateBatchGrn = useCallback(async () => {
    const grnDataArray: GrnLabelInputData[] = [
      {
        grnNumber: 'GRN001',
        materialSupplier: 'SUP001',
        productCode: 'PROD001',
        productDescription: 'Raw Material A',
        netWeight: 25.5,
        series: 'SER001',
        palletNum: 'PAL/001',
        receivedBy: 'REC123',
        labelMode: 'weight',
      },
      {
        grnNumber: 'GRN002',
        materialSupplier: 'SUP001',
        productCode: 'PROD002',
        productDescription: 'Raw Material B',
        netWeight: 30.2,
        series: 'SER002',
        palletNum: 'PAL/002',
        receivedBy: 'REC123',
        labelMode: 'weight',
      },
    ];

    try {
      const result = await generateBatch({
        type: PdfType.GRN_LABEL,
        dataArray: grnDataArray,
        autoMerge: false, // 不自動合併
        onProgress: (current, total, status) => {
          console.log(`GRN Progress: ${current}/${total} - ${status}`);
        },
      });

      console.log('Batch GRN PDF generation result:', result);

      // 手動合併生成的 PDF
      if (result.blobs.length > 1) {
        try {
          const mergedBlob = await mergePdfs(result.blobs);
          console.log('Manually merged PDF size:', mergedBlob.size);

          // 可以下載合併後的 PDF
          const url = URL.createObjectURL(mergedBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'merged-grn-labels.pdf';
          a.click();
          URL.revokeObjectURL(url);
        } catch (mergeError) {
          console.error('Manual merge failed:', mergeError);
        }
      }
    } catch (error) {
      console.error('Batch GRN PDF generation error:', error);
    }
  }, [generateBatch, mergePdfs]);

  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold'>GRN 標籤生成示例</h2>

      <div className='flex space-x-2'>
        <button
          onClick={handleGenerateSingleGrn}
          disabled={state.isGenerating}
          className='rounded bg-purple-500 px-4 py-2 text-white disabled:opacity-50'
        >
          生成單個 GRN 標籤
        </button>

        <button
          onClick={handleGenerateBatchGrn}
          disabled={state.isGenerating}
          className='rounded bg-indigo-500 px-4 py-2 text-white disabled:opacity-50'
        >
          批量生成 GRN 標籤
        </button>
      </div>

      {/* 狀態顯示（與 QC 組件相同的模式） */}
      {state.isGenerating && (
        <div className='rounded bg-purple-50 p-4'>
          <p>
            正在生成 GRN 標籤... {state.progress.current}/{state.progress.total}
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 示例組件：數據驗證演示
// ============================================================================

export const ValidationExample: React.FC = () => {
  const { validateInput } = useUnifiedPdfGeneration();

  const handleValidateQcData = useCallback(() => {
    const invalidQcData = {
      productCode: '', // 缺少產品代碼
      productDescription: 'Test Product',
      quantity: -1, // 無效數量
      // 缺少其他必需字段
    };

    const validation = validateInput(PdfType.QC_LABEL, invalidQcData);
    console.log('QC Validation Result:', validation);
  }, [validateInput]);

  const handleValidateGrnData = useCallback(() => {
    const validGrnData: GrnLabelInputData = {
      grnNumber: 'GRN001',
      materialSupplier: 'SUP001',
      productCode: 'PROD001',
      productDescription: 'Raw Material A',
      netWeight: 25.5,
      series: 'SER001',
      palletNum: 'PAL/001',
      receivedBy: 'REC123',
      labelMode: 'weight',
    };

    const validation = validateInput(PdfType.GRN_LABEL, validGrnData);
    console.log('GRN Validation Result:', validation);
  }, [validateInput]);

  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold'>數據驗證示例</h2>

      <div className='flex space-x-2'>
        <button
          onClick={handleValidateQcData}
          className='rounded bg-yellow-500 px-4 py-2 text-white'
        >
          驗證無效 QC 數據
        </button>

        <button
          onClick={handleValidateGrnData}
          className='rounded bg-green-500 px-4 py-2 text-white'
        >
          驗證有效 GRN 數據
        </button>
      </div>

      <p className='text-sm text-gray-600'>檢查瀏覽器控制台查看驗證結果</p>
    </div>
  );
};

// ============================================================================
// 組合示例組件
// ============================================================================

export const UnifiedPdfGenerationExample: React.FC = () => {
  return (
    <div className='mx-auto max-w-4xl space-y-8 p-6'>
      <h1 className='text-center text-2xl font-bold'>統一 PDF 生成 Hook 使用示例</h1>

      <div className='grid gap-8'>
        <QcLabelGeneratorExample />
        <GrnLabelGeneratorExample />
        <ValidationExample />
      </div>

      <div className='rounded bg-gray-50 p-4'>
        <h3 className='mb-2 font-medium text-gray-800'>使用注意事項：</h3>
        <ul className='space-y-1 text-sm text-gray-600'>
          <li>• 所有生成操作都是異步的，支持取消操作</li>
          <li>• 批量生成支持進度追蹤和自動合併</li>
          <li>• Hook 內建數據驗證，確保輸入數據有效</li>
          <li>• 支持自定義配置覆蓋預設值</li>
          <li>• 自動處理錯誤和成功提示（可選）</li>
          <li>• 組件卸載時自動清理資源</li>
        </ul>
      </div>
    </div>
  );
};

export default UnifiedPdfGenerationExample;
