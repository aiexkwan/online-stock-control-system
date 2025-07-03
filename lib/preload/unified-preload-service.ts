/**
 * 統一預加載服務
 * 整合導航預加載、緩存預熱和行為預測
 * 優化現有功能，避免冗餘代碼
 */

import { navigationPreloader } from '@/lib/navigation/preloader';
import { cacheWarmupManager } from '@/lib/graphql/cache-warmup-strategy';
import { enhancedBehaviorTracker } from '@/lib/navigation/behavior-tracker';
import { logger } from '@/lib/logger';
import { unifiedDataLayer } from '@/lib/graphql/unified-data-layer';

interface PreloadConfig {
  enableNavigation: boolean;
  enableCacheWarmup: boolean;
  enableGraphQLPreload: boolean;
  confidenceThreshold: number;
  maxConcurrentPreloads: number;
  preloadDelay: number;
  priorityWeights: {
    userBehavior: number;
    businessCritical: number;
    timeOfDay: number;
  };
}

interface PreloadTask {
  id: string;
  type: 'navigation' | 'graphql' | 'cache';
  priority: number;
  confidence: number;
  data: any;
  timestamp: number;
}

interface PreloadResult {
  taskId: string;
  success: boolean;
  duration: number;
  error?: string;
}

interface Prediction {
  type: 'navigation' | 'business' | 'time';
  weight: number;
  path: string;
  probability?: number;
  confidence?: number;
  visitCount?: number;
  description?: string;
  dataPattern?: string;
}

export class UnifiedPreloadService {
  private config: PreloadConfig = {
    enableNavigation: true,
    enableCacheWarmup: true,
    enableGraphQLPreload: true,
    confidenceThreshold: 0.7,
    maxConcurrentPreloads: 5,
    preloadDelay: 100,
    priorityWeights: {
      userBehavior: 0.5,
      businessCritical: 0.3,
      timeOfDay: 0.2,
    },
  };
  
  private preloadQueue: PreloadTask[] = [];
  private activePreloads = new Set<string>();
  private preloadHistory = new Map<string, PreloadResult[]>();
  private isProcessing = false;
  
  constructor(config?: Partial<PreloadConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // 初始化定期處理隊列
    setInterval(() => this.processQueue(), 1000);
  }
  
  /**
   * 統一預加載入口
   */
  async preloadForUser(userId: string, currentPath: string): Promise<void> {
    try {
      // 1. 獲取用戶行為預測
      const predictions = await this.getPredictions(userId, currentPath);
      
      // 2. 生成預加載任務
      const tasks = await this.generatePreloadTasks(predictions, userId);
      
      // 3. 加入隊列
      this.enqueueTasksWithPriority(tasks);
      
      // 4. 立即處理高優先級任務
      await this.processHighPriorityTasks();
      
    } catch (error) {
      logger.error('預加載失敗:', error);
    }
  }
  
  /**
   * 獲取綜合預測
   */
  private async getPredictions(userId: string, currentPath: string): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    
    // 1. 用戶行為預測 (使用現有 behavior tracker)
    if (this.config.enableNavigation) {
      const behaviorPredictions = await enhancedBehaviorTracker.predictNextPaths(userId);
      predictions.push(...behaviorPredictions.map(p => ({
        ...p,
        type: 'navigation' as const,
        weight: this.config.priorityWeights.userBehavior,
      })));
    }
    
    // 2. 業務關鍵數據預測
    const businessCriticalPaths = this.getBusinessCriticalPaths(currentPath);
    predictions.push(...businessCriticalPaths.map(p => ({
      ...p,
      type: 'business' as const,
      weight: this.config.priorityWeights.businessCritical,
    })));
    
    // 3. 時間相關預測
    const timeBasedPredictions = this.getTimeBasedPredictions();
    predictions.push(...timeBasedPredictions.map(p => ({
      ...p,
      type: 'time' as const,
      weight: this.config.priorityWeights.timeOfDay,
    })));
    
    // 計算綜合分數並排序
    return predictions
      .map(p => ({
        ...p,
        finalScore: (p.probability || p.confidence || 0.5) * p.weight,
      }))
      .filter(p => p.finalScore >= this.config.confidenceThreshold)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 10); // 取前10個預測
  }
  
  /**
   * 生成預加載任務
   */
  private async generatePreloadTasks(predictions: any[], userId: string): Promise<PreloadTask[]> {
    const tasks: PreloadTask[] = [];
    
    for (const prediction of predictions) {
      // 導航預加載任務
      if (prediction.type === 'navigation' && this.config.enableNavigation) {
        tasks.push({
          id: `nav_${prediction.path}_${Date.now()}`,
          type: 'navigation',
          priority: prediction.finalScore * 100,
          confidence: prediction.probability || prediction.confidence,
          data: { path: prediction.path, userId },
          timestamp: Date.now(),
        });
      }
      
      // GraphQL 查詢預加載
      if (this.config.enableGraphQLPreload) {
        const queries = this.getQueriesForPath(prediction.path || prediction.dataPattern);
        queries.forEach(query => {
          tasks.push({
            id: `gql_${query.name}_${Date.now()}`,
            type: 'graphql',
            priority: prediction.finalScore * 90,
            confidence: prediction.finalScore,
            data: { query: query.query, variables: query.variables },
            timestamp: Date.now(),
          });
        });
      }
      
      // 緩存預熱任務
      if (prediction.dataPattern && this.config.enableCacheWarmup) {
        tasks.push({
          id: `cache_${prediction.dataPattern}_${Date.now()}`,
          type: 'cache',
          priority: prediction.finalScore * 80,
          confidence: prediction.finalScore,
          data: { pattern: prediction.dataPattern, ttl: prediction.ttlSeconds },
          timestamp: Date.now(),
        });
      }
    }
    
    return tasks;
  }
  
  /**
   * 業務關鍵路徑預測
   */
  private getBusinessCriticalPaths(currentPath: string) {
    const criticalPaths = [
      { path: '/admin/warehouse', confidence: 0.8, description: '倉庫總覽' },
      { path: '/order-loading', confidence: 0.7, description: '訂單裝載' },
      { path: '/stock-transfer', confidence: 0.7, description: '庫存轉移' },
    ];
    
    // 根據當前路徑調整權重
    if (currentPath.includes('/admin')) {
      return criticalPaths.filter(p => p.path.includes('/admin'));
    }
    
    return criticalPaths;
  }
  
  /**
   * 基於時間的預測
   */
  private getTimeBasedPredictions() {
    const hour = new Date().getHours();
    const isBusinessHours = hour >= 8 && hour <= 18;
    
    if (isBusinessHours) {
      return [
        { path: '/order-loading', confidence: 0.8, dataPattern: 'orders:active' },
        { path: '/stock-transfer', confidence: 0.7, dataPattern: 'warehouse:summary' },
      ];
    } else {
      return [
        { path: '/admin/analysis', confidence: 0.6, dataPattern: 'analytics:dashboard' },
        { path: '/admin/system', confidence: 0.5, dataPattern: 'system:config' },
      ];
    }
  }
  
  /**
   * 獲取路徑相關的 GraphQL 查詢
   */
  private getQueriesForPath(path: string) {
    const queryMap: Record<string, any[]> = {
      '/admin/warehouse': [
        {
          name: 'warehouseSummary',
          query: `query { warehouseSummary { totalPallets occupancyRate } }`,
          variables: {},
        },
      ],
      '/order-loading': [
        {
          name: 'pendingOrders',
          query: `query { getPendingOrders(pagination: { first: 20 }) { edges { node { id status } } } }`,
          variables: {},
        },
      ],
      '/stock-transfer': [
        {
          name: 'availableLocations',
          query: `query { warehouses { id name availableSpace } }`,
          variables: {},
        },
      ],
    };
    
    return queryMap[path] || [];
  }
  
  /**
   * 加入隊列並排序
   */
  private enqueueTasksWithPriority(tasks: PreloadTask[]) {
    // 過濾重複任務
    const newTasks = tasks.filter(task => 
      !this.preloadQueue.some(existing => 
        existing.type === task.type && 
        existing.data.path === task.data.path
      )
    );
    
    this.preloadQueue.push(...newTasks);
    this.preloadQueue.sort((a, b) => b.priority - a.priority);
    
    // 限制隊列長度
    if (this.preloadQueue.length > 50) {
      this.preloadQueue = this.preloadQueue.slice(0, 50);
    }
  }
  
  /**
   * 處理高優先級任務
   */
  private async processHighPriorityTasks() {
    const highPriorityTasks = this.preloadQueue
      .filter(task => task.priority >= 80)
      .slice(0, this.config.maxConcurrentPreloads);
    
    await Promise.all(
      highPriorityTasks.map(task => this.executePreloadTask(task))
    );
  }
  
  /**
   * 處理隊列
   */
  private async processQueue() {
    if (this.isProcessing || this.preloadQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      // 獲取可處理的任務數
      const availableSlots = this.config.maxConcurrentPreloads - this.activePreloads.size;
      if (availableSlots <= 0) return;
      
      // 取出任務
      const tasks = this.preloadQueue.splice(0, availableSlots);
      
      // 並行執行
      await Promise.all(
        tasks.map(task => this.executePreloadTask(task))
      );
      
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * 執行預加載任務
   */
  private async executePreloadTask(task: PreloadTask): Promise<void> {
    if (this.activePreloads.has(task.id)) return;
    
    this.activePreloads.add(task.id);
    const startTime = Date.now();
    
    try {
      switch (task.type) {
        case 'navigation':
          await navigationPreloader.preloadPath(task.data.path);
          break;
          
        case 'graphql':
          await this.preloadGraphQLQuery(task.data.query, task.data.variables);
          break;
          
        case 'cache':
          await cacheWarmupManager.manualWarmup([task.data.pattern]);
          break;
      }
      
      // 記錄成功
      this.recordResult(task.id, {
        taskId: task.id,
        success: true,
        duration: Date.now() - startTime,
      });
      
    } catch (error) {
      // 記錄失敗
      this.recordResult(task.id, {
        taskId: task.id,
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
      });
      
      logger.error(`預加載任務失敗 ${task.id}:`, error);
      
    } finally {
      this.activePreloads.delete(task.id);
    }
  }
  
  /**
   * 預加載 GraphQL 查詢
   */
  private async preloadGraphQLQuery(query: string, variables: any) {
    try {
      // TODO: Implement GraphQL query preloading
      // Currently unifiedDataLayer doesn't have executeQuery method
      // Consider using Apollo Client or GraphQL request library
      
      logger.debug('GraphQL query preloading skipped - not implemented');
      
    } catch (error) {
      logger.error('GraphQL 預加載失敗:', error);
      throw error;
    }
  }
  
  /**
   * 記錄結果
   */
  private recordResult(taskId: string, result: PreloadResult) {
    const history = this.preloadHistory.get(taskId) || [];
    history.push(result);
    
    // 限制歷史記錄數量
    if (history.length > 10) {
      history.shift();
    }
    
    this.preloadHistory.set(taskId, history);
  }
  
  /**
   * 獲取統計信息
   */
  getStats() {
    const stats = {
      queueLength: this.preloadQueue.length,
      activePreloads: this.activePreloads.size,
      successRate: 0,
      avgDuration: 0,
      tasksByType: {
        navigation: 0,
        graphql: 0,
        cache: 0,
      },
    };
    
    // 計算成功率和平均時長
    let totalTasks = 0;
    let successfulTasks = 0;
    let totalDuration = 0;
    
    this.preloadHistory.forEach(results => {
      results.forEach(result => {
        totalTasks++;
        if (result.success) successfulTasks++;
        totalDuration += result.duration;
      });
    });
    
    if (totalTasks > 0) {
      stats.successRate = (successfulTasks / totalTasks) * 100;
      stats.avgDuration = totalDuration / totalTasks;
    }
    
    // 統計隊列中的任務類型
    this.preloadQueue.forEach(task => {
      stats.tasksByType[task.type]++;
    });
    
    return stats;
  }
  
  /**
   * 清理隊列和歷史
   */
  clear() {
    this.preloadQueue = [];
    this.activePreloads.clear();
    this.preloadHistory.clear();
  }
}

// 創建單例實例
export const unifiedPreloadService = new UnifiedPreloadService();