# Widget Error Handling Guide

## Overview
本指南提供統一嘅 widget 錯誤處理最佳實踐，確保所有 widgets 都有一致嘅錯誤處理機制。

## 核心組件

### 1. ErrorHandler Service
位置：`/app/components/qc-label-form/services/ErrorHandler.ts`

主要功能：
- 統一錯誤記錄
- 用戶友好訊息
- 自動記錄到數據庫
- 錯誤統計分析

### 2. useWidgetErrorHandler Hook
位置：`/app/admin/hooks/useWidgetErrorHandler.ts`

使用方法：
```typescript
const { 
  handleError, 
  handleFetchError, 
  handleSubmitError,
  handleSuccess 
} = useWidgetErrorHandler('MyWidget', userId);
```

### 3. WidgetErrorBoundary Component
位置：`/app/admin/components/dashboard/WidgetErrorBoundary.tsx`

使用方法：
```typescript
<WidgetErrorBoundary widgetName="MyWidget">
  <MyWidgetComponent />
</WidgetErrorBoundary>
```

## 實施步驟

### Step 1: 在 Widget 中使用 Hook
```typescript
export const MyWidget = React.memo(function MyWidget({ widget }: WidgetComponentProps) {
  const { handleFetchError, handleSuccess } = useWidgetErrorHandler('MyWidget');
  
  const fetchData = async () => {
    try {
      const data = await api.getData();
      handleSuccess('Data loaded successfully', 'fetch_data');
      return data;
    } catch (error) {
      handleFetchError(error);
    }
  };
});
```

### Step 2: 在 UniversalWidgetCard 中包裹 ErrorBoundary
```typescript
// 在 UniversalWidgetCard.tsx 中自動包裹
<WidgetErrorBoundary widgetName={widgetType}>
  {children}
</WidgetErrorBoundary>
```

### Step 3: 移除舊的錯誤處理代碼
替換以下模式：
```typescript
// ❌ 舊方式
console.error('[WidgetName] Error:', error);
setError(error.message);

// ✅ 新方式
handleError(error, 'action_name');
```

## 錯誤類型處理

### 1. API/數據獲取錯誤
```typescript
try {
  const result = await dashboardAPI.fetch(params);
  // 處理成功
} catch (error) {
  handleFetchError(error, 'dashboard_api');
}
```

### 2. 表單提交錯誤
```typescript
try {
  await submitForm(formData);
  handleSuccess('Form submitted successfully', 'form_submit');
} catch (error) {
  handleSubmitError(error, formData);
}
```

### 3. 文件操作錯誤
```typescript
try {
  await uploadFile(file);
} catch (error) {
  handleFileError(error, 'upload', file.name);
}
```

### 4. 驗證錯誤
```typescript
if (!isValid) {
  handleValidationError('fieldName', 'Validation message');
}
```

## 最佳實踐

### 1. 始終使用 try-catch
```typescript
const performAction = async () => {
  try {
    // 業務邏輯
    await doSomething();
    handleSuccess('Action completed', 'action_name');
  } catch (error) {
    handleError(error, 'action_name');
  }
};
```

### 2. 提供有意義的 action 名稱
```typescript
// ✅ 好的 action 名稱
handleError(error, 'fetch_product_data');
handleError(error, 'update_warehouse_location');

// ❌ 不好的 action 名稱
handleError(error, 'error');
handleError(error, 'action');
```

### 3. 包含相關數據
```typescript
handleError(error, 'update_product', {
  productCode: product.code,
  attemptedUpdate: updateData
});
```

### 4. 使用適當的錯誤處理方法
- `handleFetchError`: 數據獲取失敗
- `handleSubmitError`: 表單提交失敗
- `handleFileError`: 文件操作失敗
- `handleValidationError`: 驗證失敗
- `handleError`: 通用錯誤

## 遷移清單

### 需要遷移的 Widgets
- [ ] ProductUpdateWidget
- [ ] StillInAwaitWidget
- [ ] WarehouseTransferListWidget
- [ ] TransactionReportWidget
- [ ] InventoryOrderedAnalysisWidget
- [ ] AcoOrderProgressWidget
- [ ] VoidPalletWidget
- [ ] StockLevelHistoryChart
- [ ] UploadFilesWidget
- [ ] 其他使用 console.error 的 widgets

### 遷移優先級
1. **高優先級**：涉及數據操作的 widgets（如 ProductUpdateWidget、VoidPalletWidget）
2. **中優先級**：顯示數據的 widgets（如 StillInAwaitWidget、charts）
3. **低優先級**：簡單顯示 widgets（如 StatsCardWidget）

## 監控和調試

### 1. 查看錯誤統計
```typescript
const stats = errorHandler.getErrorStats();
console.log('Error statistics:', stats);
```

### 2. 開發環境調試
- 所有錯誤都會在 console 中顯示
- ErrorBoundary 會顯示錯誤訊息

### 3. 生產環境監控
- 錯誤自動記錄到 `record_history` 表
- 可通過 Admin Dashboard 查看錯誤趨勢

## 範例：完整的 Widget 錯誤處理

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useWidgetErrorHandler } from '@/app/admin/hooks/useWidgetErrorHandler';
import { WidgetComponentProps } from '@/app/types/dashboard';

export const ExampleWidget = React.memo(function ExampleWidget({ 
  widget, 
  isEditMode 
}: WidgetComponentProps) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { 
    handleFetchError, 
    handleSubmitError, 
    handleSuccess,
    handleWarning 
  } = useWidgetErrorHandler('ExampleWidget');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.getData();
      
      if (!response.data) {
        handleWarning('No data available', 'fetch_data');
        return;
      }
      
      setData(response.data);
      handleSuccess('Data loaded', 'fetch_data', { 
        recordCount: response.data.length 
      });
    } catch (error) {
      handleFetchError(error, '/api/example');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      await api.updateData(formData);
      handleSuccess('Data updated successfully', 'update_data');
      await fetchData(); // Refresh
    } catch (error) {
      handleSubmitError(error, formData);
    }
  };

  return (
    <div>
      {/* Widget UI */}
    </div>
  );
});
```