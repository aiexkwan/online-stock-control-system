import { Test, TestingModule } from '@nestjs/testing';
import { WidgetsService } from './widgets.service';
import { SupabaseService } from '../supabase/supabase.service';
import { WidgetCacheService } from './cache/widget-cache.service';

describe('WidgetsService', () => {
  let service: WidgetsService;
  let supabaseService: SupabaseService;
  let cacheService: WidgetCacheService;

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
  };

  const mockSupabaseService = {
    getClient: jest.fn(() => mockSupabaseClient),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    generateKey: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WidgetsService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
        {
          provide: WidgetCacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<WidgetsService>(WidgetsService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
    cacheService = module.get<WidgetCacheService>(WidgetCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should return cached data when available', async () => {
      const cachedData = {
        totalPallets: 100,
        activeTransfers: 25,
        todayGRN: 5,
        pendingOrders: 10,
        timestamp: new Date().toISOString(),
      };

      mockCacheService.generateKey.mockReturnValue('stats-key');
      mockCacheService.get.mockReturnValue(cachedData);

      const result = await service.getStats();

      expect(result).toEqual(cachedData);
      expect(mockCacheService.get).toHaveBeenCalledWith('stats-key');
    });

    it('should handle database connection unavailable', async () => {
      mockCacheService.generateKey.mockReturnValue('stats-key');
      mockCacheService.get.mockReturnValue(undefined);
      // Mock the supabase property to null
      (service as any).supabase = null;

      const result = await service.getStats();

      expect(result).toEqual({
        totalPallets: 0,
        activeTransfers: 0,
        todayGRN: 0,
        pendingOrders: 0,
        timestamp: expect.any(String),
        error: 'Database connection not available',
      });
    });
  });

  describe('getInventory', () => {
    it('should return empty data when no supabase client', async () => {
      // Mock the supabase property to null
      (service as any).supabase = null;

      const result = await service.getInventory();

      expect(result).toEqual({
        data: [],
        total: 0,
        limit: 100,
        offset: 0,
        error: 'Database connection not available',
      });
    });
  });

  describe('getDashboardStats', () => {
    it('should call getStats method', async () => {
      const getStatsSpy = jest.spyOn(service, 'getStats').mockResolvedValue({
        totalPallets: 100,
        activeTransfers: 25,
        todayGRN: 5,
        pendingOrders: 10,
        timestamp: new Date().toISOString(),
      });

      await service.getDashboardStats('2024-01-01', '2024-01-31');

      expect(getStatsSpy).toHaveBeenCalledWith('2024-01-01', '2024-01-31');
    });
  });

  describe('getInventoryAnalysis', () => {
    it('should return cached data when available', async () => {
      const cachedData = {
        summary: {
          totalProducts: 50,
          totalQuantity: 5000,
          totalPallets: 100,
          totalWarehouses: 3,
          lastUpdate: new Date().toISOString(),
        },
        productAnalysis: [],
        warehouseAnalysis: [],
        turnoverAnalysis: [],
        alerts: {
          lowStock: [],
          overstock: [],
          slowMoving: [],
        },
        timestamp: new Date().toISOString(),
      };

      mockCacheService.generateKey.mockReturnValue('analysis-key');
      mockCacheService.get.mockReturnValue(cachedData);

      const result = await service.getInventoryAnalysis('W001');

      expect(result).toEqual(cachedData);
      expect(mockCacheService.get).toHaveBeenCalledWith('analysis-key');
    });

    it('should handle database connection unavailable', async () => {
      mockCacheService.generateKey.mockReturnValue('analysis-key');
      mockCacheService.get.mockReturnValue(undefined);
      // Mock the supabase property to null
      (service as any).supabase = null;

      const result = await service.getInventoryAnalysis();

      expect(result).toEqual({
        summary: {
          totalProducts: 0,
          totalQuantity: 0,
          totalPallets: 0,
          totalWarehouses: 0,
          lastUpdate: expect.any(String),
        },
        productAnalysis: [],
        warehouseAnalysis: [],
        turnoverAnalysis: [],
        alerts: {
          lowStock: [],
          overstock: [],
          slowMoving: [],
        },
        timestamp: expect.any(String),
        error: 'Database connection not available',
      });
    });
  });
});
