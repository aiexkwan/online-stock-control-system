import { GET } from '../route';
import { NextResponse } from 'next/server';

// Mock Supabase
jest.mock('@/app/utils/supabase/server', () => ({
  createClient: jest.fn()
}));

// Mock inventory service
jest.mock('@/lib/inventory/services', () => ({
  createInventoryService: jest.fn(() => ({}))
}));

// Mock console.error to avoid noise in test output
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('GET /api/warehouse/summary', () => {
  let mockSupabase: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis()
    };
    
    const { createClient } = require('@/app/utils/supabase/server');
    createClient.mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('Successful responses', () => {
    it('should return warehouse summary data', async () => {
      const mockData = [
        {
          product_code: 'PROD001',
          injection: 10,
          pipeline: 5,
          prebook: 0,
          await: 3,
          fold: 0,
          bulk: 20,
          backcarpark: 0,
          damage: 1,
          await_grn: 0
        },
        {
          product_code: 'PROD002',
          injection: 5,
          pipeline: 0,
          prebook: 8,
          await: 0,
          fold: 2,
          bulk: 15,
          backcarpark: 0,
          damage: 0,
          await_grn: 4
        }
      ];

      mockSupabase.order.mockResolvedValue({
        data: mockData,
        error: null
      });

      const mockRequest = new Request('http://localhost:3000/api/warehouse/summary');
      const mockParams = Promise.resolve({ id: 'test' });
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.timestamp).toBeDefined();
      
      // Check if data is aggregated correctly
      const summaryMap = data.data.reduce((acc: Record<string, unknown>, item: Record<string, unknown>) => {
        acc[item.location] = item;
        return acc;
      }, {});
      
      expect(summaryMap.injection.totalQty).toBe(15); // 10 + 5
      expect(summaryMap.injection.itemCount).toBe(2);
      expect(summaryMap.bulk.totalQty).toBe(35); // 20 + 15
      expect(summaryMap.bulk.itemCount).toBe(2);
    });

    it('should filter out locations with zero quantities', async () => {
      const mockData = [
        {
          product_code: 'PROD001',
          injection: 10,
          pipeline: 0,
          prebook: 0,
          await: 0,
          fold: 0,
          bulk: 0,
          backcarpark: 0,
          damage: 0,
          await_grn: 0
        }
      ];

      mockSupabase.order.mockResolvedValue({
        data: mockData,
        error: null
      });

      const mockRequest = new Request('http://localhost:3000/api/warehouse/summary');
      const mockParams = Promise.resolve({ id: 'test' });
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();
      
      // Should only include injection since it's the only one with quantity > 0
      expect(data.data).toHaveLength(1);
      expect(data.data[0].location).toBe('injection');
      expect(data.data[0].totalQty).toBe(10);
    });

    it('should handle empty warehouse data', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null
      });

      const mockRequest = new Request('http://localhost:3000/api/warehouse/summary');
      const mockParams = Promise.resolve({ id: 'test' });
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should include all warehouse locations in aggregation', async () => {
      const mockData = [
        {
          product_code: 'PROD001',
          injection: 1,
          pipeline: 2,
          prebook: 3,
          await: 4,
          fold: 5,
          bulk: 6,
          backcarpark: 7,
          damage: 8,
          await_grn: 9
        }
      ];

      mockSupabase.order.mockResolvedValue({
        data: mockData,
        error: null
      });

      const mockRequest = new Request('http://localhost:3000/api/warehouse/summary');
      const mockParams = Promise.resolve({ id: 'test' });
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();
      
      const locations = data.data.map((item: Record<string, unknown>) => item.location).sort();
      expect(locations).toEqual([
        'await',
        'await_grn',
        'backcarpark',
        'bulk',
        'damage',
        'fold',
        'injection',
        'pipeline',
        'prebook'
      ]);
    });
  });

  describe('Error handling', () => {
    it('should return 500 on database error', async () => {
      const dbError = new Error('Database connection failed');
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: dbError
      });

      const mockRequest = new Request('http://localhost:3000/api/warehouse/summary');
      const mockParams = Promise.resolve({ id: 'test' });
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch warehouse summary');
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching warehouse summary:', dbError);
    });

    it('should handle unexpected errors', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const mockRequest = new Request('http://localhost:3000/api/warehouse/summary');
      const mockParams = Promise.resolve({ id: 'test' });
      const response = await GET(mockRequest, { params: mockParams });
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.error).toBe('Internal server error');
      expect(mockConsoleError).toHaveBeenCalledWith('Warehouse summary API error:', expect.any(Error));
    });
  });

  describe('Response format', () => {
    it('should return correct response structure', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [
          {
            product_code: 'PROD001',
            injection: 5,
            pipeline: 0,
            prebook: 0,
            await: 0,
            fold: 0,
            bulk: 10,
            backcarpark: 0,
            damage: 0,
            await_grn: 0
          }
        ],
        error: null
      });

      const mockRequest = new Request('http://localhost:3000/api/warehouse/summary');
      const mockParams = Promise.resolve({ id: 'test' });
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();
      
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('timestamp');
      
      expect(data.data[0]).toHaveProperty('location');
      expect(data.data[0]).toHaveProperty('totalQty');
      expect(data.data[0]).toHaveProperty('itemCount');
    });

    it('should return valid ISO timestamp', async () => {
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null
      });

      const mockRequest = new Request('http://localhost:3000/api/warehouse/summary');
      const mockParams = Promise.resolve({ id: 'test' });
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();
      
      // Check if timestamp is valid ISO string
      expect(() => new Date(data.timestamp)).not.toThrow();
      const date = new Date(data.timestamp);
      expect(date.toISOString()).toBe(data.timestamp);
    });
  });

  describe('Data validation', () => {
    it('should handle null or undefined quantities', async () => {
      const mockData = [
        {
          product_code: 'PROD001',
          injection: null,
          pipeline: undefined,
          prebook: 5,
          await: 0,
          fold: null,
          bulk: 10,
          backcarpark: undefined,
          damage: 0,
          await_grn: 0
        }
      ];

      mockSupabase.order.mockResolvedValue({
        data: mockData,
        error: null
      });

      const mockRequest = new Request('http://localhost:3000/api/warehouse/summary');
      const mockParams = Promise.resolve({ id: 'test' });
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();
      
      // Should only include prebook and bulk (non-zero values)
      expect(data.data).toHaveLength(2);
      const locations = data.data.map((item: Record<string, unknown>) => item.location).sort();
      expect(locations).toEqual(['bulk', 'prebook']);
    });
  });

  describe('Performance', () => {
    it('should respond within reasonable time', async () => {
      mockSupabase.order.mockResolvedValue({
        data: Array(1000).fill({
          product_code: 'PROD',
          injection: 1,
          pipeline: 1,
          prebook: 1,
          await: 1,
          fold: 1,
          bulk: 1,
          backcarpark: 1,
          damage: 1,
          await_grn: 1
        }),
        error: null
      });

      const start = Date.now();
      const mockRequest = new Request('http://localhost:3000/api/warehouse/summary');
      const mockParams = Promise.resolve({ id: 'test' });
      const response = await GET(mockRequest, { params: mockParams });
      const end = Date.now();
      
      const responseTime = end - start;
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500); // Should handle 1000 items in less than 500ms
    });
  });
});