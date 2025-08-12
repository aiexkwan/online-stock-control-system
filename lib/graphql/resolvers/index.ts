/**
 * GraphQL Resolvers Index
 * Combines all resolvers and provides the main resolver map
 */

import { productResolvers } from './product.resolver';
import { supplierResolvers } from './supplier.resolver';
import { inventoryResolvers } from './inventory.resolver';
import { operationsResolvers } from './operations.resolver';
import { analyticsResolvers } from './analytics.resolver';
import { statsResolvers } from './stats.resolver';
import { chartResolvers } from './chart.resolver';
import { reportResolvers } from './report.resolver';
import { configResolvers } from './config.resolver';
import { navigationResolver } from './navigation.resolver';
import { dashboardResolvers } from './dashboard.resolver';
import { inventoryMigrationResolvers } from './inventory-migration.resolver';
import { orderResolvers } from './order.resolver';
import { reportGenerationResolvers } from './report-generation.resolver';
import { transferResolvers } from './transfer.resolver';
import { unifiedDepartmentResolver } from './DepartmentCards.resolver';
import { enhancedPipeDepartmentResolver } from './DepartmentPipe.resolver';
import { stockHistoryResolvers } from './stock-history.resolver';
import { stockLevelResolvers } from './stock-level.resolver';
import { recordHistoryResolvers } from './record-history.resolver';
import { IResolvers } from '@graphql-tools/utils';
import { GraphQLJSON } from 'graphql-type-json';
import { DateTimeResolver } from 'graphql-scalars';
import { DataLoaderContext } from '../dataloaders/base.dataloader';

// 批量操作結果類型
interface BatchOperationResult {
  entityId: string;
  success: boolean;
  error: {
    message: string;
    code: string;
  } | null;
  data: unknown;
}

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

          (results.successful as BatchOperationResult[]).push({
            entityId: operation.entityIds[0], // Simplified for now
            success: true,
            error: null,
            data: result.data,
          });
          results.totalSucceeded++;
        } catch (error) {
          (results.failed as BatchOperationResult[]).push({
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

};

// Combine Query resolvers in groups to avoid TypeScript union complexity
const combinedQueries = Object.assign(
  {},
  rootResolvers.Query,
  inventoryMigrationResolvers.Query,
  productResolvers.Query,
  supplierResolvers.Query,
  inventoryResolvers.Query,
  operationsResolvers.Query,
  analyticsResolvers.Query,
  statsResolvers.Query,
  chartResolvers.Query,
  reportResolvers.Query,
  dashboardResolvers.Query,
  orderResolvers.Query,
  reportGenerationResolvers.Query,
  transferResolvers.Query,
  unifiedDepartmentResolver.Query,
  enhancedPipeDepartmentResolver.Query,
  stockHistoryResolvers.Query || {},
  stockLevelResolvers.Query || {},
  recordHistoryResolvers.Query || {},
  configResolvers.Query || {},
  navigationResolver.Query || {}
);

// Combine Mutation resolvers in groups
const combinedMutations = Object.assign(
  {},
  rootResolvers.Mutation,
  inventoryMigrationResolvers.Mutation,
  productResolvers.Mutation,
  supplierResolvers.Mutation,
  inventoryResolvers.Mutation || {},
  operationsResolvers.Mutation,
  analyticsResolvers.Mutation || {},
  reportResolvers.Mutation,
  orderResolvers.Mutation,
  reportGenerationResolvers.Mutation,
  stockHistoryResolvers.Mutation || {},
  recordHistoryResolvers.Mutation || {},
  configResolvers.Mutation || {},
  navigationResolver.Mutation || {}
);

// Combine all resolvers
export const resolvers: IResolvers = {
  // Scalar types
  ...scalarResolvers,
  
  // Type resolvers (non-Query/Mutation)
  ...(productResolvers.Product ? { Product: productResolvers.Product } : {}),
  ...(supplierResolvers.Supplier ? { Supplier: supplierResolvers.Supplier } : {}),
  ...(inventoryResolvers.Inventory ? { Inventory: inventoryResolvers.Inventory } : {}),
  ...(inventoryResolvers.Pallet ? { Pallet: inventoryResolvers.Pallet } : {}),
  ...(operationsResolvers.Transfer ? { Transfer: operationsResolvers.Transfer } : {}),
  ...(operationsResolvers.GoodsReceipt ? { GoodsReceipt: operationsResolvers.GoodsReceipt } : {}),
  ...(operationsResolvers.QualityCheck ? { QualityCheck: operationsResolvers.QualityCheck } : {}),
  ...(stockHistoryResolvers.StockHistoryRecord ? { StockHistoryRecord: stockHistoryResolvers.StockHistoryRecord } : {}),
  ...(stockHistoryResolvers.PalletHistoryResult ? { PalletHistoryResult: stockHistoryResolvers.PalletHistoryResult } : {}),
  ...(stockHistoryResolvers.SinglePalletHistoryResult ? { SinglePalletHistoryResult: stockHistoryResolvers.SinglePalletHistoryResult } : {}),
  ...(stockHistoryResolvers.TransferTimeFlowResult ? { TransferTimeFlowResult: stockHistoryResolvers.TransferTimeFlowResult } : {}),
  ...(stockLevelResolvers.StockLevelRecord ? { StockLevelRecord: stockLevelResolvers.StockLevelRecord } : {}),
  
  // Query and Mutation resolvers
  Query: combinedQueries,
  Mutation: combinedMutations,
  
  // Subscription resolvers
  ...(stockHistoryResolvers.Subscription ? { Subscription: stockHistoryResolvers.Subscription } : {}),
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
