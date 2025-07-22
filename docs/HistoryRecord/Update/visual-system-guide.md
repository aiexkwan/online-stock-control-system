# 統一視覺系統使用指南

## 概述

統一視覺系統為 NewPennine Stock Control System 提供一致的視覺體驗，包括：
- 單例 WebGL 星空背景
- 標準化玻璃態效果
- 統一邊框樣式
- 智能底部導航欄

## 快速開始

### 1. 基本設置

系統已在 `app/layout.tsx` 中全局配置，無需額外設置即可享受統一背景效果。

### 2. 使用玻璃態卡片

```tsx
import { GlassCard, StrongGlassCard, LightGlassCard } from '@/app/components/visual-system';

// 標準玻璃態
<GlassCard className="p-6">
  <h2>標題</h2>
  <p>內容</p>
</GlassCard>

// 強效果玻璃態
<StrongGlassCard hover className="p-6">
  <h2>重要內容</h2>
</StrongGlassCard>

// 輕效果玻璃態
<LightGlassCard className="p-4">
  <p>次要內容</p>
</LightGlassCard>
```

### 3. 邊框效果

```tsx
import { BorderContainer, PulseBorder, NeonBorder } from '@/app/components/visual-system';

// 基本邊框容器
<BorderContainer variant="subtle">
  <div>內容</div>
</BorderContainer>

// 脈衝邊框（吸引注意力）
<PulseBorder color="rgba(0, 255, 255, 0.5)" duration={2}>
  <GlassCard>重要提示</GlassCard>
</PulseBorder>

// 霓虹邊框（強調效果）
<NeonBorder color="#ff00ff" intensity={1.5}>
  <div>特殊內容</div>
</NeonBorder>
```

### 4. 智能底部導航欄

```tsx
import { SmartBottomNav, NavItem, BottomNavSpacer } from '@/app/components/visual-system';

// 在頁面底部添加導航欄
<SmartBottomNav>
  <NavItem icon="🏠" label="Home" href="/" />
  <NavItem icon="📊" label="Dashboard" href="/admin" isActive />
  <NavItem icon="📦" label="Inventory" href="/inventory" />
  <NavItem icon="⚙️" label="Settings" href="/settings" />
</SmartBottomNav>

// 在內容底部添加間距，防止被導航欄遮擋
<BottomNavSpacer />
```

## 高級功能

### 1. 使用視覺效果 Hook

```tsx
import { useVisualEffects } from '@/app/components/visual-system';

function MyComponent() {
  const {
    animationsEnabled,
    toggleStarfield,
    toggleGlassmorphism,
    getGlassmorphicStyles,
  } = useVisualEffects();

  // 獲取自定義玻璃態樣式
  const customGlassStyles = getGlassmorphicStyles('strong');

  return (
    <div style={customGlassStyles}>
      {/* 內容 */}
    </div>
  );
}
```

### 2. 性能監控

```tsx
import { usePerformanceMonitor } from '@/app/components/visual-system';

function PerformanceDisplay() {
  const { fps, memory, performanceTier } = usePerformanceMonitor();

  return (
    <div>
      <p>FPS: {fps}</p>
      <p>Memory: {memory}MB</p>
      <p>Performance: {performanceTier}</p>
    </div>
  );
}
```

### 3. 組合效果

```tsx
import { GlassBorderContainer } from '@/app/components/visual-system';

// 結合玻璃態和邊框效果
<GlassBorderContainer 
  glassVariant="strong" 
  borderVariant="glow"
  className="p-8"
>
  <h2>組合效果展示</h2>
</GlassBorderContainer>
```

## 配置選項

### 視覺配置 (`visual-config.ts`)

- **星空背景**: 密度、亮度、動畫速度
- **玻璃態效果**: 模糊強度、透明度、邊框樣式
- **容器邊框**: none、subtle、glow、gradient
- **底部導航欄**: 顯示規則、動畫設置

### 性能配置 (`performance-config.ts`)

- **WebGL 優化**: 單例模式、暫停渲染
- **設備檢測**: GPU 分級、移動設備優化
- **降級策略**: 低性能自動降級

## 最佳實踐

1. **保持一致性**: 使用預設的變體而非自定義樣式
2. **性能優先**: 在低端設備上考慮禁用動畫
3. **可訪問性**: 確保內容在各種背景下可讀
4. **漸進增強**: 提供降級方案給不支持 WebGL 的瀏覽器

## 常見問題

### Q: 如何在特定頁面禁用背景？
A: 使用 `useVisualSystem` hook 的 `actions.setStarfieldEnabled(false)`

### Q: 如何自定義玻璃態效果？
A: 使用 `GlassmorphicCard` 組件的 `variant` 屬性，或通過 `useVisualEffects` 獲取樣式

### Q: 底部導航欄在某些頁面不顯示？
A: 檢查 `visual-config.ts` 中的 `hiddenPaths` 配置

### Q: 性能問題如何處理？
A: 系統會自動根據設備性能降級，也可手動調整 `performanceTier`

## 範例頁面

訪問 `/visual-system-demo` 查看所有組件和效果的實際展示。