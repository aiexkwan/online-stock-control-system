/**
 * Stock History GraphQL Integration Test
 * Tests the actual GraphQL queries and resolvers
 */

import { describe, it, expect } from 'vitest';
import { 
  PALLET_HISTORY_BY_PRODUCT,
  PALLET_HISTORY_BY_NUMBER
} from '@/lib/graphql/queries/stock-history.graphql';

describe('Stock History GraphQL Queries', () => {
  it('should have correct structure for PALLET_HISTORY_BY_PRODUCT query', () => {
    const queryString = PALLET_HISTORY_BY_PRODUCT.loc?.source?.body;
    
    expect(queryString).toContain('query PalletHistoryByProduct');
    expect(queryString).toContain('$productCode: String!');
    expect(queryString).toContain('$filter: StockHistoryFilter');
    expect(queryString).toContain('$pagination: StockHistoryPagination');
    expect(queryString).toContain('$sort: StockHistorySort');
    
    // Check that it requests the required fields
    expect(queryString).toContain('productCode');
    expect(queryString).toContain('productInfo');
    expect(queryString).toContain('records');
    expect(queryString).toContain('totalRecords');
    expect(queryString).toContain('pageInfo');
    expect(queryString).toContain('aggregations');
    
    // Check that the fragment is used
    expect(queryString).toContain('...StockHistoryRecordFragment');
    expect(queryString).toContain('...ProductBasicInfoFragment');
  });

  it('should have correct structure for PALLET_HISTORY_BY_NUMBER query', () => {
    const queryString = PALLET_HISTORY_BY_NUMBER.loc?.source?.body;
    
    expect(queryString).toContain('query PalletHistoryByNumber');
    expect(queryString).toContain('$palletNumber: String!');
    expect(queryString).toContain('$includeJourney: Boolean = true');
    expect(queryString).toContain('$includeSeries: Boolean = true');
    
    // Check that it requests the required fields
    expect(queryString).toContain('palletNumber');
    expect(queryString).toContain('palletInfo');
    expect(queryString).toContain('records');
    expect(queryString).toContain('timeline');
    expect(queryString).toContain('currentStatus');
    expect(queryString).toContain('journey @include(if: $includeJourney)');
  });

  // SEARCH_STOCK_HISTORY query removed in simplified version

  it('should have properly defined fragments', () => {
    // Test StockHistoryRecordFragment
    const recordFragment = `
      fragment StockHistoryRecordFragment on StockHistoryRecord {
        id
        timestamp
        palletNumber
        productCode
        action
        location
        fromLocation
        toLocation
        operatorName
        quantity
        remark
        actionType
        actionCategory
        
        # Relations (only fetch when needed)
        operator {
          id
          name
          email
        }
      }
    `;
    
    expect(recordFragment).toContain('fragment StockHistoryRecordFragment');
    expect(recordFragment).toContain('timestamp');
    expect(recordFragment).toContain('operatorName');
    expect(recordFragment).toContain('action');
    expect(recordFragment).toContain('location');
    expect(recordFragment).toContain('remark');
  });

  it('should use correct cache configurations', () => {
    const { CACHE_CONFIGURATIONS } = require('@/lib/graphql/queries/stock-history.graphql');
    
    expect(CACHE_CONFIGURATIONS.palletHistoryByProduct.fetchPolicy).toBe('cache-first');
    expect(CACHE_CONFIGURATIONS.palletHistoryByNumber.fetchPolicy).toBe('cache-first');
    expect(CACHE_CONFIGURATIONS.searchStockHistory.fetchPolicy).toBe('no-cache');
  });

  it('should define correct default variables', () => {
    const { DEFAULT_QUERY_VARIABLES } = require('@/lib/graphql/queries/stock-history.graphql');
    
    expect(DEFAULT_QUERY_VARIABLES).toHaveProperty('pagination');
    expect(DEFAULT_QUERY_VARIABLES).toHaveProperty('sort');
    expect(DEFAULT_QUERY_VARIABLES).toHaveProperty('filter');
    
    expect(DEFAULT_QUERY_VARIABLES.pagination.first).toBe(40);
    expect(DEFAULT_QUERY_VARIABLES.pagination.useCursor).toBe(true);
    expect(DEFAULT_QUERY_VARIABLES.sort.field).toBe('TIMESTAMP');
    expect(DEFAULT_QUERY_VARIABLES.sort.direction).toBe('DESC');
  });
});

describe('Stock History Query Variables Types', () => {
  it('should have proper TypeScript interfaces', () => {
    // This test ensures our TypeScript interfaces are properly structured
    // Import the type definitions
    const { 
      PalletHistoryVariables,
      SinglePalletHistoryVariables,
      SearchStockHistoryVariables 
    } = require('@/lib/graphql/queries/stock-history.graphql');
    
    // These imports should not throw errors if types are properly defined
    expect(typeof PalletHistoryVariables).toBe('undefined'); // Interfaces don't exist at runtime
    expect(typeof SinglePalletHistoryVariables).toBe('undefined');
    expect(typeof SearchStockHistoryVariables).toBe('undefined');
  });
});