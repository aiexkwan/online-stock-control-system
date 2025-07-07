import DataLoader from 'dataloader';
import { productLoader, palletLoader, inventoryLoader, movementLoader } from '../data-loaders';
import { unifiedDataLayer } from '../unified-data-layer';
import { createMockProduct, createMockPallet } from '@/__tests__/mocks/factories';

// Mock the unified data layer
jest.mock('../unified-data-layer', () => ({
  unifiedDataLayer: {
    getProductsByCodes: jest.fn(),
    getPalletsByNumbers: jest.fn(),
    getInventoryByProductCodes: jest.fn(),
    getMovementsByPalletNumbers: jest.fn(),
  }
}));

describe('GraphQL DataLoaders', () => {
  let mockDataLayer: any;

  beforeEach(() => {
    mockDataLayer = unifiedDataLayer;
    jest.clearAllMocks();
    
    // Clear DataLoader caches
    productLoader.clearAll();
    palletLoader.clearAll();
    inventoryLoader.clearAll();
  });

  describe('Product DataLoader', () => {
    it('should batch load products by codes', async () => {
      const mockProducts = [
        { code: 'PROD001', description: 'Product 1', colour: 'Red' },
        { code: 'PROD002', description: 'Product 2', colour: 'Blue' },
        { code: 'PROD003', description: 'Product 3', colour: 'Green' }
      ];

      mockDataLayer.getProductsByCodes.mockResolvedValue(mockProducts);

      // Load products in parallel
      const [product1, product2, product3] = await Promise.all([
        productLoader.load('PROD001'),
        productLoader.load('PROD002'),
        productLoader.load('PROD003')
      ]);

      // Should make only one batch call
      expect(mockDataLayer.getProductsByCodes).toHaveBeenCalledTimes(1);
      expect(mockDataLayer.getProductsByCodes).toHaveBeenCalledWith(['PROD001', 'PROD002', 'PROD003']);

      // Verify results
      expect(product1).toEqual(mockProducts[0]);
      expect(product2).toEqual(mockProducts[1]);
      expect(product3).toEqual(mockProducts[2]);
    });

    it('should cache loaded products', async () => {
      const mockProduct = { code: 'PROD001', description: 'Product 1' };
      mockDataLayer.getProductsByCodes.mockResolvedValue([mockProduct]);

      // First load
      const result1 = await productLoader.load('PROD001');
      expect(mockDataLayer.getProductsByCodes).toHaveBeenCalledTimes(1);

      // Second load should use cache
      const result2 = await productLoader.load('PROD001');
      expect(mockDataLayer.getProductsByCodes).toHaveBeenCalledTimes(1);

      expect(result1).toEqual(result2);
    });

    it('should handle missing products', async () => {
      mockDataLayer.getProductsByCodes.mockResolvedValue([
        { code: 'PROD001', description: 'Product 1' }
      ]);

      const [product1, product2] = await Promise.all([
        productLoader.load('PROD001'),
        productLoader.load('PROD999') // Missing product
      ]);

      expect(product1).toBeDefined();
      expect(product2).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockDataLayer.getProductsByCodes.mockRejectedValue(new Error('Database error'));

      const result = await productLoader.load('PROD001');
      expect(result).toBeNull();
    });
  });

  describe('Pallet DataLoader', () => {
    it('should batch load pallets by numbers', async () => {
      const mockPallets = [
        { palletNumber: 'PLT12345678', productCode: 'PROD001', quantity: 100 },
        { palletNumber: 'PLT87654321', productCode: 'PROD002', quantity: 200 }
      ];

      mockDataLayer.getPalletsByNumbers.mockResolvedValue(mockPallets);

      const [pallet1, pallet2] = await Promise.all([
        palletLoader.load('PLT12345678'),
        palletLoader.load('PLT87654321')
      ]);

      expect(mockDataLayer.getPalletsByNumbers).toHaveBeenCalledTimes(1);
      expect(mockDataLayer.getPalletsByNumbers).toHaveBeenCalledWith(['PLT12345678', 'PLT87654321']);

      expect(pallet1).toEqual(mockPallets[0]);
      expect(pallet2).toEqual(mockPallets[1]);
    });

    it('should respect maxBatchSize', async () => {
      // Create 150 pallet numbers (exceeds maxBatchSize of 100)
      const palletNumbers = Array.from({ length: 150 }, (_, i) => `PLT${i.toString().padStart(8, '0')}`);
      
      mockDataLayer.getPalletsByNumbers.mockImplementation(async (nums: string[]) => {
        return nums.map(num => ({ palletNumber: num, productCode: 'PROD001' }));
      });

      // Load all pallets
      await Promise.all(palletNumbers.map(num => palletLoader.load(num)));

      // Should make 2 batch calls (100 + 50)
      expect(mockDataLayer.getPalletsByNumbers).toHaveBeenCalledTimes(2);
      expect(mockDataLayer.getPalletsByNumbers.mock.calls[0][0]).toHaveLength(100);
      expect(mockDataLayer.getPalletsByNumbers.mock.calls[1][0]).toHaveLength(50);
    });
  });

  describe('Inventory DataLoader', () => {
    it('should batch load inventory by product codes', async () => {
      const mockInventory = [
        { productCode: 'PROD001', palletNumber: 'PLT001', injection: 100 },
        { productCode: 'PROD001', palletNumber: 'PLT002', injection: 200 },
        { productCode: 'PROD002', palletNumber: 'PLT003', injection: 300 }
      ];

      mockDataLayer.getInventoryByProductCodes.mockResolvedValue(mockInventory);

      const [inv1, inv2] = await Promise.all([
        inventoryLoader.load('PROD001'),
        inventoryLoader.load('PROD002')
      ]);

      expect(mockDataLayer.getInventoryByProductCodes).toHaveBeenCalledTimes(1);
      expect(mockDataLayer.getInventoryByProductCodes).toHaveBeenCalledWith(['PROD001', 'PROD002']);

      // PROD001 should have 2 inventory records
      expect(inv1).toHaveLength(2);
      expect(inv1[0].productCode).toBe('PROD001');
      expect(inv1[1].productCode).toBe('PROD001');

      // PROD002 should have 1 inventory record
      expect(inv2).toHaveLength(1);
      expect(inv2[0].productCode).toBe('PROD002');
    });

    it('should return empty array for products with no inventory', async () => {
      mockDataLayer.getInventoryByProductCodes.mockResolvedValue([]);

      const result = await inventoryLoader.load('PROD999');
      expect(result).toEqual([]);
    });

    it('should handle errors by returning empty arrays', async () => {
      mockDataLayer.getInventoryByProductCodes.mockRejectedValue(new Error('Database error'));

      const result = await inventoryLoader.load('PROD001');
      expect(result).toEqual([]);
    });
  });

  describe('DataLoader Configuration', () => {
    it('should batch requests within batch schedule delay', async () => {
      const mockProducts = [
        { code: 'PROD001', description: 'Product 1' },
        { code: 'PROD002', description: 'Product 2' }
      ];

      mockDataLayer.getProductsByCodes.mockResolvedValue(mockProducts);

      // Load products with slight delay
      const promise1 = productLoader.load('PROD001');
      await new Promise(resolve => setTimeout(resolve, 5)); // Less than 10ms batch delay
      const promise2 = productLoader.load('PROD002');

      await Promise.all([promise1, promise2]);

      // Should still batch together
      expect(mockDataLayer.getProductsByCodes).toHaveBeenCalledTimes(1);
    });

    it('should not batch requests outside batch schedule delay', async () => {
      const mockProducts = [
        { code: 'PROD001', description: 'Product 1' },
        { code: 'PROD002', description: 'Product 2' }
      ];

      mockDataLayer.getProductsByCodes.mockImplementation(async (codes: string[]) => {
        return codes.map(code => mockProducts.find(p => p.code === code) || null);
      });

      // Load products with longer delay
      const promise1 = productLoader.load('PROD001');
      await new Promise(resolve => setTimeout(resolve, 20)); // More than 10ms batch delay
      const promise2 = productLoader.load('PROD002');

      await Promise.all([promise1, promise2]);

      // Should make separate calls
      expect(mockDataLayer.getProductsByCodes).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache Management', () => {
    it('should clear specific cache entries', async () => {
      const mockProduct = { code: 'PROD001', description: 'Product 1' };
      mockDataLayer.getProductsByCodes.mockResolvedValue([mockProduct]);

      // Load and cache
      await productLoader.load('PROD001');
      expect(mockDataLayer.getProductsByCodes).toHaveBeenCalledTimes(1);

      // Clear specific entry
      productLoader.clear('PROD001');

      // Load again should fetch from database
      await productLoader.load('PROD001');
      expect(mockDataLayer.getProductsByCodes).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache entries', async () => {
      const mockProducts = [
        { code: 'PROD001', description: 'Product 1' },
        { code: 'PROD002', description: 'Product 2' }
      ];

      mockDataLayer.getProductsByCodes.mockImplementation(async (codes: string[]) => {
        return codes.map(code => mockProducts.find(p => p.code === code) || null);
      });

      // Load and cache multiple products
      await Promise.all([
        productLoader.load('PROD001'),
        productLoader.load('PROD002')
      ]);

      // Clear all cache
      productLoader.clearAll();

      // Load again should fetch from database
      await Promise.all([
        productLoader.load('PROD001'),
        productLoader.load('PROD002')
      ]);

      expect(mockDataLayer.getProductsByCodes).toHaveBeenCalledTimes(2);
    });
  });
});