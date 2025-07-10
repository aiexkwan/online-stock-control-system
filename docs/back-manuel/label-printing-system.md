# 標籤列印系統技術架構文檔

## 系統概述

NewPennine 標籤列印系統係一個企業級嘅打印解決方案，支援 QC 標籤、GRN 標籤同各種報告嘅生成同列印。系統採用模組化架構，整合咗 React PDF 生成、條碼技術、硬件抽象層（HAL）同統一列印服務。

## 核心模組架構

### 1. PDF 生成流程

#### 1.1 React PDF 技術棧
- **核心庫**: `@react-pdf/renderer`
- **PDF 組件**: `/components/print-label-pdf/PrintLabelPdf.tsx`
- **主要功能**:
  - 動態 PDF 生成
  - 支援 QC 標籤同 GRN 標籤兩種模式
  - 自動版面配置（A4 尺寸，每頁兩個標籤）

#### 1.2 PDF 生成流程
```typescript
// PDF 生成主要步驟
1. 準備數據 (prepareQcLabelData / prepareGrnLabelData)
2. 生成 QR Code (使用 qrcode 庫)
3. 渲染 PDF 組件 (<PrintLabelPdf {...props} />)
4. 轉換為 Blob (pdf().toBlob())
5. 上傳到 Supabase Storage
6. 更新數據庫 PDF URL
```

#### 1.3 關鍵實現細節
- **多頁合併**: 使用 `pdf-lib` 庫進行 PDF 合併
- **批量處理**: 支援批量生成多個標籤並合併為單一 PDF
- **錯誤恢復**: 每個標籤獨立生成，部分失敗不影響其他標籤

### 2. 條碼生成機制

#### 2.1 QR Code 生成
```typescript
// 使用 qrcode 庫生成 QR Code
import QRCode from 'qrcode';

const qrCodeDataUrl = await QRCode.toDataURL(dataForQr, {
  errorCorrectionLevel: 'M',
  margin: 1,
  width: 140,
});
```

#### 2.2 條碼內容
- **QC 標籤**: 系列號 (series)
- **GRN 標籤**: 系列號或產品代碼
- **格式**: Data URL (base64 編碼)

### 3. 表單驗證同數據流

#### 3.1 QC 標籤表單流程
```typescript
// 主要組件: /app/print-label/page.tsx
// 業務邏輯: useQcLabelBusiness hook

1. 產品代碼驗證 -> 獲取產品信息
2. 數量/計數驗證
3. ACO/Slate 特殊處理
4. 時鐘編號確認對話框
5. 生成 PDF 並列印
```

#### 3.2 GRN 標籤表單流程
```typescript
// 主要組件: /app/print-grnlabel/components/GrnLabelFormV2.tsx
// 業務邏輯: useGrnLabelBusinessV3 hook

1. GRN 編號/供應商驗證
2. 材料代碼驗證
3. 重量計算（毛重 -> 淨重）
4. 批量托盤處理
5. 統一 RPC 數據庫操作
```

#### 3.3 數據驗證層級
- **前端驗證**: 即時表單驗證，使用 touched 狀態管理
- **業務邏輯驗證**: Hook 層級的複雜驗證
- **Server Action 驗證**: Zod schema 驗證
- **數據庫約束**: Foreign key 同 unique 約束

### 4. 硬件整合（打印機、掃描器）

#### 4.1 硬件抽象層 (HAL)
```typescript
// 核心文件: /lib/hardware/hardware-abstraction-layer.ts

export class HardwareAbstractionLayer {
  private services: {
    printer: PrinterService;      // 打印機服務
    monitoring: MonitoringService; // 硬件監控
    queue: PrintQueueManager;      // 打印隊列
  };
  
  // 統一打印接口
  async print(job: PrintJob): Promise<PrintResult>
}
```

#### 4.2 統一列印服務
```typescript
// 核心文件: /lib/printing/services/unified-printing-service.ts

export class UnifiedPrintingService {
  // 打印請求處理
  async print(request: PrintRequest): Promise<PrintResult>
  
  // 批量打印
  async batchPrint(batch: BatchPrintRequest): Promise<BatchPrintResult>
  
  // 重印功能
  async reprint(historyId: string): Promise<PrintResult>
}
```

#### 4.3 打印隊列管理
- **優先級隊列**: 支援 normal/high/urgent 優先級
- **並發控制**: 同時處理多個打印任務
- **狀態監控**: 實時監控打印機狀態
- **錯誤重試**: 自動重試失敗任務

### 5. Server Actions 同 RPC 函數

#### 5.1 QC 標籤 Server Actions
```typescript
// 文件: /app/actions/qcActions.ts

// 批量創建數據庫記錄 (使用 RPC)
export async function createQcDatabaseEntriesBatch(
  productCode: string,
  quantity: number,
  count: number,
  clockNumber: string,
  // ... 其他參數
): Promise<DatabaseResult>

// PDF 上傳
export async function uploadPdfToStorage(
  pdfData: number[],
  fileName: string,
  bucketName: string
): Promise<UploadResult>
```

#### 5.2 GRN 標籤 Server Actions
```typescript
// 文件: /app/actions/grnActions.ts

// 統一 RPC 批量處理
export async function createGrnDatabaseEntriesBatch(
  grnNumber: string,
  productCode: string,
  supplierCode: string,
  // ... 其他參數
): Promise<BatchResult>
```

#### 5.3 RPC 函數優勢
- **原子性操作**: 數據庫事務保證
- **性能優化**: 減少網絡往返
- **錯誤回滾**: 自動處理失敗情況
- **托盤號生成**: 服務端統一管理

### 6. 錯誤處理同重試機制

#### 6.1 錯誤處理層級
```typescript
// GRN 錯誤處理器
class GrnErrorHandler {
  handleValidationError()    // 表單驗證錯誤
  handleSupplierError()      // 供應商錯誤
  handlePalletGenerationError() // 托盤生成錯誤
  handleDatabaseError()      // 數據庫錯誤
  handlePdfError()          // PDF 生成錯誤
}
```

#### 6.2 重試策略
```typescript
// 重試配置
const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000,
  EXPONENTIAL_BACKOFF: true,
  MAX_DELAY: 10000
};

// 支援重試的操作
- 托盤號生成
- PDF 上傳
- 數據庫操作
- 打印任務
```

#### 6.3 事務管理
```typescript
// 事務日誌服務
class TransactionLogService {
  startTransaction()    // 開始事務
  recordStep()         // 記錄步驟
  recordError()        // 記錄錯誤
  executeRollback()    // 執行回滾
  completeTransaction() // 完成事務
}
```

### 7. 性能優化（批量處理）

#### 7.1 批量 PDF 生成
- **並行生成**: 多個 PDF 同時生成
- **內存優化**: 流式處理大文件
- **進度追蹤**: 實時更新生成進度

#### 7.2 批量數據庫操作
- **統一 RPC**: 一次調用處理多筆記錄
- **批量插入**: 減少數據庫連接開銷
- **事務批處理**: 確保數據一致性

#### 7.3 打印優化
- **PDF 合併**: 多個標籤合併為單一打印任務
- **隊列管理**: 智能調度打印任務
- **緩存機制**: 重複打印使用緩存

## 系統架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                      前端應用層                              │
├─────────────────────────────────────────────────────────────┤
│  QC Label Form  │  GRN Label Form  │  PDF Review Page       │
│  (/print-label) │ (/print-grnlabel)│ (/pdf-review)          │
└────────┬────────┴────────┬─────────┴───────┬────────────────┘
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    業務邏輯層 (Hooks)                        │
├─────────────────────────────────────────────────────────────┤
│ useQcLabelBusiness │ useGrnLabelBusinessV3 │ usePdfGeneration│
│ useFormValidation  │ useWeightCalculation  │ usePrintIntegration│
└────────┬────────────────┬──────────────────┬────────────────┘
         │                │                  │
         ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   服務層 (Services)                          │
├─────────────────────────────────────────────────────────────┤
│ UnifiedPrintingService │ HardwareAbstractionLayer │         │
│ PrintQueueManager      │ ErrorHandler             │         │
│ TransactionLogService  │ PrintTemplateService     │         │
└────────┬───────────────┴──────────────────┬─────────────────┘
         │                                  │
         ▼                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  數據層 (Server Actions)                     │
├─────────────────────────────────────────────────────────────┤
│ qcActions.ts      │ grnActions.ts     │ storageActions.ts  │
│ RPC Functions     │ Database Queries  │ File Operations    │
└────────┬──────────┴────────┬──────────┴──────┬─────────────┘
         │                   │                 │
         ▼                   ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    基礎設施層                                │
├─────────────────────────────────────────────────────────────┤
│  Supabase DB  │  Supabase Storage  │  Hardware Devices     │
│  PostgreSQL   │  PDF Storage       │  Printers/Scanners    │
└───────────────┴────────────────────┴────────────────────────┘
```

## 關鍵文件清單

### 前端頁面
- `/app/print-label/page.tsx` - QC 標籤列印主頁
- `/app/print-grnlabel/page.tsx` - GRN 標籤列印主頁
- `/app/print-label/pdf-review/page.tsx` - PDF 預覽頁

### 業務邏輯 Hooks
- `/app/components/qc-label-form/hooks/useQcLabelBusiness.tsx`
- `/app/components/qc-label-form/hooks/modules/usePdfGeneration.tsx`
- `/app/print-grnlabel/hooks/useGrnLabelBusinessV3.tsx`

### PDF 生成組件
- `/components/print-label-pdf/PrintLabelPdf.tsx` - 核心 PDF 組件
- `/lib/pdfUtils.tsx` - PDF 工具函數
- `/app/components/print-label-pdf/PdfGenerator.tsx`

### 硬件服務
- `/lib/hardware/hardware-abstraction-layer.ts`
- `/lib/hardware/services/printer-service.ts`
- `/lib/hardware/services/print-queue-manager.ts`

### 統一列印服務
- `/lib/printing/services/unified-printing-service.ts`
- `/lib/printing/hooks/usePrinting.ts`
- `/lib/printing/components/PrintQueueMonitor.tsx`

### Server Actions
- `/app/actions/qcActions.ts`
- `/app/actions/grnActions.ts`
- `/app/actions/storageActions.ts`

### 錯誤處理
- `/app/print-grnlabel/services/ErrorHandler.ts`
- `/app/components/qc-label-form/services/ErrorHandler.ts`

## 最佳實踐建議

### 1. PDF 生成
- 使用 React 組件方式定義 PDF 模板
- 預先生成 QR Code 避免渲染延遲
- 批量生成時使用並行處理

### 2. 數據驗證
- 前端即時驗證提升用戶體驗
- Server Action 使用 Zod schema 確保類型安全
- 數據庫層級約束作為最後防線

### 3. 錯誤處理
- 使用統一錯誤處理器
- 實施事務日誌追蹤
- 提供清晰的用戶錯誤信息

### 4. 性能優化
- 使用 RPC 函數減少網絡請求
- 實施智能緩存策略
- 監控並優化瓶頸操作

### 5. 硬件整合
- 使用硬件抽象層隔離設備細節
- 實施隊列管理避免衝突
- 提供設備狀態實時監控

## 未來改進方向

1. **離線支援**: 實現離線 PDF 生成同緩存
2. **更多標籤類型**: 支援更多業務場景的標籤
3. **打印預覽**: 實時 PDF 預覽功能
4. **設備管理**: 更完善的打印機管理界面
5. **性能監控**: 詳細的性能指標追蹤
6. **國際化**: 支援多語言標籤內容