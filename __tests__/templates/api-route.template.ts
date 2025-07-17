/**
 * API Route Test Template
 * 
 * This template provides a standardized approach for testing Next.js API routes
 * using next-test-api-route-handler and MSW.
 * 
 * Usage:
 * 1. Copy this template to your test file
 * 2. Import your actual API route handler (see line 23)
 * 3. Replace placeholders with your specific route details
 * 4. Customize test cases based on your API functionality
 * 
 * IMPORTANT: You must uncomment and provide the actual handler import
 * before running the tests. Most tests are commented out as placeholders.
 */

const { testApiHandler } = require('next-test-api-route-handler');
const { http, HttpResponse } = require('msw');

// Import MSW server - using direct import instead of jest.setup
const { setupServer } = require('msw/node');

// Simple handlers for testing
const handlers = [
  http.get('*/api/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
  http.post('*/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'test-token',
      user: { id: 'test-user' }
    });
  }),
];

const server = setupServer(...handlers);

// Import your API route handler
// Example: import * as handler from '@/app/api/your-route/route';
// NOTE: You must uncomment and provide the actual handler import
// const handler = require('@/app/api/your-route/route');

// Example working import (uncomment and modify for your route):
// const handler = require('@/app/api/health/route');

// Placeholder handler for template validation (remove when using actual handler)
const handler = {
  GET: async (request) => {
    // For next-test-api-route-handler, we need to handle URL differently
    // Check if request has nextUrl property (NextRequest)
    const url = request.nextUrl || new URL(request.url, 'http://localhost');
    const params = url.searchParams;
    
    // Also check for direct URL parameter in request
    if (request.url && request.url.includes('invalid=')) {
      return new Response(JSON.stringify({ error: 'Invalid parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Simulate parameter validation
    if (params.has('invalid')) {
      return new Response(JSON.stringify({ error: 'Invalid parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      message: 'Template placeholder',
      params: Object.fromEntries(params)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  },
  
  POST: async (request) => {
    try {
      const body = await request.json();
      
      // Simulate validation
      if (!body.name || !body.value) {
        return new Response(JSON.stringify({ error: 'Missing required fields for validation' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ 
        id: 'test-id',
        ...body
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
  
  DELETE: async (request) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.includes('Bearer')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Simulate permission check
    if (authHeader.includes('viewer-token')) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ message: 'Deleted' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Template for testing Next.js App Router API Routes
 */
describe('/api/[YOUR-ROUTE]', () => {
  describe('GET', () => {
    it('should return successful response with correct data', async () => {
      await testApiHandler({
        appHandler: handler,
        async test({ fetch }) {
          const response = await fetch({
            method: 'GET',
          });

          expect(response.status).toBe(200);
          const data = await response.json();
          
          // Add your assertions here (this is placeholder data)
          expect(data).toHaveProperty('message');
          expect(data.message).toBe('Template placeholder');
        },
      });
    });

    it('should handle query parameters correctly', async () => {
      await testApiHandler({
        appHandler: handler,
        url: '/?param1=value1&param2=value2',
        async test({ fetch }) {
          const response = await fetch({
            method: 'GET',
          });

          expect(response.status).toBe(200);
          const data = await response.json();
          
          // Assert based on query parameters
          expect(data).toMatchObject({
            message: 'Template placeholder',
            params: {
              param1: 'value1',
              param2: 'value2'
            }
          });
        },
      });
    });

    it('should return 400 for invalid parameters', async () => {
      await testApiHandler({
        appHandler: handler,
        url: '/?invalid=parameter',
        async test({ fetch }) {
          const response = await fetch({
            method: 'GET',
          });

          expect(response.status).toBe(400);
          const error = await response.json();
          expect(error).toHaveProperty('error');
        },
      });
    });
  });

  describe('POST', () => {
    it('should create resource successfully', async () => {
      const requestBody = {
        // Your request body here
        name: 'Test Item',
        value: 123,
      };

      await testApiHandler({
        appHandler: handler,
        async test({ fetch }) {
          const response = await fetch({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          expect(response.status).toBe(201);
          const data = await response.json();
          
          expect(data).toMatchObject({
            id: expect.any(String),
            ...requestBody,
          });
        },
      });
    });

    it('should validate request body', async () => {
      const invalidBody = {
        // Missing required fields or invalid data
      };

      await testApiHandler({
        appHandler: handler,
        async test({ fetch }) {
          const response = await fetch({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(invalidBody),
          });

          expect(response.status).toBe(400);
          const error = await response.json();
          expect(error).toHaveProperty('error');
          expect(error.error).toContain('validation');
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Create a handler that simulates database error
      const errorHandler = {
        GET: async () => new Response(JSON.stringify({ error: 'Database connection failed' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      };

      await testApiHandler({
        appHandler: errorHandler,
        async test({ fetch }) {
          const response = await fetch({
            method: 'GET',
          });

          expect(response.status).toBe(500);
          const error = await response.json();
          expect(error).toHaveProperty('error');
        },
      });
    });

    it('should handle unauthorized requests', async () => {
      await testApiHandler({
        appHandler: handler,
        async test({ fetch }) {
          const response = await fetch({
            method: 'DELETE',
            headers: {
              // Missing or invalid authorization
            },
          });

          expect(response.status).toBe(401);
          const error = await response.json();
          expect(error.error).toContain('Unauthorized');
        },
      });
    });
  });

  describe('Authentication & Authorization', () => {
    it('should accept valid authentication token', async () => {
      await testApiHandler({
        appHandler: handler,
        async test({ fetch }) {
          const response = await fetch({
            method: 'GET',
            headers: {
              'Authorization': 'Bearer valid-token',
            },
          });

          expect(response.status).toBe(200);
        },
      });
    });

    it('should check user permissions', async () => {
      // Mock user with insufficient permissions
      server.use(
        http.post('*/auth/v1/token', () => {
          return HttpResponse.json({
            user: {
              id: 'test-user',
              role: 'viewer', // Limited permissions
            },
          });
        })
      );

      await testApiHandler({
        appHandler: handler,
        async test({ fetch }) {
          const response = await fetch({
            method: 'DELETE',
            headers: {
              'Authorization': 'Bearer viewer-token',
            },
          });

          expect(response.status).toBe(403);
          const error = await response.json();
          expect(error.error).toContain('Insufficient permissions');
        },
      });
    });
  });

  describe('Performance & Rate Limiting', () => {
    it('should handle rate limiting', async () => {
      // Create handler with rate limiting simulation
      let requestCount = 0;
      const rateLimitHandler = {
        GET: async () => {
          requestCount++;
          if (requestCount > 5) {
            return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
              status: 429,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          return new Response(JSON.stringify({ message: 'OK' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      };

      await testApiHandler({
        appHandler: rateLimitHandler,
        async test({ fetch }) {
          // Make multiple requests
          const requests = Array(10).fill(null).map(() => 
            fetch({ method: 'GET' })
          );

          const responses = await Promise.all(requests);
          
          // Check if rate limiting is applied
          const rateLimited = responses.some(r => r.status === 429);
          expect(rateLimited).toBe(true);
        },
      });
    });
  });
});

/**
 * Helper function to create authenticated test context
 */
async function withAuth(testFn) {
  // Mock authenticated user
  server.use(
    http.post('*/auth/v1/token', () => {
      return HttpResponse.json({
        access_token: 'test-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          role: 'admin',
        },
      });
    })
  );

  await testApiHandler({
    appHandler: handler,
    async test(context) {
      // Add auth header to all requests
      const originalFetch = context.fetch;
      context.fetch = (options = {}) => {
        return originalFetch({
          ...options,
          headers: {
            ...options.headers,
            'Authorization': 'Bearer test-token',
          },
        });
      };

      await testFn(context);
    },
  });
}

/**
 * Helper to test paginated endpoints
 */
async function testPagination(
  endpoint,
  expectedTotalItems
) {
  await testApiHandler({
    appHandler: handler,
    url: `${endpoint}?page=1&limit=10`,
    async test({ fetch }) {
      // Test first page
      const page1 = await fetch({
        method: 'GET',
      });
      expect(page1.status).toBe(200);
      
      const data1 = await page1.json();
      expect(data1).toHaveProperty('items');
      expect(data1).toHaveProperty('total', expectedTotalItems);
      expect(data1).toHaveProperty('page', 1);
      expect(data1.items.length).toBeLessThanOrEqual(10);
    },
  });
  
  // Test last page separately
  const lastPage = Math.ceil(expectedTotalItems / 10);
  await testApiHandler({
    appHandler: handler,
    url: `${endpoint}?page=${lastPage}&limit=10`,
    async test({ fetch }) {
      const pageLast = await fetch({
        method: 'GET',
      });
      expect(pageLast.status).toBe(200);
    },
  });
}

/**
 * Helper to test input validation
 */
function createValidationTest(
  validData,
  invalidScenarios
) {
  return invalidScenarios.map(({ data, expectedError }) => ({
    name: `should reject invalid data: ${expectedError}`,
    test: async () => {
      await testApiHandler({
        appHandler: handler,
        async test({ fetch }) {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          expect(response.status).toBe(400);
          const error = await response.json();
          expect(error.error).toContain(expectedError);
        },
      });
    },
  }));
}

// Export helper functions for use in other tests
module.exports = {
  withAuth,
  testPagination,
  createValidationTest,
};

/**
 * USAGE INSTRUCTIONS:
 * 
 * 1. Copy this file to your test directory and rename it to match your API route
 *    Example: copy to __tests__/api/health.test.ts
 * 
 * 2. Replace the placeholder handler with your actual API route handler:
 *    const handler = require('@/app/api/your-route/route');
 * 
 * 3. Update the describe block name to match your route:
 *    describe('/api/your-route', () => {
 * 
 * 4. Customize test cases based on your API's specific functionality
 * 
 * 5. Run the tests with: npm test -- your-test-file.test.ts
 * 
 * Key features this template provides:
 * - GET/POST/DELETE method testing
 * - Query parameter handling
 * - Request body validation
 * - Error handling (400, 401, 403, 500)
 * - Authentication & authorization testing
 * - Rate limiting simulation
 * - Helper functions for common patterns
 * 
 * For URL parameters, use the 'url' property in testApiHandler options:
 * await testApiHandler({
 *   appHandler: handler,
 *   url: '/?param=value',
 *   async test({ fetch }) { ... }
 * });
 */