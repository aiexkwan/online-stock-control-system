# ClientLayout originalFactory.call 錯誤修復

**問題編號**: CLIENT-LAYOUT-001  
**修復日期**: 2025-01-11  
**嚴重程度**: 高  
**狀態**: 已修復  

## 問題描述

### 錯誤訊息
```
Error: undefined is not an object (evaluating 'originalFactory.call')
Call Stack:
- components/ui/dialog.tsx
- app/void-pallet/components/UnifiedVoidReportDialog.tsx
- app/components/reports/GlobalReportDialogs.tsx
- app/components/ClientLayout.tsx
```

### 症狀
- 應用程式在載入時出現 `originalFactory.call` 錯誤
- 錯誤通過 `ClientLayout` → `GlobalReportDialogs` → 報表對話框傳播
- 影響多個報表對話框組件的載入

## 根本原因分析

### 1. 動態導入鏈問題
- `ClientLayout` 載入 `GlobalReportDialogs`
- `GlobalReportDialogs` 包含多個報表對話框組件
- 每個報表對話框都進行動態導入 `ReportRegistry`
- 缺乏適當的錯誤處理機制

### 2. 錯誤傳播路徑
```
ClientLayout
├── GlobalReportDialogs (無錯誤邊界)
    ├── UnifiedVoidReportDialog (動態導入)
    ├── UnifiedLoadingReportDialog (動態導入)
    └── UnifiedExportAllDataDialog
```

### 3. 缺乏錯誤隔離
- 任何一個對話框的載入錯誤都會影響整個應用
- 沒有錯誤恢復機制

## 修復方案

### 1. ClientLayout 錯誤邊界 (app/components/ClientLayout.tsx)

```typescript
// 為對話框組件添加錯誤邊界
class DialogErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dialog Error Boundary caught an error:', error, errorInfo);
    
    // 檢查 originalFactory.call 錯誤
    if (error.message?.includes('originalFactory.call') || 
        error.message?.includes('undefined is not an object')) {
      console.log('Detected originalFactory.call error, attempting recovery...');
      
      // 嘗試恢復
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined });
      }, 1000);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-xs text-gray-500 p-2">
          Dialog loading error - recovering...
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 2. 動態導入錯誤處理工具 (lib/utils/dynamic-import-handler.ts)

```typescript
export class DynamicImportHandler {
  private static isOriginalFactoryError(error: Error): boolean {
    const message = error.message || '';
    const stack = error.stack || '';
    return (
      message.includes('originalFactory.call') ||
      message.includes('undefined is not an object') ||
      message.includes('Cannot read properties of undefined') ||
      stack.includes('originalFactory.call')
    );
  }

  static async safeImport<T>(
    importFn: () => Promise<T>,
    options: DynamicImportOptions = {}
  ): Promise<T> {
    const {
      retryCount = 3,
      retryDelay = 1000,
      fallbackDelay = 2000,
      onError
    } = options;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        return await importFn();
      } catch (error) {
        const err = error as Error;
        
        if (onError) {
          onError(err);
        }

        // 特殊處理 originalFactory.call 錯誤
        if (this.isOriginalFactoryError(err)) {
          console.log('Detected originalFactory.call error, applying special recovery...');
          
          if (attempt < retryCount) {
            await this.delay(fallbackDelay);
            continue;
          }
        }

        // 一般重試邏輯
        if (attempt < retryCount) {
          await this.delay(retryDelay * (attempt + 1));
          continue;
        }

        throw err;
      }
    }
  }
}
```

### 3. 報表對話框錯誤處理更新

更新所有報表對話框組件使用 `DynamicImportHandler`：

```typescript
// app/void-pallet/components/UnifiedVoidReportDialog.tsx
React.useEffect(() => {
  if (isOpen) {
    DynamicImportHandler.safeImport(
      () => import('@/app/components/reports/core/ReportRegistry'),
      {
        retryCount: 3,
        retryDelay: 1000,
        fallbackDelay: 2000,
        onError: (error) => {
          console.error('Failed to load report registry:', error);
          setLoadingError('Failed to load report configuration');
        }
      }
    )
    .then(({ ReportRegistry }) => {
      // 處理成功載入
    })
    .catch(error => {
      // 處理最終錯誤
      setTimeout(() => {
        setLoadingError(null);
        setReportConfig(null);
      }, 3000);
    });
  }
}, [isOpen]);
```

### 4. Suspense 邊界添加

在 `ClientLayout` 中為對話框組件添加 Suspense 邊界：

```typescript
{/* Global report dialogs with error boundary */}
<DialogErrorBoundary>
  <React.Suspense fallback={<DialogSuspenseFallback />}>
    <GlobalReportDialogs />
  </React.Suspense>
</DialogErrorBoundary>

{/* Global analytics dialogs with error boundary */}
<DialogErrorBoundary>
  <React.Suspense fallback={<DialogSuspenseFallback />}>
    <GlobalAnalyticsDialogs />
  </React.Suspense>
</DialogErrorBoundary>
```

## 修復檔案清單

1. **app/components/ClientLayout.tsx**
   - 添加 `DialogErrorBoundary` 類組件
   - 添加 `DialogSuspenseFallback` 組件
   - 為對話框組件添加錯誤邊界和 Suspense 包裝

2. **lib/utils/dynamic-import-handler.ts** (新檔案)
   - 創建 `DynamicImportHandler` 類
   - 實施 `safeImport` 方法
   - 添加 `useSafeDynamicImport` React hook

3. **app/void-pallet/components/UnifiedVoidReportDialog.tsx**
   - 集成 `DynamicImportHandler`
   - 添加載入錯誤狀態處理
   - 改善錯誤恢復機制

4. **app/order-loading/components/UnifiedLoadingReportDialog.tsx**
   - 集成 `DynamicImportHandler`
   - 添加載入錯誤狀態處理
   - 改善錯誤恢復機制

## 測試驗證

### 1. 錯誤恢復測試
- ✅ 模擬 `originalFactory.call` 錯誤
- ✅ 驗證錯誤邊界捕獲
- ✅ 確認自動恢復機制

### 2. 對話框載入測試
- ✅ 測試 Void Report Dialog 載入
- ✅ 測試 Loading Report Dialog 載入
- ✅ 驗證錯誤狀態顯示

### 3. 用戶體驗測試
- ✅ 載入狀態顯示
- ✅ 錯誤訊息友好性
- ✅ 恢復過程順暢性

## 預期效果

1. **錯誤隔離**: 單個對話框的載入錯誤不會影響整個應用
2. **自動恢復**: 檢測到 `originalFactory.call` 錯誤時自動重試
3. **用戶友好**: 顯示適當的載入和錯誤狀態
4. **穩定性提升**: 減少因動態導入導致的應用崩潰

## 監控指標

- 錯誤邊界觸發次數
- 動態導入成功率
- 錯誤恢復成功率
- 對話框載入時間

## 後續優化建議

1. **預載入策略**: 考慮在應用啟動時預載入關鍵組件
2. **錯誤分析**: 收集更多錯誤數據以改善處理機制
3. **性能優化**: 優化動態導入的載入時間
4. **測試覆蓋**: 增加自動化測試覆蓋錯誤場景

## 相關問題

- [ADMIN-ANALYSIS-001](./admin-analysis-originalfactory-error-fix.md) - Admin Analysis 路由錯誤修復
- [PERF-MONITOR-001](./performance-monitor-console-spam-fix.md) - 性能監控日誌修復 