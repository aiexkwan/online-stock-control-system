/**
 * GraphQL Mock Handlers for MSW
 * Provides mock responses for GraphQL queries and mutations
 */

import { graphql, HttpResponse } from 'msw';

export const graphqlHandlers = [
  // Stock History Query Mocks
  graphql.query('GetPalletHistoryByNumber', () => {
    return HttpResponse.json({
      data: {
        palletHistoryByNumber: {
          palletNumber: 'PLT12345',
          records: [],
          totalRecords: 0,
          palletInfo: {
            plt_num: 'PLT12345',
            productCode: 'TEST001',
            quantity: 100,
            location: 'WAREHOUSE-A',
            status: 'ACTIVE'
          }
        }
      }
    });
  }),

  graphql.query('GetPalletHistoryByProduct', () => {
    return HttpResponse.json({
      data: {
        palletHistoryByProduct: {
          productCode: 'TEST001',
          records: [],
          totalRecords: 0,
          productInfo: {
            code: 'TEST001',
            description: 'Test Product',
            type: 'STANDARD',
            colour: 'BLACK'
          }
        }
      }
    });
  }),

  // Stock Stats Query Mock
  graphql.query('GetStockHistoryStats', () => {
    return HttpResponse.json({
      data: {
        stockHistoryStats: {
          totalMovements: 1500,
          uniquePallets: 250,
          uniqueProducts: 50,
          uniqueOperators: 12,
          dateRange: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-12-31T23:59:59Z'
          }
        }
      }
    });
  }),

  // Product Search Query Mock
  graphql.query('SearchProduct', () => {
    return HttpResponse.json({
      data: {
        searchProduct: [
          {
            code: 'TEST001',
            description: 'Test Product 1',
            type: 'STANDARD',
            colour: 'BLACK'
          },
          {
            code: 'TEST002',
            description: 'Test Product 2',
            type: 'PREMIUM',
            colour: 'WHITE'
          }
        ]
      }
    });
  }),

  // Mutations
  graphql.mutation('CreatePallet', () => {
    return HttpResponse.json({
      data: {
        createPallet: {
          success: true,
          pallet: {
            plt_num: 'PLT99999',
            productCode: 'TEST001',
            quantity: 100
          }
        }
      }
    });
  }),

  graphql.mutation('VoidPallet', () => {
    return HttpResponse.json({
      data: {
        voidPallet: {
          success: true,
          message: 'Pallet voided successfully'
        }
      }
    });
  })
];