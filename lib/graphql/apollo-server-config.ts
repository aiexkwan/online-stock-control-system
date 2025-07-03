/**
 * Apollo Server Configuration with Rate Limiting & Performance Optimizations
 * 
 * Integrates:
 * - Rate limiting for mutations and subscriptions
 * - Query complexity analysis
 * - DataLoader for N+1 prevention
 * - Field-level caching
 * - Real-time monitoring
 */

import { ApolloServer } from 'apollo-server-express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import depthLimit from 'graphql-depth-limit';
import costAnalysis from 'graphql-cost-analysis';
import { readFileSync } from 'fs';
import { join } from 'path';

// Our optimization modules
import { 
  createRateLimitingPlugin, 
  checkMutationRateLimit,
  checkSubscriptionRateLimit,
  removeSubscriptionConnection,
  defaultRateLimitConfig,
} from './rate-limiting';
import { QueryComplexityAnalyzer } from './query-complexity';
import { createDataLoaders } from './data-loaders';
import { cacheOptimizer } from './cache-strategy-optimizer';
import { unifiedDataLayer } from './unified-data-layer';
import { unifiedPreloadService } from '@/lib/preload/unified-preload-service';
import { logger } from '@/lib/logger';

// Load GraphQL schema
const typeDefs = readFileSync(join(process.cwd(), 'lib/graphql/schema.graphql'), 'utf8');

// Create enhanced resolvers with optimizations
const createOptimizedResolvers = () => {
  return {
    Query: {
      // Core business queries with caching and rate limiting
      async products(parent: any, args: any, context: any) {
        const config = cacheOptimizer.getOptimizedConfig('products');
        const startTime = Date.now();
        
        // 觸發預加載
        if (context.user?.id) {
          context.preloadTracking = {
            query: 'products',
            args,
            timestamp: Date.now(),
          };
        }
        
        try {
          const result = await unifiedDataLayer.getProducts(args);
          const responseTime = Date.now() - startTime;
          
          if (config) {
            cacheOptimizer.recordCacheHit('products', responseTime);
          }
          
          // 分析結果進行預加載
          if (result && context.user?.id) {
            analyzeForPreload(result, context.user.id, 'products');
          }
          
          return result;
        } catch (error) {
          const responseTime = Date.now() - startTime;
          cacheOptimizer.recordCacheMiss('products', responseTime);
          throw error;
        }
      },

      async inventory(parent: any, args: any, context: any) {
        const config = cacheOptimizer.getOptimizedConfig('inventory');
        const startTime = Date.now();
        
        try {
          const result = await unifiedDataLayer.getInventory(args);
          const responseTime = Date.now() - startTime;
          
          if (config) {
            cacheOptimizer.recordCacheHit('inventory', responseTime);
          }
          
          return result;
        } catch (error) {
          const responseTime = Date.now() - startTime;
          cacheOptimizer.recordCacheMiss('inventory', responseTime);
          throw error;
        }
      },

      async orders(parent: any, args: any, context: any) {
        const config = cacheOptimizer.getOptimizedConfig('orders');
        const startTime = Date.now();
        
        try {
          const result = await unifiedDataLayer.getOrders(args);
          const responseTime = Date.now() - startTime;
          
          if (config) {
            cacheOptimizer.recordCacheHit('orders', responseTime);
          }
          
          return result;
        } catch (error) {
          const responseTime = Date.now() - startTime;
          cacheOptimizer.recordCacheMiss('orders', responseTime);
          throw error;
        }
      },

      async warehouseSummary(parent: any, args: any, context: any) {
        const config = cacheOptimizer.getOptimizedConfig('warehouseSummary');
        const startTime = Date.now();
        
        try {
          const result = await unifiedDataLayer.getWarehouseSummary(args);
          const responseTime = Date.now() - startTime;
          
          if (config) {
            cacheOptimizer.recordCacheHit('warehouseSummary', responseTime);
          }
          
          return result;
        } catch (error) {
          const responseTime = Date.now() - startTime;
          cacheOptimizer.recordCacheMiss('warehouseSummary', responseTime);
          throw error;
        }
      },
    },

    Mutation: {
      // Product mutations with rate limiting
      async createProduct(parent: any, args: any, context: any) {
        const userId = context.user?.id;
        checkMutationRateLimit('createProduct', userId);
        
        return unifiedDataLayer.createProduct(args.input);
      },

      async updateProduct(parent: any, args: any, context: any) {
        const userId = context.user?.id;
        checkMutationRateLimit('updateProduct', userId);
        
        return unifiedDataLayer.updateProduct(args.id, args.input);
      },

      async deleteProduct(parent: any, args: any, context: any) {
        const userId = context.user?.id;
        checkMutationRateLimit('deleteProduct', userId);
        
        return unifiedDataLayer.deleteProduct(args.id);
      },

      // Pallet mutations with rate limiting
      async createPallet(parent: any, args: any, context: any) {
        const userId = context.user?.id;
        checkMutationRateLimit('createPallet', userId);
        
        return unifiedDataLayer.createPallet(args.input);
      },

      async movePallet(parent: any, args: any, context: any) {
        const userId = context.user?.id;
        checkMutationRateLimit('movePallet', userId);
        
        return unifiedDataLayer.movePallet(args.input);
      },

      // Stock mutations with rate limiting
      async adjustStock(parent: any, args: any, context: any) {
        const userId = context.user?.id;
        checkMutationRateLimit('adjustStock', userId);
        
        return unifiedDataLayer.adjustStock(args.input);
      },

      async transferStock(parent: any, args: any, context: any) {
        const userId = context.user?.id;
        checkMutationRateLimit('transferStock', userId);
        
        return unifiedDataLayer.transferStock(args.input);
      },

      // Bulk operations with strict rate limiting
      async bulkUpdateInventory(parent: any, args: any, context: any) {
        const userId = context.user?.id;
        checkMutationRateLimit('bulkUpdateInventory', userId);
        
        return unifiedDataLayer.bulkUpdateInventory(args.inputs);
      },
    },

    Subscription: {
      inventoryUpdated: {
        subscribe: async (parent: any, args: any, context: any) => {
          const userId = context.user?.id;
          const ipAddress = context.req?.ip || 'unknown';
          
          const connectionId = checkSubscriptionRateLimit(userId, ipAddress);
          
          // Set up cleanup on disconnect
          context.connectionParams = { connectionId, userId, ipAddress };
          
          return unifiedDataLayer.subscribeToInventoryUpdates(args);
        },
      },

      orderStatusChanged: {
        subscribe: async (parent: any, args: any, context: any) => {
          const userId = context.user?.id;
          const ipAddress = context.req?.ip || 'unknown';
          
          const connectionId = checkSubscriptionRateLimit(userId, ipAddress);
          
          context.connectionParams = { connectionId, userId, ipAddress };
          
          return unifiedDataLayer.subscribeToOrderStatusChanges(args);
        },
      },

      palletMoved: {
        subscribe: async (parent: any, args: any, context: any) => {
          const userId = context.user?.id;
          const ipAddress = context.req?.ip || 'unknown';
          
          const connectionId = checkSubscriptionRateLimit(userId, ipAddress);
          
          context.connectionParams = { connectionId, userId, ipAddress };
          
          return unifiedDataLayer.subscribeToPalletMovements(args);
        },
      },
    },

    // Field resolvers with DataLoader optimization
    Product: {
      async inventory(parent: any, args: any, context: any) {
        return context.dataLoaders.inventoryLoader.load(parent.productCode);
      },

      async pallets(parent: any, args: any, context: any) {
        return context.dataLoaders.palletLoader.loadMany(parent.palletCodes || []);
      },
    },

    Pallet: {
      async product(parent: any, args: any, context: any) {
        return context.dataLoaders.productLoader.load(parent.productCode);
      },

      async movements(parent: any, args: any, context: any) {
        return context.dataLoaders.movementLoader.load(parent.palletNumber);
      },
    },

    Order: {
      async product(parent: any, args: any, context: any) {
        return context.dataLoaders.productLoader.load(parent.productCode);
      },

      async orderDetails(parent: any, args: any, context: any) {
        return unifiedDataLayer.getOrderDetails(parent.id, args);
      },
    },
  };
};

// Create Apollo Server with all optimizations
export function createOptimizedApolloServer() {
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: createOptimizedResolvers(),
  });

  const complexityAnalyzer = new QueryComplexityAnalyzer();

  const server = new ApolloServer({
    schema,
    
    // Context with DataLoaders and user info
    context: async ({ req, connection }) => {
      // Handle subscription context
      if (connection) {
        return {
          ...connection.context,
          dataLoaders: createDataLoaders(),
        };
      }

      // Handle query/mutation context
      const context = {
        req,
        user: req.user, // Assuming user is attached to request by auth middleware
        dataLoaders: createDataLoaders(),
        preloadTracking: null, // 用於追蹤預加載
      };
      
      // 觸發用戶行為預加載
      if (req.user?.id && req.headers.referer) {
        const currentPath = new URL(req.headers.referer).pathname;
        unifiedPreloadService.preloadForUser(req.user.id, currentPath).catch(err => {
          logger.debug('預加載失敗:', err);
        });
      }
      
      return context;
    },

    // Plugins for optimization
    plugins: [
      // Rate limiting plugin
      createRateLimitingPlugin(defaultRateLimitConfig),
      
      // Performance monitoring plugin
      {
        requestDidStart() {
          return {
            async willSendResponse(requestContext) {
              const { operationName, request, context } = requestContext;
              const complexity = complexityAnalyzer.calculateComplexity(request.query);
              
              // Log slow queries
              if (requestContext.metrics?.executionTime > 2000) {
                console.warn(`Slow query detected: ${operationName} (${requestContext.metrics.executionTime}ms, complexity: ${complexity})`);
              }
              
              // 記錄預加載追蹤
              if (context.preloadTracking && context.user?.id) {
                const tracking = context.preloadTracking;
                logger.debug('預加載追蹤:', {
                  userId: context.user.id,
                  query: tracking.query,
                  executionTime: requestContext.metrics?.executionTime,
                  complexity,
                });
                
                // 執行預加載
                await unifiedPreloadService.preloadForUser(
                  context.user.id,
                  `graphql:${tracking.query}`
                ).catch(err => {
                  logger.debug('預加載失敗:', err);
                });
              }
            },
          };
        },
      },
    ],

    // Validation rules for security and performance
    validationRules: [
      // Depth limiting
      depthLimit(10),
      
      // Cost analysis
      costAnalysis({
        maximumCost: 1000,
        defaultCost: 1,
        scalarCost: 1,
        objectCost: 5,
        listFactor: 10,
        introspectionCost: 100,
        createError: (max: number, actual: number) => {
          const message = `Query cost ${actual} exceeds maximum cost ${max}`;
          console.warn(message);
          return new Error(message);
        },
      }),
    ],

    // Subscription configuration
    subscriptions: {
      onConnect: async (connectionParams: any, webSocket: any, context: any) => {
        console.log('GraphQL subscription connected');
        return {
          ...connectionParams,
          connectedAt: new Date(),
        };
      },
      
      onDisconnect: async (webSocket: any, context: any) => {
        console.log('GraphQL subscription disconnected');
        
        // Clean up rate limiting connection
        if (context.connectionParams) {
          const { userId, ipAddress } = context.connectionParams;
          removeSubscriptionConnection(userId, ipAddress);
        }
      },
    },

    // Error formatting with monitoring
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      
      // Don't expose internal errors in production
      if (process.env.NODE_ENV === 'production') {
        if (error.message.includes('Rate limit exceeded')) {
          return new Error('Rate limit exceeded. Please try again later.');
        }
        if (error.message.includes('Query cost')) {
          return new Error('Query too complex. Please simplify your request.');
        }
        return new Error('Internal server error');
      }
      
      return error;
    },

    // Development tools
    introspection: process.env.NODE_ENV !== 'production',
    playground: process.env.NODE_ENV !== 'production',
  });

  return server;
}

// 預加載分析函數
function analyzeForPreload(result: any, userId: string, queryType: string) {
  setImmediate(async () => {
    try {
      // 分析結果並預測下一步查詢
      if (Array.isArray(result) || result?.edges) {
        const items = Array.isArray(result) ? result : result.edges?.map((e: any) => e.node) || [];
        
        // 預加載前幾個項目
        const preloadCount = Math.min(3, items.length);
        for (let i = 0; i < preloadCount; i++) {
          const item = items[i];
          if (item?.id) {
            await unifiedPreloadService.preloadForUser(
              userId,
              `${queryType}/${item.id}`
            );
          }
        }
      }
      
      // 根據查詢類型預加載相關數據
      const relatedQueries: Record<string, string[]> = {
        products: ['inventory', 'movements'],
        orders: ['orderDetails', 'customer'],
        getLowStockProducts: ['suppliers', 'reorderHistory'],
        warehouseSummary: ['zones', 'pallets'],
      };
      
      const related = relatedQueries[queryType] || [];
      for (const relatedQuery of related) {
        await unifiedPreloadService.preloadForUser(
          userId,
          `related:${queryType}:${relatedQuery}`
        );
      }
      
    } catch (error) {
      logger.debug('預加載分析失敗:', error);
    }
  });
}

// Export monitoring functions
export { 
  getRateLimitingStats,
  cacheOptimizer,
  defaultRateLimitConfig,
};

// Health check function
export function getGraphQLHealthStatus() {
  const rateLimitStats = getRateLimitingStats();
  const cacheStats = cacheOptimizer.getCacheStats();
  
  return {
    healthy: rateLimitStats.activeQueries < 50 && cacheStats.avgHitRatio > 0.3,
    rateLimiting: {
      activeQueries: rateLimitStats.activeQueries,
      totalSubscriptions: rateLimitStats.totalSubscriptions,
    },
    caching: {
      avgHitRatio: cacheStats.avgHitRatio,
      totalRequests: cacheStats.totalRequests,
    },
    timestamp: new Date().toISOString(),
  };
} 