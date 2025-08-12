/**
 * Stock History GraphQL Resolvers
 * High-performance resolvers with DataLoader optimization for N+1 prevention
 */

import { IResolvers } from '@graphql-tools/utils';
import { GraphQLContext } from './index';
import { StockHistoryDataLoader } from '../dataloaders/stock-history.dataloader';
import { GraphQLError } from 'graphql';
import { withFilter } from 'graphql-subscriptions';
import type { StockHistoryRecord as BaseStockHistoryRecord } from '../types/database-types';
// Import the dataloader's expected type
type DataLoaderStockHistoryRecord = {
  id: string;
  timestamp: string;
  palletNumber: string;
  productCode: string;
  action: string;
  location?: string;
  fromLocation?: string;
  toLocation?: string;
  operatorId?: string | number;
  operatorName: string;
  quantity?: number;
  remark?: string;
};

// Extended StockHistoryRecord with all required fields
interface StockHistoryRecord extends Omit<BaseStockHistoryRecord, 'operatorId' | 'productCode' | 'operatorName' | 'timestamp'> {
  transferId?: string;
  operatorId?: number | string;
  operatorName?: string;
  fromLocation?: string;
  toLocation?: string;
  productCode?: string;
  timestamp: Date | string;
}

// Define types for resolvers
interface PalletHistoryResult {
  productCode: string;
  productInfo?: {
    code: string;
    description: string;
    chineseDescription?: string | null;
    type: string;
    colour: string;
    standardQty?: number | null;
    createdAt?: string;
    updatedAt?: string;
  };
  records: StockHistoryRecord[];
  totalRecords: number;
  pageInfo?: {
    hasNextPage: boolean;
    hasPreviousPage?: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
    totalCount?: number;
    totalPages?: number;
  };
  aggregations?: {
    totalActions: number;
    uniquePallets: number;
    uniqueOperators: number;
  };
  timelineGroups?: Array<{
    date: string;
    count: number;
    records: StockHistoryRecord[];
  }>;
  locationDistribution?: Array<{
    location: string;
    count: number;
    percentage: number;
  }>;
  operatorDistribution?: Array<{
    operatorId: string;
    operatorName: string;
    count: number;
    percentage: number;
  }>;
}

interface SinglePalletHistoryResult {
  palletNumber: string;
  palletInfo?: {
    pltNum: string;
    productCode?: string;
    productQty?: number;
    generateTime?: string;
    series?: string;
    pltRemark?: string;
    product?: {
      code: string;
      description: string;
      chineseDescription?: string | null;
      type: string;
      colour: string;
      standardQty?: number | null;
    } | null;
  };
  records: StockHistoryRecord[];
  totalRecords: number;
  pageInfo?: {
    hasNextPage: boolean;
    hasPreviousPage?: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
    totalCount?: number;
    totalPages?: number;
  };
}

export const stockHistoryResolvers: IResolvers<unknown, GraphQLContext> = {
  // Type Resolvers - Optimized with DataLoader
  StockHistoryRecord: {
    pallet: async (parent: StockHistoryRecord, _args: unknown, context: GraphQLContext) => {
      return context.loaders.pallet?.load(parent.palletNumber) || null;
    },
    
    product: async (parent: StockHistoryRecord, _args: unknown, context: GraphQLContext) => {
      try {
        if (!parent.productCode) return null;
        const product = await context.loaders.product?.load(parent.productCode);
        return product || null;
      } catch (error) {
        console.warn(`Could not load product ${parent.productCode}:`, error);
        return null;
      }
    },
    
    operator: async (parent: StockHistoryRecord, _args: unknown, context: GraphQLContext) => {
      if (!parent.operatorId && !parent.operatorName) return null;
      
      // Try ID first, fallback to name lookup
      if (parent.operatorId) {
        return context.loaders.user?.load(String(parent.operatorId)) || null;
      }
      
      // Name-based lookup through batch loader
      if (parent.operatorName) {
        return context.loaders.userByName?.load(parent.operatorName) || null;
      }
      return null;
    },
    
    transfer: async (parent: StockHistoryRecord, _args: unknown, context: GraphQLContext) => {
      if (!parent.transferId) return null;
      return context.loaders.transfer?.load(parent.transferId) || null;
    },
    
    actionType: (parent: StockHistoryRecord) => {
      // Compute action type based on action
      const movementActions = ['TRANSFERRED', 'MOVED'];
      const statusActions = ['VOIDED', 'ALLOCATED', 'QUALITY_CHECK'];
      const quantityActions = ['ADJUSTED', 'LOADED', 'UNLOADED'];
      const systemActions = ['CREATED'];
      
      if (movementActions.includes(parent.action)) return 'MOVEMENT';
      if (statusActions.includes(parent.action)) return 'STATUS_CHANGE';
      if (quantityActions.includes(parent.action)) return 'QUANTITY_CHANGE';
      if (systemActions.includes(parent.action)) return 'SYSTEM_ACTION';
      return 'SYSTEM_ACTION';
    },
    
    actionCategory: (parent: StockHistoryRecord) => {
      // Categorize based on location flow
      if (parent.toLocation && !parent.fromLocation) return 'INBOUND';
      if (parent.fromLocation && !parent.toLocation) return 'OUTBOUND';
      if (parent.fromLocation && parent.toLocation) return 'INTERNAL';
      return 'ADMINISTRATIVE';
    },
  },

  PalletHistoryResult: {
    productInfo: async (parent: PalletHistoryResult, _args: unknown, context: GraphQLContext) => {
      try {
        const product = await context.loaders.product.load(parent.productCode);
        if (!product) {
          console.warn(`Product not found in data_code table: ${parent.productCode}`);
          // Return a default product object instead of throwing error
          return {
            code: parent.productCode,
            description: 'Product information not available',
            chineseDescription: null,
            type: 'UNKNOWN',
            colour: 'UNKNOWN',
            standardQty: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        
        // Simplified: no pallet counts needed
        return product;
      } catch (error) {
        console.error(`Error loading product ${parent.productCode}:`, error);
        // Return default product object on error
        return {
          code: parent.productCode,
          description: 'Product information not available',
          chineseDescription: null,
          type: 'UNKNOWN', 
          colour: 'UNKNOWN',
          standardQty: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    },
    
    timelineGroups: async (parent: PalletHistoryResult, _args: unknown, context: GraphQLContext) => {
      // Map records to match dataloader's expected type
      const mappedRecords: DataLoaderStockHistoryRecord[] = parent.records.map(r => ({
        ...r,
        timestamp: typeof r.timestamp === 'string' ? r.timestamp : r.timestamp.toISOString(),
        operatorId: r.operatorId || 0,
        productCode: r.productCode || '',
        operatorName: r.operatorName || ''
      }));
      return StockHistoryDataLoader.groupRecordsByDate(mappedRecords);
    },
    
    locationDistribution: async (parent: PalletHistoryResult, _args: unknown, context: GraphQLContext) => {
      // Map records to match dataloader's expected type
      const mappedRecords: DataLoaderStockHistoryRecord[] = parent.records.map(r => ({
        ...r,
        timestamp: typeof r.timestamp === 'string' ? r.timestamp : r.timestamp.toISOString(),
        operatorId: r.operatorId || 0,
        productCode: r.productCode || '',
        operatorName: r.operatorName || ''
      }));
      return StockHistoryDataLoader.aggregateByLocation(mappedRecords);
    },
    
    operatorDistribution: async (parent: PalletHistoryResult, _args: unknown, context: GraphQLContext) => {
      // Map records to match dataloader's expected type
      const mappedRecords: DataLoaderStockHistoryRecord[] = parent.records.map(r => ({
        ...r,
        timestamp: typeof r.timestamp === 'string' ? r.timestamp : r.timestamp.toISOString(),
        operatorId: r.operatorId || 0,
        productCode: r.productCode || '',
        operatorName: r.operatorName || ''
      }));
      return StockHistoryDataLoader.aggregateByOperator(mappedRecords);
    },
  },

  SinglePalletHistoryResult: {
    palletInfo: async (parent: SinglePalletHistoryResult, _args: unknown, context: GraphQLContext) => {
      // Use the palletInfo already provided by DataLoader to avoid redundant queries
      if (parent.palletInfo) {
        return parent.palletInfo;
      }
      
      // Fallback: reconstruct from available data if palletInfo is missing
      if (!parent.palletNumber || parent.palletNumber.trim() === '') {
        throw new GraphQLError('Pallet number is required for pallet info lookup');
      }

      console.warn(`[SinglePalletHistoryResult] palletInfo missing from parent, falling back to loader for ${parent.palletNumber}`);
      
      const pallet = await context.loaders.pallet.load(parent.palletNumber);
      if (!pallet) {
        throw new GraphQLError(`Pallet not found: ${parent.palletNumber}`);
      }
      
      // Check if product code exists before loading
      let product = null;
      if (pallet.productCode && pallet.productCode.trim() !== '') {
        try {
          product = await context.loaders.product.load(pallet.productCode);
        } catch (error) {
          console.warn(`Could not load product ${pallet.productCode} for pallet ${parent.palletNumber}:`, error);
        }
      }
      
      return {
        ...pallet,
        product: product || null,
      };
    },
    
    // Removed: timeline, currentStatus, journey (not needed for simplified version)
  },

  // Removed: TransferTimeFlowResult resolver (not needed for simplified version)

  // Query Resolvers - Main entry points
  Query: {
    palletHistoryByProduct: async (_parent, args, context: GraphQLContext) => {
      const { productCode, filter, pagination = {}, sort } = args;
      
      try {
        // Input validation
        if (!productCode || productCode.trim() === '') {
          throw new GraphQLError('Product code is required');
        }
        
        // Build query with DataLoader optimization
        const result = await StockHistoryDataLoader.getPalletHistoryByProduct(
          productCode,
          {
            filter: filter || {},
            pagination: {
              first: pagination.first || 20,
              after: pagination.after,
              useCursor: pagination.useCursor !== false,
              ...pagination,
            },
            sort: sort || { field: 'TIMESTAMP', direction: 'DESC' },
          },
          context
        );
        
        return result;
      } catch (error) {
        console.error('Error in palletHistoryByProduct:', error);
        console.error('Error details:', {
          productCode,
          filter,
          pagination,
          sort,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined
        });
        throw error instanceof GraphQLError ? error : 
          new GraphQLError(`Failed to fetch pallet history: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    palletHistoryByNumber: async (_parent, args, context: GraphQLContext) => {
      const { palletNumber, includeJourney = true, includeSeries = true } = args;
      
      try {
        if (!palletNumber || palletNumber.trim() === '') {
          throw new GraphQLError('Pallet number is required');
        }
        
        // Handle series lookup if needed (QR code scan scenario)
        let actualPalletNumber = palletNumber.trim();
        
        if (!actualPalletNumber.startsWith('PLT') && includeSeries) {
          try {
            // Try DataLoader first (if available), then fallback to direct query
            let palletInfo = null;
            
            if (context.loaders.palletByPlateSeries) {
              try {
                palletInfo = await context.loaders.palletByPlateSeries.load(actualPalletNumber);
              } catch (dataLoaderError) {
                console.warn(`[palletHistoryByNumber] DataLoader lookup failed for series ${actualPalletNumber}:`, dataLoaderError);
              }
            }
            
            // Fallback to direct database query if DataLoader failed or unavailable
            if (!palletInfo) {
              const { data: seriesData, error: seriesError } = await context.supabase
                .from('record_palletinfo')
                .select('plt_num')
                .eq('series', actualPalletNumber)
                .single();
              
              if (!seriesError && seriesData?.plt_num) {
                actualPalletNumber = seriesData.plt_num;
                console.log(`[palletHistoryByNumber] Converted series ${palletNumber} to pallet number ${actualPalletNumber}`);
              } else {
                console.warn(`[palletHistoryByNumber] No pallet found for series: ${palletNumber}`);
                // If series lookup fails, assume it might be a pallet number anyway
              }
            } else if (palletInfo.pltNum) {
              actualPalletNumber = palletInfo.pltNum;
              console.log(`[palletHistoryByNumber] DataLoader converted series ${palletNumber} to pallet number ${actualPalletNumber}`);
            }
          } catch (seriesLookupError) {
            console.error('Error during series lookup:', seriesLookupError);
            // Continue with original value
          }
        }
        
        // Final validation - ensure we have a valid pallet number
        if (!actualPalletNumber || actualPalletNumber.trim() === '') {
          throw new GraphQLError('Unable to determine valid pallet number from input');
        }
        
        const result = await StockHistoryDataLoader.getPalletHistoryByNumber(
          actualPalletNumber,
          { includeJourney },
          context
        );
        
        return result;
      } catch (error) {
        console.error('Error in palletHistoryByNumber:', error);
        console.error('Error details:', {
          originalInput: palletNumber,
          includeJourney,
          includeSeries,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error instanceof GraphQLError ? error : 
          new GraphQLError(`Failed to fetch pallet history: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    stockHistoryStats: async (_parent, args, context: GraphQLContext) => {
      const { filter, includeTrends = false, trendsInterval = '1d' } = args;
      
      try {
        const result = await StockHistoryDataLoader.getStockHistoryStats(
          {
            filter: filter || {},
            includeTrends,
            trendsInterval,
          },
          trendsInterval || 'LAST_24_HOURS',
          context
        );
        
        return result;
      } catch (error) {
        console.error('Error in stockHistoryStats:', error);
        throw error instanceof GraphQLError ? error : 
          new Error('Failed to fetch stock history statistics');
      }
    },
  },

  // Removed: Subscription and Mutation resolvers
  // (not needed for simplified version - real-time updates and manual entries removed)
};