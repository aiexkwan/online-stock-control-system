# StockTransferCard 性能測試與驗證方案

## 測試目標

驗證優化後的 StockTransferCard 組件性能改善程度，確保達到預期的性能提升指標。

## 性能測試指標

### 1. 渲染性能指標

#### React DevTools Profiler 測試
```bash
# 開發環境下運行
npm run dev

# 使用 React DevTools Profiler 測量：
# - 初始渲染時間
# - 重新渲染次數
# - 各個階段的渲染耗時
```

**測試場景**：
- 初始載入組件
- 選擇目標位置
- 輸入操作員號碼
- 搜索托盤
- 執行轉移操作

**預期改善**：
- 重新渲染次數：減少 70%
- 初始渲染時間：改善 30%

#### Core Web Vitals 測試
```javascript
// 在瀏覽器控制台中執行
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'largest-contentful-paint') {
      console.log('LCP:', entry.startTime);
    }
    if (entry.entryType === 'first-input') {
      console.log('FID:', entry.processingStart - entry.startTime);
    }
    if (entry.entryType === 'layout-shift') {
      console.log('CLS:', entry.value);
    }
  }
});

observer.observe({entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift']});
```

### 2. 記憶體使用測試

#### Chrome DevTools Memory Tab
```javascript
// 記憶體洩漏檢測腳本
class MemoryLeakDetector {
  constructor() {
    this.measurements = [];
    this.interval = null;
  }

  startMonitoring() {
    this.interval = setInterval(() => {
      if (performance.memory) {
        this.measurements.push({
          timestamp: Date.now(),
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        });
      }
    }, 1000);
  }

  stopMonitoring() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  getReport() {
    const initial = this.measurements[0];
    const final = this.measurements[this.measurements.length - 1];
    
    return {
      memoryGrowth: final.usedJSHeapSize - initial.usedJSHeapSize,
      averageMemoryUsage: this.measurements.reduce((sum, m) => sum + m.usedJSHeapSize, 0) / this.measurements.length,
      peakMemoryUsage: Math.max(...this.measurements.map(m => m.usedJSHeapSize)),
      measurements: this.measurements,
    };
  }
}

// 使用方法
const detector = new MemoryLeakDetector();
detector.startMonitoring();

// 執行測試操作 5 分鐘後
setTimeout(() => {
  detector.stopMonitoring();
  console.log('Memory Report:', detector.getReport());
}, 300000);
```

**測試步驟**：
1. 開始記憶體監控
2. 重複執行以下操作 50 次：
   - 選擇目標位置
   - 驗證操作員
   - 搜索托盤
   - 執行轉移
   - 重置狀態
3. 分析記憶體增長趨勢

**預期改善**：
- 記憶體增長率：降低 40%
- 無明顯記憶體洩漏跡象

### 3. 音效系統性能測試

#### AudioContext 資源管理測試
```javascript
// 音效資源監控
class AudioResourceMonitor {
  constructor() {
    this.audioContexts = new Set();
    this.oscillators = new Set();
    this.gainNodes = new Set();
  }

  trackAudioContext(context) {
    this.audioContexts.add(context);
    console.log('AudioContext created. Total:', this.audioContexts.size);
  }

  trackOscillator(oscillator) {
    this.oscillators.add(oscillator);
    oscillator.addEventListener('ended', () => {
      this.oscillators.delete(oscillator);
      console.log('Oscillator cleaned. Remaining:', this.oscillators.size);
    });
  }

  getResourceStatus() {
    return {
      audioContexts: this.audioContexts.size,
      oscillators: this.oscillators.size,
      gainNodes: this.gainNodes.size,
    };
  }

  cleanup() {
    this.audioContexts.forEach(ctx => {
      if (ctx.state !== 'closed') {
        ctx.close();
      }
    });
    this.audioContexts.clear();
    this.oscillators.clear();
    this.gainNodes.clear();
  }
}

// 測試音效播放 100 次
const monitor = new AudioResourceMonitor();
for (let i = 0; i < 100; i++) {
  setTimeout(() => {
    // 觸發音效播放
    document.querySelector('[data-testid="success-button"]')?.click();
    console.log(`Test ${i + 1}:`, monitor.getResourceStatus());
  }, i * 100);
}
```

### 4. API 調用效率測試

#### 網絡請求監控
```javascript
// 監控 API 調用
const originalFetch = window.fetch;
const apiCalls = [];

window.fetch = function(...args) {
  const startTime = performance.now();
  const url = args[0];
  
  return originalFetch.apply(this, args).then(response => {
    const endTime = performance.now();
    apiCalls.push({
      url,
      duration: endTime - startTime,
      status: response.status,
      timestamp: new Date().toISOString(),
    });
    
    console.log(`API Call: ${url} - ${endTime - startTime}ms`);
    return response;
  });
};

// 測試結束後分析
function analyzeApiCalls() {
  const duplicateCalls = apiCalls.reduce((acc, call) => {
    const key = `${call.url}-${call.timestamp.substring(0, 19)}`; // 按秒分組
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const duplicates = Object.entries(duplicateCalls).filter(([_, count]) => count > 1);
  
  return {
    totalCalls: apiCalls.length,
    averageResponseTime: apiCalls.reduce((sum, call) => sum + call.duration, 0) / apiCalls.length,
    duplicateCalls: duplicates,
    slowCalls: apiCalls.filter(call => call.duration > 1000),
  };
}
```

## 自動化測試腳本

### Lighthouse 性能測試
```javascript
// lighthouse-performance-test.js
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runLighthouseTest() {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance'],
    port: chrome.port,
  };

  const runnerResult = await lighthouse('http://localhost:3000/admin', options);
  
  const performanceScore = runnerResult.lhr.categories.performance.score * 100;
  const metrics = runnerResult.lhr.audits;

  console.log('Performance Score:', performanceScore);
  console.log('First Contentful Paint:', metrics['first-contentful-paint'].displayValue);
  console.log('Largest Contentful Paint:', metrics['largest-contentful-paint'].displayValue);
  console.log('Cumulative Layout Shift:', metrics['cumulative-layout-shift'].displayValue);

  await chrome.kill();
  
  return {
    score: performanceScore,
    fcp: metrics['first-contentful-paint'].numericValue,
    lcp: metrics['largest-contentful-paint'].numericValue,
    cls: metrics['cumulative-layout-shift'].numericValue,
  };
}

// 運行測試
runLighthouseTest().then(results => {
  console.log('Lighthouse Results:', results);
});
```

### Jest 性能測試
```javascript
// __tests__/performance/StockTransferCard.performance.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import StockTransferCard from '../StockTransferCard';

describe('StockTransferCard Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performance.clearMarks();
    performance.clearMeasures();
  });

  test('should render within 100ms', async () => {
    performance.mark('render-start');
    
    await act(async () => {
      render(<StockTransferCard />);
    });
    
    performance.mark('render-end');
    performance.measure('render-time', 'render-start', 'render-end');
    
    const measure = performance.getEntriesByName('render-time')[0];
    expect(measure.duration).toBeLessThan(100);
  });

  test('should not re-render unnecessarily', async () => {
    const renderSpy = jest.fn();
    const TestComponent = () => {
      renderSpy();
      return <StockTransferCard />;
    };

    const { rerender } = render(<TestComponent />);
    const initialRenderCount = renderSpy.mock.calls.length;

    // 觸發相同的 props 更新
    rerender(<TestComponent />);
    
    expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
  });

  test('should handle multiple rapid state changes efficiently', async () => {
    render(<StockTransferCard />);
    
    performance.mark('rapid-changes-start');
    
    // 快速觸發多個狀態變化
    for (let i = 0; i < 10; i++) {
      act(() => {
        fireEvent.click(screen.getByText('Fold Mill'));
        fireEvent.click(screen.getByText('Production'));
      });
    }
    
    performance.mark('rapid-changes-end');
    performance.measure('rapid-changes', 'rapid-changes-start', 'rapid-changes-end');
    
    const measure = performance.getEntriesByName('rapid-changes')[0];
    expect(measure.duration).toBeLessThan(500);
  });
});
```

## 測試執行計劃

### 第一階段：基準測試
1. 在優化前的版本上運行所有性能測試
2. 記錄基準性能數據
3. 識別主要性能瓶頸

### 第二階段：優化驗證
1. 應用性能優化
2. 重新運行所有性能測試
3. 對比優化前後的數據

### 第三階段：回歸測試
1. 確保功能完整性不受影響
2. 驗證用戶體驗改善
3. 檢查是否引入新的性能問題

## 成功標準

### 量化指標
- ✅ 重新渲染次數減少 70%
- ✅ 記憶體使用降低 40%
- ✅ 初始渲染時間改善 30%
- ✅ 無記憶體洩漏
- ✅ 音效資源正確清理

### 質化指標
- ✅ 用戶界面響應更流暢
- ✅ 減少卡頓現象
- ✅ 更穩定的音效播放
- ✅ 更好的電池使用效率

## 監控與持續改進

### 生產環境監控
```javascript
// 生產環境性能監控
if (typeof window !== 'undefined' && 'performance' in window) {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach(entry => {
      // 發送性能數據到監控系統
      fetch('/api/performance-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: entry.entryType,
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime,
          timestamp: Date.now(),
        }),
      });
    });
  });

  observer.observe({ entryTypes: ['measure', 'navigation'] });
}
```

### 定期性能審查
- 每月進行性能測試
- 監控性能回歸
- 識別新的優化機會
- 更新性能優化策略