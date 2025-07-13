# Performance Monitor Console Spam 修復

**問題編號**: PERF-MONITOR-001  
**日期**: 2025-01-13  
**狀態**: 已修復  
**優先級**: 中  
**相關問題**: ADMIN-ANALYSIS-001

## 問題描述

開發環境中出現大量的性能監控日誌輸出，導致：

```
[Warning] 4260 console messages are not shown.
[Log] [PerformanceMonitor] Recorded metrics for ordersList: – Object
[Log] [PerformanceMonitor] Recorded metrics for injectionProductionStats: – Object
[Log] [PerformanceMonitor] Recorded metrics for productionDetails: – Object
... (重複數千次)
```

**症狀**：
- 控制台被大量重複的性能監控日誌淹沒
- 瀏覽器性能下降
- 難以查看真正重要的錯誤訊息
- 出現 WebKit 內部錯誤：`Failed to load resource: WebKit發生內部錯誤 (__nextjs_original-stack-frames)`

**影響範圍**：
- 開發體驗差：控制台噪音過多
- 調試困難：重要訊息被掩蓋
- 瀏覽器性能：過多日誌影響性能

## 根本原因分析

### 1. 雙重性能監控實例
- `lib/widgets/performance-monitor.ts` - Widget 性能監控
- `lib/performance/PerformanceMonitor.ts` - 通用性能監控
- 兩個實例同時運行，導致重複記錄

### 2. 缺乏日誌控制
- 沒有日誌級別控制
- 沒有消息數量限制
- 沒有適當的節流機制

### 3. 開發環境配置問題
- Next.js 開發環境產生過多 stack frames
- 沒有針對開發環境的日誌優化

## 修復方案

### 1. 創建統一的性能監控配置
**新文件**: `lib/performance/config.ts`

```typescript
export interface PerformanceConfig {
  logging: {
    enabled: boolean;
    level: 'none' | 'error' | 'warn' | 'info' | 'debug';
    maxConsoleMessages: number;
  };
  thresholds: {
    loadTime: { warning: number; critical: number; };
    renderTime: { warning: number; critical: number; };
    dataFetchTime: { warning: number; critical: number; };
  };
  monitoring: {
    enabled: boolean;
    throttleInterval: number;
    maxMetrics: number;
    bufferSize: number;
  };
}

// 受控制的日誌函數
export const performanceLogger = {
  error: (message: string, ...args: any[]) => { /* 控制輸出 */ },
  warn: (message: string, ...args: any[]) => { /* 控制輸出 */ },
  info: (message: string, ...args: any[]) => { /* 控制輸出 */ },
  debug: (message: string, ...args: any[]) => { /* 控制輸出 */ },
};
```

### 2. 更新 Widget Performance Monitor
**文件**: `lib/widgets/performance-monitor.ts`

```typescript
import { performanceConfig, performanceLogger } from '../performance/config';

export class PerformanceMonitor {
  private readonly THROTTLE_INTERVAL = performanceConfig.monitoring.throttleInterval;

  recordMetrics(metrics: PerformanceMetrics): void {
    if (!performanceConfig.monitoring.enabled) {
      return;
    }

    // 節流控制
    const now = Date.now();
    const lastRecorded = this.lastRecordedTime.get(metrics.widgetId) || 0;
    if (now - lastRecorded < this.THROTTLE_INTERVAL) {
      return;
    }

    // 使用受控日誌
    const { thresholds } = performanceConfig;
    if (metrics.loadTime > thresholds.loadTime.critical) {
      performanceLogger.error(`Critical performance issue for ${metrics.widgetId}`);
    } else if (metrics.loadTime > thresholds.loadTime.warning) {
      performanceLogger.warn(`Performance warning for ${metrics.widgetId}`);
    }
  }
}
```

### 3. 更新通用 Performance Monitor
**文件**: `lib/performance/PerformanceMonitor.ts`

```typescript
import { performanceConfig, performanceLogger } from './config';

export class PerformanceMonitor extends EventEmitter {
  public recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>) {
    if (!this.isMonitoring || !performanceConfig.monitoring.enabled) return;

    // 限制緩衝區大小
    if (this.metricsBuffer.length > performanceConfig.monitoring.bufferSize) {
      this.metricsBuffer = this.metricsBuffer.slice(-performanceConfig.monitoring.bufferSize);
    }

    // 只記錄關鍵問題
    if (metric.value > threshold.critical) {
      performanceLogger.error(`Critical threshold exceeded: ${metric.name}`);
    }
  }
}
```

### 4. 優化 Next.js 開發環境配置
**文件**: `next.config.js`

```javascript
const nextConfig = {
  // 開發環境配置
  ...(process.env.NODE_ENV === 'development' && {
    // 減少開發環境的錯誤輸出
    devIndicators: {
      buildActivity: false,
    },
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        // 減少 source map 生成
        config.devtool = 'eval-cheap-module-source-map';
        
        // 減少不必要的錯誤輸出
        config.stats = {
          ...config.stats,
          errorDetails: false,
          warnings: false,
        };
      }
      return config;
    },
  }),
};
```

## 配置詳情

### 環境特定配置

#### 開發環境
- 日誌級別：`warn`
- 最大控制台訊息：100
- 節流間隔：2秒
- 最大指標記錄：1000

#### 生產環境
- 日誌級別：`error`
- 最大控制台訊息：10
- 節流間隔：5秒
- 最大指標記錄：100
- 監控：禁用

#### 測試環境
- 日誌級別：`none`
- 最大控制台訊息：0
- 監控：禁用

### 性能閾值
- **載入時間**：警告 2秒，嚴重 5秒
- **渲染時間**：警告 500ms，嚴重 1秒
- **數據獲取時間**：警告 1秒，嚴重 3秒

## 測試驗證

### 測試步驟
1. 啟動開發服務器
2. 訪問 `/admin/analysis` 頁面
3. 檢查控制台日誌數量
4. 驗證只有警告和錯誤被記錄
5. 確認日誌計數器限制生效

### 預期結果
- ✅ 控制台日誌大幅減少（從 4260+ 降至 <100）
- ✅ 只顯示重要的性能警告和錯誤
- ✅ 不再出現 WebKit 內部錯誤
- ✅ 瀏覽器性能改善

## 影響評估

### 正面影響
- **開發體驗改善**：清潔的控制台輸出
- **調試效率提升**：重要訊息不再被掩蓋
- **瀏覽器性能**：減少日誌輸出的性能開銷
- **系統穩定性**：避免日誌過多導致的問題

### 風險評估
- **極低風險**：主要是減少日誌輸出
- **向後兼容**：不影響現有功能
- **監控完整性**：重要的性能問題仍會被記錄

## 監控和維護

### 日誌計數器
- 每小時自動重置日誌計數器
- 可通過 `performanceLogger.getCount()` 檢查當前計數
- 可通過 `performanceLogger.resetCount()` 手動重置

### 配置調整
如需調整日誌級別或閾值，修改 `lib/performance/config.ts`：

```typescript
// 臨時啟用詳細日誌
process.env.NEXT_PUBLIC_DEBUG_PERFORMANCE = 'true';

// 或在配置中調整
const customConfig = {
  logging: { level: 'debug' },
  thresholds: { loadTime: { warning: 1000, critical: 3000 } }
};
```

## 相關問題

### 預防措施
1. **代碼審查**：確保新的監控代碼使用受控日誌
2. **性能測試**：定期檢查日誌輸出量
3. **配置管理**：統一使用 performanceConfig

### 後續改進
- 考慮添加日誌採樣機制
- 實現日誌輸出到文件而非控制台
- 添加性能監控儀表板

## 總結

通過創建統一的性能監控配置和受控日誌系統，成功解決了控制台日誌過多的問題：

1. **統一配置**：所有性能監控使用相同的配置
2. **受控日誌**：限制日誌數量和級別
3. **環境適配**：不同環境使用不同的日誌策略
4. **性能優化**：減少不必要的日誌輸出

這些修復大幅改善了開發體驗，讓開發者能夠專注於真正重要的問題。

---

**修復者**: Claude Assistant  
**審核者**: 待定  
**部署狀態**: 已部署到開發環境 