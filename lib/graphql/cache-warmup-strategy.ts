import { logger } from '../logger';
import { cacheStrategyOptimizer } from './cache-strategy-optimizer';
import { createCacheAdapter } from './redis-cache-adapter';
import { getCachedWithFallback } from './cache-fallback-helper';

// 創建緩存適配器實例
const redisCacheAdapter = createCacheAdapter();

export interface WarmupStrategy {
  priority: 'critical' | 'high' | 'medium' | 'low';
  schedules: Array<{
    time: string; // cron format
    enabled: boolean;
    description: string;
  }>;
  dataPattern: string;
  keyPattern: string;
  ttlSeconds: number;
  dependsOn?: string[];
}

export interface WarmupConfig {
  enabled: boolean;
  batchSize: number;
  concurrency: number;
  timeout: number;
  retryAttempts: number;
  strategies: Record<string, WarmupStrategy>;
  businessHours: {
    start: string; // HH:mm format
    end: string;
    timezone: string;
  };
}

export const cacheWarmupConfig: WarmupConfig = {
  enabled: true,
  batchSize: 50,
  concurrency: 5,
  timeout: 30000, // 30 seconds
  retryAttempts: 3,

  businessHours: {
    start: '08:00',
    end: '18:00',
    timezone: 'Asia/Hong_Kong',
  },

  strategies: {
    // 關鍵業務數據 - 最高優先級
    warehouseSummary: {
      priority: 'critical',
      schedules: [
        { time: '0 7 * * 1-5', enabled: true, description: '工作日早上7點預熱' },
        { time: '0 */2 * * *', enabled: true, description: '每2小時刷新' },
      ],
      dataPattern: 'warehouse:summary',
      keyPattern: 'warehouse:*:summary',
      ttlSeconds: 1800, // 30 minutes
    },

    activeOrders: {
      priority: 'critical',
      schedules: [
        { time: '0 */1 * * *', enabled: true, description: '每小時刷新活躍訂單' },
        { time: '*/10 8-18 * * 1-5', enabled: true, description: '工作時間每10分鐘' },
      ],
      dataPattern: 'orders:active',
      keyPattern: 'orders:status:pending:*',
      ttlSeconds: 600, // 10 minutes
    },

    lowStockProducts: {
      priority: 'high',
      schedules: [
        { time: '0 8,12,16 * * 1-5', enabled: true, description: '工作日三次檢查' },
        { time: '0 10 * * 6,0', enabled: true, description: '週末一次檢查' },
      ],
      dataPattern: 'products:low_stock',
      keyPattern: 'products:inventory:low:*',
      ttlSeconds: 3600, // 1 hour
      dependsOn: ['warehouseSummary'],
    },

    // 經常訪問的數據
    userPermissions: {
      priority: 'high',
      schedules: [{ time: '0 6 * * *', enabled: true, description: '每日清晨預熱' }],
      dataPattern: 'users:permissions',
      keyPattern: 'users:*:permissions',
      ttlSeconds: 7200, // 2 hours
    },

    productCatalog: {
      priority: 'medium',
      schedules: [{ time: '0 5 * * *', enabled: true, description: '每日預熱產品目錄' }],
      dataPattern: 'products:catalog',
      keyPattern: 'products:*:details',
      ttlSeconds: 3600, // 1 hour
    },

    // 報表和分析數據
    analyticsData: {
      priority: 'medium',
      schedules: [{ time: '0 6 * * 1', enabled: true, description: '週一預熱分析數據' }],
      dataPattern: 'analytics:dashboard',
      keyPattern: 'analytics:*',
      ttlSeconds: 21600, // 6 hours
    },

    // 系統配置數據
    systemConfigs: {
      priority: 'low',
      schedules: [{ time: '0 4 * * *', enabled: true, description: '每日凌晨4點預熱' }],
      dataPattern: 'system:config',
      keyPattern: 'config:*',
      ttlSeconds: 43200, // 12 hours
    },
  },
};

export class CacheWarmupManager {
  private readonly config: WarmupConfig;
  private activeWarmups: Set<string> = new Set();
  private warmupHistory: Map<string, { lastRun: Date; success: boolean; duration: number }> =
    new Map();

  constructor(config: WarmupConfig) {
    this.config = config;
    this.initializeScheduler();
  }

  private initializeScheduler(): void {
    if (!this.config.enabled) {
      logger.info('Cache warmup is disabled');
      return;
    }

    // 這裡應該集成實際的 cron 調度器，例如 node-cron
    logger.info('Cache warmup scheduler initialized');

    // 示例：立即執行一次關鍵數據預熱
    this.warmupCriticalData();
  }

  async warmupCriticalData(): Promise<void> {
    const criticalStrategies = Object.entries(this.config.strategies)
      .filter(([_, strategy]) => strategy.priority === 'critical')
      .map(([name, strategy]) => ({ name, strategy }));

    logger.info(`Starting critical data warmup for ${criticalStrategies.length} strategies`);

    await Promise.allSettled(
      criticalStrategies.map(({ name, strategy }) => this.executeWarmupStrategy(name, strategy))
    );
  }

  async executeWarmupStrategy(strategyName: string, strategy: WarmupStrategy): Promise<void> {
    if (this.activeWarmups.has(strategyName)) {
      logger.warn(`Warmup strategy ${strategyName} is already running, skipping`);
      return;
    }

    this.activeWarmups.add(strategyName);
    const startTime = Date.now();

    try {
      logger.info(`Starting warmup strategy: ${strategyName} (priority: ${strategy.priority})`);

      // 檢查依賴
      if (strategy.dependsOn?.length) {
        const dependenciesMet = await this.checkDependencies(strategy.dependsOn);
        if (!dependenciesMet) {
          throw new Error(`Dependencies not met for strategy: ${strategyName}`);
        }
      }

      // 獲取需要預熱的數據
      const keysToWarmup = await this.getKeysToWarmup(strategy);

      if (keysToWarmup.length === 0) {
        logger.info(`No keys to warmup for strategy: ${strategyName}`);
        return;
      }

      // 分批預熱
      await this.warmupInBatches(strategyName, keysToWarmup, strategy);

      const duration = Date.now() - startTime;
      this.warmupHistory.set(strategyName, {
        lastRun: new Date(),
        success: true,
        duration,
      });

      logger.info(
        `Completed warmup strategy: ${strategyName} (${duration}ms, ${keysToWarmup.length} keys)`
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.warmupHistory.set(strategyName, {
        lastRun: new Date(),
        success: false,
        duration,
      });

      logger.error(`Failed warmup strategy: ${strategyName}`, error);
    } finally {
      this.activeWarmups.delete(strategyName);
    }
  }

  private async checkDependencies(dependencies: string[]): Promise<boolean> {
    for (const dep of dependencies) {
      const history = this.warmupHistory.get(dep);
      if (!history || !history.success) {
        logger.warn(`Dependency ${dep} not satisfied`);
        return false;
      }

      // 檢查依賴是否過期（超過1小時）
      const now = Date.now();
      const lastRun = history.lastRun.getTime();
      if (now - lastRun > 3600000) {
        // 1 hour
        logger.warn(`Dependency ${dep} is stale (last run: ${history.lastRun})`);
        return false;
      }
    }

    return true;
  }

  private async getKeysToWarmup(strategy: WarmupStrategy): Promise<string[]> {
    // 根據策略類型生成需要預熱的緩存鍵
    const keys: string[] = [];

    switch (strategy.dataPattern) {
      case 'warehouse:summary':
        // 獲取所有倉庫ID並生成緩存鍵
        keys.push('warehouse:1:summary', 'warehouse:2:summary');
        break;

      case 'orders:active':
        // 預熱活躍訂單的常見查詢
        keys.push(
          'orders:status:pending:page:1',
          'orders:status:processing:page:1',
          'orders:priority:high:page:1'
        );
        break;

      case 'products:low_stock':
        // 預熱低庫存產品查詢
        keys.push(
          'products:inventory:low:threshold:10',
          'products:inventory:low:category:electronics',
          'products:inventory:low:warehouse:1'
        );
        break;

      case 'users:permissions':
        // 預熱用戶權限數據
        keys.push(
          'users:active:permissions',
          'users:roles:admin:permissions',
          'users:roles:operator:permissions'
        );
        break;

      case 'products:catalog':
        // 預熱產品目錄
        keys.push(
          'products:catalog:page:1',
          'products:category:electronics:page:1',
          'products:featured:page:1'
        );
        break;

      case 'analytics:dashboard':
        // 預熱分析儀表板數據
        keys.push(
          'analytics:dashboard:overview',
          'analytics:trends:weekly',
          'analytics:performance:monthly'
        );
        break;

      case 'system:config':
        // 預熱系統配置
        keys.push('config:app:settings', 'config:features:flags', 'config:ui:theme');
        break;

      default:
        logger.warn(`Unknown data pattern: ${strategy.dataPattern}`);
    }

    return keys;
  }

  private async warmupInBatches(
    strategyName: string,
    keys: string[],
    strategy: WarmupStrategy
  ): Promise<void> {
    const batches = this.chunkArray(keys, this.config.batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      logger.debug(
        `Processing batch ${i + 1}/${batches.length} for ${strategyName} (${batch.length} keys)`
      );

      // 並發處理批次內的鍵
      const promises = batch.map(
        (key, index) => this.warmupSingleKey(key, strategy, index * 100) // 錯開執行避免瞬間負載
      );

      await Promise.allSettled(promises);

      // 批次間短暫暫停
      if (i < batches.length - 1) {
        await this.sleep(100);
      }
    }
  }

  private async warmupSingleKey(key: string, strategy: WarmupStrategy, delay = 0): Promise<void> {
    if (delay > 0) {
      await this.sleep(delay);
    }

    try {
      // 🧠 使用智能緩存獲取 - 實施 fallback 機制
      const data = await this.getCachedWithFallback(key, strategy);
      if (data !== null) {
        logger.debug(`Successfully warmed up key: ${key}`);
      } else {
        logger.debug(`No data available for warmup key: ${key}`);
      }
    } catch (error) {
      logger.error(`Failed to warmup key ${key}:`, error);
    }
  }

  /**
   * 🧠 智能緩存獲取 - 使用通用 fallback 工具
   * 實施建議方案2的 fallback 機制
   */
  private async getCachedWithFallback(key: string, strategy: WarmupStrategy): Promise<any> {
    return await getCachedWithFallback(key, () => this.fetchDataForKey(key, strategy), {
      ttlSeconds: strategy.ttlSeconds,
      silent: false, // 暖機過程中顯示日誌以便調試
    });
  }

  private async fetchDataForKey(key: string, strategy: WarmupStrategy): Promise<any> {
    // 這裡應該調用實際的數據獲取邏輯
    // 根據緩存鍵和策略類型，從 GraphQL resolver 或數據層獲取數據

    // 模擬數據獲取延遲
    await this.sleep(Math.random() * 500 + 100);

    // 根據鍵模式返回模擬數據
    if (key.includes('warehouse:summary')) {
      return {
        totalPallets: Math.floor(Math.random() * 1000),
        occupancyRate: Math.random() * 100,
        lastUpdated: new Date().toISOString(),
      };
    }

    if (key.includes('orders:')) {
      return {
        orders: Array.from({ length: 10 }, (_, i) => ({
          id: `order-${i}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
        })),
        totalCount: 10,
      };
    }

    // 默認返回簡單數據
    return {
      key,
      data: `Warmed up data for ${key}`,
      timestamp: new Date().toISOString(),
    };
  }

  // 基於業務時間的智能預熱
  async scheduleBusinessHoursWarmup(): Promise<void> {
    const now = new Date();
    const isBusinessHours = this.isWithinBusinessHours(now);

    if (isBusinessHours) {
      // 工作時間：預熱高頻訪問數據
      await this.warmupHighFrequencyData();
    } else {
      // 非工作時間：預熱長期數據
      await this.warmupLongTermData();
    }
  }

  private isWithinBusinessHours(date: Date): boolean {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const currentTime = hour * 60 + minute;

    const [startHour, startMin] = this.config.businessHours.start.split(':').map(Number);
    const [endHour, endMin] = this.config.businessHours.end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime <= endTime;
  }

  private async warmupHighFrequencyData(): Promise<void> {
    const highFreqStrategies = ['warehouseSummary', 'activeOrders', 'lowStockProducts'];

    for (const strategyName of highFreqStrategies) {
      const strategy = this.config.strategies[strategyName];
      if (strategy) {
        await this.executeWarmupStrategy(strategyName, strategy);
      }
    }
  }

  private async warmupLongTermData(): Promise<void> {
    const longTermStrategies = ['analyticsData', 'systemConfigs'];

    for (const strategyName of longTermStrategies) {
      const strategy = this.config.strategies[strategyName];
      if (strategy) {
        await this.executeWarmupStrategy(strategyName, strategy);
      }
    }
  }

  // 基於用戶行為的預測性預熱
  async predictiveWarmup(
    userPatterns: Array<{ userId: string; frequentQueries: string[] }>
  ): Promise<void> {
    logger.info(`Starting predictive warmup for ${userPatterns.length} user patterns`);

    const queryFrequency = new Map<string, number>();

    // 分析查詢頻率
    userPatterns.forEach(pattern => {
      pattern.frequentQueries.forEach(query => {
        queryFrequency.set(query, (queryFrequency.get(query) || 0) + 1);
      });
    });

    // 預熱高頻查詢
    const highFreqQueries = Array.from(queryFrequency.entries())
      .filter(([_, freq]) => freq >= 3) // 至少3個用戶使用
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 20); // 取前20個

    for (const [query, frequency] of highFreqQueries) {
      try {
        const cacheKey = `predictive:${query}`;
        const ttl = Math.min(frequency * 300, 3600); // 頻率越高，TTL越長，最大1小時

        // 模擬執行查詢並緩存結果
        const result = await this.fetchDataForKey(cacheKey, {
          priority: 'medium',
          schedules: [],
          dataPattern: 'predictive',
          keyPattern: cacheKey,
          ttlSeconds: ttl,
        });

        await redisCacheAdapter.set(cacheKey, result, ttl);
        logger.debug(`Predictively warmed up: ${query} (frequency: ${frequency})`);
      } catch (error) {
        logger.error(`Failed predictive warmup for query ${query}:`, error);
      }
    }
  }

  // 工具方法
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 獲取預熱統計
  getWarmupStats(): {
    activeWarmups: string[];
    history: Array<{ strategy: string; lastRun: Date; success: boolean; duration: number }>;
    totalStrategies: number;
    enabledStrategies: number;
  } {
    return {
      activeWarmups: Array.from(this.activeWarmups),
      history: Array.from(this.warmupHistory.entries()).map(([strategy, info]) => ({
        strategy,
        ...info,
      })),
      totalStrategies: Object.keys(this.config.strategies).length,
      enabledStrategies: Object.values(this.config.strategies).filter(s =>
        s.schedules.some(schedule => schedule.enabled)
      ).length,
    };
  }

  // 手動觸發預熱
  async manualWarmup(strategyNames?: string[]): Promise<void> {
    const strategies = strategyNames || Object.keys(this.config.strategies);

    logger.info(`Manual warmup triggered for strategies: ${strategies.join(', ')}`);

    for (const strategyName of strategies) {
      const strategy = this.config.strategies[strategyName];
      if (strategy) {
        await this.executeWarmupStrategy(strategyName, strategy);
      } else {
        logger.warn(`Strategy not found: ${strategyName}`);
      }
    }
  }
}

// 創建全局預熱管理器實例
export const cacheWarmupManager = new CacheWarmupManager(cacheWarmupConfig);

// 定期執行業務時間預熱
setInterval(
  () => {
    if (cacheWarmupConfig.enabled) {
      cacheWarmupManager.scheduleBusinessHoursWarmup();
    }
  },
  30 * 60 * 1000
); // 每30分鐘檢查一次
