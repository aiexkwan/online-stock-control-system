/**
 * Cards Migration Monitoring Service
 * 
 * 負責監控 Cards/Widgets 系統遷移的進度和性能
 * 
 * @document /config/cards-migration-monitoring.json
 * @created 2025-07-25
 */

import { glob } from 'glob';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { shouldUseCard, shouldUseGraphQL, getMigrationProgress } from '../feature-flags/configs/cards-migration';

export interface MigrationMetrics {
  progress: {
    cardsCompletionPercentage: number;
    widgetsCleanupPercentage: number;
    apiMigrationPercentage: number;
  };
  performance: {
    cardRenderTime: number[];
    graphqlQueryTime: number[];
    bundleSize: number;
    memoryUsage: number;
  };
  featureFlags: {
    cardsSystemUsageRate: number;
    graphqlApiUsageRate: number;
  };
  errors: {
    cardErrorRate: number;
    graphqlErrorRate: number;
    rollbackCount: number;
  };
}

export class CardsMigrationMonitor {
  private metricsHistory: MigrationMetrics[] = [];
  private alertCallbacks: Map<string, Function[]> = new Map();

  constructor(
    private projectRoot: string = process.cwd(),
    private alertThresholds: Record<string, number> = {}
  ) {
    this.loadConfiguration();
  }

  /**
   * 載入監控配置
   */
  private loadConfiguration(): void {
    const configPath = join(this.projectRoot, 'config/cards-migration-monitoring.json');
    
    if (existsSync(configPath)) {
      try {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        
        // 提取告警閾值
        config.metrics?.performance_benchmarks?.metrics?.forEach((metric: any) => {
          if (metric.alert_threshold) {
            this.alertThresholds[metric.name] = metric.alert_threshold;
          }
        });

        config.metrics?.error_tracking?.metrics?.forEach((metric: any) => {
          if (metric.alert_threshold) {
            this.alertThresholds[metric.name] = metric.alert_threshold;
          }
        });
      } catch (error) {
        console.error('Failed to load monitoring configuration:', error);
      }
    }
  }

  /**
   * 收集遷移進度指標
   */
  async collectProgressMetrics(): Promise<MigrationMetrics['progress']> {
    try {
      // 統計 Cards 檔案
      const cardsFiles = await glob('app/**/cards/**/*.tsx', { 
        cwd: this.projectRoot,
        ignore: ['**/node_modules/**', '**/.next/**']
      });

      // 統計 Widgets 檔案
      const widgetsFiles = await glob('app/**/widgets/**/*.tsx', {
        cwd: this.projectRoot,
        ignore: ['**/node_modules/**', '**/.next/**']
      });

      // 統計 GraphQL resolvers
      const resolversFiles = await glob('lib/graphql/resolvers/**/*.ts', {
        cwd: this.projectRoot,
        ignore: ['**/*.test.ts', '**/*.spec.ts']
      });

      // 估計總的 REST endpoints (通過 app/api 目錄)
      const apiFiles = await glob('app/api/**/route.ts', {
        cwd: this.projectRoot
      });

      const totalCards = 17; // 根據計劃
      const totalEndpoints = 77; // 根據評估
      const originalWidgets = 56; // 根據評估

      return {
        cardsCompletionPercentage: Math.min((cardsFiles.length / totalCards) * 100, 100),
        widgetsCleanupPercentage: Math.max(((originalWidgets - widgetsFiles.length) / originalWidgets) * 100, 0),
        apiMigrationPercentage: Math.min((resolversFiles.length / totalEndpoints) * 100, 100),
      };

    } catch (error) {
      console.error('Failed to collect progress metrics:', error);
      return {
        cardsCompletionPercentage: 0,
        widgetsCleanupPercentage: 0,
        apiMigrationPercentage: 0,
      };
    }
  }

  /**
   * 收集性能指標
   */
  async collectPerformanceMetrics(): Promise<MigrationMetrics['performance']> {
    // 在實際環境中，這些數據會來自瀏覽器的 Performance API
    // 這裡提供一個模擬實現

    const bundleStatsPath = join(this.projectRoot, '.next/analyze/client.json');
    let bundleSize = 0;

    if (existsSync(bundleStatsPath)) {
      try {
        const stats = JSON.parse(readFileSync(bundleStatsPath, 'utf-8'));
        
        // 計算 Cards 相關的 bundle 大小
        bundleSize = Object.entries(stats.assets || {})
          .filter(([name]) => name.includes('cards'))
          .reduce((sum, [, asset]: [string, any]) => sum + (asset.size || 0), 0) / 1024; // 轉換為 KB
      } catch (error) {
        console.warn('Failed to read bundle stats:', error);
      }
    }

    return {
      cardRenderTime: [], // 會在瀏覽器端收集
      graphqlQueryTime: [], // 會在服務端收集
      bundleSize,
      memoryUsage: 0, // 會在瀏覽器端收集
    };
  }

  /**
   * 收集 Feature Flag 使用率
   */
  async collectFeatureFlagMetrics(): Promise<MigrationMetrics['featureFlags']> {
    // 模擬用戶 ID 集合，實際環境中會從用戶分析系統獲取
    const sampleUsers = ['user1', 'user2', 'user3', 'user4', 'user5'];
    
    let cardsEnabledCount = 0;
    let graphqlEnabledCount = 0;

    for (const userId of sampleUsers) {
      if (shouldUseCard('stats', userId)) {
        cardsEnabledCount++;
      }
      if (shouldUseGraphQL('query', userId)) {
        graphqlEnabledCount++;
      }
    }

    return {
      cardsSystemUsageRate: (cardsEnabledCount / sampleUsers.length) * 100,
      graphqlApiUsageRate: (graphqlEnabledCount / sampleUsers.length) * 100,
    };
  }

  /**
   * 收集錯誤指標
   */
  async collectErrorMetrics(): Promise<MigrationMetrics['errors']> {
    // 在實際環境中，這些數據會來自錯誤追蹤系統（如 Sentry）
    return {
      cardErrorRate: 0, // 會從錯誤日誌中收集
      graphqlErrorRate: 0, // 會從 GraphQL 日誌中收集
      rollbackCount: 0, // 會從部署系統中收集
    };
  }

  /**
   * 收集所有指標
   */
  async collectAllMetrics(): Promise<MigrationMetrics> {
    const [progress, performance, featureFlags, errors] = await Promise.all([
      this.collectProgressMetrics(),
      this.collectPerformanceMetrics(),
      this.collectFeatureFlagMetrics(),
      this.collectErrorMetrics(),
    ]);

    const metrics: MigrationMetrics = {
      progress,
      performance,
      featureFlags,
      errors,
    };

    // 保存到歷史記錄
    this.metricsHistory.push(metrics);
    
    // 保留最近 100 個記錄
    if (this.metricsHistory.length > 100) {
      this.metricsHistory = this.metricsHistory.slice(-100);
    }

    // 檢查告警
    this.checkAlerts(metrics);

    return metrics;
  }

  /**
   * 檢查告警條件
   */
  private checkAlerts(metrics: MigrationMetrics): void {
    const alerts: string[] = [];

    // 檢查性能告警
    if (metrics.performance.bundleSize > (this.alertThresholds['bundle_size_cards'] || 600)) {
      alerts.push(`Bundle size exceeded threshold: ${metrics.performance.bundleSize}KB`);
    }

    // 檢查錯誤率告警
    if (metrics.errors.cardErrorRate > (this.alertThresholds['card_error_rate'] || 1.0)) {
      alerts.push(`Card error rate too high: ${metrics.errors.cardErrorRate}%`);
    }

    if (metrics.errors.graphqlErrorRate > (this.alertThresholds['graphql_error_rate'] || 2.0)) {
      alerts.push(`GraphQL error rate too high: ${metrics.errors.graphqlErrorRate}%`);
    }

    // 檢查回滾告警
    if (metrics.errors.rollbackCount > 0) {
      alerts.push(`Migration rollback detected: ${metrics.errors.rollbackCount} times`);
    }

    // 觸發告警回調
    if (alerts.length > 0) {
      this.triggerAlert('critical', alerts);
    }
  }

  /**
   * 註冊告警回調
   */
  onAlert(level: string, callback: Function): void {
    if (!this.alertCallbacks.has(level)) {
      this.alertCallbacks.set(level, []);
    }
    this.alertCallbacks.get(level)!.push(callback);
  }

  /**
   * 觸發告警
   */
  private triggerAlert(level: string, messages: string[]): void {
    const callbacks = this.alertCallbacks.get(level) || [];
    callbacks.forEach(callback => {
      try {
        callback(messages);
      } catch (error) {
        console.error('Alert callback failed:', error);
      }
    });
  }

  /**
   * 獲取歷史指標
   */
  getMetricsHistory(limit?: number): MigrationMetrics[] {
    return limit ? this.metricsHistory.slice(-limit) : [...this.metricsHistory];
  }

  /**
   * 生成報告
   */
  generateReport(): {
    summary: string;
    progress: MigrationMetrics['progress'];
    recommendations: string[];
  } {
    const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    
    if (!latestMetrics) {
      return {
        summary: 'No metrics available',
        progress: {
          cardsCompletionPercentage: 0,
          widgetsCleanupPercentage: 0,
          apiMigrationPercentage: 0,
        },
        recommendations: ['Run metrics collection first'],
      };
    }

    const { progress } = latestMetrics;
    const recommendations: string[] = [];

    // 生成建議
    if (progress.cardsCompletionPercentage < 100) {
      recommendations.push(`完成剩餘 ${Math.ceil((100 - progress.cardsCompletionPercentage) * 17 / 100)} 個 Cards`);
    }

    if (progress.widgetsCleanupPercentage < 50) {
      recommendations.push('加速 Widget 清理工作，當前進度偏低');
    }

    if (progress.apiMigrationPercentage < 50) {
      recommendations.push('增加 GraphQL resolver 開發資源');
    }

    if (latestMetrics.performance.bundleSize > 500) {
      recommendations.push('優化 Bundle 大小，考慮代碼分割');
    }

    const overallProgress = (
      progress.cardsCompletionPercentage +
      progress.widgetsCleanupPercentage +
      progress.apiMigrationPercentage
    ) / 3;

    return {
      summary: `整體遷移進度：${overallProgress.toFixed(1)}%。Cards: ${progress.cardsCompletionPercentage.toFixed(1)}%, Widgets: ${progress.widgetsCleanupPercentage.toFixed(1)}%, API: ${progress.apiMigrationPercentage.toFixed(1)}%`,
      progress,
      recommendations,
    };
  }

  /**
   * 啟動定時收集
   */
  startPeriodicCollection(intervalMs: number = 300000): void { // 預設 5 分鐘
    setInterval(async () => {
      try {
        await this.collectAllMetrics();
        console.log('Migration metrics collected successfully');
      } catch (error) {
        console.error('Failed to collect metrics:', error);
      }
    }, intervalMs);
  }
}

// 單例實例
export const cardsMigrationMonitor = new CardsMigrationMonitor();

// 預設告警處理器
cardsMigrationMonitor.onAlert('critical', (messages: string[]) => {
  console.error('🚨 CRITICAL ALERT:', messages.join(', '));
});

cardsMigrationMonitor.onAlert('warning', (messages: string[]) => {
  console.warn('⚠️ WARNING:', messages.join(', '));
});

// 瀏覽器環境的性能收集器
export class BrowserPerformanceCollector {
  private performanceEntries: PerformanceEntry[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupBrowserMonitoring();
    }
  }

  private setupBrowserMonitoring(): void {
    // 監控 Card 組件渲染性能
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('card-render') || entry.name.includes('widget-render')) {
          this.performanceEntries.push(entry);
        }
      }
    });

    observer.observe({ entryTypes: ['measure', 'mark'] });

    // Web Vitals 收集
    if ('web-vitals' in window) {
      // 實際環境中會使用 web-vitals 庫
    }
  }

  /**
   * 標記 Card 渲染開始
   */
  markCardRenderStart(cardType: string, cardId: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`card-render-start-${cardType}-${cardId}`);
    }
  }

  /**
   * 標記 Card 渲染結束並測量
   */
  markCardRenderEnd(cardType: string, cardId: string): number {
    if (typeof performance !== 'undefined') {
      const endMark = `card-render-end-${cardType}-${cardId}`;
      const startMark = `card-render-start-${cardType}-${cardId}`;
      
      performance.mark(endMark);
      
      try {
        performance.measure(`card-render-${cardType}-${cardId}`, startMark, endMark);
        
        const measures = performance.getEntriesByName(`card-render-${cardType}-${cardId}`);
        if (measures.length > 0) {
          return measures[measures.length - 1].duration;
        }
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
    
    return 0;
  }

  /**
   * 獲取性能數據
   */
  getPerformanceData(): {
    cardRenderTimes: number[];
    memoryUsage: number;
  } {
    const cardRenderTimes = this.performanceEntries
      .filter(entry => entry.name.includes('card-render'))
      .map(entry => entry.duration);

    let memoryUsage = 0;
    if ('memory' in performance) {
      memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    return {
      cardRenderTimes,
      memoryUsage,
    };
  }
}

export const browserPerformanceCollector = new BrowserPerformanceCollector();