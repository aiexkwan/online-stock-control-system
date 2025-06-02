# 作廢棧板 (Void Pallet)

## 概述

本文件說明系統中的作廢棧板 (Void Pallet) 功能。此功能允許使用者搜尋並作廢現有棧板，同時能處理特殊情況，例如與 ACO (Assembly Component Order) 訂單相關的棧板或 Material GRN (Goods Received Note) 棧板。系統支援多種作廢原因，並針對特定原因（如損壞、數量錯誤、產品代碼錯誤）提供了自動重印標籤的流程。此功能已整合到管理員面板 (`/admin`) 中，通常以對話框的形式提供操作界面，而非獨立頁面。

## 相關頁面及組件

### 主要觸發位置
- `/admin`: 管理員面板。使用者可以從管理員功能列表 (可能在 "Admin Panel Popover" 或主面板上) 找到 "Void Pallet" 選項並點擊，以打開作廢棧板的對話框。

### 核心組件
- `app/void-pallet/components/VoidPalletDialog.tsx` (或類似名稱): 作廢棧板的核心對話框組件。該對話框提供全螢幕或較大尺寸的界面，包含搜尋、資訊顯示、作廢操作等所有功能。
- `components/ui/unified-search.tsx`: 統一的搜尋組件，用於輸入棧板號或系列號。支援以下特性：
    - 自動檢測輸入格式 (棧板號含 `/`, 系列號含 `-`)。
    - 輸入完成後失焦或按 Enter 鍵自動觸發搜尋。
    - (可能) 支援 QR Code 掃描。
- `app/void-pallet/components/PalletInfoCard.tsx`: 用於顯示搜尋到的棧板詳細資訊。
- `app/void-pallet/components/VoidForm.tsx`: 包含作廢原因選擇、密碼/身份確認等操作表單。
- `app/void-pallet/components/ReprintInfoDialog.tsx`: 針對特定作廢原因 (需要重印時) 彈出的對話框，用於收集修正後的資訊 (如正確數量、正確產品代碼、損壞後的剩餘數量)。
- `app/components/qc-label-form/ClockNumberConfirmDialog.tsx`: (可能) 用於操作員身份確認，取代或配合密碼驗證。

### 核心業務邏輯 Hook/Actions
- `app/void-pallet/hooks/useVoidPallet.ts`: 包含作廢棧板前端的主要業務邏輯，如處理使用者輸入、狀態管理、呼叫後端 actions。
- `app/void-pallet/actions.ts`: 包含 Server Actions，處理與後端資料庫的互動，例如：
    - `voidPalletAction`: 執行核心的作廢棧板邏輯。
    - `processDamageAction`: 處理損壞情況的特殊邏輯。
    - `getLatestPalletLocation`: 從 `record_history` 獲取棧板最新位置。
    - `updateACORecord`: 更新 ACO 訂單的剩餘數量。
    - `deleteGRNRecord`: 刪除 GRN 記錄。
- `app/api/auto-reprint-label/route.ts`: 後端 API 端點，負責處理自動重印標籤的請求，包括產生新的棧板號、系列號、PDF 並返回給前端下載。

### UI 主題與風格
- 現代化深色主題，可能帶有玻璃擬態效果和動態光效。
- 英文介面。
- 響應式設計，適應不同裝置。

## 相關資料庫表

- `record_palletinfo`: 儲存棧板基本資訊。作廢時，此記錄的狀態可能被更新或標記。
- `record_history`: 記錄所有操作，包括作廢操作。
    - `action`: "Void Pallet" 或類似。
    - `remark`: 可能包含作廢原因、舊棧板號 (如果是重印產生新棧板) 等。
    - `loc`: 記錄棧板的最終狀態位置，例如 "Voided"。
- `record_inventory`: 更新庫存。作廢棧板時，會從其所在位置的庫存中扣除相應數量。
    - 位置欄位映射 (如 `Production` -> `injection`) 在後端或 `useVoidPallet.ts` 中處理。
- `report_void`: (可能) 一個專門記錄作廢棧板詳細資訊的表格。
- `record_aco`: 如果作廢的是 ACO 訂單棧板，會更新此表中對應訂單的 `remain_qty` (將作廢數量加回)。
- `record_grn`: 如果作廢的是 Material GRN 棧板，會從此表中刪除對應該棧板的 GRN 記錄。
- `data_id`: 驗證操作員身份 (Clock Number 或 Email)。
- `data_code`: 獲取產品資訊 (如描述)，尤其在重印時需要。

## 工作流程

### A. 一般作廢流程 (無特殊情況，無自動重印)

1.  **開啟作廢對話框**: 使用者從 Admin Panel 觸發 "Void Pallet"，打開 `VoidPalletDialog`。對話框開啟時會重置之前的狀態。
2.  **搜尋棧板**:
    *   使用者在 `UnifiedSearch` 輸入框中輸入棧板號或系列號。
    *   失焦或按 Enter 後，系統自動搜尋。
    *   `useVoidPallet` Hook 調用後端 Action 獲取棧板資訊 (來自 `record_palletinfo`) 及其最新位置 (來自 `record_history`)。
    *   如果棧板不存在、或已作廢/損壞，顯示錯誤提示。
3.  **顯示棧板資訊**: `PalletInfoCard` 顯示棧板詳細資訊。
4.  **選擇作廢原因與確認**:
    *   使用者從 `VoidForm` 提供的列表中選擇作廢原因 (例如 "Obsolete Stock", "Quality Issue - No Reprint")。
    *   輸入操作員密碼或 Clock Number 進行身份驗證。
5.  **執行作廢 (`voidPalletAction`)**:
    *   **驗證身份**: 確認操作員權限。
    *   **更新 `record_palletinfo`**: (可能) 標記棧板狀態為 "Voided" 或更新備註。
    *   **更新 `record_inventory`**: 根據棧板的最後已知位置 (`loc`) 和數量 (`product_qty`)，從對應的庫存欄位中扣除庫存。
    *   **寫入 `record_history`**: 新增一條歷史記錄，`action` 為 "Void Pallet"，`loc` 更新為 "Voided"，並記錄作廢原因和操作員 ID。
    *   **寫入 `report_void` (如果使用)**: 記錄詳細的作廢事件。
6.  **結果反饋**: 透過 Toast 提示操作成功或失敗。成功後，對話框自動關閉並重置。

### B. 特殊棧板作廢流程

#### 1. 作廢 ACO 訂單棧板

*   **檢測**: 在 `voidPalletAction` 中，檢查棧板的 `plt_remark` 是否包含 "ACO Ref" 及訂單號 (正則表達式如 `/ACO\s+Ref\s*:\s*(\d+)/i`)。
*   **處理**:
    *   執行上述一般作廢流程中的資料庫更新。
    *   額外調用 `updateACORecord` Action：
        *   根據提取的 ACO 訂單參考號和棧板的產品代碼 (`product_code`)，在 `record_aco` 表中找到對應記錄。
        *   將被作廢棧板的數量 (`product_qty`) 加回到該 ACO 記錄的 `remain_qty` 欄位。
        *   此操作的成功與否通常不會阻塞主要的作廢流程，但會記錄日誌。

#### 2. 作廢 Material GRN 棧板

*   **檢測**: 在 `voidPalletAction` 中，檢查棧板的 `plt_remark` 是否包含 "Material GRN" 及 GRN 單號 (正則表達式如 `/Material\s+GRN\s*-\s*(\w+)/i`)。
*   **處理**:
    *   執行上述一般作廢流程中的資料庫更新。
    *   額外調用 `deleteGRNRecord` Action：
        *   根據棧板號 (`plt_num`)，在 `record_grn` 表中刪除對應的 GRN 記錄。
        *   此操作的成功與否通常不會阻塞主要的作廢流程，但會記錄日誌。

### C. 自動重印流程 (針對特定作廢原因)

當使用者選擇以下作廢原因時，會觸發自動重印流程：
-   `Damage` (部分損壞，需要重印剩餘部分)
-   `Wrong Qty` (數量錯誤，需要以正確數量重印)
-   `Wrong Product Code` (產品代碼錯誤，需要以正確產品代碼重印)

**流程步驟**:

1.  **執行初步作廢**:
    *   與一般作廢流程類似，先執行對原棧板的資料庫更新 (更新 `record_palletinfo`, `record_inventory`, `record_history`, `report_void`)。
    *   對於 `Damage`，`record_inventory` 的扣減邏輯會有所不同：部分數量可能進入 "damage" 庫存，剩餘部分等待重印。

2.  **收集重印資訊 (`ReprintInfoDialog`)**:
    *   在原棧板成功作廢後，如果選擇的是上述特定原因，`VoidPalletDialog` 在關閉前或關閉後 (為避免重疊) 會觸發顯示 `ReprintInfoDialog`。
    *   此對話框會根據作廢原因要求使用者輸入必要信息：
        *   **Damage**: (可能自動計算或要求確認) 損壞數量，系統計算出剩餘可重印數量。
        *   **Wrong Qty**: 要求輸入正確的數量。
        *   **Wrong Product Code**: 要求輸入正確的產品代碼。

3.  **調用自動重印 API (`/api/auto-reprint-label`)**:
    *   使用者在 `ReprintInfoDialog` 中確認資訊後，前端將原始棧板資訊及修正後的資訊 (`ReprintInfoInput`) 傳遞給 `/api/auto-reprint-label` API 端點。
    *   傳遞的參數包括：修正後的產品代碼、修正後的數量、原棧板號、原棧板位置、操作員 Clock Number 等。

4.  **後端自動重印處理**:
    *   API 端點接收請求後執行以下操作：
        *   **產生新棧板號**: 格式為 `ddMMyy/N`。
        *   **產生新系列號**: 格式為 `ddMMyy-XXXXXX`。
        *   **獲取產品描述**: 根據 (修正後的) 產品代碼從 `data_code` 查詢。
        *   **插入新 `record_palletinfo`**: 使用新的棧板號、系列號、修正後的產品代碼和數量，原棧板位置 (`originalLocation`) 等創建新記錄。`plt_remark` 可能會標註此為重印棧板。
        *   **插入新 `record_history`**: 記錄新棧板的創建，`action` 可能為 "QC Label Reprint" 或類似，`loc` 為原棧板位置。
        *   **更新 `record_inventory`**: 在新棧板的對應位置增加庫存 (以修正後的數量)。
        *   **產生 PDF 標籤**: 使用與 QC 標籤類似的邏輯 (`QcInputData`)，但操作員 (`operatorClockNum`) 固定為 "-"，QC操作員 (`qcClockNum`) 為執行作廢/重印的操作員ID。
        *   **上傳 PDF**: 將產生的 PDF 上傳到 Supabase Storage (如 `qc-labels` 路徑)。
        *   **返回 PDF URL 或檔案**: 將 PDF 的 URL 或直接將 PDF 檔案內容返回給前端。

5.  **前端處理與下載**:
    *   前端接收到 API 回應後，自動觸發新標籤 PDF 的下載。
    *   Toast 通知使用者新棧板已創建並標籤已成功重印。

## UI 與使用者體驗特性

-   **對話框界面**: 操作在當前頁面的對話框中完成，無需頁面跳轉，提升流暢性。
-   **失焦/Enter 搜尋**: 簡化搜尋操作，輸入完成後失焦或按 Enter 即自動搜尋。
-   **自動重印**: 對特定作廢原因，提供高度自動化的重印流程，減少手動操作。
-   **智能詢問**: `ReprintInfoDialog` 僅詢問當前重印場景下必要的修正資訊。
-   **清晰反饋**: 每一步操作都有明確的 Toast 通知 (成功、失敗、警告)。
-   **界面重置**: 對話框每次打開或操作完成後，狀態都會重置，確保操作的獨立性。
-   **響應式設計**: 適應不同螢幕尺寸。

## 注意事項

-   作廢操作不可逆，需謹慎操作並通過身份驗證。
-   自動重印流程依賴 `/api/auto-reprint-label` 的正確實現。
-   庫存位置的準確性對庫存扣減至關重要，`getLatestPalletLocation` 的邏輯和位置映射 (`mapLocationToDbField` 或 `getInventoryColumn`) 必須正確。
-   對於 ACO 和 GRN 棧板的特殊處理邏輯，依賴於 `plt_remark` 中特定的字串模式。
-   PDF 標籤上的操作員資訊：Operator Clock Num 固定為 "-"，Q.C. Done By 為實際執行作廢和重印的操作員 ID。 