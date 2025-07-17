/**
 * MSW Request Handlers
 * 
 * This file contains all the mock request handlers for API testing.
 * Handlers are organized by API endpoint groups.
 */

import { http, HttpResponse } from 'msw';
import { allSupabaseHandlers } from './supabase-msw-handlers';

// Base URL for API routes
const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * Default handlers for common API routes
 * These can be overridden in specific tests using server.use()
 */
export const handlers = [
  // Health check endpoint
  http.get(`${API_BASE}/api/health`, () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  // Analytics endpoints
  http.get(`${API_BASE}/api/analytics/overview`, () => {
    return HttpResponse.json({
      totalOrders: 150,
      totalRevenue: 25000,
      avgOrderValue: 166.67,
      growthRate: 12.5,
    });
  }),

  // Warehouse endpoints
  http.get(`${API_BASE}/api/warehouse/summary`, () => {
    return HttpResponse.json({
      totalLocations: 50,
      occupiedLocations: 35,
      utilizationRate: 70,
      inboundToday: 25,
      outboundToday: 20,
    });
  }),

  // Stock level endpoints
  http.get(`${API_BASE}/api/inventory/stock-levels`, () => {
    return HttpResponse.json({
      items: [
        {
          id: '1',
          productCode: 'PRD001',
          description: 'Test Product 1',
          currentStock: 100,
          minStock: 20,
          maxStock: 200,
        },
        {
          id: '2',
          productCode: 'PRD002',
          description: 'Test Product 2',
          currentStock: 50,
          minStock: 10,
          maxStock: 150,
        },
      ],
      total: 2,
      page: 1,
      pageSize: 10,
    });
  }),

  // Admin dashboard endpoint
  http.get(`${API_BASE}/api/admin/dashboard`, () => {
    return HttpResponse.json({
      stats: {
        totalUsers: 25,
        activeUsers: 20,
        totalTransactions: 500,
        systemHealth: 'good',
      },
      recentActivity: [],
    });
  }),

  // Ask database endpoint (AI-powered queries)
  http.post(`${API_BASE}/api/ask-database`, async ({ request }) => {
    const { query } = await request.json() as { query: string };
    
    // Mock AI response
    return HttpResponse.json({
      answer: `Mock response for query: ${query}`,
      confidence: 0.85,
      sources: ['record_inventory', 'record_palletinfo'],
    });
  }),

  // Error handling examples
  http.get(`${API_BASE}/api/error/404`, () => {
    return HttpResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }),

  http.get(`${API_BASE}/api/error/500`, () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),
];

/**
 * Supabase-specific handlers
 * Mock Supabase API responses for testing
 */
export const supabaseHandlers = [
  // Auth endpoints
  http.post('*/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
    });
  }),

  // Database query endpoints
  http.get('*/rest/v1/record_palletinfo', () => {
    return HttpResponse.json([
      {
        pallet_id: 'PLT00000001',
        series: 'TEST001',
        product_code: 'PRD001',
        quantity: 100,
        status: 'active',
      },
    ]);
  }),

  http.get('*/rest/v1/record_inventory', () => {
    return HttpResponse.json([
      {
        product_code: 'PRD001',
        total_quantity: 1000,
        available_quantity: 800,
        reserved_quantity: 200,
      },
    ]);
  }),
];

// Combine all handlers
export const allHandlers = [...handlers, ...supabaseHandlers, ...allSupabaseHandlers];