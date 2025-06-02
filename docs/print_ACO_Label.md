# 列印 QC 標籤 (ACO 訂單流程)

## 概述

本文件說明在系統中為 ACO (Assembly Component Order) 訂單列印 QC 標籤的工作流程。此流程與正常 QC 標籤列印有共通之處，但增加了針對 ACO 訂單的特殊處理邏輯，包括訂單參考管理、新訂單創建、剩餘數量追蹤等。

## 相關頁面及組件

### 主要頁面
- `/print-label`: 列印 QC 標籤的主頁面。

### 核心組件
位於 `app/components/qc-label-form/`：
- `PerformanceOptimizedForm.tsx`: 主表單組件，處理使用者輸入和流程控制。
    - `AcoSection` (或類似的 ACO 特定表單部分): 用於處理 ACO 訂單相關的輸入，如訂單參考 (Order Reference)、新訂單詳情等。
- `ProductSection`: 用於輸入產品資訊的區塊。
- `ProgressSection`: 顯示標籤列印進度的區塊。
- `ClockNumberConfirmDialog.tsx`: 用於操作員身份確認的對話框。

### 核心業務邏輯 Hook
- `app/components/qc-label-form/hooks/useQcLabelBusiness.ts`: 包含 QC 標籤生成的核心業務邏輯，並擴展以支援 ACO 訂單特性：
    - **ACO 產品類型檢測**: 當使用者輸入產品代碼時，系統會檢查產品是否為 'ACO' 類型。
    - **歷史訂單載入**: 如果是 ACO 產品，會從 `record_aco` 表查詢並顯示該產品相關的歷史訂單參考。
    - **訂單搜尋與驗證**: 使用者可以輸入或選擇一個訂單參考。系統會搜尋 `record_aco` 表：
        - 如果找到訂單，則顯示剩餘數量 (`remain_qty`)。
        - 如果未找到，則進入新訂單模式。
    - **新 ACO 訂單詳情管理**:
        - 允許使用者為新訂單輸入包含多個 ACO 產品及其需求數量的詳情。
        - 驗證新訂單中的產品代碼必須是 'ACO' 類型。
    - **數量超額檢查**: 對於現有 ACO 訂單，如果列印的總數量超過訂單的 `remain_qty`，系統會顯示警告。
    - **ACO 托盤計數與顯示**: 在 PDF 標籤上顯示 ACO 訂單參考和托盤序數 (例如 `ORDER_REF - 1st Pallet`)。
    - **資料庫操作**:
        - **新訂單**: 插入記錄到 `record_aco` (包含 `order_ref`, `code`, `required_qty`, `remain_qty`)。
        - **現有訂單**: 更新 `record_aco` 表中對應訂單和產品的 `remain_qty`。
        - 同時插入 `record_palletinfo` 和 `record_history`。

### 相關資料庫表
- `record_aco`: 儲存 ACO 訂單的詳細資訊 (訂單參考、產品代碼、需求數量、剩餘數量)。
- `record_palletinfo`: 儲存棧板資訊。
- `record_history`: 儲存操作歷史。
- `data_code`: 儲存產品資訊，包括產品類型。

### 相關舊有文件
- `docs/acoOrderWorkFlow.md`: 詳細描述了 ACO 訂單的完整工作流程、技術實現、資料庫結構等。
- `docs/qcLabel.md`: 描述了通用的 QC 標籤功能實現。

## 工作流程

1.  **產品輸入與類型檢測**:
    *   使用者在 `/print-label` 頁面的 `ProductSection` 輸入產品代碼。
    *   系統查詢 `data_code` 表，檢測產品類型。
    *   如果產品類型為 'ACO'，則顯示 ACO 訂單特定的表單區塊 (`AcoSection`)。

2.  **ACO 訂單處理**:
    *   **載入歷史訂單 (可選)**: 系統查詢 `record_aco` 表，列出與該 ACO 產品相關的現有訂單參考，供使用者選擇。
    *   **輸入/選擇訂單參考**: 使用者輸入新的訂單參考或從列表中選擇一個現有的訂單參考。
    *   **訂單搜尋與狀態顯示**:
        *   `useQcLabelBusiness` Hook 根據訂單參考和產品代碼搜尋 `record_aco` 表。
        *   **現有訂單**: 如果找到匹配的訂單記錄，計算並顯示該產品在該訂單中的剩餘數量 (`remain_qty`)。如果剩餘數量為 0，提示訂單已完成。
        *   **新訂單**: 如果未找到匹配記錄，系統進入新訂單模式。使用者需要輸入新訂單的詳細資訊（包含哪些 ACO 產品，各需要多少數量）。系統會驗證這些產品必須是 'ACO' 類型。

3.  **輸入列印數量**:
    *   使用者輸入本次要列印的每個棧板的數量 (`quantity`) 和棧板數 (`count`)。
    *   **數量超額檢查 (針對現有訂單)**: 如果 `quantity * count` 大於當前訂單的 `remain_qty`，系統會發出警告，但通常允許使用者選擇是否繼續。

4.  **身份確認**:
    *   與正常流程一樣，提交前需要透過 `ClockNumberConfirmDialog` 進行身份驗證。

5.  **資料準備與批量處理**:
    *   `generatePalletNumbers()` 和 `generateMultipleUniqueSeries()` 產生棧板號和系列號。
    *   `prepareQcLabelData()` 準備 PDF 資料，其中 `workOrderNumber` 和 `workOrderName` 欄位會特別處理以反映 ACO 訂單資訊和托盤序數。

6.  **資料庫操作 (事務性處理)**:
    *   對於每個棧板：
        *   **針對新 ACO 訂單 (僅在處理第一個棧板時執行)**:
            *   遍歷使用者輸入的新訂單詳情 (`acoOrderDetails`)。
            *   為每個有效的 ACO 產品條目，在 `record_aco` 表中創建一條記錄，包含 `order_ref`, `code`, `required_qty` (使用者輸入的需求量), 和 `remain_qty` (等於 `required_qty` 減去本次第一個棧板為此產品列印的數量)。
        *   **針對現有 ACO 訂單 (僅在處理第一個棧板時執行，或按需更新)**:
            *   調用 `updateAcoOrderRemainQty` (或類似的服務端操作) 來更新 `record_aco` 表中對應訂單參考和產品代碼的 `remain_qty`，減去本次列印的總數量 (`quantity * count`)。
        *   插入 `record_palletinfo`。
        *   插入 `record_history`。
        *   (可能) 更新 `record_inventory`。

7.  **PDF 產生與上傳**:
    *   `generateAndUploadPdf()` 產生包含 ACO 特定資訊 (如 `ACO Order Ref - Nth Pallet`) 的 PDF 並上傳。

8.  **列印觸發與進度顯示**:
    *   與正常流程類似，觸發列印並顯示進度。

## UI 與使用者體驗特性 (參考 `docs/acoOrderWorkFlow.md`)

-   **智能表單行為**: 自動根據產品類型顯示/隱藏 ACO 表單區塊，自動載入歷史訂單。
-   **即時驗證**: 在使用者輸入 ACO 新訂單詳情時，即時驗證產品代碼是否為 ACO 類型。
-   **清晰的狀態反饋**: 明確顯示訂單剩餘數量、新訂單模式、超量警告等。

## 技術實現考量

-   **服務端操作 (`qcActions.ts` 或類似)**: 包含更新 `record_aco` 剩餘數量的邏輯，以確保數據一致性和處理權限問題。
-   **狀態管理**: `useQcLabelBusiness` 中的狀態變數會包含 ACO 相關的數據，如 `acoOrderRef`, `acoNewRef`, `acoRemain`, `acoOrderDetails` (新訂單詳情), `availableAcoOrderRefs` 等。
-   **資料庫事務**: 強烈建議將涉及 `record_aco`, `record_palletinfo`, `record_history` 的多個寫入操作包裹在資料庫事務中，以保證原子性。

## 注意事項

-   `record_aco` 表的 `order_ref` 和 `code` 應建立索引以優化查詢性能。
-   處理新 ACO 訂單時，確保 `remain_qty` 在首次創建記錄時就被正確計算（需求量 - 本次第一個棧板的用量）。
-   對於一個 ACO 訂單可能包含多種產品的情況，新訂單創建和剩餘數量更新邏輯需要能正確處理。 