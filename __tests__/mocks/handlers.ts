/**
 * MSW (Mock Service Worker) Handlers
 * Centralized mock handlers for all API endpoints and GraphQL queries
 */

import { http, HttpResponse } from 'msw';
import { graphqlHandlers } from './graphql-handlers';

// REST API mock handlers
const restApiHandlers = [
  // Health check endpoint
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  }),

  // Dashboard API endpoints
  http.get('/api/admin/dashboard', () => {
    return HttpResponse.json({
      success: true,
      data: {
        stats: {
          totalOperations: 1250,
          activeOperators: 8,
          completedOrders: 45,
          pendingTasks: 12,
        },
        recentActivity: [
          {
            id: 1,
            operator: 'Alice Chen',
            action: 'Finished QC',
            timestamp: new Date().toISOString(),
          },
          {
            id: 2,
            operator: 'Bob Wilson',
            action: 'Stock Transfer',
            timestamp: new Date(Date.now() - 300000).toISOString(),
          },
        ],
      },
    });
  }),

  // Analytics endpoints
  http.get('/api/analytics/overview', () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalRecords: 5000,
        operatorsActive: 15,
        efficiency: 94.2,
        trends: {
          daily: [120, 135, 110, 160, 145, 130, 155],
          weekly: [850, 920, 780, 1100, 1050],
        },
      },
    });
  }),

  // Upload endpoints
  http.post('/api/upload-file', async ({ request }) => {
    // Simulate file upload processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return HttpResponse.json({
      success: true,
      data: {
        fileId: 'mock-file-' + Date.now(),
        fileName: 'test-upload.xlsx',
        fileSize: 1024 * 50, // 50KB
        uploadTime: new Date().toISOString(),
      },
    });
  }),

  // Error simulation
  http.get('/api/error-test', () => {
    return HttpResponse.json(
      {
        error: 'Mock API Error',
        message: 'This is a simulated error for testing purposes',
      },
      { status: 500 }
    );
  }),

  // Slow endpoint simulation
  http.get('/api/slow-test', async () => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    return HttpResponse.json({
      message: 'This endpoint was intentionally slow for testing',
      delay: 3000,
    });
  }),
];

// Authentication mock handlers
const authHandlers = [
  // Login endpoint
  http.post('/auth/login', async ({ request }) => {
    const body = await request.json() as any;
    const { email, password } = body;

    // Simulate authentication logic
    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        success: true,
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
        },
        token: 'mock-jwt-token-' + Date.now(),
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: 'Invalid credentials',
      },
      { status: 401 }
    );
  }),

  // Logout endpoint
  http.post('/auth/logout', () => {
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  }),

  // User profile endpoint
  http.get('/api/user/profile', ({ request }) => {
    const token = request.headers.get('authorization');
    
    if (!token || !token.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        department: 'IT',
        lastLogin: new Date().toISOString(),
      },
    });
  }),
];

// Database mock handlers (simulating Supabase)
const databaseHandlers = [
  // Record history table query
  http.get('/rest/v1/record_history', ({ request }) => {
    const url = new URL(request.url);
    const select = url.searchParams.get('select');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Generate mock database response
    const mockData = Array.from({ length: Math.min(limit, 50) }, (_, i) => ({
      id: offset + i + 1,
      time: new Date(Date.now() - (i * 300000)).toISOString(), // 5 minutes apart
      operator_id: Math.floor(Math.random() * 5) + 101,
      action: ['QC', 'Stock Transfer', 'Order Upload', 'Void'][Math.floor(Math.random() * 4)],
      plt_num: `PLT${String(offset + i + 1).padStart(8, '0')}`,
      loc: Math.random() > 0.3 ? `LOC-${String(Math.floor(Math.random() * 100)).padStart(3, '0')}` : null,
      remark: Math.random() > 0.6 ? `Mock remark ${offset + i + 1}` : null,
      uuid: `uuid-${offset + i + 1}`,
    }));

    return HttpResponse.json(mockData);
  }),

  // Operator data table
  http.get('/rest/v1/data_id', ({ request }) => {
    const url = new URL(request.url);
    const select = url.searchParams.get('select');

    const mockOperators = [
      { id: 101, name: 'Alice Chen', department: 'Quality Control', email: 'alice.chen@company.com' },
      { id: 102, name: 'Bob Wilson', department: 'Warehouse', email: 'bob.wilson@company.com' },
      { id: 103, name: 'Carol Zhang', department: 'Production', email: 'carol.zhang@company.com' },
      { id: 104, name: 'David Kim', department: 'Shipping', email: 'david.kim@company.com' },
      { id: 105, name: 'Emma Brown', department: 'Receiving', email: 'emma.brown@company.com' },
    ];

    return HttpResponse.json(mockOperators);
  }),
];

// Performance testing mock handlers
const performanceHandlers = [
  // Large dataset endpoint for stress testing
  http.get('/api/performance/large-dataset', ({ request }) => {
    const url = new URL(request.url);
    const size = parseInt(url.searchParams.get('size') || '1000');

    const largeData = Array.from({ length: size }, (_, i) => ({
      id: i + 1,
      timestamp: new Date(Date.now() - (i * 1000)).toISOString(),
      data: `Mock data item ${i + 1}`,
      value: Math.random() * 1000,
    }));

    return HttpResponse.json({
      success: true,
      count: largeData.length,
      data: largeData,
      generatedAt: new Date().toISOString(),
    });
  }),

  // Memory intensive endpoint
  http.get('/api/performance/memory-test', () => {
    // Create a large object to simulate memory usage
    const largeObject = {
      data: Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        content: 'x'.repeat(1000), // 1KB per item = ~10MB total
        nested: {
          array: Array.from({ length: 100 }, (_, j) => `item-${j}`),
          object: Object.fromEntries(Array.from({ length: 50 }, (_, k) => [`key-${k}`, `value-${k}`])),
        },
      })),
    };

    return HttpResponse.json({
      success: true,
      message: 'Memory intensive operation completed',
      dataSize: largeObject.data.length,
      estimatedMemoryUsage: '~10MB',
    });
  }),
];

// Combine all handlers
export const allHandlers = [
  ...graphqlHandlers,
  ...restApiHandlers,
  ...authHandlers,
  ...databaseHandlers,
  ...performanceHandlers,
];

// Export individual handler groups
export {
  graphqlHandlers,
  restApiHandlers,
  authHandlers,
  databaseHandlers,
  performanceHandlers,
};

// Default export
export default allHandlers;