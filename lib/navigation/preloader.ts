/**
 * 智能預加載系統
 * 根據用戶行為預測並預加載下一步可能訪問的資源
 */

import { NavigationItem } from '@/config/navigation';
import { FREQUENT_PATHS } from '@/lib/constants/navigation-paths';

interface PredictedAction {
  path: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
}

interface UserBehavior {
  currentPath: string;
  visitHistory: string[];
  lastVisitTime: number;
  frequency: Map<string, number>;
}

// 保留舊的 UserBehaviorTracker 作為備份
class LegacyUserBehaviorTracker {
  private behaviors = new Map<string, UserBehavior>();
  private readonly HISTORY_LIMIT = 50;

  trackNavigation(userId: string, path: string): void {
    const behavior = this.behaviors.get(userId) || {
      currentPath: path,
      visitHistory: [] as string[],
      lastVisitTime: Date.now(),
      frequency: new Map<string, number>(),
    };

    // 更新歷史記錄
    behavior.visitHistory.push(path);
    if (behavior.visitHistory.length > this.HISTORY_LIMIT) {
      behavior.visitHistory.shift();
    }

    // 更新頻率
    const currentFreq = behavior.frequency.get(path) || 0;
    behavior.frequency.set(path, currentFreq + 1);

    behavior.currentPath = path;
    behavior.lastVisitTime = Date.now();

    this.behaviors.set(userId, behavior);
  }

  async predictNextActions(userId: string, currentPath: string): Promise<PredictedAction[]> {
    const behavior = this.behaviors.get(userId);
    if (!behavior) return [];

    const predictions: PredictedAction[] = [];

    // 分析歷史模式
    const patterns = this.analyzePatterns(behavior.visitHistory, currentPath);

    // 基於頻率的預測
    const frequencyPredictions = this.getFrequencyBasedPredictions(behavior.frequency, currentPath);

    // 基於時間的預測
    const timePredictions = this.getTimeBasedPredictions(behavior);

    // 合併預測結果
    const allPredictions = [...patterns, ...frequencyPredictions, ...timePredictions];

    // 去重並排序
    const uniquePredictions = this.deduplicateAndSort(allPredictions);

    return uniquePredictions.slice(0, 5); // 返回前5個預測
  }

  private analyzePatterns(history: string[], currentPath: string): PredictedAction[] {
    const predictions: PredictedAction[] = [];
    const patternMap = new Map<string, number>();

    // 尋找當前路徑後的常見模式
    for (let i = 0; i < history.length - 1; i++) {
      if (history[i] === currentPath) {
        const nextPath = history[i + 1];
        const count = patternMap.get(nextPath) || 0;
        patternMap.set(nextPath, count + 1);
      }
    }

    // 轉換為預測
    patternMap.forEach((count, path) => {
      predictions.push({
        path,
        confidence: Math.min(count / 10, 0.9), // 最高90%信心度
        priority: count > 5 ? 'high' : count > 2 ? 'medium' : 'low',
      });
    });

    return predictions;
  }

  private getFrequencyBasedPredictions(
    frequency: Map<string, number>,
    currentPath: string
  ): PredictedAction[] {
    const predictions: PredictedAction[] = [];
    const totalVisits = Array.from(frequency.values()).reduce((sum, count) => sum + count, 0);

    frequency.forEach((count, path) => {
      if (path !== currentPath && count > 2) {
        predictions.push({
          path,
          confidence: count / totalVisits,
          priority: count > 10 ? 'high' : 'medium',
        });
      }
    });

    return predictions;
  }

  private getTimeBasedPredictions(behavior: UserBehavior): PredictedAction[] {
    const predictions: PredictedAction[] = [];
    const currentHour = new Date().getHours();

    // 基於時間的常見模式 - v2.0.2: 更新為新主題
    const timePatterns: Record<string, string[]> = {
      morning: ['/admin/operations', '/stock-transfer'], // 早上常訪問的頁面
      afternoon: ['/order-loading', '/admin/analytics'], // 下午常訪問的頁面
      evening: ['/admin/data-management', '/admin/stock-count'], // 晚上常訪問的頁面
    };

    let timeOfDay: keyof typeof timePatterns;
    if (currentHour < 12) timeOfDay = 'morning';
    else if (currentHour < 18) timeOfDay = 'afternoon';
    else timeOfDay = 'evening';

    timePatterns[timeOfDay].forEach(path => {
      predictions.push({
        path,
        confidence: 0.6,
        priority: 'medium',
      });
    });

    return predictions;
  }

  private deduplicateAndSort(predictions: PredictedAction[]): PredictedAction[] {
    const uniqueMap = new Map<string, PredictedAction>();

    predictions.forEach(pred => {
      const existing = uniqueMap.get(pred.path);
      if (!existing || pred.confidence > existing.confidence) {
        uniqueMap.set(pred.path, pred);
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => b.confidence - a.confidence);
  }
}

export class NavigationPreloader {
  private preloadCache = new Map<string, Promise<void>>();
  private preloadQueue: string[] = [];
  private isPreloading = false;
  private lastPath: string | null = null;
  private pathStartTime: number = Date.now();

  async predictAndPreload(userId: string, currentPath: string): Promise<void> {
    // 計算在上一頁停留的時間
    const timeSpent = this.lastPath
      ? Math.floor((Date.now() - this.pathStartTime) / 1000)
      : undefined;

    // 簡單記錄導航（僅用於調試）
    console.debug(`Navigation: ${userId} -> ${currentPath} (${timeSpent}s)`);

    // 更新當前路徑和時間
    this.lastPath = currentPath;
    this.pathStartTime = Date.now();

    // 使用預定義的常用路徑進行預加載
    // 排除當前路徑，預加載前3個最常用的路徑
    const pathsToPreload = FREQUENT_PATHS
      .filter(path => path !== currentPath)
      .slice(0, 3);

    // 預加載常用路徑
    for (const path of pathsToPreload) {
      this.preloadResource(path);
    }

    // 處理預加載隊列
    this.processPreloadQueue();
  }

  private async preloadResource(path: string): Promise<void> {
    if (this.preloadCache.has(path)) return;

    const preloadPromise = this.createPreloadPromise(path);
    this.preloadCache.set(path, preloadPromise);

    // 設置超時清理
    setTimeout(
      () => {
        this.preloadCache.delete(path);
      },
      5 * 60 * 1000
    ); // 5分鐘後清理
  }

  private createPreloadPromise(path: string): Promise<void> {
    return new Promise(resolve => {
      // 使用 link prefetch 預加載頁面資源
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = path;
      link.onload = () => {
        resolve();
      };
      link.onerror = () => {
        resolve();
      };
      document.head.appendChild(link);

      // 同時預加載相關的 API 數據
      if (path.includes('/admin')) {
        this.prefetchApiData(path);
      }
    });
  }

  private async prefetchApiData(path: string): Promise<void> {
    // 根據路徑預加載相關 API 數據 - v2.0.2: 更新為新主題
    const apiEndpoints: Record<string, string[]> = {
      '/admin/operations': ['/api/warehouse/summary', '/api/warehouse/recent'],
      '/admin/analytics': ['/api/analytics/overview', '/api/analytics/trends'],
      '/admin/data-management': ['/api/reports/export-all', '/api/upload/status'],
      '/stock-transfer': ['/api/stock/locations', '/api/stock/available'],
    };

    const endpoints = apiEndpoints[path] || [];

    for (const endpoint of endpoints) {
      fetch(endpoint, {
        method: 'GET',
        headers: {
          'X-Prefetch': 'true', // 標記為預加載請求
        },
      }).catch(() => {
        // 忽略預加載錯誤
      });
    }
  }

  private queuePreload(path: string): void {
    if (!this.preloadQueue.includes(path)) {
      this.preloadQueue.push(path);
    }
  }

  private async processPreloadQueue(): Promise<void> {
    if (this.isPreloading || this.preloadQueue.length === 0) return;

    this.isPreloading = true;

    // 使用 requestIdleCallback 在空閒時處理隊列
    if ('requestIdleCallback' in window) {
      requestIdleCallback(async deadline => {
        while (deadline.timeRemaining() > 0 && this.preloadQueue.length > 0) {
          const path = this.preloadQueue.shift();
          if (path) {
            await this.preloadResource(path);
          }
        }
        this.isPreloading = false;

        // 如果還有剩餘，繼續處理
        if (this.preloadQueue.length > 0) {
          this.processPreloadQueue();
        }
      });
    } else {
      // 降級方案
      setTimeout(async () => {
        const path = this.preloadQueue.shift();
        if (path) {
          await this.preloadResource(path);
        }
        this.isPreloading = false;

        if (this.preloadQueue.length > 0) {
          this.processPreloadQueue();
        }
      }, 100);
    }
  }

  // 清理緩存
  clearCache(): void {
    this.preloadCache.clear();
    this.preloadQueue = [];
  }

  // 獲取預加載統計
  getStats(): {
    cacheSize: number;
    queueLength: number;
  } {
    return {
      cacheSize: this.preloadCache.size,
      queueLength: this.preloadQueue.length,
    };
  }

  // 預加載用戶數據（簡化版 - 無操作）
  async preloadUserData(userId: string): Promise<void> {
    // 簡化版：不需要預加載用戶歷史
    console.debug(`User data preload skipped for: ${userId}`);
  }
}

// 創建單例實例
export const navigationPreloader = new NavigationPreloader();
