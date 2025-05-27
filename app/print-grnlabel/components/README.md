# GRN Label Components

## 概述

這個目錄包含重構後的 GRN Label 系統組件，採用模組化架構和可重用組件設計。

## 組件結構

### GrnLabelForm.tsx
主要的 GRN 標籤表單組件，整合了以下功能：

#### 重用的 QC Label 組件
- `ResponsiveLayout` - 響應式佈局容器
- `ResponsiveContainer` - 響應式內容容器  
- `ResponsiveCard` - 響應式卡片組件
- `ResponsiveStack` - 響應式堆疊佈局
- `ResponsiveGrid` - 響應式網格佈局
- `ProductCodeInput` - 產品代碼輸入（含自動驗證）
- `PrintProgressBar` - PDF 生成進度條
- `ClockNumberConfirmDialog` - Clock Number 確認對話框

#### 主要功能
1. **表單管理** - GRN 詳細信息輸入
2. **產品驗證** - 自動產品代碼驗證
3. **供應商驗證** - 自動供應商代碼驗證
4. **重量計算** - 自動淨重量計算
5. **PDF 生成** - 批量 PDF 標籤生成
6. **進度追蹤** - 實時處理進度顯示

## 使用方式

```typescript
import GrnLabelForm from './components/GrnLabelForm';

export default function PrintGrnLabelPage() {
  return <GrnLabelForm />;
}
```

## 特性

### 響應式設計
- 支援移動設備、平板和桌面
- 自適應佈局和組件大小
- 觸控友好的界面

### 用戶體驗
- 簡化的認證流程（只需 Clock Number）
- 實時表單驗證
- 清晰的錯誤提示
- 進度反饋

### 性能優化
- 使用 `useCallback` 優化回調函數
- 記憶化組件避免不必要重渲染
- 高效的狀態管理

### 類型安全
- 完整的 TypeScript 類型定義
- 強類型的 Props 和狀態
- 編譯時錯誤檢查

## 開發指南

### 添加新功能
1. 在 `GrnLabelForm.tsx` 中添加新的狀態和處理函數
2. 使用現有的響應式組件保持一致性
3. 遵循現有的命名約定和代碼風格

### 樣式自定義
- 使用 Tailwind CSS 類名
- 遵循系統主題色彩（橙色主題）
- 保持與其他頁面的視覺一致性

### 錯誤處理
- 使用 `toast` 顯示用戶友好的錯誤信息
- 在控制台記錄詳細的錯誤信息
- 提供適當的錯誤恢復機制 