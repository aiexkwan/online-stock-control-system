# Universal Layout System

統一佈局系統 - 為整個應用提供一致的佈局組件和響應式設計。

## 🎯 設計目標

- **100% 向後兼容** - 現有組件無需修改即可使用
- **統一體驗** - 所有模組使用相同的佈局標準
- **響應式優先** - 移動端、平板、桌面完美適配
- **主題支持** - 多套預定義主題，支持自定義
- **性能優化** - 最小重新渲染，高效響應式檢測

## 📦 核心組件

### UniversalContainer

統一容器組件，支援各種佈局模式：

```tsx
import { UniversalContainer } from '@/components/layout/universal';

<UniversalContainer variant='page' background='starfield' padding='lg' maxWidth='7xl'>
  {children}
</UniversalContainer>;
```

### UniversalGrid

響應式網格系統：

```tsx
import { UniversalGrid } from '@/components/layout/universal';

<UniversalGrid preset='qcForm' gap='lg' align='stretch'>
  {children}
</UniversalGrid>;
```

### UniversalCard

統一卡片組件：

```tsx
import { UniversalCard } from '@/components/layout/universal';

<UniversalCard
  variant='form'
  theme='qc'
  title='Quality Control'
  subtitle='Label Generation'
  glass={true}
  glow={true}
>
  {children}
</UniversalCard>;
```

### UniversalStack

堆疊佈局組件：

```tsx
import { UniversalStack } from '@/components/layout/universal';

<UniversalStack direction='responsive' spacing='lg' align='center'>
  {children}
</UniversalStack>;
```

## 🔄 向後兼容性

現有的 ResponsiveLayout 組件完全保持不變的 API：

```tsx
// 現有代碼無需修改
import { ResponsiveLayout, ResponsiveGrid, ResponsiveCard } from '@/components/layout/universal';

<ResponsiveLayout>
  <ResponsiveGrid columns={{ sm: 1, md: 2, lg: 3 }} gap={6}>
    <ResponsiveCard title='Example' padding='lg'>
      Content
    </ResponsiveCard>
  </ResponsiveGrid>
</ResponsiveLayout>;
```

## 🎨 主題系統

預定義主題：

- `admin` - 管理面板 (藍紫色系)
- `warehouse` - 倉庫作業 (綠色系)
- `production` - 生產管理 (橙色系)
- `qc` - 質量控制 (藍色系)
- `grn` - 收貨單據 (紫色系)
- `neutral` - 中性主題 (灰色系)

```tsx
import { UniversalProvider } from '@/components/layout/universal';

<UniversalProvider defaultTheme='admin' animationsEnabled={true}>
  <App />
</UniversalProvider>;
```

## 📱 響應式斷點

與 Tailwind 完全一致：

- `xs`: 475px
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## 🚀 使用指南

### 1. 在根應用中設置 Provider

```tsx
// app/layout.tsx
import { UniversalProvider } from '@/components/layout/universal';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <UniversalProvider defaultTheme='admin'>{children}</UniversalProvider>
      </body>
    </html>
  );
}
```

### 2. 使用 Hook 獲取佈局狀態

```tsx
import { useUniversalLayout, useResponsive } from '@/components/layout/universal';

function MyComponent() {
  const { theme, setTheme } = useUniversalLayout();
  const { isMobile, isTablet } = useResponsive();

  return (
    <div>
      Current theme: {theme.name}
      Device: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}
    </div>
  );
}
```

### 3. 遷移現有組件

現有組件可以漸進式遷移：

**階段 1**: 直接替換 import (零修改)

```tsx
// 從
import { ResponsiveLayout } from '../../components/qc-label-form/ResponsiveLayout';

// 改為
import { ResponsiveLayout } from '@/components/layout/universal';
```

**階段 2**: 使用新的 API (獲得更多功能)

```tsx
// 從
<ResponsiveCard title="Form" padding="lg">

// 改為
<UniversalCard variant="form" theme="qc" title="Form" padding="xl">
```

## 🔧 配置選項

### GRID_PRESETS

預定義網格配置：

- `single` - 單列
- `responsive` - 響應式雙列
- `qcForm` - QC表單專用
- `admin` - 管理面板
- `triple` - 三列
- `quad` - 四列

### THEMES

完整主題配置，包含：

- 顏色方案
- 效果設置 (blur, glow, gradient, animation)
- 文字顏色
- 邊框和陰影

## 🎯 遷移計劃

1. **保留現有系統** - QC/GRN 系統繼續使用現有 API
2. **統一 Admin 系統** - 標準化所有 WidgetCard 使用
3. **逐步遷移其他模組** - 保證零功能丟失

## 📋 檢查清單

遷移前檢查：

- [ ] 現有功能是否完全保留
- [ ] 響應式行為是否一致
- [ ] 動畫效果是否正確
- [ ] 主題色彩是否匹配
- [ ] 性能是否有影響

## 🐛 調試

啟用調試模式：

```tsx
<UniversalProvider debugMode={true}>
  <App />
</UniversalProvider>
```

會在控制台輸出：

- 斷點變化
- 主題切換
- 配置更新
