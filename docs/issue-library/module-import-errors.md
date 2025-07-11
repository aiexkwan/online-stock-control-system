# Module Import Errors

呢個文件記錄所有同 module import 相關嘅錯誤同解決方案。

## Module not found: Can't resolve '../common'

**錯誤訊息：**
```
Module not found: Can't resolve '../common'
  16 | import { WidgetComponentProps } from '@/app/types/dashboard';
  17 | import { useWidgetData } from '@/app/admin/contexts/DashboardDataContext';
> 18 | import { MetricCard } from '../common';
     | ^
```

**發生時間：** 2025-07-11

**受影響文件：**
- `app/admin/components/dashboard/widgets/AwaitLocationQtyWidget.tsx`
- `app/admin/components/dashboard/widgets/TransferTimeDistributionWidget.tsx`
- `app/admin/components/dashboard/widgets/StillInAwaitWidget.tsx`
- `app/admin/components/dashboard/widgets/StillInAwaitPercentageWidget.tsx`

**原因：**
相對路徑錯誤。`common` 目錄實際位於 `app/admin/components/dashboard/widgets/common/`，同 widget 文件喺同一級目錄，所以應該使用 `./common` 而唔係 `../common`。

**文件結構：**
```
app/admin/components/dashboard/widgets/
├── AwaitLocationQtyWidget.tsx
├── TransferTimeDistributionWidget.tsx
├── StillInAwaitWidget.tsx
├── StillInAwaitPercentageWidget.tsx
├── common/                    # ← common 目錄喺呢度
│   ├── index.ts
│   ├── data-display/
│   │   ├── MetricCard.tsx
│   │   └── index.ts
│   └── charts/
│       ├── ChartContainer.tsx
│       └── index.ts
└── ... 其他 widget 文件
```

**解決方案：**
將所有 `import { ... } from '../common'` 改為 `import { ... } from './common'`。

**修改示例：**
```typescript
// 錯誤
import { MetricCard } from '../common';

// 正確
import { MetricCard } from './common';
```

**測試結果：**
修復後 `npm run dev` 成功運行，冇再出現 module not found 錯誤。

**預防措施：**
1. 使用 TypeScript 路徑別名減少相對路徑使用
2. 定期檢查 import 路徑一致性
3. 使用 ESLint 規則檢測錯誤嘅 import 路徑

**相關工具：**
- 可以使用 VS Code 嘅 "Update imports on file move" 功能自動更新 import 路徑
- ESLint plugin `eslint-plugin-import` 可以檢測無效嘅 import 路徑

## Module not found: Can't resolve '@/lib/utils/supabase/server'

**錯誤訊息：**
```
Module not found: Can't resolve '@/lib/utils/supabase/server'
  1 | import 'server-only';
> 2 | import { createClient } from '@/lib/utils/supabase/server';
    | ^
  3 | import { DashboardBatchQueryData } from '../useDashboardBatchQuery';
```

**發生時間：** 2025-07-11

**受影響文件：**
- `app/admin/hooks/server/prefetch.server.ts`

**原因：**
路徑錯誤。Supabase server client 實際位於 `app/utils/supabase/server.ts`，而唔係 `lib/utils/supabase/server`。

**文件結構：**
```
項目根目錄/
├── app/
│   └── utils/
│       └── supabase/
│           ├── server.ts    # ← 正確位置
│           └── client.ts
├── lib/                     # lib 目錄下冇 utils/supabase
└── tsconfig.json           # "@/*" 映射到 "./*"
```

**解決方案：**
將 import 路徑從 `@/lib/utils/supabase/server` 改為 `@/app/utils/supabase/server`。

**修改示例：**
```typescript
// 錯誤
import { createClient } from '@/lib/utils/supabase/server';

// 正確
import { createClient } from '@/app/utils/supabase/server';
```

**測試結果：**
修復後 `npm run dev` 成功運行，冇再出現 module not found 錯誤。

**其他發現：**
- 項目中大部分 server actions 都正確使用 `@/app/utils/supabase/server`
- middleware.ts 直接使用 `@supabase/ssr` 嘅 `createServerClient`
- tsconfig.json 確實有配置 `"@/*": ["./*"]` 路徑別名

## Widget Adapter Export Errors

**錯誤訊息：**
```
Attempted import error: 'statsWidgetAdapter' is not exported from './stats-widget-adapter' (imported as 'statsWidgetAdapter').
Attempted import error: 'widgetCategories' is not exported from './widget-mappings' (imported as 'widgetCategories').
Attempted import error: 'loadWidget' is not exported from './widget-loader' (imported as 'loadWidget').
Attempted import error: 'smartPreloader' is not exported from '@/lib/widgets/enhanced-registry' (imported as 'smartPreloader').
Attempted import error: 'createServerClient' is not exported from '@/app/utils/supabase/server' (imported as 'createServerClient').
```

**發生時間：** 2025-07-11

**受影響文件：**
- `lib/widgets/enhanced-registry.ts`
- `app/admin/components/dashboard/AdminDashboardContent.tsx`
- `app/admin/components/dashboard/widgets/WarehouseTransferListWidget.tsx`
- `app/actions/dashboardActions.ts`

**原因：**
1. Widget adapter 文件 export 嘅係 `*WidgetConfigs` 而唔係 `*WidgetAdapter`
2. `widget-mappings.ts` export 嘅係 `widgetMapping` (單數) 而唔係 `widgetCategories`/`widgetMappings`
3. `widget-loader.ts` 冇 `loadWidget`，應該用 `createDynamicWidget`
4. `enhanced-registry.ts` 冇 export `smartPreloader`
5. `supabase/server.ts` export 嘅係 `createClient` 而唔係 `createServerClient`
6. `lucide-react` 冇 `Cube` icon，應該用 `Box`

**解決方案：**

1. **修復 widget adapter imports：**
```typescript
// 錯誤
import { statsWidgetAdapter } from './stats-widget-adapter';

// 正確
import { statsWidgetConfigs, registerStatsWidgets } from './stats-widget-adapter';
```

2. **修復 widget-mappings imports：**
```typescript
// 錯誤
import { widgetMappings, widgetCategories } from './widget-mappings';

// 正確
import { widgetMapping, getWidgetCategory } from './widget-mappings';
```

3. **修復 widget-loader imports：**
```typescript
// 錯誤
import { loadWidget } from './widget-loader';

// 正確
import { createDynamicWidget, preloadWidget } from './widget-loader';
```

4. **添加 smartPreloader export：**
```typescript
// 在 enhanced-registry.ts 添加
export const smartPreloader = {
  preloadForRoute: async (route: string) => {
    const registry = SimplifiedWidgetRegistry.getInstance();
    const widgets = registry.getAllDefinitions();
    const widgetsToPreload = widgets.slice(0, 5);
    await Promise.all(
      widgetsToPreload.map(widget => registry.getComponent(widget.id))
    );
  }
};
```

5. **修復 Supabase imports：**
```typescript
// 錯誤
import { createServerClient } from '@/app/utils/supabase/server';
const supabase = createServerClient(cookieStore);

// 正確
import { createClient } from '@/app/utils/supabase/server';
const supabase = await createClient();
```

6. **修復 lucide-react icon：**
```typescript
// 錯誤
import { Clock, Cube, User } from 'lucide-react';

// 正確
import { Clock, Box, User } from 'lucide-react';
```

**測試結果：**
修復後 `npm run dev` 成功運行，冇再出現 import/export 錯誤。

**預防措施：**
1. 確保 export 名稱同 import 名稱一致
2. 使用 TypeScript 嚴格模式幫助檢測 export 問題
3. 定期檢查依賴庫嘅 API 變更

## Widget Registry Config Error - "config is not defined"

**錯誤訊息：**
```
Error: config is not defined
lib\widgets\enhanced-registry.ts (178:16) @ eval
  176 |       this.register({
  177 |         id,
> 178 |         title: config.title || id,
      |                ^
  179 |         category: config.category || 'stats',
  180 |         description: config.description,
  181 |         config: config.defaultConfig || {},
```

**發生時間：** 2025-07-11

**受影響文件：**
- `lib/widgets/enhanced-registry.ts` (autoRegisterWidgets 方法)

**原因：**
`autoRegisterWidgets` 方法試圖從 `widgetMapping.categoryMap` 自動註冊 widgets，但錯誤地使用了一個未定義的 `config` 變數。`categoryMap` 只係一個簡單的對象，將 widget ID 映射到分類字符串，並冇包含完整的 widget 配置信息。

**問題分析：**
1. `widgetMapping.categoryMap` 結構係 `{ [widgetId: string]: string }`，只包含分類信息
2. 但係代碼嘗試訪問 `config.title`、`config.category` 等屬性，假設 `config` 係一個配置對象
3. 實際上，widget 配置信息應該來自各個適配器文件（如 `statsWidgetConfigs`、`chartsWidgetConfigs`）

**解決方案：**
修復 `autoRegisterWidgets` 方法，只為未在適配器中註冊的 widgets 創建基本定義：

```typescript
// 修復前（錯誤）
Object.entries(widgetMapping.categoryMap || {}).forEach(([id, category]) => {
  this.register({
    id,
    title: config.title || id,        // ← config 未定義
    category: config.category || 'stats',
    description: config.description,
    config: config.defaultConfig || {},
    ...config
  });
});

// 修復後（正確）
Object.entries(widgetMapping.categoryMap || {}).forEach(([id, category]) => {
  // 只為未在適配器中註冊的 widgets 創建基本定義
  if (!this.widgets.has(id)) {
    this.register({
      id,
      title: id,
      category: category || 'stats',
      description: `${id} widget`,
      config: {},
      lazyLoad: true,
      component: createDynamicWidget(id)
    });
  }
});
```

**測試結果：**
修復後 widget registry 正常運作，冇再出現 "config is not defined" 錯誤。

**預防措施：**
1. 確保在使用變數前檢查其是否已定義
2. 了解數據結構後再訪問其屬性
3. 使用 TypeScript 嚴格模式幫助檢測未定義變數
4. 為 forEach 循環中的參數添加正確的類型註釋

## Module not found: Can't resolve './widgets/TopProductsChartWidget'

**錯誤訊息：**
```
Module not found: Can't resolve './widgets/TopProductsChartWidget'
  185 | // Production monitoring widgets - Server Actions versions
  186 | const ProductionStatsWidget = React.lazy(() => import('./widgets/ProductionStatsWidget').then(mod => ({ default: mod.ProductionStatsWidget })));
> 187 | const TopProductsChartWidget = React.lazy(() => import('./widgets/TopProductsChartWidget').then(mod => ({ default: mod.TopProductsChartWidget })));
      |                                                 ^
  188 | const ProductDistributionChartWidget = React.lazy(() => import('./widgets/ProductDistributionChartWidget').then(mod => ({ default: mod.ProductDistributionChartWidget })));
  189 | const ProductionDetailsWidget = React.lazy(() => import('./widgets/ProductionDetailsWidget').then(mod => ({ default: mod.ProductionDetailsWidget })));
```

**發生時間：** 2025-07-11

**受影響文件：**
- `app/admin/components/dashboard/AdminWidgetRenderer.tsx`

**原因：**
TopProductsChartWidget.tsx 文件喺 Week 5 清理未使用 widgets 時被移除，但 AdminWidgetRenderer.tsx 仍然嘗試導入同使用呢個已經唔存在嘅文件。

**背景：**
- TopProductsChartWidget.tsx 被判斷為未使用的 widget 並被刪除
- 但 AdminWidgetRenderer.tsx 中有特定條件判斷：當 title 係 'Top 10 Products by Quantity' 同 chartType 係 'bar' 時會使用呢個組件
- 專案中有另一個功能相同嘅 widget：TopProductsByQuantityWidget.tsx

**解決方案：**
將 TopProductsChartWidget 替換為 TopProductsByQuantityWidget：

```typescript
// 修改前
const TopProductsChartWidget = React.lazy(() => import('./widgets/TopProductsChartWidget').then(mod => ({ default: mod.TopProductsChartWidget })));

// 修改後  
const TopProductsByQuantityWidget = React.lazy(() => import('./widgets/TopProductsByQuantityWidget').then(mod => ({ default: mod.TopProductsByQuantityWidget })));

// 同時更新使用位置
<TopProductsChartWidget ... />  →  <TopProductsByQuantityWidget ... />
```

**測試結果：**
修復後 build error 消失，功能正常運作。

**預防措施：**
1. 清理未使用文件前，使用 grep 或 Task 工具搜索所有引用位置
2. 確保動態導入（React.lazy）嘅引用也被檢查
3. 檢查條件渲染邏輯中嘅組件使用
4. 維護 widget 映射文檔，記錄所有 widget 嘅使用情況

**相關問題：**
- Week 5 依賴項清理任務
- Widget registry 映射維護

## React.lazy() Double Wrapping Error - HistoryTreeV2

**錯誤訊息：**
```
Error: Element type is invalid. Received a promise that resolves to: HistoryTreeV2. 
Lazy element type must resolve to a class or function. 
Did you wrap a component in React.lazy() more than once?

lib\widgets\enhanced-registry.ts (163:9) @ WidgetWrapper
  161 |     const WidgetWrapper = (props: WidgetComponentProps) => 
  162 |       React.createElement(Suspense, { fallback: React.createElement(DefaultLoadingComponent) },
> 163 |         React.createElement(LazyComponent, props)
      |         ^
  164 |       );
```

**發生時間：** 2025-07-11

**受影響文件：**
- `lib/widgets/enhanced-registry.ts` (getWidgetComponent 方法)
- `app/admin/components/dashboard/AdminWidgetRenderer.tsx` (renderSpecialComponent)

**原因：**
雙重 React.lazy 包裝問題。調用鏈如下：
1. `AdminWidgetRenderer` → `getEnhancedWidgetComponent` → `widgetRegistry.getWidgetComponent`
2. `getWidgetComponent` 調用 `getComponent`，後者調用 `createDynamicWidget`
3. `createDynamicWidget` 使用 Next.js 的 `dynamic`（相當於 React.lazy）返回懶加載組件
4. `getWidgetComponent` 再次用 React.lazy 包裝已經懶加載的組件，造成雙重包裝

**特殊情況：**
- HistoryTreeV2 有特殊處理邏輯（widget-loader.ts 第 145-147 行）
- 當 widgetId 係 'HistoryTree' 時，會返回 HistoryTreeV2 組件

**解決方案：**
修改 `getWidgetComponent` 方法，直接返回 `getComponent` 的結果，不再進行額外的 React.lazy 包裝：

```typescript
// 修改前（錯誤 - 雙重包裝）
getWidgetComponent(widgetId: string): WidgetComponent {
  const LazyComponent = React.lazy(async () => {
    const component = this.getComponent(widgetId);
    return { default: component || DefaultLoadingComponent };
  });
  
  const WidgetWrapper = (props: WidgetComponentProps) => 
    React.createElement(Suspense, { fallback: React.createElement(DefaultLoadingComponent) },
      React.createElement(LazyComponent, props)
    );
  
  WidgetWrapper.displayName = `LazyWidget_${widgetId}`;
  return WidgetWrapper;
}

// 修改後（正確 - 直接返回）
getWidgetComponent(widgetId: string): WidgetComponent {
  // getComponent 已經返回懶加載組件，不需要再次包裝
  const component = this.getComponent(widgetId);
  
  if (!component) {
    // 如果找不到組件，返回錯誤組件
    const ErrorComponent = (props: WidgetComponentProps) => 
      React.createElement('div', { className: 'text-red-500 p-4' }, 
        `Widget not found: ${widgetId}`
      );
    ErrorComponent.displayName = `ErrorWidget_${widgetId}`;
    return ErrorComponent;
  }
  
  return component;
}
```

**測試結果：**
修復後應該消除雙重 React.lazy 包裝錯誤，組件正常渲染。

**預防措施：**
1. 確保懶加載只在一個地方進行（widget-loader.ts 的 createDynamicWidget）
2. 其他地方直接使用已懶加載的組件，不要再次包裝
3. 文檔化組件加載流程，避免混淆
4. 使用 TypeScript 類型系統標記已懶加載的組件

**相關發現：**
- `getEnhancedWidgetComponent` 傳遞了兩個參數給 `getWidgetComponent`，但後者只接受一個參數
- 這可能需要額外的修復以支持 GraphQL 功能

## Double Suspense Wrapping in AdminWidgetRenderer

**錯誤描述：**
AdminWidgetRenderer.tsx 中的 renderSpecialComponent 函數對已經內建懶加載機制的組件再次包裝 Suspense，造成雙重包裝。

**發生時間：** 2025-07-11

**受影響文件：**
- `app/admin/components/dashboard/AdminWidgetRenderer.tsx` (renderSpecialComponent 方法，第 1497-1501 行)

**問題代碼：**
```typescript
// 錯誤：對已經懶加載的組件再包裝 Suspense
const EnhancedComponent = getEnhancedWidgetComponent(componentName, false);
if (EnhancedComponent) {
  return (
    <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-800/50" />}>
      <EnhancedComponent {...componentProps} />
    </Suspense>
  );
}
```

**原因：**
1. `getEnhancedWidgetComponent` 返回的組件來自 `widgetRegistry.getWidgetComponent`
2. `widgetRegistry.getWidgetComponent` 返回的組件已經通過 `createDynamicWidget` 使用 Next.js 的 `dynamic()` 包裝
3. `dynamic()` 內部已經處理了懶加載和 Suspense boundary
4. 再次包裝 Suspense 造成雙重包裝，可能導致渲染問題

**解決方案：**
```typescript
// 正確：直接使用已經懶加載的組件
const EnhancedComponent = getEnhancedWidgetComponent(componentName, false);
if (EnhancedComponent) {
  // EnhancedComponent 已經內建懶加載和 Suspense，不需要再包裝
  return <EnhancedComponent {...componentProps} />;
}
```

**其他潛在問題：**
1. **optimization-adapter.tsx**: `wrapWithLazyLoading` 方法對 lazy component 包裝 Suspense 是正確的，因為 React.lazy 組件必須在 Suspense boundary 內使用
2. **兩套懶加載系統並存**: `widget-loader.ts` 使用 Next.js dynamic，而 `LazyWidgetRegistry.tsx` 使用 React.lazy + Suspense
3. **admin-renderer-adapter.ts**: 簡化了代碼結構，但不存在雙重包裝問題

**預防措施：**
1. 統一使用一套懶加載系統（建議使用 Next.js dynamic）
2. 在文檔中明確標註哪些組件已經內建懶加載
3. 創建 TypeScript 類型來區分普通組件和懶加載組件
4. 使用 ESLint 規則檢測多餘的 Suspense 包裝

## 兩套懶加載系統並存問題 - 徹底修復

**發生時間：** 2025-07-11

**問題描述：**
專案中存在兩套懶加載系統導致雙重包裝問題：
- `widget-loader.ts` 使用 Next.js `dynamic()`（已包含 Suspense）
- `LazyWidgetRegistry.tsx` 使用 `React.lazy()` + 手動 Suspense

**受影響文件：**
- `app/admin/components/dashboard/LazyWidgetRegistry.tsx`
- `lib/widgets/widget-loader.ts`
- 所有使用這兩套系統的 widget 組件

**根本原因：**
1. 歷史原因導致兩套懶加載系統並存
2. `createLazyWidget` 使用 `React.lazy` 並手動包裝 Suspense
3. `createDynamicWidget` 使用 `next/dynamic`，內部已包含 Suspense
4. 當組件通過不同路徑載入時，可能被多次包裝

**解決方案：**
1. **統一使用 next/dynamic**：修改 `LazyWidgetRegistry.tsx` 的 `createLazyWidget` 函數

```typescript
// 修改前（使用 React.lazy + Suspense）
export function createLazyWidget(
  importFn: () => Promise<any>,
  LoadingComponent: React.ComponentType = DefaultWidgetSkeleton
): React.ComponentType<WidgetComponentProps> {
  const LazyComponent = lazy<React.ComponentType<WidgetComponentProps>>(wrappedImportFn);
  
  return React.memo(function LazyWidget(props: WidgetComponentProps) {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  });
}

// 修改後（使用 next/dynamic）
export function createLazyWidget(
  importFn: () => Promise<any>,
  LoadingComponent: React.ComponentType = DefaultWidgetSkeleton
): React.ComponentType<WidgetComponentProps> {
  return dynamic(
    async () => {
      const importedModule = await importFn();
      // 處理 module exports...
      return { default: component };
    },
    {
      loading: () => <LoadingComponent />,
      ssr: false
    }
  );
}
```

2. **修復重複定義**：移除 `LazyComponents` 中重複的 `TopProductsByQuantityWidget` 定義

**測試結果：**
- 消除了雙重包裝問題
- 統一了懶加載機制
- 減少了不必要的渲染層級

**長期建議：**
1. 逐步將所有 widget 遷移到統一的註冊系統
2. 使用 `widget-loader.ts` 的 `createDynamicWidget` 作為唯一的懶加載方法
3. 建立明確的 widget 加載流程文檔
4. 添加自動化測試檢測雙重包裝問題