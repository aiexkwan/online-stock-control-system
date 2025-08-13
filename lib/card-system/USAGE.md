# 純透明卡片系統使用指南

## 概述

新的統一卡片設計系統基於用戶反饋進行了重大改進：

1. **純透明毛玻璃效果** - 移除所有顏色污染，使用統一的透明效果
2. **形狀區分系統** - 通過角標、圖標樣式和陰影深度來區分卡片類型
3. **智能標題管理** - 自動檢測並避免雙重標題問題
4. **更好的用戶體驗** - 乾淨、統一且易於識別的視覺設計

## 基本使用

```typescript
import { EnhancedGlassmorphicCard } from '@/lib/card-system';

// 基本操作類卡片
<EnhancedGlassmorphicCard
  theme="operation"
  title="操作卡片"
>
  <p>卡片內容...</p>
</EnhancedGlassmorphicCard>

// 右側佈局卡片（自動處理雙重標題）
import { RightSideCardWrapper } from '@/lib/card-system';

<RightSideCardWrapper
  theme="analysis"
  autoSuppressTitle={true}
>
  <AnalysisComponent title="分析報告" />
</RightSideCardWrapper>
```

## 卡片類型與視覺區分

### 1. 操作類 (Operation)
- **角標**: 圓形，左上角
- **圖標**: 實心填充樣式
- **陰影**: 標準深度
- **用途**: 用戶操作、表單、控制面板

### 2. 分析類 (Analysis) 
- **角標**: 六邊形，右上角
- **圖標**: 線框樣式
- **陰影**: 強烈深度
- **用途**: 數據分析、統計圖表、儀表板

### 3. 數據類 (Data)
- **角標**: 方形，左上角
- **圖標**: 點線樣式
- **陰影**: 細微深度
- **用途**: 數據展示、列表、表格

### 4. 報表類 (Report)
- **角標**: 菱形，右上角
- **圖標**: 條紋樣式
- **陰影**: 強烈深度
- **用途**: 報告、導出功能、打印

### 5. 圖表類 (Chart)
- **角標**: 三角形，左上角
- **圖標**: 分段樣式
- **陰影**: 強烈深度
- **用途**: 圖表、可視化、趨勢分析

### 6. 特殊類 (Special)
- **角標**: 星形，右上角
- **圖標**: 漸變樣式
- **陰影**: 最強深度
- **用途**: 特殊功能、AI助手、系統工具

## 解決雙重標題問題

### 問題描述
右側佈局的卡片容易出現容器標題與內容組件標題重複顯示的問題。

### 解決方案

#### 方案1: 使用RightSideCardWrapper
```typescript
import { RightSideCardWrapper } from '@/lib/card-system';

<RightSideCardWrapper theme="analysis">
  <YourComponent title="組件標題" />
</RightSideCardWrapper>
```

#### 方案2: 手動控制標題
```typescript
<EnhancedGlassmorphicCard
  theme="analysis"
  suppressTitle={true} // 隱藏容器標題
  hideContainerTitle={true}
>
  <YourComponent title="組件標題" />
</EnhancedGlassmorphicCard>
```

#### 方案3: 智能檢測（自動）
組件會自動檢測子元素是否包含標題，如果發現重複會自動隱藏容器標題。

## 樣式自定義

### CSS變量
```css
:root {
  --card-glow-rgb: 255, 255, 255;
  --card-bg: rgba(255, 255, 255, 0.05);
  --card-border: rgba(255, 255, 255, 0.10);
  --card-blur: 16px;
}
```

### 圖標樣式類
```css
.card-icon--filled    /* 實心圖標 */
.card-icon--outline   /* 線框圖標 */
.card-icon--dotted    /* 點線圖標 */
.card-icon--striped   /* 條紋圖標 */
.card-icon--segmented /* 分段圖標 */
.card-icon--gradient  /* 漸變圖標 */
```

## 性能優化

### 自適應性能配置
```typescript
<EnhancedGlassmorphicCard
  theme="operation"
  glassmorphicVariant="default" // subtle | default | strong | intense
>
```

### 響應式隱藏
```typescript
<EnhancedGlassmorphicCard
  responsiveHide={['mobile']} // 在移動設備隱藏
>
```

## 無障礙設計

### 鍵盤支持
```typescript
<EnhancedGlassmorphicCard
  isHoverable={true}
  onClick={handleClick}
  onKeyDown={handleKeyDown}
  role="button"
  tabIndex={0}
  ariaLabel="操作按鈕"
>
```

### 高對比模式
系統自動支持高對比模式，在用戶系統設置為高對比時會增強視覺對比度。

## 遷移指南

### 從舊卡片系統遷移

1. **更新導入**
```typescript
// 舊的
import { Widget } from '@/components/widgets';

// 新的
import { EnhancedGlassmorphicCard } from '@/lib/card-system';
```

2. **更新屬性**
```typescript
// 舊的
<Widget type="operation" colorScheme="blue">

// 新的  
<EnhancedGlassmorphicCard theme="operation">
```

3. **處理標題衝突**
```typescript
// 如果出現雙重標題，添加suppressTitle
<EnhancedGlassmorphicCard 
  theme="analysis"
  suppressTitle={true}
>
```

## 常見問題

### Q: 如何區分不同類型的卡片？
A: 新系統通過角標形狀、圖標樣式和陰影深度來區分，無需依賴顏色。

### Q: 右側卡片出現雙重標題怎麼辦？
A: 使用`RightSideCardWrapper`或設置`suppressTitle={true}`。

### Q: 如何自定義圖標樣式？
A: 使用CSS類`.card-icon--[style]`或通過CSS變量調整。

### Q: 性能考慮？
A: 系統會根據設備性能自動調整毛玻璃效果強度，低性能設備會使用簡化版本。

## 最佳實踐

1. **選擇合適的主題** - 根據功能選擇對應的卡片類型
2. **避免嵌套卡片** - 一個組件只使用一個卡片容器
3. **保持內容簡潔** - 毛玻璃效果適合少量重點內容
4. **測試可訪問性** - 確保在不同設備和設置下都能正常使用
5. **利用角標識別** - 讓用戶習慣通過形狀而非顏色識別功能