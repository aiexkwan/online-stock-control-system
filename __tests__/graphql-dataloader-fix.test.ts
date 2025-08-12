/**
 * Test for GraphQL DataLoader undefined fix
 * Ensures palletHistoryByNumber query handles various input scenarios correctly
 */

import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { createDataLoaderContext } from '@/lib/graphql/dataloaders/base.dataloader';
import { stockHistoryResolvers } from '@/lib/graphql/resolvers/stock-history.resolver';
import { GraphQLError } from 'graphql';

// Type assertions for resolver access
const queryResolvers = stockHistoryResolvers.Query as any;
const singlePalletResolvers = stockHistoryResolvers.SinglePalletHistoryResult as any;

describe('GraphQL DataLoader Fix - palletHistoryByNumber', () => {
  let context: any;
  
  beforeEach(async () => {
    context = await createDataLoaderContext();
  });
  
  afterEach(() => {
    // Clear all caches after each test
    Object.values(context.loaders).forEach((loader: any) => {
      if (loader && typeof loader.clearAll === 'function') {
        loader.clearAll();
      }
    });
  });

  test('should handle undefined palletNumber input gracefully', async () => {
    const args = {
      palletNumber: undefined,
      includeJourney: true,
      includeSeries: true
    };

    await expect(
      queryResolvers.palletHistoryByNumber({}, args, context)
    ).rejects.toThrow(GraphQLError);
    
    await expect(
      queryResolvers.palletHistoryByNumber({}, args, context)
    ).rejects.toThrow('Pallet number is required');
  });

  test('should handle empty string palletNumber input gracefully', async () => {
    const args = {
      palletNumber: '',
      includeJourney: true,
      includeSeries: true
    };

    await expect(
      queryResolvers.palletHistoryByNumber({}, args, context)
    ).rejects.toThrow(GraphQLError);
    
    await expect(
      queryResolvers.palletHistoryByNumber({}, args, context)
    ).rejects.toThrow('Pallet number is required');
  });

  test('should handle whitespace-only palletNumber input gracefully', async () => {
    const args = {
      palletNumber: '   ',
      includeJourney: true,
      includeSeries: true
    };

    await expect(
      queryResolvers.palletHistoryByNumber({}, args, context)
    ).rejects.toThrow(GraphQLError);
    
    await expect(
      queryResolvers.palletHistoryByNumber({}, args, context)
    ).rejects.toThrow('Pallet number is required');
  });

  test('should handle valid PLT prefixed pallet number', async () => {
    const args = {
      palletNumber: 'PLT12345',
      includeJourney: true,
      includeSeries: false // Skip series lookup for direct PLT numbers
    };

    // This should not throw error during parameter validation
    // The actual query might fail if pallet doesn't exist, but that's expected
    const result = await queryResolvers.palletHistoryByNumber({}, args, context);
    
    expect(result).toBeDefined();
    expect(result.palletNumber).toBe('PLT12345');
  });

  test('should handle series lookup gracefully when pallet not found', async () => {
    const args = {
      palletNumber: 'NONEXISTENT_SERIES',
      includeJourney: true,
      includeSeries: true
    };

    // Should not throw undefined error, but might return empty results
    const result = await queryResolvers.palletHistoryByNumber({}, args, context);
    
    expect(result).toBeDefined();
    // The result should have the original input as palletNumber since series lookup failed
    expect(result.palletNumber).toBe('NONEXISTENT_SERIES');
  });

  test('should handle palletInfo resolver with undefined parent.palletNumber', async () => {
    const parent = {
      palletNumber: undefined,
      records: [],
      totalRecords: 0
    };

    await expect(
      singlePalletResolvers.palletInfo(parent, {}, context)
    ).rejects.toThrow(GraphQLError);
    
    await expect(
      singlePalletResolvers.palletInfo(parent, {}, context)
    ).rejects.toThrow('Pallet number is required for pallet info lookup');
  });

  test('should handle palletInfo resolver with empty parent.palletNumber', async () => {
    const parent = {
      palletNumber: '',
      records: [],
      totalRecords: 0
    };

    await expect(
      singlePalletResolvers.palletInfo(parent, {}, context)
    ).rejects.toThrow(GraphQLError);
  });

  test('should validate DataLoader context has required loaders', () => {
    expect(context.loaders).toBeDefined();
    expect(context.loaders.pallet).toBeDefined();
    expect(context.loaders.product).toBeDefined();
    expect(context.loaders.palletByPlateSeries).toBeDefined();
    expect(context.loaders.userByName).toBeDefined();
    
    // Test that loaders have load method
    expect(typeof context.loaders.pallet.load).toBe('function');
    expect(typeof context.loaders.product.load).toBe('function');
    expect(typeof context.loaders.palletByPlateSeries.load).toBe('function');
    expect(typeof context.loaders.userByName.load).toBe('function');
  });

  test('should not call DataLoader.load with undefined values', async () => {
    // Mock the pallet loader to track calls
    const originalLoad = context.loaders.pallet.load;
    let loadCalledWith: any[] = [];
    
    context.loaders.pallet.load = (key: any) => {
      loadCalledWith.push(key);
      return originalLoad.call(context.loaders.pallet, key);
    };

    const parent = {
      palletNumber: 'PLT12345',
      records: [],
      totalRecords: 0
    };

    try {
      await singlePalletResolvers.palletInfo(parent, {}, context);
    } catch (error) {
      // Expected to fail as pallet might not exist
    }

    // Ensure no undefined values were passed to DataLoader
    expect(loadCalledWith).not.toContain(undefined);
    expect(loadCalledWith).not.toContain(null);
    expect(loadCalledWith).not.toContain('');
    
    // Should have been called with the actual pallet number
    expect(loadCalledWith).toContain('PLT12345');
  });
});