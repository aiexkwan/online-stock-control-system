# TypeScript Compilation Errors

呢個文件記錄所有 TypeScript 編譯錯誤同解決方案。

## Cannot find module './dual-loading-adapter'

**錯誤訊息：**
```
lib/widgets/index.ts:12:107 - error TS2307: Cannot find module './dual-loading-adapter' or its corresponding type declarations.
lib/widgets/performance-integration.ts:9:58 - error TS2307: Cannot find module './dual-loading-adapter' or its corresponding type declarations.
```

**發生時間：** 2025-07-11

**受影響文件：**
- `lib/widgets/index.ts`
- `lib/widgets/performance-integration.ts`

**原因：**
`dual-loading-adapter` 模組已經被移除，但仍有代碼嘗試導入它。

**解決方案：**
1. 移除所有對 `dual-loading-adapter` 的導入
2. 移除對 `getDualLoadingConfig()` 的調用
3. 直接使用環境變量 `NEXT_PUBLIC_ENABLE_WIDGET_REGISTRY_V2` 判斷版本

**修改示例：**
```typescript
// 錯誤
import { dualLoadingAdapter, getDualLoadingConfig } from './dual-loading-adapter';
const config = getDualLoadingConfig();
const variant = config.enableV2 ? 'v2' : 'legacy';

// 正確
const variant = process.env.NEXT_PUBLIC_ENABLE_WIDGET_REGISTRY_V2 === 'true' ? 'v2' : 'legacy';
```

## 'AlertCircle' is not defined

**錯誤訊息：**
```
app/admin/components/dashboard/widgets/VoidPalletWidget.tsx:583:16 - error: 'AlertCircle' is not defined.  react/jsx-no-undef
```

**發生時間：** 2025-07-11

**受影響文件：**
- `app/admin/components/dashboard/widgets/VoidPalletWidget.tsx`

**原因：**
使用了 `AlertCircle` 組件但沒有從 `lucide-react` 導入。

**解決方案：**
在 import 語句中添加 `AlertCircle`：
```typescript
import { X, Search, QrCode, Loader2, CheckCircle, Package2, List, AlertCircle } from 'lucide-react';
```

## IWidgetRegistry 接口實現不匹配

**錯誤訊息：**
```
Property 'getAllDefinitions' in type 'SimplifiedWidgetRegistry' is not assignable to the same property in base type 'IWidgetRegistry'.
Property 'getComponent' in type 'SimplifiedWidgetRegistry' is not assignable to the same property in base type 'IWidgetRegistry'.
Property 'autoRegisterWidgets' in type 'SimplifiedWidgetRegistry' is not assignable to the same property in base type 'IWidgetRegistry'.
Property 'preloadWidgets' in type 'SimplifiedWidgetRegistry' is not assignable to the same property in base type 'IWidgetRegistry'.
```

**發生時間：** 2025-07-11

**受影響文件：**
- `lib/widgets/enhanced-registry.ts`

**原因：**
`SimplifiedWidgetRegistry` 類實現的方法簽名與 `IWidgetRegistry` 接口定義不匹配。

**解決方案：**
1. `getAllDefinitions()` 應返回 `Map<string, WidgetDefinition>` 而不是數組
2. `getComponent()` 應返回 `undefined` 而不是 `null`
3. `autoRegisterWidgets()` 應返回 `Promise<void>` 而不是 `void`
4. `preloadWidgets()` 應返回 `Promise<void>` 而不是 `void`
5. 添加缺失的 `getLoadStatistics()` 方法

**修改示例：**
```typescript
// 修改返回類型
getAllDefinitions(): Map<string, WidgetDefinition> {
  this.ensureAdaptersInitialized();
  return new Map(this.widgets);
}

// 返回 undefined 而不是 null
getComponent(widgetId: string): ComponentType<WidgetComponentProps> | undefined {
  // ... 
  return undefined;
}

// 改為 async 方法
async autoRegisterWidgets(): Promise<void> {
  // ...
}

// 添加缺失方法
getLoadStatistics(): Map<string, WidgetRegistryItem> {
  // ...
}
```

## widgetRegistry import 錯誤

**錯誤訊息：**
```
Cannot find name 'widgetRegistry'
```

**發生時間：** 2025-07-11

**受影響文件：**
- `lib/widgets/analysis-widget-adapter.ts`
- `lib/widgets/charts-widget-adapter.ts`
- `lib/widgets/lists-widget-adapter.ts`
- `lib/widgets/operations-widget-adapter.ts`
- `lib/widgets/reports-widget-adapter.ts`
- `lib/widgets/special-widget-adapter.ts`
- `lib/widgets/stats-widget-adapter.ts`

**原因：**
這些 adapter 文件使用了 `widgetRegistry` 但沒有導入。

**解決方案：**
在每個文件頂部添加：
```typescript
import { widgetRegistry } from './enhanced-registry';
```

## preloadWidgets 方法簽名不匹配

**錯誤訊息：**
```
Type '(route: string) => void' is not assignable to type '(widgetIds: string[]) => Promise<void>'.
```

**發生時間：** 2025-07-11

**受影響文件：**
- `lib/widgets/enhanced-registry.ts`

**原因：**
`preloadWidgets` 方法在接口中定義為接受 `string[]` 參數，但實現中接受的是單個 `string`。

**解決方案：**
修改方法簽名為：
```typescript
async preloadWidgets(widgetIds: string[]): Promise<void> {
  this.ensureAdaptersInitialized();
  
  await Promise.all(
    widgetIds.map(widgetId => this.getComponent(widgetId))
  ).catch(error => {
    console.error('Failed to preload widgets:', error);
  });
}
```

## React Hooks 依賴警告

**錯誤類型：** ESLint 警告

**錯誤訊息：**
```
React Hook useCallback has a missing dependency
React Hook useEffect has a missing dependency
```

**建議：**
這些是 ESLint 警告而非編譯錯誤。可以通過以下方式處理：
1. 添加缺失的依賴
2. 如果依賴確實不需要，使用 `// eslint-disable-next-line react-hooks/exhaustive-deps`
3. 重新評估 hook 的依賴數組

## React Hooks 依賴警告修復

**發生時間：** 2025-07-11

### 已修復的警告：

1. **AdminWidgetRenderer.tsx** - 添加 `renderLazyComponent` 到 useCallback 依賴
   - Line 1061 & 1353：renderStatsCard 和 renderChart 的 useCallback 缺少依賴

2. **InjectionProductionStatsWidget.tsx** - 使用 useCallback 包裹 fetchServerActionsData
   - 將 fetchServerActionsData 改為 useCallback
   - 添加 [startDate, endDate] 作為依賴

3. **ProductDistributionChartWidget.tsx** - 使用 useCallback 包裹 fetchData
   - 將 fetchData 改為 useCallback 
   - 添加 [dashboardAPI, dateRange, limit] 作為依賴

4. **StockDistributionChartV2.tsx** - 使用 eslint-disable 註釋
   - 開發者故意不包含某些依賴以避免無限循環
   - 使用 `// eslint-disable-next-line react-hooks/exhaustive-deps`

5. **VoidPalletWidget.tsx** - 添加 showSuccess 到 useEffect 依賴
   - Line 130：添加 showSuccess 到依賴數組

6. **useWidgetPerformanceTracking.ts** - 使用 eslint-disable 註釋
   - trackError 定義在 trackDataFetch 之後，會造成循環依賴
   - 使用 `// eslint-disable-next-line react-hooks/exhaustive-deps`

7. **useWidgetSmartCache.ts** - 移除不必要的依賴
   - 移除 `query.dataUpdatedAt` 從 useMemo 依賴

8. **PrintLabelPdf.tsx** - 添加 alt 屬性
   - 為 QR Code Image 添加 `alt="QR Code"`

### 剩餘警告：
- 2 個警告在測試文件 `useGraphQLFallback.test.tsx` 中，不影響生產代碼

## 總結

本次修復主要處理了：
1. ✅ 移除了不存在的 `dual-loading-adapter` 模組引用
2. ✅ 修復了 `AlertCircle` 組件未導入的問題
3. ✅ 修正了 `IWidgetRegistry` 接口實現不匹配的問題
4. ✅ 添加了缺失的 `widgetRegistry` imports
5. ✅ 修正了 `preloadWidgets` 方法簽名
6. ✅ 添加了 `getLoadStatistics` 方法
7. ✅ 修復了所有生產代碼的 React Hooks 依賴警告
8. ✅ 修復了 img 元素缺少 alt 屬性的警告

剩餘的錯誤主要在測試文件中，不影響主要功能的編譯和運行。