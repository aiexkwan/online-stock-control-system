# Phase 1: 組件庫統一同優化 - 實施計劃

## 執行摘要

Phase 1 旨在建立統一嘅設計系統同組件庫，解決現有系統嘅組件碎片化問題。預計用時 2 週，將大幅提升代碼質量同開發效率。

## 已完成項目 ✅

### 1. 組件分析
- 識別咗 50+ 個 Dialog 組件散佈喺唔同目錄
- 發現 5+ 個唔同嘅基礎 Dialog 實現
- 確認咗命名不一致同風格分裂問題

### 2. 設計系統建立
- **Design Tokens** (`/lib/design-system/tokens.ts`)
  - 統一顏色系統（基於 HSL）
  - 間距系統（8px 基準）
  - 字體系統
  - 觸控目標大小
  - 動畫配置

### 3. 組件標準制定
- **Component Standards** (`/lib/design-system/component-standards.ts`)
  - 命名規範（PascalCase）
  - 目錄結構標準
  - Props 規範
  - 無障礙要求

### 4. Dialog 統一方案
- **Dialog Unification Plan** (`/lib/design-system/dialog-unification-plan.md`)
  - 核心 Dialog 架構設計
  - 預設配置系統
  - 遷移計劃

### 5. 主題系統統一
- **Theme System** (`/lib/design-system/theme-system.ts`)
  - 統一 Main App 同 Admin 主題
  - CSS 變量生成器
  - Tailwind 整合配置

## 待完成項目 📋

### 第一週：核心實施

#### Day 1-2: 建立核心組件
```typescript
// 需要創建嘅文件
/components/ui/core/
  ├── Dialog/
  │   ├── Dialog.tsx          // 核心 Dialog 組件
  │   ├── DialogPresets.tsx   // 預設配置
  │   ├── NotificationDialog.tsx
  │   ├── ConfirmDialog.tsx
  │   └── index.ts
  ├── Button/
  │   ├── Button.tsx          // 統一 Button 組件
  │   └── index.ts
  └── index.ts
```

#### Day 3-4: 實施主題系統
- 創建 ThemeProvider 組件
- 整合到 layout.tsx
- 更新 globals.css 使用 CSS 變量
- 測試主題切換

#### Day 5: 文檔同示例
- 為每個核心組件添加 JSDoc
- 創建使用示例
- 建立遷移指南

### 第二週：遷移同優化

#### Day 6-7: 高優先級遷移
- 遷移通知類 Dialog
- 遷移確認類 Dialog
- 更新相關業務邏輯

#### Day 8-9: 中優先級遷移
- 遷移報表 Dialog
- 遷移 Admin Dialog
- 性能測試

#### Day 10: 清理同發布
- 標記舊組件為 deprecated
- 更新 import paths
- 發布遷移通知

## 技術實施細節

### 1. 新建核心 Dialog 組件
```tsx
// components/ui/core/Dialog/Dialog.tsx
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { designTokens } from '@/lib/design-system/tokens';
import { dialogPresets } from './DialogPresets';

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  preset?: keyof typeof dialogPresets;
  variant?: 'default' | 'notification' | 'confirmation' | 'form' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  showAnimatedBorder?: boolean;
  mobileFullscreen?: boolean;
  severity?: 'info' | 'success' | 'warning' | 'error';
  children?: React.ReactNode;
}

/**
 * 統一嘅 Dialog 組件
 * 
 * @example
 * // 基礎用法
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <DialogContent>內容</DialogContent>
 * </Dialog>
 * 
 * // 使用預設
 * <Dialog preset="notification" open={open} onOpenChange={setOpen}>
 *   <DialogContent>通知內容</DialogContent>
 * </Dialog>
 */
export const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ preset, ...props }, ref) => {
    const config = preset ? dialogPresets[preset] : {};
    return <DialogPrimitive.Root {...config} {...props} />;
  }
);

Dialog.displayName = 'Dialog';
```

### 2. 遷移策略

#### 階段性遷移
1. **Phase 1**: 創建新組件，保持舊組件運作
2. **Phase 2**: 逐步替換使用，添加 deprecation 警告
3. **Phase 3**: 完全移除舊組件

#### 向後兼容
```tsx
// 臨時兼容層
export { Dialog as UnifiedDialog } from '@/components/ui/core/Dialog';
export { Dialog as LegacyDialog } from '@/components/ui/dialog';
```

### 3. 測試計劃

#### 單元測試
- 測試所有 props 組合
- 測試響應式行為
- 測試無障礙功能

#### 視覺測試
- Storybook stories
- 截圖對比測試
- 跨瀏覽器測試

#### 性能測試
- Bundle size 分析
- 渲染性能測試
- 內存洩漏檢查

## 風險管理

### 潛在風險
1. **破壞現有功能** - 通過充分測試緩解
2. **開發延誤** - 預留 20% buffer time
3. **用戶抗拒改變** - 提供詳細遷移文檔

### 回滾計劃
- Git branch 保護
- Feature flag 控制
- 保留舊組件 30 天

## 成功指標

### 量化指標
- ✅ Dialog 組件數量減少 80%（50+ → 10）
- ✅ Bundle size 減少 30%
- ✅ 組件重用率提升至 85%
- ✅ TypeScript 覆蓋率 100%

### 質化指標
- ✅ 開發者滿意度提升
- ✅ UI 一致性改善
- ✅ 維護成本降低

## 後續計劃

### Phase 1.5: 組件庫擴展（第3週）
- Table 組件統一
- Form 組件統一
- Navigation 組件統一

### Phase 2: 性能優化（第4-5週）
- 虛擬滾動擴展
- Bundle 優化
- 動畫性能提升

## 相關文檔
- [系統 UI 改進計劃](./systemUI.md)
- [設計系統 Tokens](/lib/design-system/tokens.ts)
- [組件標準規範](/lib/design-system/component-standards.ts)
- [Dialog 統一方案](/lib/design-system/dialog-unification-plan.md)
- [主題系統](/lib/design-system/theme-system.ts)