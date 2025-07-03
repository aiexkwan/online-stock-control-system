/**
 * Cache Strategy Optimizer
 * 
 * Features:
 * - Dynamic TTL adjustment based on usage patterns
 * - Cache hit/miss ratio monitoring
 * - Adaptive cache sizing
 * - Performance-based strategy optimization
 */

export interface CacheMetrics {
  fieldName: string;
  hits: number;
  misses: number;
  totalRequests: number;
  avgResponseTime: number;
  lastAccessed: number;
  dataVolatility: number; // How often data changes
  accessFrequency: number; // Requests per hour
}

export interface OptimizedCacheConfig {
  fieldName: string;
  ttl: number;
  maxSize: number;
  shouldCache: (parent: any, args: any, context: any) => boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  adaptiveStrategy: 'aggressive' | 'moderate' | 'conservative';
}

// Business-aware cache configuration based on data characteristics
export const businessCacheStrategies = {
  // Static/Reference Data - High TTL, Large Cache
  staticData: {
    products: {
      baseTTL: 30 * 60 * 1000, // 30 minutes
      maxTTL: 2 * 60 * 60 * 1000, // 2 hours
      priority: 'high' as const,
      adaptiveStrategy: 'moderate' as const,
    },
    warehouses: {
      baseTTL: 60 * 60 * 1000, // 1 hour
      maxTTL: 4 * 60 * 60 * 1000, // 4 hours
      priority: 'high' as const,
      adaptiveStrategy: 'conservative' as const,
    },
    users: {
      baseTTL: 15 * 60 * 1000, // 15 minutes
      maxTTL: 60 * 60 * 1000, // 1 hour
      priority: 'medium' as const,
      adaptiveStrategy: 'moderate' as const,
    },
  },

  // Dynamic/Transactional Data - Medium TTL, Moderate Cache
  transactionalData: {
    inventory: {
      baseTTL: 2 * 60 * 1000, // 2 minutes
      maxTTL: 10 * 60 * 1000, // 10 minutes
      priority: 'critical' as const,
      adaptiveStrategy: 'aggressive' as const,
    },
    orders: {
      baseTTL: 5 * 60 * 1000, // 5 minutes
      maxTTL: 30 * 60 * 1000, // 30 minutes
      priority: 'high' as const,
      adaptiveStrategy: 'moderate' as const,
    },
    pallets: {
      baseTTL: 3 * 60 * 1000, // 3 minutes
      maxTTL: 15 * 60 * 1000, // 15 minutes
      priority: 'high' as const,
      adaptiveStrategy: 'aggressive' as const,
    },
  },

  // Real-time Data - Low TTL, Small Cache
  realTimeData: {
    movements: {
      baseTTL: 30 * 1000, // 30 seconds
      maxTTL: 5 * 60 * 1000, // 5 minutes
      priority: 'medium' as const,
      adaptiveStrategy: 'aggressive' as const,
    },
    stocktakeScans: {
      baseTTL: 10 * 1000, // 10 seconds
      maxTTL: 2 * 60 * 1000, // 2 minutes
      priority: 'low' as const,
      adaptiveStrategy: 'aggressive' as const,
    },
    notifications: {
      baseTTL: 5 * 1000, // 5 seconds
      maxTTL: 30 * 1000, // 30 seconds
      priority: 'low' as const,
      adaptiveStrategy: 'conservative' as const,
    },
  },

  // Aggregated/Computed Data - Variable TTL based on complexity
  aggregatedData: {
    warehouseSummary: {
      baseTTL: 10 * 60 * 1000, // 10 minutes
      maxTTL: 60 * 60 * 1000, // 1 hour
      priority: 'medium' as const,
      adaptiveStrategy: 'moderate' as const,
    },
    analyticsData: {
      baseTTL: 15 * 60 * 1000, // 15 minutes
      maxTTL: 2 * 60 * 60 * 1000, // 2 hours
      priority: 'low' as const,
      adaptiveStrategy: 'conservative' as const,
    },
    reports: {
      baseTTL: 5 * 60 * 1000, // 5 minutes
      maxTTL: 30 * 60 * 1000, // 30 minutes
      priority: 'medium' as const,
      adaptiveStrategy: 'moderate' as const,
    },
  },
};

class CacheStrategyOptimizer {
  private metrics = new Map<string, CacheMetrics>();
  private optimizedConfigs = new Map<string, OptimizedCacheConfig>();
  private lastOptimization = 0;
  private optimizationInterval = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Initialize with default configurations
    this.initializeDefaultConfigs();
    
    // Start periodic optimization
    setInterval(() => {
      this.optimizeStrategies();
    }, this.optimizationInterval);
  }

  private initializeDefaultConfigs() {
    // Static data configurations
    Object.entries(businessCacheStrategies.staticData).forEach(([key, strategy]) => {
      this.optimizedConfigs.set(key, {
        fieldName: key,
        ttl: strategy.baseTTL,
        maxSize: this.calculateMaxSize(strategy.priority),
        shouldCache: this.createCacheCondition(key),
        priority: strategy.priority,
        adaptiveStrategy: strategy.adaptiveStrategy,
      });
    });

    // Transactional data configurations
    Object.entries(businessCacheStrategies.transactionalData).forEach(([key, strategy]) => {
      this.optimizedConfigs.set(key, {
        fieldName: key,
        ttl: strategy.baseTTL,
        maxSize: this.calculateMaxSize(strategy.priority),
        shouldCache: this.createCacheCondition(key),
        priority: strategy.priority,
        adaptiveStrategy: strategy.adaptiveStrategy,
      });
    });

    // Real-time data configurations
    Object.entries(businessCacheStrategies.realTimeData).forEach(([key, strategy]) => {
      this.optimizedConfigs.set(key, {
        fieldName: key,
        ttl: strategy.baseTTL,
        maxSize: this.calculateMaxSize(strategy.priority),
        shouldCache: this.createCacheCondition(key),
        priority: strategy.priority,
        adaptiveStrategy: strategy.adaptiveStrategy,
      });
    });

    // Aggregated data configurations
    Object.entries(businessCacheStrategies.aggregatedData).forEach(([key, strategy]) => {
      this.optimizedConfigs.set(key, {
        fieldName: key,
        ttl: strategy.baseTTL,
        maxSize: this.calculateMaxSize(strategy.priority),
        shouldCache: this.createCacheCondition(key),
        priority: strategy.priority,
        adaptiveStrategy: strategy.adaptiveStrategy,
      });
    });
  }

  private calculateMaxSize(priority: string): number {
    switch (priority) {
      case 'critical': return 5000;
      case 'high': return 2000;
      case 'medium': return 1000;
      case 'low': return 500;
      default: return 1000;
    }
  }

  private createCacheCondition(fieldName: string) {
    return (parent: any, args: any, context: any) => {
      // Business logic for when to cache
      switch (fieldName) {
        case 'products':
          return !args.realtime && (!args.first || args.first <= 100);
          
        case 'inventory':
          return !args.realtime && args.first && args.first <= 50;
          
        case 'orders':
          return args.status !== 'ACTIVE' || (args.first && args.first <= 20);
          
        case 'movements':
          return args.first && args.first <= 10;
          
        case 'warehouseSummary':
          return true; // Always cache summaries
          
        case 'analyticsData':
          return !args.realtime;
          
        default:
          return args.first && args.first <= 20;
      }
    };
  }

  // Record cache metrics
  recordCacheHit(fieldName: string, responseTime: number) {
    this.updateMetrics(fieldName, true, responseTime);
  }

  recordCacheMiss(fieldName: string, responseTime: number) {
    this.updateMetrics(fieldName, false, responseTime);
  }

  private updateMetrics(fieldName: string, isHit: boolean, responseTime: number) {
    const now = Date.now();
    const metrics = this.metrics.get(fieldName) || {
      fieldName,
      hits: 0,
      misses: 0,
      totalRequests: 0,
      avgResponseTime: 0,
      lastAccessed: now,
      dataVolatility: 0.1, // Default low volatility
      accessFrequency: 0,
    };

    // Update hit/miss counts
    if (isHit) {
      metrics.hits++;
    } else {
      metrics.misses++;
    }
    metrics.totalRequests++;

    // Update average response time
    metrics.avgResponseTime = 
      (metrics.avgResponseTime * (metrics.totalRequests - 1) + responseTime) / metrics.totalRequests;

    // Update access frequency (requests per hour)
    const timeSinceLastAccess = now - metrics.lastAccessed;
    if (timeSinceLastAccess > 0) {
      const requestsPerMs = 1 / timeSinceLastAccess;
      const requestsPerHour = requestsPerMs * 60 * 60 * 1000;
      metrics.accessFrequency = 
        (metrics.accessFrequency * 0.9) + (requestsPerHour * 0.1); // Exponential smoothing
    }

    metrics.lastAccessed = now;
    this.metrics.set(fieldName, metrics);
  }

  // Optimize cache strategies based on collected metrics
  private optimizeStrategies() {
    const now = Date.now();
    if (now - this.lastOptimization < this.optimizationInterval) {
      return; // Too soon to optimize again
    }

    console.log('🔄 Optimizing cache strategies based on usage patterns...');

    this.metrics.forEach((metrics, fieldName) => {
      const config = this.optimizedConfigs.get(fieldName);
      if (!config) return;

      const optimizedConfig = this.calculateOptimalConfig(metrics, config);
      this.optimizedConfigs.set(fieldName, optimizedConfig);
    });

    this.lastOptimization = now;
    this.generateOptimizationReport();
  }

  private calculateOptimalConfig(
    metrics: CacheMetrics, 
    currentConfig: OptimizedCacheConfig
  ): OptimizedCacheConfig {
    const hitRatio = metrics.totalRequests > 0 ? metrics.hits / metrics.totalRequests : 0;
    const strategy = this.getBusinessStrategy(currentConfig.fieldName);
    
    if (!strategy) return currentConfig;

    let newTTL = currentConfig.ttl;
    let newMaxSize = currentConfig.maxSize;

    // Adjust TTL based on hit ratio and access frequency
    if (hitRatio > 0.8 && metrics.accessFrequency > 10) {
      // High hit ratio and frequent access - increase TTL
      newTTL = Math.min(currentConfig.ttl * 1.2, strategy.maxTTL);
    } else if (hitRatio < 0.3) {
      // Low hit ratio - decrease TTL
      newTTL = Math.max(currentConfig.ttl * 0.8, strategy.baseTTL * 0.5);
    }

    // Adjust cache size based on access patterns
    if (metrics.accessFrequency > 50 && hitRatio > 0.7) {
      // High frequency, good hit ratio - increase cache size
      newMaxSize = Math.min(currentConfig.maxSize * 1.5, this.calculateMaxSize('critical'));
    } else if (metrics.accessFrequency < 5) {
      // Low frequency - decrease cache size
      newMaxSize = Math.max(currentConfig.maxSize * 0.7, this.calculateMaxSize('low'));
    }

    // Business-specific optimizations
    newTTL = this.applyBusinessRules(currentConfig.fieldName, newTTL, metrics);

    return {
      ...currentConfig,
      ttl: Math.round(newTTL),
      maxSize: Math.round(newMaxSize),
    };
  }

  private getBusinessStrategy(fieldName: string) {
    // Find strategy in all categories
    for (const category of Object.values(businessCacheStrategies)) {
      if (category[fieldName as keyof typeof category]) {
        return category[fieldName as keyof typeof category];
      }
    }
    return null;
  }

  private applyBusinessRules(fieldName: string, ttl: number, metrics: CacheMetrics): number {
    // Business-specific TTL adjustments
    switch (fieldName) {
      case 'inventory':
        // Inventory data should have shorter TTL during business hours
        const hour = new Date().getHours();
        if (hour >= 8 && hour <= 18) {
          return ttl * 0.5; // Reduce TTL during business hours
        }
        return ttl;

      case 'orders':
        // Orders with high access frequency need shorter TTL
        if (metrics.accessFrequency > 20) {
          return Math.min(ttl, 3 * 60 * 1000); // Max 3 minutes for frequently accessed orders
        }
        return ttl;

      case 'movements':
        // Movement data is real-time critical
        return Math.min(ttl, 2 * 60 * 1000); // Never cache movements for more than 2 minutes

      case 'warehouseSummary':
        // Summary data can be cached longer if not frequently accessed
        if (metrics.accessFrequency < 2) {
          return ttl * 2; // Double TTL for infrequently accessed summaries
        }
        return ttl;

      default:
        return ttl;
    }
  }

  // Get optimized configuration for a field
  getOptimizedConfig(fieldName: string): OptimizedCacheConfig | null {
    return this.optimizedConfigs.get(fieldName) || null;
  }

  // Get all optimized configurations
  getAllOptimizedConfigs(): Map<string, OptimizedCacheConfig> {
    return new Map(this.optimizedConfigs);
  }

  // Generate optimization report
  private generateOptimizationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalFields: this.metrics.size,
      optimizations: [] as any[],
      recommendations: [] as string[],
    };

    this.metrics.forEach((metrics, fieldName) => {
      const config = this.optimizedConfigs.get(fieldName);
      const hitRatio = metrics.totalRequests > 0 ? metrics.hits / metrics.totalRequests : 0;

      report.optimizations.push({
        fieldName,
        hitRatio: Math.round(hitRatio * 100) / 100,
        totalRequests: metrics.totalRequests,
        avgResponseTime: Math.round(metrics.avgResponseTime),
        accessFrequency: Math.round(metrics.accessFrequency * 100) / 100,
        currentTTL: config?.ttl || 0,
        currentMaxSize: config?.maxSize || 0,
      });

      // Generate recommendations
      if (hitRatio < 0.3 && metrics.totalRequests > 10) {
        report.recommendations.push(
          `Consider disabling cache for '${fieldName}' (hit ratio: ${Math.round(hitRatio * 100)}%)`
        );
      }
      
      if (hitRatio > 0.9 && metrics.accessFrequency > 20) {
        report.recommendations.push(
          `Consider increasing cache size for '${fieldName}' (excellent performance)`
        );
      }
    });

    console.log('📊 Cache Optimization Report:', JSON.stringify(report, null, 2));
    return report;
  }

  // Get current cache statistics
  getCacheStats() {
    const stats = {
      totalFields: this.metrics.size,
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      avgHitRatio: 0,
      fieldStats: [] as any[],
    };

    this.metrics.forEach((metrics, fieldName) => {
      stats.totalRequests += metrics.totalRequests;
      stats.totalHits += metrics.hits;
      stats.totalMisses += metrics.misses;

      const hitRatio = metrics.totalRequests > 0 ? metrics.hits / metrics.totalRequests : 0;
      stats.fieldStats.push({
        fieldName,
        requests: metrics.totalRequests,
        hitRatio: Math.round(hitRatio * 100) / 100,
        avgResponseTime: Math.round(metrics.avgResponseTime),
        accessFrequency: Math.round(metrics.accessFrequency * 100) / 100,
      });
    });

    stats.avgHitRatio = stats.totalRequests > 0 ? stats.totalHits / stats.totalRequests : 0;
    return stats;
  }

  // Reset metrics for testing or maintenance
  resetMetrics() {
    this.metrics.clear();
    console.log('🔄 Cache metrics reset');
  }
}

// Global cache strategy optimizer instance
export const cacheOptimizer = new CacheStrategyOptimizer();

// Integration with field-level cache
export function optimizedCacheDecorator(fieldName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const config = cacheOptimizer.getOptimizedConfig(fieldName);
      const startTime = Date.now();

      try {
        // Check if caching should be applied based on optimized config
        if (config && config.shouldCache(...args)) {
          // Try cache first (implementation depends on your cache store)
          const cachedResult = await getCachedResult(fieldName, args, config.ttl);
          
          if (cachedResult !== null) {
            const responseTime = Date.now() - startTime;
            cacheOptimizer.recordCacheHit(fieldName, responseTime);
            return cachedResult;
          }
        }

        // Cache miss - execute original method
        const result = await originalMethod.apply(this, args);
        const responseTime = Date.now() - startTime;

        cacheOptimizer.recordCacheMiss(fieldName, responseTime);

        // Cache the result if config allows
        if (config) {
          await setCachedResult(fieldName, args, result, config.ttl);
        }

        return result;
      } catch (error) {
        const responseTime = Date.now() - startTime;
        cacheOptimizer.recordCacheMiss(fieldName, responseTime);
        throw error;
      }
    };

    return descriptor;
  };
}

// Placeholder cache functions (implement with your cache store)
async function getCachedResult(fieldName: string, args: any[], ttl: number): Promise<any> {
  // Implementation depends on your cache store (Redis, in-memory, etc.)
  return null;
}

async function setCachedResult(fieldName: string, args: any[], result: any, ttl: number): Promise<void> {
  // Implementation depends on your cache store
} 