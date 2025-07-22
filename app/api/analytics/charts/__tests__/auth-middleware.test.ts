/**
 * Test file for Analytics API with unified authentication middleware
 * Validates that the optimized APIs work correctly
 */

import { withAnalyticsAuth } from '@/lib/analytics/auth-middleware';
import { z } from 'zod';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
  },
  from: jest.fn(),
};

// Mock createClient
jest.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabase,
}));

// Test schema
const TestSchema = z.object({
  timeRange: z.enum(['1d', '7d', '30d', '90d']),
});

describe('Analytics Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle valid requests successfully', async () => {
    // Mock successful session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user' } } },
      error: null,
    });

    // Create test request
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeRange: '7d' }),
    });

    // Test handler
    const response = await withAnalyticsAuth(
      request,
      TestSchema,
      async (supabase, { timeRange }) => {
        expect(timeRange).toBe('7d');
        return { success: true, data: 'test-data' };
      }
    );

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toEqual({ success: true, data: 'test-data' });
  });

  it('should handle expired sessions with user-friendly error', async () => {
    // Mock expired session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeRange: '7d' }),
    });

    const response = await withAnalyticsAuth(
      request,
      TestSchema,
      async () => ({ success: true })
    );

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Your session has expired. Please refresh the page to continue.');
    expect(data.errorCode).toBe('SESSION_EXPIRED');
  });

  it('should handle invalid input with clear error messages', async () => {
    // Mock valid session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user' } } },
      error: null,
    });

    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeRange: 'invalid' }),
    });

    const response = await withAnalyticsAuth(
      request,
      TestSchema,
      async () => ({ success: true })
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid request parameters');
    expect(data.errorCode).toBe('VALIDATION_ERROR');
  });

  it('should handle database errors gracefully', async () => {
    // Mock valid session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user' } } },
      error: null,
    });

    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeRange: '7d' }),
    });

    const response = await withAnalyticsAuth(
      request,
      TestSchema,
      async () => {
        throw new Error('PGRST001: Database connection failed');
      }
    );

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Database query error. Please contact support if this persists.');
    expect(data.errorCode).toBe('DATABASE_ERROR');
  });
});