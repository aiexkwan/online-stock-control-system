# 資料匯出 (Export All Data)

## 概述

本文件說明系統中 "Export All Data" 功能的工作流程。此功能允許使用者 (通常是管理員) 從管理員面板 (`/admin`) 選擇多個資料庫表格，並將其數據批量匯出為 CSV 檔案。此功能旨在提供一個全面性的數據匯出方案，取代了舊有的單獨匯出產品代碼清單或庫存交易記錄的功能。

## 相關頁面及組件

### 主要觸發位置
- `/admin`: 管理員面板頁面，在 "Export Reports" (或類似) 的類別下，會有 "Export All Data" 的操作選項。

### 核心組件
- **表格選擇對話框**: 當使用者點擊 "Export All Data" 後彈出。
    - 允許使用者透過複選框選擇一個或多個希望匯出的資料庫表格。
    - 對於需要日期範圍的表格 (如 `Operation History`, `Full Inventory`)，會提示使用者並提供日期選擇器。
- **日期範圍選擇器**: 僅當選擇了需要日期範圍的表格時顯示。
    - 包含開始日期和結束日期選擇。
    - 有日期範圍限制 (例如，不超過一個月)。
- **通知組件**: 如 `Sonner Toast`，用於顯示匯出進度、成功、警告或錯誤訊息 (英文)。

### 後端/核心邏輯
- `app/actions/newReportActions.ts` (或類似的 Server Actions 文件): 包含實際從後端獲取數據並轉換為 CSV 格式的邏輯。
- `lib/exportUtils.ts` (或類似的 CSV 生成工具): 處理將數據陣列轉換為 CSV 字串的通用邏輯。
- `file-saver` (或瀏覽器原生下載): 用於觸發 CSV 檔案的下載。

## 可選擇匯出的表格

使用者可以從以下表格中選擇一個或多個進行匯出：

| 顯示名稱           | 對應 Supabase 表格 | 描述         | 日期範圍要求 | 預設排序欄位   |
|--------------------|-------------------|--------------|------------|----------------|
| Pallet Information | `record_palletinfo` | 托盤資訊記錄   | 否         | `generate_time`|
| Code List          | `data_code`         | 產品代碼清單   | 否         | `code`         |
| Voided Inventory   | `report_void`       | 作廢庫存記錄   | 否         | `time`         |
| Operation History  | `record_history`    | 操作歷史記錄   | **是**     | `time`         |
| Full Inventory     | `record_inventory`  | 完整庫存記錄   | **是**     | `latest_update`|
| ACO Records        | `record_aco`        | ACO 訂單記錄  | 否         | `id` (或 `order_ref`) |
| GRN Records        | `record_grn`        | GRN 收貨記錄   | 否         | `id` (或 `grn_ref`)   |
| Stock Transfers    | `record_transfer`   | 庫存轉移記錄   | 否         | `tran_date`    |
| User Information   | `data_id`           | 使用者資訊記錄 | 否         | `id`           |
| Supplier List      | `data_supplier`     | 供應商清單     | 否         | `supplier_code`|
*(注意：上述表格列表及排序欄位可能根據 `docs/exportAllDataFeature.md` 和實際系統實現略有調整)*

## 工作流程

1.  **觸發功能**:
    *   使用者在 `/admin` 頁面，於 "Export Reports" 區域點擊 "Export All Data" 按鈕。

2.  **介面重置與對話框顯示**:
    *   系統首先自動重置所有相關的狀態變數 (如已選表格、日期範圍等)，確保每次操作都是全新的開始。
    *   彈出 "Export All Data" 對話框。

3.  **選擇表格**:
    *   使用者在對話框中勾選一個或多個希望匯出的資料庫表格。
    *   如果選擇的表格中包含需要日期範圍的表格 (例如 `record_history`, `record_inventory`)，日期範圍設定區塊會自動顯示。這些表格旁邊會有橙色標籤提示 "Requires Date Range"。

4.  **設定日期範圍 (如需要)**:
    *   如果日期範圍設定區塊可見，使用者需要選擇開始日期和結束日期。
    *   系統會驗證所選日期範圍是否超過最大限制 (例如 31 天)。如果超過，會透過 Toast 顯示警告，使用者需要重新選擇。

5.  **產生報告**:
    *   使用者點擊 "Generate Report" (或類似) 按鈕。
    *   系統開始處理匯出請求。Toast 通知會提示 "Generating report..."。

6.  **數據獲取與 CSV 產生 (針對每個選中的表格)**:
    *   系統會迭代處理使用者選擇的每個表格：
        *   **構建查詢**: 根據表格名稱，構建 Supabase 查詢。
        *   **應用日期過濾**: 如果該表格需要日期範圍且使用者已設定，則在查詢中加入日期過濾條件 (例如 `gte(timeField, startDate)`, `lte(timeField, endDate + 'T23:59:59')`)。
        *   **排序**: 根據表格類型自動選擇排序欄位 (如 `generate_time` for `record_palletinfo`) 並加入到查詢中。如果特定排序失敗，系統會回退到無排序查詢。
        *   **執行查詢**: 從 Supabase 獲取數據。
        *   **錯誤處理**:
            *   如果查詢某個表格時出錯，會記錄警告 (console) 並跳過該表格，繼續處理下一個。
            *   如果某個表格無數據，會顯示警告 (Toast)，但仍會繼續處理其他表格。
        *   **轉換為 CSV**: 將查詢到的數據轉換為 CSV 格式字串。
            *   CSV 標頭會自動從數據的第一行記錄的鍵 (keys) 生成。
            *   處理 `null` 或 `undefined` 的值。
            *   對包含逗號或其他特殊字元的字串進行轉義。
            *   使用 UTF-8 編碼。
        *   **觸發下載**:
            *   為該表格的 CSV 數據觸發瀏覽器下載。
            *   檔案名稱會根據表格名稱、日期範圍 (如果適用) 和當前日期自動生成，例如：
                *   `record_history_2025-01-01_to_2025-01-31_2025-01-25.csv`
                *   `data_code_2025-01-25.csv`
            *   為了避免瀏覽器阻擋連續下載，不同表格的檔案下載之間可能有短暫延遲 (如 500ms)。

7.  **完成與介面重置**:
    *   所有選中的表格都處理完畢後：
        *   Toast 通知顯示成功訊息，例如 "Successfully exported X table(s)."。
        *   對話框自動關閉。
        *   所有相關狀態 (已選表格、日期等) 再次被重置。

## UI 與使用者體驗特性

-   **多選與批量匯出**: 核心特性，允許一次性匯出多個表格的數據。
-   **智能日期提示**: 清晰標示哪些表格需要日期範圍，並在選擇後才顯示日期輸入欄位。
-   **日期範圍驗證**: 防止使用者選擇過大的日期範圍，導致系統負載過高或產生過大的檔案。
-   **界面重置**: 保證每次操作的獨立性和潔淨性，避免上次操作的選擇遺留。
-   **錯誤處理**: 對單個表格的匯出失敗不會中斷整個批量匯出過程。
-   **英文介面**: 所有標籤、提示均為英文。
-   **視覺風格**: 遵循 Admin Panel 的深色主題，表格選擇區域可能有特定的強調色 (如翠綠色漸層背景)。

## 注意事項

-   此功能主要面向管理員，用於數據備份、遷移或離線分析。
-   由於可能匯出大量數據，執行時應注意系統資源和網路頻寬。
-   日期範圍的限制是為了性能和可用性考量。
-   匯出的 CSV 檔案編碼為 UTF-8，以兼容多數試算表軟體並正確顯示特殊字元。

## 此功能取代的舊功能

"Export All Data" 功能因其更強的靈活性和全面性，已取代以下原有的獨立報表匯出功能：
-   Export Code List
-   Export Inventory Transaction (此處指 Admin Panel 中原有的獨立 CSV 匯出，與 `/export-report` 頁面的 Transaction Report Excel 報表是不同的功能) 