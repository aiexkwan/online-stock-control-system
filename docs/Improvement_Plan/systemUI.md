# 系統 UI 改進計劃

## 概述
基於代碼分析，NewPennine 系統使用 React 18 + Next.js 14 + TypeScript + Tailwind CSS 技術棧，配合 Radix UI 組件庫。整體 UI 架構良好，但存在一啲可以優化嘅地方，包括組件一致性、性能優化、移動體驗同無障礙支援。

## 現有系統 UI 架構分析

### 優點
1. **現代技術棧**：使用最新嘅 React 18 同 Next.js 14 App Router
2. **類型安全**：全面使用 TypeScript
3. **組件化設計**：基於 shadcn/ui 同 Radix UI 嘅組件系統
4. **響應式設計**：Tailwind CSS 支援各種設備
5. **動畫效果**：Framer Motion 提供流暢動畫
6. **主題系統**：完善嘅 CSS 變量同顏色系統

### 發現嘅問題

#### 1. 組件重複同不一致
- `/components/ui/` 同 `/app/admin/components/ui/` 有重複組件
- 部分組件有多個版本（如 Button 有 3 個不同實現）
- 移動組件同桌面組件缺乏統一設計語言

#### 2. 樣式碎片化
```
發現多個樣式文件：
- globals.css
- dashboard-fix.css
- widget-final-fix.css
- glassmorphism.css
- 多個內聯樣式
```

#### 3. 性能問題
- 大型表格缺少虛擬滾動
- 部分頁面初始載入過多組件
- 動畫效果可能影響低端設備性能
- Bundle size 可以進一步優化

#### 4. 移動體驗待改進
- 部分表格在移動設備上難以使用
- 觸控目標有時太細
- 缺少手勢支援（如滑動操作）
- 橫屏體驗未優化

#### 5. 無障礙功能不完整
- 部分自定義組件缺少 ARIA 標籤
- 顏色對比度在某些地方不足
- 鍵盤導航不完整
- 缺少屏幕閱讀器測試

## 改進方案

### 第一階段：統一組件庫（2週）

#### 1.1 建立統一設計系統
```typescript
// app/design-system/tokens.ts
export const DesignTokens = {
  // 顏色系統
  colors: {
    primary: {
      50: 'hsl(210, 100%, 97%)',
      100: 'hsl(210, 100%, 94%)',
      // ... 完整色階
      900: 'hsl(210, 100%, 20%)'
    },
    semantic: {
      success: 'hsl(142, 76%, 36%)',
      warning: 'hsl(38, 92%, 50%)',
      error: 'hsl(0, 84%, 60%)',
      info: 'hsl(199, 89%, 48%)'
    }
  },
  
  // 間距系統
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
  },
  
  // 字體系統
  typography: {
    fontFamily: {
      sans: ['Lato', 'Inter', 'system-ui'],
      mono: ['Fira Code', 'monospace']
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }]
    }
  },
  
  // 圓角系統
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px'
  }
};
```

#### 1.2 統一組件介面
```typescript
// app/components/ui/Button/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // 基礎樣式
  'inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10'
      },
      // 新增：觸控優化
      touchOptimized: {
        true: 'min-h-[44px] min-w-[44px] active:scale-95'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      touchOptimized: false
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  hapticFeedback?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    touchOptimized,
    loading,
    hapticFeedback = true,
    disabled,
    onClick,
    children,
    ...props 
  }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // 觸覺反饋
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
      onClick?.(e);
    };
    
    return (
      <button
        className={cn(buttonVariants({ variant, size, touchOptimized, className }))}
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            載入中...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
```

### 第二階段：性能優化（2週）

#### 2.1 實施虛擬滾動
```typescript
// app/components/ui/VirtualTable/VirtualTable.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualTable<T>({ 
  data, 
  columns,
  rowHeight = 48,
  overscan = 10 
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan
  });
  
  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-background z-10">
          <tr>
            {columns.map(column => (
              <th key={column.id}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr style={{ height: virtualizer.getTotalSize() }}>
            <td colSpan={columns.length}>
              {virtualizer.getVirtualItems().map(virtualItem => (
                <tr
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`
                  }}
                >
                  {columns.map(column => (
                    <td key={column.id}>
                      {column.cell(data[virtualItem.index])}
                    </td>
                  ))}
                </tr>
              ))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```

#### 2.2 優化動畫性能
```typescript
// app/config/animations.ts
export const AnimationConfig = {
  // 根據設備性能調整動畫
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  
  // 動畫預設
  transitions: {
    fast: { duration: 0.15 },
    normal: { duration: 0.3 },
    slow: { duration: 0.5 }
  },
  
  // 性能優化動畫
  optimizedVariants: {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 }
    },
    slideUp: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -20, opacity: 0 },
      transition: { 
        type: 'spring', 
        damping: 30, 
        stiffness: 300 
      }
    }
  }
};

// 使用 GPU 加速嘅動畫組件
export const GPUAcceleratedBox = styled(motion.div)`
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
`;
```

### 第三階段：增強移動體驗（2週）

#### 3.1 響應式表格組件
```typescript
// app/components/ui/ResponsiveTable/ResponsiveTable.tsx
export function ResponsiveTable<T>({ 
  data, 
  columns,
  mobileView = 'card' 
}: ResponsiveTableProps<T>) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  if (isMobile && mobileView === 'card') {
    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <Card key={index} className="p-4">
            {columns.map(column => (
              <div key={column.id} className="flex justify-between py-2">
                <span className="font-medium text-muted-foreground">
                  {column.header}:
                </span>
                <span>{column.cell(item)}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>
    );
  }
  
  // 桌面版表格
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        {/* ... */}
      </table>
    </div>
  );
}
```

#### 3.2 手勢支援
```typescript
// app/hooks/useGestures.ts
import { useGesture } from '@use-gesture/react';

export function useSwipeGesture(onSwipe: (direction: 'left' | 'right') => void) {
  const bind = useGesture({
    onDrag: ({ movement: [mx], direction: [dx], distance, cancel }) => {
      if (distance > 50) {
        if (dx > 0) onSwipe('right');
        else onSwipe('left');
        cancel();
      }
    }
  });
  
  return bind;
}

// 使用範例
function SwipeableCard() {
  const bind = useSwipeGesture((direction) => {
    if (direction === 'left') deleteItem();
    if (direction === 'right') archiveItem();
  });
  
  return <div {...bind()} className="touch-pan-y">內容</div>;
}
```

### 第四階段：完善無障礙功能（1週）

#### 4.1 ARIA 增強
```typescript
// app/components/ui/AriaLive/AriaLive.tsx
export function AriaLive({ 
  message, 
  politeness = 'polite' 
}: AriaLiveProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// 使用範例
function DataTable() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  
  return (
    <>
      <AriaLive 
        message={loading ? '載入中...' : `已載入 ${data.length} 筆資料`}
      />
      <table aria-label="庫存數據表">
        {/* ... */}
      </table>
    </>
  );
}
```

#### 4.2 鍵盤導航增強
```typescript
// app/hooks/useKeyboardNavigation.ts
export function useKeyboardNavigation(items: any[], onSelect: (item: any) => void) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(i => Math.max(0, i - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(i => Math.min(items.length - 1, i + 1));
          break;
        case 'Enter':
          e.preventDefault();
          onSelect(items[focusedIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          setFocusedIndex(-1);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, focusedIndex, onSelect]);
  
  return { focusedIndex };
}
```

### 第五階段：建立 UI 測試同監控（1週）

#### 5.1 視覺回歸測試
```typescript
// app/tests/visual/button.spec.tsx
import { test, expect } from '@playwright/test';

test.describe('Button Component', () => {
  test('各種變體嘅視覺效果', async ({ page }) => {
    await page.goto('/storybook/button');
    
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost'];
    
    for (const variant of variants) {
      await expect(page.locator(`[data-variant="${variant}"]`)).toHaveScreenshot(
        `button-${variant}.png`
      );
    }
  });
  
  test('響應式佈局', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },   // iPhone SE
      { width: 768, height: 1024 },  // iPad
      { width: 1920, height: 1080 }  // Desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await expect(page).toHaveScreenshot(`layout-${viewport.width}.png`);
    }
  });
});
```

#### 5.2 性能監控
```typescript
// app/utils/performanceMonitor.ts
export class PerformanceMonitor {
  static measureComponentRender(componentName: string) {
    if (typeof window === 'undefined') return;
    
    performance.mark(`${componentName}-start`);
    
    return () => {
      performance.mark(`${componentName}-end`);
      performance.measure(
        componentName,
        `${componentName}-start`,
        `${componentName}-end`
      );
      
      const measure = performance.getEntriesByName(componentName)[0];
      if (measure.duration > 16) { // 超過一幀
        console.warn(`${componentName} 渲染時間過長: ${measure.duration}ms`);
      }
    };
  }
  
  static reportWebVitals() {
    if ('web-vital' in window) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log(entry);
          // 發送到分析服務
          analytics.track('web-vitals', {
            name: entry.name,
            value: entry.value,
            rating: entry.rating
          });
        }
      }).observe({ entryTypes: ['web-vital'] });
    }
  }
}
```

## 實施時間表

### 第1-2週：統一組件庫
- [ ] 建立設計系統文檔
- [ ] 統一所有 Button 組件
- [ ] 統一表單組件
- [ ] 清理重複組件
- [ ] 建立組件展示頁面
- [x] **統一 Loading 動畫系統** (2025-06-25 完成)
  - 創建統一 Loading 組件庫 (`/components/ui/loading/`)
  - 實現 LoadingScreen（全頁）、LoadingSpinner（inline）、LoadingButton（按鈕）
  - 更新 Admin Dashboard、Home Page、Access Page 使用統一組件
  - 保留 Login 頁面獨立動畫風格
- [x] **統一 Dialog 顯示系統** (2025-06-25 完成)
  - 創建統一 Dialog 組件庫 (`/components/ui/notification-dialogs.tsx`)
  - 實現 6 種 Dialog 類型：Notification、Success、Error、Warning、Delete、Info
  - 統一淡入淡出動畫效果（200ms 進入，150ms 退出）
  - 保持 Admin 頁面深色主題風格
  - 已遷移組件：
    - Void Pallet 模組：VoidConfirmDialog、BatchVoidConfirmDialog
    - Stock Transfer 模組：KeyboardShortcutsDialog
  - 創建測試頁面 `/test-dialogs` 展示所有 Dialog 組件
  - 建立遷移指南文檔 (`/docs/dialog-migration-summary.md`)
- [x] **清理舊 Widget 系統** (2025-06-25 完成)
  - 移除所有 WidgetSize 相關代碼（enum、配置、resize 功能）
  - 更新 59 個 widget 文件，移除 size 參數
  - Admin Dashboard 已完全使用固定 widget 佈局（gridTemplate + gridArea）
  - 刪除所有響應式 widget 代碼，不再需要調整功能
- [x] **實施動態導航系統** (2025-06-25 完成)
  - 整合 dynamic-action-bar 作為唯一導航系統
  - 移除舊導航欄：Admin Navigation Bar、Stock Take Navigation
  - 導航欄功能：
    - 5 大分類：Print Label、Stock Transfer、Loading Order、Stock Take、Admin
    - 整合 Ask Database 功能
    - Hover 效果（desktop）/ Click 互動（mobile）
    - 半透明背景 + backdrop-blur 效果
  - 用戶資訊顯示：
    - 根據時間顯示歡迎語（Good Morning/Afternoon/Evening）
    - 從 data_id table 獲取用戶名稱和頭像（icon_url）
    - 用戶頭像（支援自定義圖片或名稱首字母）
    - 登出按鈕（hover 時變紅色）
  - 位置：螢幕底部 1%（bottom-[1%]）
  - Mobile view：用戶資訊顯示在頂部 header
- [x] **修復 Ask Database Modal 顯示問題** (2025-06-25 完成)
  - 更新背景為深色（bg-slate-900）
  - 修正邊框和文字顏色以適應深色主題
  - 確保關閉按鈕可見（白色 + hover 效果）
- [x] **建立 Universal Layout System** (2025-06-26 完成)
  - 創建統一佈局系統架構 (`/components/layout/universal/`)
  - 核心組件：
    - UniversalContainer：統一容器組件
    - UniversalGrid：響應式網格系統（向後兼容現有 ResponsiveGrid）
    - UniversalCard：卡片組件（支援主題和動畫）
    - UniversalStack：堆疊佈局
    - UniversalBackground：動態背景系統（支援 starfield、glass、gradient 等）
  - Universal Provider：
    - 全局主題管理（6 個預定義主題：admin、warehouse、production、qc、grn、neutral）
    - 響應式狀態管理
    - 動畫控制
    - 開發模式調試
  - 主題系統：
    - 根據路徑自動切換主題
    - 完整的顏色、效果和樣式系統
    - 支援深色/淺色模式切換（預留接口）
  - 模組重構（100% 向後兼容）：
    - Admin 模組：使用 UniversalWidgetCard 保持現有外觀
    - Stock Transfer 模組：創建 universal-stock-movement-layout
    - Print Label 模組：保留現有 ResponsiveLayout
    - Order Loading 模組：保持現有設計
    - QC/GRN Label 模組：保留現有 ResponsiveLayout
  - 特點：
    - 完全向後兼容，保留所有現有功能
    - 保留 ResponsiveLayout 依賴（符合用戶要求）
    - 漸進式採用策略
    - TypeScript 類型安全
    - 服務端渲染（SSR）支援

### 第3-4週：性能優化（正在進行）
- [ ] 實施虛擬滾動（大型表格優先）
- [x] 基礎動畫性能 - ✅ 已有 Framer Motion + GPU 加速
- [ ] 優化動畫性能（繼續改進）
- [ ] 代碼分割優化
- [ ] 減少 bundle size
- [ ] 實施懶加載策略
- [x] 組件优化 - ✅ 已統一 Loading/Dialog 系統

### 第5-6週：增強移動體驗
- [x] 基礎響應式設計 - ✅ 已有 Tailwind CSS 支援
- [ ] 實施響應式表格（重點優化）
- [ ] 添加手勢支援（滑動操作）
- [x] 觸控友好按鈕 - ✅ 部分已實現（min-h-44px）
- [ ] 優化觸控目標（繼續改進）
- [ ] 改進橫屏體驗
- [ ] 測試各種設備
- [x] 動態導航移動適配 - ✅ 已實現 mobile view

### 第7週：完善無障礙功能（待啟動）
- [ ] 添加 ARIA 標籤
- [ ] 改進顏色對比度
- [x] 部分鍵盤導航 - ✅ 動態導航支援鍵盤操作
- [ ] 完善鍵盤導航（全面）
- [ ] 屏幕閱讀器測試
- [ ] 建立無障礙指南

### 第8週：測試同監控
- [ ] 設置視覺回歸測試
- [ ] 實施性能監控
- [ ] 建立 UI 測試套件
- [ ] 文檔同培訓

## 預期成果

### 用戶體驗改進
- 頁面載入速度提升 40%
- 移動設備操作流暢度提升 60%
- 無障礙評分達到 WCAG 2.1 AA 標準
- 用戶滿意度提升 30%

### 開發效率提升
- 組件重用率提升至 80%
- 新功能開發時間減少 35%
- Bug 數量減少 50%
- 維護成本降低 40%

### 性能指標
- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1

## 風險評估

### 技術風險
- 大規模重構可能引入新 bug
- 性能優化可能影響某些功能
- 跨瀏覽器兼容性問題

### 緩解措施
- 漸進式實施，每階段充分測試
- 保留舊版本作為後備
- 建立完整測試覆蓋
- A/B 測試新舊版本

## 長期維護建議

### 設計系統維護
1. 定期審查組件使用情況
2. 持續更新設計指南
3. 收集用戶反饋
4. 跟進新技術趨勢

### 性能監控
1. 設置自動化性能測試
2. 監控真實用戶指標
3. 定期優化關鍵路徑
4. 建立性能預算

### 無障礙保證
1. 每次發布前進行無障礙測試
2. 培訓開發團隊
3. 建立無障礙檢查清單
4. 定期審計

## 相關資源
- 設計系統文檔：`/docs/design-system/`
- 組件庫：`/components/ui/`
- 性能測試報告：`/test-results/performance/`
- 無障礙指南：`/docs/accessibility/`