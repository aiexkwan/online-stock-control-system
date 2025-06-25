# Dialog 系統統一遷移計劃

## 現況分析

系統目前有多種 dialog 實現：
1. 基礎 @radix-ui/react-dialog
2. 統一 dialog 系統 (unified-dialog.tsx)
3. 通知 dialog 系統 (notification-dialogs.tsx)
4. 各種自定義實現

## 遷移策略

### 第一階段：確認類對話框
優先遷移所有確認、警告、錯誤提示類的 dialog：

#### 1. Void Pallet 模組
- [ ] VoidConfirmDialog → WarningDialog
- [ ] BatchVoidConfirmDialog → WarningDialog
- [ ] ReprintInfoDialog → InfoDialog

#### 2. Stock Transfer 模組
- [ ] TransferConfirmDialog → WarningDialog
- [ ] KeyboardShortcutsDialog → InfoDialog

#### 3. Order Loading 模組
- [ ] 確認對話框 → WarningDialog

#### 4. QC Label Form
- [ ] ClockNumberConfirmDialog → WarningDialog

### 第二階段：通知類對話框
遷移所有成功、錯誤、通知類的簡單對話框：

#### 1. 操作成功提示
- [ ] 保存成功 → SuccessDialog
- [ ] 上傳成功 → SuccessDialog
- [ ] 刪除成功 → SuccessDialog

#### 2. 錯誤提示
- [ ] 網絡錯誤 → ErrorDialog
- [ ] 驗證錯誤 → ErrorDialog
- [ ] 操作失敗 → ErrorDialog

### 第三階段：複雜對話框
保持現有功能，但統一樣式：

#### 1. 報表系統
- 保持 UnifiedReportDialog 框架
- 套用統一的樣式變數

#### 2. 管理面板
- 保持 DialogManager 架構
- 統一按鈕和標題樣式

#### 3. 文件上傳
- 保持 Google-like 風格
- 不需要改動

## 實施步驟

### 1. 創建遷移 Hook
```typescript
// hooks/useDialog.ts
import { 
  NotificationDialog,
  SuccessDialog,
  ErrorDialog,
  WarningDialog,
  DeleteConfirmDialog,
  InfoDialog 
} from '@/components/ui/notification-dialogs';

export function useDialog() {
  // 統一的 dialog 管理邏輯
}
```

### 2. 逐步替換
從使用頻率最高的開始：
1. 確認對話框
2. 錯誤提示
3. 成功提示

### 3. 保持向後兼容
- 保留原有 API 接口
- 逐步廢棄舊組件

## 注意事項

1. **保持功能不變** - 只改變外觀和動畫
2. **測試充分** - 每個模組改動後都要測試
3. **分批進行** - 不要一次改太多
4. **文檔更新** - 記錄新的使用方式

## 優先級

1. **高優先級**：經常使用的確認對話框
2. **中優先級**：錯誤和成功提示
3. **低優先級**：複雜的自定義對話框

---

最後更新：2025-06-25