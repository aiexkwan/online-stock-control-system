# 懸浮 Instructions 統一設計

## 概述

本文檔描述了 Pennine Industries Stock Control System 中懸浮 Instructions 組件的統一設計方案，用於 `/print-label`、`/print-grnlabel` 和 `/stock-transfer` 三個頁面。

## 設計目標

1. **統一體驗**：三個頁面使用相同的 Instructions 顯示方式
2. **節省空間**：平常只顯示圖示，不佔用頁面空間
3. **醒目提示**：懸浮設計更容易吸引用戶注意
4. **一致位置**：在各頁面主要卡片的右上角顯示
5. **即時顯示**：Hangover 形式，無需點擊即可查看

## 組件設計

### FloatingInstructions 組件

位置：`components/ui/floating-instructions.tsx`

#### 主要特點

- **Hangover 按鈕**：小型圓形按鈕，顯示資訊圖示
- **懸浮面板**：滑鼠懸停時自動顯示詳細說明
- **無需點擊**：Hover 即顯示，移開即隱藏
- **響應式設計**：適應不同屏幕尺寸

#### 視覺設計

**按鈕狀態**：
- 🔵 **預設狀態**：藍色背景，白色圖示，hover 時有脈衝動畫和放大效果
- 📏 **尺寸**：32x32px（比原來的 48x48px 更小）

**面板設計**：
- 📱 **響應式寬度**：320px 或 90vw（較小者）
- 🎨 **毛玻璃效果**：白色半透明背景，模糊效果
- 📋 **步驟編號**：藍色圓圈，白色數字
- 🔤 **清晰層次**：標題和描述分層顯示
- 📍 **定位**：相對於按鈕右下方顯示

### 配置參數

```typescript
interface FloatingInstructionsProps {
  title?: string;                    // 面板標題
  steps: InstructionStep[];          // 說明步驟
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'relative';
  className?: string;                // 自定義樣式
  variant?: 'floating' | 'hangover'; // 顯示模式
}

interface InstructionStep {
  title: string;                     // 步驟標題
  description: string;               // 步驟描述
}
```

## 頁面實現

### Print Label 頁面 (`/print-label`)

**位置**：Pallet Details 卡片右上角

```tsx
<ResponsiveCard 
  title="Pallet Details"
  className="mb-6"
  headerAction={
    <FloatingInstructions
      title="QC Label Instructions"
      variant="hangover"
      steps={[
        {
          title: "Enter Pallet Details",
          description: "Fill in all required pallet information including product code, quantity, count, and operator details."
        },
        {
          title: "Configure Product Settings", 
          description: "For ACO products, enter order reference and details. For Slate products, configure batch and material information."
        },
        {
          title: "Generate Labels",
          description: "Click 'Print Label' button to generate and print QC labels. Enter your clock number when prompted."
        }
      ]}
    />
  }
>
```

**特點**：
- 位置：Pallet Details 卡片右上角
- 3個步驟：輸入詳情 → 配置設定 → 生成標籤
- 針對 QC 標籤的特定流程

### Print GRN Label 頁面 (`/print-grnlabel`)

**位置**：GRN Detail 卡片右上角

```tsx
<ResponsiveCard 
  title="GRN Detail" 
  className="bg-gray-800"
  headerAction={
    <FloatingInstructions
      title="GRN Label Instructions"
      variant="hangover"
      steps={[
        {
          title: "Fill GRN Details",
          description: "Enter GRN Number, Material Supplier Code, and Product Code. System will auto-validate supplier and product information."
        },
        {
          title: "Select Pallet & Package Types",
          description: "Choose the appropriate pallet and package types, then enter the quantity count for each type."
        },
        {
          title: "Enter Gross Weight",
          description: "Input the gross weight for each pallet. System will automatically calculate net weight."
        },
        {
          title: "Print Labels",
          description: "Click 'Print GRN Label(s)' button after confirming all information is correct, then enter your clock number."
        }
      ]}
    />
  }
>
```

**特點**：
- 位置：GRN Detail 卡片右上角
- 4個步驟：填寫詳情 → 選擇類型 → 輸入重量 → 列印標籤
- 針對 GRN 標籤的特定流程

### Stock Transfer 頁面 (`/stock-transfer`)

**位置**：Pallet Search 卡片右上角

```tsx
<CardHeader>
  <div className="flex items-center justify-between">
    <CardTitle className="text-blue-400">Pallet Search</CardTitle>
    <FloatingInstructions
      title="Stock Transfer Instructions"
      variant="hangover"
      steps={[
        {
          title: "Scan or Enter Pallet",
          description: "Scan QR code or enter complete pallet number (e.g., 250525/13) or series number (e.g., 260525-5UNXGE)."
        },
        {
          title: "Confirm Pallet Information",
          description: "Review pallet details including product code, quantity, and current location. System will calculate target location."
        },
        {
          title: "Enter Clock Number",
          description: "Enter your clock number to confirm the stock transfer operation."
        },
        {
          title: "View Results",
          description: "Check operation results and activity log. The search field will auto-focus for next operation."
        }
      ]}
    />
  </div>
</CardHeader>
```

**特點**：
- 位置：Pallet Search 卡片右上角
- 4個步驟：掃描輸入 → 確認信息 → 輸入時鐘號 → 查看結果
- 針對庫存轉移的特定流程
- 移除了舊的 StockMovementLayout Instructions 系統

## 技術實現

### Hangover 動畫效果

- **按鈕動畫**：hover 時放大 110%，脈衝動畫
- **面板動畫**：滑鼠懸停時淡入放大，移開時淡出縮小
- **過渡時間**：300ms，ease-out 緩動
- **觸發方式**：onMouseEnter / onMouseLeave

### 響應式設計

- **桌面**：固定寬度 320px
- **移動設備**：最大寬度 90vw
- **位置調整**：相對於按鈕定位，自動適應屏幕邊界

### 可訪問性

- **鍵盤支持**：Tab 鍵導航
- **ARIA 標籤**：適當的可訪問性標籤
- **對比度**：符合 WCAG 標準
- **提示文字**：按鈕有 title 屬性

## 使用指南

### 基本使用

1. **導入組件**：
```tsx
import FloatingInstructions from '@/components/ui/floating-instructions';
```

2. **定義步驟**：
```tsx
const steps = [
  {
    title: "步驟標題",
    description: "詳細描述說明"
  }
];
```

3. **添加到卡片標題**：
```tsx
<ResponsiveCard
  title="卡片標題"
  headerAction={
    <FloatingInstructions
      title="說明標題"
      variant="hangover"
      steps={steps}
    />
  }
>
```

### 最佳實踐

1. **步驟數量**：建議 3-5 個步驟，避免過多
2. **描述長度**：每個描述控制在 1-2 句話
3. **位置一致**：所有頁面使用相同的卡片右上角位置
4. **標題簡潔**：使用動詞開頭，簡潔明瞭
5. **即時顯示**：利用 hangover 特性，讓用戶快速獲取幫助

## 優勢對比

### 舊設計 vs 新設計

| 特點 | 舊設計 | 新設計 |
|------|--------|--------|
| **空間佔用** | 佔用頁面空間 | 不佔用空間 |
| **視覺突出** | 容易被忽略 | 卡片右上角醒目 |
| **一致性** | 三頁面不同 | 完全統一 |
| **用戶體驗** | 需要點擊開啟 | Hover 即顯示 |
| **響應式** | 部分支持 | 完全響應式 |
| **操作便利** | 需要手動開關 | 自動顯示隱藏 |

### 改進效果

1. **節省空間**：釋放了側邊欄和頂部空間
2. **提升一致性**：三個頁面體驗完全統一
3. **增強可見性**：卡片右上角位置更容易被注意到
4. **改善交互**：Hover 顯示更直觀，無需點擊
5. **提高效率**：用戶可以快速查看說明而不中斷操作流程

## 架構更改

### ResponsiveCard 組件增強

為了支持在卡片標題右側添加 Instructions 按鈕，對 `ResponsiveCard` 組件進行了增強：

```tsx
export const ResponsiveCard: React.FC<{
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
  headerAction?: ReactNode; // 新增屬性
}> = React.memo(({
  children,
  title,
  subtitle,
  className = '',
  padding = 'md',
  shadow = true,
  headerAction // 新增參數
}) => {
  // ... 實現邏輯
  return (
    <div className="...">
      {(title || subtitle || headerAction) && (
        <div className="mb-6">
          {(title || headerAction) && (
            <div className="flex items-center justify-between mb-2">
              {title && <h2 className="...">{title}</h2>}
              {headerAction && (
                <div className="flex-shrink-0">
                  {headerAction}
                </div>
              )}
            </div>
          )}
          {subtitle && <p className="...">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
});
```

### 移除的舊系統

1. **Print Label 頁面**：移除側邊欄中的 FloatingInstructions
2. **Print GRN Label 頁面**：移除頁面頂部的 FloatingInstructions
3. **Stock Transfer 頁面**：
   - 移除頁面頂部的 FloatingInstructions
   - 移除 StockMovementLayout 中的 helpContent、showHelp、onToggleHelp 參數

## 維護和更新

### 版本控制

- 組件位於：`components/ui/floating-instructions.tsx`
- 使用頁面：`/print-label`、`/print-grnlabel`、`/stock-transfer`
- 增強組件：`app/components/qc-label-form/ResponsiveLayout.tsx`

### 更新流程

1. 修改 `FloatingInstructions` 組件
2. 測試三個頁面的顯示效果
3. 檢查響應式和可訪問性
4. 更新相關文檔

### 測試檢查清單

- [ ] 三個頁面的 Instructions 按鈕在正確位置顯示
- [ ] Hover 時能正確顯示/隱藏面板
- [ ] 面板內容正確顯示
- [ ] 響應式設計在不同設備上正常工作
- [ ] 動畫效果流暢
- [ ] 可訪問性功能正常
- [ ] 舊的 Instructions 系統已完全移除

## 未來改進

1. **主題支持**：支援明暗主題切換
2. **國際化**：支援多語言說明
3. **自定義圖示**：允許自定義按鈕圖示
4. **快捷鍵**：支援鍵盤快捷鍵開啟
5. **記憶功能**：記住用戶的開啟/關閉偏好
6. **動畫優化**：更流暢的進入/退出動畫
7. **觸控支持**：改善移動設備上的觸控體驗

---

*最後更新：2024年12月*
*版本：2.0 - Hangover 設計* 