# Widget 尺寸控制系統

## 概述
所有 Widget 尺寸設定都由 `WidgetSizeConfig.ts` 統一控制。這確保了：
- Widget 組件內的尺寸選擇
- Add Widget Dialog
- Widget Size Selector
- Default layouts

全部使用相同的設定。

## 主要功能

### 1. 檢查支援的尺寸
```typescript
import { isWidgetSizeSupported } from './WidgetSizeConfig';

// 檢查 Ask Database 是否支援 Small 尺寸
const isSupported = isWidgetSizeSupported(WidgetType.ASK_DATABASE, WidgetSize.SMALL);
// 返回: false
```

### 2. 獲取支援的尺寸列表
```typescript
import { getSupportedSizes } from './WidgetSizeConfig';

// 獲取 Stock Level 支援的所有尺寸
const sizes = getSupportedSizes(WidgetType.PRODUCT_MIX_CHART);
// 返回: [WidgetSize.MEDIUM, WidgetSize.LARGE]
```

### 3. 獲取預設尺寸
```typescript
import { getDefaultWidgetSize } from './WidgetSizeConfig';

// 獲取 Ask Database 的預設尺寸
const defaultSize = getDefaultWidgetSize(WidgetType.ASK_DATABASE);
// 返回: WidgetSize.XLARGE
```

### 4. 驗證並修正尺寸
```typescript
import { validateAndFixWidgetSize } from './WidgetSizeConfig';

// 如果提供了不支援的尺寸，會自動修正
const validSize = validateAndFixWidgetSize(WidgetType.ASK_DATABASE, WidgetSize.SMALL);
// 返回: WidgetSize.XLARGE (因為 Ask Database 只支援 6x6)
```

## 添加新 Widget

1. 在 `WidgetSizeConfig.ts` 的 `isWidgetSizeSupported` 函數中添加新的 case
2. 使用 `registerWidget` helper 函數註冊 widget
3. Widget 組件會自動獲得正確的尺寸限制

## 修改現有 Widget 的尺寸限制

只需要在 `WidgetSizeConfig.ts` 中修改對應的 case，所有使用的地方會自動更新：

```typescript
// 例如：讓 Inventory Search 支援 Small 尺寸
case WidgetType.INVENTORY_SEARCH:
  return true; // 現在支援所有尺寸
```

## 系統架構

```
WidgetSizeConfig.ts (統一控制中心)
    ├── WidgetSizeSelector.tsx (尺寸選擇器組件)
    ├── EnhancedDashboardDialog.tsx (Add Widget Dialog)
    ├── registerAdminWidgets.ts (Widget 註冊)
    └── 各個 Widget 組件
```

所有組件都從 WidgetSizeConfig.ts 讀取設定，確保一致性。