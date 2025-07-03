# Widget 註冊系統實施計劃

**計劃階段**: 階段 1.2 - Widget 註冊系統  
**預計開始**: 2025-07-04  
**預計完成**: 2025-07-11 (1週)  
**前置條件**: ✅ 統一數據層完成

## 📋 執行摘要

基於 2025-07-03 的系統調查，Widget 系統需要從當前的硬編碼、分散式架構升級到模組化、可擴展的註冊系統。

## 🎯 核心目標

1. **模組化架構** - 將 57 個 widgets 重組為結構化系統
2. **動態註冊** - 取代硬編碼配置，實現動態 widget 管理
3. **性能優化** - 全面懶加載和智能預加載
4. **開發體驗** - 簡化新 widget 開發和集成流程

## 📊 現狀分析

### Widget 系統統計
- **總數**: 57 個 widget 組件
- **位置**: 全部在 `/app/admin/components/dashboard/widgets/`
- **分類混亂**: 無子目錄結構
- **懶加載覆蓋**: 僅 ~25% widgets 實施懶加載

### 現有基礎設施
```typescript
// 已有組件
- LazyWidgetRegistry.tsx     // 部分懶加載實現
- adminDashboardLayouts.ts   // 硬編碼佈局配置
- UnifiedWidgetWrapper.tsx   // 統一視覺包裝器
- useWidgetData.ts          // 數據加載 hook
```

### 主要問題
1. **可維護性差**: 57 個文件在同一目錄
2. **擴展困難**: 新增 widget 需修改多處
3. **性能瓶頸**: 大部分 widgets 非懶加載
4. **缺乏標準**: 各 widget 實現不一致

## 🏗️ 架構設計

### 1. Widget 目錄重組
```
/widgets
├── stats/              # 統計卡片類 (15個)
│   ├── StatsCard.tsx
│   ├── AwaitLocationQty.tsx
│   └── ...
├── charts/             # 圖表類 (8個)
│   ├── ProductMixChart.tsx
│   ├── StockDistribution.tsx
│   └── ...
├── lists/              # 列表類 (10個)
│   ├── OrdersList.tsx
│   ├── WarehouseTransferList.tsx
│   └── ...
├── operations/         # 操作類 (10個)
│   ├── VoidPallet.tsx
│   ├── ProductUpdate.tsx
│   └── ...
├── uploads/            # 上傳類 (6個)
│   ├── UploadOrders.tsx
│   ├── UploadFiles.tsx
│   └── ...
├── reports/            # 報表類 (5個)
│   ├── TransactionReport.tsx
│   ├── GrnReport.tsx
│   └── ...
└── special/            # 特殊用途 (3個)
    ├── HistoryTree.tsx
    ├── Folder3D.tsx
    └── ...
```

### 2. 統一 Widget 接口
```typescript
// lib/widgets/types.ts
export interface WidgetDefinition {
  // 基本信息
  id: string;
  name: string;
  category: WidgetCategory;
  description?: string;
  
  // 配置
  defaultSize: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  
  // 數據需求
  dataRequirements?: {
    graphqlQueries?: string[];
    restEndpoints?: string[];
    subscriptions?: string[];
    refreshInterval?: number;
  };
  
  // 權限
  permissions?: {
    roles?: string[];
    features?: string[];
  };
  
  // 性能
  performance?: {
    lazyLoad?: boolean;
    preload?: boolean;
    cacheStrategy?: 'aggressive' | 'normal' | 'minimal';
  };
  
  // 渲染
  component: React.ComponentType<WidgetProps>;
}

// 標準 Widget Props
export interface WidgetProps {
  id: string;
  config: WidgetConfig;
  data?: any;
  loading?: boolean;
  error?: Error;
  onRefresh?: () => void;
  onConfigure?: () => void;
}
```

### 3. 增強 Widget Registry
```typescript
// lib/widgets/registry.ts
export class WidgetRegistry {
  private widgets = new Map<string, WidgetDefinition>();
  private categories = new Map<WidgetCategory, Set<string>>();
  
  // 註冊 widget
  register(definition: WidgetDefinition): void {
    this.widgets.set(definition.id, definition);
    this.addToCategory(definition);
    this.setupLazyLoading(definition);
  }
  
  // 批量註冊（自動發現）
  async autoDiscover(): Promise<void> {
    const modules = await this.scanWidgetModules();
    modules.forEach(module => this.register(module.definition));
  }
  
  // 獲取 widget
  getWidget(id: string): WidgetDefinition | undefined {
    return this.widgets.get(id);
  }
  
  // 按類別獲取
  getByCategory(category: WidgetCategory): WidgetDefinition[] {
    const ids = this.categories.get(category) || new Set();
    return Array.from(ids).map(id => this.widgets.get(id)!);
  }
  
  // 性能優化
  private setupLazyLoading(definition: WidgetDefinition): void {
    if (definition.performance?.lazyLoad) {
      // 動態替換為懶加載版本
      definition.component = createLazyWidget(
        () => import(`./widgets/${definition.category}/${definition.id}`)
      );
    }
  }
}

// 全局 registry 實例
export const widgetRegistry = new WidgetRegistry();
```

### 4. 動態佈局配置
```typescript
// lib/widgets/layout-manager.ts
export class LayoutManager {
  private layouts = new Map<string, DashboardLayout>();
  
  // 加載佈局（支援動態和預設）
  async loadLayout(theme: string): Promise<DashboardLayout> {
    // 1. 檢查用戶自定義佈局
    const customLayout = await this.loadCustomLayout(theme);
    if (customLayout) return customLayout;
    
    // 2. 使用預設佈局
    return this.getDefaultLayout(theme);
  }
  
  // 保存用戶佈局
  async saveLayout(theme: string, layout: DashboardLayout): Promise<void> {
    await supabase
      .from('user_layouts')
      .upsert({ theme, layout, user_id: userId });
  }
  
  // Widget 權限過濾
  filterByPermissions(widgets: WidgetConfig[], user: User): WidgetConfig[] {
    return widgets.filter(widget => {
      const definition = widgetRegistry.getWidget(widget.type);
      return this.hasPermission(definition, user);
    });
  }
}
```

## 📈 實施步驟

### Day 1-2: 基礎架構搭建
1. ✅ 創建新的目錄結構
2. ✅ 實施統一 Widget 接口
3. ✅ 建立基礎 Registry 類
4. ✅ 設置自動發現機制

### Day 3-4: Widget 遷移
1. ✅ 按類別遷移 widgets 到新目錄
2. ✅ 為每個 widget 添加 definition
3. ✅ 更新 import 路徑
4. ✅ 測試遷移後的功能

### Day 5-6: 功能增強
1. ✅ 實施全面懶加載
2. ✅ 添加權限控制
3. ✅ 實施動態佈局加載
4. ✅ 集成 GraphQL 預加載

### Day 7: 測試和文檔
1. ✅ 性能測試對比
2. ✅ 更新開發文檔
3. ✅ 創建 widget 開發指南
4. ✅ 培訓材料準備

## 🎯 預期成果

### 性能改善
| 指標 | 當前 | 目標 | 改善 |
|------|------|------|------|
| 初始加載時間 | ~3s | < 1s | 66%+ |
| Widget 渲染 | 全部加載 | 按需加載 | 80%+ 減少 |
| 內存使用 | ~150MB | < 60MB | 60%+ |
| 代碼分割 | 1 chunk | 50+ chunks | 模組化 |

### 開發體驗
- **新增 Widget**: 從修改 3 個文件減少到 1 個
- **自動發現**: 無需手動註冊
- **TypeScript**: 完整類型支援
- **熱更新**: 支援 widget 熱替換

### 可維護性
- **代碼組織**: 清晰的分類結構
- **統一標準**: 一致的實現模式
- **文檔完善**: 自動生成 widget 目錄
- **版本管理**: Widget 版本追蹤

## 🔧 技術細節

### 自動發現實現
```typescript
// 使用 Vite 的 glob import
const widgetModules = import.meta.glob(
  './widgets/**/*.widget.tsx',
  { eager: false }
);

// 動態加載和註冊
for (const [path, module] of Object.entries(widgetModules)) {
  const { definition } = await module();
  widgetRegistry.register(definition);
}
```

### 預加載策略
```typescript
// 基於用戶行為預加載
function preloadWidgets(currentTheme: string) {
  const layout = layoutManager.getLayout(currentTheme);
  const widgets = layout.widgets
    .filter(w => w.performance?.preload)
    .slice(0, 5); // 預加載前 5 個
    
  widgets.forEach(widget => {
    const definition = widgetRegistry.getWidget(widget.type);
    if (definition?.component) {
      // 觸發組件預加載
      definition.component.preload?.();
    }
  });
}
```

## 📊 成功指標

1. **技術指標**
   - [ ] 100% widgets 支援懶加載
   - [ ] 首屏加載時間 < 1 秒
   - [ ] Widget 註冊時間 < 100ms
   - [ ] 零硬編碼配置

2. **業務指標**
   - [ ] 新 widget 開發時間減少 50%
   - [ ] Widget 相關 bug 減少 70%
   - [ ] 用戶滿意度提升

## 🚀 後續優化

1. **Widget 市場** - 允許第三方 widgets
2. **視覺編輯器** - 拖放式佈局編輯
3. **A/B 測試** - Widget 效果測試
4. **分析系統** - Widget 使用分析

---

**優先級**: 🔴 高  
**風險等級**: 🟡 中等（需要仔細測試遷移）  
**依賴項**: 統一數據層（已完成）

*計劃制定日期: 2025-07-03*