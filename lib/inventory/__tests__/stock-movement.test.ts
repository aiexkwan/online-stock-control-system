/**
 * Stock Movement Tests
 * Testing inventory movement tracking and validation
 */

import { StockMovementService } from '../services/StockMovementService';
import { LocationMapper } from '../utils/locationMapper';
import { createMockPallet, createMockUser, createSupabaseResponse, createSupabaseError } from '@/__tests__/mocks/factories';
import { createMockSupabaseClient, createMockSupabaseChain } from './test-helpers';

// Mock LocationMapper
jest.mock('../utils/locationMapper');

// Mock Supabase client
const mockSupabase = createMockSupabaseClient();

describe('StockMovementService', () => {
  let service: StockMovementService;
  let mockLocationMapper: jest.Mocked<LocationMapper>;

  beforeEach(() => {
    // Setup LocationMapper mock
    mockLocationMapper = {
      getValidDatabaseLocations: jest.fn().mockReturnValue([
        'injection', 'pipeline', 'prebook', 'await', 'fold', 'bulk', 'backcarpark'
      ]),
      getValidLocations: jest.fn().mockReturnValue([
        { id: 'injection', name: 'Injection' },
        { id: 'pipeline', name: 'Pipeline' },
        { id: 'bulk', name: 'Bulk' }
      ])
    } as any;
    
    (LocationMapper as jest.MockedClass<typeof LocationMapper>).mockImplementation(() => mockLocationMapper);
    
    service = new StockMovementService(mockSupabase);
    jest.clearAllMocks();
  });

  describe('recordMovement', () => {
    it('should record stock movement successfully', async () => {
      const movement = {
        pallet_number: 'PLT12345678',
        from_location: 'injection',
        to_location: 'pipeline',
        transfer_date: new Date().toISOString(),
        operator_id: 1,
        remark: 'Stock transfer'
      };

      const mockResult = {
        move_order: 123,
        ...movement
      };

      // Set up the mock to return correct response structure
      const mockChain = createMockSupabaseChain(mockResult, null);
      mockSupabase.from.mockReturnValueOnce(mockChain);

      const result = await service.recordMovement(movement);

      expect(result).toEqual(mockResult);
      expect(mockSupabase.from).toHaveBeenCalledWith('new_stockmovement');
    });

    it('should validate locations before recording movement', async () => {
      const movement = {
        palletCode: 'PLT12345678',
        fromLocation: 'INVALID_LOCATION',
        toLocation: 'pipeline',
        quantity: 100,
        userId: 'user-123'
      };

      const result = await service.recordMovement(movement);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid from location');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should validate quantity is positive', async () => {
      const movement = {
        palletCode: 'PLT12345678',
        fromLocation: 'injection',
        toLocation: 'pipeline',
        quantity: -10,
        userId: 'user-123'
      };

      const result = await service.recordMovement(movement);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quantity must be positive');
    });

    it('should handle database errors', async () => {
      const movement = {
        palletCode: 'PLT12345678',
        fromLocation: 'injection',
        toLocation: 'pipeline',
        quantity: 100,
        userId: 'user-123'
      };

      const mockChain = createMockSupabaseChain(null, createSupabaseError('Database error'));
      mockSupabase.from.mockReturnValueOnce(mockChain);

      const result = await service.recordMovement(movement);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });
  });

  describe('getMovementHistory', () => {
    it('should retrieve movement history for a pallet', async () => {
      const mockMovements = [
        {
          id: 'mov-1',
          pallet_code: 'PLT12345678',
          from_location: 'injection',
          to_location: 'pipeline',
          quantity: 50,
          created_at: '2025-01-06T10:00:00Z'
        },
        {
          id: 'mov-2',
          pallet_code: 'PLT12345678',
          from_location: 'pipeline',
          to_location: 'bulk',
          quantity: 50,
          created_at: '2025-01-06T11:00:00Z'
        }
      ];

      const mockChain = createMockSupabaseChain(mockMovements, null);
      mockSupabase.from.mockReturnValueOnce(mockChain);

      const result = await service.getMovementHistory('PLT12345678');

      // When no options provided, it returns array directly
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect((result as any[])[0].created_at).toBe('2025-01-06T10:00:00Z');
      expect(mockSupabase.from).toHaveBeenCalledWith('stock_movements');
    });

    it('should handle empty movement history', async () => {
      const mockChain = createMockSupabaseChain([], null);
      mockSupabase.from.mockReturnValueOnce(mockChain);

      const result = await service.getMovementHistory('PLT99999999');

      // When no options provided, it returns array directly  
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('should include user information when requested', async () => {
      const mockMovementsWithUser = [
        {
          id: 'mov-1',
          pallet_code: 'PLT12345678',
          from_location: 'injection',
          to_location: 'pipeline',
          quantity: 50,
          created_at: '2025-01-06T10:00:00Z',
          users: {
            id: 'user-123',
            full_name: 'John Doe',
            email: 'john@example.com'
          }
        }
      ];

      const mockChain = createMockSupabaseChain(mockMovementsWithUser, null);
      mockSupabase.from.mockReturnValueOnce(mockChain);

      const result = await service.getMovementHistory('PLT12345678', { includeUser: true });

      expect(result.success).toBe(true);
      expect(result.movements![0].users).toBeDefined();
      expect(result.movements![0].users.full_name).toBe('John Doe');
    });
  });

  describe('getMovementsByDateRange', () => {
    it('should retrieve movements within date range', async () => {
      const mockMovements = [
        {
          id: 'mov-1',
          created_at: '2025-01-05T10:00:00Z',
          quantity: 100
        },
        {
          id: 'mov-2',
          created_at: '2025-01-06T10:00:00Z',
          quantity: 200
        }
      ];

      const mockChain = createMockSupabaseChain(mockMovements, null);
      mockSupabase.from.mockReturnValueOnce(mockChain);

      const result = await service.getMovementsByDateRange(
        '2025-01-01',
        '2025-01-07'
      );

      expect(result.success).toBe(true);
      expect(result.movements).toHaveLength(2);
      expect(result.totalQuantity).toBe(300);
    });

    it('should filter by location if provided', async () => {
      const mockMovements = [
        {
          id: 'mov-1',
          from_location: 'injection',
          to_location: 'pipeline',
          quantity: 100
        }
      ];

      const mockChain = createMockSupabaseChain(mockMovements, null);
      mockSupabase.from.mockReturnValueOnce(mockChain);

      const result = await service.getMovementsByDateRange(
        '2025-01-01',
        '2025-01-07',
        { fromLocation: 'injection' }
      );

      expect(result.success).toBe(true);
      expect(result.movements).toHaveLength(1);
    });

    it('should validate date range', async () => {
      const result = await service.getMovementsByDateRange(
        '2025-01-07',
        '2025-01-01' // End date before start date
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid date range');
    });
  });

  describe('analyzeMovementPatterns', () => {
    it('should analyze movement patterns', async () => {
      const mockMovements = [
        {
          from_location: 'injection',
          to_location: 'pipeline',
          quantity: 100,
          created_at: '2025-01-06T10:00:00Z'
        },
        {
          from_location: 'injection',
          to_location: 'pipeline',
          quantity: 200,
          created_at: '2025-01-06T14:00:00Z'
        },
        {
          from_location: 'pipeline',
          to_location: 'bulk',
          quantity: 150,
          created_at: '2025-01-06T16:00:00Z'
        }
      ];

      // Mock RPC failure to trigger manual analysis
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC not found' }
      });
      
      const mockChain = createMockSupabaseChain(mockMovements, null);
      // Mock first call for getMovementsByDateRange  
      mockSupabase.from.mockReturnValueOnce(mockChain);
      // Mock second call for manual analysis
      mockSupabase.from.mockReturnValueOnce(mockChain);

      const result = await service.analyzeMovementPatterns(
        '2025-01-01',
        '2025-01-07'
      );

      expect((result as any).success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis!.totalMovements).toBe(3);
      expect(result.analysis!.totalQuantity).toBe(450);
      expect(result.analysis!.mostCommonRoute).toEqual({
        from: 'injection',
        to: 'pipeline',
        count: 2,
        totalQuantity: 300
      });
      expect(result.analysis!.hourlyDistribution).toBeDefined();
    });

    it('should calculate peak hours correctly', async () => {
      const mockMovements = Array.from({ length: 20 }, (_, i) => ({
        from_location: 'injection',
        to_location: 'pipeline',
        quantity: 100,
        created_at: `2025-01-06T${i % 3 === 0 ? '10' : '14'}:00:00Z`
      }));

      // Mock RPC failure to trigger manual analysis
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC not found' }
      });
      
      const mockChain = createMockSupabaseChain(mockMovements, null);
      // Mock first call for getMovementsByDateRange  
      mockSupabase.from.mockReturnValueOnce(mockChain);
      // Mock second call for manual analysis
      mockSupabase.from.mockReturnValueOnce(mockChain);

      const result = await service.analyzeMovementPatterns(
        '2025-01-01',
        '2025-01-07'
      );

      expect((result as any).success).toBe(true);
      expect(result.analysis!.peakHours).toBeDefined();
      expect(result.analysis!.peakHours.length).toBeGreaterThan(0);
    });
  });

  describe('validateMovement', () => {
    it('should validate movement before execution', async () => {
      // Mock pallet exists
      const mockPalletChain = createMockSupabaseChain({ plt_num: 'PLT12345678', product_code: 'PROD123' }, null);
      mockSupabase.from.mockReturnValueOnce(mockPalletChain);
      
      // Mock inventory check - getCurrentLocation (no movement history)
      const mockMovementChain = createMockSupabaseChain(null, { message: 'No data' });
      mockSupabase.from.mockReturnValueOnce(mockMovementChain);
      
      // Mock inventory check - initial location
      const mockInventoryChain = createMockSupabaseChain({ injection: 200, pipeline: 0 }, null);
      mockSupabase.from.mockReturnValueOnce(mockInventoryChain);
      
      // Mock checkInventory for quantity validation
      mockSupabase.from.mockReturnValueOnce(mockPalletChain);
      const mockQuantityChain = createMockSupabaseChain({ injection: 200 }, null);
      mockSupabase.from.mockReturnValueOnce(mockQuantityChain);

      const movement = {
        palletCode: 'PLT12345678',
        fromLocation: 'injection',
        toLocation: 'pipeline',
        quantity: 100
      };

      const result = await service.validateMovement(movement);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect insufficient stock', async () => {
      // Mock pallet exists
      const mockPalletChain = createMockSupabaseChain({ plt_num: 'PLT12345678', product_code: 'PROD123' }, null);
      mockSupabase.from.mockReturnValueOnce(mockPalletChain);
      
      // Mock inventory check - getCurrentLocation (no movement history)
      const mockMovementChain = createMockSupabaseChain(null, { message: 'No data' });
      mockSupabase.from.mockReturnValueOnce(mockMovementChain);
      
      // Mock inventory check - initial location
      const mockInventoryChain = createMockSupabaseChain({ injection: 50, pipeline: 0 }, null);
      mockSupabase.from.mockReturnValueOnce(mockInventoryChain);
      
      // Mock checkInventory for quantity validation
      mockSupabase.from.mockReturnValueOnce(mockPalletChain);
      const mockQuantityChain = createMockSupabaseChain({ injection: 50 }, null);
      mockSupabase.from.mockReturnValueOnce(mockQuantityChain);

      const movement = {
        palletCode: 'PLT12345678',
        fromLocation: 'injection',
        toLocation: 'pipeline',
        quantity: 100
      };

      const result = await service.validateMovement(movement);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Insufficient stock at injection. Available: 50, Required: 100');
    });

    it('should validate pallet exists', async () => {
      const mockChain = createMockSupabaseChain(null, null);
      mockSupabase.from.mockReturnValueOnce(mockChain);

      const movement = {
        palletCode: 'PLT99999999',
        fromLocation: 'injection',
        toLocation: 'pipeline',
        quantity: 100
      };

      const result = await service.validateMovement(movement);

      // Pallet not found (mockChain returns null for data)
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Pallet not found');
    });
  });

  describe('bulkRecordMovements', () => {
    it('should record multiple movements in transaction', async () => {
      const movements = [
        {
          palletCode: 'PLT12345678',
          fromLocation: 'injection',
          toLocation: 'pipeline',
          quantity: 100,
          userId: 'user-123'
        },
        {
          palletCode: 'PLT87654321',
          fromLocation: 'pipeline',
          toLocation: 'bulk',
          quantity: 200,
          userId: 'user-123'
        }
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: { success: true, movement_ids: ['mov-1', 'mov-2'] },
        error: null
      });

      const result = await service.bulkRecordMovements(movements);

      expect(result.success).toBe(true);
      expect(result.movementIds).toHaveLength(2);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('bulk_record_movements', expect.any(Object));
    });

    it('should handle partial failures in bulk operations', async () => {
      const movements = [
        {
          palletCode: 'PLT12345678',
          fromLocation: 'injection',
          toLocation: 'pipeline',
          quantity: 100,
          userId: 'user-123'
        },
        {
          palletCode: 'PLT87654321',
          fromLocation: 'INVALID',
          toLocation: 'bulk',
          quantity: 200,
          userId: 'user-123'
        }
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: { 
          success: false, 
          movement_ids: ['mov-1'], 
          errors: ['Invalid location for PLT87654321'] 
        },
        error: null
      });

      const result = await service.bulkRecordMovements(movements);

      expect(result.success).toBe(false);
      expect(result.movementIds).toHaveLength(1);
      expect(result.errors).toContain('Invalid location for PLT87654321');
    });
  });
});