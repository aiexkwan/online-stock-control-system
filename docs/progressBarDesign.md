# PDF 生成進度條統一設計

## 概述

本文檔描述了 Pennine Industries Stock Control System 中 PDF 生成進度條的統一設計方案。

## 設計目標

1. **一致性**：兩個主要頁面（`/print-label` 和 `/print-grnlabel`）使用相同的進度條設計
2. **響應式**：支援桌面和移動設備的最佳顯示
3. **用戶體驗**：提供清晰的視覺反饋和狀態信息
4. **可維護性**：使用共享組件，便於維護和更新

## 統一組件

### EnhancedProgressBar

我們選擇 `EnhancedProgressBar` 作為統一的進度條組件，因為它提供：

- **豐富的功能**：支援多種顯示模式和配置選項
- **響應式設計**：自動適應不同屏幕尺寸
- **詳細狀態**：顯示成功、失敗、處理中和待處理狀態
- **動畫效果**：流暢的進度動畫和狀態轉換
- **可定制性**：支援多種變體和樣式配置

### 配置參數

```typescript
interface EnhancedProgressBarProps {
  current: number;                    // 當前進度
  total: number;                      // 總數
  status: ProgressStatus[];           // 狀態陣列
  title?: string;                     // 標題
  variant?: 'default' | 'compact' | 'detailed';  // 顯示變體
  showPercentage?: boolean;           // 顯示百分比
  showItemDetails?: boolean;          // 顯示項目詳情
  className?: string;                 // 自定義樣式
}
```

## 頁面實現

### Print Label 頁面 (`/print-label`)

```tsx
<EnhancedProgressBar
  current={current}
  total={total}
  status={status}
  title="QC Label Generation"
  variant={isMobile ? 'compact' : 'default'}
  showPercentage={true}
  showItemDetails={true}
  className="bg-gray-700 p-4 rounded-lg"
/>
```

**特點**：
- 標題：`QC Label Generation`
- 響應式變體：移動設備使用 `compact`，桌面使用 `default`
- 完整功能：顯示百分比和項目詳情

### Print GRN Label 頁面 (`/print-grnlabel`)

```tsx
<EnhancedProgressBar
  current={pdfProgress.current}
  total={pdfProgress.total}
  status={pdfProgress.status}
  title="GRN Label Generation"
  variant="compact"
  showPercentage={true}
  showItemDetails={true}
  className="bg-gray-700 p-4 rounded-lg"
/>
```

**特點**：
- 標題：`GRN Label Generation`
- 固定變體：使用 `compact` 模式以節省空間
- 完整功能：顯示百分比和項目詳情

## 視覺設計

### 顏色方案

- **背景**：`bg-gray-700` - 深灰色背景
- **進度條**：
  - 正常：`bg-blue-500` - 藍色
  - 成功：`bg-green-500` - 綠色
  - 失敗：`bg-red-500` - 紅色
- **文字**：白色和灰色層次

### 狀態指示器

- **Pending** ⏳：灰色圓圈，顯示序號
- **Processing** 🔄：藍色圓圈，旋轉動畫
- **Success** ✅：綠色圓圈，勾號圖標
- **Failed** ❌：紅色圓圈，叉號圖標

### 響應式行為

- **桌面**：詳細視圖，顯示完整的項目列表
- **移動設備**：緊湊視圖，使用小圓圈指示器
- **平板**：根據屏幕寬度自動調整

## 使用指南

### 基本使用

1. **導入組件**：
```tsx
import { EnhancedProgressBar } from '@/app/components/qc-label-form';
```

2. **設置狀態**：
```tsx
const [pdfProgress, setPdfProgress] = useState({
  current: 0,
  total: 0,
  status: [] as ProgressStatus[]
});
```

3. **更新進度**：
```tsx
// 開始處理
setPdfProgress({
  current: 0,
  total: numberOfItems,
  status: Array(numberOfItems).fill('Pending')
});

// 更新單個項目狀態
setPdfProgress(prev => ({
  ...prev,
  current: currentIndex + 1,
  status: prev.status.map((s, idx) => 
    idx === currentIndex ? 'Processing' : s
  )
}));

// 完成項目
setPdfProgress(prev => ({
  ...prev,
  status: prev.status.map((s, idx) => 
    idx === currentIndex ? 'Success' : s
  )
}));
```

### 最佳實踐

1. **及時更新**：在每個處理步驟後立即更新狀態
2. **錯誤處理**：失敗時設置為 'Failed' 狀態
3. **用戶反饋**：配合 toast 消息提供額外反饋
4. **性能考慮**：避免過於頻繁的狀態更新

## 技術實現

### 組件結構

```
EnhancedProgressBar/
├── 進度條標題和百分比
├── 主進度條
├── 狀態摘要
├── 項目詳情（可選）
└── 完成狀態指示
```

### 動畫效果

- **進度條**：平滑的寬度變化動畫
- **狀態指示器**：顏色和圖標的過渡效果
- **處理中狀態**：脈衝動畫和旋轉效果

### 可訪問性

- **ARIA 標籤**：適當的可訪問性標籤
- **鍵盤導航**：支援鍵盤操作
- **屏幕閱讀器**：提供狀態更新的語音反饋

## 維護和更新

### 版本控制

- 組件位於：`app/components/qc-label-form/EnhancedProgressBar.tsx`
- 類型定義：`app/components/qc-label-form/types.ts`

### 更新流程

1. 修改 `EnhancedProgressBar` 組件
2. 測試兩個頁面的顯示效果
3. 更新相關文檔
4. 提交代碼變更

### 測試檢查清單

- [ ] Print Label 頁面進度條正常顯示
- [ ] Print GRN Label 頁面進度條正常顯示
- [ ] 響應式設計在不同設備上正常工作
- [ ] 所有狀態（Pending、Processing、Success、Failed）正確顯示
- [ ] 動畫效果流暢
- [ ] 可訪問性功能正常

## 未來改進

1. **主題支持**：支援明暗主題切換
2. **國際化**：支援多語言標籤
3. **自定義圖標**：允許自定義狀態圖標
4. **聲音反饋**：可選的聲音提示
5. **導出功能**：進度報告導出

---

*最後更新：2024年12月*
*版本：1.0* 