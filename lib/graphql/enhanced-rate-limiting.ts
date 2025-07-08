import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { GraphQLError } from 'graphql';
import { logger } from '../logger';
import { redisCacheAdapter } from './redis-cache-adapter';
import { isDevelopment, isProduction } from '@/lib/utils/env';

// 擴展原有的限流配置，添加更細粒度規則
export interface EnhancedRateLimitConfig {
  // 基礎限流（繼承原有配置）
  mutationLimits: Record<string, { maxRequests: number; windowMs: number }>;
  subscriptionLimits: {
    maxConnectionsPerUser: number;
    maxConnectionsPerIP: number;
    maxGlobalConnections: number;
  };
  ipLimits: { maxRequests: number; windowMs: number };

  // 新增：細粒度限流規則
  userRoleLimits: Record<
    string,
    {
      maxRequestsPerMinute: number;
      maxConcurrentQueries: number;
      complexityLimit: number;
    }
  >;

  operationTypeLimits: {
    query: { maxRequestsPerMinute: number; maxComplexity: number };
    mutation: { maxRequestsPerMinute: number; maxComplexity: number };
    subscription: { maxPerUser: number; maxComplexity: number };
  };

  fieldLevelLimits: Record<
    string,
    {
      maxRequestsPerMinute: number;
      cooldownSeconds?: number;
      requiresAuth?: boolean;
    }
  >;

  businessLogicLimits: {
    stockOperations: { maxPerMinute: number; burstLimit: number };
    reportGeneration: { maxPerHour: number; queueSize: number };
    bulkOperations: { maxPerHour: number; maxBatchSize: number };
  };

  adaptiveLimits: {
    enabled: boolean;
    systemLoadThreshold: number; // 0-1, 系統負載閾值
    memoryThreshold: number; // 0-1, 內存使用閾值
    responseTimeThreshold: number; // ms, 響應時間閾值
  };
}

export const enhancedRateLimitConfig: EnhancedRateLimitConfig = {
  // 繼承基礎配置
  mutationLimits: {
    createProduct: { maxRequests: 20, windowMs: 60000 },
    updateProduct: { maxRequests: 50, windowMs: 60000 },
    deleteProduct: { maxRequests: 10, windowMs: 60000 },
    adjustStock: { maxRequests: 100, windowMs: 60000 },
    transferStock: { maxRequests: 50, windowMs: 60000 },
    createOrder: { maxRequests: 30, windowMs: 60000 },
    updateOrder: { maxRequests: 40, windowMs: 60000 },
    processPallet: { maxRequests: 200, windowMs: 60000 },
    bulkUpdateInventory: { maxRequests: 5, windowMs: 60000 },
  },

  subscriptionLimits: {
    maxConnectionsPerUser: 10,
    maxConnectionsPerIP: 50,
    maxGlobalConnections: 1000,
  },

  ipLimits: { maxRequests: 1000, windowMs: 60000 },

  // 用戶角色限流
  userRoleLimits: {
    admin: {
      maxRequestsPerMinute: 1000,
      maxConcurrentQueries: 20,
      complexityLimit: 2000,
    },
    manager: {
      maxRequestsPerMinute: 500,
      maxConcurrentQueries: 15,
      complexityLimit: 1500,
    },
    operator: {
      maxRequestsPerMinute: 200,
      maxConcurrentQueries: 10,
      complexityLimit: 1000,
    },
    viewer: {
      maxRequestsPerMinute: 100,
      maxConcurrentQueries: 5,
      complexityLimit: 500,
    },
    guest: {
      maxRequestsPerMinute: 30,
      maxConcurrentQueries: 2,
      complexityLimit: 200,
    },
  },

  // 操作類型限流
  operationTypeLimits: {
    query: { maxRequestsPerMinute: 300, maxComplexity: 1000 },
    mutation: { maxRequestsPerMinute: 100, maxComplexity: 800 },
    subscription: { maxPerUser: 10, maxComplexity: 500 },
  },

  // 欄位級別限流
  fieldLevelLimits: {
    'Product.inventory': { maxRequestsPerMinute: 200, cooldownSeconds: 1 },
    'Warehouse.pallets': { maxRequestsPerMinute: 150, cooldownSeconds: 2 },
    'Order.loadingHistory': { maxRequestsPerMinute: 100, requiresAuth: true },
    'Pallet.movements': { maxRequestsPerMinute: 180, cooldownSeconds: 1 },
    'User.activityLog': { maxRequestsPerMinute: 50, requiresAuth: true },
    'Analytics.warehouseSummary': { maxRequestsPerMinute: 60, cooldownSeconds: 5 },
    'Reports.transactionHistory': { maxRequestsPerMinute: 20, requiresAuth: true },
  },

  // 業務邏輯限流
  businessLogicLimits: {
    stockOperations: { maxPerMinute: 300, burstLimit: 50 },
    reportGeneration: { maxPerHour: 100, queueSize: 20 },
    bulkOperations: { maxPerHour: 20, maxBatchSize: 1000 },
  },

  // 自適應限流
  adaptiveLimits: {
    enabled: true,
    systemLoadThreshold: 0.8,
    memoryThreshold: 0.85,
    responseTimeThreshold: 2000,
  },
};

export class EnhancedRateLimiter {
  private limiters: Map<string, RateLimiterMemory | RateLimiterRedis> = new Map();
  private concurrentQueries: Map<string, number> = new Map();
  private fieldCooldowns: Map<string, number> = new Map();
  private systemMetrics = {
    load: 0,
    memory: 0,
    avgResponseTime: 0,
  };

  constructor(
    private config: EnhancedRateLimitConfig,
    useRedis = false
  ) {
    // 在開發環境中，如果沒有明確啟用 Redis，則不使用 Redis
    const shouldUseRedis =
      (useRedis && !isDevelopment()) || process.env.ENABLE_REDIS;
    this.initializeLimiters(shouldUseRedis);
    this.startSystemMonitoring();
  }

  private initializeLimiters(useRedis: boolean): void {
    const createLimiter = (key: string, maxRequests: number, windowMs: number) => {
      if (useRedis) {
        return new RateLimiterRedis({
          storeClient: redisCacheAdapter,
          keyPrefix: `rate_limit:${key}`,
          points: maxRequests,
          duration: Math.ceil(windowMs / 1000),
          blockDuration: Math.ceil(windowMs / 1000),
        });
      } else {
        return new RateLimiterMemory({
          keyPrefix: `rate_limit:${key}`,
          points: maxRequests,
          duration: Math.ceil(windowMs / 1000),
          blockDuration: Math.ceil(windowMs / 1000),
        });
      }
    };

    // 初始化各種限流器
    // 1. Mutation 限流器
    Object.entries(this.config.mutationLimits).forEach(([operation, limit]) => {
      this.limiters.set(
        `mutation:${operation}`,
        createLimiter(`mutation_${operation}`, limit.maxRequests, limit.windowMs)
      );
    });

    // 2. 用戶角色限流器
    Object.entries(this.config.userRoleLimits).forEach(([role, limit]) => {
      this.limiters.set(
        `role:${role}`,
        createLimiter(`role_${role}`, limit.maxRequestsPerMinute, 60000)
      );
    });

    // 3. 操作類型限流器
    Object.entries(this.config.operationTypeLimits).forEach(([type, limit]) => {
      if (type !== 'subscription') {
        this.limiters.set(
          `operation:${type}`,
          createLimiter(`operation_${type}`, limit.maxRequestsPerMinute, 60000)
        );
      }
    });

    // 4. 欄位級限流器
    Object.entries(this.config.fieldLevelLimits).forEach(([field, limit]) => {
      this.limiters.set(
        `field:${field}`,
        createLimiter(`field_${field.replace('.', '_')}`, limit.maxRequestsPerMinute, 60000)
      );
    });

    // 5. 業務邏輯限流器
    this.limiters.set(
      'business:stock',
      createLimiter(
        'business_stock',
        this.config.businessLogicLimits.stockOperations.maxPerMinute,
        60000
      )
    );
    this.limiters.set(
      'business:reports',
      createLimiter(
        'business_reports',
        this.config.businessLogicLimits.reportGeneration.maxPerHour,
        3600000
      )
    );
    this.limiters.set(
      'business:bulk',
      createLimiter(
        'business_bulk',
        this.config.businessLogicLimits.bulkOperations.maxPerHour,
        3600000
      )
    );

    // 6. IP 限流器
    this.limiters.set(
      'ip:general',
      createLimiter(
        'ip_general',
        this.config.ipLimits.maxRequestsPerMinute,
        this.config.ipLimits.windowMs
      )
    );
  }

  private startSystemMonitoring(): void {
    if (!this.config.adaptiveLimits.enabled) return;

    setInterval(() => {
      this.updateSystemMetrics();
    }, 5000); // 每5秒更新一次系統指標
  }

  private async updateSystemMetrics(): Promise<void> {
    try {
      // 模擬系統指標獲取 (實際環境中應該從系統監控 API 獲取)
      const memUsage = process.memoryUsage();
      this.systemMetrics.memory = memUsage.heapUsed / memUsage.heapTotal;

      // 這裡可以集成實際的系統負載監控
      // this.systemMetrics.load = await getSystemLoad();
    } catch (error) {
      logger.error('Failed to update system metrics:', error);
    }
  }

  private getAdaptiveMultiplier(): number {
    if (!this.config.adaptiveLimits.enabled) return 1;

    let multiplier = 1;

    // 基於系統負載調整
    if (this.systemMetrics.load > this.config.adaptiveLimits.systemLoadThreshold) {
      multiplier *= 0.7; // 降低限流閾值 30%
    }

    // 基於內存使用調整
    if (this.systemMetrics.memory > this.config.adaptiveLimits.memoryThreshold) {
      multiplier *= 0.8; // 降低限流閾值 20%
    }

    // 基於響應時間調整
    if (this.systemMetrics.avgResponseTime > this.config.adaptiveLimits.responseTimeThreshold) {
      multiplier *= 0.6; // 降低限流閾值 40%
    }

    return Math.max(multiplier, 0.1); // 最低保持 10% 的限流能力
  }

  async checkRateLimit(context: {
    userId?: string;
    userRole?: string;
    ip: string;
    operationType: string;
    operationName?: string;
    fieldName?: string;
    complexity?: number;
  }): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
    const { userId, userRole, ip, operationType, operationName, fieldName, complexity } = context;
    const adaptiveMultiplier = this.getAdaptiveMultiplier();

    try {
      // 1. IP 級別檢查
      const ipLimiter = this.limiters.get('ip:general');
      if (ipLimiter) {
        const ipResult = await ipLimiter.consume(ip);
        if (ipResult.remainingPoints <= 0) {
          return {
            allowed: false,
            reason: 'IP rate limit exceeded',
            retryAfter: ipResult.msBeforeNext,
          };
        }
      }

      // 2. 用戶角色檢查
      if (userRole) {
        const roleLimiter = this.limiters.get(`role:${userRole}`);
        const roleConfig = this.config.userRoleLimits[userRole];

        if (roleLimiter && roleConfig) {
          // 調整限流閾值
          const adjustedLimit = Math.floor(roleConfig.maxRequestsPerMinute * adaptiveMultiplier);

          if (roleConfig.complexityLimit && complexity && complexity > roleConfig.complexityLimit) {
            return {
              allowed: false,
              reason: `Query complexity ${complexity} exceeds role limit ${roleConfig.complexityLimit}`,
            };
          }

          const roleResult = await roleLimiter.consume(userId || ip);
          if (roleResult.remainingPoints <= 0) {
            return {
              allowed: false,
              reason: `Role ${userRole} rate limit exceeded`,
              retryAfter: roleResult.msBeforeNext,
            };
          }
        }
      }

      // 3. 操作類型檢查
      const opLimiter = this.limiters.get(`operation:${operationType}`);
      if (opLimiter) {
        const opResult = await opLimiter.consume(userId || ip);
        if (opResult.remainingPoints <= 0) {
          return {
            allowed: false,
            reason: `${operationType} operation rate limit exceeded`,
            retryAfter: opResult.msBeforeNext,
          };
        }
      }

      // 4. Mutation 特定檢查
      if (operationType === 'mutation' && operationName) {
        const mutationLimiter = this.limiters.get(`mutation:${operationName}`);
        if (mutationLimiter) {
          const mutationResult = await mutationLimiter.consume(userId || ip);
          if (mutationResult.remainingPoints <= 0) {
            return {
              allowed: false,
              reason: `Mutation ${operationName} rate limit exceeded`,
              retryAfter: mutationResult.msBeforeNext,
            };
          }
        }
      }

      // 5. 欄位級別檢查
      if (fieldName) {
        const fieldLimiter = this.limiters.get(`field:${fieldName}`);
        const fieldConfig = this.config.fieldLevelLimits[fieldName];

        if (fieldLimiter && fieldConfig) {
          // 檢查冷卻時間
          if (fieldConfig.cooldownSeconds) {
            const cooldownKey = `${userId || ip}:${fieldName}`;
            const lastAccess = this.fieldCooldowns.get(cooldownKey);
            const now = Date.now();

            if (lastAccess && now - lastAccess < fieldConfig.cooldownSeconds * 1000) {
              return {
                allowed: false,
                reason: `Field ${fieldName} is in cooldown`,
                retryAfter: fieldConfig.cooldownSeconds * 1000 - (now - lastAccess),
              };
            }

            this.fieldCooldowns.set(cooldownKey, now);
          }

          const fieldResult = await fieldLimiter.consume(userId || ip);
          if (fieldResult.remainingPoints <= 0) {
            return {
              allowed: false,
              reason: `Field ${fieldName} rate limit exceeded`,
              retryAfter: fieldResult.msBeforeNext,
            };
          }
        }
      }

      // 6. 並發查詢檢查
      if (userId && userRole) {
        const roleConfig = this.config.userRoleLimits[userRole];
        if (roleConfig) {
          const currentConcurrent = this.concurrentQueries.get(userId) || 0;
          const maxConcurrent = Math.floor(roleConfig.maxConcurrentQueries * adaptiveMultiplier);

          if (currentConcurrent >= maxConcurrent) {
            return {
              allowed: false,
              reason: `Concurrent query limit exceeded (${currentConcurrent}/${maxConcurrent})`,
            };
          }
        }
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Rate limit check error:', error);
      // 發生錯誤時允許請求通過，但記錄錯誤
      return { allowed: true };
    }
  }

  incrementConcurrentQueries(userId: string): void {
    const current = this.concurrentQueries.get(userId) || 0;
    this.concurrentQueries.set(userId, current + 1);
  }

  decrementConcurrentQueries(userId: string): void {
    const current = this.concurrentQueries.get(userId) || 0;
    if (current > 0) {
      this.concurrentQueries.set(userId, current - 1);
    }
  }

  // 業務邏輯特定限流檢查
  async checkBusinessLogicLimit(
    operation: 'stock' | 'reports' | 'bulk',
    userId: string
  ): Promise<boolean> {
    const limiter = this.limiters.get(`business:${operation}`);
    if (!limiter) return true;

    try {
      await limiter.consume(userId);
      return true;
    } catch {
      return false;
    }
  }

  // 獲取限流統計
  async getRateLimitStats(): Promise<any> {
    const stats: any = {};

    for (const [key, limiter] of this.limiters) {
      try {
        // 這裡需要根據實際的 rate-limiter-flexible 版本調整
        stats[key] = {
          totalHits: 0, // 需要從 limiter 獲取統計
          blocked: 0,
          remainingPoints: 0,
        };
      } catch (error) {
        logger.error(`Failed to get stats for ${key}:`, error);
      }
    }

    return {
      ...stats,
      concurrentQueries: Object.fromEntries(this.concurrentQueries),
      systemMetrics: this.systemMetrics,
      adaptiveMultiplier: this.getAdaptiveMultiplier(),
    };
  }

  // 清理過期的冷卻記錄
  cleanupCooldowns(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.fieldCooldowns) {
      if (now - timestamp > 300000) {
        // 5分鐘後清理
        this.fieldCooldowns.delete(key);
      }
    }
  }
}

// 創建增強型限流器實例（開發環境使用內存版本）
const useRedisForRateLimit =
  isProduction() || process.env.ENABLE_REDIS === 'true';
export const enhancedRateLimiter = new EnhancedRateLimiter(
  enhancedRateLimitConfig,
  useRedisForRateLimit
);

// 定期清理冷卻記錄
setInterval(() => {
  enhancedRateLimiter.cleanupCooldowns();
}, 60000); // 每分鐘清理一次
