# 資料庫更新 (Data Update)

## 概述

本文件說明系統中與核心數據表更新相關的工作流程，主要集中在產品資訊 (`data_code`) 的管理，但也可能涉及操作員資訊 (`data_id`) 和供應商資訊 (`data_supplier`) 的更新。這些操作通常由具有特定權限的使用者 (如管理員) 透過系統的管理界面執行。

## 相關頁面及組件

### 主要頁面/觸發點
-   **產品更新頁面 (`/products` 或 `/productUpdate` 或類似)**:
    -   提供搜尋現有產品、修改產品資訊以及新增產品的功能。
    -   此頁面可能整合在 Admin Panel 中，例如 Admin Panel -> Product Update。
-   **使用者管理頁面 (`/users` 或 `/access/update` 或類似)**:
    -   用於管理 `data_id` 表中的使用者資訊 (如新增操作員、修改權限等，雖然 `productUpdate.md` 未直接詳述，但此為常見的管理功能)。
    -   此頁面可能整合在 Admin Panel 中，例如 Admin Panel -> Access Update。
-   **供應商管理頁面**:
    -   用於管理 `data_supplier` 表中的供應商資訊 (新增、修改)。

### 核心組件
-   **搜尋框**: 用於按產品代碼搜尋 `data_code` 表中的產品。支援大小寫不敏感的智慧搜尋。
-   **產品資訊表單**:
    -   用於顯示搜尋到的產品的現有資訊 (Code, Description, Colour, Standard Quantity, Type)。
    -   允許使用者修改這些欄位。
    -   用於新增產品時，清空表單供使用者輸入新產品的全部資訊。
-   **保存/新增按鈕**: 觸發更新或創建產品的後端操作。
-   **通知組件**: 如 `Sonner Toast`，用於顯示操作成功或失敗的訊息。

### 後端/核心邏輯
-   `app/actions/productActions.ts`: 包含與 `data_code` 表互動的 Server Actions:
    -   `getProductByCode(code)`: 智能搜尋產品，先嘗試精確匹配，失敗則進行大小寫不敏感的 `ilike` 搜尋。
    -   `updateProduct(code, productData)`: 更新指定產品代碼 (`code`) 的產品資訊。會先用大小寫不敏感的方式找到實際的產品代碼，然後進行精確更新。
    -   `createProduct(productData)`: 創建一個新的產品記錄。
    -   `checkProductExists(code)`: 檢查產品代碼是否已存在 (大小寫不敏感)。
    -   `recordProductHistory(action, productCode, userEmail)`: 自動記錄產品更新或新增操作到 `record_history` 表。
-   類似的 Server Actions 可能存在用於管理 `data_id` 和 `data_supplier`。

## 資料庫表結構與更新涉及的主要表格

參考 `docs/databaseStructure.md`：

1.  **`data_code` (產品主檔)**
    *   **欄位**: `code` (Primary Key), `description`, `colour`, `standard_qty`, `type`。
    *   **更新操作**:
        *   **新增 (Create)**: 透過 `createProduct` Action，使用者輸入所有欄位資訊，創建新的產品記錄。系統會先用 `checkProductExists` 檢查代碼是否已存在，防止重複。
        *   **修改 (Update)**: 透過 `updateProduct` Action，使用者修改一個或多個欄位 (Description, Colour, Standard Qty, Type)。`code` 通常不允許直接修改，若需變更代碼，一般流程是作廢舊代碼，新增新代碼。

2.  **`data_id` (使用者/操作員資訊)**
    *   **欄位**: `name`, `id` (Primary Key, 通常為 Clock Number), `email`, `uuid` (Supabase Auth User ID)。
    *   **更新操作**: (推測，基於常見管理功能)
        *   **新增**: 新增操作員時，填寫姓名、員工號 (id)、郵箱。`uuid` 可能在使用者首次透過 Supabase Auth 登入或註冊時關聯。
        *   **修改**: 修改姓名、郵箱等。`id` 和 `uuid` 通常不變。也可能涉及權限或部門的更新 (如果表結構支持)。

3.  **`data_supplier` (供應商主檔)**
    *   **欄位**: `supplier_code` (Primary Key), `supplier_name`。
    *   **更新操作**: (推測)
        *   **新增**: 輸入新的供應商代碼和名稱。
        *   **修改**: 修改現有供應商的名稱。

4.  **`record_history` (操作歷史記錄)**
    *   **欄位**: `time`, `id` (操作員 Clock Number，對於產品更新操作此處為 `null`), `action`, `plt_num` (對於產品更新操作此處為 `null` 或產品代碼), `loc`, `remark`, `uuid`。
    *   **更新操作**:
        *   在 `data_code` 表進行新增或修改操作時，`recordProductHistory` 函數會自動被調用。
        *   `action`: 記錄為 "Product Added" 或 "Product Update"。
        *   `remark`: 記錄格式為 "{產品代碼}, By {使用者名稱}" (使用者名稱從操作者 Email 中提取)。
        *   `id`: 由於 `productActions` 中的 `recordProductHistory` 函數的 `id` 欄位被設置為 `null` (因為 `record_history.id` 通常關聯 `data_id.id`，而產品操作的直接主體是產品本身，操作者信息記錄在 `remark` 中)，這裡的 `id` 指的是 `data_id.id`。

## 工作流程範例: 更新產品資訊 (`data_code`)

1.  **使用者導航**: 使用者進入產品更新頁面 (如 `/products`)。
2.  **搜尋產品**:
    *   使用者在搜尋框中輸入待更新的產品代碼 (例如 `mep9090150`)。
    *   前端調用 `getProductByCode` Server Action。
    *   後端首先嘗試精確匹配 `MEP9090150`，如果找不到，則嘗試 `ilike '%mep9090150%'`。
3.  **顯示產品資訊**:
    *   如果找到產品，表單中會填充該產品的現有描述、顏色、標準數量和類型。
    *   如果未找到，提示使用者 "Product not found"，並可能提供新增產品的選項。
4.  **修改資訊**: 使用者在表單中修改所需欄位 (例如，更改 `description` 或 `standard_qty`)。
5.  **保存更新**: 使用者點擊 "Save" 或 "Update" 按鈕。
6.  **執行更新 (`updateProduct`)**:
    *   前端調用 `updateProduct` Server Action，傳遞產品代碼和已修改的數據。
    *   後端再次使用大小寫不敏感的方式確認產品的實際 `code` (以處理使用者搜尋時可能輸入不同大小寫的情況)。
    *   使用該實際 `code` 作為條件，更新 `data_code` 表中對應的記錄。
7.  **記錄歷史 (`recordProductHistory`)**:
    *   在 `updateProduct` 成功後，內部調用 `recordProductHistory`。
    *   傳入 `action: 'Product Update'`, `productCode: (實際的產品代碼)`, `userEmail: (當前操作員的email)`。
    *   一條新的歷史記錄被插入到 `record_history` 表，`remark` 中包含產品代碼和操作員名稱。
8.  **結果反饋**:
    *   前端根據 `updateProduct` 的返回結果，透過 Toast 顯示成功或失敗訊息。

## 工作流程範例: 新增產品 (`data_code`)

1.  **使用者導航與觸發**: 使用者在產品管理頁面點擊 "Add New Product" (或類似) 按鈕。
2.  **填寫表單**: 產品資訊表單為空，使用者輸入新產品的 `code`, `description`, `colour`, `standard_qty`, `type`。
3.  **提交新增**: 使用者點擊 "Create" 或 "Add" 按鈕。
4.  **檢查產品是否存在 (`checkProductExists`)**:
    *   前端 (或後端 `createProduct` 內部) 首先調用 `checkProductExists`，傳入使用者輸入的 `code`。
    *   如果產品代碼已存在 (大小寫不敏感比較)，則提示錯誤 "Product code already exists"，阻止創建。
5.  **執行創建 (`createProduct`)**:
    *   如果產品代碼可用，前端調用 `createProduct` Server Action，傳遞完整的產品數據。
    *   後端將新記錄插入 `data_code` 表。
6.  **記錄歷史 (`recordProductHistory`)**:
    *   在 `createProduct` 成功後，內部調用 `recordProductHistory`。
    *   傳入 `action: 'Product Added'`, `productCode: (新產品的代碼)`, `userEmail: (當前操作員的email)`。
    *   一條新的歷史記錄被插入到 `record_history` 表。
7.  **結果反饋**: Toast 提示成功或失敗。

## 認證與授權

-   所有資料庫更新操作都需要使用者經過 Supabase Auth 認證。
-   相關的資料庫表 (如 `data_code`, `data_id`, `data_supplier`) 應配置適當的行級安全 (RLS) 策略，例如只允許特定角色 (如 `authenticated` 或 `admin`) 的使用者執行寫入操作 (INSERT, UPDATE, DELETE)。

## 注意事項

-   **大小寫敏感性**: 產品代碼的搜尋是大小寫不敏感的，但在資料庫中 `data_code.code` 通常是作為主鍵且大小寫敏感地儲存。更新和創建邏輯需要妥善處理這一點，以避免數據不一致或意外覆蓋。`productUpdate.md` 中描述的策略是搜尋時不敏感，更新時找到實際代碼再精確更新。
-   **數據驗證**: 前後端都應有數據驗證機制，確保輸入數據的格式和類型正確 (例如，`standard_qty` 應為數字)。
-   **操作歷史**: 記錄到 `record_history` 的操作員資訊是從登入使用者的 Email 中提取使用者名稱部分，而不是直接使用 `data_id.name`。這意味著 Email 的格式和 `recordProductHistory` 中的提取邏輯需要保持一致。
-   **錯誤處理**: Server Actions 應返回清晰的成功或錯誤訊息，前端根據這些訊息給予使用者適當的反饋。 