## NPM Audit Vulnerabilities (To Be Addressed Later) - Updated 2025-05-22

- **cookie <0.7.0 (Low Risk) via @supabase/ssr@^0.4.0**:
  - Issue: Accepts out-of-bounds characters in cookie name, path, and domain.
  - Source: Dependency of `@supabase/ssr` (currently at `^0.4.0`).
  - Status: Temporarily not addressing as of 2025-05-22. Upgrading `@supabase/ssr` (e.g., to `0.6.1` as suggested by `npm audit fix --force`) would introduce breaking changes.
  - Action: Re-evaluate if/when `@supabase/ssr` needs to be upgraded for other reasons, or if the risk profile changes.

## Feature Enhancements / To-Do - Added 2025-05-22

- **Implement 15-Minute Idle Timeout Logout**:
  - **Requirement**: Automatically log out users after 15 minutes of inactivity (no mouse movement, key press, scroll, etc.).
  - **Target File**: `app/components/ClientLayout.tsx`.
  - **Implementation Steps**:
    1.  Define idle timeout duration (15 minutes in milliseconds).
    2.  Create `useRef` for the timer ID.
    3.  Implement `handleIdleLogout` function:
        - Display toast notification.
        - Clear `localStorage` (e.g., `loggedInUserClockNumber`, `user`, etc.).
        - Clear relevant cookies (e.g., `loggedInUserClockNumber`).
        - Call `supabase.auth.signOut()`.
        - Redirect to login page.
    4.  Implement `resetIdleTimer` function:
        - Clear existing timer.
        - Set new `setTimeout` to call `handleIdleLogout` after 15 minutes. (Only if not on auth pages like login/register).
    5.  Use `useEffect` to:
        - Initialize the idle timer on component mount (if not on auth pages).
        - Add event listeners to `window` for user activity events (e.g., `mousemove`, `mousedown`, `keypress`, `touchstart`, `scroll`, `visibilitychange`). Call `resetIdleTimer` on any activity.
        - Return a cleanup function to clear the timer and remove event listeners on component unmount or when navigating to auth pages.
  - **Considerations**:
    - Ensure Supabase client is available for `signOut`.
    - Verify all relevant `localStorage` keys and cookie names are cleared.
    - Test thoroughly across different scenarios and browsers.
    - (Advanced) Investigate cross-tab idle state synchronization if multiple tabs are a concern.

## Browser Console Warnings - Added 2025-05-23

- **CSS Preload Warning (`app/layout.css`)**:
  - **Warning**: "The resource http://localhost:3000/static/css/app/layout.css was preloaded using link preload but not used within a few seconds from the window's load event. Please make sure it has an appropriate `as` value and it is preloaded intentionally."
  - **Context**: This warning appears in the browser console during development.
  - **Possible Causes & Investigation Steps**:
    1.  **CSS Not Being Used or Incorrectly Referenced**: Verify that `app/layout.css` is actually imported and used by `app/layout.tsx` or its children. Check for typos in import paths.
    2.  **CSS Content Not Matching Elements**: Ensure the CSS rules within `layout.css` target elements that are present and rendered shortly after page load.
    3.  **Dynamic Loading/Conditional Rendering**: If styles in `layout.css` are for components loaded dynamically or conditionally much later, the preload might be too early.
    4.  **Incorrect `as` Attribute (if manually preloaded)**: If `<link rel="preload">` is used manually, ensure `as="style"` is correct. (Next.js typically handles this automatically).
    5.  **Unnecessary Preload**: The browser might be preloading it, but it's not critical for the initial paint, or its benefit is marginal.
    6.  **Next.js Internal Optimization/Caching**: Could be related to how Next.js handles CSS bundling, preloading, or development mode HMR.
  - **Action**: Investigate the cause and resolve if it indicates an actual issue or performance concern. If it's a benign development-only warning or a known Next.js behavior without significant impact, it might be acceptable to monitor.

## Authentication Issues - Added 2025-05-24

- **"initAuth took too long (watchdog timeout)" on GRN Page (`/print-grnlabel`)**
  - **Symptoms**: Vercel deployment shows this error, potentially leading to 404s or other loading issues.
  - **Suspected Component**: `app/components/AuthStateSync.tsx` due to complex synchronization logic, retries, and timers.
  - **Current Debugging Step (2025-05-24)**: Modified `AuthStateSync.tsx` to prevent redirection to `/login` when `maxAttempts` for synchronization is reached. Instead, it logs an error to the console. This is to help isolate the root cause on the GRN page without being masked by login page issues.
  - **Next Steps**:
    1. Deploy with the modified `AuthStateSync.tsx`.
    2. Observe browser console and Vercel logs when accessing the GRN page.
    3. Look for the new console error: `[AuthStateSync] Max sync attempts (5) reached on page /print-grnlabel...`
    4. Analyze any other errors or prolonged operations on the GRN page that might interfere with `AuthStateSync`.
    5. Investigate the internal logic of `AuthStateSync.tsx`'s `attemptSync`, `forcePreserveAuthState`, and `onAuthStateChange` callback for potential infinite loops, race conditions, or excessive delays, especially in the context of the GRN page.
    6. Consider simplifying the auth sync logic in `AuthStateSync.tsx` (e.g., reducing retry mechanisms, timers, or the number of direct storage manipulations).
    7. Examine `app/print-grnlabel/page.tsx` for any conflicting auth/storage operations or performance bottlenecks.

# TODO List: Dashboard 功能遷移與調整

## 任務背景

主要目標係區分公開訪問 (Open-Access) Dashboard 同需要管理員登入 (Admin Login) 嘅 Dashboard 嘅功能。

## 遷移與重構任務 (原計劃)

以下任務原計劃係將舊 Dashboard 功能移至 Open-Access Dashboard，現根據最新指示調整為確保這些功能保留在 Admin Dashboard，並簡化 Open-Access Dashboard。

1.  **分析並修改 `PrintHistory.tsx` 組件：**
    *   確保此組件適用於需要認證的 Admin Dashboard。
    *   如果之前有為 Open-Access 修改，可能需要調整回來或創建不同版本。

2.  **分析並修改 `GrnHistory.tsx` 組件：**
    *   確保此組件適用於需要認證的 Admin Dashboard。
    *   如果之前有為 Open-Access 修改，可能需要調整回來或創建不同版本。

3.  **更新 Admin Dashboard (`/dashboard/page.tsx`)：**
    *   確保 `PalletDonutChart`, `PrintHistory`, `GrnHistory` 及其他核心數據展示正確運作，並且依賴 Supabase 認證和數據獲取。

4.  **精簡 Open-Access Dashboard (`/dashboard/open-access/page.tsx`)：**
    *   移除所有數據展示組件 (如 Donut Chart, ACO Order Status, Recent GRN)。
    *   頁面內容僅保留簡單的歡迎字句 (例如 "Welcome")。

5.  **側邊欄調整：**
    *   `/dashboard/open-access` 側邊欄風格調整，使其與原有 (Admin) Dashboard 風格一致。
    *   確認 Open-Access 側邊欄只包含允許公開訪問的連結 (例如 Print Label, Print GRN Label, Stock Transfer, 以及一個返回 Admin Login 的入口)。

## 待辦事項 (根據最新指示的優先級)

- [ ] **(高) 清空 Open-Access Dashboard (`/dashboard/open-access/page.tsx`) 的核心內容，只保留歡迎字眼。** (對應原列表第4點的部分執行)
- [ ] **(中) 調整 Open-Access Dashboard (`/dashboard/open-access`) 的側邊欄風格，使其與原有 Admin Dashboard 的風格一致。** (對應原列表第5點的部分執行)
- [ ] (低) 重新審視 `PrintHistory.tsx` 和 `GrnHistory.tsx`，確保它們在 Admin Dashboard (`/dashboard/page.tsx`) 中按預期工作，並且數據獲取依賴認證。
- [ ] (低) 確認 Admin Dashboard (`/dashboard/page.tsx`) 包含所有應有的核心數據展示組件 (Donut Chart, Print History, GRN History 等)。
