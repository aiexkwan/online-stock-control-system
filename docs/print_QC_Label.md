# 列印 QC 標籤 (正常流程)

## 概述

本文件說明在系統中列印正常產品 QC 標籤的工作流程。此流程涉及使用者介面操作、後端邏輯處理、PDF 產生以及資料庫互動。

## 相關頁面及組件

### 主要頁面
- `/print-label`: 列印 QC 標籤的主頁面。

### 核心組件
位於 `app/components/qc-label-form/`：
- `PerformanceOptimizedForm.tsx`: 主表單組件，處理使用者輸入和流程控制。
- `ProductSection`: 用於輸入產品資訊的區塊。
- `ProgressSection`: 顯示標籤列印進度的區塊。
- `ClockNumberConfirmDialog.tsx`: 用於操作員身份確認的對話框。
- `EnhancedFormField.tsx`: 包含 `EnhancedInput` 和 `EnhancedSelect`，用於表單輸入欄位。
- `EnhancedProgressBar.tsx`: 進度條組件。
- `ResponsiveLayout.tsx`: 卡片組件佈局。

### 核心業務邏輯 Hook
- `app/components/qc-label-form/hooks/useQcLabelBusiness.ts`: 包含 QC 標籤生成的核心業務邏輯，例如：
    - 產品資訊查詢
    - Pallet Number 和 Series Number 生成
    - PDF 資料準備
    - 資料庫操作（插入 `record_palletinfo` 和 `record_history`）
    - 列印進度追蹤與錯誤處理

### UI 優化相關文件
- `docs/print-label-ui-optimization.md`: 詳細描述了 `/print-label` 頁面的視覺效果提升，包括：
    - 深藍色/深色主題設計
    - 玻璃擬態 (Glassmorphism) 設計風格
    - 動態背景元素與漸層效果
    - 卡片、輸入欄位、按鈕的樣式優化
    - 警告卡片和自動填充通知的設計

## 工作流程

1.  **使用者輸入**:
    *   操作員在 `/print-label` 頁面的 `PerformanceOptimizedForm` 中輸入產品代碼、數量等資訊。
    *   系統會進行表單驗證。

2.  **身份確認**:
    *   提交表單前，系統會彈出 `ClockNumberConfirmDialog` 要求操作員輸入工號進行身份驗證。

3.  **資料準備**:
    *   驗證成功後，`useQcLabelBusiness` Hook 開始處理。
    *   `generatePalletNumbers()`: 產生棧板號碼，格式為 `ddMMyy/N`。
    *   `generateMultipleUniqueSeries()`: 產生系列號，格式為 `ddMMyy-XXXXXX`。
    *   `prepareQcLabelData()`: 準備用於產生 PDF 的標籤資料。

4.  **批量處理與資料庫操作**:
    *   系統會逐個處理需要列印的每個棧板。
    *   對於每個棧板：
        *   **插入 `record_palletinfo`**: 記錄棧板的基本資訊。
        *   **插入 `record_history`**: 記錄此次操作的歷史。
        *   **更新庫存**: 根據產品類型自動處理庫存更新 (對於正常產品，流程可能涉及標準庫存扣減)。

5.  **PDF 產生與上傳**:
    *   `generateAndUploadPdf()`:
        *   根據準備好的資料產生 QC 標籤的 PDF 檔案。
        *   將產生的 PDF 自動上傳到 Supabase Storage 中的 `qc-labels` 路徑下。

6.  **列印觸發**:
    *   `mergeAndPrintPdfs()`: (如果有多個 PDF) 合併 PDF 並觸發瀏覽器的列印對話框。
    *   使用者確認後，標籤將被列印。

7.  **進度顯示與錯誤處理**:
    *   `ProgressSection` 和 `EnhancedProgressBar` 會即時顯示每個棧板的處理狀態 (例如：處理中、成功、失敗)。
    *   `useErrorHandler.ts` 和 `ErrorHandler.ts` 服務提供統一的錯誤處理機制：
        *   錯誤分級 (Critical/High/Medium/Low)。
        *   向使用者顯示友好的錯誤訊息。
        *   在資料庫中記錄錯誤。

## 技術實現細節

### 前端
-   **React 組件化架構**: 頁面和功能被拆分為可重用的組件。
-   **Tailwind CSS**: 用於快速建構現代化的使用者介面，實現了玻璃擬態、漸層、光效等視覺效果。
-   **Hooks**: `useQcLabelBusiness` 封裝了主要的業務邏輯，`useFormValidation` 處理表單驗證。

### 後端/資料庫
-   **Supabase**: 用作後端服務，包括：
    *   **Database**: 儲存棧板資訊 (`record_palletinfo`)、操作歷史 (`record_history`)、產品資料 (`data_code`) 等。
    *   **Storage**: 儲存產生的 QC 標籤 PDF 檔案。
-   **PDF 產生**: 透過後端 API 服務 (可能位於 `app/api/print-label-pdf/`) 或客戶端 PDF產生邏輯實現。

## 介面風格與使用者體驗 (參考 `docs/print-label-ui-optimization.md`)

-   **主題**: 深藍色/深色主題，配合玻璃擬態效果。
-   **背景**: 動態漸層背景與網格紋理。
-   **卡片與表單**: 半透明背景、背景模糊、邊框光效、懸停與聚焦互動效果。
-   **按鈕**: 漸層背景、懸停縮放與光效、載入動畫。
-   **進度條**: 現代化設計，清晰展示狀態。
-   **響應式設計**: 適應不同螢幕尺寸，支援觸控操作。
-   **視覺回饋**: 清晰的載入狀態、成功/錯誤提示。

## 注意事項

-   確保 Supabase 環境變數 (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) 已正確設定。
-   確保應用程式有權限讀寫相關資料庫表 (`record_palletinfo`, `record_history`, `data_code`)。
-   確保 Supabase Storage 中的 `pallet-label-pdf` (或 `qc-labels`) bucket 已建立並設定正確權限。 