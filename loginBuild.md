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
