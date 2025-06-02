# 列印 GRN 標籤

## 概述

本文件說明在系統中列印 GRN (Goods Received Note) 標籤的工作流程。此流程用於記錄收貨資訊，並為每批來貨的每個托盤產生標籤。系統整合了使用者認證、資料庫記錄、PDF 產生與列印功能。

## 相關頁面及組件

### 主要頁面
- `/print-grnlabel`: 列印 GRN 標籤的主頁面。

### 核心組件
- `app/print-grnlabel/components/GrnLabelForm.tsx`: GRN 標籤的核心表單組件，處理所有使用者輸入和業務邏輯。
- `app/components/qc-label-form/ProductCodeInput.tsx`: (可能被 GRN 表單內部使用或參考) 用於產品代碼輸入和驗證。
- `app/components/qc-label-form/ClockNumberConfirmDialog.tsx`: 用於操作員身份確認 (取代了舊的密碼確認對話框)。
- `app/components/qc-label-form/PrintProgressBar.tsx` (或 `EnhancedProgressBar`): 用於顯示 PDF 產生和列印的進度。
- 通用的 UI 組件如 `ResponsiveLayout`, `ResponsiveCard` 等，用於構建表單佈局。

### 核心業務邏輯/服務
- **使用者認證**:
    - `app/utils/auth-utils.ts` (`AuthUtils`): 用於獲取當前登入使用者的 Clock Number。
- **資料庫操作**:
    - `app/actions/grnActions.ts` (包含 `createGrnDatabaseEntries` 或類似的 RPC 呼叫 `create_grn_entries_atomic`): 處理將 GRN 相關資訊寫入資料庫的邏輯。
- **PDF 產生與列印**:
    - 系統內建的 PDF 產生邏輯 (可能使用如 `react-pdf` 或後端 API)。
    - `mergeAndPrintPdfs` (或類似功能): 合併多個 PDF 並觸發列印。
- **唯一編號生成**:
    - `generatePalletNumbers()` (或 `generateGrnPalletNumbers`)
    - `generateMultipleUniqueSeries()`

### UI 優化相關文件
- `docs/print-grnlabel-ui-optimization.md`: 詳細描述了 `/print-grnlabel` 頁面的視覺效果提升，包括：
    - 與 `/print-label` 一致的深藍色/深色主題，並結合橙色強調色。
    - 玻璃擬態設計風格。
    - 動態背景元素與橙色主題裝飾。
    - 表單卡片、輸入欄位、按鈕的樣式優化（橙色主題）。
    - 重量資訊側邊欄的重新設計，包括摘要資訊和逐行托盤重量輸入。
    - 可收合的說明指示區塊。

## 相關資料庫表
- `record_palletinfo`: 儲存棧板的基本資訊（棧板號、系列號、產品代碼、淨重、備註等）。
- `record_grn`: 儲存 GRN 的特定資訊（GRN 參考號、物料代碼、供應商代碼、棧板號、毛重、淨重、托盤和包裝類型及數量等）。
- `record_history`: 儲存操作歷史（操作類型如 "GRN Receiving"、操作員 ID、棧板號、位置、備註等）。
- `record_inventory`: (可能) 更新庫存，記錄收貨數量。
- `data_supplier`: 儲存供應商資料，用於驗證供應商代碼。
- `data_code`: 儲存產品資料，用於驗證產品代碼。

## 工作流程

1.  **使用者存取頁面與身份驗證**:
    *   使用者導航至 `/print-grnlabel`。
    *   頁面載入時，`GrnLabelForm` 組件會使用 `AuthUtils` 自動獲取當前登入使用者的 Clock Number (`userId`)。

2.  **表單填寫**:
    使用者在 `GrnLabelForm` 中輸入以下資訊：
    *   **GRN 詳細資訊**:
        *   `GRN Number`: 收貨單號 (必填)。
        *   `Material Supplier`: 物料供應商代碼 (必填)。輸入後，系統會非同步查詢 `data_supplier` 表驗證代碼並顯示供應商名稱。
        *   `Product Code`: 產品代碼 (必填)。輸入後，系統會非同步查詢 `data_code` 表驗證代碼並顯示產品描述。
    *   **托盤類型 (Pallet Type)**:
        *   從預設選項中選擇一種托盤類型 (例如：White Dry (14kg), Chep Wet (38kg), Not Included (0kg) 等)。
        *   這些選項對應固定的托盤重量 (`PALLET_WEIGHT` 常量)。
    *   **包裝類型 (Package Type)**:
        *   從預設選項中選擇一種包裝類型 (例如：Still (50kg), Bag (1kg), Not Included (0kg) 等)。
        *   這些選項對應固定的包裝重量 (`PACKAGE_WEIGHT` 常量)。
    *   **重量資訊 (Weight Information)**:
        *   在右側的 "Weight Input Section"，使用者逐個輸入每個托 στό盤的毛重 (`Gross Weight`)。
        *   系統支援最多 22 個托盤的輸入。
        *   每輸入一個有效的毛重，系統會自動計算並顯示該托盤的淨重 (`Net Weight = Gross Weight - Pallet Weight - Package Weight`)。
        *   使用者可以移除已輸入的重量條目。

3.  **表單驗證與提交準備**:
    *   系統會進行前端驗證，確保所有必填欄位已填寫且格式正確。
    *   "Print GRN Label(s)" 按鈕的狀態會根據表單有效性 (`isFormValid`) 和是否正在處理中 (`isProcessing`) 動態更新。

4.  **操作員身份確認**:
    *   使用者點擊 "Print GRN Label(s)" 按鈕。
    *   如果表單有效，系統會彈出 `ClockNumberConfirmDialog`，要求使用者輸入其 Clock Number 進行操作確認。

5.  **資料處理與 PDF 產生 (確認後)**:
    *   `handleClockNumberConfirm` (或在 `proceedWithGrnPrint` 內部) 函數被觸發。
    *   **進度初始化**: `pdfProgress` 狀態被設定，用於追蹤每個托盤的處理進度。
    *   **迭代處理每個托盤**: 系統遍歷所有有效輸入的毛重：
        *   **產生唯一編號**:
            *   `generatePalletNumbers()` (或類似函數) 產生唯一的棧板號 (`palletNum`)。
            *   `generateMultipleUniqueSeries()` 產生唯一的系列號 (`series`)。
        *   **計算淨重**: 再次確認淨重。
        *   **準備資料庫記錄**:
            *   `palletInfoData` (for `record_palletinfo`): 包含 `plt_num`, `series`, `product_code`, `product_qty` (淨重取整), `plt_remark` (例如 "Material GRN- [GRN Number]")。
            *   `grnRecordData` (for `record_grn`): 包含 `grn_ref`, `material_code`, `sup_code`, `plt_num`, `gross_weight`, `net_weight`, `pallet_count` (通常為1), `package_count` (通常為1), `pallet` (選擇的托盤類型字串), `package` (選擇的包裝類型字串)。
            *   `historyRecordData` (for `record_history`): 包含 `action` ("GRN Receiving"), `id` (操作員Clock Number), `plt_num`, `loc` ("Await"), `remark`。
            *   `inventoryRecordData` (for `record_inventory`): 包含 `product_code`, `plt_num`, `await` (淨重)。
        *   **資料庫操作**:
            *   呼叫後端 Action (例如 `createGrnDatabaseEntries`，內部可能呼叫 Supabase RPC `create_grn_entries_atomic`) 將上述準備好的資料寫入對應的資料庫表。此操作應為原子性的。
            *   如果資料庫操作成功：
                *   **產生 PDF**: 系統為該棧板產生 GRN 標籤的 PDF。PDF 內容包含產品資訊、重量、GRN 號、棧板號、系列號等。
                *   **上傳 PDF (可選)**: PDF 可能會被上傳到 Supabase Storage。
                *   更新 `pdfProgress` 狀態為 "Success"。
            *   如果資料庫操作失敗：
                *   記錄錯誤，更新 `pdfProgress` 狀態為 "Failed"。跳過此托盤的 PDF 產生。
    *   **收集 PDF**: 所有成功產生的 PDF 被收集起來。

6.  **列印與完成**:
    *   如果沒有成功產生的 PDF，顯示錯誤訊息。
    *   否則，使用 `mergeAndPrintPdfs` (或類似功能) 將所有收集到的 PDF 合併（如果有多個）並觸發瀏覽器的列印對話框。
    *   列印完成後，重置表單狀態，清空輸入欄位。
    *   顯示操作完成的提示。

## UI 與使用者體驗 (參考 `docs/print-grnlabel-ui-optimization.md`)

-   **主題**: 深藍色背景，橙色作為強調色，營造 "Material Receiving" 的工業感。
-   **佈局**:
    *   左側主區域包含 GRN 詳細資訊、托盤和包裝類型選擇。
    *   右側固定區域 (sticky) 為重量資訊輸入區，包括：
        *   **摘要資訊**: 總托盤數、最大托盤數、表單狀態。
        *   **重量輸入列表**: 逐行顯示每個托盤的編號、毛重輸入框、單位(kg)、即時計算的淨重、移除按鈕。採用緊湊的一行式設計。
-   **互動**:
    *   輸入欄位具有現代化外觀，橙色聚焦效果。
    *   按鈕有漸層、陰影和懸停動畫效果。
    *   進度條清晰顯示 PDF 處理狀態。
    *   可收合的說明區塊，預設收起以節省空間。

## 注意事項

-   `create_grn_entries_atomic` RPC 函數的參數需要與前端傳遞的參數完全匹配，包括 `p_loc` (應設為 'Await')。
-   重量計算 (`Net Weight = Gross Weight - Pallet Weight - Package Weight`) 必須準確。
-   錯誤處理機制需要能夠清晰地告知使用者哪個托盤處理失敗及其原因。
-   `ProductCodeInput` 組件在 GRN 流程中可能僅用於產品代碼和描述的獲取，不需要 `standard_qty` 或 `type` 資訊。
-   所有回呼函數 (`useCallback`) 的依賴陣列需要完整，以避免閉包導致的陳舊狀態問題。 