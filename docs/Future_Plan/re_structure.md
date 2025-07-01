# 系統架構重構計劃

## 目錄
1. [現狀分析](#現狀分析)
2. [重構目標](#重構目標)
3. [架構設計](#架構設計)
4. [實施階段](#實施階段)
5. [技術細節](#技術細節)
6. [風險評估](#風險評估)
7. [時間規劃](#時間規劃)

## 現狀分析

### 當前系統架構統計

#### 固定頁面 (6個)
| 頁面路徑 | 功能 | 特殊需求 |
|-----------|----------|---------------------|
| `/print-label` | QC標籤打印 | 打印機整合、複雜表單 |
| `/print-grnlabel` | GRN標籤打印 | 打印機整合、useReducer |
| `/stock-transfer` | 庫存轉移 | 鍵盤快捷鍵、實時更新 |
| `/order-loading` | 訂單裝載 | 虛擬滾動、音頻反饋 |
| `/admin/stock-count` | 庫存盤點 | 掃碼器、批次模式 |
| 其他 (登錄等) | 系統基礎頁面 | 認證流程 |

#### 動態路由頁面 (8個)
通過 `/admin/[theme]/page.tsx` 處理：
- 儀表板：`injection`、`pipeline`、`warehouse`
- 管理：`upload`、`update`、`stock-management`
- 系統：`system`、`analysis`

### 現存問題
1. **架構不一致**：`stock-count` 是 `/admin` 下唯一的固定頁面
2. **代碼重複**：兩個打印頁面有相似邏輯但分別實現
3. **混合Widget系統**：部分頁面有內聯widget，其他使用獨立組件
4. **缺乏標準**：何時使用固定頁面vs動態路由沒有明確標準

## 重構目標

### 主要目標
1. **統一架構模式**：建立清晰的頁面類型分類標準
2. **提高代碼重用**：減少重複代碼，改善可維護性
3. **保持靈活性**：不犧牲特殊功能需求
4. **性能提升**：優化載入速度和運行效率
5. **改善開發體驗**：更清晰的代碼組織

### 設計原則
- **漸進式增強**：不影響現有功能
- **向後兼容**：保持URL路徑（需要時使用重定向）
- **模組化設計**：解耦功能便於測試
- **配置驅動**：盡可能使用配置而非代碼

## 架構設計

### 新架構結構
```
/app
├── (operations)              // 操作型頁面組
│   ├── print                // 打印功能模組
│   │   ├── [type]          // 不同打印類型的動態路由
│   │   │   └── page.tsx
│   │   ├── _components     // 共享打印組件
│   │   ├── _hooks         // 共享打印Hooks
│   │   └── _utils         // 打印工具類
│   ├── stock-transfer      // 庫存轉移（保持獨立）
│   ├── order-loading       // 訂單裝載（保持獨立）
│   └── layout.tsx          // 操作型頁面共享布局
│
├── (admin)                  // 管理頁面組
│   ├── [theme]             // 現有動態路由系統
│   │   └── page.tsx
│   ├── _components         // 管理頁面共享組件
│   ├── _widgets           // Widget組件庫
│   └── layout.tsx         // 管理頁面共享布局
│
├── (auth)                   // 認證頁面組
│   ├── login
│   ├── register
│   └── layout.tsx
│
└── _shared                  // 全局共享資源
    ├── components
    ├── hooks
    ├── services
    └── utils
```

### 頁面分類標準

#### 使用固定頁面當：
- 需要特殊硬件整合（打印機、掃碼器）
- 實時操作需求（< 100ms 響應）
- UI/UX 與標準儀表板完全不同
- 需要離線功能支持
- 有特殊性能優化需求

#### 使用動態路由當：
- 基於Widget的布局
- 主要功能是數據展示
- 需要統一導航和權限管理
- 功能可通過配置調整
- 共享相似的用戶體驗

### 技術架構圖
```
┌─────────────────────────────────────────────────┐
│                   用戶界面層                      │
├─────────────────┬───────────────┬───────────────┤
│  操作型頁面      │  管理頁面      │ 認證頁面       │
│  (固定+動態)    │  (動態)       │ (固定)        │
├─────────────────┴───────────────┴───────────────┤
│                  共享組件層                      │
│         (Widgets, UI組件, Hooks)               │
├─────────────────────────────────────────────────┤
│                  業務邏輯層                      │
│    (服務、狀態管理、工具類)                      │
├─────────────────────────────────────────────────┤
│                  數據訪問層                      │
│         (Supabase客戶端, API路由)              │
└─────────────────────────────────────────────────┘
```

## 實施階段

### 階段1：打印功能整合 (2-3週)

#### 1.1 創建統一打印架構
```typescript
// /app/(operations)/print/[type]/page.tsx
export default function PrintPage({ params }: { params: { type: string } }) {
  const PrintComponent = getPrintComponent(params.type);
  return <PrintComponent />;
}

// 支持的類型
const printTypes = {
  'label': QCLabelPrint,
  'grnlabel': GRNLabelPrint,
};
```

#### 1.2 提取共享邏輯
```typescript
// /app/(operations)/print/_hooks/usePrintForm.ts
export function usePrintForm<T>(config: PrintFormConfig) {
  // 共享表單邏輯
  // 打印隊列管理
  // 錯誤處理
}

// /app/(operations)/print/_services/printService.ts
export class PrintService {
  static async print(data: PrintData) {
    // 統一打印接口
    // 打印機狀態檢查
    // 重試機制
  }
}
```

#### 1.3 遷移現有頁面
- 保持原始URL可訪問（使用重定向）
- 逐步遷移功能到新架構
- 徹底測試確保功能正常

### 階段2：Admin頁面統一 (3-4週)

#### 2.1 解決 stock-count 特殊情況
```typescript
// 方案A：納入動態路由並特殊處理
adminDashboardLayouts['stock-count'] = {
  theme: 'stock-count',
  type: 'special', // 標記為特殊類型
  component: 'StockCountSpecial',
  disableTimeSelector: true,
  disableWidgetSystem: true,
};

// 方案B：遷移到操作組
// /app/(operations)/stock-count/page.tsx
// 與其他操作型頁面一起
```

#### 2.2 消除內聯Widget
```typescript
// 之前：AdminWidgetRenderer中的內聯widget
if (config.type === 'stats') {
  return <div>内联 stats...</div>;
}

// 之後：獨立Widget組件
// /app/(admin)/_widgets/StatsWidget.tsx
export const StatsWidget: FC<WidgetProps> = ({ config }) => {
  // 獨立的統計widget實現
};
```

#### 2.3 優化Widget載入
```typescript
// 實現智能預加載
const widgetRegistry = {
  'HistoryTree': {
    component: lazy(() => import('./HistoryTree')),
    preload: true,
    priority: 1,
  },
  'StockTypeSelector': {
    component: lazy(() => import('./StockTypeSelector')),
    preload: false,
    priority: 2,
  },
};
```

### 階段3：共享服務層 (2-3週)

#### 3.1 硬件整合服務
```typescript
// /app/_shared/services/hardware/scanner.ts
export class ScannerService {
  static async initialize() {}
  static async scan(): Promise<string> {}
  static async disconnect() {}
}

// /app/_shared/services/hardware/printer.ts
export class PrinterService {
  static async getAvailablePrinters() {}
  static async print(printer: string, data: any) {}
  static async getStatus(printer: string) {}
}
```

#### 3.2 實時通信服務
```typescript
// /app/_shared/services/realtime/index.ts
export class RealtimeService {
  static subscribe(channel: string, callback: Function) {}
  static publish(channel: string, data: any) {}
  static unsubscribe(channel: string) {}
}
```

#### 3.3 離線支持服務
```typescript
// /app/_shared/services/offline/index.ts
export class OfflineService {
  static async saveToLocal(key: string, data: any) {}
  static async syncWhenOnline() {}
  static async getPendingOperations() {}
}
```

### 階段4：性能優化 (2週)

#### 4.1 路由優化
```typescript
// 實現路由預加載
export function PreloadLink({ href, children }) {
  const handleMouseEnter = () => {
    router.prefetch(href);
  };
  
  return (
    <Link href={href} onMouseEnter={handleMouseEnter}>
      {children}
    </Link>
  );
}
```

#### 4.2 數據緩存策略
```typescript
// 實現 SWR 或 React Query
const { data, error } = useSWR(
  ['stock-level', filters],
  () => fetchStockLevel(filters),
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
  }
);
```

## 技術細節

### 路由遷移策略
```typescript
// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/print-label',
        destination: '/print/label',
        permanent: false, // 初期使用臨時重定向
      },
      {
        source: '/print-grnlabel',
        destination: '/print/grnlabel',
        permanent: false,
      },
    ];
  },
};
```

### Widget系統改進
```typescript
// 新的Widget接口
interface Widget {
  id: string;
  type: WidgetType;
  config: WidgetConfig;
  
  // 生命週期
  onMount?: () => void;
  onUnmount?: () => void;
  onRefresh?: () => Promise<void>;
  
  // 通信
  onMessage?: (message: WidgetMessage) => void;
  sendMessage?: (target: string, data: any) => void;
  
  // 狀態持久化
  saveState?: () => WidgetState;
  restoreState?: (state: WidgetState) => void;
}
```

### 測試策略
```typescript
// 為每個階段建立測試
describe('打印模組整合', () => {
  it('應該能處理標籤打印', async () => {
    const result = await PrintService.print({
      type: 'label',
      data: mockLabelData,
    });
    expect(result.success).toBe(true);
  });
  
  it('打印機離線時應優雅降級', async () => {
    // 測試離線場景
  });
});
```

## 風險評估

### 技術風險
| 風險 | 影響 | 緩解措施 |
|------|--------|------------|
| 路由遷移破壞書籤 | 中等 | 使用永久重定向，提前通知用戶 |
| Widget系統重構影響性能 | 高 | 分階段實施，充分測試 |
| 硬件整合服務不穩定 | 高 | 保留原實現作為回退 |

### 業務風險
| 風險 | 影響 | 緩解措施 |
|------|--------|------------|
| 用戶習慣改變 | 中等 | 保持UI一致性，提供培訓 |
| 功能暫時不可用 | 高 | 使用功能開關，漸進式發布 |

## 時間規劃

### 整體時間表
```
2025 Q1: 階段1 - 打印功能整合
2025 Q1-Q2: 階段2 - Admin頁面統一
2025 Q2: 階段3 - 共享服務層
2025 Q2: 階段4 - 性能優化
2025 Q3: 監控和調優
```

### 里程碑
- M1 (第4週)：打印功能整合完成
- M2 (第8週)：所有內聯widget消除
- M3 (第12週)：共享服務層上線
- M4 (第14週)：達成性能指標

### 成功指標
- 代碼重複度減少50%
- 頁面載入速度提升30%
- 新功能開發時間減少40%
- 用戶滿意度維持或提升

## 未來規劃

### 長期演進
1. **微前端架構**：獨立模組部署
2. **插件系統**：第三方擴展支持
3. **低代碼平台**：業務用戶可自定義工作流程
4. **AI輔助**：智能推薦和自動化

### 持續改進
- 定期架構審查（季度）
- 性能監控和優化
- 用戶反饋收集
- 技術債務管理

---

*文檔版本：1.0*  
*最後更新：2025-01-01*  
