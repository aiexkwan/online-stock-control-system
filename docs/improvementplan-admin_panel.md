# 管理儀表板改進計劃（基於實際代碼分析）

## 概述
基於最新代碼分析，管理儀表板位於`/app/admin/`，目前主要使用 Gridstack.js (v12.2.1) 作為網格系統，但仍有舊版 react-grid-layout (v1.5.1) 組件存在。系統最近進行咗更新，修復咗編輯模式嘅拖拽問題，但仍存在多個技術債務需要解決。

## 現有系統實際架構

### 核心組件結構
```
app/admin/
├── page.tsx                              # Server component wrapper
├── components/
│   ├── AdminPageClient.tsx               # 主客戶端組件（已更新）
│   ├── dashboard/
│   │   ├── GridstackDashboardImproved.tsx # Gridstack 實現（主要使用）
│   │   ├── EnhancedDashboard.tsx         # react-grid-layout 實現（待移除）
│   │   ├── WidgetRegistry.tsx            # Widget 註冊中心
│   │   ├── registerAdminWidgets.ts       # Widget 註冊
│   │   └── widgets/                      # 各種 widget 組件
│   └── EditDashboardButton.tsx           # 編輯模式控制
├── contexts/
│   └── AdminRefreshContext.tsx           # 刷新狀態管理
├── services/
│   └── adminDashboardSettingsService.ts  # 儀表板設定儲存
└── styles/
    ├── gridstack-custom.css              # Gridstack 自定義樣式
    └── gridstack-double-layer-fix.css    # 雙層渲染修復
```

### 發現嘅問題

#### 1. 兩個網格系統並存
```typescript
// GridstackDashboardImproved.tsx 使用 Gridstack（主要）
import 'gridstack/dist/gridstack.min.css';
const options = {
  column: 15,          // 15列系統
  cellHeight: 108,     // 固定格子高度
  margin: 16,
  animate: true,
  float: false
};

// EnhancedDashboard.tsx 使用 react-grid-layout（待移除）
import 'react-grid-layout/css/styles.css';
cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}  // 不同列數
```

#### 2. Widget 尺寸系統不一致
```typescript
// 現有尺寸定義（types/dashboard.ts）
export const WidgetSizeConfig = {
  [WidgetSize.SMALL]: { w: 1, h: 1 },    // 太細，實際使用有問題
  [WidgetSize.MEDIUM]: { w: 3, h: 3 },
  [WidgetSize.LARGE]: { w: 5, h: 5 },
  [WidgetSize.XLARGE]: { w: 6, h: 6 }
};

// AdminPageClient.tsx 中嘅修復邏輯
if (!widgetWidth || !widgetHeight || widgetWidth === 1 || widgetHeight === 1) {
  // 1x1 被視為錯誤值需要修正
}
```

#### 3. 編輯模式最近修復但仍有改進空間
```typescript
// GridstackDashboardImproved.tsx 最新修復
useEffect(() => {
  if (gridInstance.current && isInitialized) {
    if (isEditMode) {
      gridInstance.current.enable();
      // 仍需要 setTimeout 確保 DOM 更新
      setTimeout(() => {
        const widgets = gridRef.current?.querySelectorAll('.grid-stack-item');
        widgets?.forEach(widget => {
          gridInstance.current.movable(widget, true);
          gridInstance.current.resizable(widget, true);
        });
      }, 100);
    }
  }
}, [isEditMode, isInitialized]);
```

#### 4. React 18 StrictMode 導致嘅問題
```typescript
// Widget 雙層渲染清理
widgetRootsRef.current.forEach((root, id) => {
  try {
    root.unmount();  // 需要正確清理 React roots
  } catch (e) {
    console.warn('Error unmounting widget:', e);
  }
});
```

#### 5. 性能同維護問題
- 多個 CSS 修復文件
- Widget 註冊分散
- 缺少統一嘅錯誤處理
- 響應式設計需要改進

## 改進方案

### 第一階段：清理遺留代碼（1週）

#### 1.1 移除 react-grid-layout
```bash
# 移除步驟
1. 刪除 EnhancedDashboard.tsx 同相關組件
2. 移除 package.json 中嘅 react-grid-layout 依賴
3. 清理相關 CSS imports
4. 更新 WidgetRegistry 移除舊版支援
```

#### 1.2 統一 Widget 包裝器
```typescript
// app/admin/components/dashboard/UnifiedWidgetWrapper.tsx
export function UnifiedWidgetWrapper({ 
  widget, 
  isEditMode, 
  onRemove, 
  onUpdate 
}: WidgetWrapperProps) {
  const [error, setError] = useState<Error | null>(null);
  
  if (error) {
    return <WidgetErrorBoundary error={error} widgetId={widget.id} />;
  }
  
  return (
    <div className="widget-wrapper h-full w-full">
      {isEditMode && (
        <div className="widget-controls">
          <button onClick={onRemove} className="remove-btn">×</button>
          <span className="size-indicator">
            {widget.gridProps?.w} × {widget.gridProps?.h}
          </span>
        </div>
      )}
      <ErrorBoundary onError={setError}>
        <WidgetContent widget={widget} />
      </ErrorBoundary>
    </div>
  );
}
```

### 第二階段：優化 Gridstack 實現（2週）

#### 2.1 改進尺寸系統
```typescript
// 更實用嘅尺寸定義
export const IMPROVED_WIDGET_SIZES = {
  SMALL: { w: 3, h: 2, minW: 2, minH: 2, maxW: 4, maxH: 3 },
  MEDIUM: { w: 5, h: 3, minW: 4, minH: 3, maxW: 6, maxH: 4 },
  LARGE: { w: 8, h: 5, minW: 6, minH: 4, maxW: 10, maxH: 6 },
  XLARGE: { w: 10, h: 6, minW: 8, minH: 5, maxW: 15, maxH: 8 },
  TALL: { w: 4, h: 6, minW: 3, minH: 5, maxW: 5, maxH: 8 },
  WIDE: { w: 10, h: 3, minW: 8, minH: 2, maxW: 15, maxH: 4 }
};

// 自動調整到最接近嘅有效尺寸
export function normalizeWidgetSize(current: GridProps): WidgetSize {
  const sizes = Object.entries(IMPROVED_WIDGET_SIZES);
  let closestSize = WidgetSize.MEDIUM;
  let minDiff = Infinity;
  
  sizes.forEach(([size, config]) => {
    const diff = Math.abs(current.w - config.w) + Math.abs(current.h - config.h);
    if (diff < minDiff) {
      minDiff = diff;
      closestSize = size as WidgetSize;
    }
  });
  
  return closestSize;
}
```

#### 2.2 改進編輯模式體驗
```typescript
// 使用 MutationObserver 替代 setTimeout
export function useEditModeSync(
  gridInstance: GridStack | null,
  isEditMode: boolean
) {
  useEffect(() => {
    if (!gridInstance) return;
    
    if (isEditMode) {
      gridInstance.enable();
      
      const observer = new MutationObserver(() => {
        const widgets = document.querySelectorAll('.grid-stack-item');
        if (widgets.length > 0) {
          widgets.forEach(widget => {
            gridInstance.movable(widget as HTMLElement, true);
            gridInstance.resizable(widget as HTMLElement, true);
          });
          observer.disconnect();
        }
      });
      
      const container = document.querySelector('.grid-stack');
      if (container) {
        observer.observe(container, {
          childList: true,
          subtree: true
        });
      }
      
      return () => observer.disconnect();
    } else {
      gridInstance.disable();
    }
  }, [gridInstance, isEditMode]);
}
```

#### 2.3 統一 CSS 架構
```css
/* app/admin/styles/unified-dashboard.css */
/* 取代所有分散嘅 CSS 文件 */

:root {
  --grid-gap: 16px;
  --widget-radius: 12px;
  --widget-bg: rgba(30, 41, 59, 0.8);
  --widget-border: rgba(148, 163, 184, 0.1);
  --widget-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.grid-stack {
  /* 基礎網格樣式 */
}

.grid-stack-item {
  /* Widget 容器樣式 */
  background: var(--widget-bg);
  border: 1px solid var(--widget-border);
  border-radius: var(--widget-radius);
  box-shadow: var(--widget-shadow);
  backdrop-filter: blur(12px);
  transition: all 0.3s ease;
}

.grid-stack-item.ui-draggable-dragging {
  /* 拖動時樣式 */
  opacity: 0.8;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.grid-stack-item.ui-resizable-resizing {
  /* 調整大小時樣式 */
  opacity: 0.7;
  border-color: rgb(59, 130, 246);
}
```

### 第三階段：性能優化（1週）

#### 3.1 Widget 懶加載
```typescript
// app/admin/components/dashboard/LazyWidgetLoader.tsx
const WidgetComponents = {
  OUTPUT_STATS: lazy(() => import('./widgets/OutputStatsWidget')),
  ACO_PROGRESS: lazy(() => import('./widgets/AcoProgressWidget')),
  CHART: lazy(() => import('./widgets/ChartWidget')),
  // ... 其他 widgets
};

export function LazyWidgetLoader({ widget }: { widget: WidgetConfig }) {
  const Component = WidgetComponents[widget.type];
  
  if (!Component) {
    return <div>Unknown widget type: {widget.type}</div>;
  }
  
  return (
    <Suspense fallback={<WidgetSkeleton type={widget.type} />}>
      <Component {...widget} />
    </Suspense>
  );
}
```

#### 3.2 優化重渲染
```typescript
// 使用 React.memo 同 useMemo 優化
export const OptimizedWidget = React.memo(({ 
  widget, 
  isEditMode 
}: WidgetProps) => {
  const widgetContent = useMemo(() => {
    return <WidgetContent widget={widget} />;
  }, [widget.id, widget.type, widget.config]);
  
  return (
    <div className="optimized-widget">
      {widgetContent}
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定義比較邏輯
  return (
    prevProps.widget.id === nextProps.widget.id &&
    prevProps.widget.config === nextProps.widget.config &&
    prevProps.isEditMode === nextProps.isEditMode
  );
});
```

### 第四階段：功能增強（1週）

#### 4.1 Widget 模板系統
```typescript
// app/admin/templates/dashboardTemplates.ts
export const DASHBOARD_TEMPLATES = {
  OPERATIONS: {
    name: '營運監控儀表板',
    description: '實時監控生產同訂單狀態',
    widgets: [
      { type: 'OUTPUT_STATS', position: { x: 0, y: 0 }, size: 'MEDIUM' },
      { type: 'ACO_PROGRESS', position: { x: 5, y: 0 }, size: 'LARGE' },
      { type: 'RECENT_ACTIVITY', position: { x: 0, y: 3 }, size: 'WIDE' },
      { type: 'INVENTORY_LEVELS', position: { x: 10, y: 3 }, size: 'TALL' }
    ]
  },
  ANALYTICS: {
    name: '數據分析儀表板',
    description: '深入分析業務數據趨勢',
    widgets: [
      { type: 'PRODUCT_MIX_CHART', position: { x: 0, y: 0 }, size: 'XLARGE' },
      { type: 'TREND_ANALYSIS', position: { x: 10, y: 0 }, size: 'TALL' },
      { type: 'KPI_METRICS', position: { x: 0, y: 6 }, size: 'WIDE' }
    ]
  }
};

// 應用模板
export function applyDashboardTemplate(
  templateId: keyof typeof DASHBOARD_TEMPLATES
): DashboardLayout {
  const template = DASHBOARD_TEMPLATES[templateId];
  return {
    widgets: template.widgets.map(w => ({
      id: `${w.type}-${Date.now()}`,
      type: w.type as WidgetType,
      gridProps: {
        x: w.position.x,
        y: w.position.y,
        ...IMPROVED_WIDGET_SIZES[w.size]
      },
      config: {
        size: w.size,
        refreshInterval: 60000
      }
    }))
  };
}
```

#### 4.2 響應式改進
```typescript
// 智能響應式佈局調整
export function useResponsiveLayout() {
  const [breakpoint, setBreakpoint] = useState('lg');
  
  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1200) setBreakpoint('lg');
      else if (width >= 768) setBreakpoint('md');
      else setBreakpoint('sm');
    };
    
    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);
  
  const adjustLayoutForBreakpoint = useCallback((layout: DashboardLayout) => {
    if (breakpoint === 'sm') {
      // 手機版：所有 widgets 變成全寬
      return {
        widgets: layout.widgets.map(w => ({
          ...w,
          gridProps: {
            ...w.gridProps,
            x: 0,
            w: 15,  // 全寬
            h: Math.min(w.gridProps.h, 4)  // 限制高度
          }
        }))
      };
    }
    return layout;
  }, [breakpoint]);
  
  return { breakpoint, adjustLayoutForBreakpoint };
}
```

## 實施時間表

### 第1週：清理遺留代碼
- [ ] 移除 react-grid-layout 依賴同組件
- [ ] 統一 Widget 包裝器架構
- [ ] 清理冗餘 CSS 文件
- [ ] 建立統一錯誤處理

### 第2-3週：優化 Gridstack
- [ ] 實施改進嘅尺寸系統
- [ ] 優化編輯模式體驗
- [ ] 統一 CSS 架構
- [ ] 修復已知嘅渲染問題

### 第4週：性能優化
- [ ] 實施 Widget 懶加載
- [ ] 優化重渲染邏輯
- [ ] 添加性能監控
- [ ] 實施緩存策略

### 第5週：功能增強
- [ ] 添加模板系統
- [ ] 改進響應式設計
- [ ] 增強用戶體驗
- [ ] 完善文檔

## 預期成果

### 技術改進
- 統一網格系統：從 2 個減至 1 個
- 代碼量：減少約 25%
- 維護性：顯著提升
- 性能：首屏加載時間減少 40%

### 用戶體驗
- 編輯模式：流暢無延遲
- Widget 操作：即時響應
- 響應式：完美適配所有設備
- 錯誤處理：優雅降級

### 系統穩定性
- 消除雙層渲染問題
- 統一狀態管理
- 完善錯誤恢復機制
- 減少內存洩漏風險

## 風險評估

### 技術風險
- 移除 react-grid-layout 可能影響現有佈局
- Gridstack 版本升級可能有兼容性問題
- 大量 widgets 性能需要持續優化

### 緩解措施
- 分階段實施，充分測試每個階段
- 保留舊版本備份
- 建立完整測試套件
- 準備回滾方案

## 維護建議

### 開發規範
1. 所有新 widgets 必須遵循統一架構
2. 使用 TypeScript 嚴格類型
3. 遵循性能最佳實踐
4. 保持文檔同步更新

### 監控指標
- Widget 加載時間
- 用戶交互延遲
- 內存使用趨勢
- 錯誤發生率

## 相關資源
- Gridstack 官方文檔：https://gridstackjs.com/
- 現有代碼：`/app/admin/`
- 類型定義：`/app/types/dashboard.ts`
- Widget 實現：`/app/admin/components/dashboard/widgets/`