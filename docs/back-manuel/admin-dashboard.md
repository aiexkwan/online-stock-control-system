# 管理員儀表板系統技術架構文檔

## 系統概覽

NewPennine 管理員儀表板系統係一個基於 React、TypeScript 同 GraphQL 嘅現代化企業級儀表板解決方案。系統採用模組化架構，支援動態主題切換、實時數據更新、智能預加載同 A/B 測試。

## 核心架構組件

### 1. Widget 系統架構

#### 1.1 Enhanced Widget Registry

Widget Registry 係整個儀表板系統嘅核心，採用單例模式管理所有 widget 組件：

```typescript
// lib/widgets/enhanced-registry.ts
export class EnhancedWidgetRegistry implements IWidgetRegistry {
  private definitions = new Map<string, WidgetRegistryItem>();
  private categories = new Map<WidgetCategory, Set<string>>();
  private performanceData = new Map<string, PerformanceMetrics>();
  private stateManager: WidgetStateManager;
  
  // 主要功能：
  // - Widget 註冊同管理
  // - 性能監控
  // - 狀態持久化
  // - 虛擬化支援
}
```

**主要特性：**
- **自動發現機制**：通過 `autoRegisterWidgets()` 自動掃描同註冊所有 widgets
- **分類管理**：支援 9 種 widget 類別（core, stats, charts, lists, operations, uploads, reports, analysis, special）
- **性能追蹤**：記錄每個 widget 嘅加載時間、使用次數同最後使用時間
- **狀態管理**：通過 `WidgetStateManager` 持久化 widget 狀態（展開/收起、用戶設定等）

#### 1.2 Widget 虛擬化

系統提供兩種虛擬化方案優化大量 widget 嘅渲染性能：

1. **VirtualWidgetContainer**：用於列表型佈局
   ```typescript
   export class VirtualWidgetContainer {
     private visibleRange: { start: number; end: number };
     updateScrollPosition(scrollTop: number): void;
     getVisibleWidgets(): WidgetDefinition[];
   }
   ```

2. **GridVirtualizer**：用於網格佈局
   ```typescript
   export class GridVirtualizer {
     private intersectionObserver: IntersectionObserver;
     observeWidget(element: Element, widgetId: string, callback: Function): void;
   }
   ```

### 2. GraphQL 查詢同 Apollo Client 整合

#### 2.1 Apollo Server 配置

系統使用 Apollo Server 處理所有 GraphQL 請求，並整合多項優化功能：

```typescript
// lib/graphql/apollo-server-config.ts
export function createOptimizedApolloServer() {
  return new ApolloServer({
    schema,
    context: async ({ req, connection }) => ({
      user: req.user,
      dataLoaders: createDataLoaderContext(), // 解決 N+1 問題
      preloadTracking: null, // 預加載追蹤
    }),
    plugins: [
      createRateLimitingPlugin(defaultRateLimitConfig),
      performanceMonitoringPlugin,
    ],
    validationRules: [
      depthLimit(10), // 深度限制
      costAnalysis({ maximumCost: 1000 }), // 查詢複雜度分析
    ],
  });
}
```

**優化功能：**
- **Rate Limiting**：對 mutations 同 subscriptions 實施速率限制
- **Query Complexity Analysis**：防止過於複雜嘅查詢
- **DataLoader**：批量加載數據，解決 N+1 查詢問題
- **Field-level Caching**：字段級別緩存策略
- **Performance Monitoring**：實時監控查詢性能

#### 2.2 數據層架構

```typescript
// 統一數據層
unifiedDataLayer.getProducts(args)
unifiedDataLayer.getInventory(args)
unifiedDataLayer.getOrders(args)
unifiedDataLayer.getWarehouseSummary(args)
```

### 3. 動態主題系統

系統支援 8 個預定義主題，每個主題有獨立嘅佈局同配置：

```typescript
const DASHBOARD_THEMES = [
  { id: 'injection', label: 'Injection', icon: Beaker },
  { id: 'pipeline', label: 'Pipeline', icon: Cube },
  { id: 'warehouse', label: 'Warehouse', icon: Building },
  { id: 'upload', label: 'Upload', icon: Cloud },
  { id: 'update', label: 'Update', icon: Pencil },
  { id: 'stock-management', label: 'Stock Mgmt', icon: Archive },
  { id: 'system', label: 'System', icon: Cog },
  { id: 'analysis', label: 'Analysis', icon: ChartPie },
];
```

每個主題都有對應嘅：
- **Layout Component**：定義 widget 排列方式
- **Widget Configuration**：指定顯示邊個 widgets
- **Grid Template**：CSS Grid 佈局模板

### 4. 實時數據更新機制

#### 4.1 GraphQL Subscriptions

系統支援三種實時訂閱：

```typescript
Subscription: {
  inventoryUpdated: { /* 庫存更新 */ },
  orderStatusChanged: { /* 訂單狀態變更 */ },
  palletMoved: { /* 棧板移動 */ }
}
```

#### 4.2 自動刷新機制

通過 `AdminRefreshProvider` 提供全局刷新功能：
- 定時刷新策略
- 手動刷新觸發
- 刷新狀態管理

### 5. 性能優化策略

#### 5.1 懶加載機制

```typescript
// app/admin/components/dashboard/LazyWidgetRegistry.tsx
export function createLazyWidget(
  importFn: () => Promise<{ default: React.ComponentType }>,
  LoadingComponent: React.ComponentType = DefaultWidgetSkeleton
): React.ComponentType {
  const LazyComponent = lazy(importFn);
  return React.memo(function LazyWidget(props) {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  });
}
```

#### 5.2 智能預加載

**RoutePredictor**：基於用戶行為預測下一個可能訪問嘅路由
```typescript
export class RoutePredictor {
  private routeHistory: string[] = [];
  private transitionMatrix: Map<string, Map<string, number>>;
  
  predictNextRoutes(currentRoute: string): string[] {
    // 基於歷史數據預測
  }
}
```

**SmartPreloader**：智能預加載器
```typescript
export class SmartPreloader {
  private preloadQueue: PriorityQueue<PreloadTask>;
  
  async preloadForRoute(currentRoute: string): Promise<void> {
    // 基於路由預測預加載 widgets
  }
}
```

#### 5.3 網絡感知加載

**OptimizedWidgetLoader**：根據網絡狀況調整加載策略
```typescript
export class OptimizedWidgetLoader {
  private networkObserver: NetworkObserver;
  
  private adjustLoadingStrategy(networkStatus: NetworkStatus): void {
    if (networkStatus.effectiveType === '4g') {
      this.aggressivePreload();
    } else if (networkStatus.effectiveType === '3g') {
      this.conservativeLoad();
    } else {
      this.minimalLoad();
    }
  }
}
```

### 6. 錯誤邊界同錯誤處理

#### 6.1 兩層錯誤邊界

1. **AdminErrorBoundary**：整個儀表板層面
   ```typescript
   export class AdminErrorBoundary extends React.Component {
     componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
       console.error('Admin Dashboard Error:', error, errorInfo);
     }
   }
   ```

2. **WidgetErrorBoundary**：個別 widget 層面
   ```typescript
   export class WidgetErrorBoundary extends Component {
     componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
       errorHandler.handleApiError(error, {
         component: `Widget.${widgetName}`,
         action: 'render',
       });
     }
   }
   ```

#### 6.2 錯誤處理服務

統一使用 `ErrorHandler` service 處理所有錯誤：
- API 錯誤處理
- 組件渲染錯誤
- 異步操作錯誤
- 錯誤日誌記錄

### 7. A/B 測試框架整合

#### 7.1 測試配置

```typescript
export interface ABTestConfig {
  testId: string;
  segmentation: {
    type: 'percentage' | 'user' | 'route' | 'feature';
    rules: SegmentationRule[];
  };
  variants: ABTestVariant[];
  metrics: ABTestMetric[];
  rollback?: {
    enabled: boolean;
    threshold: number; // 錯誤率閾值
    window: number; // 時間窗口
  };
}
```

#### 7.2 自動回滾機制

系統會監控錯誤率，當超過閾值時自動回滾：
```typescript
private checkRollbackConditions(testId: string): void {
  const errorRate = this.calculateErrorRate();
  if (errorRate > test.rollback.threshold) {
    this.rollbackTest(testId);
  }
}
```

#### 7.3 React Hook 整合

```typescript
export function useABTest(context: Partial<ABTestContext>) {
  const [variant, setVariant] = useState<string | null>(null);
  // 根據測試配置返回對應變體
}
```

## 最佳實踐

### 1. Widget 開發指引

- 所有新 widget 必須註冊到 Enhanced Registry
- 實施懶加載以優化性能
- 使用 `WidgetErrorBoundary` 包裹防止錯誤擴散
- 支援虛擬化渲染（如適用）

### 2. 性能優化建議

- 優先使用 GraphQL 查詢而非 REST API
- 實施適當嘅緩存策略
- 對大數據列表使用虛擬化
- 監控 bundle size，避免過大嘅依賴

### 3. 錯誤處理

- 使用統一嘅 `ErrorHandler` service
- 實施適當嘅錯誤邊界
- 記錄詳細錯誤信息用於調試
- 提供用戶友好嘅錯誤提示

### 4. A/B 測試

- 設定合理嘅回滾閾值
- 監控關鍵性能指標
- 逐步增加測試流量
- 記錄詳細測試數據

## 技術棧總結

- **前端框架**：React 18 + TypeScript
- **狀態管理**：React Hooks + Zustand
- **數據層**：GraphQL + Apollo Client
- **樣式系統**：Tailwind CSS + Framer Motion
- **性能優化**：React.lazy + Suspense + Virtual Scrolling
- **錯誤處理**：Error Boundaries + ErrorHandler Service
- **A/B 測試**：自研 A/B Testing Framework
- **實時功能**：GraphQL Subscriptions + Supabase Realtime

## 未來優化方向

1. **Service Worker 整合**：離線支援同更激進嘅緩存策略
2. **WebAssembly 優化**：對計算密集型 widgets 使用 WASM
3. **機器學習預測**：更準確嘅用戶行為預測
4. **微前端架構**：將 widgets 拆分為獨立部署單元
5. **Edge Computing**：將部分計算移到邊緣節點

---

*文檔更新日期：2025-07-10*