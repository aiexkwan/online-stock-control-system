# 智能載入管理系統 (Smart Loading Management System)

NewPennine 倉庫管理系統的統一智能載入解決方案，提供性能感知、自適應載入策略和全面的載入狀態管理。

## 🚀 核心特性

### 🧠 智能性能感知

- **網絡狀況檢測**: 自動檢測 2G/3G/4G 網絡類型和速度
- **設備性能評估**: 檢測設備記憶體、CPU 核心數等硬體規格
- **自適應載入策略**: 根據性能指標自動調整載入行為
- **動畫性能優化**: 低端設備自動簡化或禁用動畫

### ⚡ 載入優化策略

- **智能防抖**: 避免頻繁載入狀態切換，支援自適應防抖時間
- **超時管理**: 自動載入超時檢測和重試機制
- **最小顯示時間**: 避免載入狀態閃爍
- **指數退避重試**: 智能重試策略，逐步增加重試間隔

### 🎨 豐富的載入組件

- **AdaptiveSkeletonLoader**: 適應性骨架載入器，支援多種類型和複雜度
- **SmartLoadingSpinner**: 智能載入旋轉器，多種動畫變體
- **ProgressIndicator**: 進度指示器，支援線性、圓形、步驟式
- **LoadingOverlay**: 載入遮罩，全螢幕或容器級

### 🔧 開發者友好

- **統一 API**: 一致的 Hook 和組件接口
- **TypeScript 完整支援**: 完整的類型定義和智能提示
- **性能監控整合**: 與現有性能監控系統無縫整合
- **向後兼容**: 與現有載入組件保持兼容

## 📦 安裝和設置

### 1. 基本設置

```tsx
// app/layout.tsx 或主應用入口
import { LoadingProvider } from '@/lib/loading';

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body>
        <LoadingProvider enablePerformanceAware={true} enableAutoCleanup={true}>
          {children}
        </LoadingProvider>
      </body>
    </html>
  );
}
```

### 2. 基本使用

```tsx
// 組件中使用基本載入狀態
import { useLoading } from '@/lib/loading';

function MyComponent() {
  const { isLoading, startLoading, stopLoading, updateProgress } = useLoading({
    id: 'my-component-loading',
    type: 'component',
  });

  const handleAction = async () => {
    startLoading('處理中...');
    try {
      await someAsyncOperation();
      stopLoading();
    } catch (error) {
      setError('操作失敗');
    }
  };

  return (
    <div>
      <button onClick={handleAction} disabled={isLoading}>
        {isLoading ? '處理中...' : '開始操作'}
      </button>
    </div>
  );
}
```

## 🎯 核心 Hooks

### useLoading - 基礎載入 Hook

```tsx
import { useLoading } from '@/lib/loading';

const {
  isLoading, // 載入狀態
  progress, // 載入進度 (0-100)
  text, // 載入文字
  error, // 錯誤訊息
  startLoading, // 開始載入
  stopLoading, // 結束載入
  updateProgress, // 更新進度
  updateText, // 更新文字
  setError, // 設置錯誤
} = useLoading({
  id: 'unique-id',
  type: 'component', // 'page' | 'component' | 'data' | 'api' | 'widget' | 'image' | 'background'
  priority: 'medium', // 'low' | 'medium' | 'high' | 'critical'
  autoStart: false,
});
```

### useSmartLoading - 智能性能感知載入

```tsx
import { useSmartLoading } from '@/lib/loading';

const {
  isLoading,
  startLoading,
  stopLoading,
  // 智能載入特有功能
  performanceMetrics, // 性能指標
  adaptiveConfig, // 適應性配置
  estimatedLoadTime, // 預估載入時間
  networkStatus, // 網絡狀態: 'fast' | 'slow' | 'unknown'
  deviceStatus, // 設備狀態: 'high-end' | 'low-end' | 'unknown'
  refreshPerformanceMetrics, // 刷新性能指標
} = useSmartLoading({
  id: 'smart-loading',
  type: 'widget',
  enablePerformanceAware: true,
  enableNetworkMonitoring: true,
});
```

### useLoadingTimeout - 超時管理載入

```tsx
import { useLoadingTimeout } from '@/lib/loading';

const {
  isLoading,
  startLoading, // 返回 Promise
  stopLoading,
  // 超時管理特有功能
  isTimedOut, // 是否已超時
  currentAttempt, // 當前嘗試次數
  maxAttempts, // 最大嘗試次數
  timeRemaining, // 剩餘時間
  retry, // 手動重試
  cancel, // 取消載入
} = useLoadingTimeout({
  id: 'timeout-loading',
  timeout: 10000, // 10 秒超時
  retryCount: 3, // 重試 3 次
  retryDelay: 1000, // 重試間隔 1 秒
  exponentialBackoff: true,
});
```

## 🎨 智能載入組件

### AdaptiveSkeletonLoader - 適應性骨架載入器

```tsx
import { AdaptiveSkeletonLoader } from '@/lib/loading';

// 基本使用
<AdaptiveSkeletonLoader
  type="card"           // 'text' | 'avatar' | 'card' | 'list' | 'table' | 'chart'
  rows={3}
  size="md"
  isLoading={isLoading}
  enablePerformanceAware={true}
/>

// 預設變體
<CardSkeleton isLoading={isLoading} />
<TextSkeleton rows={5} isLoading={isLoading} />
<TableSkeleton isLoading={isLoading} />
<ChartSkeleton height="lg" isLoading={isLoading} />
```

### SmartLoadingSpinner - 智能載入旋轉器

```tsx
import { SmartLoadingSpinner } from '@/lib/loading';

<SmartLoadingSpinner
  variant="default"     // 'default' | 'dots' | 'bars' | 'ring' | 'pulse'
  theme="primary"       // 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size="md"
  text="載入中..."
  progress={progress}
  isLoading={isLoading}
  enablePerformanceAware={true}
/>

// 專用旋轉器
<ApiSpinner isLoading={isLoading} />
<PageSpinner isLoading={isLoading} />
<WidgetSpinner isLoading={isLoading} />
```

### ProgressIndicator - 進度指示器

```tsx
import { ProgressIndicator } from '@/lib/loading';

// 線性進度條
<ProgressIndicator
  type="linear"
  progress={progress}
  showPercentage={true}
  text="上傳中..."
  theme="primary"
/>

// 圓形進度條
<CircularProgress
  progress={progress}
  circularSize={120}
  showPercentage={true}
/>

// 步驟進度
<StepProgress
  steps={['上傳', '處理', '完成']}
  currentStep={currentStep}
  showSteps={true}
/>
```

### LoadingOverlay - 載入遮罩

```tsx
import { LoadingOverlay } from '@/lib/loading';

<LoadingOverlay
  isLoading={isLoading}
  fullscreen={true}
  variant="spinner"     // 'spinner' | 'progress' | 'custom'
  theme="dark"          // 'dark' | 'light' | 'glass'
  cancellable={true}
  onCancel={() => setLoading(false)}
  text="正在處理您的請求..."
  progress={progress}
/>

// 專用遮罩
<PageLoadingOverlay isLoading={isLoading} />
<CancellableOverlay isLoading={isLoading} onCancel={handleCancel} />
```

## 🔧 進階使用

### 批量載入管理

```tsx
import { useBatchLoading } from '@/lib/loading';

const {
  hooks, // 個別載入 Hook 陣列
  isAnyLoading, // 任何一個正在載入
  isAllLoading, // 全部都在載入
  totalProgress, // 總進度
  startAll, // 開始全部載入
  stopAll, // 停止全部載入
  errors, // 錯誤列表
} = useBatchLoading(['widget-1', 'widget-2', 'widget-3'], 'widget');
```

### 自定義載入策略

```tsx
import { useLoading } from '@/lib/loading';

const loading = useLoading({
  id: 'custom-loading',
  type: 'api',
  strategy: {
    debounceTime: 500, // 防抖時間
    timeout: 20000, // 超時時間
    minShowTime: 300, // 最小顯示時間
    useSkeleton: true, // 使用骨架屏
    showProgress: true, // 顯示進度
    retryCount: 5, // 重試次數
    performanceAware: true, // 性能感知
  },
});
```

### 性能監控整合

```tsx
import { useSmartLoading } from '@/lib/loading';

const { performanceMetrics, adaptiveConfig } = useSmartLoading({
  id: 'monitored-loading',
  type: 'component',
});

// 性能指標包含：
// - networkType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown'
// - downlink: 下行速度 (Mbps)
// - rtt: 往返時間 (ms)
// - deviceMemory: 設備記憶體 (GB)
// - hardwareConcurrency: CPU 核心數
// - isLowEndDevice: 是否低端設備
// - isSlowNetwork: 是否慢速網絡
```

## 🎯 最佳實踐

### 1. 載入 ID 命名規範

```tsx
// 好的命名
useLoading({ id: 'dashboard-widget-inventory' });
useLoading({ id: 'api-fetch-user-profile' });
useLoading({ id: 'page-loading-admin-dashboard' });

// 避免的命名
useLoading({ id: 'loading1' });
useLoading({ id: 'temp' });
```

### 2. 載入類型選擇

```tsx
// 頁面級載入
useLoading({ type: 'page' }); // 長時間載入，顯示進度

// API 請求
useLoading({ type: 'api' }); // 短暫載入，簡單指示器

// Widget 載入
useLoading({ type: 'widget' }); // 中等載入，使用骨架屏

// 背景任務
useLoading({ type: 'background' }); // 低優先級，不阻塞 UI
```

### 3. 性能優化建議

```tsx
// 低端設備優化
const { deviceStatus } = useSmartLoading({ id: 'example' });

if (deviceStatus === 'low-end') {
  // 使用簡化的載入指示器
  return <SimpleSpinner />;
} else {
  // 使用完整功能的載入組件
  return <AdaptiveSkeletonLoader type='detailed' />;
}
```

### 4. 錯誤處理

```tsx
const { isLoading, error, setError, retry } = useLoadingTimeout({
  id: 'error-handling-example',
  timeout: 10000,
  retryCount: 3,
  onTimeout: attempt => {
    console.log(`載入超時，第 ${attempt} 次嘗試`);
  },
  onFinalFailure: error => {
    // 記錄最終失敗
    logger.error('載入最終失敗', { error });
  },
});

if (error) {
  return (
    <div className='error-state'>
      <p>載入失敗: {error}</p>
      <button onClick={retry}>重試</button>
    </div>
  );
}
```

## 🔄 與現有系統整合

### useUnifiedAPI 整合

```tsx
import { useUnifiedAPI } from '@/app/admin/hooks/useUnifiedAPI';
import { useLoading } from '@/lib/loading';

function DataComponent() {
  const { startLoading, stopLoading, updateProgress } = useLoading({
    id: 'unified-api-loading',
    type: 'api',
  });

  const { data, loading, error } = useUnifiedAPI({
    restEndpoint: '/api/data',
    onCompleted: () => stopLoading(),
    onError: () => stopLoading(),
  });

  useEffect(() => {
    if (loading) {
      startLoading('載入數據...');
    }
  }, [loading, startLoading]);

  return <AdaptiveSkeletonLoader type='card' isLoading={loading} enablePerformanceAware={true} />;
}
```

### Widget 系統整合

```tsx
// Widget 組件中的載入狀態
import { useWidgetLoading } from '@/lib/loading';

function InventoryWidget({ widgetId }) {
  const { isLoading, startLoading, stopLoading } = useWidgetLoading(widgetId, 'medium');

  // Widget 載入邏輯...

  return (
    <div className='widget-container'>
      <AdaptiveSkeletonLoader type='chart' isLoading={isLoading} enablePerformanceAware={true} />
    </div>
  );
}
```

## 📊 性能監控

智能載入系統提供詳細的性能監控數據：

```tsx
import { useSmartLoading } from '@/lib/loading';

function MonitoredComponent() {
  const { performanceMetrics, estimatedLoadTime, adaptiveConfig } = useSmartLoading({
    id: 'monitored-component',
    enablePerformanceAware: true,
    enableNetworkMonitoring: true,
  });

  // 性能數據可用於分析和優化
  useEffect(() => {
    if (performanceMetrics) {
      // 發送到分析服務
      analytics.track('loading_performance', {
        networkType: performanceMetrics.networkType,
        deviceMemory: performanceMetrics.deviceMemory,
        estimatedTime: estimatedLoadTime,
      });
    }
  }, [performanceMetrics, estimatedLoadTime]);
}
```

## 🚨 注意事項

1. **記憶體管理**: LoadingProvider 會自動清理過期的載入狀態
2. **性能影響**: 性能檢測功能可在需要時禁用
3. **網絡監控**: 僅在支援的瀏覽器中啟用網絡監控
4. **向後兼容**: 現有載入組件繼續正常工作

## 🔗 相關文檔

- [NewPennine 架構指南](../../../CLAUDE.md)
- [性能監控系統](../performance/README.md)
- [統一組件系統](../design-system/README.md)
- [無障礙性系統](../accessibility/README.md)
