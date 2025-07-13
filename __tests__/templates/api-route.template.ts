/**
 * API Route Test Template
 * 
 * This template provides a standardized approach for testing Next.js API routes
 * using next-test-api-route-handler and MSW.
 * 
 * Usage:
 * 1. Copy this template to your test file
 * 2. Replace placeholders with your specific route details
 * 3. Customize test cases based on your API functionality
 */

import { testApiHandler } from 'next-test-api-route-handler';
import { server } from '../../jest.setup';
import { http, HttpResponse } from 'msw';
import type { NextRequest } from 'next/server';

// Import your API route handler
// Example: import * as handler from '@/app/api/your-route/route';

/**
 * Template for testing Next.js App Router API Routes
 */
describe('/api/[YOUR-ROUTE]', () => {
  describe('GET', () => {
    it('should return successful response with correct data', async () => {
      await testApiHandler({
        appHandler: handler as any,
        async test({ fetch }) {
          const response = await fetch({
            method: 'GET',
          });

          expect(response.status).toBe(200);
          const data = await response.json();
          
          // Add your assertions here
          expect(data).toHaveProperty('expectedProperty');
        },
      });
    });

    it('should handle query parameters correctly', async () => {
      await testApiHandler({
        appHandler: handler as any,
        async test({ fetch }) {
          const response = await fetch({
            method: 'GET',
            // Add query parameters
            url: '?param1=value1&param2=value2',
          });

          expect(response.status).toBe(200);
          const data = await response.json();
          
          // Assert based on query parameters
          expect(data).toMatchObject({
            // Expected response based on query params
          });
        },
      });
    });

    it('should return 400 for invalid parameters', async () => {
      await testApiHandler({
        appHandler: handler as any,
        async test({ fetch }) {
          const response = await fetch({
            method: 'GET',
            url: '?invalid=parameter',
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
        appHandler: handler as any,
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
        appHandler: handler as any,
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
      // Override MSW handler to simulate database error
      server.use(
        http.get('*/rest/v1/*', () => {
          return HttpResponse.json(
            { error: 'Database connection failed' },
            { status: 500 }
          );
        })
      );

      await testApiHandler({
        appHandler: handler as any,
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
        appHandler: handler as any,
        async test({ fetch }) {
          const response = await fetch({
            method: 'GET',
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
        appHandler: handler as any,
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
        appHandler: handler as any,
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
      // Simulate multiple rapid requests
      await testApiHandler({
        appHandler: handler as any,
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
export async function withAuth(testFn: (context: any) => Promise<void>) {
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
    appHandler: handler as any,
    async test(context) {
      // Add auth header to all requests
      const originalFetch = context.fetch;
      context.fetch = (options: any = {}) => {
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
export async function testPagination(
  endpoint: string,
  expectedTotalItems: number
) {
  await testApiHandler({
    appHandler: handler as any,
    async test({ fetch }) {
      // Test first page
      const page1 = await fetch({
        method: 'GET',
        url: `${endpoint}?page=1&limit=10`,
      });
      expect(page1.status).toBe(200);
      
      const data1 = await page1.json();
      expect(data1).toHaveProperty('items');
      expect(data1).toHaveProperty('total', expectedTotalItems);
      expect(data1).toHaveProperty('page', 1);
      expect(data1.items.length).toBeLessThanOrEqual(10);

      // Test last page
      const lastPage = Math.ceil(expectedTotalItems / 10);
      const pageLast = await fetch({
        method: 'GET',
        url: `${endpoint}?page=${lastPage}&limit=10`,
      });
      expect(pageLast.status).toBe(200);
    },
  });
}

/**
 * Helper to test input validation
 */
export function createValidationTest(
  validData: any,
  invalidScenarios: Array<{ data: any; expectedError: string }>
) {
  return invalidScenarios.map(({ data, expectedError }) => ({
    name: `should reject invalid data: ${expectedError}`,
    test: async () => {
      await testApiHandler({
        appHandler: handler as any,
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