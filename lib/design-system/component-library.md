# NewPennine Design System Component Library

## 概述

NewPennine 設計系統為整個應用提供一致的視覺語言和用戶體驗。本文檔詳細說明了設計系統的使用方法和最佳實踐。

## 1. 色彩系統 (Color System)

### 品牌色 (Brand Colors)

```typescript
import { brandColors, getWidgetCategoryColor } from '@/lib/design-system';

// 主色調 - 橙色
<div className="bg-orange-500 text-white">
  Primary Brand Color
</div>

// 次要色調 - 藍色  
<div className="bg-blue-500 text-white">
  Secondary Brand Color
</div>
```

### Widget 類別色彩

每個 Widget 類別都有統一的配色方案：

```typescript
// Stats Widgets - 藍色系
const statsGradient = getWidgetCategoryColor('stats', 'gradient');
// 結果: 'from-blue-500 to-cyan-500'

// Lists Widgets - 紫色系
const listsGradient = getWidgetCategoryColor('lists', 'gradient');
// 結果: 'from-purple-500 to-pink-500'

// Upload Widgets - 綠色系
const uploadGradient = getWidgetCategoryColor('uploads', 'gradient');
// 結果: 'from-green-500 to-emerald-500'
```

### 語義色彩 (Semantic Colors)

```typescript
import { semanticColors, getSemanticColorClass } from '@/lib/design-system';

// 成功狀態
<div className={getSemanticColorClass('success', 'bg')}>
  Success message
</div>

// 錯誤狀態
<div className={getSemanticColorClass('error', 'border')}>
  Error message
</div>
```

## 2. 字體系統 (Typography System)

### 標題層級

```typescript
import { textClasses, getTextClass } from '@/lib/design-system';

// 使用預設類名
<h1 className={textClasses.h1}>Main Heading</h1>
<h2 className={textClasses.h2}>Section Heading</h2>
<p className={textClasses['body-base']}>Body text content</p>

// 使用輔助函數
<h3 className={getTextClass('h3')}>Subsection</h3>
```

### Widget 專用文字樣式

```typescript
// Widget 標題
<h3 className={textClasses['widget-title']}>
  Order Upload History
</h3>

// Widget 副標題
<p className={textClasses['widget-subtitle']}>
  Last 7 days activity
</p>

// Widget 數值
<div className={textClasses['widget-metric']}>
  1,234
</div>
```

## 3. 間距系統 (Spacing System)

### 8px 網格系統

所有間距都基於 8px 的倍數：

```typescript
import { spacing, widgetSpacing } from '@/lib/design-system';

// Widget 容器
<div className="p-4"> {/* 16px padding */}
  <h3 className="mb-4">Title</h3> {/* 16px margin bottom */}
  <div className="space-y-2"> {/* 8px gap between items */}
    {/* Content */}
  </div>
</div>
```

### 響應式間距

```typescript
import { spacingUtilities } from '@/lib/design-system';

// 響應式容器
<div className={spacingUtilities.container.base}>
  {/* 手機: 16px, 平板: 24px, 桌面: 32px */}
</div>

// Widget 間距
<div className={spacingUtilities.widget.container}>
  {/* 統一的 widget 內部間距 */}
</div>
```

## 4. 組件模式 (Component Patterns)

### Widget 容器

```tsx
import { widgetColors, widgetSpacing, textClasses } from '@/lib/design-system';

const WidgetContainer: React.FC<{ title: string; category: string }> = ({
  title,
  category,
  children
}) => {
  const gradient = getWidgetCategoryColor(category, 'gradient');

  return (
    <div className="rounded-lg bg-slate-800/50 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className={textClasses['widget-title']}>{title}</h3>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};
```

### 統計卡片

```tsx
const StatCard: React.FC<{ label: string; value: number }> = ({
  label,
  value
}) => {
  return (
    <div className="bg-slate-900/50 rounded-lg p-4">
      <p className={textClasses['label-base'] + ' text-gray-400'}>
        {label}
      </p>
      <p className={textClasses['widget-metric'] + ' text-white mt-1'}>
        {value.toLocaleString()}
      </p>
    </div>
  );
};
```

### 列表項目

```tsx
const ListItem: React.FC<{ item: any }> = ({ item }) => {
  return (
    <div className={`
      flex items-center justify-between
      ${spacingUtilities.list.item}
      hover:bg-gray-700/50 rounded transition-colors
    `}>
      <span className={textClasses['body-base']}>
        {item.name}
      </span>
      <span className={textClasses['label-small'] + ' text-gray-400'}>
        {item.status}
      </span>
    </div>
  );
};
```

## 5. 圖表色彩 (Chart Colors)

```typescript
import { getChartColor, chartColors } from '@/lib/design-system';

// 獲取圖表顏色
const lineColors = chartColors.primary.map((color, index) => ({
  dataKey: `series${index}`,
  stroke: color,
}));

// 動態獲取顏色
const color = getChartColor(index); // 自動循環使用顏色
```

## 6. 深色模式支持

所有組件都應該支持深色模式：

```tsx
import { backgrounds, textColors } from '@/lib/design-system';

// 自適應背景和文字
<div className="bg-white dark:bg-slate-900">
  <p className="text-gray-900 dark:text-white">
    Adaptive content
  </p>
</div>
```

## 7. 最佳實踐

### DO ✅

1. **保持一致性** - 使用設計系統提供的預設值
2. **遵循 8px 網格** - 所有間距使用 8 的倍數
3. **使用語義色彩** - 狀態使用對應的語義色
4. **響應式設計** - 考慮不同設備的顯示效果

### DON'T ❌

1. **避免自定義色彩** - 除非有特殊需求
2. **不要混用間距系統** - 統一使用設計系統的間距
3. **避免硬編碼數值** - 使用變量和常量
4. **不要忽略深色模式** - 確保所有組件支持

## 8. 遷移指南

### 現有組件遷移步驟

1. **替換顏色**
   ```tsx
   // 舊代碼
   <div className="bg-blue-600">

   // 新代碼
   <div className={`bg-gradient-to-br ${widgetColors.stats.gradient}`}>
   ```

2. **統一文字樣式**
   ```tsx
   // 舊代碼
   <h3 className="text-lg font-semibold">

   // 新代碼
   <h3 className={textClasses['widget-title']}>
   ```

3. **規範間距**
   ```tsx
   // 舊代碼
   <div className="p-3 mb-5">

   // 新代碼
   <div className="p-4 mb-6"> {/* 使用 8px 倍數 */}
   ```

## 9. CSS 變量使用

在全局樣式中導入設計系統變量：

```css
/* globals.css */
@import '@/lib/design-system/variables.css';

/* 使用 CSS 變量 */
.custom-component {
  padding: var(--spacing-base);
  color: var(--text-primary);
  border-radius: var(--radius-lg);
}
```

## 10. 工具函數

```typescript
import {
  getSpacing,
  calculateGridSpacing,
  combineTextClasses,
  getResponsiveSpacing
} from '@/lib/design-system';

// 計算間距
const customSpacing = calculateGridSpacing(3); // 24px

// 組合文字類
const headingClasses = combineTextClasses('h2', 'uppercase');

// 響應式間距
const responsivePadding = getResponsiveSpacing(4, 6, 8);
// 結果: 'p-4 md:p-6 lg:p-8'
```

---

## 結語

NewPennine 設計系統旨在提供一致、可維護和可擴展的用戶界面。通過遵循這些指南，我們可以確保整個應用的視覺一致性和優秀的用戶體驗。

如有任何問題或建議，請聯繫開發團隊。
