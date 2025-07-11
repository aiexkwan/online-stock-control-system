# Next.js Errors

呢個文件記錄所有同 Next.js 相關嘅錯誤同解決方案。

## params should be awaited before using its properties

**錯誤訊息：**
```
Error: Route "/admin/[theme]" used `params.theme`. `params` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
    at AdminThemePage (app\admin\[theme]\page.tsx:19:10)
  17 |
  18 | export default async function AdminThemePage({ params }: AdminThemePageProps) {    
> 19 |   const { theme } = params;
     |          ^
```

**發生時間：** 2025-07-11

**Next.js 版本：** 15.3.4

**受影響文件：**
- `app/admin/[theme]/page.tsx`

**原因：**
Next.js 15 引入咗一個重大變更：動態路由參數 `params` 現在係異步嘅（Promise）。呢個變更係為咗支援更好嘅性能優化同並行渲染。喺使用 `params` 嘅屬性之前，必須先 `await`。

**解決方案：**
將 params 類型改為 Promise 並在使用前 await。

**修改示例：**
```typescript
// 錯誤（舊版本同步模式）
interface AdminThemePageProps {
  params: {
    theme: string;
  };
}

export default async function AdminThemePage({ params }: AdminThemePageProps) {
  const { theme } = params; // ❌ 錯誤：params 未 await
}

// 正確（Next.js 15 異步模式）
interface AdminThemePageProps {
  params: Promise<{
    theme: string;
  }>;
}

export default async function AdminThemePage({ params }: AdminThemePageProps) {
  const { theme } = await params; // ✅ 正確：先 await params
}
```

**其他需要注意嘅動態路由：**
- API Routes 都需要相同嘅處理
- 例如：`app/api/avatars/[filename]/route.ts` 已經正確使用異步 params

**參考範例（API Route）：**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  // 使用 filename...
}
```

**測試結果：**
修復後 `npm run dev` 成功運行，冇再出現 sync-dynamic-apis 錯誤。

**相關文檔：**
- [Next.js 15 升級指南](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [動態 API 文檔](https://nextjs.org/docs/messages/sync-dynamic-apis)

**預防措施：**
1. 升級到 Next.js 15 時，檢查所有動態路由文件
2. 統一使用異步 params 模式
3. 更新 TypeScript 類型定義
4. 考慮使用 codemod 工具自動轉換

## /admin/analysis 頁面初始化錯誤

**錯誤訊息：**
```
Error: Cannot access 'widgetRegistry' before initialization
Error: No QueryClient set, use QueryClientProvider to set one
```

**發生時間：** 2025-07-11

**受影響頁面：**
- `/admin/analysis` 頁面及其相關組件

**受影響文件：**
- `app/hooks/useWidgetRegistry.tsx`
- `app/components/ClientLayout.tsx`
- `app/admin/hooks/useDashboardBatchQuery.ts`

**原因分析：**

1. **widgetRegistry 初始化問題：**
   - `useWidgetRegistry` hook 錯誤地嘗試調用 `widgetRegistry.autoRegisterWidgets()` 方法
   - 但 `autoRegisterWidgets()` 是 `SimplifiedWidgetRegistry` 類的 `private` 方法，不應該被外部調用
   - 而且該方法不是 `async` 的，但在 hook 中使用了 `await`
   - 實際上，`widgetRegistry` 在實例化時已經自動調用了 `autoRegisterWidgets()`

2. **QueryClient 設置問題：**
   - 項目使用了 TanStack Query (`@tanstack/react-query`) 
   - 但在 `ClientLayout.tsx` 中沒有設置 `QueryClientProvider`
   - 導致使用 `useQuery` 和 `useQueryClient` 的組件無法正常工作

**解決方案：**

### 1. 修復 widgetRegistry 初始化問題

**修改文件：** `app/hooks/useWidgetRegistry.tsx`

```typescript
// 錯誤的實現
useEffect(() => {
  const initRegistry = async () => {
    // 檢查是否已初始化
    const definitions = widgetRegistry.getAllDefinitions();
    if (definitions.size > 0) {
      // ...
    }
    
    await initializeEnhancedRegistry();
    await widgetRegistry.autoRegisterWidgets(); // ❌ 錯誤：調用 private 方法
  };
}, []);

// 正確的實現
useEffect(() => {
  const initRegistry = async () => {
    // 初始化 registry
    await initializeEnhancedRegistry();
    
    // 檢查 registry 是否有 widgets 註冊
    const definitions = widgetRegistry.getAllDefinitions();
    console.log(`Registry has ${definitions.size} widgets registered`);
    
    setIsInitialized(true);
  };
}, []);
```

### 2. 修復 QueryClient 設置問題

**修改文件：** `app/components/ClientLayout.tsx`

```typescript
// 添加必要的導入
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 創建 QueryClient 實例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// 包裝應用程序
return (
  <QueryClientProvider client={queryClient}>
    <ApolloProvider client={apolloClient}>
      {/* 其他組件 */}
    </ApolloProvider>
  </QueryClientProvider>
);
```

**測試結果：**
修復後 `/admin/analysis` 頁面應該能夠正常載入，不再出現初始化錯誤。

**根本原因：**
1. 對 widget registry 系統的內部實現缺乏理解
2. 缺少 React Query 的正確設置
3. 混合使用多個狀態管理庫（Apollo Client + React Query）時的配置問題

**預防措施：**
1. 仔細閱讀第三方庫的文檔，特別是 Provider 設置
2. 避免調用類的 private 方法
3. 確保在使用 hooks 前正確設置相應的 Context Provider
4. 定期檢查應用程序的 Provider 層次結構