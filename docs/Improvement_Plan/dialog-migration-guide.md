# Dialog 組件遷移指南

## 概述

本指南幫助開發者將現有嘅 Dialog 組件遷移到新嘅統一 Dialog 系統。新系統提供更一致嘅 API、更好嘅性能同更豐富嘅功能。

## 遷移步驟

### 1. 更新 Import 路徑

#### 舊代碼
```tsx
// 各種唔同嘅 import
import { Dialog } from '@/components/ui/dialog';
import { UnifiedDialog } from '@/components/ui/unified-dialog';
import { NotificationDialog } from '@/components/ui/notification-dialogs-animated';
import { AnimatedDialog } from '@/components/ui/animated-border-dialog';
```

#### 新代碼
```tsx
// 統一從 core/Dialog 導入
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  NotificationDialog,
  ConfirmDialog 
} from '@/components/ui/core/Dialog';
```

### 2. 基礎 Dialog 遷移

#### 舊代碼
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>編輯資料</DialogTitle>
      <DialogDescription>
        修改您的資料，完成後點擊保存。
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {/* 內容 */}
    </div>
    <DialogFooter>
      <Button onClick={() => setOpen(false)}>取消</Button>
      <Button onClick={handleSave}>保存</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 新代碼
```tsx
import { Dialog, DialogBody } from '@/components/ui/core/Dialog';

<Dialog 
  open={open} 
  onOpenChange={setOpen}
  size="md"  // 新增：尺寸控制
>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>編輯資料</DialogTitle>
      <DialogDescription>
        修改您的資料，完成後點擊保存。
      </DialogDescription>
    </DialogHeader>
    <DialogBody> {/* 新增：使用 DialogBody 包裹內容 */}
      {/* 內容 */}
    </DialogBody>
    <DialogFooter>
      <Button onClick={() => setOpen(false)}>取消</Button>
      <Button onClick={handleSave}>保存</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 3. 通知 Dialog 遷移

#### 舊代碼
```tsx
// 使用 notification-dialogs-animated
<NotificationDialog
  isOpen={showNotification}
  onOpenChange={setShowNotification}
  title="操作成功"
  message="您的資料已成功保存。"
  onConfirm={() => setShowNotification(false)}
/>

// 或使用自定義實現
<AnimatedDialog open={open} onOpenChange={setOpen}>
  <AnimatedDialogContent type="success">
    <DialogHeader>
      <DialogTitle icon={<CheckCircle />}>成功</DialogTitle>
    </DialogHeader>
    {/* ... */}
  </AnimatedDialogContent>
</AnimatedDialog>
```

#### 新代碼
```tsx
// 使用新嘅 NotificationDialog
<NotificationDialog
  open={showNotification}
  onOpenChange={setShowNotification}
  severity="success"  // 新增：語義化類型
  title="操作成功"
  message="您的資料已成功保存。"
  autoClose           // 新增：自動關閉
  autoCloseDelay={3000}
/>

// 或使用快捷組件
<SuccessDialog
  open={showSuccess}
  onOpenChange={setShowSuccess}
  message="操作成功完成！"
/>
```

### 4. 確認 Dialog 遷移

#### 舊代碼
```tsx
// 各種自定義確認 Dialog
<Dialog open={showConfirm} onOpenChange={setShowConfirm}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>確認刪除</DialogTitle>
    </DialogHeader>
    <DialogDescription>
      您確定要刪除這條記錄嗎？
    </DialogDescription>
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowConfirm(false)}>
        取消
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        刪除
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 新代碼
```tsx
// 使用統一嘅 ConfirmDialog
<ConfirmDialog
  open={showConfirm}
  onOpenChange={setShowConfirm}
  title="確認刪除"
  message="您確定要刪除這條記錄嗎？此操作無法撤銷。"
  isDestructive
  onConfirm={handleDelete}
  isLoading={isDeleting}  // 新增：加載狀態
  loadingText="刪除中..."
/>

// 或使用快捷組件
<DeleteConfirmDialog
  open={showDelete}
  onOpenChange={setShowDelete}
  itemName="訂單 #12345"
  onConfirm={handleDelete}
/>
```

### 5. 使用預設配置

新系統提供預設配置，簡化常見用例：

```tsx
import { dialogPresets, mergeDialogProps } from '@/components/ui/core/Dialog';

// 使用預設配置
<Dialog {...dialogPresets.form} open={open} onOpenChange={setOpen}>
  <DialogContent>
    {/* 表單內容 */}
  </DialogContent>
</Dialog>

// 合併預設配置同自定義 props
<Dialog 
  {...mergeDialogProps('notification', {
    severity: 'warning',
    showAnimatedBorder: false
  })}
  open={open} 
  onOpenChange={setOpen}
>
  {/* 內容 */}
</Dialog>
```

### 6. Admin Dialog 遷移

#### 舊代碼
```tsx
// Admin 專用 Dialog
import { AdminDialog } from '@/app/admin/components/ui/admin-dialog';

<AdminDialog
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Admin 設置"
>
  {/* 內容 */}
</AdminDialog>
```

#### 新代碼
```tsx
// 使用統一 Dialog，主題會自動應用
<Dialog
  open={open}
  onOpenChange={setOpen}
  size="lg"
  showAnimatedBorder  // Admin 風格動畫邊框
>
  <DialogContent>
    <DialogHeader>
      <DialogTitle icon={<Settings />}>Admin 設置</DialogTitle>
    </DialogHeader>
    {/* 內容 */}
  </DialogContent>
</Dialog>
```

## 新功能特性

### 1. 響應式支援
```tsx
<Dialog
  open={open}
  onOpenChange={setOpen}
  mobileFullscreen  // 移動端自動全屏
>
  {/* 內容 */}
</Dialog>
```

### 2. 動畫控制
```tsx
<Dialog
  open={open}
  onOpenChange={setOpen}
  animation="slide"  // fade | slide | scale | none
>
  {/* 內容 */}
</Dialog>
```

### 3. 語義化嚴重程度
```tsx
<Dialog
  open={open}
  onOpenChange={setOpen}
  severity="error"  // info | success | warning | error
>
  {/* 內容會自動應用相應顏色主題 */}
</Dialog>
```

### 4. 動畫邊框
```tsx
<DialogContent showAnimatedBorder>
  {/* 會顯示流光動畫邊框效果 */}
</DialogContent>
```

## 類型定義更新

新系統提供完整嘅 TypeScript 類型支援：

```tsx
import type { 
  DialogProps,
  DialogContentProps,
  NotificationDialogProps,
  ConfirmDialogProps 
} from '@/components/ui/core/Dialog';

// 自定義組件
interface MyDialogProps extends DialogProps {
  customProp?: string;
}

const MyDialog: React.FC<MyDialogProps> = ({ customProp, ...props }) => {
  return (
    <Dialog {...props}>
      {/* 實現 */}
    </Dialog>
  );
};
```

## 常見問題

### Q: 點樣處理舊嘅 className 樣式？
A: 新組件完全支援 className prop，可以直接傳入：
```tsx
<DialogContent className="custom-class">
  {/* 內容 */}
</DialogContent>
```

### Q: 點樣自定義按鈕樣式？
A: 可以使用標準 Button 組件同其 variant：
```tsx
<DialogFooter>
  <Button variant="outline">取消</Button>
  <Button variant="default" className="bg-blue-500">確定</Button>
</DialogFooter>
```

### Q: 點樣處理複雜嘅 Dialog 狀態？
A: 建議使用 React Hook 管理：
```tsx
const useDialogState = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleConfirm = async () => {
    setLoading(true);
    try {
      await doSomething();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };
  
  return { open, setOpen, loading, handleConfirm };
};
```

## 遷移檢查清單

- [ ] 更新所有 import 路徑
- [ ] 替換舊 Dialog 組件為新組件
- [ ] 添加適當嘅 size 同 variant props
- [ ] 使用 DialogBody 包裹內容區域
- [ ] 測試響應式行為
- [ ] 測試鍵盤導航同無障礙功能
- [ ] 更新相關嘅單元測試
- [ ] 移除舊組件依賴

## 需要幫助？

如果遇到任何問題，請：
1. 查看[組件示例](/docs/components/dialog-examples.md)
2. 參考[設計系統文檔](/lib/design-system/)
3. 聯繫開發團隊