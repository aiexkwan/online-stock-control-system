# Middleware Endless Loop

記錄中介軟體無限循環問題的診斷同解決方案。

## 2025-07-13: Dashboard API 中介軟體無限循環修復

**發生時間：** 2025-07-13 00:30

**問題描述：**
中介軟體出現無限循環，持續處理相同的 dashboard API 請求，導致系統無法正常響應。

**錯誤症狀：**
```
{ module: 'middleware' } ... [middleware logs showing repeated requests]
/api/admin/dashboard/stats
/api/admin/dashboard/top-products  
/api/admin/dashboard/stock-distribution
/api/admin/dashboard/stock-history
/api/admin/dashboard/aco-progress
```

**根本原因分析：**

### 1. **DashboardAPI 使用錯誤的 Supabase 客戶端**
在 `lib/api/admin/DashboardAPI.ts:69`，serverFetch 方法錯誤地使用了瀏覽器端的 Supabase 客戶端：

```typescript
// 錯誤：使用瀏覽器客戶端在服務器端
const { createClient } = await import('@/app/utils/supabase/client');
const supabase = createClient();
```

瀏覽器客戶端嘗試在服務器端操作 `document.cookie`，導致與中介軟體的認證檢查產生衝突。

### 2. **useDashboardBatchQuery 調用不存在的 API 端點**
在 `app/admin/hooks/useDashboardBatchQuery.ts`，定義了多個不存在的 API 端點：

```typescript
const WIDGET_QUERIES = {
  statsCard: '/api/admin/dashboard/stats',
  stockDistribution: '/api/admin/dashboard/stock-distribution', 
  // ... 其他不存在的端點
};
```

這些端點實際上不存在對應的路由文件，只有統一的 `/api/admin/dashboard/route.ts`。

**修復方案：**

### 1. **修復 DashboardAPI 使用正確的服務器端客戶端**

**文件：** `lib/api/admin/DashboardAPI.ts:69`

```typescript
// 修復前
const { createClient } = await import('@/app/utils/supabase/client');
const supabase = createClient();

// 修復後  
const { createClient } = await import('@/app/utils/supabase/server');
const supabase = await createClient();
```

**影響：** 解決了服務器端認證循環問題，確保正確的 cookie 處理。

### 2. **重構 useDashboardBatchQuery 使用統一 API**

**文件：** `app/admin/hooks/useDashboardBatchQuery.ts`

```typescript
// 修復前：使用不存在的個別端點
const WIDGET_QUERIES = {
  statsCard: '/api/admin/dashboard/stats',
  stockDistribution: '/api/admin/dashboard/stock-distribution',
  // ...
};

// 修復後：使用統一 dashboard API 的 widget 參數
const WIDGET_IDS = {
  statsCard: 'total_pallets',
  stockDistribution: 'stock_distribution_chart',
  // ...
};

// 修復前：調用個別端點
const response = await fetch(`${endpoint}?${params.toString()}`);

// 修復後：調用統一 API
const dashboardParams = new URLSearchParams(params);
dashboardParams.append('widgets', widgetDataSourceId);
const response = await fetch(`/api/admin/dashboard?${dashboardParams.toString()}`);

// 修復前：直接使用響應數據
const data = await response.json();

// 修復後：從統一 API 響應中提取 widget 數據
const dashboardResult = await response.json();
const widgetData = dashboardResult?.widgets?.[0]?.data || null;
```

**關鍵技術細節：**

1. **服務器端 vs 瀏覽器端 Supabase 客戶端**
   - 服務器端：使用 `@supabase/ssr` 的 `createServerClient`，正確處理 Next.js cookies
   - 瀏覽器端：使用 `createBrowserClient`，操作 `document.cookie`
   - 在 API 路由中必須使用服務器端客戶端

2. **統一 API 架構**
   - 單一 `/api/admin/dashboard` 端點處理所有 widget 請求
   - 通過 `widgets` 參數指定需要的數據源
   - 避免創建多個重複的 API 路由

3. **中介軟體認證循環預防**
   - middleware.ts:218-223 有特別的註釋警告此問題
   - 避免在 Server Component 中調用 `supabase.auth.getSession()`
   - 使用正確的 cookie 處理機制

**測試驗證：**

1. **無限循環解決**
   - 中介軟體日誌不再顯示重複的 API 請求
   - 系統正常響應 dashboard 頁面加載

2. **API 功能正常**
   - Dashboard widgets 正常加載數據
   - Performance monitor 正常運作
   - 沒有 JavaScript 錯誤

**修復的文件清單：**
- `lib/api/admin/DashboardAPI.ts`: Supabase 客戶端修復
- `app/admin/hooks/useDashboardBatchQuery.ts`: API 端點統一化修復

**預防措施：**

1. **服務器端代碼檢查**
   - 確保所有 API 路由使用服務器端 Supabase 客戶端
   - 定期檢查 `@/app/utils/supabase/client` 的使用範圍

2. **API 架構一致性**
   - 避免創建重複的 API 端點
   - 使用統一的數據獲取模式
   - 文檔化 API 端點映射關係

3. **中介軟體監控**
   - 監控中介軟體日誌中的重複請求模式
   - 設置請求頻率閾值警報
   - 定期檢查認證循環問題

**相關文件：**
- `middleware.ts`: 中介軟體認證邏輯
- `app/utils/supabase/server.ts`: 服務器端 Supabase 客戶端
- `app/utils/supabase/client.ts`: 瀏覽器端 Supabase 客戶端
- `docs/issue-library/dynamic-import-errors.md`: 相關性能監控修復

## 重要提醒

**服務器端必須使用服務器端客戶端：**
- API 路由：使用 `@/app/utils/supabase/server`
- 客戶端組件：使用 `@/app/utils/supabase/client`
- 絕對不要在 API 路由中使用瀏覽器客戶端

**統一 API 模式：**
- 優先使用統一的 dashboard API 而非個別端點
- 通過參數控制數據範圍，而非創建新路由
- 保持 API 架構的一致性和可維護性