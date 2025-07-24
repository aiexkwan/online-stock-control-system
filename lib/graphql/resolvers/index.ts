/**
 * GraphQL Resolvers Index
 * Combines all resolvers and provides the main resolver map
 */

import { productResolvers } from './product.resolver';
import { inventoryResolvers } from './inventory.resolver';
import { operationsResolvers } from './operations.resolver';
import { analyticsResolvers } from './analytics.resolver';
import { widgetResolvers } from './widget.resolver';
import { statsResolvers } from './stats.resolver';
import { chartResolvers } from './chart.resolver';
import { tableResolvers } from './table.resolver';
import { reportResolvers } from './report.resolver';
import { uploadResolvers } from './upload.resolver';
import { analysisResolvers } from './analysis.resolver';
import { alertResolvers } from './alert.resolver';
// import { configResolvers } from './config.resolver'; // Temporarily disabled due to SSR issue
import { searchResolver } from './search.resolver';
import { IResolvers } from '@graphql-tools/utils';
import { GraphQLJSON } from 'graphql-type-json';
import { DateTimeResolver } from 'graphql-scalars';
import { DataLoaderContext } from '../dataloaders/base.dataloader';

export interface GraphQLContext extends DataLoaderContext {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  requestId: string;
}

// Custom scalar resolvers
const scalarResolvers = {
  JSON: GraphQLJSON,
  DateTime: DateTimeResolver,
};

// Root resolvers
const rootResolvers: IResolvers = {
  Query: {
    // Health check
    health: async (_parent, _args, context: GraphQLContext) => {
      try {
        // Check database connection
        const { data, error } = await context.supabase
          .from('system_config')
          .select('value')
          .eq('key', 'version')
          .single();

        if (error) throw error;

        return {
          healthy: true,
          version: data?.value || '1.0.0',
          uptime: process.uptime(),
          activeUsers: 0, // Would need to implement active user tracking
          lastBackup: new Date().toISOString(),
        };
      } catch (error) {
        console.error('[Health Check] Error:', error);
        return {
          healthy: false,
          version: 'unknown',
          uptime: process.uptime(),
          activeUsers: 0,
          lastBackup: null,
        };
      }
    },

    // Widget data unified entry point
    widgetData: async (_parent, args, context: GraphQLContext) => {
      const { dataSource, params, timeFrame } = args;

      // Route to appropriate resolver based on dataSource
      switch (dataSource) {
        case 'stock_levels':
          return context.loaders.stockLevels?.load({
            warehouse: params?.warehouse,
            dateRange: timeFrame ? {
              start: timeFrame.start,
              end: timeFrame.end,
            } : undefined,
          });

        case 'unified_operations':
          return context.loaders.unifiedOperations?.load({
            warehouse: params?.warehouse,
            dateRange: timeFrame ? {
              start: timeFrame.start,
              end: timeFrame.end,
            } : undefined,
          });

        case 'work_level':
          if (!params?.userId || !params?.date) {
            throw new Error('userId and date are required for work_level');
          }
          return context.loaders.workLevel?.load({
            userId: params.userId,
            date: params.date,
          });

        // Add more data sources as they are implemented
        default:
          throw new Error(`Unknown data source: ${dataSource}`);
      }
    },

    // Batch widget data fetch
    batchWidgetData: async (_parent, args, context: GraphQLContext) => {
      const { requests } = args;

      const results = await Promise.all(
        requests.map(async (request: any) => {
          const startTime = Date.now();
          try {
            const data = await (rootResolvers.Query as any).widgetData(
              null,
              {
                dataSource: request.dataSource,
                params: request.params,
                timeFrame: request.timeFrame,
              },
              context
            );

            return {
              widgetId: request.widgetId,
              data,
              error: null,
              source: 'GRAPHQL',
              executionTime: Date.now() - startTime,
              cached: false, // Would need to implement cache detection
            };
          } catch (error) {
            return {
              widgetId: request.widgetId,
              data: null,
              error: {
                message: error instanceof Error ? error.message : 'Unknown error',
                code: 'WIDGET_DATA_ERROR',
              },
              source: 'GRAPHQL',
              executionTime: Date.now() - startTime,
              cached: false,
            };
          }
        })
      );

      return results;
    },
  },

  Mutation: {
    // Refresh cache for a specific data source
    refreshCache: async (_parent, args, context: GraphQLContext) => {
      const { dataSource } = args;

      try {
        // Clear specific DataLoader cache
        switch (dataSource) {
          case 'product':
            context.loaders.product.clearAll();
            break;
          case 'inventory':
            context.loaders.inventory.clearAll();
            break;
          case 'stock_levels':
            if (context.loaders.stockLevels) {
              context.loaders.stockLevels.clearAll();
            }
            break;
          // Add more cases as needed
          default:
            // Clear all if no specific data source
            Object.values(context.loaders).forEach(loader => {
              if (loader && typeof loader.clearAll === 'function') {
                loader.clearAll();
              }
            });
        }

        return true;
      } catch (error) {
        console.error('[RefreshCache] Error:', error);
        return false;
      }
    },

    // Clear all caches
    clearCache: async (_parent, _args, context: GraphQLContext) => {
      try {
        Object.values(context.loaders).forEach(loader => {
          if (loader && typeof loader.clearAll === 'function') {
            loader.clearAll();
          }
        });
        return true;
      } catch (error) {
        console.error('[ClearCache] Error:', error);
        return false;
      }
    },

    // Batch operations
    batchOperation: async (_parent, args, context: GraphQLContext) => {
      const { operations } = args;
      const results = {
        successful: [],
        failed: [],
        totalProcessed: operations.length,
        totalSucceeded: 0,
        totalFailed: 0,
      };

      for (const operation of operations) {
        try {
          // Route to appropriate mutation based on operation type
          let result;
          switch (operation.operationType) {
            case 'UPDATE':
              // Implement update logic
              result = { success: true, data: { updated: true } };
              break;
            case 'TRANSFER':
              // Implement transfer logic
              result = { success: true, data: { transferred: true } };
              break;
            // Add more operation types
            default:
              throw new Error(`Unsupported operation type: ${operation.operationType}`);
          }

          (results.successful as any[]).push({
            entityId: operation.entityIds[0], // Simplified for now
            success: true,
            error: null,
            data: result.data,
          });
          results.totalSucceeded++;
        } catch (error) {
          (results.failed as any[]).push({
            entityId: operation.entityIds[0],
            success: false,
            error: {
              message: error instanceof Error ? error.message : 'Unknown error',
              code: 'BATCH_OPERATION_ERROR',
            },
            data: null,
          });
          results.totalFailed++;
        }
      }

      return results;
    },
  },

  Subscription: {
    // Placeholder for future real-time features
    inventoryUpdated: {
      subscribe: () => {
        throw new Error('Subscriptions not yet implemented');
      },
    },
    transferStatusChanged: {
      subscribe: () => {
        throw new Error('Subscriptions not yet implemented');
      },
    },
    orderStatusChanged: {
      subscribe: () => {
        throw new Error('Subscriptions not yet implemented');
      },
    },
    systemAlert: {
      subscribe: () => {
        throw new Error('Subscriptions not yet implemented');
      },
    },
  },
};

// Combine all resolvers
export const resolvers: IResolvers = {
  ...scalarResolvers,
  ...rootResolvers,
  ...productResolvers,
  ...inventoryResolvers,
  ...operationsResolvers,
  ...analyticsResolvers,
  ...widgetResolvers,
  ...statsResolvers,
  ...chartResolvers,
  ...tableResolvers,
  ...reportResolvers,
  ...uploadResolvers,
  ...analysisResolvers,
  ...alertResolvers,
  // ...configResolvers, // Temporarily disabled due to SSR issue
  ...searchResolver,
};

// Type guards for context
export function hasUser(context: GraphQLContext): boolean {
  return !!context.user;
}

export function requireAuth(context: GraphQLContext, requiredRole?: string): void {
  if (!hasUser(context)) {
    throw new Error('Authentication required');
  }

  if (requiredRole && context.user!.role !== requiredRole) {
    throw new Error(`Insufficient permissions. Required role: ${requiredRole}`);
  }
}