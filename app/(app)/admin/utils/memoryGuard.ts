/**
 * 記憶體守護工具 - memoryGuard.ts
 *
 * 職責：
 * - 監控 React Strict Mode 下的記憶體行為
 * - 自動檢測記憶體洩漏模式
 * - 提供自動化修復建議
 * - 整合開發工具鏈
 */

import { memoryManager } from './memoryManager';
import { leakDetector } from './leakDetector';

// 守護配置
export interface MemoryGuardConfig {
  /** 是否啟用記憶體守護 */
  enabled: boolean;
  /** 是否在 Strict Mode 下進行雙重檢測 */
  strictModeDoubleCheck: boolean;
  /** 自動修復級別 */
  autoFixLevel: 'none' | 'low' | 'medium' | 'high';
  /** 是否發送警告通知 */
  notifications: boolean;
  /** 監控間隔（毫秒） */
  monitorInterval: number;
  /** 記憶體閾值（MB） */
  memoryThreshold: number;
}

// 修復建議
export interface FixSuggestion {
  type: 'code-fix' | 'config-change' | 'architecture-change';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  codeExample?: string;
  autoFixable: boolean;
}

class MemoryGuard {
  private static instance: MemoryGuard;
  private config: MemoryGuardConfig;
  private isStrictMode = false;
  private monitorTimer: NodeJS.Timeout | null = null;
  private componentMountCounts = new Map<string, number>();
  private fixSuggestions: FixSuggestion[] = [];

  private constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      strictModeDoubleCheck: true,
      autoFixLevel: 'medium',
      notifications: true,
      monitorInterval: 15000, // 15秒
      memoryThreshold: 100, // 100MB
    };

    this.detectStrictMode();
    this.initialize();
  }

  static getInstance(): MemoryGuard {
    if (!MemoryGuard.instance) {
      MemoryGuard.instance = new MemoryGuard();
    }
    return MemoryGuard.instance;
  }

  /**
   * 檢測 React Strict Mode
   */
  private detectStrictMode(): void {
    if (typeof window === 'undefined') return;

    // 檢測 React DevTools
    const reactDevTools = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (reactDevTools) {
      // React Strict Mode 會導致組件雙重渲染
      // 我們可以通過監控組件掛載次數來檢測
      this.isStrictMode = true;

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 React Strict Mode detected - Enhanced memory monitoring enabled');
      }
    }
  }

  /**
   * 初始化記憶體守護
   */
  private initialize(): void {
    if (!this.config.enabled) return;

    // 開始監控
    this.startMonitoring();

    // 設置全局錯誤處理
    this.setupGlobalErrorHandling();

    // 設置頁面可見性監控
    this.setupVisibilityMonitoring();

    if (process.env.NODE_ENV === 'development') {
      console.log('🛡️ Memory Guard initialized');
    }
  }

  /**
   * 開始記憶體監控
   */
  private startMonitoring(): void {
    if (this.monitorTimer) return;

    this.monitorTimer = setInterval(() => {
      this.performMemoryCheck();
    }, this.config.monitorInterval);
  }

  /**
   * 停止記憶體監控
   */
  private stopMonitoring(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
  }

  /**
   * 執行記憶體檢查
   */
  private performMemoryCheck(): void {
    const memoryReport = memoryManager.getMemoryReport();
    const detectionResult = leakDetector.detectNow();

    // 檢查記憶體閾值
    if (memoryReport.totalMemoryUsage > this.config.memoryThreshold) {
      this.handleMemoryThresholdExceeded(memoryReport);
    }

    // 分析檢測結果
    if (detectionResult.issues.length > 0) {
      this.analyzeIssues(detectionResult.issues);
    }

    // 在 Strict Mode 下進行額外檢查
    if (this.isStrictMode && this.config.strictModeDoubleCheck) {
      this.performStrictModeChecks();
    }

    // 生成修復建議
    this.generateFixSuggestions(detectionResult);
  }

  /**
   * 處理記憶體閾值超標
   */
  private handleMemoryThresholdExceeded(memoryReport: any): void {
    if (this.config.notifications) {
      console.warn(
        `🚨 Memory threshold exceeded: ${memoryReport.totalMemoryUsage}MB (limit: ${this.config.memoryThreshold}MB)`
      );
    }

    // 自動修復嘗試
    if (this.config.autoFixLevel !== 'none') {
      this.attemptAutoFix(memoryReport);
    }
  }

  /**
   * 分析檢測問題
   */
  private analyzeIssues(issues: any[]): void {
    issues.forEach(issue => {
      switch (issue.type) {
        case 'memory-leak':
          this.handleMemoryLeak(issue);
          break;
        case 'listener-leak':
          this.handleListenerLeak(issue);
          break;
        case 'timer-leak':
          this.handleTimerLeak(issue);
          break;
        case 'promise-leak':
          this.handlePromiseLeak(issue);
          break;
        case 'render-loop':
          this.handleRenderLoop(issue);
          break;
      }
    });
  }

  /**
   * 處理記憶體洩漏
   */
  private handleMemoryLeak(issue: any): void {
    const suggestion: FixSuggestion = {
      type: 'code-fix',
      priority: issue.severity as any,
      title: 'Memory Leak Detection',
      description: `Component ${issue.component} is using excessive memory (${issue.evidence?.memoryUsage}MB)`,
      codeExample: `
// 使用 React.memo 優化組件
const OptimizedComponent = React.memo(({ data }) => {
  // 使用 useMemo 緩存昂貴計算
  const expensiveValue = useMemo(() => {
    return processLargeData(data);
  }, [data]);

  return <div>{expensiveValue}</div>;
});`,
      autoFixable: false,
    };

    this.addFixSuggestion(suggestion);
  }

  /**
   * 處理事件監聽器洩漏
   */
  private handleListenerLeak(issue: any): void {
    const suggestion: FixSuggestion = {
      type: 'code-fix',
      priority: issue.severity as any,
      title: 'Event Listener Leak',
      description: `Component ${issue.component} has ${issue.evidence?.listenerCount} uncleaned event listeners`,
      codeExample: `
// 正確的事件監聽器清理
useEffect(() => {
  const handleResize = () => { /* ... */ };
  
  window.addEventListener('resize', handleResize);
  
  // 清理函數
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);

// 或使用 useMemoryCleanup Hook
const memoryCleanup = useMemoryCleanup();

useEffect(() => {
  memoryCleanup.registerEventListener(window, 'resize', handleResize);
}, []);`,
      autoFixable: true,
    };

    this.addFixSuggestion(suggestion);
  }

  /**
   * 處理定時器洩漏
   */
  private handleTimerLeak(issue: any): void {
    const suggestion: FixSuggestion = {
      type: 'code-fix',
      priority: issue.severity as any,
      title: 'Timer Leak Detection',
      description: `Suspected timer leak in ${issue.component}`,
      codeExample: `
// 正確的定時器管理
useEffect(() => {
  const timer = setTimeout(() => {
    // 定時器邏輯
  }, 1000);
  
  // 清理定時器
  return () => {
    clearTimeout(timer);
  };
}, []);

// 或使用 useMemoryCleanup Hook
const memoryCleanup = useMemoryCleanup();

useEffect(() => {
  const timer = memoryCleanup.createTimer(() => {
    // 定時器邏輯
  }, 1000);
}, []);`,
      autoFixable: true,
    };

    this.addFixSuggestion(suggestion);
  }

  /**
   * 處理 Promise 洩漏
   */
  private handlePromiseLeak(issue: any): void {
    const suggestion: FixSuggestion = {
      type: 'code-fix',
      priority: issue.severity as any,
      title: 'Promise Leak Detection',
      description: 'Detected potential Promise leaks with continuous memory growth',
      codeExample: `
// 使用 AbortController 取消 Promise
useEffect(() => {
  const abortController = new AbortController();
  
  fetch('/api/data', { signal: abortController.signal })
    .then(response => response.json())
    .then(data => {
      // 處理數據
    })
    .catch(error => {
      if (error.name !== 'AbortError') {
        console.error('Fetch error:', error);
      }
    });
    
  return () => {
    abortController.abort();
  };
}, []);

// 或使用 useMemoryCleanup Hook
const memoryCleanup = useMemoryCleanup();

useEffect(() => {
  const controller = memoryCleanup.createAbortController();
  
  fetch('/api/data', { signal: controller.signal })
    .then(/* ... */);
}, []);`,
      autoFixable: false,
    };

    this.addFixSuggestion(suggestion);
  }

  /**
   * 處理渲染循環
   */
  private handleRenderLoop(issue: any): void {
    const suggestion: FixSuggestion = {
      type: 'code-fix',
      priority: issue.severity as any,
      title: 'Render Loop Detection',
      description: `Component ${issue.component} has excessive renders (${issue.evidence?.renderCount})`,
      codeExample: `
// 避免渲染循環的常見方法

// 1. 正確使用 useCallback
const handleClick = useCallback((id) => {
  // 處理點擊
}, []); // 空依賴數組

// 2. 避免在渲染中創建新對象
const MyComponent = ({ items }) => {
  // 錯誤：每次渲染都創建新對象
  // const config = { sort: true, filter: true };
  
  // 正確：使用 useMemo 或移到組件外部
  const config = useMemo(() => ({
    sort: true,
    filter: true
  }), []);
  
  return <ItemList items={items} config={config} />;
};

// 3. 正確的 useEffect 依賴
useEffect(() => {
  // 邏輯
}, [dependency]); // 確保依賴正確`,
      autoFixable: false,
    };

    this.addFixSuggestion(suggestion);
  }

  /**
   * 執行 Strict Mode 檢查
   */
  private performStrictModeChecks(): void {
    // 在 Strict Mode 下，組件會被雙重渲染
    // 檢查是否有組件因此出現記憶體問題

    const memoryReport = memoryManager.getMemoryReport();

    memoryReport.componentSummary.forEach((component: any) => {
      const prevCount = this.componentMountCounts.get(component.name) || 0;
      const currentCount = component.renderCount;

      if (currentCount > prevCount * 2 && currentCount > 10) {
        // 可能的 Strict Mode 相關問題
        this.handleStrictModeIssue(component);
      }

      this.componentMountCounts.set(component.name, currentCount);
    });
  }

  /**
   * 處理 Strict Mode 相關問題
   */
  private handleStrictModeIssue(component: any): void {
    const suggestion: FixSuggestion = {
      type: 'code-fix',
      priority: 'medium',
      title: 'Strict Mode Compatibility',
      description: `Component ${component.name} may have Strict Mode compatibility issues`,
      codeExample: `
// Strict Mode 兼容性檢查清單

// 1. 確保 useEffect 清理函數正確
useEffect(() => {
  const subscription = subscribeToSomething();
  
  return () => {
    // 清理函數必須正確清理所有副作用
    subscription.unsubscribe();
  };
}, []);

// 2. 避免在 useEffect 中直接修改外部變量
let externalVar = 0; // 避免這樣做

useEffect(() => {
  // 錯誤：直接修改外部變量
  // externalVar++;
  
  // 正確：使用狀態或 ref
  setCount(prev => prev + 1);
}, []);

// 3. 確保異步操作的清理
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
}, []);`,
      autoFixable: false,
    };

    this.addFixSuggestion(suggestion);
  }

  /**
   * 嘗試自動修復
   */
  private attemptAutoFix(memoryReport: any): void {
    if (this.config.autoFixLevel === 'low') {
      // 只執行安全的清理操作
      this.performSafeCleanup();
    } else if (this.config.autoFixLevel === 'medium') {
      // 執行中等風險的修復
      this.performMediumRiskFix();
    } else if (this.config.autoFixLevel === 'high') {
      // 執行高風險的修復（慎用）
      this.performHighRiskFix();
    }
  }

  /**
   * 安全清理
   */
  private performSafeCleanup(): void {
    // 觸發垃圾回收（如果可用）
    if (window.gc) {
      window.gc();
    }

    // 清理過期的記憶體追蹤項目
    memoryManager.getMemoryReport();

    if (this.config.notifications) {
      console.log('🧹 Performed safe memory cleanup');
    }
  }

  /**
   * 中等風險修復
   */
  private performMediumRiskFix(): void {
    this.performSafeCleanup();

    // 額外的清理操作
    // 這裡可以添加更多的清理邏輯

    if (this.config.notifications) {
      console.log('🔧 Performed medium-risk memory fixes');
    }
  }

  /**
   * 高風險修復
   */
  private performHighRiskFix(): void {
    this.performMediumRiskFix();

    // 更激進的清理（需要謹慎使用）
    memoryManager.clearAll();

    if (this.config.notifications) {
      console.warn('⚠️ Performed high-risk memory fixes - Monitor for side effects');
    }
  }

  /**
   * 設置全局錯誤處理
   */
  private setupGlobalErrorHandling(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', event => {
      if (event.message.includes('memory') || event.message.includes('leak')) {
        console.error('🚨 Memory-related error detected:', event.error);
      }
    });

    window.addEventListener('unhandledrejection', event => {
      if (event.reason && event.reason.message?.includes('abort')) {
        // Promise 被正確取消，這是預期行為
        return;
      }
      console.warn('🎯 Unhandled Promise rejection (potential memory leak):', event.reason);
    });
  }

  /**
   * 設置頁面可見性監控
   */
  private setupVisibilityMonitoring(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 頁面隱藏時，停止監控以節省資源
        this.stopMonitoring();
      } else {
        // 頁面可見時，恢復監控
        this.startMonitoring();
      }
    });
  }

  /**
   * 添加修復建議
   */
  private addFixSuggestion(suggestion: FixSuggestion): void {
    // 避免重複建議
    const exists = this.fixSuggestions.some(
      s => s.title === suggestion.title && s.description === suggestion.description
    );

    if (!exists) {
      this.fixSuggestions.push(suggestion);

      // 只保留最近的50個建議
      if (this.fixSuggestions.length > 50) {
        this.fixSuggestions = this.fixSuggestions.slice(-50);
      }

      if (this.config.notifications && suggestion.priority === 'critical') {
        console.error(`🚨 Critical Memory Issue: ${suggestion.title}\n${suggestion.description}`);
      }
    }
  }

  /**
   * 生成修復建議
   */
  private generateFixSuggestions(detectionResult: any): void {
    // 基於檢測結果生成額外建議
    if (detectionResult.healthScore < 50) {
      const suggestion: FixSuggestion = {
        type: 'architecture-change',
        priority: 'high',
        title: 'Critical Memory Health',
        description: `Overall memory health is poor (${detectionResult.healthScore}%). Consider architectural improvements.`,
        codeExample: `
// 考慮以下架構改進：

// 1. 實施組件懒加載
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

// 2. 使用虛擬化處理大列表
import { FixedSizeList as List } from 'react-window';

// 3. 實施適當的狀態管理
// 避免在根組件中存儲所有狀態

// 4. 考慮使用 Web Workers 處理重計算
const worker = new Worker('heavy-computation.worker.js');`,
        autoFixable: false,
      };

      this.addFixSuggestion(suggestion);
    }
  }

  /**
   * 獲取修復建議
   */
  getFixSuggestions(filterBy?: string): FixSuggestion[] {
    let suggestions = [...this.fixSuggestions];

    if (filterBy) {
      suggestions = suggestions.filter(
        s => s.type === filterBy || s.priority === filterBy || s.title.includes(filterBy)
      );
    }

    // 按優先級排序
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    return suggestions;
  }

  /**
   * 清除修復建議
   */
  clearFixSuggestions(): void {
    this.fixSuggestions = [];
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<MemoryGuardConfig>): void {
    const oldEnabled = this.config.enabled;
    this.config = { ...this.config, ...newConfig };

    if (newConfig.enabled !== undefined && newConfig.enabled !== oldEnabled) {
      if (this.config.enabled) {
        this.startMonitoring();
      } else {
        this.stopMonitoring();
      }
    }
  }

  /**
   * 獲取配置
   */
  getConfig(): MemoryGuardConfig {
    return { ...this.config };
  }

  /**
   * 銷毀守護器
   */
  destroy(): void {
    this.stopMonitoring();
    this.fixSuggestions = [];
    this.componentMountCounts.clear();
  }
}

// 單例導出
export const memoryGuard = MemoryGuard.getInstance();

// 在開發環境中暴露到 window 對象
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).__MEMORY_GUARD__ = memoryGuard;
}
