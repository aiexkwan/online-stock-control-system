import { GET } from '../route';

// Simple mock for NextRequest
const createMockRequest = (url: string) => ({
  url,
  method: 'GET',
  headers: new Headers(),
} as any);

// Mock console.error to avoid noise in test output
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('GET /api/analytics/overview', () => {
  afterEach(() => {
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  it('should return analytics overview data', async () => {
    const request = createMockRequest('http://localhost:3000/api/analytics/overview');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('totalUsers');
    expect(data).toHaveProperty('totalOrders');
    expect(data).toHaveProperty('totalRevenue');
    expect(data).toHaveProperty('growthRate');
    
    // Check data types
    expect(typeof data.totalUsers).toBe('number');
    expect(typeof data.totalOrders).toBe('number');
    expect(typeof data.totalRevenue).toBe('number');
    expect(typeof data.growthRate).toBe('number');
  });

  it('should return correct content-type header', async () => {
    const request = createMockRequest('http://localhost:3000/api/analytics/overview');
    const response = await GET(request);
    
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('should handle query parameters (if any)', async () => {
    const request = createMockRequest('http://localhost:3000/api/analytics/overview?timeRange=week');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
  });

  describe('Error handling', () => {
    it('should return 500 status on error', async () => {
      // Mock an error scenario by overriding JSON.stringify
      const originalStringify = JSON.stringify;
      JSON.stringify = jest.fn().mockImplementationOnce(() => {
        throw new Error('Serialization error');
      });

      const request = createMockRequest('http://localhost:3000/api/analytics/overview');
      const response = await GET(request);
      
      expect(response.status).toBe(500);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toBe('無法獲取分析概覽數據');
      
      expect(mockConsoleError).toHaveBeenCalledWith('Analytics overview error:', expect.any(Error));

      // Restore original function
      JSON.stringify = originalStringify;
    });
  });

  describe('Response structure', () => {
    it('should return expected data structure', async () => {
      const request = createMockRequest('http://localhost:3000/api/analytics/overview');
      const response = await GET(request);
      const data = await response.json();

      // Check exact structure
      expect(Object.keys(data).sort()).toEqual([
        'growthRate',
        'totalOrders',
        'totalRevenue',
        'totalUsers'
      ].sort());
    });

    it('should return numeric values', async () => {
      const request = createMockRequest('http://localhost:3000/api/analytics/overview');
      const response = await GET(request);
      const data = await response.json();

      // Currently returns zeros, but should be numbers
      expect(data.totalUsers).toBe(0);
      expect(data.totalOrders).toBe(0);
      expect(data.totalRevenue).toBe(0);
      expect(data.growthRate).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should respond within reasonable time', async () => {
      const start = Date.now();
      const request = createMockRequest('http://localhost:3000/api/analytics/overview');
      const response = await GET(request);
      const end = Date.now();
      
      const responseTime = end - start;
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(100); // Should respond in less than 100ms
    });
  });
});