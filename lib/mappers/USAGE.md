# PDF 數據映射器使用指南

統一化 PDF 組件計劃 - 階段一任務2 的實現成果

## 概述

PDF 數據映射器提供統一的數據準備函數，將不同業務類型的數據（QC、GRN）轉換為統一的 PDF 屬性格式，消除重複的數據處理邏輯。

## 核心功能

### 1. 統一數據映射

- **`prepareQcLabelData`**: 將 QC 特定數據轉換為通用 PDF 屬性
- **`prepareGrnLabelData`**: 將 GRN 特定數據轉換為通用 PDF 屬性

### 2. 數據驗證

- **`validateQcLabelInput`**: 驗證 QC 標籤輸入數據
- **`validateGrnLabelInput`**: 驗證 GRN 標籤輸入數據

## 使用方法

### QC 標籤數據映射

```typescript
import { prepareQcLabelData, type QcLabelInputData } from '@/lib/mappers';

const qcInput: QcLabelInputData = {
  productCode: 'PROD001',
  productDescription: '測試產品',
  quantity: 100,
  series: 'SER001',
  palletNum: '123456/01',
  operatorClockNum: 'OP001',
  qcClockNum: 'QC001',
  workOrderNumber: 'WO001', // 可選，適用於 ACO 訂單
  workOrderName: '測試工作訂單', // 可選
  productType: 'ACO', // 可選
};

const pdfData = await prepareQcLabelData(qcInput);

// 結果可直接用於 PrintLabelPdf 組件
<PrintLabelPdf {...pdfData} />
```

### GRN 標籤數據映射

```typescript
import { prepareGrnLabelData, type GrnLabelInputData } from '@/lib/mappers';

const grnInput: GrnLabelInputData = {
  grnNumber: 'GRN001',
  materialSupplier: 'SUPPLIER001',
  productCode: 'PROD002',
  productDescription: '原材料',
  netWeight: 25.5,
  series: 'SER002',
  palletNum: '789012/03',
  receivedBy: 'REC001',
  labelMode: 'weight', // 可選，預設為 'weight'
};

const pdfData = await prepareGrnLabelData(grnInput);

// 結果可直接用於 PrintLabelPdf 組件
<PrintLabelPdf {...pdfData} />
```

### 數據驗證

```typescript
import {
  validateQcLabelInput,
  validateGrnLabelInput,
  type QcLabelInputData,
  type GrnLabelInputData,
} from '@/lib/mappers';

// QC 數據驗證
const qcValidation = validateQcLabelInput(qcInput);
if (!qcValidation.isValid) {
  console.error('QC 數據驗證失敗:', qcValidation.errors);
}

// GRN 數據驗證
const grnValidation = validateGrnLabelInput(grnInput);
if (!grnValidation.isValid) {
  console.error('GRN 數據驗證失敗:', grnValidation.errors);
}
```

## 向後兼容性

為了確保現有代碼的正常運行，原有的函數和類型別名仍然可用：

```typescript
// 以下導入方式仍然有效
import {
  prepareQcLabelData,
  prepareGrnLabelData,
  type QcInputData,
  type GrnInputData,
} from '@/lib/pdfUtils';

// 類型別名
// QcInputData = QcLabelInputData
// GrnInputData = GrnLabelInputData
```

## 輸出數據結構

兩個映射函數都輸出符合 `PrintLabelPdfProps` 介面的統一數據結構：

```typescript
interface PrintLabelPdfProps {
  // 基本產品資訊
  productCode: string;
  description: string;
  quantity: string | number;
  date: string; // 格式: 'dd-MMM-yyyy'

  // 人員資訊
  operatorClockNum: string;
  qcClockNum: string;

  // 標籤標識
  palletNum: string;
  qrCodeDataUrl: string; // QR 碼的數據 URL
  productType?: string;
  labelType: 'QC' | 'GRN';
  labelMode?: 'qty' | 'weight';

  // QC 專用欄位（僅在 QC 標籤中使用）
  qcWorkOrderNumber?: string;
  qcWorkOrderName?: string;

  // GRN 專用欄位（僅在 GRN 標籤中使用）
  grnNumber?: string;
  grnMaterialSupplier?: string;
}
```

## 特色功能

### 1. 自動 QR 碼生成

映射器會自動生成 QR 碼，優先使用系列號，備用產品代碼：

```typescript
// QR 碼數據優先級：series > productCode
const qrData = input.series || input.productCode;
```

### 2. 智能日期格式化

所有標籤都使用統一的日期格式：

```typescript
const labelDate = format(new Date(), 'dd-MMM-yyyy');
// 範例: '15-Aug-2024'
```

### 3. 標籤類型自動識別

映射器會自動設置正確的標籤類型和模式：

- QC 標籤：`labelType: 'QC'`
- GRN 標籤：`labelType: 'GRN'`, `labelMode: 'weight'` （預設）

## 測試

映射器包含完整的單元測試，確保功能正確性：

```bash
npm run vitest lib/mappers/__tests__/pdf-data-mappers.test.ts
```

## 架構優勢

1. **統一性**: 兩種業務類型使用相同的輸出格式
2. **可維護性**: 集中的數據處理邏輯，易於維護和更新
3. **類型安全**: 完整的 TypeScript 類型定義
4. **向後兼容**: 不影響現有代碼的使用
5. **測試覆蓋**: 完整的測試確保功能穩定性

## 後續計劃

這是 PDF 組件統一化計劃的第一階段成果。後續階段將包括：

- 階段二：統一 PDF 生成器
- 階段三：統一打印服務
- 階段四：完整的 PDF 管理系統
