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

// Mock Supabase client
export const createMockSupabaseClient = () => {
  const mockClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    rpc: jest.fn().mockReturnThis(),
    auth: {
      getUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
    realtime: {
      channel: jest.fn().mockReturnValue({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
        unsubscribe: jest.fn(),
      }),
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