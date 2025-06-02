# 列印 QC 標籤 (Slate 產品流程)

## 概述

本文件說明在系統中為 "Slate" 類型產品列印 QC 標籤的工作流程。Slate 產品的流程經過簡化，核心要求是輸入 Batch Number。系統不再使用獨立的 `record_slate` 表，而是將 Batch Number 資訊整合到主要的 `record_palletinfo` 和 `record_history` 表中。

## 相關頁面及組件

### 主要頁面
- `/print-label`: 列印 QC 標籤的主頁面。

### 核心組件
位於 `app/components/qc-label-form/`：
- `PerformanceOptimizedForm.tsx`: 主表單組件。
    - `SlateSection` (或類似的 Slate 特定表單部分): 用於輸入 Slate 產品的 Batch Number。此部分經過簡化，僅需 Batch Number。
- `ProductSection`: 用於輸入產品資訊的區塊。
- `ProgressSection`: 顯示標籤列印進度的區塊。
- `ClockNumberConfirmDialog.tsx`: 操作員身份確認。

### 核心業務邏輯 Hook
- `app/components/qc-label-form/hooks/useQcLabelBusiness.ts`: 包含 QC 標籤生成的核心業務邏輯，並為 Slate 產品作了特殊處理：
    - **Slate 產品類型檢測**: 當使用者輸入產品代碼時，系統會檢查產品是否為 'Slate' 類型。
    - **簡化輸入**: 如果是 Slate 產品，表單會簡化，主要輸入欄位為 Batch Number。其他如 First-Off Date、詳細規格等欄位不再是必填或被移除。
    - **托盤數量限制**: Slate 產品的托盤數量 (`count`) 通常被自動或建議設置為 1。
    - **資料庫操作**:
        - 不再寫入 `record_slate` 表。
        - **`record_palletinfo`**: `plt_remark` 欄位會記錄為 `"Finished In Production Batch Num : [使用者輸入的Batch Number]"`。
        - **`record_history`**: `remark` 欄位會記錄為 `"Batch Num : [使用者輸入的Batch Number]"`。
        - 正常插入 `record_inventory`。

### 相關資料庫表
- `record_palletinfo`: 儲存棧板資訊，`plt_remark` 用於記錄 Batch Number。
- `record_history`: 儲存操作歷史，`remark` 用於記錄 Batch Number。
- `record_inventory`: 儲存庫存記錄。
- `data_code`: 儲存產品資訊，包括產品類型。
- `record_slate`: **已取消**，不再使用。

### 相關舊有文件
- `docs/slateOrder.md`: 詳細描述了 Slate 產品訂單的簡化工作流程、技術實現、Batch Number 的記錄方式等。
- `docs/qcLabel.md`: 描述了通用的 QC 標籤功能實現。

## 工作流程

1.  **產品輸入與類型檢測**:
    *   使用者在 `/print-label` 頁面的 `ProductSection` 輸入產品代碼。
    *   系統查詢 `data_code` 表，檢測產品類型。
    *   如果產品類型為 'Slate'，則顯示 Slate 產品特定的簡化表單區塊 (`SlateSection`)。

2.  **Slate 產品資訊輸入**:
    *   **Batch Number**: 使用者在 `SlateSection` 中輸入該 Slate 產品的 Batch Number。這是 Slate 產品流程的核心必填資訊。
    *   **數量**: 使用者輸入產品數量 (`quantity`)。
    *   **托盤數量 (`count`)**: 此欄位對於 Slate 產品通常固定為 1 或由系統自動設定為 1。

3.  **身份確認**:
    *   提交前，透過 `ClockNumberConfirmDialog` 進行身份驗證。

4.  **資料準備與批量處理**:
    *   `generatePalletNumbers()` 和 `generateMultipleUniqueSeries()` 產生棧板號和系列號。
    *   `prepareQcLabelData()` 準備 PDF 資料。

5.  **資料庫操作**:
    *   對於每個棧板（通常只有一個）：
        *   **`record_palletinfo`**:
            *   `plt_num`: 自動產生的棧板號碼。
            *   `series`: 自動產生的系列號。
            *   `product_code`: 使用者選擇的產品代碼。
            *   `product_qty`: 使用者輸入的數量。
            *   `plt_remark`: 固定格式 `"Finished In Production Batch Num : [Batch Number]"`。
        *   **`record_history`**:
            *   `time`: 當前時間戳。
            *   `id`: 操作員時鐘號碼。
            *   `action`: "Finished QC"。
            *   `plt_num`: 對應的棧板號碼。
            *   `loc`: "Await"。
            *   `remark`: 固定格式 `"Batch Num : [Batch Number]"`。
        *   **`record_inventory`**:
            *   `product_code`: 產品代碼。
            *   `plt_num`: 棧板號碼。
            *   `await`: 等待數量 (等於 `product_qty`)。
        *   **不再操作 `record_slate` 表。**

6.  **PDF 產生與上傳**:
    *   `generateAndUploadPdf()` 產生 QC 標籤 PDF 並上傳。PDF 上可能不直接顯示 Batch Number，或根據需求調整。

7.  **列印觸發與進度顯示**:
    *   與正常流程類似，觸發列印並顯示進度。

## UI 與使用者體驗特性 (參考 `docs/slateOrder.md`)

-   **極簡表單**: 針對 Slate 產品，大幅減少了需要使用者填寫的欄位，僅保留 Batch Number 為核心輸入。
-   **操作效率提升**: 由於輸入簡化，操作員可以更快完成 Slate 產品的標籤列印。

## Batch Number 追蹤

由於 Batch Number 被記錄在 `record_palletinfo.plt_remark` 和 `record_history.remark` 中，可以透過 SQL 查詢進行追蹤：
-   查詢 `record_palletinfo` 中特定 Batch Number 的棧板:
    ```sql
    SELECT * FROM record_pallet_info WHERE plt_remark LIKE '%Batch Num : [YourBatchNumber]%';
    ```
-   查詢 `record_history` 中特定 Batch Number 的操作記錄:
    ```sql
    SELECT * FROM record_history WHERE remark LIKE '%Batch Num : [YourBatchNumber]%';
    ```

## 注意事項

-   Slate 產品的流程設計核心是簡化操作，因此表單應保持簡潔。
-   確保 `useQcLabelBusiness.ts` 中的邏輯能正確識別 'Slate' 類型產品，並應用上述的資料記錄規則。
-   由於 `record_slate` 表已取消，所有依賴此表的舊有查詢或邏輯都需要更新。 