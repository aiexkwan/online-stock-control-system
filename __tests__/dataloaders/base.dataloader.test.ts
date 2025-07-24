/**
 * Tests for base.dataloader.ts type safety
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  createBatchLoader, 
  batchQuery, 
  createSimpleLoader,
  createRelatedLoader,
  createAggregateLoader,
  DataLoaderContext 
} from '@/lib/graphql/dataloaders/base.dataloader';
import type { Product, Pallet, StockLevelKey, StockLevelData } from '@/types/dataloaders';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  select: vi.fn(),
  in: vi.fn(),
  order: vi.fn(),
};

describe('DataLoader Type Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create typed simple loader for Product', () => {
    const loader = createSimpleLoader<Product>(mockSupabase as any, 'products', 'code');
    expect(loader).toBeDefined();
    expect(loader.constructor.name).toBe('DataLoader');
  });

  it('should create typed related loader for Pallet', () => {
    const loader = createRelatedLoader<Pallet>(
      mockSupabase as any, 
      'pallets', 
      'productCode',
      { column: 'createdAt', ascending: false }
    );
    expect(loader).toBeDefined();
  });

  it('should create typed aggregate loader', () => {
    const aggregateQuery = async (keys: readonly StockLevelKey[]) => {
      const data = new Map<StockLevelKey, StockLevelData>();
      keys.forEach(key => {
        data.set(key, {
          productCode: key.productCode,
          productName: 'Test Product',
          warehouse: key.warehouse,
          currentLevel: 100,
          reservedQuantity: 20,
          availableQuantity: 80,
          lastUpdated: new Date().toISOString(),
        });
      });
      return { data, error: null };
    };

    const loader = createAggregateLoader<StockLevelKey, StockLevelData>(
      mockSupabase as any,
      aggregateQuery
    );
    expect(loader).toBeDefined();
  });

  it('should handle batch query with proper types', async () => {
    const mockData = [
      { code: 'PROD1', name: 'Product 1' },
      { code: 'PROD2', name: 'Product 2' },
    ];

    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.in.mockResolvedValue({ data: mockData, error: null });

    const results = await batchQuery<Product>(
      mockSupabase as any,
      'products',
      'code',
      ['PROD1', 'PROD2', 'PROD3']
    );

    expect(results).toHaveLength(3);
    expect(results[0]).toEqual(mockData[0]);
    expect(results[1]).toEqual(mockData[1]);
    expect(results[2]).toBeNull();
  });

  it('should verify DataLoaderContext types', () => {
    const context: DataLoaderContext = {
      supabase: mockSupabase as any,
      loaders: {
        product: createSimpleLoader<Product>(mockSupabase as any, 'products', 'code'),
        pallet: createSimpleLoader<Pallet>(mockSupabase as any, 'pallets', 'plt_num'),
        inventory: createSimpleLoader<any>(mockSupabase as any, 'inventory', 'id'),
        user: createSimpleLoader<any>(mockSupabase as any, 'users', 'id'),
        location: createSimpleLoader<any>(mockSupabase as any, 'locations', 'code'),
        order: createSimpleLoader<any>(mockSupabase as any, 'orders', 'order_number'),
        transfer: createSimpleLoader<any>(mockSupabase as any, 'transfers', 'id'),
        customer: createSimpleLoader<any>(mockSupabase as any, 'customers', 'code'),
        supplier: createSimpleLoader<any>(mockSupabase as any, 'suppliers', 'code'),
      },
    };

    expect(context.loaders.product).toBeDefined();
    expect(context.loaders.pallet).toBeDefined();
  });
});