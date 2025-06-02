# 匯出報表 (ACO 訂單報表, GRN 報表, 交易報表)

## 概述

本文件說明系統中三種主要報表的匯出工作流程：ACO 訂單報表 (ACO Order Report)、GRN 報表 (GRN Report) 和交易報表 (Transaction Report)。這些功能主要透過 `/export-report` 頁面提供，並可能在管理員面板 (`/admin`) 中有相應的入口。

## 相關頁面及組件

### 主要頁面
- `/export-report`: 匯出報表的主頁面。使用者可以在此頁面選擇並產生不同類型的報表。
- `/admin`: 管理員面板，可能包含 "Export Reports" 類別，提供這些報表及其他數據匯出選項的快捷入口。

### 核心組件
- **報表選擇介面**: 位於 `/export-report` 頁面，通常包含按鈕或列表讓使用者選擇要匯出的報表類型。
- **參數輸入對話框**:
    - **ACO Order Report**: 彈出對話框讓使用者選擇 ACO 訂單參考號 (`ACO Order Reference`)。
    - **GRN Report**: 彈出對話框讓使用者選擇 GRN 參考號 (`GRN Reference Number`)。
    - **Transaction Report**: 彈出對話框讓使用者選擇日期範圍 (開始日期和結束日期)，預設為昨天。
- `app/hooks/useAuth.ts`: 用於統一管理使用者認證狀態。
- **通知組件**: 如 `Sonner Toast`，用於顯示匯出進度、成功或錯誤訊息 (英文)。

### 後端/核心邏輯
- `app/actions/reportActions.ts`: 包含獲取報表數據的 Server Actions。這些 actions 會與 Supabase 資料庫互動，查詢所需數據。
- `lib/exportReport.ts`: 包含使用 `ExcelJS` 函式庫產生 Excel (xlsx) 報表的邏輯。
- `file-saver`: (可能) 用於觸發瀏覽器下載產生的報表檔案。

## 報表類型及流程

### 1. ACO 訂單報表 (ACO Order Report)

#### 功能描述
根據使用者選擇的 ACO 訂單參考號，匯出該訂單下各產品的棧板資訊，特別包括每個產品的需求數量 (`Required Qty`)。

#### 工作流程
1.  **觸發與選擇**: 使用者在 `/export-report` 頁面點擊 "ACO Order Report" 按鈕。
2.  **訂單選擇**: 系統彈出對話框，列出可用的 ACO 訂單參考號供使用者選擇。
3.  **數據獲取 (`reportActions.ts` -> `getAcoReportData`)**:
    *   根據選擇的 `orderRef`，首先從 `record_aco` 表查詢該訂單包含的所有產品代碼 (`code`) 及其對應的需求數量 (`required_qty`)。
    *   然後，根據這些產品代碼和訂單參考，從 `record_palletinfo` 表查詢所有相關的棧板資訊 (`plt_num`, `product_qty`, `generate_time`)。查詢時會考慮 `plt_remark` 中可能包含的不同 ACO 參考格式 (例如 "ACO Ref : [orderRef]", "ACO_Ref_[orderRef]")。
    *   數據查詢經過優化，旨在減少資料庫查詢次數。
4.  **報表產生 (`lib/exportReport.ts`)**:
    *   使用 `ExcelJS` 產生 Excel 檔案。
    *   報表標題為 "ACO Record"。
    *   包含訂單參考號和產生日期。
    *   每個產品的資訊在 Excel 中佔據一個區塊 (最多支援4個產品區塊)。
    *   **需求數量 (`Required Qty`)**: 顯示在每個產品區塊的特定儲存格 (如 A5, E5, I5, M5)，並以藍色粗體字體標識。
    *   欄位包括：Product Code, Required Qty, Pallet No., Qty (棧板數量), QC Date (`generate_time` 格式化為 DD-MM-YY)。
5.  **檔案下載**:
    *   產生的 Excel 檔案名為 `ACO_[orderRef]_Report.xlsx`。
    *   自動觸發瀏覽器下載。
6.  **狀態通知**: 透過 Toast 通知使用者匯出進度和結果。

#### 相關資料庫表
- `record_aco`: 獲取產品代碼和 `required_qty`。
- `record_palletinfo`: 獲取棧板號、棧板數量和生成時間。

### 2. GRN 報表 (GRN Report)

#### 功能描述
根據使用者選擇的 GRN 參考號，為該 GRN 下的每種物料產生一份詳細的接收報告。

#### 工作流程
1.  **觸發與選擇**: 使用者在 `/export-report` 頁面點擊 "GRN Report" 按鈕。
2.  **GRN 選擇**: 系統彈出對話框，讓使用者輸入或選擇 GRN 參考號。
3.  **數據獲取 (`reportActions.ts` -> `getGrnReportData`)**:
    *   首先，根據使用者登入的 `userEmail` 從 `data_id` 表查詢對應的操作員 ID (`userId`)，以增強安全性。
    *   根據選擇的 `grnRef` 和物料代碼 (`materialCode`)，從 `record_grn` 表查詢詳細的 GRN 記錄。
    *   同時關聯查詢 `data_code` (獲取物料描述 `material_description`) 和 `data_supplier` (獲取供應商名稱 `supplier_name`)。
    *   一個 GRN 下可能有多種物料，系統會為每種物料代碼產生獨立的報表。
4.  **報表產生 (`lib/exportReport.ts`)**:
    *   為每個物料代碼產生一個 Excel 工作表或獨立檔案。
    *   報表頁面設定為 A4 直向。
    *   包含 GRN 號碼、物料代碼、物料描述、供應商名稱、報表日期等標題資訊。
    *   數據區域包含每個棧板的毛重、淨重、托盤類型、包裝類型、托盤計數、包裝計數。
    *   總計區域包含該物料的總毛重、總淨重和重量差異。
5.  **檔案下載**:
    *   觸發下載，檔名可能類似 `GRN_[grnRef]_[materialCode]_Report.xlsx`。
6.  **狀態通知**: Toast 通知。

#### 相關資料庫表
- `record_grn`: GRN 的核心數據。
- `data_id`: 驗證並獲取操作員 ID。
- `data_code`: 獲取物料描述。
- `data_supplier`: 獲取供應商名稱。

### 3. 交易報表 (Transaction Report)

#### 功能描述
匯出指定日期範圍內的產品庫存轉移記錄。此報表已簡化，移除了模板模式，直接進入日期選擇。

#### 工作流程
1.  **觸發與日期選擇**: 使用者點擊 "Transaction Report" 按鈕。
2.  **日期選擇**: 系統彈出對話框，讓使用者選擇開始日期和結束日期。預設日期為昨天。
3.  **數據獲取 (`reportActions.ts` -> `getTransactionReportData`)**:
    *   根據選擇的日期範圍 (例如 `startDate` 和 `endDate`)，查詢 `record_transfer` 表。
    *   **日期查詢修正**: 由於 `record_transfer.tran_date` 儲存的是帶時間戳的 UTC 時間 (如 `2025-05-29T21:20:15.834+00:00`)，查詢時會將使用者選擇的日期轉換為完整的時間範圍 (如 `startDate`T00:00:00.000Z 到 `endDate`T23:59:59.999Z) 以確保涵蓋整天記錄。
    *   關聯 `record_palletinfo` 表獲取棧板的產品代碼 (`product_code`) 和數量 (`product_qty`)。
    *   關聯 `data_id` 表獲取操作員姓名 (`name`) 和 Clock Number (`id`)。
4.  **報表產生 (`lib/exportReport.ts`)**:
    *   使用 `ExcelJS` 動態產生 Excel 檔案。
    *   報表標題為 "Product Movement Sheet"。
    *   包含報表期間。
    *   列出每一筆轉移記錄，包含：轉移日期 (`transfer_date`)、棧板號 (`pallet_number`)、產品代碼 (`product_code`)、數量 (`quantity`)、來源位置 (`from_location`)、目標位置 (`to_location`)、操作員姓名和 Clock Number (格式如 "操作員姓名\n(Clock Number)")。
    *   操作員姓名和 Clock Number 在 Excel 儲存格中會換行顯示，並啟用文字換行 (`wrapText`) 及居中對齊。
    *   來源位置和目標位置在 Excel 中會有特定標記（如藍色✓和綠色✓）。
    *   (可能) 包含位置轉移的統計摘要。
5.  **檔案下載**:
    *   自動下載，檔名可能包含日期範圍。
6.  **狀態通知**: Toast 通知。若選定日期範圍無轉移記錄，也會有提示。

#### 相關資料庫表
- `record_transfer`: 主要的交易/轉移記錄來源。
- `record_palletinfo`: 獲取棧板上的產品資訊。
- `data_id`: 獲取操作員姓名和 Clock Number。

## 通用技術考量

-   **認證**: 所有報表匯出操作前，會使用 `app/hooks/useAuth.ts` 驗證使用者是否已登入。若未登入或會話過期，會提示並可能導向登入頁面。
-   **UI/UX**:
    -   頁面採用深色主題，與系統整體風格一致。
    -   按鈕和對話框設計友好，提供清晰的互動指引。
    -   英文介面，包括所有 Toast 通知。
-   **錯誤處理**:
    -   對資料庫查詢錯誤、無數據等情況有相應的處理和使用者提示。
    -   輸入驗證（如 ACO 訂單號格式）。
-   **性能**:
    -   Server Actions 中的數據查詢經過優化，特別是 ACO Order Report 的查詢，以減少資料庫負載和響應時間。
-   **文件命名**: 產生的報表檔案會根據報表類型和參數（如訂單號、日期）自動命名。

## 未提及的報表 (參考 `docs/adminPanelExportReports.md`)

管理員面板 (`/admin`) 的 "Export Reports" 類別中還可能包含以下報表：
-   **Export Code List**: 匯出 `data_code` 表中的完整產品代碼清單 (CSV 格式)。
-   **Export Inventory Transaction**: 與上述 Transaction Report 類似，但可能特指從 Admin Panel 觸發，並匯出為 CSV。
-   **Slate Report**: 預留按鈕，功能待開發。
-   **Export All Data**: 匯出主要數據表的完整資料庫備份 (JSON 格式)，通常帶有大檔案警告。

這些報表的流程未在此文件中詳細展開，但它們共享類似的技術棧（Server Actions, ExcelJS/CSV生成等）。 