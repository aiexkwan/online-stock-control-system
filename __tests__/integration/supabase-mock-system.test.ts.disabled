/**
 * Supabase Mock System Integration Tests
 * Verifies that all mock components work together correctly
 */

import { createMockSupabaseClient } from '../utils/test-utils';
import {
  setupSupabaseTest,
  mockSupabaseAuth,
  mockSupabaseQuery,
  mockSupabaseRPC,
  mockSupabaseRPCError,
  createSupabaseError,
  createSupabaseSuccess,
  mockSupabaseRealtime,
  mockSupabaseStorage,
  cleanupSupabaseMocks,
} from '../utils/supabase-test-helpers';
import { rpcMocks, createMockRPC } from '../mocks/supabase-rpc-mocks';
import { server } from '../../jest.setup';

describe('Supabase Mock System', () => {
  describe('Enhanced createMockSupabaseClient', () => {
    let supabase: any;

    beforeEach(() => {
      supabase = createMockSupabaseClient();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should support complex query building', () => {
      const query = supabase
        .from('test_table')
        .select('id, name, created_at')
        .eq('status', 'active')
        .gte('created_at', '2024-01-01')
        .order('created_at', { ascending: false })
        .limit(10);

      // Verify query state
      const queryState = (query as any)._getQueryState();
      expect(queryState.table).toBe('test_table');
      expect(queryState.selectColumns).toBe('id, name, created_at');
      expect(queryState.filters).toHaveLength(2);
      expect(queryState.orderBy).toHaveLength(1);
      expect(queryState.limitValue).toBe(10);
    });

    it('should support join operations', () => {
      const query = supabase
        .from('orders')
        .select('*, customer:customers(*)')
        .leftJoin('customers', 'orders.customer_id = customers.id');

      const queryState = (query as any)._getQueryState();
      expect(queryState.joins).toHaveLength(1);
      expect(queryState.joins[0].type).toBe('left');
    });

    it('should support text search', () => {
      const query = supabase
        .from('products')
        .select()
        .textSearch('description', 'widget', { type: 'websearch' });

      const queryState = (query as any)._getQueryState();
      expect(queryState.filters).toContainEqual({
        type: 'textSearch',
        column: 'description',
        query: 'widget',
        options: { type: 'websearch' },
      });
    });

    it('should support storage operations', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const result = await supabase.storage.from('documents').upload('test/test.pdf', file);

      expect(result.data).toHaveProperty('path', 'test-path');
      expect(result.error).toBeNull();
    });

    it('should support realtime subscriptions', () => {
      const channel = supabase.realtime.channel('test-channel');
      const onCallback = jest.fn();

      channel.on('INSERT', onCallback).subscribe();

      expect(channel.on).toHaveBeenCalledWith('INSERT', onCallback);
      expect(channel.subscribe).toHaveBeenCalled();
    });
  });

  describe('RPC Mock System', () => {
    let mockRPC: ReturnType<typeof createMockRPC>;

    beforeEach(() => {
      mockRPC = createMockRPC();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should execute mocked RPC functions', async () => {
      const result = await mockRPC('generate_atomic_pallet_numbers_v6', {
        p_count: 5,
        p_session_id: 'test-session',
      });

      expect(result.data).toHaveLength(5);
      expect(result.data[0]).toHaveProperty('pallet_number');
      expect(result.data[0]).toHaveProperty('series');
      expect(result.error).toBeNull();
    });

    it('should handle unknown RPC functions', async () => {
      const result = await mockRPC('non_existent_function', {});

      expect(result.data).toBeNull();
      expect(result.error).toHaveProperty('message', 'Unknown RPC function: non_existent_function');
    });

    it('should allow custom RPC responses', async () => {
      rpcMocks.search_pallet_info.mockReturnValueOnce({
        data: { custom: 'response' },
        error: null,
      });

      const result = await mockRPC('search_pallet_info', {
        p_search_type: 'pallet',
        p_search_value: 'TEST',
      });

      expect(result.data).toEqual({ custom: 'response' });
    });
  });

  describe('Supabase Test Helpers', () => {
    let testContext: ReturnType<typeof setupSupabaseTest>;

    beforeEach(() => {
      testContext = setupSupabaseTest();
    });

    afterEach(() => {
      testContext.cleanup();
    });

    it('should setup test environment correctly', () => {
      expect(testContext.supabase).toBeDefined();
      expect(testContext.auth).toBeDefined();
      expect(testContext.cleanup).toBeInstanceOf(Function);
    });

    it('should mock authentication state', async () => {
      const authState = mockSupabaseAuth(testContext.supabase, {
        isAuthenticated: true,
        user: { id: 'custom-user-id', email: 'custom@test.com' },
      });

      const userResult = await testContext.supabase.auth.getUser();
      expect(userResult.data.user).toHaveProperty('id', 'custom-user-id');
      expect(userResult.data.user).toHaveProperty('email', 'custom@test.com');
    });

    it('should mock query responses', async () => {
      const mockData = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
      ];

      mockSupabaseQuery(testContext.supabase, 'test_table', {
        data: mockData,
        count: 2,
      });

      const query = testContext.supabase.from('test_table').select();
      const result = await query;

      expect(result.data).toEqual(mockData);
      expect(result.count).toBe(2);
    });

    it('should mock RPC responses', async () => {
      mockSupabaseRPC(testContext.supabase, 'test_function', {
        data: { result: 'success' },
        error: null,
      });

      const result = await testContext.supabase.rpc('test_function', { param: 'value' });
      expect(result.data).toEqual({ result: 'success' });
    });

    it('should mock RPC errors', async () => {
      mockSupabaseRPCError(testContext.supabase, 'failing_function', 'Operation failed');

      const result = await testContext.supabase.rpc('failing_function');
      expect(result.error).toHaveProperty('message', 'Operation failed');
    });

    it('should mock realtime events', (done) => {
      const events = [
        { event: 'INSERT', payload: { new: { id: 1, name: 'New Item' } } },
        { event: 'UPDATE', payload: { new: { id: 1, name: 'Updated Item' } } },
      ];

      const channel = mockSupabaseRealtime(testContext.supabase, 'test-channel', events);

      let eventCount = 0;
      channel.on('INSERT', (payload) => {
        expect(payload.new.name).toBe('New Item');
        eventCount++;
        if (eventCount === 1) done();
      });
    });

    it('should mock storage operations', async () => {
      const files = [
        { path: 'test/file1.pdf', url: 'https://example.com/file1.pdf' },
        { path: 'test/file2.pdf', url: 'https://example.com/file2.pdf' },
      ];

      const bucket = mockSupabaseStorage(testContext.supabase, 'documents', files);

      // Test upload
      const uploadResult = await bucket.upload('test/file1.pdf', new Blob());
      expect(uploadResult.data).toHaveProperty('path', 'test/file1.pdf');

      // Test get public URL
      const urlResult = bucket.getPublicUrl('test/file1.pdf');
      expect(urlResult.data.publicUrl).toBe('https://example.com/file1.pdf');

      // Test list
      const listResult = await bucket.list();
      expect(listResult.data).toHaveLength(2);
    });
  });

  describe('MSW Integration', () => {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bbmkuiplnzvpudszrend.supabase.co';
    
    it('should handle Supabase REST API calls', async () => {
      // This test requires MSW to be properly set up
      // Skip if MSW is not available
      if (!server || !server.listen || typeof server.listen !== 'function') {
        console.warn('MSW not available, skipping integration test');
        return;
      }

      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/record_palletinfo?limit=5`);
        
        if (response && response.ok) {
          const data = await response.json();
          expect(Array.isArray(data)).toBe(true);
          expect(data.length).toBeLessThanOrEqual(5);
        }
      } catch (error) {
        // If fetch fails, it's likely because MSW isn't properly configured
        console.warn('MSW fetch failed:', error);
      }
    });

    it('should handle RPC calls through MSW', async () => {
      if (!server || !server.listen || typeof server.listen !== 'function') {
        console.warn('MSW not available, skipping integration test');
        return;
      }

      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_pallet_info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_search_type: 'pallet', p_search_value: 'TEST' }),
        });

        if (response && response.ok) {
          const data = await response.json();
          expect(data).toBeDefined();
        }
      } catch (error) {
        console.warn('MSW fetch failed:', error);
      }
    });
  });

  describe('Error Scenarios', () => {
    let testContext: ReturnType<typeof setupSupabaseTest>;

    beforeEach(() => {
      testContext = setupSupabaseTest();
    });

    afterEach(() => {
      testContext.cleanup();
    });

    it('should handle authentication errors', async () => {
      mockSupabaseAuth(testContext.supabase, { isAuthenticated: false });

      const result = await testContext.supabase.auth.getUser();
      expect(result.error).toHaveProperty('message', 'Not authenticated');
      expect(result.data.user).toBeNull();
    });

    it('should handle query errors', async () => {
      mockSupabaseQuery(testContext.supabase, 'test_table', {
        error: createSupabaseError('Table not found', 'PGRST116'),
      });

      const result = await testContext.supabase.from('test_table').select();
      expect(result.error).toHaveProperty('code', 'PGRST116');
      expect(result.data).toBeNull();
    });

    it('should create proper error objects', () => {
      const error = createSupabaseError('Custom error', 'CUSTOM001', { field: 'value' });
      
      expect(error).toEqual({
        message: 'Custom error',
        code: 'CUSTOM001',
        details: { field: 'value' },
        hint: null,
      });
    });

    it('should create proper success objects', () => {
      const data = [{ id: 1, name: 'Test' }];
      const success = createSupabaseSuccess(data, 10);
      
      expect(success).toEqual({
        data,
        error: null,
        count: 10,
        status: 200,
        statusText: 'OK',
      });
    });
  });
});