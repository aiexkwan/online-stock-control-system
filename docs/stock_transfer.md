# 庫存轉移

## 概述

本文件說明系統中的庫存轉移 (Stock Transfer) 功能。該功能允許使用者透過掃描 QR Code 或手動輸入托盤號/系列號，在不同倉儲位置之間轉移托盤。系統會根據預設的業務規則自動計算目標位置，並自動執行轉移操作。

## 相關頁面及組件

### 主要頁面
- `/stock-transfer`: 庫存轉移操作的主頁面。

### 核心組件
- `app/stock-transfer/page.tsx`: 包含庫存轉移頁面的主要邏輯和 UI 結構。
- `components/ui/unified-search.tsx`: 統一的搜尋組件，支援手動輸入和 QR Code 掃描，能夠智能識別托盤號和系列號。
- `app/components/qc-label-form/ClockNumberConfirmDialog.tsx`: 用於操作員身份 (Clock Number) 確認。
- `components/ui/stock-movement-layout.tsx` (`StockMovementLayout`): 提供庫存移動相關頁面的統一佈局和深色主題。
- `StatusMessage`: 用於顯示操作成功或失敗的狀態訊息。
- `OperationGuide`: 顯示操作步驟指南。
- `ActivityLog`: (可能) 實時顯示操作日誌。

### 核心業務邏輯 Hook
- `app/hooks/useStockMovement.tsx`: 集中處理庫存轉移的核心邏輯，包含：
    - `searchPalletInfo`: 根據托盤號或系列號搜尋托盤資訊 (產品代碼、數量、當前位置等)。
        - 會先從 `record_palletinfo` 獲取托盤基本資訊。
        - 再從 `record_history` 獲取該托盤最新的位置資訊 (`loc`)。
    - `calculateTargetLocation`: 根據當前位置和預設業務規則計算下一個目標位置。
    - `executeStockTransfer`: 執行實際的庫存轉移資料庫操作。
        - 插入一條新的 `record_history` 記錄，標明新的位置和轉移操作。
        - 更新 `record_inventory` 中對應產品在舊位置和新位置的庫存數量。

### UI 主題與風格
- 整體採用深色主題 (`bg-gray-900`, `bg-gray-800`)。
- 以藍色作為強調色 (`text-blue-400`, `border-blue-400`)。
- 英文介面。

## 相關資料庫表
- `record_palletinfo`: 儲存托盤的基本資訊（`plt_num`, `product_code`, `product_qty`, `series`, `plt_remark`）。**注意：此表不直接儲存托盤的當前位置 (`plt_loc`)**。
- `record_history`: 儲存所有操作歷史，包括庫存轉移。托盤的當前位置是從此表中該托盤號 (`plt_num`) 時間最新的記錄的 `loc` 欄位確定的。
    - `action`: 對於庫存轉移，為 "Stock Transfer"。
    - `loc`: 記錄轉移後的目標位置。
    - `remark`: 可能記錄如 "Moved from [SourceLocation] to [TargetLocation]"。
- `record_inventory`: 記錄每個產品在不同位置的庫存量。轉移時會：
    - 減少來源位置的庫存 (`[fromColumn]: -productQty`)。
    - 增加目標位置的庫存 (`[toColumn]: productQty`)。
    - 位置名稱到資料庫欄位名的映射 (如 `Production` -> `injection`, `Await` -> `await`) 在 `useStockMovement.tsx` 中定義。
- `data_id`: (可能) 用於驗證操作員的 Clock Number。
- `record_transfer`: 舊有的轉移記錄表，**可能已被 `record_history` 的通用日誌記錄方式取代或不再是主要依賴**。最新的實現傾向於直接操作 `record_history` 和 `record_inventory`。

## 工作流程 (自動執行轉移)

1.  **使用者輸入/掃描**:
    *   在 `/stock-transfer` 頁面的 `UnifiedSearch` 組件中，使用者手動輸入托盤號 (如 `ddMMyy/N`) 或系列號 (如 `ddMMyy-XXXXXX`)，或掃描 QR Code。
    *   搜尋框有自動聚焦功能，頁面載入完成或每次操作完成後都會自動聚焦。

2.  **智能搜尋與資訊確認**:
    *   `useStockMovement` Hook 中的 `searchPalletInfo` 函數被觸發。
    *   系統智能判斷輸入的是托盤號還是系列號。
        - 如果包含 `/`，視為托盤號，查詢 `record_palletinfo.plt_num`。
        - 如果包含 `-`，視為系列號，查詢 `record_palletinfo.series`。
        - 如果格式不明確，會先嘗試按托盤號搜尋，失敗則再嘗試按系列號搜尋。
    *   **保持原始大小寫**: 搜尋時不會將輸入轉換為小寫，以確保與資料庫數據匹配。
    *   如果找到托盤，系統會顯示托盤的基本資訊（產品代碼、數量）及其從 `record_history` 中獲取的當前位置。
    *   如果未找到，顯示錯誤訊息。

3.  **計算目標位置**:
    *   `calculateTargetLocation` 函數根據托盤的當前位置和以下業務規則自動計算目標位置：
        *   **第一次移動**: `Await` → `Production`
        *   **第二次移動**: `Production` → `Fold Mill`
        *   **第三次移動**: `Fold Mill` → `Production` (形成 `Production` 与 `Fold Mill` 之間的循環)
        *   **其他位置**: 從任何其他非循環內的位置（如 `PipeLine`, `Bulk Room` 等）統一移動到 `Production`。
        *   **作廢托盤**: 如果托盤的當前位置是 'Voided'，則無法移動，不計算目標位置。

4.  **身份確認**:
    *   在執行轉移前，系統會彈出 `ClockNumberConfirmDialog` 要求操作員輸入 Clock Number。

5.  **自動執行轉移 (確認後)**:
    *   一旦成功計算出有效的目標位置並且操作員身份確認通過，`executeStockTransfer` 函數會**自動執行**轉移，無需使用者手動點擊"執行"按鈕。
    *   **資料庫操作**:
        1.  **寫入 `record_history`**:
            *   `id`: 操作員的 Clock Number。
            *   `action`: "Stock Transfer"。
            *   `plt_num`: 被轉移的托盤號。
            *   `loc`: 計算出的目標位置。
            *   `remark`: 例如 "Moved from [來源位置] to [目標位置]"。
            *   `time`: 當前時間戳。
        2.  **更新 `record_inventory`**:
            *   根據來源位置和目標位置的映射 (`locationToColumn`)，找到對應的庫存欄位。
            *   在來源位置的庫存欄位減去托盤數量 (`product_qty`)。
            *   在目標位置的庫存欄位增加托盤數量 (`product_qty`)。
    *   此過程**不依賴**舊的 `process_atomic_stock_transfer` RPC 函數，而是直接在前端 (透過 Supabase client) 執行這兩步資料庫操作。

6.  **結果反饋與重置**:
    *   如果轉移成功：
        *   `StatusMessage` 顯示成功訊息，例如 "Pallet [plt_num] successfully moved to [targetLocation]"。
        *   清除已掃描的托盤資訊。
        *   清空搜尋框 (`searchValue`)。
        *   搜尋框自動重新聚焦，準備下一次操作。
    *   如果轉移失敗 (例如資料庫操作錯誤)：
        *   `StatusMessage` 顯示錯誤訊息。
        *   系統會保持在轉移前的狀態，允許使用者重試或檢查問題。

## UI 與使用者體驗特性

-   **自動化**: 搜尋成功並計算出目標位置後自動執行轉移，減少了使用者的點擊操作。
-   **即時反饋**: 操作的每一步都有清晰的狀態訊息和步驟指示。
-   **簡化操作**: 移除了手動的 "Execute Transfer" 按鈕。
-   **智能搜尋**: 自動識別輸入類型，並對大小寫敏感的編號進行正確搜尋。
-   **自動聚焦**: 提高連續操作的效率。
-   **操作指導**: `OperationGuide` 清晰列出自動化後的簡化操作步驟。

## 注意事項

-   托盤的當前位置資訊 (`current_plt_loc`) 是從 `record_history` 表中查詢得到的最新記錄，而不是直接從 `record_palletinfo` 表。
-   轉移規則是預先定義的，確保了庫存流動的標準化。
-   由於前端直接執行多個資料庫操作，雖然實際使用中風險可控，但這並非嚴格意義上的原子事務。後續可考慮在後端實現原子性操作的 RPC。
-   位置名稱到 `record_inventory` 表欄位名稱的映射 (`locationToColumn`) 是硬編碼在 `useStockMovement.tsx` 中的，若位置或欄位名變更需要同步更新。 