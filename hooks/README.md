# 統一 PDF 生成 Hook

## 概述

`useUnifiedPdfGeneration` 是一個統一的 React Hook，用於管理所有 PDF 生成相關的功能。它整合了統一 PDF 服務和數據映射器，提供了完整的 PDF 生成解決方案。

## 功能特性

- ✅ 單個 PDF 生成
- ✅ 批量 PDF 生成
- ✅ 進度追蹤
- ✅ 錯誤處理
- ✅ 數據驗證
- ✅ 自動合併 PDF
- ✅ 取消操作支援
- ✅ 資源清理
- ✅ TypeScript 支援

## 支援的 PDF 類型

- `QC_LABEL` - QC 品質控制標籤
- `GRN_LABEL` - GRN 貨物收據標籤

## 基本用法

### 導入 Hook

```typescript
import { useUnifiedPdfGeneration } from '@/hooks/useUnifiedPdfGeneration';
import { PdfType } from '@/lib/services/unified-pdf-service';
```

### 生成單個 PDF

```typescript
const { generateSingle, state } = useUnifiedPdfGeneration();

const handleGenerateQcLabel = async () => {
  const result = await generateSingle({
    type: PdfType.QC_LABEL,
    data: {
      productCode: 'PROD001',
      productDescription: 'Test Product',
      quantity: 100,
      series: 'SER001',
      palletNum: 'PAL/001',
      operatorClockNum: 'OP123',
      qcClockNum: 'QC456',
    },
    config: {
      uploadEnabled: true,
      storageFolder: 'qc-labels',
    },
    showSuccessToast: true,
    showErrorToast: true,
  });

  if (result.success) {
    console.log('PDF generated:', result.url);
  }
};
```

### 批量生成 PDF

```typescript
const { generateBatch } = useUnifiedPdfGeneration();

const handleBatchGenerate = async () => {
  const dataArray = [
    {
      /* QC data 1 */
    },
    {
      /* QC data 2 */
    },
    {
      /* QC data 3 */
    },
  ];

  const result = await generateBatch({
    type: PdfType.QC_LABEL,
    dataArray,
    autoMerge: true, // 自動合併為單個 PDF
    onProgress: (current, total, status, message) => {
      console.log(`Progress: ${current}/${total} - ${status} - ${message}`);
    },
  });

  // 處理結果
  console.log(`成功: ${result.successful}, 失敗: ${result.failed}`);

  // 獲取合併後的 PDF（如果啟用了 autoMerge）
  if (result.mergedBlob) {
    // 下載合併的 PDF
    const url = URL.createObjectURL(result.mergedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged-labels.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }
};
```

### 進度監控

```typescript
const { state } = useUnifiedPdfGeneration();

// 顯示進度
if (state.isGenerating) {
  return (
    <div>
      <p>進度: {state.progress.current}/{state.progress.total}</p>
      <p>狀態: {state.progress.status}</p>
      <p>消息: {state.progress.message}</p>
    </div>
  );
}
```

### 錯誤處理

```typescript
const { state } = useUnifiedPdfGeneration();

// 顯示錯誤
if (state.error) {
  return <div>錯誤: {state.error}</div>;
}
```

### 取消操作

```typescript
const { cancel, state } = useUnifiedPdfGeneration();

const handleCancel = () => {
  if (state.isGenerating) {
    cancel();
  }
};
```

### 數據驗證

```typescript
const { validateInput } = useUnifiedPdfGeneration();

const handleValidate = () => {
  const validation = validateInput(PdfType.QC_LABEL, qcData);

  if (!validation.isValid) {
    console.error('驗證失敗:', validation.errors);
    return;
  }

  // 數據有效，可以進行生成
};
```

## API 參考

### Hook 返回值

```typescript
interface UseUnifiedPdfGenerationReturn {
  state: UnifiedPdfGenerationState;
  generateSingle: (options: SinglePdfOptions) => Promise<PdfGenerationResult>;
  generateBatch: (options: BatchPdfOptions) => Promise<ExtendedBatchPdfResult>;
  mergePdfs: (blobs: Blob[]) => Promise<Blob>;
  reset: () => void;
  cancel: () => void;
  validateInput: (type: PdfType, data: any) => { isValid: boolean; errors: string[] };
}
```

### 狀態結構

```typescript
interface UnifiedPdfGenerationState {
  isGenerating: boolean;
  isUploading: boolean;
  progress: {
    current: number;
    total: number;
    status: 'Processing' | 'Success' | 'Failed';
    message?: string;
  };
  lastResult: PdfGenerationResult | ExtendedBatchPdfResult | null;
  error: string | null;
}
```

### 選項接口

```typescript
interface SinglePdfOptions {
  type: PdfType;
  data: QcLabelInputData | GrnLabelInputData;
  config?: Partial<PdfConfig>;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

interface BatchPdfOptions {
  type: PdfType;
  dataArray: Array<QcLabelInputData | GrnLabelInputData>;
  config?: Partial<PdfConfig>;
  onProgress?: (current: number, total: number, status: string, message?: string) => void;
  autoMerge?: boolean;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}
```

## 最佳實踐

### 1. 錯誤處理

始終檢查結果的 `success` 屬性：

```typescript
const result = await generateSingle(options);
if (!result.success) {
  // 處理錯誤
  console.error('PDF 生成失敗:', result.error);
  return;
}
```

### 2. 進度回調

為長時間的批量操作提供用戶反饋：

```typescript
const result = await generateBatch({
  // ... 其他選項
  onProgress: (current, total, status, message) => {
    setProgressMessage(`${message} (${current}/${total})`);
  },
});
```

### 3. 資源清理

Hook 會自動處理資源清理，但在組件卸載前可以手動取消操作：

```typescript
useEffect(() => {
  return () => {
    if (state.isGenerating) {
      cancel();
    }
  };
}, []);
```

### 4. 數據驗證

在生成 PDF 之前驗證數據：

```typescript
const validation = validateInput(type, data);
if (!validation.isValid) {
  toast.error(`數據無效: ${validation.errors.join(', ')}`);
  return;
}
```

## 相關文件

- `useUnifiedPdfGeneration.ts` - Hook 主要實現
- `useUnifiedPdfGeneration.types.ts` - 完整類型定義
- `useUnifiedPdfGeneration.example.ts` - 使用示例
- `__tests__/useUnifiedPdfGeneration.test.ts` - 單元測試

## 依賴

- `@/lib/services/unified-pdf-service` - 統一 PDF 服務
- `@/lib/mappers/pdf-data-mappers` - PDF 數據映射器
- `sonner` - Toast 提示
- `react` - React Hooks
