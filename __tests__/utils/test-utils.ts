// Test utilities and helpers

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { createClient } from '@supabase/supabase-js';

// Custom render function with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // Add providers here as needed (e.g., Theme, Auth, etc.)
  return render(ui, options);
}

// Wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Supabase client with enhanced query capabilities
export const createMockSupabaseClient = () => {
  // Store query state for complex query building
  const queryState = {
    table: '',
    selectColumns: '*',
    filters: [],
    joins: [],
    orderBy: [],
    limitValue: null,
    offsetValue: null,
    modifiers: [],
  };

  // Helper to reset query state
  const resetQueryState = () => {
    queryState.table = '';
    queryState.selectColumns = '*';
    queryState.filters = [];
    queryState.joins = [];
    queryState.orderBy = [];
    queryState.limitValue = null;
    queryState.offsetValue = null;
    queryState.modifiers = [];
  };

  // Create chainable query builder
  const createQueryBuilder = () => {
    const builder = {
      // Selection methods
      select: jest.fn((columns = '*') => {
        queryState.selectColumns = columns;
        return builder;
      }),
      
      // Data modification methods
      insert: jest.fn((data) => {
        queryState.data = data;
        return builder;
      }),
      update: jest.fn((data) => {
        queryState.data = data;
        return builder;
      }),
      upsert: jest.fn((data) => {
        queryState.data = data;
        return builder;
      }),
      delete: jest.fn(() => builder),
      
      // Filter methods
      eq: jest.fn((column, value) => {
        queryState.filters.push({ type: 'eq', column, value });
        return builder;
      }),
      neq: jest.fn((column, value) => {
        queryState.filters.push({ type: 'neq', column, value });
        return builder;
      }),
      gt: jest.fn((column, value) => {
        queryState.filters.push({ type: 'gt', column, value });
        return builder;
      }),
      gte: jest.fn((column, value) => {
        queryState.filters.push({ type: 'gte', column, value });
        return builder;
      }),
      lt: jest.fn((column, value) => {
        queryState.filters.push({ type: 'lt', column, value });
        return builder;
      }),
      lte: jest.fn((column, value) => {
        queryState.filters.push({ type: 'lte', column, value });
        return builder;
      }),
      like: jest.fn((column, pattern) => {
        queryState.filters.push({ type: 'like', column, pattern });
        return builder;
      }),
      ilike: jest.fn((column, pattern) => {
        queryState.filters.push({ type: 'ilike', column, pattern });
        return builder;
      }),
      is: jest.fn((column, value) => {
        queryState.filters.push({ type: 'is', column, value });
        return builder;
      }),
      in: jest.fn((column, values) => {
        queryState.filters.push({ type: 'in', column, values });
        return builder;
      }),
      contains: jest.fn((column, value) => {
        queryState.filters.push({ type: 'contains', column, value });
        return builder;
      }),
      containedBy: jest.fn((column, value) => {
        queryState.filters.push({ type: 'containedBy', column, value });
        return builder;
      }),
      
      // Range filter
      range: jest.fn((from, to) => {
        queryState.limitValue = to - from + 1;
        queryState.offsetValue = from;
        return builder;
      }),
      
      // Ordering
      order: jest.fn((column, options = {}) => {
        queryState.orderBy.push({ column, ...options });
        return builder;
      }),
      
      // Pagination
      limit: jest.fn((count) => {
        queryState.limitValue = count;
        return builder;
      }),
      offset: jest.fn((count) => {
        queryState.offsetValue = count;
        return builder;
      }),
      
      // Modifiers
      single: jest.fn(() => {
        queryState.modifiers.push('single');
        return Promise.resolve({ data: null, error: null });
      }),
      maybeSingle: jest.fn(() => {
        queryState.modifiers.push('maybeSingle');
        return Promise.resolve({ data: null, error: null });
      }),
      
      // Join operations
      leftJoin: jest.fn((table, on) => {
        queryState.joins.push({ type: 'left', table, on });
        return builder;
      }),
      innerJoin: jest.fn((table, on) => {
        queryState.joins.push({ type: 'inner', table, on });
        return builder;
      }),
      
      // Additional query methods
      or: jest.fn((filters) => {
        queryState.filters.push({ type: 'or', filters });
        return builder;
      }),
      not: jest.fn((column, operator, value) => {
        queryState.filters.push({ type: 'not', column, operator, value });
        return builder;
      }),
      match: jest.fn((query) => {
        queryState.filters.push({ type: 'match', query });
        return builder;
      }),
      
      // Text search
      textSearch: jest.fn((column, query, options) => {
        queryState.filters.push({ type: 'textSearch', column, query, options });
        return builder;
      }),
      
      // Return count
      count: jest.fn((options = {}) => {
        queryState.modifiers.push({ type: 'count', options });
        return builder;
      }),
      
      // CSV export
      csv: jest.fn(() => {
        queryState.modifiers.push('csv');
        return builder;
      }),
      
      // Get query state (for testing)
      _getQueryState: () => ({ ...queryState }),
      
      // Promise-like behavior
      then: (resolve) => {
        return Promise.resolve({ data: [], error: null }).then(resolve);
      },
    };
    
    return builder;
  };

  const mockClient = {
    from: jest.fn((table) => {
      resetQueryState();
      queryState.table = table;
      return createQueryBuilder();
    }),
    
    // RPC with enhanced return handling
    rpc: jest.fn((functionName, params = {}) => {
      return Promise.resolve({ data: null, error: null });
    }),
    
    // Enhanced auth methods
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { 
          user: { 
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {}
          } 
        },
        error: null
      }),
      signIn: jest.fn().mockResolvedValue({
        data: { 
          user: { id: 'test-user-id' },
          session: { access_token: 'test-token' }
        },
        error: null
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getSession: jest.fn().mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'test-user-id' },
            access_token: 'test-token'
          } 
        },
        error: null
      }),
      onAuthStateChange: jest.fn((callback) => {
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
          error: null
        };
      }),
    },
    
    // Enhanced realtime support
    realtime: {
      channel: jest.fn((channelName) => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn((callback) => {
          if (callback) callback('subscribed');
          return Promise.resolve('subscribed');
        }),
        unsubscribe: jest.fn(),
        track: jest.fn(),
        send: jest.fn(),
      })),
      setAuth: jest.fn(),
      removeChannel: jest.fn(),
    },
    
    // Storage support
    storage: {
      from: jest.fn((bucket) => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: jest.fn().mockResolvedValue({ data: [], error: null }),
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: jest.fn((path) => ({ 
          data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/${bucket}/${path}` } 
        })),
      })),
    },
    
    // Functions support
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
  
  return mockClient;
};

// Assert helpers
export const assertDefined = <T>(value: T | undefined | null): T => {
  expect(value).toBeDefined();
  expect(value).not.toBeNull();
  return value as T;
};

// Mock console methods
export const mockConsole = () => {
  const originalConsole = { ...console };
  const mockedMethods = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
  
  beforeAll(() => {
    Object.assign(console, mockedMethods);
  });
  
  afterAll(() => {
    Object.assign(console, originalConsole);
  });
  
  return mockedMethods;
};

// Mock fetch
export const mockFetch = (response: any, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });
  
  return global.fetch as jest.Mock;
};

// Reset all mocks
export const resetAllMocks = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
  jest.restoreAllMocks();
};

// Test data cleanup
export const cleanupTestData = async (supabase: any, tables: string[]) => {
  for (const table of tables) {
    await supabase.from(table).delete().gte('created_at', '1970-01-01');
  }
};

// Performance testing helper
export const measurePerformance = async (fn: () => Promise<any>, name: string) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  console.log(`${name} took ${end - start}ms`);
  return { result, duration: end - start };
};

// Snapshot serializers
export const dateSerializer = {
  test: (val: any) => val instanceof Date,
  print: (val: Date) => `Date(${val.toISOString()})`,
};

// Mock timers helper
export const useFakeTimers = () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
};

// Test database connection
export const createTestDatabase = () => {
  const testUrl = process.env.TEST_SUPABASE_URL || 'http://localhost:54321';
  const testKey = process.env.TEST_SUPABASE_ANON_KEY || 'test-key';
  
  return createClient(testUrl, testKey);
};