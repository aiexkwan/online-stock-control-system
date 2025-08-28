# StockTransferCard 性能優化總計劃

## 1. 總覽與目標

本文件旨在作為 `StockTransferCard` 組件性能優化工作的**單一事實來源 (Single Source of Truth)**。它整合了性能分析、優化策略、代碼實現範例以及測試驗證方案，以確保整個優化過程有據可依、目標明確、結果可衡量。

### 核心性能目標

- **重新渲染次數**: 減少 70%
- **記憶體使用**: 降低 40%
- **初始渲染時間**: 改善 30%
- **記憶體洩漏**: 完全消除
- **音效資源**: 確保 100% 正確清理

---

## 2. 性能瓶頸分析

當前的 `StockTransferCard` 組件存在以下主要性能問題：

- **狀態管理混亂**: 複雜的狀態同步邏輯、不穩定的 `useRef` 更新以及過長的依賴鏈導致了頻繁且不必要的重新渲染。
- **潛在記憶體洩漏**: 音效系統 (`AudioContext`) 和非同步數據請求 (`fetch`) 的資源清理機制不夠穩健，在組件頻繁交互或快速卸載時可能導致記憶體洩漏。
- **計算效率低下**: 組件內部存在重複的計算邏輯（如主題樣式、目標選項生成），增加了每次渲染的負擔。
- **API 調用冗餘**: 自動執行轉移操作的邏輯複雜，可能在特定條件下觸發重複的 API 調用。

---

## 3. 優化策略與實施方案

為了解決上述問題，我們將分階段實施以下四項優化策略。

### 3.1 方案一：狀態管理重構 (目標：減少 70% 重新渲染)

透過穩定化狀態和函數引用，切斷不必要的渲染鏈。

```typescript
// 1. 使用 useMemo 優化狀態提取，確保只有在 state 真正改變時才更新
const stableState = useMemo(() => {
  if (!stockTransferHook?.state) return null;
  return stockTransferHook.state;
}, [stockTransferHook?.state]);

// 2. 穩定化 actions 引用，防止作為 props 傳遞時觸發子組件渲染
const stableActions = useMemo(() => {
  return stockTransferHook?.actions || {};
}, [stockTransferHook?.actions]);

// 3. 使用 useCallback 包裹事件處理函數，並依賴穩定化的 state 和 actions
const handleDestinationChange = useCallback(
  (value: string | string[]) => {
    const stringValue = Array.isArray(value) ? value[0] : value;
    if (!stringValue || stringValue === stableState?.selectedDestination) return;

    stableActions.onDestinationChange?.(stringValue);
  },
  [stableState?.selectedDestination, stableActions]
);
```

### 3.2 方案二：記憶體洩漏防護 (目標：消除洩漏、降低 40% 記憶體增長)

強化非同步操作和 Web API 的資源清理機制。

#### AbortController 優化

在組件卸載或發起新請求時，中斷進行中的 `fetch` 操作。

```typescript
// loadTransferHistory 優化
const loadTransferHistory = useCallback(async (signal?: AbortSignal) => {
  if (!mountedRef.current || signal?.aborted) return;

  try {
    const history = await getTransferHistory(20);

    if (signal?.aborted || !mountedRef.current) return;

    setUiState(prev => ({ ...prev, transferHistory: history || [] }));
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return;

    console.error('Failed to load transfer history:', error);
  }
}, []);
```

#### 音效系統優化 (代碼實作範例)

重構 `useSoundFeedback` Hook，確保 `AudioContext` 和 `OscillatorNode` 等資源得到完全釋放。

```typescript
/**
 * useSoundFeedback 性能優化版本
 * 主要改進：
 * 1. 更強制的記憶體清理邏輯
 * 2. 防止記憶體洩漏的安全措施
 * 3. 優化音頻資源管理
 * 4. 減少不必要的重新創建
 */

'use client';

import { useCallback, useRef, useEffect, useMemo } from 'react';

interface SoundOptions {
  volume?: number;
  enabled?: boolean;
}

export function useSoundFeedback(options: SoundOptions = {}) {
  const { volume = 0.5, enabled = true } = options;

  const stableOptions = useMemo(() => ({ volume, enabled }), [volume, enabled]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || audioContextRef.current) return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    } catch (error) {
      console.warn('Failed to create AudioContext:', error);
    }

    const cleanup = () => {
      cleanupFunctionsRef.current.forEach(cleanupFn => {
        try {
          cleanupFn();
        } catch (error) {
          console.warn('Sound cleanup error:', error);
        }
      });
      cleanupFunctionsRef.current = [];

      if (audioContextRef.current) {
        try {
          if (audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
          }
        } catch (error) {
          console.warn('Failed to close AudioContext:', error);
        }
        audioContextRef.current = null;
      }
    };

    return cleanup;
  }, []);

  const playSound = useCallback(
    (soundConfig: {
      frequency: number[];
      durations: number[];
      volumeEnvelope: Array<{ time: number; volume: number }>;
      totalDuration: number;
    }) => {
      if (!stableOptions.enabled || !audioContextRef.current) return;

      const context = audioContextRef.current;
      if (context.state === 'suspended') {
        context.resume();
      }

      try {
        const oscillators: OscillatorNode[] = [];
        const gainNodes: GainNode[] = [];

        soundConfig.frequency.forEach(freq => {
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(context.destination);
          oscillators.push(oscillator);
          gainNodes.push(gainNode);
        });

        const now = context.currentTime;

        oscillators.forEach((osc, index) => {
          const freq = soundConfig.frequency[index] || soundConfig.frequency[0];
          osc.frequency.setValueAtTime(freq, now);
        });

        const gainNode = gainNodes[0];
        soundConfig.volumeEnvelope.forEach(point => {
          const volume = point.volume * stableOptions.volume;
          gainNode.gain.linearRampToValueAtTime(volume, now + point.time);
        });

        oscillators.forEach(osc => {
          osc.start(now);
          osc.stop(now + soundConfig.totalDuration);
        });

        const cleanup = () => {
          oscillators.forEach(osc => {
            try {
              osc.disconnect();
            } catch (e) {}
          });
          gainNodes.forEach(gain => {
            try {
              gain.disconnect();
            } catch (e) {}
          });
        };

        oscillators[0].onended = cleanup;
        cleanupFunctionsRef.current.push(cleanup);

        setTimeout(
          () => {
            const index = cleanupFunctionsRef.current.indexOf(cleanup);
            if (index > -1) {
              cleanupFunctionsRef.current.splice(index, 1);
              cleanup();
            }
          },
          (soundConfig.totalDuration + 0.1) * 1000
        );
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    },
    [stableOptions]
  );

  const playSuccess = useCallback(() => playSound(/* ...config... */), [playSound]);
  const playError = useCallback(() => playSound(/* ...config... */), [playSound]);
  // ... other sound effects

  return useMemo(() => ({ playSuccess, playError /* ... */ }), [playSuccess, playError /* ... */]);
}
```

### 3.3 方案三：計算性能優化 (目標：提升 85% 計算效率)

#### 主題計算優化

使用 `Map` 進行緩存，實現 O(1) 時間複雜度的查找，取代 `switch` 語句。

```typescript
const THEME_CACHE = new Map([
  [
    'Fold Mill',
    {
      /* theme object */
    },
  ],
  [
    'Production',
    {
      /* theme object */
    },
  ],
  // ... 其他主題
]);

const theme = useMemo(() => {
  return THEME_CACHE.get(state?.selectedDestination) || DEFAULT_THEME;
}, [state?.selectedDestination]);
```

#### 目標選項計算優化

預計算並緩存選項，避免在每次渲染時重新生成。

```typescript
const destinationOptionsCache = useMemo(() => {
  const cache = new Map<string, FormOption[]>();
  Object.keys(LOCATION_DESTINATIONS).forEach(location => {
    const options = (LOCATION_DESTINATIONS[location] || []).map(d => ({ value: d, label: d }));
    cache.set(location, options);
  });
  return cache;
}, []);

const destinationOptions = useMemo(() => {
  return destinationOptionsCache.get(state?.currentLocation) || [];
}, [destinationOptionsCache, state?.currentLocation]);
```

### 3.4 方案四：API 調用優化

簡化自動執行邏輯，使用 `useEffect` 監聽依賴變化，並增加執行鎖，防止重複調用。

```typescript
const [transferExecutionState, setTransferExecutionState] = useState({
  isExecuting: false,
  lastExecutedKey: '',
});

useEffect(() => {
  const transferKey = `${selectedPallet?.plt_num}-${selectedDestination}-${verifiedClockNumber}`;

  if (
    selectedPallet &&
    selectedDestination &&
    verifiedClockNumber &&
    !transferExecutionState.isExecuting &&
    transferExecutionState.lastExecutedKey !== transferKey
  ) {
    setTransferExecutionState({ isExecuting: true, lastExecutedKey: transferKey });

    executeStockTransfer(selectedPallet, selectedDestination, verifiedClockNumber).finally(() => {
      setTransferExecutionState(prev => ({ ...prev, isExecuting: false }));
    });
  }
}, [selectedPallet, selectedDestination, verifiedClockNumber, transferExecutionState]);
```

---

## 4. 測試與驗證方案

為確保優化達到預期效果，我們將採用手動和自動化相結合的方式進行測試。

### 4.1 渲染性能測試 (React DevTools Profiler)

- **測試場景**: 初始載入、選擇目標位置、輸入操作員、搜索托盤、執行轉移。
- **測量指標**: 初始渲染時間、重新渲染次數、各階段渲染耗時。
- **驗證工具**: 瀏覽器 React DevTools Profiler。

### 4.2 記憶體使用測試 (Chrome DevTools Memory Tab)

- **測試步驟**:
  1. 開啟記憶體監控。
  2. 重複執行核心操作（選擇、驗證、搜索、轉移、重置）50 次。
  3. 分析記憶體快照，檢查分離的 DOM 節點和堆積增長趨勢。
- **測量指標**: 記憶體增長率、是否存在記憶體洩漏。
- **檢測腳本**:
  ```javascript
  class MemoryLeakDetector {
    // ... (如 performance-testing-plan.md 中所示)
  }
  const detector = new MemoryLeakDetector();
  detector.startMonitoring();
  // 執行測試操作 5 分鐘後
  setTimeout(() => {
    detector.stopMonitoring();
    console.log('Memory Report:', detector.getReport());
  }, 300000);
  ```

### 4.3 音效系統性能測試

- **測試步驟**: 連續觸發音效播放 100 次。
- **測量指標**: `AudioContext` 實例數量是否唯一，`OscillatorNode` 是否在使用後被清理。
- **驗證腳本**:
  ```javascript
  class AudioResourceMonitor {
    // ... (如 performance-testing-plan.md 中所示)
  }
  const monitor = new AudioResourceMonitor();
  for (let i = 0; i < 100; i++) {
    setTimeout(() => {
      // 觸發音效播放
      console.log(`Test ${i + 1}:`, monitor.getResourceStatus());
    }, i * 100);
  }
  ```

### 4.4 API 調用效率測試

- **測試步驟**: 監控用戶完成一次完整轉移操作時的網絡請求。
- **測量指標**: 是否存在重複的 API 調用，請求響應時間是否過長 (>1000ms)。
- **監控腳本**:
  ```javascript
  const originalFetch = window.fetch;
  // ... (如 performance-testing-plan.md 中所示)
  ```

### 4.5 自動化性能測試

#### Lighthouse 測試

整合 Lighthouse 測試，確保核心 Web 指標達標。

```javascript
// lighthouse-performance-test.js
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
async function runLighthouseTest() {
  // ... (如 performance-testing-plan.md 中所示)
}
runLighthouseTest();
```

#### Jest 性能測試

編寫 Jest 測試用例，量化渲染時間和渲染次數，防止性能回歸。

```javascript
// __tests__/performance/StockTransferCard.performance.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import StockTransferCard from '../StockTransferCard';

describe('StockTransferCard Performance Tests', () => {
  test('should render within 100ms', async () => {
    performance.mark('render-start');
    render(<StockTransferCard />);
    performance.mark('render-end');
    performance.measure('render-time', 'render-start', 'render-end');
    const measure = performance.getEntriesByName('render-time')[0];
    expect(measure.duration).toBeLessThan(100);
  });

  // ... 其他測試用例
});
```

---

## 5. 成功標準

### 量化指標

- [ ] ✅ **重新渲染次數**: 減少 70%
- [ ] ✅ **記憶體使用**: 降低 40%
- [ ] ✅ **初始渲染時間**: 改善 30%
- [ ] ✅ **記憶體洩漏**: 無明顯記憶體洩漏跡象
- [ ] ✅ **音效資源**: `AudioContext` 實例唯一，`OscillatorNode` 正確清理

### 質化指標

- [ ] ✅ **用戶體驗**: 界面響應流暢，無卡頓現象
- [ ] ✅ **穩定性**: 音效播放穩定，無資源耗盡問題
- [ ] ✅ **設備效率**: 降低客戶端 CPU 和電池消耗

---

## 6. 實施順序

優化將按照以下順序分階段進行，每個階段完成後都會進行性能回歸測試。

1.  **第一階段**: 狀態管理重構 (最高優先級)
2.  **第二階段**: 記憶體洩漏防護
3.  **第三階段**: 計算性能優化
4.  **第四階段**: API 調用優化
