/**
 * Tests for inventory services
 */

import { UnifiedInventoryService } from '../services/UnifiedInventoryService';
import { PalletService } from '../services/PalletService';
import { TransactionService } from '../services/TransactionService';
import { LocationMapper } from '../utils/locationMapper';
import { 
  createMockSupabaseClient, 
  mockSuccessfulPalletSearch,
  mockFailedPalletSearch,
  mockInventoryData,
  createMockSupabaseChain
} from './test-helpers';

describe('PalletService', () => {
  let palletService: PalletService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    palletService = new PalletService(mockSupabase);
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should search for pallet by series', async () => {
      const mockPallet = {
        plt_num: '240615/1',
        series: 'PM-240615',
        product_code: 'TEST001',
        product_qty: 100
      };

      mockSuccessfulPalletSearch(mockSupabase, mockPallet);

      const result = await palletService.search('series', 'PM-240615');
      
      expect(result.pallet).toBeTruthy();
      expect(result.pallet?.series).toBe('PM-240615');
      expect(result.error).toBeUndefined();
    });

    it('should search for pallet by pallet number', async () => {
      const mockPallet = {
        plt_num: '240615/1',
        series: 'PM-240615',
        product_code: 'TEST001',
        product_qty: 100
      };

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: mockPallet, error: null }))
          }))
        }))
      });

      const result = await palletService.search('pallet_num', '240615/1');
      
      expect(result.pallet).toBeTruthy();
      expect(result.pallet?.plt_num).toBe('240615/1');
      expect(mockSupabase.from).toHaveBeenCalledWith('record_palletinfo');
    });

    it('should return null when pallet not found', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      });

      const result = await palletService.search('pallet_num', 'NOTFOUND');
      
      expect(result.pallet).toBeNull();
      expect(result.error).toBeUndefined();
    });

    it('should handle search errors gracefully', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: null, 
              error: { message: 'Database error' } 
            }))
          }))
        }))
      });

      const result = await palletService.search('pallet_num', '240615/1');
      
      expect(result.pallet).toBeNull();
      expect(result.error).toBe('Database error');
    });

    it('should handle invalid search type', async () => {
      const result = await palletService.search('invalid_type' as any, 'value');
      
      expect(result.pallet).toBeNull();
      expect(result.error).toContain('Invalid search type');
    });
  });

  describe('validate', () => {
    it('should validate correct pallet number format', async () => {
      const result = await palletService.validate('240615/1');
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate pallet number format variations', async () => {
      const validFormats = ['240615/1', '240615/100', '240615/999'];
      
      for (const format of validFormats) {
        const result = await palletService.validate(format);
        expect(result.valid).toBe(true);
      }
    });

    it('should reject invalid pallet number format', async () => {
      const invalidFormats = ['invalid-format', '24061501', '240615/', '/1', ''];
      
      for (const format of invalidFormats) {
        const result = await palletService.validate(format);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid pallet number format');
      }
    });
  });

  describe('getByProductCode', () => {
    it('should get pallets by product code', async () => {
      const mockPallets = [
        { plt_num: '240615/1', product_code: 'TEST001', product_qty: 100 },
        { plt_num: '240615/2', product_code: 'TEST001', product_qty: 200 }
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ data: mockPallets, error: null }))
            }))
          }))
        }))
      });

      const result = await palletService.getByProductCode('TEST001', 10);
      
      expect(result.pallets).toHaveLength(2);
      expect(result.pallets?.[0].product_code).toBe('TEST001');
      expect(result.error).toBeUndefined();
    });

    it('should handle empty result', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      });

      const result = await palletService.getByProductCode('NOTFOUND', 10);
      
      expect(result.pallets).toEqual([]);
      expect(result.error).toBeUndefined();
    });
  });
});

describe('TransactionService', () => {
  let transactionService: TransactionService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    transactionService = new TransactionService(mockSupabase);
    jest.clearAllMocks();
  });

  describe('executeStockTransfer', () => {
    it('should execute stock transfer transaction', async () => {
      const mockInventory = {
        plt_num: '240615/1',
        injection: 100,
        pipeline: 0
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'record_inventory') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: mockInventory, error: null }))
              }))
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          };
        }
        if (table === 'record_history') {
          return {
            insert: jest.fn(() => Promise.resolve({ data: null, error: null }))
          };
        }
        return mockSupabase.from(table);
      });

      const transfer = {
        palletNum: '240615/1',
        productCode: 'TEST001',
        quantity: 50,
        fromLocation: 'PRODUCTION',
        toLocation: 'PIPELINE',
        operator: 'test-user'
      };

      const result = await transactionService.executeStockTransfer(transfer);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.transactionId).toBeTruthy();
    });

    it('should validate sufficient stock before transfer', async () => {
      const mockInventory = {
        plt_num: '240615/1',
        injection: 30,
        pipeline: 0
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'record_inventory') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: mockInventory, error: null }))
              }))
            }))
          };
        }
        return mockSupabase.from(table);
      });

      const transfer = {
        palletNum: '240615/1',
        productCode: 'TEST001',
        quantity: 50,
        fromLocation: 'PRODUCTION',
        toLocation: 'PIPELINE',
        operator: 'test-user'
      };

      const result = await transactionService.executeStockTransfer(transfer);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient stock');
    });

    it('should handle transfer between different location types', async () => {
      const mockInventory = {
        plt_num: '240615/1',
        injection: 0,
        pipeline: 100,
        bulk: 0
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'record_inventory') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: mockInventory, error: null }))
              }))
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          };
        }
        if (table === 'record_history') {
          return {
            insert: jest.fn(() => Promise.resolve({ data: null, error: null }))
          };
        }
        return mockSupabase.from(table);
      });

      const transfer = {
        palletNum: '240615/1',
        productCode: 'TEST001',
        quantity: 50,
        fromLocation: 'PIPELINE',
        toLocation: 'BULK',
        operator: 'test-user'
      };

      const result = await transactionService.executeStockTransfer(transfer);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle database errors during transfer', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'record_inventory') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ 
                  data: null, 
                  error: { message: 'Database connection error' } 
                }))
              }))
            }))
          };
        }
        return mockSupabase.from(table);
      });

      const transfer = {
        palletNum: '240615/1',
        productCode: 'TEST001',
        quantity: 50,
        fromLocation: 'PRODUCTION',
        toLocation: 'PIPELINE',
        operator: 'test-user'
      };

      const result = await transactionService.executeStockTransfer(transfer);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection error');
    });

    it('should handle invalid location mappings', async () => {
      const transfer = {
        palletNum: '240615/1',
        productCode: 'TEST001',
        quantity: 50,
        fromLocation: 'INVALID_LOCATION',
        toLocation: 'PIPELINE',
        operator: 'test-user'
      };

      const result = await transactionService.executeStockTransfer(transfer);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid location');
    });
  });

  describe('createTransaction', () => {
    it('should create transaction record', async () => {
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn(() => Promise.resolve({ data: { id: 'txn-123' }, error: null }))
      });

      const txnData = {
        type: 'TRANSFER',
        palletNum: '240615/1',
        productCode: 'TEST001',
        quantity: 50,
        fromLocation: 'PRODUCTION',
        toLocation: 'PIPELINE',
        operator: 'test-user',
        timestamp: new Date().toISOString()
      };

      const result = await transactionService.createTransaction(txnData);
      
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('txn-123');
      expect(mockSupabase.from).toHaveBeenCalledWith('transactions');
    });

    it('should handle transaction creation failure', async () => {
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'Transaction log failed' } 
        }))
      });

      const txnData = {
        type: 'TRANSFER',
        palletNum: '240615/1',
        productCode: 'TEST001',
        quantity: 50,
        fromLocation: 'PRODUCTION',
        toLocation: 'PIPELINE',
        operator: 'test-user',
        timestamp: new Date().toISOString()
      };

      const result = await transactionService.createTransaction(txnData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction log failed');
    });
  });

  describe('validateTransaction', () => {
    it('should validate transaction with all required fields', () => {
      const validTxn = {
        palletNum: '240615/1',
        productCode: 'TEST001',
        quantity: 50,
        fromLocation: 'PRODUCTION',
        toLocation: 'PIPELINE',
        operator: 'test-user'
      };

      const result = transactionService.validateTransaction(validTxn);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject transaction with missing fields', () => {
      const invalidTxn = {
        palletNum: '240615/1',
        quantity: 50,
        fromLocation: 'PRODUCTION'
      };

      const result = transactionService.validateTransaction(invalidTxn as any);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Missing required field: productCode');
    });

    it('should reject transaction with invalid quantity', () => {
      const invalidTxn = {
        palletNum: '240615/1',
        productCode: 'TEST001',
        quantity: -10,
        fromLocation: 'PRODUCTION',
        toLocation: 'PIPELINE',
        operator: 'test-user'
      };

      const result = transactionService.validateTransaction(invalidTxn);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Quantity must be positive');
    });
  });
});

describe('UnifiedInventoryService', () => {
  let inventoryService: UnifiedInventoryService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    inventoryService = new UnifiedInventoryService(mockSupabase);
    jest.clearAllMocks();
  });

  it('should search pallet through unified interface', async () => {
    const mockPallet = {
      plt_num: '240615/1',
      series: 'PM-240615',
      product_code: 'TEST001',
      product_qty: 100
    };

    mockSupabase.from.mockReturnValueOnce({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: mockPallet, error: null }))
        }))
      }))
    });

    const result = await inventoryService.searchPallet('series', 'PM-240615');
    
    expect(result.pallet).toBeTruthy();
    expect(result.pallet?.series).toBe('PM-240615');
  });

  it('should handle batch transfers', async () => {
    const batch = {
      transfers: [
        {
          palletNum: '240615/1',
          productCode: 'TEST001',
          quantity: 50,
          fromLocation: 'PRODUCTION',
          toLocation: 'PIPELINE'
        },
        {
          palletNum: '240615/2',
          productCode: 'TEST002',
          quantity: 30,
          fromLocation: 'PRODUCTION',
          toLocation: 'BULK'
        }
      ]
    };

    // Mock successful batch operations
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { injection: 100, pipeline: 0, bulk: 0 }, 
            error: null 
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }));

    const result = await inventoryService.batchTransfer(batch);
    
    expect(result.success).toBe(true);
    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(0);
    expect(result.results.size).toBe(2);
  });
});

describe('LocationMapper Integration', () => {
  it('should correctly map all locations in services', () => {
    const locations = [
      'PRODUCTION',
      'production',
      'Injection',
      'PIPELINE',
      'BACK_CARPARK',
      'back carpark',
      'backcarpark'
    ];

    locations.forEach(location => {
      const dbColumn = LocationMapper.toDbColumn(location);
      expect(dbColumn).toBeTruthy();
      expect(LocationMapper.isValidLocation(location)).toBe(true);
    });
  });

  it('should handle invalid locations', () => {
    const invalidLocations = ['INVALID', 'UNKNOWN', 'test-location'];
    
    invalidLocations.forEach(location => {
      const dbColumn = LocationMapper.toDbColumn(location);
      expect(dbColumn).toBeNull();
      expect(LocationMapper.isValidLocation(location)).toBe(false);
    });
  });
});