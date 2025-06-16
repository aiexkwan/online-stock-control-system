# 自定義儀表板功能研究

## 拖放庫比較

### 1. react-grid-layout
**優點：**
- 專為儀表板設計，功能最完整
- 支援響應式佈局 (responsive breakpoints)
- 支援網格對齊和碰撞檢測
- 可調整大小和拖動
- 支援序列化/反序列化配置
- 活躍社區，文檔完善

**缺點：**
- 體積較大 (~30KB gzipped)
- 學習曲線較陡
- 樣式自定義需要額外工作

**適用場景：**
- 複雜的儀表板佈局
- 需要響應式設計
- 需要保存/載入佈局

### 2. react-beautiful-dnd
**優點：**
- 優秀的拖放動畫效果
- 良好的無障礙支援 (a11y)
- API 設計優雅
- 支援觸控設備
- 體積適中 (~20KB gzipped)

**缺點：**
- 主要用於列表排序，不是網格佈局
- 不支援調整大小
- 不支援自由定位
- 已停止維護（最後更新 2022）

**適用場景：**
- 列表項目排序
- 看板式佈局
- 簡單的拖放需求

### 3. react-sortable-hoc
**優點：**
- 輕量級 (~12KB gzipped)
- 簡單易用
- 支援觸控
- 性能良好

**缺點：**
- 功能有限
- 不支援網格佈局
- 不支援調整大小
- 社區較小

**適用場景：**
- 簡單的列表排序
- 輕量級應用

## 建議選擇：react-grid-layout

基於我們的需求（儀表板、小部件、保存配置），**react-grid-layout** 是最合適的選擇。

## 小部件系統架構設計

### 1. 小部件介面定義
```typescript
interface DashboardWidget {
  id: string;                    // 唯一標識
  type: WidgetType;             // 小部件類型
  title: string;                // 顯示標題
  config: WidgetConfig;         // 小部件配置
  layout: GridLayout;           // 佈局信息
  permissions?: string[];       // 權限要求
}

interface WidgetConfig {
  refreshInterval?: number;     // 自動刷新間隔（毫秒）
  dataSource?: string;          // 數據源
  displayOptions?: any;         // 顯示選項
  [key: string]: any;          // 擴展配置
}

interface GridLayout {
  x: number;      // 網格 X 座標
  y: number;      // 網格 Y 座標
  w: number;      // 寬度（網格單位）
  h: number;      // 高度（網格單位）
  minW?: number;  // 最小寬度
  minH?: number;  // 最小高度
  maxW?: number;  // 最大寬度
  maxH?: number;  // 最大高度
  static?: boolean; // 是否固定
}

enum WidgetType {
  ANALYTICS_CHART = 'analytics_chart',
  STATS_CARD = 'stats_card',
  RECENT_ACTIVITY = 'recent_activity',
  QUICK_ACTIONS = 'quick_actions',
  STOCK_SUMMARY = 'stock_summary',
  ALERTS = 'alerts',
  CUSTOM = 'custom'
}
```

### 2. 小部件註冊系統
```typescript
// 小部件工廠
class WidgetFactory {
  private static widgets = new Map<WidgetType, WidgetComponent>();
  
  static register(type: WidgetType, component: WidgetComponent) {
    this.widgets.set(type, component);
  }
  
  static create(widget: DashboardWidget): React.ReactElement {
    const Component = this.widgets.get(widget.type);
    if (!Component) {
      throw new Error(`Unknown widget type: ${widget.type}`);
    }
    return <Component {...widget} />;
  }
}

// 小部件組件介面
interface WidgetComponent {
  (props: DashboardWidget): React.ReactElement;
}
```

### 3. 配置存儲方案

#### 第一階段：LocalStorage
- 快速實現原型
- 用戶特定配置
- 即時保存/載入

```typescript
const DashboardStorage = {
  save: (config: DashboardConfig) => {
    localStorage.setItem('dashboard_config', JSON.stringify(config));
  },
  
  load: (): DashboardConfig | null => {
    const saved = localStorage.getItem('dashboard_config');
    return saved ? JSON.parse(saved) : null;
  },
  
  clear: () => {
    localStorage.removeItem('dashboard_config');
  }
};
```

#### 第二階段：Supabase 存儲
- 跨設備同步
- 多用戶支援
- 版本控制

```sql
-- 儀表板配置表
CREATE TABLE dashboard_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 共享儀表板模板
CREATE TABLE dashboard_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  category VARCHAR(50),
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 實施計劃

### 第一階段：基礎架構 (1-2 週)
1. 安裝 react-grid-layout
2. 創建基礎 Dashboard 組件
3. 實現小部件介面和工廠模式
4. 創建 2-3 個示例小部件

### 第二階段：核心功能 (1-2 週)
1. 實現拖放和調整大小
2. 添加編輯/查看模式切換
3. 實施 LocalStorage 保存/載入
4. 創建小部件配置面板

### 第三階段：進階功能 (1-2 週)
1. 實現 Supabase 存儲
2. 添加預設模板
3. 實現導入/導出功能
4. 添加更多小部件類型

### 第四階段：優化和測試 (1 週)
1. 性能優化
2. 響應式設計調整
3. 用戶體驗改進
4. 測試和錯誤修復

## 技術決策

1. **使用 react-grid-layout** - 功能最完整，適合儀表板需求
2. **TypeScript 優先** - 確保類型安全
3. **漸進式實施** - 先 LocalStorage，後 Supabase
4. **組件化設計** - 每個小部件獨立組件
5. **響應式優先** - 支援桌面和移動設備

## 下一步行動

1. 安裝 react-grid-layout
2. 創建基礎 Dashboard 組件結構
3. 實現第一個可拖動小部件