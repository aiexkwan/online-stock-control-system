/**
 * 記憶體洩漏檢測工具 - leakDetector.ts
 *
 * 職責：
 * - 檢測 React 組件中的常見記憶體洩漏模式
 * - 分析記憶體使用趨勢和異常
 * - 提供自動化檢測和報告
 * - 整合開發工具和監控系統
 */

import { memoryManager, type MemoryLeakWarning } from './memoryManager';

// 洩漏檢測配置
export interface LeakDetectorConfig {
  /** 是否啟用檢測 */
  enabled: boolean;
  /** 檢測間隔（毫秒） */
  detectInterval: number;
  /** 記憶體使用閾值（MB） */
  memoryThreshold: number;
  /** 監聽器數量閾值 */
  listenerThreshold: number;
  /** 定時器數量閾值 */
  timerThreshold: number;
  /** Promise 數量閾值 */
  promiseThreshold: number;
  /** 是否自動清理檢測到的洩漏 */
  autoCleanup: boolean;
  /** 是否在控制台顯示警告 */
  showWarnings: boolean;
}

// 檢測結果
export interface DetectionResult {
  /** 檢測時間戳 */
  timestamp: number;
  /** 總體健康評分 (0-100) */
  healthScore: number;
  /** 檢測到的問題 */
  issues: LeakDetectionIssue[];
  /** 記憶體快照 */
  memorySnapshot: MemorySnapshot;
  /** 建議操作 */
  recommendations: string[];
}

// 洩漏檢測問題
export interface LeakDetectionIssue {
  type:
    | 'memory-leak'
    | 'listener-leak'
    | 'timer-leak'
    | 'promise-leak'
    | 'render-loop'
    | 'state-mutation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  description: string;
  evidence: any;
  solution: string;
}

// 記憶體快照
export interface MemorySnapshot {
  /** 總記憶體使用量（MB） */
  totalMemory: number;
  /** 組件數量 */
  componentCount: number;
  /** 活動監聽器數量 */
  activeListeners: number;
  /** 活動定時器數量 */
  activeTimers: number;
  /** 待處理 Promise 數量 */
  pendingPromises: number;
  /** 記憶體使用趨勢 */
  memoryTrend: 'increasing' | 'stable' | 'decreasing';
}

class LeakDetector {
  private static instance: LeakDetector;
  private config: LeakDetectorConfig;
  private detectionHistory: DetectionResult[] = [];
  private isRunning = false;
  private detectionTimer: NodeJS.Timeout | null = null;
  private memoryHistory: number[] = [];
  private componentRenderCounts = new Map<string, number>();

  private constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      detectInterval: 10000, // 10秒
      memoryThreshold: 50, // 50MB
      listenerThreshold: 15,
      timerThreshold: 8,
      promiseThreshold: 15,
      autoCleanup: false,
      showWarnings: true,
    };

    this.initializeDetection();
  }

  static getInstance(): LeakDetector {
    if (!LeakDetector.instance) {
      LeakDetector.instance = new LeakDetector();
    }
    return LeakDetector.instance;
  }

  /**
   * 更新檢測配置
   */
  updateConfig(newConfig: Partial<LeakDetectorConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.config.enabled && !this.isRunning) {
      this.startDetection();
    } else if (!this.config.enabled && this.isRunning) {
      this.stopDetection();
    } else if (this.isRunning) {
      // 重新啟動以應用新配置
      this.stopDetection();
      this.startDetection();
    }
  }

  /**
   * 初始化檢測系統
   */
  private initializeDetection(): void {
    if (!this.config.enabled || typeof window === 'undefined') return;

    // 監控組件渲染
    this.setupRenderTracking();

    // 監控頁面可見性變化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseDetection();
      } else {
        this.resumeDetection();
      }
    });

    // 啟動檢測
    this.startDetection();
  }

  /**
   * 設置渲染追蹤
   */
  private setupRenderTracking(): void {
    // 攔截 React 開發工具的渲染事件（如果可用）
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

      hook.onCommitFiberRoot = (id: any, root: any, ...args: any[]) => {
        // 分析 Fiber 樹來檢測渲染循環
        this.analyzeRenderPatterns(root);
      };
    }
  }

  /**
   * 分析渲染模式
   */
  private analyzeRenderPatterns(fiberRoot: any): void {
    // 遍歷 Fiber 樹並檢測異常渲染
    const traverse = (fiber: any, depth = 0) => {
      if (!fiber) return;

      if (fiber.type && fiber.type.name) {
        const componentName = fiber.type.name;
        const currentCount = this.componentRenderCounts.get(componentName) || 0;
        this.componentRenderCounts.set(componentName, currentCount + 1);

        // 檢測過度渲染
        if (currentCount > 100) {
          this.reportRenderLoop(componentName, currentCount);
        }
      }

      // 遞歸遍歷子節點
      if (fiber.child) traverse(fiber.child, depth + 1);
      if (fiber.sibling) traverse(fiber.sibling, depth);
    };

    if (fiberRoot && fiberRoot.current) {
      traverse(fiberRoot.current);
    }
  }

  /**
   * 報告渲染循環問題
   */
  private reportRenderLoop(componentName: string, renderCount: number): void {
    console.warn(
      `🔄 Render loop detected in ${componentName}: ${renderCount} renders. ` +
        'Check useEffect dependencies, state mutations, or prop changes.'
    );
  }

  /**
   * 啟動檢測
   */
  startDetection(): void {
    if (this.isRunning || !this.config.enabled) return;

    this.isRunning = true;
    this.detectionTimer = setInterval(() => {
      this.performDetection();
    }, this.config.detectInterval);

    if (this.config.showWarnings) {
      console.log('🔍 Memory leak detection started');
    }
  }

  /**
   * 停止檢測
   */
  stopDetection(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.detectionTimer) {
      clearInterval(this.detectionTimer);
      this.detectionTimer = null;
    }

    if (this.config.showWarnings) {
      console.log('⏹️ Memory leak detection stopped');
    }
  }

  /**
   * 暫停檢測
   */
  private pauseDetection(): void {
    if (this.detectionTimer) {
      clearInterval(this.detectionTimer);
      this.detectionTimer = null;
    }
  }

  /**
   * 恢復檢測
   */
  private resumeDetection(): void {
    if (this.isRunning && !this.detectionTimer) {
      this.detectionTimer = setInterval(() => {
        this.performDetection();
      }, this.config.detectInterval);
    }
  }

  /**
   * 執行檢測
   */
  private performDetection(): DetectionResult {
    const timestamp = Date.now();
    const memoryReport = memoryManager.getMemoryReport();
    const issues: LeakDetectionIssue[] = [];

    // 更新記憶體歷史
    this.memoryHistory.push(memoryReport.totalMemoryUsage);
    if (this.memoryHistory.length > 10) {
      this.memoryHistory = this.memoryHistory.slice(-10);
    }

    // 檢測記憶體洩漏
    this.detectMemoryLeaks(memoryReport, issues);

    // 檢測事件監聽器洩漏
    this.detectListenerLeaks(memoryReport, issues);

    // 檢測定時器洩漏
    this.detectTimerLeaks(memoryReport, issues);

    // 檢測 Promise 洩漏
    this.detectPromiseLeaks(memoryReport, issues);

    // 檢測狀態突變
    this.detectStateMutations(issues);

    // 計算健康評分
    const healthScore = this.calculateHealthScore(issues, memoryReport);

    // 創建記憶體快照
    const memorySnapshot = this.createMemorySnapshot(memoryReport);

    // 生成建議
    const recommendations = this.generateRecommendations(issues, memorySnapshot);

    const result: DetectionResult = {
      timestamp,
      healthScore,
      issues,
      memorySnapshot,
      recommendations,
    };

    // 保存檢測結果
    this.detectionHistory.push(result);
    if (this.detectionHistory.length > 20) {
      this.detectionHistory = this.detectionHistory.slice(-20);
    }

    // 報告結果
    this.reportDetectionResult(result);

    return result;
  }

  /**
   * 檢測記憶體洩漏
   */
  private detectMemoryLeaks(memoryReport: any, issues: LeakDetectionIssue[]): void {
    memoryReport.componentSummary.forEach((component: any) => {
      if (component.memoryUsage > this.config.memoryThreshold) {
        issues.push({
          type: 'memory-leak',
          severity: component.memoryUsage > this.config.memoryThreshold * 2 ? 'critical' : 'high',
          component: component.name,
          description: `Component is using ${component.memoryUsage}MB of memory`,
          evidence: {
            memoryUsage: component.memoryUsage,
            threshold: this.config.memoryThreshold,
            age: component.age,
          },
          solution: 'Review large objects, implement virtualization, or optimize data structures',
        });
      }
    });
  }

  /**
   * 檢測事件監聽器洩漏
   */
  private detectListenerLeaks(memoryReport: any, issues: LeakDetectionIssue[]): void {
    memoryReport.componentSummary.forEach((component: any) => {
      const listenerCount = component.activeTracking || 0;
      if (listenerCount > this.config.listenerThreshold) {
        issues.push({
          type: 'listener-leak',
          severity: listenerCount > this.config.listenerThreshold * 2 ? 'high' : 'medium',
          component: component.name,
          description: `Component has ${listenerCount} active event listeners`,
          evidence: {
            listenerCount,
            threshold: this.config.listenerThreshold,
          },
          solution: 'Ensure all event listeners are removed in useEffect cleanup functions',
        });
      }
    });
  }

  /**
   * 檢測定時器洩漏
   */
  private detectTimerLeaks(memoryReport: any, issues: LeakDetectionIssue[]): void {
    // 這裡需要更詳細的定時器追蹤，目前使用組件追蹤作為代理
    memoryReport.componentSummary.forEach((component: any) => {
      if (component.renderCount > 1000 && component.age < 60000) {
        // 1分鐘內超過1000次渲染
        issues.push({
          type: 'timer-leak',
          severity: 'high',
          component: component.name,
          description: `Suspected timer leak: ${component.renderCount} renders in ${Math.round(component.age / 1000)}s`,
          evidence: {
            renderCount: component.renderCount,
            age: component.age,
          },
          solution: 'Check for uncleaned intervals or recurring timeouts',
        });
      }
    });
  }

  /**
   * 檢測 Promise 洩漏
   */
  private detectPromiseLeaks(memoryReport: any, issues: LeakDetectionIssue[]): void {
    // Promise 洩漏通常表現為記憶體持續增長
    if (this.memoryHistory.length >= 3) {
      const recentMemory = this.memoryHistory.slice(-3);
      const isIncreasing = recentMemory.every((mem, i) => i === 0 || mem > recentMemory[i - 1]);

      if (isIncreasing && recentMemory[recentMemory.length - 1] > this.config.memoryThreshold) {
        issues.push({
          type: 'promise-leak',
          severity: 'medium',
          component: 'Multiple Components',
          description: 'Continuous memory growth detected, possible Promise leak',
          evidence: {
            memoryTrend: recentMemory,
            totalMemory: memoryReport.totalMemoryUsage,
          },
          solution: 'Implement proper Promise cancellation using AbortController',
        });
      }
    }
  }

  /**
   * 檢測狀態突變
   */
  private detectStateMutations(issues: LeakDetectionIssue[]): void {
    // 在生產環境中，我們可以檢測某些模式
    // 這是一個簡化版本
    this.componentRenderCounts.forEach((renderCount, componentName) => {
      if (renderCount > 500) {
        // 500次渲染閾值
        issues.push({
          type: 'render-loop',
          severity: renderCount > 1000 ? 'high' : 'medium',
          component: componentName,
          description: `Component has rendered ${renderCount} times`,
          evidence: {
            renderCount,
          },
          solution:
            'Check for state mutations, missing dependencies in hooks, or infinite re-renders',
        });

        // 重置計數以避免重複報告
        this.componentRenderCounts.set(componentName, 0);
      }
    });
  }

  /**
   * 計算健康評分
   */
  private calculateHealthScore(issues: LeakDetectionIssue[], memoryReport: any): number {
    let score = 100;

    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // 基於記憶體使用調整評分
    const memoryPenalty = Math.max(
      0,
      (memoryReport.totalMemoryUsage - this.config.memoryThreshold) / 10
    );
    score -= memoryPenalty;

    return Math.max(0, Math.round(score));
  }

  /**
   * 創建記憶體快照
   */
  private createMemorySnapshot(memoryReport: any): MemorySnapshot {
    const memoryTrend = this.calculateMemoryTrend();

    return {
      totalMemory: memoryReport.totalMemoryUsage,
      componentCount: memoryReport.totalComponents,
      activeListeners: memoryReport.componentSummary.reduce(
        (sum: number, comp: any) => sum + (comp.activeTracking || 0),
        0
      ),
      activeTimers: 0, // 需要更精確的追蹤
      pendingPromises: 0, // 需要更精確的追蹤
      memoryTrend,
    };
  }

  /**
   * 計算記憶體趨勢
   */
  private calculateMemoryTrend(): 'increasing' | 'stable' | 'decreasing' {
    if (this.memoryHistory.length < 3) return 'stable';

    const recent = this.memoryHistory.slice(-3);
    const isIncreasing = recent.every((mem, i) => i === 0 || mem >= recent[i - 1]);
    const isDecreasing = recent.every((mem, i) => i === 0 || mem <= recent[i - 1]);

    if (isIncreasing && !isDecreasing) return 'increasing';
    if (isDecreasing && !isIncreasing) return 'decreasing';
    return 'stable';
  }

  /**
   * 生成建議
   */
  private generateRecommendations(
    issues: LeakDetectionIssue[],
    snapshot: MemorySnapshot
  ): string[] {
    const recommendations: string[] = [];

    if (issues.some(i => i.type === 'memory-leak')) {
      recommendations.push('🧹 Consider implementing memory optimization techniques');
      recommendations.push('📊 Use React.memo and useMemo for expensive components');
    }

    if (issues.some(i => i.type === 'listener-leak')) {
      recommendations.push('👂 Audit all event listeners and ensure proper cleanup');
      recommendations.push('🛑 Use AbortController for better event management');
    }

    if (issues.some(i => i.type === 'timer-leak')) {
      recommendations.push('⏰ Review all setTimeout/setInterval usage');
      recommendations.push('🧹 Clear all timers in useEffect cleanup functions');
    }

    if (issues.some(i => i.type === 'promise-leak')) {
      recommendations.push('🎯 Implement proper Promise cancellation');
      recommendations.push('🛑 Use AbortController for async operations');
    }

    if (issues.some(i => i.type === 'render-loop')) {
      recommendations.push('🔄 Check useEffect dependencies and state updates');
      recommendations.push('⚡ Avoid state mutations and inline object/function creation');
    }

    if (snapshot.memoryTrend === 'increasing') {
      recommendations.push('📈 Monitor memory growth and implement cleanup strategies');
    }

    return recommendations;
  }

  /**
   * 報告檢測結果
   */
  private reportDetectionResult(result: DetectionResult): void {
    if (!this.config.showWarnings) return;

    const criticalIssues = result.issues.filter(i => i.severity === 'critical');
    const highIssues = result.issues.filter(i => i.severity === 'high');

    if (criticalIssues.length > 0) {
      console.error(
        `🚨 CRITICAL Memory Issues Detected (Health: ${result.healthScore}%):`,
        criticalIssues
      );
    } else if (highIssues.length > 0) {
      console.warn(`⚠️ High Priority Memory Issues (Health: ${result.healthScore}%):`, highIssues);
    } else if (result.healthScore < 80) {
      console.warn(
        `💛 Memory Health: ${result.healthScore}% - ${result.issues.length} issues detected`
      );
    }

    // 在健康評分很低時提供建議
    if (result.healthScore < 50 && result.recommendations.length > 0) {
      console.log('💡 Recommendations:', result.recommendations.slice(0, 3));
    }
  }

  /**
   * 獲取檢測歷史
   */
  getDetectionHistory(): DetectionResult[] {
    return [...this.detectionHistory];
  }

  /**
   * 獲取最新檢測結果
   */
  getLatestResult(): DetectionResult | null {
    return this.detectionHistory[this.detectionHistory.length - 1] || null;
  }

  /**
   * 立即執行檢測
   */
  detectNow(): DetectionResult {
    return this.performDetection();
  }

  /**
   * 重置檢測狀態
   */
  reset(): void {
    this.detectionHistory = [];
    this.memoryHistory = [];
    this.componentRenderCounts.clear();
  }

  /**
   * 獲取配置
   */
  getConfig(): LeakDetectorConfig {
    return { ...this.config };
  }
}

// 單例導出
export const leakDetector = LeakDetector.getInstance();

// 全局類型聲明
declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: any;
    __LEAK_DETECTOR__?: LeakDetector;
  }
}

// 在開發環境中暴露到 window 對象
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.__LEAK_DETECTOR__ = leakDetector;
}
