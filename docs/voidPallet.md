# 工作流程文檔 (Work Flow Documentation)

## Void Pallet - 分支 4.1: 部分損壞，剩餘貨物重新入庫並列印新標籤

**最後更新日期:** 2025-05-22 M3

**場景描述:**
用戶在 "Void Pallet" 頁面操作一個已存在的棧板。用戶選擇作廢原因為 "Damage"，並輸入一個小於棧板原始總數量的損壞數量。系統處理後，原棧板被標記為部分作廢，損壞品項被記錄，剩餘完好品項則以一個新的棧板號重新入庫到其原始位置，並引導用戶為新棧板列印標籤。

**涉及主要組件:**
*   Client (Void Pallet Page): `app/void-pallet/page.tsx`
*   Server Action (Void Pallet): `app/void-pallet/actions.ts`
*   SQL Function (Database): `process_damaged_pallet_void` (定義於 `docs/sql_function_library.md`)
*   Client (Print Label Page): `app/print-label/page.tsx` (及其後端邏輯)

---

**詳細流程步驟:**

**Phase 1: 用戶操作與觸發 (Client - `app/void-pallet/page.tsx`)**

1.  **用戶界面**:
    *   用戶喺 `/void-pallet` 頁面搜尋並加載一個棧板嘅信息 (`foundPallet`)。
    *   用戶選擇作廢原因 (`voidReason`) 為 "Damage"。
    *   用戶喺 `damageQtyInput` 輸入框輸入本次損壞嘅數量 (該數量 < `foundPallet.product_qty`)。
    *   用戶輸入操作密碼 (`passwordInput`)。
2.  **觸發 `handleVoidConfirm` 函數**:
    *   函數進行基本前端驗證 (必填項、損壞數量有效性、用戶 session)。
    *   準備調用 Server Action 所需嘅參數，包括 `userId`, `palletInfo` (包含原棧板號、產品代碼、原總數、原位置、原備註等), `password`, `voidReason` ("Damage"), `damageQty`。

**Phase 2: 處理舊棧板損壞 (Server Action - `app/void-pallet/actions.ts`)**

3.  **調用 `processDamagedPalletVoidAction`**:
    *   Client 端嘅 `handleVoidConfirm` 調用 `processDamagedPalletVoidAction` Server Action。
4.  **`processDamagedPalletVoidAction` 內部邏輯**:
    *   **a. 密碼驗證**: 調用 `verifyCurrentUserPasswordAction` 驗證用戶密碼。如果失敗，返回錯誤。
    *   **b. 參數準備**: 整理傳遞俾 SQL function `process_damaged_pallet_void` 所需嘅參數，例如 `p_user_id`, `p_plt_num`, `p_product_code`, `p_original_product_qty`, `p_damage_qty_to_process`, `p_current_true_location` (來自 `foundPallet.original_plt_loc`), `p_void_reason`, `p_original_plt_remark`。
    *   **c. 調用 SQL Function**: 執行 `await supabase.rpc('process_damaged_pallet_void', { ...prepared_params... })`。

**Phase 3: 數據庫核心邏輯 - 處理舊棧板 (SQL Function - `process_damaged_pallet_void`)**

5.  **`process_damaged_pallet_void` 函數執行**:
    *   **a. 驗證**: 再次校驗損壞數量、棧板當前狀態 (防止重複處理已作廢/損壞棧板)。
    *   **b. 確定庫存扣減位置**: 根據傳入嘅 `p_current_true_location` 映射到 `record_inventory` 表中嘅具體庫存欄位名 (e.g., `injection`, `pipeline` 等)。
    *   **c. 計算剩餘完好數量**: `v_remaining_good_qty = p_original_product_qty - p_damage_qty_to_process`。
    *   **d. 更新 `record_inventory` (庫存表)**:
        *   為此棧板嘅損壞事務，喺 `record_inventory` 中創建**單一筆記錄**，該記錄同時：
            *   從原位置庫存欄位 **扣減** 原棧板嘅全部原始數量 (`-p_original_product_qty`)。
            *   將本次處理嘅損壞數量 (`p_damage_qty_to_process`) **增加** 到 `damage` 庫存欄位。
    *   **e. 更新 `record_palletinfo` (棧板主表 - 原棧板)**:
        *   將原棧板嘅 `plt_loc` 更新為表示部分作廢嘅狀態 (e.g., `'Voided (Partial)'`)。
        *   將原棧板嘅 `product_qty` 更新為 0 (因為剩餘部分將會轉到新棧板)。
        *   更新原棧板嘅 `plt_remark`，註明部分作廢原因、損壞數量、剩餘數量及去向。
    *   **f. 記錄 `record_history` (操作歷史表)**:
        *   為原棧板插入一條操作記錄，類型為 "Partially Damaged" (或類似)，備註包含作廢原因、原數量、損壞數量、剩餘完好品將轉移到新棧板等信息。
    *   **g. 記錄 `report_void` (作廢報告表)**:
        *   插入一條記錄，包含原棧板號 (`p_plt_num`)、作廢原因 (`p_void_reason`) 和本次損壞數量 (`p_damage_qty_to_process`)。
    *   **h. 返回結果**: 函數返回一個 JSONB 對象，其中包含：
        *   `success: true`
        *   `message: "Pallet processed: Partially Damaged..."` (類似嘅成功訊息)
        *   `remainingQty: v_remaining_good_qty` (計算出嘅剩餘完好數量)
        *   `actual_original_location: v_actual_inventory_deduction_loc` (棧板原始真實位置)

**Phase 4: Server Action 返回與 Client 端處理 (Server Action & Client)**

6.  **`processDamagedPalletVoidAction` 返回**:
    *   Server Action 將 SQL function 返回嘅 JSONB 結果 (包含 `success`, `message`, `remainingQty`, `actual_original_location`) 直接傳遞返俾 Client 端。
7.  **Client 端 (`handleVoidConfirm`) 接收 Server Action 結果**:
    *   檢查返回結果 `result.success === true`。
    *   檢查 `typeof result.remainingQty === 'number'` 且 `result.remainingQty > 0`。
    *   檢查 `result.actual_original_location` 是否存在且有效。

**Phase 5: 引導創建新棧板與列印 (Client - `app/void-pallet/page.tsx` & `app/print-label/page.tsx`)**

8.  **條件滿足後，Client 端執行**:
    *   **a. 顯示成功提示**: 例如 `toast.success("Pallet partially voided. Remaining: X. Redirecting to print new label for location: Y.")`。
    *   **b. 構建跳轉參數**:
        ```javascript
        const queryParams = new URLSearchParams({
            product_code: foundPallet.product_code, // 原產品代碼
            quantity: result.remainingQty.toString(), // SQL返回嘅剩餘數量
            source_action: 'void_correction_damage_partial', // 操作來源標識
            original_plt_num: foundPallet.plt_num, // 原棧板號，作追溯或備註用
            target_location: result.actual_original_location, // SQL返回嘅原始位置，作為新板位置
        });
        ```
    *   **c. 頁面跳轉**: 使用 Next.js `router.push(\`/print-label?${queryParams.toString()}\`)` 跳轉到列印標籤頁面。
    *   **d. 重置狀態**: 調用 `resetState()` 清理當前 `/void-pallet` 頁面嘅表單同狀態。

**Phase 6: 創建新棧板並列印 (Server-Side Logic for `/print-label`)**

9.  **`/print-label` 頁面加載與後端處理**:
    *   `/print-label` 頁面 (或其關聯嘅 Server Action / API Route / `getServerSideProps`) 接收到 URL query parameters (`product_code`, `quantity`, `source_action`, `original_plt_num`, `target_location`)。
    *   **a. 識別操作來源**: 檢測到 `source_action === 'void_correction_damage_partial'`。
    *   **b. 創建新棧板核心邏輯 (推測，需確認 `/print-label` 實現)**:
        *   **i. 生成新棧板號**: 可能調用一個 SQL function (e.g., `generate_new_pallet_id()`) 或其他服務生成唯一棧板號 (`new_plt_num`)。
        *   **ii. 插入 `record_palletinfo` (棧板主表 - 新棧板)**:
            *   `plt_num`: `new_plt_num`
            *   `product_code`: 從 query parameter 獲取
            *   `product_qty`: 從 query parameter 獲取 (`remainingQty`)
            *   `plt_loc`: 從 query parameter 獲取 (`target_location`)
            *   `plt_remark`: 可能包含類似 "Re-issued from partially damaged pallet [original_plt_num]" 嘅信息。
            *   `user_id`, `creation_date` 等。
        *   **iii. 插入 `record_inventory` (庫存表 - 新棧板)**:
            *   為新棧板 (`new_plt_num`) 喺其 `target_location` 對應嘅庫存欄位 **增加** `remainingQty`。
        *   **iv. 插入 `record_history` (操作歷史表 - 新棧板)**:
            *   為新棧板 (`new_plt_num`) 記錄一條 "Receive" 或 "Re-issue after damage" 類型嘅入庫歷史。
    *   **c. 準備列印**: `/print-label` 頁面使用新創建棧板嘅信息準備並顯示標籤預覽。
    *   **d. 記錄 `print_log` (列印日誌表)** (推測):
        *   當用戶確認列印 (或自動觸發列印) 時，記錄新棧板嘅列印事件。

---

**注意事項與待確認點:**
*   Phase 6 中關於 `/print-label` 頁面如何處理新棧板創建嘅邏輯係基於普遍做法嘅推測，需要查閱 `/print-label` 相關源代碼確認具體實現。
*   所有涉及嘅表名 (e.g., `record_palletinfo`, `record_inventory`, `record_history`, `report_void`, `print_log`) 應以實際數據庫結構為準。
*   SQL function 名稱及參數應與 `docs/sql_function_library.md` 中定義嘅一致。

---

## Void Pallet - 分支 4.2: 完全損壞，剩餘數量為 0

**最後更新日期:** 2025-05-22 M3

**場景描述:**
用戶在 "Void Pallet" 頁面操作一個已存在的棧板。用戶選擇作廢原因為 "Damage"，並輸入等於棧板原始總數量的損壞數量。系統處理後，原棧板被徹底標記為損壞，其庫存被調整，相關記錄被更新或清理。由於沒有剩餘完好品項，因此不會產生新的棧板。

**涉及主要組件:**
*   Client (Void Pallet Page): `app/void-pallet/page.tsx`
*   Server Action (Void Pallet): `app/void-pallet/actions.ts`
*   SQL Function (Database): `process_damaged_pallet_void` (定義於 `docs/sql_function_library.md`)

---

**詳細流程步驟:**

**Phase 1: 用戶操作與觸發 (Client - `app/void-pallet/page.tsx`)**

1.  **用戶界面**:
    *   用戶喺 `/void-pallet` 頁面搜尋並加載棧板信息 (`foundPallet`)。
    *   用戶選擇作廢原因 (`voidReason`) 為 "Damage"。
    *   用戶喺 `damageQtyInput` 輸入嘅數量等於 `foundPallet.product_qty` (棧板原始總數量)。
    *   用戶輸入操作密碼 (`passwordInput`)。
2.  **觸發 `handleVoidConfirm` 函數**:
    *   函數進行前端驗證。
    *   準備調用 `processDamagedPalletVoidAction` Server Action 所需參數，此時傳遞嘅 `damageQty` 等於 `original_product_qty`。

**Phase 2: 處理棧板完全損壞 (Server Action - `app/void-pallet/actions.ts`)**

3.  **調用 `processDamagedPalletVoidAction`**:
    *   Client 端嘅 `handleVoidConfirm` 調用 `processDamagedPalletVoidAction` Server Action。
4.  **`processDamagedPalletVoidAction` 內部邏輯**:
    *   **a. 密碼驗證**: 調用 `verifyCurrentUserPasswordAction`。
    *   **b. 參數準備**: 準備傳俾 SQL function `process_damaged_pallet_void` 嘅參數。
    *   **c. 調用 SQL Function**: 執行 `await supabase.rpc('process_damaged_pallet_void', { ... })`。
        *   傳遞嘅 `p_damage_qty_to_process` 將等於 `p_original_product_qty`。

**Phase 3: 數據庫核心邏輯 - 完全損壞處理 (SQL Function - `process_damaged_pallet_void`)**

5.  **`process_damaged_pallet_void` 函數執行**:
    *   **a. `v_is_full_damage` 判斷**: 因為 `p_damage_qty_to_process` 等於 `p_original_product_qty`，`v_is_full_damage` 設為 `TRUE`。
    *   **b. `v_remaining_good_qty` 計算**: 結果為 `0`。
    *   **c. 更新 `record_inventory` (庫存表)**:
        *   為此棧板嘅損壞事務，喺 `record_inventory` 中創建**單一筆記錄**，該記錄同時：
            *   從原位置庫存欄位 **扣減** 原棧板嘅全部原始數量 (`-p_original_product_qty`)。
            *   將損壞數量 (`p_damage_qty_to_process`) **增加** 到 `damage` 庫存欄位。
    *   **d. 更新 `record_palletinfo` (棧板主表 - 原棧板)** (由於 `v_is_full_damage` 為 `TRUE`):
        *   `plt_loc` 更新為 `'Damaged'` (或業務定義嘅完全損壞最終狀態)。
        *   `product_qty` 更新為 `0`。
        *   `plt_remark` 更新以反映完全損壞。
        *   **清理相關記錄**:
            *   如果 `record_transfer` 中存在此棧板，刪除之。
            *   刪除 `record_grn` 中此棧板嘅記錄。
        *   **ACO 邏輯**: 如果原棧板備註包含有效 ACO Ref，將原棧板總數量 (`p_original_product_qty`) 加回到對應 `record_aco` 記錄嘅 `remain_qty`。
    *   **e. 記錄 `record_history` (操作歷史表)**:
        *   插入一條 `action` 為 `'Fully Damaged'` 嘅記錄。
    *   **f. 記錄 `report_void` (作廢報告表)**:
        *   插入記錄，`damage_qty` 為 `p_damage_qty_to_process` (即原總數)。
    *   **g. 返回結果**: JSONB 對象，包含 `success: true`, `message: "Pallet processed: Fully Damaged..."`, `remainingQty: 0`, `actual_original_location`。

**Phase 4: Server Action 返回與 Client 端處理 (Server Action & Client)**

6.  **`processDamagedPalletVoidAction` 返回**:
    *   Server Action 將 SQL function 返回嘅結果傳遞返俾 Client。
7.  **Client 端 (`handleVoidConfirm`) 接收 Server Action 結果**:
    *   檢查 `result.success === true`。
    *   進入 `else if (typeof result.remainingQty === 'number' && result.remainingQty === 0)` 條件分支。

**Phase 5: 完成操作 (Client - `app/void-pallet/page.tsx`)**

8.  **Client 端執行**:
    *   **a. 顯示成功提示**: 例如 `toast.success(result.message || \`Pallet ${foundPallet.plt_num} fully voided (Damage). No reprint needed.\`)`。
    *   **b. 重置狀態**: 調用 `resetState()` 清理頁面表單。
    *   **c. 清理密碼輸入**: `setPasswordInput('')`。
    *   **d. 結束流程**: 由於係完全損壞且剩餘數量為0，唔會有後續創建新棧板或跳轉到列印頁面嘅操作。

---

**注意事項與待確認點:**
*   Phase 6 中關於 `/print-label` 頁面如何處理新棧板創建嘅邏輯係基於普遍做法嘅推測，需要查閱 `/print-label` 相關源代碼確認具體實現。
*   所有涉及嘅表名 (e.g., `record_palletinfo`, `record_inventory`, `record_history`, `report_void`, `print_log`) 應以實際數據庫結構為準。
*   SQL function 名稱及參數應與 `docs/sql_function_library.md` 中定義嘅一致。
