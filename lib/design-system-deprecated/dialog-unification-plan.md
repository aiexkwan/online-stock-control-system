# Dialog 組件統一方案

## 現狀分析

根據代碼審計，現有 Dialog 實現包括：
1. **基礎 shadcn/ui dialog** - 基於 Radix UI
2. **unified-dialog** - 統一風格嘅 Dialog
3. **animated-border-dialog** - 帶動畫邊框效果
4. **notification-dialogs-animated** - 通知類型集合
5. **admin-dialog** - Admin 專用
6. **mobile/MobileDialog** - 移動端專用

## 統一方案架構

### 1. 核心 Dialog 組件
```typescript
// components/ui/core/Dialog.tsx
export interface DialogProps {
  // 基礎配置
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  // 類型變體
  variant?: 'default' | 'notification' | 'confirmation' | 'form' | 'fullscreen';

  // 尺寸
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  // 視覺效果
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  showAnimatedBorder?: boolean;

  // 響應式
  mobileFullscreen?: boolean;

  // 語義化
  severity?: 'info' | 'success' | 'warning' | 'error';
}
```

### 2. 預設配置系統
```typescript
// lib/design-system/dialog-presets.ts
export const dialogPresets = {
  // 通知類
  notification: {
    variant: 'notification',
    size: 'sm',
    animation: 'scale',
    showAnimatedBorder: true,
  },

  // 確認類
  confirmation: {
    variant: 'confirmation',
    size: 'sm',
    animation: 'fade',
  },

  // 表單類
  form: {
    variant: 'form',
    size: 'md',
    animation: 'slide',
    mobileFullscreen: true,
  },

  // 報表類
  report: {
    variant: 'fullscreen',
    size: 'xl',
    animation: 'fade',
    mobileFullscreen: true,
  }
};
```

### 3. 統一使用方式
```tsx
// 基礎使用
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>標題</DialogTitle>
    </DialogHeader>
    <DialogBody>內容</DialogBody>
    <DialogFooter>
      <Button>確定</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// 使用預設配置
<Dialog {...dialogPresets.notification} open={open} onOpenChange={setOpen}>
  <DialogContent severity="success">
    <DialogTitle icon={<CheckCircle />}>操作成功</DialogTitle>
    <DialogBody>您的更改已保存</DialogBody>
  </DialogContent>
</Dialog>

// 快捷組件
<NotificationDialog
  open={open}
  onOpenChange={setOpen}
  severity="success"
  title="操作成功"
  message="您的更改已保存"
/>
```

## 遷移計劃

### 第一階段：建立新組件（1週）
1. ✅ 在 `components/ui/core/` 建立新 Dialog 系統
2. ✅ 整合現有功能（動畫、主題、響應式）
3. ✅ 建立預設配置系統
4. ✅ 創建快捷組件（NotificationDialog、ConfirmDialog 等）

### 第二階段：逐步遷移（2週）
1. **高優先級遷移**（影響用戶體驗）
   - notification-dialogs-animated → NotificationDialog
   - 各種 ConfirmDialog → ConfirmDialog

2. **中優先級遷移**（功能組件）
   - 報表 Dialog → 使用 form preset
   - Admin Dialog → 使用統一組件

3. **低優先級遷移**（穩定組件）
   - 其他業務 Dialog

### 第三階段：清理優化（1週）
1. 移除舊組件
2. 更新文檔
3. 性能優化
4. 測試覆蓋

## 技術細節

### 動畫系統
```typescript
// 統一動畫配置
const dialogAnimations = {
  fade: {
    enter: "ease-out duration-300",
    enterFrom: "opacity-0",
    enterTo: "opacity-100",
    leave: "ease-in duration-200",
    leaveFrom: "opacity-100",
    leaveTo: "opacity-0",
  },
  slide: {
    enter: "ease-out duration-300",
    enterFrom: "opacity-0 translate-y-4",
    enterTo: "opacity-100 translate-y-0",
    leave: "ease-in duration-200",
    leaveFrom: "opacity-100 translate-y-0",
    leaveTo: "opacity-0 translate-y-4",
  },
  scale: {
    enter: "ease-out duration-300",
    enterFrom: "opacity-0 scale-95",
    enterTo: "opacity-100 scale-100",
    leave: "ease-in duration-200",
    leaveFrom: "opacity-100 scale-100",
    leaveTo: "opacity-0 scale-95",
  }
};
```

### 響應式處理
```typescript
// 移動端自適應
const useResponsiveDialog = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return {
    size: isMobile ? 'full' : 'md',
    animation: isMobile ? 'slide' : 'fade',
    position: isMobile ? 'bottom' : 'center',
  };
};
```

### 無障礙支持
- 所有 Dialog 包含正確嘅 ARIA 屬性
- 支持鍵盤導航（ESC 關閉、Tab 循環）
- Focus trap 確保焦點唔會離開 Dialog
- 支持屏幕閱讀器

## 預期收益

1. **代碼減少 60%** - 移除重複實現
2. **維護成本降低 70%** - 統一更新位置
3. **一致性提升** - 統一嘅用戶體驗
4. **性能優化** - 減少 bundle size
5. **開發效率提升** - 簡化 API 使用

## 風險控制

1. **漸進式遷移** - 保持向後兼容
2. **充分測試** - 每個階段進行測試
3. **回滾機制** - 保留舊組件至穩定
4. **文檔先行** - 提供遷移指南
