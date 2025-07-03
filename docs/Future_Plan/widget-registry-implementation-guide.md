# Widget 註冊系統實施指南

**文檔版本**: 1.0  
**創建日期**: 2025-07-03  
**實施週期**: 2025-07-04 至 2025-07-11

## 📋 快速參考

本指南提供 Widget 註冊系統的具體實施步驟和代碼示例。

## 🎯 實施優先級

基於「優化優先、避免冗餘」原則，我們將：
1. **優化現有組件**而非創建新系統
2. **擴展 LazyWidgetRegistry** 而非重寫
3. **改進 adminDashboardLayouts** 而非替換
4. **利用現有 hooks 和 context**

## 📁 Day 1-2: 目錄重組和接口定義

### Step 1: 創建新目錄結構
```bash
# 在 /app/admin/components/dashboard/widgets/ 下創建子目錄
mkdir -p widgets/{stats,charts,lists,operations,uploads,reports,special}
```

### Step 2: Widget 分類遷移
```typescript
// 分類指南
stats/       → StatsCardWidget, AwaitLocationQtyWidget, YesterdayTransferCountWidget
charts/      → ProductMixChartWidget, StockDistributionChart, WarehouseWorkLevelAreaChart  
lists/       → OrdersListWidget, WarehouseTransferListWidget, OrderStateListWidget
operations/  → VoidPalletWidget, ProductUpdateWidget, SupplierUpdateWidget
uploads/     → UploadOrdersWidget, UploadFilesWidget, UploadPhotoWidget
reports/     → TransactionReportWidget, GrnReportWidget, AcoOrderReportWidget
special/     → HistoryTree, Folder3D, EmptyPlaceholderWidget
```

### Step 3: 添加統一接口到現有文件
```typescript
// 擴展 app/types/dashboard.ts
export interface WidgetDefinition {
  id: string;
  name: string;
  category: 'stats' | 'charts' | 'lists' | 'operations' | 'uploads' | 'reports' | 'special';
  description?: string;
  
  // GraphQL 集成
  graphqlQuery?: string;
  useGraphQL?: boolean;
  
  // 性能配置
  lazyLoad?: boolean;
  preloadPriority?: number; // 1-10, 10 最高
  
  // 權限
  requiredRoles?: string[];
  requiredFeatures?: string[];
}

// 擴展現有 WidgetComponentProps
export interface EnhancedWidgetProps extends WidgetComponentProps {
  definition?: WidgetDefinition;
  preloaded?: boolean;
}
```

## 📝 Day 3-4: 增強 LazyWidgetRegistry

### Step 4: 擴展 LazyWidgetRegistry.tsx
```typescript
// 在現有 LazyWidgetRegistry.tsx 中添加

// Widget 定義映射
export const WidgetDefinitions: Record<string, WidgetDefinition> = {
  'StatsCardWidget': {
    id: 'StatsCardWidget',
    name: '統計卡片',
    category: 'stats',
    description: '顯示關鍵業務指標',
    lazyLoad: true,
    preloadPriority: 8,
  },
  'ProductMixChartWidget': {
    id: 'ProductMixChartWidget',
    name: '產品組合圖表',
    category: 'charts',
    description: '展示產品分佈情況',
    lazyLoad: true,
    preloadPriority: 5,
    useGraphQL: true,
    graphqlQuery: 'GetProductMixData',
  },
  // ... 為所有 57 個 widgets 添加定義
};

// 自動註冊函數
export function autoRegisterWidgets() {
  const startTime = performance.now();
  
  Object.entries(WidgetDefinitions).forEach(([id, definition]) => {
    // 根據類別動態導入
    const importPath = `./widgets/${definition.category}/${id}`;
    
    if (definition.lazyLoad) {
      // 添加到懶加載組件
      LazyComponents[id] = createLazyWidget(
        () => import(importPath).then(m => ({ 
          default: m[id] || m.default 
        }))
      );
    }
  });
  
  const endTime = performance.now();
  console.log(`Widget 註冊完成，耗時: ${endTime - startTime}ms`);
}

// 按類別獲取 widgets
export function getWidgetsByCategory(category: string): WidgetDefinition[] {
  return Object.values(WidgetDefinitions)
    .filter(def => def.category === category);
}

// 預加載高優先級 widgets
export async function preloadHighPriorityWidgets() {
  const highPriority = Object.entries(WidgetDefinitions)
    .filter(([_, def]) => def.preloadPriority && def.preloadPriority >= 7)
    .sort((a, b) => (b[1].preloadPriority || 0) - (a[1].preloadPriority || 0));
    
  for (const [id, definition] of highPriority) {
    if (LazyComponents[id]) {
      // 觸發預加載
      LazyComponents[id].preload?.();
    }
  }
}
```

## 🔧 Day 5: 動態配置系統

### Step 5: 改進 adminDashboardLayouts.ts
```typescript
// 擴展現有的 adminDashboardLayouts.ts

import { WidgetDefinitions } from './LazyWidgetRegistry';

// 動態佈局加載器
export class DynamicLayoutManager {
  private static instance: DynamicLayoutManager;
  private userLayouts = new Map<string, AdminDashboardLayout>();
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new DynamicLayoutManager();
    }
    return this.instance;
  }
  
  // 從數據庫加載用戶自定義佈局
  async loadUserLayout(userId: string, theme: string): Promise<AdminDashboardLayout | null> {
    try {
      const { data } = await supabase
        .from('user_dashboard_layouts')
        .select('*')
        .eq('user_id', userId)
        .eq('theme', theme)
        .single();
        
      if (data) {
        return JSON.parse(data.layout_config);
      }
    } catch (error) {
      console.error('Failed to load user layout:', error);
    }
    return null;
  }
  
  // 獲取佈局（優先用戶自定義）
  async getLayout(userId: string, theme: string): Promise<AdminDashboardLayout> {
    // 1. 檢查緩存
    const cacheKey = `${userId}-${theme}`;
    if (this.userLayouts.has(cacheKey)) {
      return this.userLayouts.get(cacheKey)!;
    }
    
    // 2. 嘗試加載用戶佈局
    const userLayout = await this.loadUserLayout(userId, theme);
    if (userLayout) {
      this.userLayouts.set(cacheKey, userLayout);
      return userLayout;
    }
    
    // 3. 返回默認佈局
    return adminDashboardLayouts[theme] || adminDashboardLayouts.overview;
  }
  
  // 保存用戶佈局
  async saveUserLayout(
    userId: string, 
    theme: string, 
    layout: AdminDashboardLayout
  ): Promise<void> {
    await supabase
      .from('user_dashboard_layouts')
      .upsert({
        user_id: userId,
        theme,
        layout_config: JSON.stringify(layout),
        updated_at: new Date().toISOString()
      });
      
    // 更新緩存
    this.userLayouts.set(`${userId}-${theme}`, layout);
  }
  
  // 驗證 widget 權限
  filterWidgetsByPermission(
    widgets: AdminWidgetConfig[], 
    userRoles: string[]
  ): AdminWidgetConfig[] {
    return widgets.filter(widget => {
      const definition = WidgetDefinitions[widget.component || widget.type];
      if (!definition?.requiredRoles) return true;
      
      return definition.requiredRoles.some(role => userRoles.includes(role));
    });
  }
}

// 導出單例
export const layoutManager = DynamicLayoutManager.getInstance();
```

## 🚀 Day 6: 性能優化和 GraphQL 集成

### Step 6: Widget 預加載服務
```typescript
// 創建 lib/widgets/widget-preload-service.ts
import { unifiedPreloadService } from '@/lib/preload/unified-preload-service';
import { WidgetDefinitions, preloadHighPriorityWidgets } from '@/app/admin/components/dashboard/LazyWidgetRegistry';

export class WidgetPreloadService {
  private static preloadedWidgets = new Set<string>();
  
  // 基於當前主題預加載 widgets
  static async preloadForTheme(theme: string, userId: string) {
    // 1. 預加載高優先級 widgets
    await preloadHighPriorityWidgets();
    
    // 2. 預加載主題特定 widgets
    const layout = await layoutManager.getLayout(userId, theme);
    const widgetsToPreload = layout.widgets
      .map(w => WidgetDefinitions[w.component || w.type])
      .filter(def => def && def.preloadPriority && def.preloadPriority > 5)
      .sort((a, b) => (b.preloadPriority || 0) - (a.preloadPriority || 0))
      .slice(0, 5); // 預加載前 5 個
      
    for (const widget of widgetsToPreload) {
      if (!this.preloadedWidgets.has(widget.id)) {
        // 預加載組件
        if (LazyComponents[widget.id]) {
          LazyComponents[widget.id].preload?.();
        }
        
        // 預加載數據（如果使用 GraphQL）
        if (widget.useGraphQL && widget.graphqlQuery) {
          await unifiedPreloadService.preloadQuery(widget.graphqlQuery);
        }
        
        this.preloadedWidgets.add(widget.id);
      }
    }
  }
  
  // 智能預測下一個可能使用的 widgets
  static async predictNextWidgets(currentWidget: string): Promise<string[]> {
    // 基於歷史數據預測
    const predictions = await unifiedPreloadService.getPredictions(
      'widget-navigation',
      currentWidget
    );
    
    return predictions
      .filter(p => p.confidence > 0.7)
      .map(p => p.target)
      .slice(0, 3);
  }
}
```

### Step 7: 更新 Widget 組件模板
```typescript
// 為每個 widget 添加定義導出
// 例如：widgets/stats/StatsCardWidget.tsx

export const StatsCardWidgetDefinition: WidgetDefinition = {
  id: 'StatsCardWidget',
  name: '統計卡片',
  category: 'stats',
  description: '顯示關鍵業務指標',
  lazyLoad: true,
  preloadPriority: 8,
};

export function StatsCardWidget(props: EnhancedWidgetProps) {
  // 現有組件代碼...
  
  // 添加預加載提示
  if (props.preloaded) {
    console.log('Widget was preloaded');
  }
  
  return (
    // 現有 JSX...
  );
}

// 導出預加載函數
StatsCardWidget.preload = () => {
  // 預加載相關資源
  import('./StatsCardWidget.module.css');
};
```

## 📊 Day 7: 測試和遷移驗證

### Step 8: 性能測試腳本
```typescript
// scripts/test-widget-performance.ts
import { measurePerformance } from '@/lib/utils/performance';

async function testWidgetPerformance() {
  // 測試前的性能
  const beforeMetrics = await measurePerformance(() => {
    // 加載所有 widgets
  });
  
  // 啟用新系統
  await autoRegisterWidgets();
  
  // 測試後的性能
  const afterMetrics = await measurePerformance(() => {
    // 加載所有 widgets
  });
  
  console.log('Performance Improvement:', {
    loadTime: `${((beforeMetrics.loadTime - afterMetrics.loadTime) / beforeMetrics.loadTime * 100).toFixed(2)}%`,
    memoryUsage: `${((beforeMetrics.memory - afterMetrics.memory) / beforeMetrics.memory * 100).toFixed(2)}%`,
  });
}
```

### Step 9: 遷移檢查清單
```typescript
// 確保所有 widgets 正常工作的檢查清單
const migrationChecklist = {
  '目錄結構': [
    '✓ 所有 widgets 已移至對應子目錄',
    '✓ import 路徑已更新',
    '✓ 無遺漏文件',
  ],
  '功能測試': [
    '✓ 每個主題頁面正常加載',
    '✓ Widget 數據正確顯示',
    '✓ 交互功能正常',
  ],
  '性能驗證': [
    '✓ 初始加載時間 < 1s',
    '✓ 懶加載正常工作',
    '✓ 預加載生效',
  ],
  '兼容性': [
    '✓ 現有用戶配置保持',
    '✓ API 兼容性',
    '✓ 無破壞性變更',
  ],
};
```

## 🎯 關鍵實施要點

1. **漸進式遷移**
   - 一次遷移一個類別
   - 保持原文件直到確認新版本正常
   - 使用 feature flag 控制

2. **向後兼容**
   - 保留原有 API
   - 支援舊配置格式
   - 提供遷移工具

3. **性能監控**
   - 使用現有監控系統
   - 追蹤關鍵指標
   - A/B 測試驗證

4. **文檔更新**
   - 更新開發指南
   - 創建遷移文檔
   - 記錄最佳實踐

## 📈 預期結果驗證

```typescript
// 驗證腳本
async function validateImplementation() {
  const results = {
    widgetCount: Object.keys(WidgetDefinitions).length,
    lazyLoadedCount: Object.values(WidgetDefinitions).filter(d => d.lazyLoad).length,
    categorizedCount: new Set(Object.values(WidgetDefinitions).map(d => d.category)).size,
    avgLoadTime: await measureAverageLoadTime(),
    memoryReduction: await calculateMemoryReduction(),
  };
  
  console.table(results);
  
  // 驗證目標
  assert(results.widgetCount === 57, 'All widgets registered');
  assert(results.lazyLoadedCount === 57, '100% lazy loading');
  assert(results.avgLoadTime < 1000, 'Load time < 1s');
  assert(results.memoryReduction > 0.6, '60%+ memory reduction');
}
```

---

**注意事項**：
- 優先優化現有代碼，避免創建冗餘文件
- 保持向後兼容性
- 充分測試每個步驟
- 記錄所有變更

*實施指南完成日期: 2025-07-03*