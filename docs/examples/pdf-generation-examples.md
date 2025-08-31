# PDF 生成系統使用範例

_最後更新日期: 2025-08-31_

## 概述

本文檔提供 `useUnifiedPdfGeneration` Hook 的完整使用範例，包括單個生成、批量生成、進度追蹤、錯誤處理等各種實際使用場景。這些範例已從生產代碼中提取，確保其實用性和正確性。

## 快速導航

- [基本 QC 標籤生成](#基本-qc-標籤生成)
- [批量 PDF 生成與進度追蹤](#批量-pdf-生成與進度追蹤)
- [GRN 標籤生成範例](#grn-標籤生成範例)
- [數據驗證使用範例](#數據驗證使用範例)
- [錯誤處理模式](#錯誤處理模式)
- [最佳實踐建議](#最佳實踐建議)

---

## 基本 QC 標籤生成

### 單個 QC 標籤生成範例

```typescript
import { useCallback } from 'react';
import { useUnifiedPdfGeneration } from '@/hooks/useUnifiedPdfGeneration';
import { PdfType } from '@/hooks/useUnifiedPdfGeneration.types';
import type { QcLabelInputData } from '@/hooks/useUnifiedPdfGeneration.types';

export const BasicQcLabelExample: React.FC = () => {
  const { state, generateSingle } = useUnifiedPdfGeneration();

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
      productType: 'ACO'
    };

    try {
      const result = await generateSingle({
        type: PdfType.QC_LABEL,
        data: qcData,
        config: {
          uploadEnabled: true,
          storageFolder: 'qc-labels-custom'
        },
        showSuccessToast: true,
        showErrorToast: true
      });

      if (result.success) {
        console.log('QC PDF 生成成功:', result.url);
      } else {
        console.error('QC PDF 生成失敗:', result.error);
      }
    } catch (error) {
      console.error('QC PDF 生成錯誤:', error);
    }
  }, [generateSingle]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">基本 QC 標籤生成</h3>

      <button
        onClick={handleGenerateSingleQc}
        disabled={state.isGenerating}
        className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
      >
        {state.isGenerating ? '生成中...' : '生成 QC 標籤'}
      </button>

      {/* 狀態顯示 */}
      {state.error && (
        <div className="rounded bg-red-50 p-4 text-red-600">
          錯誤: {state.error}
        </div>
      )}
    </div>
  );
};
```

---

## 批量 PDF 生成與進度追蹤

### 完整的批量生成範例

```typescript
export const BatchQcGenerationExample: React.FC = () => {
  const { state, generateBatch, cancel, reset } = useUnifiedPdfGeneration();

  const handleGenerateBatchQc = useCallback(async () => {
    const qcDataArray: QcLabelInputData[] = [
      {
        productCode: 'PROD001',
        productDescription: 'Test Product 1',
        quantity: 100,
        series: 'SER001',
        palletNum: 'PAL/001',
        operatorClockNum: 'OP123',
        qcClockNum: 'QC456'
      },
      {
        productCode: 'PROD002',
        productDescription: 'Test Product 2',
        quantity: 200,
        series: 'SER002',
        palletNum: 'PAL/002',
        operatorClockNum: 'OP123',
        qcClockNum: 'QC456'
      },
      {
        productCode: 'PROD003',
        productDescription: 'Test Product 3',
        quantity: 150,
        series: 'SER003',
        palletNum: 'PAL/003',
        operatorClockNum: 'OP123',
        qcClockNum: 'QC456'
      }
    ];

    try {
      const result = await generateBatch({
        type: PdfType.QC_LABEL,
        dataArray: qcDataArray,
        config: {
          uploadEnabled: true,
          storageFolder: 'qc-labels-batch'
        },
        autoMerge: true, // 自動合併為單個 PDF
        onProgress: (current, total, status, message) => {
          console.log(`進度: ${current}/${total} - ${status} - ${message}`);
        },
        showSuccessToast: true,
        showErrorToast: true
      });

      console.log('批量 QC PDF 生成結果:', result);

      // 處理自動合併的 PDF
      if ('mergedBlob' in result && result.mergedBlob) {
        console.log('合併後的 PDF 大小:', result.mergedBlob.size);

        // 下載合併後的 PDF
        const url = URL.createObjectURL(result.mergedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `batch-qc-labels-${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('批量 QC PDF 生成錯誤:', error);
    }
  }, [generateBatch]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">批量 QC 標籤生成</h3>

      <div className="flex space-x-2">
        <button
          onClick={handleGenerateBatchQc}
          disabled={state.isGenerating}
          className="rounded bg-green-500 px-4 py-2 text-white disabled:opacity-50"
        >
          批量生成 QC 標籤
        </button>

        <button
          onClick={cancel}
          disabled={!state.isGenerating}
          className="rounded bg-red-500 px-4 py-2 text-white disabled:opacity-50"
        >
          取消
        </button>

        <button
          onClick={reset}
          className="rounded bg-gray-500 px-4 py-2 text-white"
        >
          重置
        </button>
      </div>

      {/* 進度條顯示 */}
      {state.isGenerating && (
        <div className="rounded bg-blue-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span>生成進度:</span>
            <span>{state.progress.current}/{state.progress.total}</span>
          </div>

          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className={`h-2 rounded-full ${
                state.progress.status === 'Success'
                  ? 'bg-green-500'
                  : state.progress.status === 'Failed'
                    ? 'bg-red-500'
                    : 'bg-blue-500'
              }`}
              style={{
                width: `${(state.progress.current / state.progress.total) * 100}%`
              }}
            />
          </div>

          {state.progress.message && (
            <p className="mt-2 text-sm text-gray-600">
              {state.progress.message}
            </p>
          )}
        </div>
      )}

      {/* 結果顯示 */}
      {state.lastResult && (
        <div className="rounded bg-green-50 p-4">
          <h4 className="font-medium text-green-800">生成結果:</h4>
          <pre className="mt-2 text-sm text-green-600 overflow-auto">
            {JSON.stringify(state.lastResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
```

---

## GRN 標籤生成範例

### 帶數據驗證的 GRN 生成

```typescript
import type { GrnLabelInputData } from '@/hooks/useUnifiedPdfGeneration.types';

export const GrnLabelExample: React.FC = () => {
  const { state, generateSingle, generateBatch, mergePdfs, validateInput } =
    useUnifiedPdfGeneration();

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
      labelMode: 'weight'
    };

    // 先驗證數據
    const validation = validateInput(PdfType.GRN_LABEL, grnData);
    if (!validation.isValid) {
      console.error('驗證錯誤:', validation.errors);
      alert(`數據驗證失敗: ${validation.errors.join(', ')}`);
      return;
    }

    try {
      const result = await generateSingle({
        type: PdfType.GRN_LABEL,
        data: grnData,
        config: {
          uploadEnabled: true,
          storageFolder: 'grn-labels-custom'
        }
      });

      if (result.success) {
        console.log('GRN PDF 生成成功:', result.url);
      }
    } catch (error) {
      console.error('GRN PDF 生成錯誤:', error);
    }
  }, [generateSingle, validateInput]);

  // 批量生成（無自動合併）+ 手動合併
  const handleGenerateBatchGrnWithManualMerge = useCallback(async () => {
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
        labelMode: 'weight'
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
        labelMode: 'weight'
      }
    ];

    try {
      const result = await generateBatch({
        type: PdfType.GRN_LABEL,
        dataArray: grnDataArray,
        autoMerge: false, // 不自動合併
        onProgress: (current, total, status) => {
          console.log(`GRN 進度: ${current}/${total} - ${status}`);
        }
      });

      console.log('批量 GRN PDF 生成結果:', result);

      // 手動合併生成的 PDF
      if (result.blobs.length > 1) {
        try {
          const mergedBlob = await mergePdfs(result.blobs);
          console.log('手動合併的 PDF 大小:', mergedBlob.size);

          // 下載合併後的 PDF
          const url = URL.createObjectURL(mergedBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'merged-grn-labels.pdf';
          a.click();
          URL.revokeObjectURL(url);
        } catch (mergeError) {
          console.error('手動合併失敗:', mergeError);
        }
      }
    } catch (error) {
      console.error('批量 GRN PDF 生成錯誤:', error);
    }
  }, [generateBatch, mergePdfs]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">GRN 標籤生成範例</h3>

      <div className="flex space-x-2">
        <button
          onClick={handleGenerateSingleGrn}
          disabled={state.isGenerating}
          className="rounded bg-purple-500 px-4 py-2 text-white disabled:opacity-50"
        >
          生成單個 GRN 標籤
        </button>

        <button
          onClick={handleGenerateBatchGrnWithManualMerge}
          disabled={state.isGenerating}
          className="rounded bg-indigo-500 px-4 py-2 text-white disabled:opacity-50"
        >
          批量生成 + 手動合併
        </button>
      </div>

      {/* 狀態顯示（與 QC 組件相同的模式） */}
      {state.isGenerating && (
        <div className="rounded bg-purple-50 p-4">
          <p>
            正在生成 GRN 標籤... {state.progress.current}/{state.progress.total}
          </p>
        </div>
      )}
    </div>
  );
};
```

---

## 數據驗證使用範例

### 驗證功能演示

```typescript
export const DataValidationExample: React.FC = () => {
  const { validateInput } = useUnifiedPdfGeneration();

  const handleValidateQcData = useCallback(() => {
    // 故意使用無效數據來演示驗證功能
    const invalidQcData = {
      productCode: '', // 缺少產品代碼
      productDescription: 'Test Product',
      quantity: -1, // 無效數量
      // 缺少其他必需字段
    };

    const validation = validateInput(PdfType.QC_LABEL, invalidQcData);

    console.log('QC 驗證結果:', validation);

    if (!validation.isValid) {
      alert(`QC 數據驗證失敗:\n${validation.errors.join('\n')}`);
    } else {
      alert('QC 數據驗證通過！');
    }
  }, [validateInput]);

  const handleValidateGrnData = useCallback(() => {
    // 使用完全有效的 GRN 數據
    const validGrnData: GrnLabelInputData = {
      grnNumber: 'GRN001',
      materialSupplier: 'SUP001',
      productCode: 'PROD001',
      productDescription: 'Raw Material A',
      netWeight: 25.5,
      series: 'SER001',
      palletNum: 'PAL/001',
      receivedBy: 'REC123',
      labelMode: 'weight'
    };

    const validation = validateInput(PdfType.GRN_LABEL, validGrnData);

    console.log('GRN 驗證結果:', validation);

    if (!validation.isValid) {
      alert(`GRN 數據驗證失敗:\n${validation.errors.join('\n')}`);
    } else {
      alert('GRN 數據驗證通過！');
    }
  }, [validateInput]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">數據驗證範例</h3>

      <div className="flex space-x-2">
        <button
          onClick={handleValidateQcData}
          className="rounded bg-yellow-500 px-4 py-2 text-white"
        >
          驗證無效 QC 數據
        </button>

        <button
          onClick={handleValidateGrnData}
          className="rounded bg-green-500 px-4 py-2 text-white"
        >
          驗證有效 GRN 數據
        </button>
      </div>

      <div className="rounded bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          <strong>說明:</strong> 點擊按鈕後，請檢查瀏覽器控制台和彈出的警告框查看驗證結果。
          左邊的按鈕會展示驗證失敗的情況，右邊的按鈕會展示驗證成功的情況。
        </p>
      </div>
    </div>
  );
};
```

---

## 錯誤處理模式

### 完整的錯誤處理實現

```typescript
export const ErrorHandlingExample: React.FC = () => {
  const { state, generateSingle, reset } = useUnifiedPdfGeneration();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGenerateWithErrorHandling = useCallback(async () => {
    setLocalError(null);

    // 使用可能導致錯誤的數據
    const problematicData = {
      productCode: 'INVALID_CODE',
      productDescription: '',
      quantity: 0,
      // 缺少必需字段
    };

    try {
      const result = await generateSingle({
        type: PdfType.QC_LABEL,
        data: problematicData,
        showSuccessToast: false, // 關閉自動 toast，我們手動處理
        showErrorToast: false
      });

      if (result.success) {
        console.log('意外成功:', result);
      } else {
        setLocalError(result.error || '未知錯誤');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setLocalError(errorMessage);
      console.error('捕獲到錯誤:', error);
    }
  }, [generateSingle]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">錯誤處理範例</h3>

      <div className="flex space-x-2">
        <button
          onClick={handleGenerateWithErrorHandling}
          disabled={state.isGenerating}
          className="rounded bg-red-500 px-4 py-2 text-white disabled:opacity-50"
        >
          觸發錯誤測試
        </button>

        <button
          onClick={() => {
            reset();
            setLocalError(null);
          }}
          className="rounded bg-gray-500 px-4 py-2 text-white"
        >
          清除錯誤
        </button>
      </div>

      {/* 多層錯誤顯示 */}
      {(state.error || localError) && (
        <div className="rounded bg-red-50 border border-red-200 p-4">
          <h4 className="font-medium text-red-800">錯誤信息:</h4>

          {state.error && (
            <div className="mt-2">
              <p className="text-sm text-red-600">
                <strong>Hook 錯誤:</strong> {state.error}
              </p>
            </div>
          )}

          {localError && (
            <div className="mt-2">
              <p className="text-sm text-red-600">
                <strong>本地錯誤:</strong> {localError}
              </p>
            </div>
          )}

          <div className="mt-3 text-sm text-red-500">
            <p><strong>建議操作:</strong></p>
            <ul className="mt-1 ml-4 list-disc space-y-1">
              <li>檢查輸入數據的完整性</li>
              <li>確認網絡連接狀態</li>
              <li>查看控制台獲取詳細錯誤信息</li>
              <li>聯繫系統管理員（如持續錯誤）</li>
            </ul>
          </div>
        </div>
      )}

      <div className="rounded bg-blue-50 p-4">
        <h4 className="font-medium text-blue-800">錯誤處理策略:</h4>
        <ul className="mt-2 text-sm text-blue-600 space-y-1">
          <li>• <strong>預防性驗證:</strong> 使用 validateInput 在生成前檢查數據</li>
          <li>• <strong>多層錯誤處理:</strong> 同時處理 Promise rejection 和結果中的錯誤</li>
          <li>• <strong>用戶友好的錯誤信息:</strong> 將技術錯誤轉換為用戶可理解的消息</li>
          <li>• <strong>錯誤恢復:</strong> 提供重試或重置功能</li>
          <li>• <strong>錯誤記錄:</strong> 記錄錯誤以便後續分析</li>
        </ul>
      </div>
    </div>
  );
};
```

---

## 最佳實踐建議

### 1. 組件設計模式

```typescript
// 推薦的組件結構
export const PdfGenerationComponent: React.FC = () => {
  const { state, generateSingle, validateInput, reset, cancel } =
    useUnifiedPdfGeneration();

  // 1. 使用 useCallback 包裝異步操作
  const handleGenerate = useCallback(async () => {
    // 2. 先進行數據驗證
    const validation = validateInput(type, data);
    if (!validation.isValid) {
      // 處理驗證錯誤
      return;
    }

    try {
      // 3. 執行生成操作
      const result = await generateSingle(options);

      // 4. 處理結果
      if (result.success) {
        // 成功處理邏輯
      } else {
        // 失敗處理邏輯
      }
    } catch (error) {
      // 5. 異常處理
      console.error('Generation failed:', error);
    }
  }, [generateSingle, validateInput]);

  // 6. 組件卸載時的清理
  useEffect(() => {
    return () => {
      if (state.isGenerating) {
        cancel();
      }
    };
  }, [cancel, state.isGenerating]);

  return (
    // UI 渲染邏輯
  );
};
```

### 2. 性能優化建議

- **防抖操作**: 對於用戶頻繁觸發的操作，使用防抖機制
- **進度反饋**: 批量操作時始終提供進度反饋
- **資源清理**: 確保 PDF Blob URLs 被正確釋放
- **錯誤邊界**: 在適當的層級設置錯誤邊界

### 3. 用戶體驗指南

- **載入狀態**: 顯示清楚的載入指示器
- **操作反饋**: 提供成功/失敗的明確反饋
- **取消功能**: 為長時間操作提供取消選項
- **錯誤恢復**: 提供重試或替代方案

### 4. 安全考量

- **數據驗證**: 始終在客戶端和服務端進行數據驗證
- **權限檢查**: 確保用戶具有相應的操作權限
- **敏感信息**: 避免在日誌中記錄敏感數據

---

## 相關資源

### 文檔連結

- [hooks/index.ts](../../hooks/index.ts) - Hook 導出和 API 概覽
- [hooks/useUnifiedPdfGeneration.types.ts](../../hooks/useUnifiedPdfGeneration.types.ts) - 完整類型定義
- [hooks/useUnifiedPdfGeneration.ts](../../hooks/useUnifiedPdfGeneration.ts) - Hook 核心實現

### 測試與範例

- `hooks/__tests__/useUnifiedPdfGeneration.test.ts` - 單元測試
- `hooks/useUnifiedPdfGeneration.example.tsx` - 原始範例文件（已備份至此文檔）

### 相關服務

- `lib/services/unified-pdf-service.ts` - 底層 PDF 服務
- `lib/mappers/pdf-data-mappers.ts` - 數據映射器

---

## 版本歷史

- **v1.0.0** (2025-08-31): 初始版本，從生產代碼提取範例
  - 包含完整的 QC 和 GRN 標籤生成範例
  - 涵蓋單個生成、批量生成、進度追蹤等功能
  - 提供完整的錯誤處理和最佳實踐指南

---

_本文檔從 `hooks/useUnifiedPdfGeneration.example.tsx` 提取而來，確保範例的準確性和實用性。_
