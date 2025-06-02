# 查看歷史記錄 (View History)

## 概述

本文件說明系統中的 "查看歷史記錄" (View History) 功能。此功能允許使用者透過輸入棧板號碼 (Pallet Number) 或系列號 (Series Number)，或掃描 QR Code (移動端)，來查詢特定棧板的完整生命週期資訊。查詢結果包括棧板的基本資料、詳細的操作歷史時間軸以及相關的庫存狀態。此功能已從原來的獨立頁面 (`/view-history`) 優化為在管理員面板 (`/admin`) 中以對話框形式提供，以提升使用者體驗和界面一致性。

## 相關頁面及組件

### 主要觸發位置
- `/admin`: 管理員面板。使用者可以從管理員功能列表 (可能在 "Admin Panel Popover" 的 "History" 標籤頁，或其他類似入口) 找到 "View History" 選項並點擊，以打開歷史記錄查詢對話框。

### 核心組件
- `app/components/admin-panel-menu/ViewHistoryDialog.tsx` (或類似名稱): 查看歷史記錄的核心對話框組件。
    - 包含搜尋輸入、結果展示區等。
    - 設計上採用與系統一致的深色主題和現代化視覺效果 (如玻璃擬態、漸層、光效)。
- `components/ui/unified-search.tsx` (或其變體): 用於輸入棧板號或系列號的統一搜尋框。
    - 自動檢測輸入格式。
    - (可能) 支援 Enter 鍵觸發搜尋。
- **結果展示卡片**: 對話框內部會使用多個卡片來組織和顯示查詢結果：
    - `app/view-history/components/PalletInfoCard.tsx`: 顯示棧板的基本資訊和產品詳情。
    - `app/view-history/components/HistoryTimeline.tsx`: 以時間軸的形式展示棧板的操作歷史。
    - `app/view-history/components/StockInfoCard.tsx`: 顯示與該棧板產品相關的庫存資訊。
- `app/components/ui/stock-movement-layout.tsx` (`StockMovementLayout`): (如果查詢結果頁面結構類似庫存移動頁面) 可能提供統一的佈局和深色主題。
- `StatusMessage`: 用於顯示搜尋狀態、成功、警告或錯誤訊息。

### 後端/核心邏輯
- `app/actions/viewHistoryActions.ts` (包含 `getPalletHistoryAndStockInfo` Server Action): 負責處理後端數據查詢。
    - 接收搜尋類型 (棧板號/系列號) 和搜尋值。
    - 查詢 `record_palletinfo` 表獲取棧板基本資訊。
    - 查詢 `data_code` 表獲取產品詳細描述。
    - 查詢 `record_history` 表獲取該棧板的所有歷史操作記錄，並按時間排序。
    - 查詢 `record_inventory` 表獲取相關產品的庫存分佈情況。
- **認證**: 使用 `app/hooks/useAuth.ts` 或 Supabase Auth 直接進行使用者身份驗證。

### UI 主題與風格
- 與 Admin Panel 和其他現代化組件 (如 VoidPalletDialog) 保持一致的深色主題。
- 卡片元素採用不同的強調色 (如藍色、綠色、橙色) 來區分不同類型的資訊。
- 英文介面。
- 響應式設計，適應不同螢幕尺寸。

## 相關資料庫表

- `record_palletinfo`: 獲取棧板的基本資訊，如 `plt_num`, `series`, `product_code`, `product_qty`, `generate_time`, `plt_remark`。
- `data_code`: 根據 `product_code` 獲取產品的詳細描述、類型、顏色、標準數量等。
- `record_history`: 獲取特定 `plt_num` 的所有操作記錄，包括 `time`, `action`, `loc`, `id` (操作員), `remark`。記錄會按時間排序（通常最舊的在最上方）。
- `record_inventory`: 獲取與棧板上產品 (`product_code`) 相關的各位置庫存量 (`injection`, `pipeline`, `prebook`, `await`, `fold`, `bulk`, `backcarpark`, `damage` 等) 及最後更新時間 (`latest_update`)。

## 工作流程

1.  **觸發功能**:
    *   使用者在 `/admin` 頁面點擊 "View History" (或類似) 選項。

2.  **顯示對話框與重置狀態**:
    *   `ViewHistoryDialog` 彈出。
    *   對話框開啟時，會清除上一次的搜尋結果和狀態，確保全新搜尋。

3.  **輸入查詢條件**:
    *   使用者在對話框內的 `UnifiedSearch` 組件中輸入棧板號 (如 `260525/1`) 或系列號 (如 `260525-5UNXGE`)。輸入值會自動轉為大寫。
    *   系統會根據輸入是否包含 `/` 或 `-` 來初步判斷是棧板號還是系列號。

4.  **執行搜尋**:
    *   使用者按 Enter 鍵或點擊搜尋按鈕 (如果有的話)。
    *   前端觸發 `getPalletHistoryAndStockInfo` Server Action，傳遞搜尋類型和搜尋值。
    *   顯示載入狀態。

5.  **後端數據處理 (`getPalletHistoryAndStockInfo`)**:
    *   **查詢棧板資訊**:
        *   如果按系列號搜尋，先從 `record_palletinfo` 根據 `series` 找到對應的 `plt_num`。
        *   根據 `plt_num` 從 `record_palletinfo` 獲取棧板的完整資訊。
        *   根據 `product_code` 從 `data_code` 獲取產品的詳細描述。
    *   **查詢操作歷史**: 根據 `plt_num` 從 `record_history` 查詢所有相關記錄，並按 `time` 欄位升序排序 (最舊的在前)。
    *   **查詢庫存資訊**: 根據 `product_code` (或 `plt_num` 關聯的 `product_code`) 從 `record_inventory` 查詢各位置的庫存數量。
    *   將查詢到的三部分資訊 (棧板資訊、歷史記錄、庫存資訊) 組合返回給前端。

6.  **顯示結果**:
    *   前端接收到數據後，`ViewHistoryDialog` 會更新界面以展示結果。
    *   搜尋框區域可能會被隱藏，並顯示 "New Search" 按鈕，以便使用者進行新的查詢。
    *   結果通常以三欄式佈局 (桌面端) 或響應式堆疊 (移動端) 展示：
        *   **Pallet Information Card**: 顯示棧板號、產品代碼、描述、數量、生成時間、備註等。原設計中可能顯示的 Series 號在此卡片中被移除，以簡化資訊。
        *   **History Timeline Card**: 以時間軸方式展示操作歷史，每條記錄包含操作類型 (`action`)、時間 (`time`)、地點 (`loc`)、操作員 (`id`) 和備註 (`remark`)。使用圖示增強可讀性。
        *   **Stock Information Card**: 顯示該產品的總庫存量以及在不同倉庫位置的具體分佈數量。原設計中可能顯示的 Product Code 在此卡片中被移除，以避免與 Pallet Info Card 重複。
    *   如果未找到記錄，顯示 "No records found" 的提示。
    *   如果發生錯誤，顯示相應的錯誤訊息。

7.  **新的搜尋/關閉對話框**:
    *   使用者可以點擊 "New Search" 按鈕清空當前結果並重新顯示搜尋框，進行新的查詢。
    *   使用者可以點擊關閉按鈕關閉 `ViewHistoryDialog`。對話框關閉時會再次清理狀態。

## UI 與使用者體驗特性

-   **對話框模式**: 避免頁面跳轉，操作更流暢，上下文不易丟失。
-   **統一風格**: 與 Admin Panel 和其他現代化對話框 (如 VoidPalletDialog) 保持一致的視覺設計 (深色主題、玻璃擬態、漸層、光效等)。
-   **響應式佈局**: 三欄資訊卡片在不同設備上能良好適應。
-   **清晰的資訊組織**: 使用卡片和時間軸等形式，結構化地展示複雜資訊。
-   **動態界面**: 搜尋前顯示搜尋框，搜尋後顯示結果和 "New Search" 按鈕。
-   **明確的狀態反饋**: 清晰的載入、成功、警告、錯誤提示。
-   **圖示增強**: 在歷史記錄和庫存資訊中使用圖示提高可讀性。
-   **歷史排序**: 操作歷史按時間升序排列，符合閱讀習慣。
-   **資訊去重**: 在不同卡片間避免不必要的資訊重複 (如 StockInfoCard 中不再顯示 Product Code)。

## 注意事項

-   搜尋時，棧板號和系列號的格式需要正確才能匹配到數據。
-   操作歷史的準確性依賴於系統中所有相關操作都被正確記錄到 `record_history` 表。
-   庫存資訊的準確性依賴於 `record_inventory` 表的即時更新。 