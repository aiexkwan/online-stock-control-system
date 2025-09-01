# ChatbotCard 記憶體管理指南

_創建日期: 2025-09-01_
_最後更新: 2025-09-01_

## 概述

本指南詳細說明了 ChatbotCard 系統中實施的全面記憶體洩漏預防機制。該系統確保應用程式在長期使用中保持穩定的記憶體使用，避免常見的記憶體洩漏問題。

## 🎯 主要目標

1. **零記憶體洩漏**：確保所有組件在卸載時完全清理
2. **自動化監控**：即時檢測和報告記憶體問題
3. **開發者友好**：提供清晰的調試工具和修復建議
4. **性能優化**：在記憶體管理和應用性能間取得平衡

## 🏗️ 系統架構

### 核心組件

```
記憶體管理系統
├── memoryManager.ts      # 記憶體監控和追蹤
├── useMemoryCleanup.ts   # 通用清理 Hook
├── leakDetector.ts       # 洩漏檢測工具
├── memoryGuard.ts        # 自動化守護系統
└── MemoryDashboard.tsx   # 開發者調試介面
```

### 整合點

1. **ChatbotCard 主組件**
   - 整合 `useMemoryCleanup` Hook
   - 註冊組件生命週期清理
   - 監控狀態管理系統

2. **子組件 (ChatMessages, ChatInput)**
   - 實施事件監聽器清理
   - 管理滾動和輸入事件
   - 優化渲染性能

3. **ServiceContext**
   - 服務容器資源管理
   - 依賴注入系統清理
   - 全局狀態清理

4. **狀態管理 Hooks**
   - useChatState 的清理機制
   - AbortController 整合
   - 定時器和 Promise 管理

## 🛠️ 使用方法

### 基本用法

```typescript
import { useMemoryCleanup } from '../hooks/useMemoryCleanup';

function MyComponent() {
  const memoryCleanup = useMemoryCleanup({
    componentName: 'MyComponent',
    enableMonitoring: true,
  });

  useEffect(() => {
    // 創建事件監聽器
    memoryCleanup.registerEventListener(window, 'resize', handleResize);

    // 創建定時器
    const timer = memoryCleanup.createTimer(() => {
      console.log('Timer tick');
    }, 1000, 'interval');

    // 創建 AbortController
    const controller = memoryCleanup.createAbortController();

    // 註冊 Promise
    const promise = memoryCleanup.registerPromise(
      fetch('/api/data', { signal: controller.signal }),
      () => console.log('Request cancelled')
    );

  }, []);

  return <div>My Component</div>;
}
```

### 高級用法

```typescript
// 自定義清理邏輯
memoryCleanup.registerCleanup(() => {
  // 清理複雜狀態
  clearComplexState();

  // 關閉 WebSocket 連接
  websocket.close();

  // 清理第三方庫
  thirdPartyLib.cleanup();
}, 'custom-cleanup');

// 條件式清理
memoryCleanup.registerCleanup(() => {
  if (shouldCleanup) {
    performCleanup();
  }
}, 'conditional-cleanup');
```

## 📊 監控工具

### MemoryDashboard 開發工具

在開發環境中，可以使用內建的記憶體監控儀表板：

```typescript
import MemoryDashboard from '../components/MemoryDashboard';

function App() {
  return (
    <>
      {/* 你的應用組件 */}
      <YourApp />

      {/* 開發環境記憶體監控 */}
      <MemoryDashboard
        position="bottom-right"
        visible={process.env.NODE_ENV === 'development'}
      />
    </>
  );
}
```

### 瀏覽器開發工具

在瀏覽器控制台中可以訪問以下全局對象：

- `window.__MEMORY_MANAGER__` - 記憶體管理器
- `window.__LEAK_DETECTOR__` - 洩漏檢測器
- `window.__MEMORY_GUARD__` - 記憶體守護器

```javascript
// 獲取記憶體報告
window.__MEMORY_MANAGER__.getMemoryReport();

// 立即執行洩漏檢測
window.__LEAK_DETECTOR__.detectNow();

// 查看修復建議
window.__MEMORY_GUARD__.getFixSuggestions();
```

## 🔧 配置選項

### MemoryManager 配置

```typescript
// 記憶體管理器會自動配置，但可以通過 API 調整
memoryManager.updateConfig({
  memoryThreshold: 100, // 記憶體閾值 (MB)
  enableMonitoring: true, // 是否啟用監控
  warningLevel: 'medium', // 警告級別
});
```

### LeakDetector 配置

```typescript
leakDetector.updateConfig({
  enabled: true,
  detectInterval: 10000, // 檢測間隔 (ms)
  memoryThreshold: 50, // 記憶體閾值 (MB)
  autoCleanup: false, // 自動清理
  showWarnings: true, // 顯示警告
});
```

### MemoryGuard 配置

```typescript
memoryGuard.updateConfig({
  enabled: true,
  strictModeDoubleCheck: true, // Strict Mode 雙重檢查
  autoFixLevel: 'medium', // 自動修復級別
  notifications: true, // 通知
  monitorInterval: 15000, // 監控間隔 (ms)
});
```

## 🚨 常見問題和解決方案

### 1. 事件監聽器洩漏

**問題**：組件卸載後事件監聽器仍然存在

**解決方案**：

```typescript
// ❌ 錯誤做法
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // 缺少清理函數
}, []);

// ✅ 正確做法
useEffect(() => {
  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);

// ✅ 使用 useMemoryCleanup Hook
const memoryCleanup = useMemoryCleanup();

useEffect(() => {
  memoryCleanup.registerEventListener(window, 'resize', handleResize);
}, []);
```

### 2. 定時器洩漏

**問題**：`setTimeout` 或 `setInterval` 未被清理

**解決方案**：

```typescript
// ❌ 錯誤做法
useEffect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);
  // 缺少清理
}, []);

// ✅ 正確做法
useEffect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);

  return () => {
    clearInterval(timer);
  };
}, []);

// ✅ 使用 useMemoryCleanup Hook
const memoryCleanup = useMemoryCleanup();

useEffect(() => {
  const timer = memoryCleanup.createTimer(
    () => {
      console.log('tick');
    },
    1000,
    'interval'
  );
}, []);
```

### 3. Promise 和異步操作洩漏

**問題**：組件卸載後 Promise 仍在執行

**解決方案**：

```typescript
// ❌ 錯誤做法
useEffect(() => {
  fetch('/api/data')
    .then(response => response.json())
    .then(data => {
      setState(data); // 可能在組件卸載後執行
    });
}, []);

// ✅ 正確做法
useEffect(() => {
  const abortController = new AbortController();

  fetch('/api/data', { signal: abortController.signal })
    .then(response => response.json())
    .then(data => {
      setState(data);
    })
    .catch(error => {
      if (error.name !== 'AbortError') {
        console.error(error);
      }
    });

  return () => {
    abortController.abort();
  };
}, []);

// ✅ 使用 useMemoryCleanup Hook
const memoryCleanup = useMemoryCleanup();

useEffect(() => {
  const controller = memoryCleanup.createAbortController();

  fetch('/api/data', { signal: controller.signal })
    .then(response => response.json())
    .then(data => setState(data));
}, []);
```

### 4. 狀態更新在卸載後的組件

**問題**：組件卸載後仍嘗試更新狀態

**解決方案**：

```typescript
// ✅ 使用 isMounted 標誌
useEffect(() => {
  let isMounted = true;

  fetchData().then(data => {
    if (isMounted) {
      setData(data);
    }
  });

  return () => {
    isMounted = false;
  };
}, []);

// ✅ 使用 AbortController
useEffect(() => {
  const controller = new AbortController();

  fetch('/api/data', { signal: controller.signal })
    .then(response => {
      if (!controller.signal.aborted) {
        return response.json();
      }
    })
    .then(data => {
      if (data && !controller.signal.aborted) {
        setData(data);
      }
    });

  return () => {
    controller.abort();
  };
}, []);
```

## 📈 性能最佳實踐

### 1. 記憶體監控

- 在開發環境啟用完整監控
- 生產環境使用輕量級監控
- 定期檢查記憶體報告

### 2. 組件優化

```typescript
// 使用 React.memo 防止不必要的重渲染
const OptimizedComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => {
    return expensiveProcess(data);
  }, [data]);

  return <div>{processedData}</div>;
});

// 正確的依賴數組
useEffect(() => {
  // 邏輯
}, [dependency1, dependency2]); // 確保依賴完整且正確
```

### 3. 大型數據處理

```typescript
// 使用虛擬化處理大列表
import { FixedSizeList as List } from 'react-window';

const LargeList = ({ items }) => (
  <List
    height={600}
    itemCount={items.length}
    itemSize={35}
  >
    {({ index, style }) => (
      <div style={style}>
        {items[index]}
      </div>
    )}
  </List>
);
```

## 🔍 調試技巧

### 1. React DevTools

使用 React DevTools Profiler 檢查：

- 組件渲染次數
- 記憶體使用情況
- 不必要的重渲染

### 2. Chrome DevTools

Memory 標籤中檢查：

- Heap snapshots
- 記憶體時間線
- 記憶體洩漏檢測

### 3. 控制台命令

```javascript
// 檢查記憶體使用
console.log(performance.memory);

// 觸發垃圾回收（如果可用）
if (window.gc) {
  window.gc();
}

// 檢查記憶體報告
window.__MEMORY_MANAGER__.getMemoryReport();
```

## 📚 額外資源

### React 相關

- [React 記憶體洩漏指南](https://react.dev/learn/you-might-not-need-an-effect#how-to-handle-the-effect-firing-twice-in-development)
- [useEffect 清理函數](https://react.dev/reference/react/useEffect#parameters)
- [React Strict Mode](https://react.dev/reference/react/StrictMode)

### JavaScript 記憶體管理

- [MDN - Memory Management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)
- [JavaScript 記憶體洩漏調試](https://developers.google.com/web/tools/chrome-devtools/memory-problems)

### 性能優化

- [React 性能優化](https://react.dev/learn/render-and-commit)
- [Web 性能最佳實practices](https://web.dev/performance/)

## 🚀 未來改進

1. **自動化測試**
   - 記憶體洩漏檢測測試
   - 性能回歸測試
   - 自動化修復驗證

2. **監控增強**
   - 實時記憶體圖表
   - 歷史趨勢分析
   - 告警系統

3. **AI 輔助**
   - 智能洩漏檢測
   - 自動化修復建議
   - 代碼分析

---

## 📞 支援

如有問題或需要協助，請：

1. 查看瀏覽器控制台的警告和錯誤
2. 使用內建的記憶體監控工具
3. 參考本指南的解決方案
4. 在開發環境中啟用詳細記錄

記住：良好的記憶體管理是應用程式穩定性和性能的基石！
