import { UnifiedDataLayer } from '../unified-data-layer';
import { graphqlClient } from '../../graphql-client-stable';
import { createMockProduct, createMockPallet, createSupabaseResponse } from '@/__tests__/mocks/factories';

// Mock the graphql client
jest.mock('../../graphql-client-stable', () => ({
  graphqlClient: {
    query: jest.fn(),
    mutate: jest.fn(),
  }
}));

describe('UnifiedDataLayer Resolvers', () => {
  let dataLayer: UnifiedDataLayer;
  let mockGraphqlClient: any;

  beforeEach(() => {
    dataLayer = new UnifiedDataLayer();
    mockGraphqlClient = graphqlClient;
    jest.clearAllMocks();
  });

  describe('Product Resolvers', () => {
    describe('getProduct', () => {
      it('should fetch a single product by ID', async () => {
        const mockProduct = {
          code: 'PROD001',
          description: 'Test Product',
          colour: 'Red',
          standard_qty: 100,
          type: 'TYPE_A',
          remark: null
        };

        mockGraphqlClient.query.mockResolvedValue({
          data: {
            data_codeCollection: {
              edges: [{
                node: mockProduct
              }]
            }
          }
        });

        const result = await dataLayer.getProduct('PROD001');

        expect(mockGraphqlClient.query).toHaveBeenCalledWith({
          query: expect.stringContaining('query GetProduct'),
          variables: { code: 'PROD001' }
        });

        expect(result).toEqual({
          id: 'PROD001',
          code: 'PROD001',
          description: 'Test Product',
          colour: 'Red',
          standardQty: 100,
          type: 'TYPE_A',
          remark: null
        });
      });

      it('should return null when product not found', async () => {
        mockGraphqlClient.query.mockResolvedValue({
          data: {
            data_codeCollection: {
              edges: []
            }
          }
        });

        const result = await dataLayer.getProduct('INVALID');
        expect(result).toBeNull();
      });
    });

    describe('getProducts', () => {
      it('should fetch products with pagination', async () => {
        const mockProducts = [
          { code: 'PROD001', description: 'Product 1', colour: 'Red', standard_qty: 100, type: 'TYPE_A' },
          { code: 'PROD002', description: 'Product 2', colour: 'Blue', standard_qty: 200, type: 'TYPE_B' }
        ];

        mockGraphqlClient.query.mockResolvedValue({
          data: {
            data_codeCollection: {
              edges: mockProducts.map(p => ({ cursor: p.code, node: p })),
              pageInfo: {
                hasNextPage: true,
                hasPreviousPage: false,
                startCursor: 'PROD001',
                endCursor: 'PROD002'
              },
              totalCount: 2
            }
          }
        });

        const result = await dataLayer.getProducts(
          { type: 'TYPE_A' },
          { first: 10 }
        );

        expect(mockGraphqlClient.query).toHaveBeenCalledWith({
          query: expect.stringContaining('query GetProducts'),
          variables: {
            filter: expect.any(Object),
            first: 10,
            after: undefined
          }
        });

        expect(result.totalCount).toBe(2);
        expect(result.edges).toHaveLength(2);
        expect(result.pageInfo.hasNextPage).toBe(true);
      });

      it('should apply filters correctly', async () => {
        mockGraphqlClient.query.mockResolvedValue({
          data: {
            data_codeCollection: {
              edges: [],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: null,
                endCursor: null
              },
              totalCount: 0
            }
          }
        });

        await dataLayer.getProducts({
          code: 'PROD',
          colour: 'Red',
          search: 'test'
        });

        const callArgs = mockGraphqlClient.query.mock.calls[0][0];
        expect(callArgs.variables.filter).toMatchObject({
          code: { ilike: '%PROD%' },
          colour: { eq: 'Red' }
        });
      });
    });
  });

  describe('Pallet Resolvers', () => {
    describe('getPallets', () => {
      it('should fetch pallets with filter and pagination', async () => {
        const mockPallets = [
          {
            plt_num: 'PLT12345678',
            product_code: 'PROD001',
            series: 'S001',
            generate_time: '2025-01-01T00:00:00Z',
            product_qty: 100,
            remark: null,
            pdf_url: null
          }
        ];

        mockGraphqlClient.query.mockResolvedValue({
          data: {
            record_palletinfoCollection: {
              edges: mockPallets.map(p => ({ cursor: p.plt_num, node: p })),
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: 'PLT12345678',
                endCursor: 'PLT12345678'
              },
              totalCount: 1
            }
          }
        });

        const result = await dataLayer.getPallets(
          { productCode: 'PROD001' },
          { first: 20 }
        );

        expect(mockGraphqlClient.query).toHaveBeenCalledWith({
          query: expect.stringContaining('query GetPallets'),
          variables: {
            filter: expect.any(Object),
            first: 20,
            after: undefined
          }
        });

        expect(result.totalCount).toBe(1);
        expect(result.edges[0].node.palletNumber).toBe('PLT12345678');
      });

      it('should handle date range filters', async () => {
        mockGraphqlClient.query.mockResolvedValue({
          data: {
            record_palletinfoCollection: {
              edges: [],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: null,
                endCursor: null
              },
              totalCount: 0
            }
          }
        });

        await dataLayer.getPallets({
          dateRange: {
            from: '2025-01-01',
            to: '2025-01-31'
          }
        });

        const callArgs = mockGraphqlClient.query.mock.calls[0][0];
        expect(callArgs.variables.filter).toMatchObject({
          generate_time: {
            gte: '2025-01-01',
            lte: '2025-01-31'
          }
        });
      });
    });
  });

  describe('Business Logic Resolvers', () => {
    describe('getLowStockProducts', () => {
      it('should fetch products below threshold', async () => {
        mockGraphqlClient.query.mockResolvedValue({
          data: {
            record_inventoryCollection: {
              edges: [
                {
                  cursor: '1',
                  node: {
                    product_code: 'PROD001',
                    injection: 5,
                    pipeline: 0,
                    prebook: 0,
                    await: 0,
                    fold: 0,
                    bulk: 0,
                    backcarpark: 0,
                    damage: 0
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: '1',
                endCursor: '1'
              }
            }
          }
        });

        const result = await dataLayer.getLowStockProducts(10);

        expect(mockGraphqlClient.query).toHaveBeenCalled();
        expect(result).toBeDefined();
      });
    });

    describe('getMovementHistory', () => {
      it.skip('should fetch movement history for a pallet', async () => {
        // Skip this test - getMovementHistory method needs to be implemented
        mockGraphqlClient.query.mockResolvedValue({
          data: {
            new_stockmovementCollection: {
              edges: [
                {
                  cursor: '1',
                  node: {
                    move_order: 1,
                    pallet_number: 'PLT12345678',
                    from_location: 'A01',
                    to_location: 'B01',
                    operator_id: 1,
                    transfer_date: '2025-01-01T00:00:00Z'
                  }
                }
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: '1',
                endCursor: '1'
              },
              totalCount: 1
            }
          }
        });

        const result = await dataLayer.getMovementHistory('PLT12345678');

        expect(mockGraphqlClient.query).toHaveBeenCalledWith({
          query: expect.stringContaining('query GetMovementHistory'),
          variables: {
            palletNumber: 'PLT12345678',
            first: 100
          }
        });

        expect(result.totalCount).toBe(1);
        expect(result.edges[0].node.palletNumber).toBe('PLT12345678');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle GraphQL errors gracefully', async () => {
      mockGraphqlClient.query.mockRejectedValue(new Error('GraphQL Error'));

      await expect(dataLayer.getProduct('PROD001')).rejects.toThrow('GraphQL Error');
    });

    it('should handle null data responses', async () => {
      mockGraphqlClient.query.mockResolvedValue({
        data: null
      });

      const result = await dataLayer.getProduct('PROD001');
      expect(result).toBeNull();
    });
  });
});