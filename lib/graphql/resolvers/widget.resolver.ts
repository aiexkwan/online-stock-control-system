/**
 * Widget-specific GraphQL Resolvers
 * Handles widget data transformation and formatting
 */

import { IResolvers } from '@graphql-tools/utils';
import { GraphQLContext } from './index';

export const widgetResolvers: IResolvers = {
  // Widget data type resolvers
  StockLevelData: {
    // Ensure proper field resolution
    items: (parent) => parent.items || [],
    totalItems: (parent) => parent.totalItems || 0,
    totalQuantity: (parent) => parent.totalQuantity || 0,
    lastUpdated: (parent) => parent.lastUpdated || new Date().toISOString(),
    refreshInterval: (parent) => parent.refreshInterval || 60000,
    dataSource: (parent) => parent.dataSource || 'stock_levels',
  },

  UnifiedOperationsData: {
    transfers: (parent) => parent.transfers || [],
    orders: (parent) => parent.orders || [],
    pallets: (parent) => parent.pallets || [],
    workLevels: (parent) => parent.workLevels || [],
    summary: (parent) => parent.summary || {
      totalTransfers: 0,
      totalOrders: 0,
      totalPallets: 0,
      activeUsers: 0,
      averageEfficiency: 0,
    },
    lastUpdated: (parent) => parent.lastUpdated || new Date().toISOString(),
    refreshInterval: (parent) => parent.refreshInterval || 60000,
    dataSource: (parent) => parent.dataSource || 'unified_operations',
  },

  // Add more widget-specific resolvers as needed
};