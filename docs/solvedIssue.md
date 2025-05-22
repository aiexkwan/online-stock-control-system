# Supabase Auth 整合問題修復記錄

## 遇到的錯誤

### 1. Supabase Admin API 錯誤
```
[customLoginAction] Attempting login for 5997
[customLoginAction] Unexpected error: TypeError: supabaseAdmin.auth.admin.getUserByEmail is not a function
```

- 問題出現在 `userExistsInSupabaseAuth` 函數中，嘗試使用不存在的 `getUserByEmail` 方法
- 這影響了用戶登入和密碼更改功能，因為它們依賴於檢查用戶是否存在於 Supabase Auth 中

### 2. 會話管理問題
```
[Supabase Middleware] No auth session, redirecting to login from: /dashboard
```

- 用戶成功登入後，但被重定向回登入頁面
- 系統無法在重定向到儀表板前正確識別用戶的認證狀態
- 問題在於 Supabase 會話可能需要時間同步，但中間件已經開始檢查

## 問題分析

### Supabase Admin API 問題
- Supabase API 的實際結構與我們的代碼預期不符
- `getUserByEmail` 不是 Supabase Admin API 的標準方法
- 在 GitHub issue [#880](https://github.com/supabase/auth/issues/880) 中確認這個 API 目前確實不存在

### 會話管理問題
- Supabase Auth 的會話建立需要時間，可能導致頁面轉換時認證狀態暫時丟失
- 中間件沒有使用備用驗證機制，完全依賴 Supabase 的會話狀態
- 客戶端和服務器端的狀態同步不足

## 解決方案

### 1. 修復 Supabase Admin API 使用

修改了 `userExistsInSupabaseAuth` 函數，改用 `listUsers` API：
- 使用 `listUsers` 查詢所有用戶，然後在內存中過濾匹配的電子郵件
- 添加了完善的錯誤處理機制
- 添加了詳細的日誌輸出，方便調試

修改了 `updatePasswordWithSupabaseAuth` 函數：
- 同樣使用 `listUsers` 代替不存在的 `getUserByEmail`
- 在結果中查找匹配的用戶記錄

### 2. 增強會話管理

更新了中間件：
- 添加了檢查 cookie 的後備機制
- 優化了公開路由的處理
- 添加了更詳細的日誌

增強了 AuthStateSync 組件：
- 添加了狀態保留機制
- 添加了定期同步（每分鐘檢查一次）
- 實現了失敗時的重試機制（最多 3 次，遞增延遲）
- 添加了從 cookie 同步到 localStorage 的能力

改進了登入頁面：
- 登入成功後立即同步狀態
- 手動設置 cookie 確保中間件可以識別用戶
- 添加短延遲，確保 Supabase 有時間完成其內部操作

## 修改的文件

1. **app/services/supabaseAuth.ts**
   - 修復了 `userExistsInSupabaseAuth` 函數
   - 更新了 `updatePasswordWithSupabaseAuth` 函數
   - 增強了 `migrateUserToSupabaseAuth` 和 `signInWithSupabaseAuth` 函數的錯誤處理和日誌

2. **middleware.ts**
   - 重構了認證邏輯，增加了 cookie 後備機制
   - 優化了路由保護和重定向邏輯
   - 添加了更詳細的日誌

3. **app/utils/auth-sync.ts**
   - 添加了狀態保留機制
   - 增強了錯誤處理和報告

4. **app/components/AuthStateSync.tsx**
   - 添加了重試機制
   - 添加了定期同步
   - 添加了 cookie 到 localStorage 的同步

5. **app/login/page.tsx**
   - 登入成功後立即同步認證狀態
   - 添加了手動 cookie 設置
   - 添加延遲，確保平滑過渡

## 需要後續跟進的事項

1. **監控用戶登入體驗**
   - 觀察是否還有用戶在登入後被錯誤重定向的情況
   - 確認會話管理是否穩定

2. **Supabase API 更新追蹤**
   - 關注 Supabase Auth API 的更新，特別是可能添加的 `getUserByEmail` 方法
   - Supabase 團隊在 GitHub issue 中提到可能會添加 `listIdentitiesForEmailAddress` 方法

3. **性能監控**
   - 監控 `listUsers` API 的性能，如果用戶數量增加，可能需要分頁或其他優化
   - 評估是否需要實現伺服器端的郵件到用戶 ID 的緩存

4. **考慮遷移完成後移除舊的認證機制**
   - 一旦所有用戶都遷移到 Supabase Auth，可以考慮移除舊的認證系統和兼容性層
   - 制定完整遷移計劃和時間表

## 結論

這次修復解決了兩個主要問題：
1. 修復了 Supabase Admin API 的使用問題
2. 增強了認證狀態的管理和同步

系統現在更加健壯，能夠處理多種認證場景，同時保持與舊系統的兼容性。後續的工作應該集中在監控系統運行情況，確保完全遷移到 Supabase Auth 的平滑過渡。

## 第四階段：大規模遷移至 @supabase/ssr 及後續問題修復 (Next.js 14.x)

在初步完成首次登入強制更改密碼功能後，遇到一系列與 React Hook Form (`useFormState`)、Next.js 版本以及 Supabase Auth 輔助庫相關的深層次問題。核心目標是遷移到 `@supabase/ssr` 以適應 Next.js 14.x 環境，並解決由此引發的各種編譯時和運行時錯誤。

### 1. 背景與動機

- **`useFormState` TypeError**: 在 `app/change-password/page.tsx` 中使用 `useFormState` 時出現 `TypeError: (0 , react_dom__WEBPACK_IMPORTED_MODULE_3__.useFormState) is not a function`。經排查，懷疑與 Next.js 版本 (`13.5.6`) 和 React (`18.3.1`) 的兼容性有關。
- **決定升級 Next.js**: 為解決上述問題並利用新特性，決定將 Next.js 升級至 `^14.2.29`。
- **`@supabase/auth-helpers-nextjs` 棄用**: 升級 Next.js 後，在 Server Action 中調用 `supabaseActionClient.auth.getUser()` 時出現 `Auth session missing!` 錯誤。同時注意到 `@supabase/auth-helpers-nextjs` (版本 `0.10.0`) 在 `npm install` 日誌中被標記為已棄用，建議遷移到 `@supabase/ssr`。

### 2. 主要遷移步驟：從 `@supabase/auth-helpers-nextjs` 到 `@supabase/ssr`

- **安裝與卸載依賴**: `npm install @supabase/ssr` 並 `npm uninstall @supabase/auth-helpers-nextjs`。
- **創建新的 Supabase 客戶端輔助函數**:\
    - `app/utils/supabase/client.ts`: 使用 `createBrowserClient` (from `@supabase/ssr`) 創建客戶端 Supabase 實例。
    - `app/utils/supabase/server.ts`: 使用 `createServerClient` (from `@supabase/ssr`) 和 `cookies` (from `next/headers`) 創建服務器端 Supabase 實例。
- **更新 Middleware (`middleware.ts`)**:\
    - 替換 `createMiddlewareClient` 為新的 `createServerClient`。
    - 調整 cookie 處理邏輯。
- **更新 Server Actions**:\
    - 移除所有對 `createServerActionClient` (from `@supabase/auth-helpers-nextjs`) 的依賴。
    - 改為導入並使用 `app/utils/supabase/server.ts` 中的 `createClient()`。
    - 受影響文件包括：`app/change-password/actions.ts`, `app/actions/viewHistoryActions.ts`, `app/actions/authActions.ts`, `app/actions/reportActions.ts`, `app/new-password/actions.ts`。
- **更新服務 (`app/services/supabaseAuth.ts`)**:\
    - 移除對舊的全局 `@/lib/supabase` 的依賴。
    - 內部改用從 `app/utils/supabase/server.ts` 導入的服務器客戶端，或接收傳入的 `SupabaseClient` 實例。
    - `signOut` 函數修改為期望接收 `SupabaseClient` 實例。
- **更新客戶端組件和 `@/lib/supabase.ts`**:\
    - `@/lib/supabase.ts`: 修改為重新導出 `app/utils/supabase/client.ts` 中的 `createClient` 函數，移除了舊的全局實例創建。
    - 所有先前直接導入 `supabase` 實例的客戶端組件，全部改為導入 `createClient` from `@/lib/supabase` 並在組件頂部或函數內部創建實例。受影響文件包括：`app/dashboard/page.tsx`, `components/products/ProductList.tsx`, `app/login/page.tsx`, `app/components/Navigation.tsx`, `app/components/AuthStateSync.tsx`, `app/services/auth.ts` (後續評估其用途), `app/utils/auth-sync.ts`, `app/components/GrnHistory.tsx`, `app/components/PrintHistory.tsx`, `app/components/print-label-menu/QcLabelForm.tsx`, `lib/supabase-storage.ts`。

### 3. 解決遷移過程中出現的具體錯誤

- **Next.js 升級相關**:\
    - **Linter 錯誤 (類型不匹配)**: 將 `@types/react` 和 `@types/react-dom` 固定到 `^18.2.0`。
    - **`next.config.js` 警告**: 移除 `experimental: { serverActions: true }`，因為在 Next.js 14 中 Server Actions 已默認啟用。
- **`@supabase/ssr` 遷移相關**:\
    - **構建錯誤 `ENOENT: no such file or directory, open '...@supabase/auth-helpers-nextjs/dist/index.js'`**: 通過 `grep_search` 查找並清除所有對已卸載包的殘留導入。
    - **運行時錯誤 `TypeError: undefined is not an object (evaluating '_lib_supabase__WEBPACK_IMPORTED_MODULE_3__.supabase.auth')`**: 核心問題是客戶端組件錯誤地嘗試直接使用 `@/lib/supabase` 導出的 `supabase` 實例，而 `@/lib/supabase.ts` 在遷移後已改為導出 `createClient` 函數。解決方案是修改所有相關組件，使其導入 `createClient` 並調用它來獲取實例。
    - **運行時錯誤 `ReferenceError: Can't find variable: isAuthenticated` in `app/dashboard/page.tsx`**: 將 `initAuth` 函數內的 `isAuthenticated` 變量聲明移至 `try` 塊外部，確保其在 `finally` 塊中可訪問。
    - **Linter 錯誤 in `app/dashboard/page.tsx` (Supabase count 類型問題)**: `supabase.from(...).select('count(*)')` 的返回類型與預期不符。嘗試了多種 `select` 語法，最終確定使用 `select('*', { count: 'exact', head: true })` 並正確處理返回的 `count` 值，解決了類型 `ParserError<"Unexpected input: (*)">` 沒有屬性 `count` 的問題。
    - **編譯警告 `Attempted import error: 'supabase' is not exported from '@/lib/supabase'` 或路徑錯誤**: 檢查並修正了 `app/components/GrnHistory.tsx`, `app/components/PrintHistory.tsx` 等組件的導入路徑，並確保它們使用 `createClient`。
    - **中間件警告 `Using the user object as returned from supabase.auth.getUser() is deprecated.`**: 這是 `@supabase/ssr` 中間件自身的警告，提示應使用 `session.user` 而非直接的 `user` 對象。雖然暫未直接修改，但已記錄。 (此問題在本輪調試中未顯式解決，但記錄在此供後續關注)。

### 4. 清理與環境穩定性

- 多次執行 `npm run clean` (自定義清理腳本)，手動刪除 `node_modules`, `.next`, `package-lock.json` 並重新 `npm install`，以解決潛在的緩存和依賴衝突問題，這對於消除頑固的編譯錯誤至關重要。

### 5. 當前狀態 (截至本次記錄)

- 所有已知的因 `@supabase/ssr` 遷移引起的編譯時錯誤和主要的運行時 `TypeError` / `ReferenceError` 已被解決。
- 應用程序頁面（如 `/dashboard`, `/print-label`, `/login` 等）基本可以正常加載和運行。
- 登入功能（涉及 `customLoginAction` -> `signInWithSupabaseAuth`）中出現 `AuthApiError: Invalid login credentials`，表明用戶 `5997` 使用 `admin` 賬號和特定密碼（未記錄）登入失敗。這是一個應用層面的認證問題，而非底層庫的集成錯誤。
- 仍需關注 `@supabase/ssr` 中間件關於 `user` 對象棄用的警告。
- 整體上，系統向 `@supabase/ssr` 的遷移已基本完成，為 Next.js 14.x 環境下的 Supabase Auth 使用奠定了基礎。

### 6. 修改的主要文件列表 (此階段)

- `package.json` (升級 Next.js, @types/react, @types/react-dom, @supabase/ssr)
- `next.config.js` (移除 experimental serverActions)
- `middleware.ts`
- `app/utils/supabase/client.ts` (新建)
- `app/utils/supabase/server.ts` (新建)
- `app/services/supabaseAuth.ts`
- `@/lib/supabase.ts`
- `app/actions/authActions.ts`
- `app/actions/viewHistoryActions.ts`
- `app/actions/reportActions.ts`
- `app/change-password/actions.ts`
- `app/new-password/actions.ts`
- `app/dashboard/page.tsx`
- `app/login/page.tsx`
- `app/components/Navigation.tsx`
- `app/components/AuthStateSync.tsx`
- `app/components/GrnHistory.tsx`
- `app/components/PrintHistory.tsx`
- `components/products/ProductList.tsx`
- `app/services/auth.ts`
- `app/utils/auth-sync.ts`
- `app/components/print-label-menu/QcLabelForm.tsx`
- `lib/supabase-storage.ts`

### 7. 修復 Dashboard 無限載入問題

- **問題描述**: Dashboard 頁面 (`app/dashboard/page.tsx`) 在某些情況下會持續顯示 "Loading..." 狀態，無法正常載入內容。
- **原因分析**:\
    - `initAuth` 函數中的 `loading` 狀態未能在所有執行路徑（特別是錯誤處理和重試邏輯中）被正確地設置回 `false`。\
    - 對 `supabase.auth.getUser()` 的調用如果掛起或長時間未返回，可能導致後續的 `setLoading(false)` 無法執行。\
    - 舊代碼中使用了 `router.asPath` 進行路徑檢查，這在某些 Next.js 環境下可能不穩定或未定義，導致潛在錯誤並中斷正常的 `setLoading(false)` 調用流程。
- **解決方案**:\
    - **引入 `usePathname`**: 在 `app/dashboard/page.tsx` 中導入並使用 `usePathname` 替代不穩定的 `router.asPath` 進行路徑判斷。\
    - **強化 `setLoading(false)` 調用**: 確保在 `initAuth` 函數的 `try...catch...finally` 結構中，以及重試邏輯的各個分支（成功、達到最大重試次數、重定向到 `/change-password`）中，`setLoading(false)` 都能被正確調用。\
    - **實現「看門狗」(Watchdog) 計時器**:\
        - 在 `initAuth` 開始時啟動一個 20 秒的計時器。\
        - 設置一個 `initLogicCompleted` 標誌位，在 `initAuth` 的所有正常結束路徑（成功加載、重試完成並重定向、捕獲到錯誤並重定向）將此標誌設為 `true`。\
        - 如果 20 秒後 `initLogicCompleted` 仍為 `false`，看門狗會強制調用 `setLoading(false)` 並向用戶顯示超時提示，防止頁面無限期載入。\
        - 在 `initAuth` 的 `finally` 塊中清除看門狗計時器。\
    - **將 `pathname` 添加到 `useEffect` 的依賴項數組**: 確保路徑變化時 `initAuth` 邏輯能正確重新觸發。\
- **預期效果**: 提高了 Dashboard 頁面載入邏輯的健壯性，避免了因異步操作掛起或意外錯誤導致的無限載入問題。


## QC 標籤產品代碼查詢改用 SQL 函數

**問題描述:**

在 QC 標籤表單中，當用戶輸入產品代碼並觸發 `onBlur` 事件時，原先使用 Supabase Client Library 的 `.from('data_code').select().ilike().single()` 方法查詢產品信息。此方法在某些情況下可能遇到問題或不夠直接。

**解決方案:**

1.  在 Supabase 數據庫中創建了一個名為 `get_product_details_by_code` 的 SQL 函數 (plpgsql)。此函數接受一個產品代碼 (`p_code` TEXT) 作為參數，並從 `data_code` 表中查詢匹配的產品信息（`code`, `description`, `standard_qty`, `type`），使用 `ILIKE` 進行不區分大小寫的比較。
    ```sql
    CREATE OR REPLACE FUNCTION get_product_details_by_code(p_code TEXT)
    RETURNS TABLE (
      code TEXT,
      description TEXT,
      standard_qty TEXT,
      type TEXT
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        dc.code,
        dc.description,
        dc.standard_qty,
        dc.type
      FROM
        data_code dc
      WHERE
        dc.code ILIKE p_code;
    END;
    $$;
    ```
2.  修改了 `app/components/print-label-menu/QcLabelForm.tsx` 文件中的 `handleProductCodeBlur` 異步回調函數。
3.  在該函數中，將原先的 `.from().select()` 查詢替換為 `await supabase.rpc('get_product_details_by_code', { p_code: productCode.trim() })`。
4.  相應地調整了數據處理和錯誤處理邏輯，以適應 RPC 調用的返回結構 (預期返回一個包含單個產品對象的數組，如果找到的話)。

**結果:**

通過 RPC 調用 SQL 函數成功獲取產品詳細信息，提高了查詢的明確性和潛在的靈活性。

## QC 標籤打印及相關流程問題修復

** overarching 問題:** 用戶在嘗試打印 QC 標籤時遇到 "No PDFs were successfully generated to merge and print." 的錯誤，以及其他相關的表單驗證和 Server Action 錯誤。

**分點問題及解決方案:**

1.  **產品信息查詢失敗 (`handleProductCodeBlur`)**
    *   **問題描述:** 最初，在產品代碼輸入框失焦時，通過 Supabase Client Library 的 `.from('data_code').select().ilike().single()` 方法查詢產品信息的邏輯間歇性失敗或未按預期執行，導致 `productInfo` 狀態未被正確填充。這直接影響了後續的表單驗證。
    *   **解決方案:**
        *   在 Supabase 數據庫中創建了一個名為 `get_product_details_by_code` 的 SQL 函數 (plpgsql)，該函數接受產品代碼並返回相關的產品詳細信息。
        *   修改了 `app/components/print-label-menu/QcLabelForm.tsx` 中的 `handleProductCodeBlur` 函數，將其數據查詢邏輯從 Supabase Client Library 的直接查詢改為通過 `supabase.rpc('get_product_details_by_code', { p_code: productCode.trim() })` 調用上述 SQL 函數。

2.  **`Operator Clock Number` 字段被錯誤視為必填**
    *   **問題描述:** 在 `handlePrintLabel` 函數的表單驗證邏輯中，`Operator Clock Number` 字段被設置為必填，而實際上它應該是選填項。
    *   **解決方案:** 修改了 `handlePrintLabel` 函數，將對 `operator.trim()` 的驗證邏輯註釋掉，使其不再是表單通過的必要條件。

3.  **PDF 上傳失敗 (行級安全策略 - RLS)**
    *   **問題描述:** 即使 PDF 在客戶端生成成功，上傳到 Supabase Storage 時也報錯："Upload failed for ... Supabase error: new row violates row-level security policy"。
    *   **解決方案:** 此問題的解決需要在 Supabase 控制台中操作。指導用戶檢查並修改其 `pallet-label-pdf` 存儲桶 (bucket) 的 RLS 策略，特別是針對 `INSERT` (上傳) 操作的策略，確保經過身份驗證的用戶擁有執行上傳的權限。*(用戶確認此步驟已在 Supabase 端完成)*

4.  **密碼確認時的 TypeError (`result.success`)**
    *   **問題描述:** 在 `handlePasswordConfirm` 函數中，嘗試訪問 `verifyCurrentUserPasswordAction` 返回結果 `result` 的 `success` 屬性時，出現 "TypeError: undefined is not an object (evaluating 'result.success')" 錯誤。這表明 `result` 有時為 `undefined`。
    *   **解決方案:** 修改了 `handlePasswordConfirm` 函數，在訪問 `result.success` 或 `result.error` 之前，添加了對 `result` 本身是否為真值 (truthy) 的檢查，並提供了更安全的錯誤信息展示方式。

5.  **現有 ACO 訂單打印時不應驗證 `acoOrderDetails`**
    *   **問題描述:** 當打印現有 ACO 訂單的標籤時（即 `!acoNewRef` 狀態），表單驗證邏輯錯誤地檢查了 `acoOrderDetails` 數組。該數組主要用於定義 *新* 訂單的行項目。由於 `acoOrderDetails` 的初始空狀態（`[{ code: '', qty: '' }]`）不符合對 `code` 和 `qty` 的非空驗證，導致即使用戶已正確填寫所有與現有訂單相關的字段，仍然會觸發 "One or more ACO Order Details are invalid" 的錯誤提示。
    *   **解決方案:** 修改了 `app/components/print-label-menu/QcLabelForm.tsx` 文件中的 `handlePrintLabel` 函數。在該函數針對 `productInfo.type === 'ACO'` 的驗證邏輯中，當 `!acoNewRef`（即處理現有訂單）為真時，將原先對 `acoOrderDetails` 數組的遍歷驗證部分註釋掉。同時，在該邏輯分支下增加了 `setAcoOrderDetailErrors([]);`，以確保清除任何可能由此前驗證邏輯殘留的錯誤狀態，避免不必要的UI提示。

## GRN Material Receiving 頁面 Supabase Client 初始化問題

*   **問題描述:** 在 GRN Material Receiving 頁面 (路徑 `app/print-grnlabel/page.tsx`)，當嘗試執行涉及 Supabase 的操作時（例如，在 Product Code 輸入框失焦後查詢產品信息），出現運行時錯誤 `TypeError: undefined is not an object (evaluating '_lib_supabase__WEBPACK_IMPORTED_MODULE_3__.supabase.from')`。
*   **原因分析:** 該頁面組件試圖通過 `import { supabase } from '../../lib/supabase';` 直接導入一個名為 `supabase` 的已初始化客戶端實例。然而，自從項目遷移到 `@supabase/ssr` 後，`lib/supabase.ts` 文件被修改為導出一個 `createClient` 工廠函數，而不是直接導出實例。因此，直接導入的 `supabase` 對象為 `undefined`。
*   **解決方案:**
    1.  修改了 `app/print-grnlabel/page.tsx` 文件中導入 Supabase 客戶端的方式，從 `import { supabase } from '../../lib/supabase';` 更改為 `import { createClient } from '../../lib/supabase';`。
    2.  在 `PrintGrnLabelPage` 組件函數的頂部（靠近其他 React hooks 的位置），添加了 `const supabase = createClient();` 語句，以正確創建和初始化一個該組件作用域內的 Supabase 客戶端實例。
*   **結果:** 此修改確保了在 `app/print-grnlabel/page.tsx` 組件及其輔助函數中使用的 `supabase` 實例被正確初始化，解決了由於 `supabase` 對象為 `undefined` 而導致的 TypeError。 

## Stock Transfer 和 Void Pallet 功能 Supabase Client 初始化及密碼驗證修復

**問題描述:**

1.  在「庫存轉移」(Stock Transfer) 頁面 (`app/stock-transfer/page.tsx`) 和「作廢貨板」(Void Pallet) 頁面 (`app/void-pallet/page.tsx`) 及其 Server Action (`app/void-pallet/actions.ts`) 中，出現類似於 GRN 頁面的 `TypeError: undefined is not an object (evaluating '_lib_supabase__WEBPACK_IMPORTED_MODULE_X__.supabase.from')` 錯誤。
2.  在「作廢貨板」功能中，即使修復了 Supabase Client 初始化問題，用戶在驗證密碼時仍遇到 "Could not verify user information." 錯誤。

**原因分析:**

1.  **Client 初始化問題:** 相關頁面和 Server Action 仍然嘗試直接從 `@/lib/supabase` (客戶端) 或錯誤的路徑導入已初始化的 `supabase` 實例，而不是導入 `createClient` 工廠函數並調用它。
2.  **密碼驗證問題:** `app/void-pallet/actions.ts` 中的 Server Action 直接查詢 `data_id` 表並使用 `bcrypt.compareSync` 比較密碼哈希，這與統一的通過 Supabase Auth 驗證的策略不符，且可能因數據不同步導致驗證失敗。

**解決方案:**

1.  **修復 Supabase Client 初始化:**
    *   **`app/stock-transfer/page.tsx` (客戶端組件):**
        *   將 `import { supabase } from '../../lib/supabase';` 修改為 `import { createClient } from '../../lib/supabase';`。
        *   在組件頂部添加 `const supabase = createClient();`。
    *   **`app/void-pallet/page.tsx` (客戶端組件):**
        *   將 `import { supabase } from '../../lib/supabase';` 修改為 `import { createClient } from '../../lib/supabase';`。
        *   在組件頂部添加 `const supabase = createClient();`。
    *   **`app/void-pallet/actions.ts` (Server Action):**
        *   將 `import { supabase } from '../../lib/supabase';` 修改為 `import { createClient } from '@/app/utils/supabase/server';` (使用正確的服務器端 Supabase 客戶端輔助函數)。
        *   在文件頂部 (imports 之後) 添加 `const supabase = createClient();`。

2.  **統一密碼驗證邏輯 (針對 `app/void-pallet/actions.ts`):**
    *   在 `voidPalletAction` 和 `processDamagedPalletVoidAction` 函數中，移除原先直接查詢 `data_id` 表和使用 `bcrypt.compareSync` 進行密碼比較的代碼塊。
    *   導入 `app/actions/authActions.ts` 中的 `verifyCurrentUserPasswordAction` 函數。
    *   調用 `verifyCurrentUserPasswordAction(userId, password)` 進行密碼驗證，並根據其返回的 `success` 和 `error` 狀態處理後續邏輯。

**結果:**

*   成功解決了 Stock Transfer 和 Void Pallet 功能中因 Supabase Client 未正確初始化導致的 `TypeError`。
*   統一了 Void Pallet 功能中的密碼驗證方式，使其通過 `verifyCurrentUserPasswordAction` 進行，與 QC 標籤打印等其他模塊保持一致。
*   （注意：儘管應用了上述密碼驗證修復，用戶後續報告在 Void Pallet 中仍然遇到 "Could not verify user information."，表明 `verifyCurrentUserPasswordAction` 本身在被調用時可能存在問題，正在進一步排查。） 

## `void_pallet_transaction` 函數針對 "Used Material" 作廢原因的邏輯調整

**問題描述:**

原有的 `void_pallet_transaction` SQL 函數在處理貨板作廢時，無論作廢原因為何，都會執行以下操作：
1.  從 `record_grn` 表中刪除與作廢貨板相關的收貨記錄。
2.  如果貨板備註中包含 ACO 訂單號，則將貨板數量加回到 `record_aco` 表中對應訂單的 `remain_qty`。

對於作廢原因為 "Used Material" (物料已使用) 的情況，上述行為不符合預期：
*   "Used Material" 通常表示正常的物料消耗，其原始的 `record_grn` (收貨記錄) 應視為有效而不應被刪除。
*   如果物料已使用，通常不應將其數量歸還給 ACO 訂單的剩餘數量。

**解決方案:**

修改 `void_pallet_transaction` SQL 函數，針對 `p_void_reason = 'Used Material'` 的情況添加條件邏輯：

1.  **`record_grn` 表處理:**
    *   僅當 `p_void_reason` **不是** "Used Material" 時，才從 `record_grn` 表中刪除相關記錄。
    ```sql
    -- 5a. Conditionally delete from record_grn
    IF p_void_reason <> 'Used Material' THEN
        DELETE FROM public.record_grn
        WHERE plt_num = p_plt_num;
    END IF;
    ```

2.  **`record_aco` 表處理:**
    *   僅當 `p_void_reason` **不是** "Used Material" 且貨板備註中包含有效的 ACO 參考號時，才嘗試更新 `record_aco` 表 (將數量加回 `remain_qty`)。
    ```sql
    -- 5b. Conditionally update record_aco based on original plt_remark and void reason
    IF v_original_pallet_remark IS NOT NULL AND p_void_reason <> 'Used Material' THEN
        v_match_array := regexp_match(v_original_pallet_remark, v_aco_ref_regex);
        IF v_match_array IS NOT NULL AND array_length(v_match_array, 1) > 0 THEN
            v_aco_ref := trim(v_match_array[1]); 
            IF v_aco_ref IS NOT NULL AND v_aco_ref <> '' THEN
                UPDATE public.record_aco
                SET remain_qty = remain_qty + p_product_qty 
                WHERE code = p_product_code AND order_ref = v_aco_ref::INTEGER; 
            END IF;
        END IF;
    END IF;
    ```

**結果:**

經過上述修改並在數據庫中更新 SQL 函數後，當因 "Used Material" 原因調用 `void_pallet_transaction` RPC 時，系統將：
*   **保留** `record_grn` 中的相關收貨記錄。
*   **不會**嘗試更新 `record_aco` 表（即不會錯誤地將已使用的物料數量加回 ACO 訂單）。

此調整確保了作廢流程更貼合 "Used Material" 這一特定場景的業務邏輯。

END OF FILE 