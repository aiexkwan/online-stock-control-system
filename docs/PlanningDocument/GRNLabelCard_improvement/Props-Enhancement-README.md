# GRN Label Card Props Interface Enhancement

## 概述 Overview

本項目成功實施了任務 2.1.5：為 GRNLabelCard 相關組件增強 TypeScript Props 接口。此增強提供了更強的類型定義、豐富的自定義選項、預設值機制，同時確保與現有代碼的向下兼容性。

## 主要特性 Key Features

### 1. 強化的 TypeScript 類型定義
- **全面的 Props 接口**: 創建了 `EnhancedGRNLabelCardProps` 等增強接口
- **嚴格的類型驗證**: 使用 Zod 進行運行時類型驗證
- **詳細的 JSDoc 註釋**: 提供完整的 TypeScript 文檔

### 2. 豐富的自定義選項
- **主題配置**: 支援 5 種顏色主題 (orange, blue, green, purple, red)
- **佈局選項**: 緊湊模式、自動展開閾值、權重摘要顯示
- **功能開關**: 可選啟用/禁用列印、供應商查詢、產品查詢等功能
- **可訪問性配置**: ARIA 標籤、鍵盤導航支援

### 3. 預設值機制
- **智能預設值**: 為所有可選配置提供合理的預設值
- **配置合併**: 自動合併用戶配置與預設值
- **工廠函數**: 提供常用配置的便捷創建函數

### 4. 向下兼容性
- **聯合類型設計**: 支援舊版和新版 Props 接口
- **自動轉換**: 舊版 Props 自動轉換為新版格式
- **無縫升級**: 現有代碼無需修改即可正常運行

## 新增檔案 New Files

### `/lib/types/grn-props.ts`
主要的 Props 接口定義檔案，包含：

```typescript
// 主要接口
- EnhancedGRNLabelCardProps
- EnhancedGrnDetailCardProps  
- EnhancedWeightInputListProps

// 配置接口
- GrnThemeConfig
- GrnLayoutConfig
- GrnValidationConfig
- GrnFeatureConfig
- GrnCallbacks
- GrnPerformanceConfig
- GrnAccessibilityConfig

// 預設值
- DEFAULT_GRN_THEME
- DEFAULT_GRN_LAYOUT
- DEFAULT_GRN_VALIDATION
- DEFAULT_GRN_FEATURES

// 工具函數
- mergeGrnConfig()
- validateGrnThemeConfig()
- convertLegacyProps()
- createCompactGrnProps()
```

## 更新的組件 Updated Components

### 1. `GRNLabelCard.tsx`
- 支援增強 Props 接口
- 自動處理舊版/新版 Props
- 整合主題和配置系統
- 增強的驗證和錯誤處理

### 2. `WeightInputList.tsx`  
- 可配置最大項目數
- 自動展開閾值設定
- 權重計算回調
- 性能優化選項

### 3. `GrnDetailCard.tsx`
- 主題色彩系統
- 增強的驗證回調
- 欄位聚焦/失焦事件
- 自定義 CSS 類別支援

## 使用方式 Usage Examples

### 基本用法 (舊版相容)
```typescript
// 現有代碼無需修改
<GRNLabelCard className="my-custom-class" />
```

### 增強用法 (新功能)
```typescript
// 自定義主題和佈局
<GRNLabelCard
  id="main-grn-card"
  theme={{
    accentColor: 'blue',
    enableGlow: true,
    customClasses: {
      container: 'my-custom-container',
      button: 'my-custom-button'
    }
  }}
  layout={{
    compactMode: false,
    maxWeightInputs: 30,
    showProgressBar: true
  }}
  features={{
    enablePrinting: true,
    enableClockNumberDialog: true,
    enableUndoRedo: true
  }}
  callbacks={{
    onFormChange: (formData, field) => console.log('Form changed:', field),
    onPrintSuccess: (labelCount) => console.log('Labels printed:', labelCount),
    onValidationError: (field, error) => console.log('Validation error:', field, error)
  }}
  initialData={{
    grnNumber: 'GRN-001',
    productCode: 'PROD-001'
  }}
  disabled={false}
  debug={true}
/>
```

### 預設配置工廠
```typescript
// 緊湊模式配置
const compactProps = createCompactGrnProps({
  className: 'compact-card',
  theme: { accentColor: 'green' }
});

// 除錯模式配置  
const debugProps = createDebugGrnProps({
  callbacks: {
    onStateChange: (state) => console.log('State:', state)
  }
});

// 只讀模式配置
const readOnlyProps = createReadOnlyGrnProps({
  initialData: existingFormData
});
```

## 配置選項詳細說明

### 主題配置 (GrnThemeConfig)
```typescript
interface GrnThemeConfig {
  accentColor?: 'orange' | 'blue' | 'green' | 'purple' | 'red';
  borderStyle?: 'glass' | 'solid' | 'gradient' | 'none';
  enableGlow?: boolean;
  enableAnimations?: boolean;
  customClasses?: {
    container?: string;
    header?: string;
    content?: string;
    button?: string;
    input?: string;
  };
}
```

### 佈局配置 (GrnLayoutConfig)
```typescript
interface GrnLayoutConfig {
  maxWeightInputs?: number;        // 預設: 22
  autoExpandThreshold?: number;    // 預設: 5  
  compactMode?: boolean;           // 預設: false
  showProgressBar?: boolean;       // 預設: true
  showWeightSummary?: boolean;     // 預設: true
  enableKeyboardShortcuts?: boolean; // 預設: true
}
```

### 功能配置 (GrnFeatureConfig)
```typescript
interface GrnFeatureConfig {
  enablePrinting?: boolean;         // 預設: true
  enableClockNumberDialog?: boolean; // 預設: true  
  enableSupplierLookup?: boolean;   // 預設: true
  enableProductLookup?: boolean;    // 預設: true
  enableWeightCalculation?: boolean; // 預設: true
  enableUndoRedo?: boolean;         // 預設: false
  enableDataExport?: boolean;       // 預設: false
}
```

## 驗證和錯誤處理

### 自定義驗證器
```typescript
const customValidation = {
  validation: {
    customValidators: {
      productCode: (code: string) => {
        if (code.length < 5) return 'Product code must be at least 5 characters';
        if (!/^[A-Z0-9-]+$/.test(code)) return 'Invalid product code format';
        return true;
      },
      clockNumber: (number: string) => {
        if (!/^[0-9]{4,6}$/.test(number)) return 'Clock number must be 4-6 digits';
        return true;
      }
    }
  }
};
```

### 錯誤回調
```typescript
const errorHandling = {
  callbacks: {
    onValidationError: (field: string, error: string) => {
      console.error(`Validation failed for ${field}: ${error}`);
      // 顯示用戶友好錯誤訊息
    },
    onPrintError: (error: string) => {
      console.error('Print failed:', error);
      // 處理列印錯誤
    }
  }
};
```

## 性能優化

### 配置選項
```typescript
const performanceConfig = {
  performance: {
    enableMemoization: true,      // 組件記憶化
    validationDebounce: 300,      // 驗證防抖 (毫秒)
    autoSaveDebounce: 1000,       // 自動保存防抖
    enableVirtualScrolling: false, // 虛擬滾動
    enableLazyLoading: true       // 延遲加載
  }
};
```

## 可訪問性支援

### ARIA 配置
```typescript
const accessibilityConfig = {
  accessibility: {
    ariaLabels: {
      mainForm: 'GRN Label Generation Form',
      weightInputs: 'Weight Input List',
      printButton: 'Print GRN Labels',
      progressBar: 'Generation Progress'
    },
    keyboardNavigation: {
      enabled: true,
      skipLinks: true,
      focusTrap: true
    },
    highContrastMode: false,
    respectReducedMotion: true
  }
};
```

## 測試更新

測試檔案已更新以支援新的 Props 接口：

```typescript
// 測試舊版相容性
it('should render with legacy props (backward compatibility)', () => {
  renderGrnComponent(<GRNLabelCard className="test-class" />);
  expect(screen.getByText('GRN Label Generation')).toBeInTheDocument();
});

// 測試增強功能
it('should render with enhanced props', () => {
  const enhancedProps = {
    theme: { accentColor: 'blue' as const },
    layout: { compactMode: true },
    features: { enablePrinting: true },
    id: 'test-grn-card'
  };
  
  renderGrnComponent(<GRNLabelCard {...enhancedProps} />);
  expect(document.getElementById('test-grn-card')).toBeInTheDocument();
});
```

## 遷移指南

### 從舊版升級到新版

1. **無需立即更改**: 現有代碼可以繼續使用舊版 Props
2. **漸進式升級**: 可以逐步採用新功能
3. **完整升級**: 使用完整的增強 Props 接口

```typescript
// 階段 1: 繼續使用舊版 (無需修改)
<GRNLabelCard className="existing-class" />

// 階段 2: 添加一些新功能
<GRNLabelCard 
  className="existing-class"
  theme={{ accentColor: 'blue' }}
  layout={{ compactMode: true }}
/>

// 階段 3: 完整升級
<GRNLabelCard {...fullEnhancedProps} />
```

## 注意事項

1. **類型安全**: 所有新配置都有完整的 TypeScript 類型定義
2. **運行時驗證**: 使用 Zod 進行配置驗證，確保運行時安全
3. **性能考慮**: 大量配置選項使用 React.useMemo 進行優化
4. **錯誤處理**: 配置錯誤會優雅降級到預設值
5. **除錯支援**: debug 模式提供詳細的日誌輸出

## 結論

此 Props 接口增強項目成功地：

✅ **創建了強化的 TypeScript 類型定義**
✅ **提供了豐富的自定義選項和預設值**  
✅ **確保了完全的向下兼容性**
✅ **添加了全面的配置驗證和錯誤處理**
✅ **更新了測試以涵蓋新功能**
✅ **提供了詳細的 TypeScript 文檔**

新的 Props 接口為 GRN Label Card 系統提供了更好的靈活性、可維護性和使用者體驗，同時保持了與現有代碼的無縫兼容性。