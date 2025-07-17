/**
 * Supabase Test Helper Functions
 * Utility functions to simplify Supabase testing
 */

import { createMockSupabaseClient } from './test-utils';
import { createMockRPC, setupRPCMocks, mockRPCResponse, mockRPCError, rpcMocks } from '../mocks/supabase-rpc-mocks';
import type { SupabaseClient } from '@supabase/supabase-js';

// Types
interface MockAuthState {
  user: any | null;
  session: any | null;
  isAuthenticated: boolean;
}

interface MockQueryOptions {
  data?: any;
  error?: any;
  count?: number;
  status?: number;
  statusText?: string;
}

interface TestContext {
  supabase: ReturnType<typeof createMockSupabaseClient>;
  auth: MockAuthState;
  cleanup: () => void;
}

/**
 * Setup Supabase test environment
 * Initializes mock client, auth state, and RPC functions
 */
export const setupSupabaseTest = (): TestContext => {
  // Create mock client
  const supabase = createMockSupabaseClient();
  
  // Setup RPC mocks
  const cleanupRPC = setupRPCMocks();
  
  // Wire up RPC to use mock registry
  (supabase.rpc as jest.Mock) = createMockRPC();
  
  // Initialize auth state
  const auth: MockAuthState = {
    user: null,
    session: null,
    isAuthenticated: false,
  };
  
  // Cleanup function
  const cleanup = () => {
    cleanupRPC();
    jest.clearAllMocks();
  };
  
  return { supabase, auth, cleanup };
};

/**
 * Mock Supabase authentication state
 */
export const mockSupabaseAuth = (
  supabase: ReturnType<typeof createMockSupabaseClient>,
  authState: Partial<MockAuthState>
) => {
  const defaultUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      name: 'Test User',
    },
  };
  
  const defaultSession = {
    user: authState.user || defaultUser,
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: Date.now() + 3600 * 1000,
  };
  
  // Update auth methods
  if (authState.isAuthenticated) {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: authState.user || defaultUser },
      error: null,
    });
    
    supabase.auth.getSession.mockResolvedValue({
      data: { session: authState.session || defaultSession },
      error: null,
    });
  } else {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });
    
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  }
  
  return {
    user: authState.user || (authState.isAuthenticated ? defaultUser : null),
    session: authState.session || (authState.isAuthenticated ? defaultSession : null),
  };
};

/**
 * Mock Supabase query response
 */
export const mockSupabaseQuery = (
  supabase: ReturnType<typeof createMockSupabaseClient>,
  table: string,
  options: MockQueryOptions
) => {
  // Configure the response
  const response = {
    data: options.data || null,
    error: options.error || null,
    count: options.count,
    status: options.status || (options.error ? 400 : 200),
    statusText: options.statusText || (options.error ? 'Bad Request' : 'OK'),
  };
  
  // Mock the from method to return a query builder that resolves to our response
  (supabase.from as jest.Mock).mockImplementationOnce((tableName: string) => {
    if (tableName !== table) {
      // If it's not the table we're mocking, return the normal mock
      return createMockSupabaseClient().from(tableName);
    }
    
    const queryBuilder = createMockSupabaseClient().from(tableName);
    
    // Override the then method to return our response
    (queryBuilder as any).then = (resolve: (value: any) => void) => {
      return Promise.resolve(response).then(resolve);
    };
    
    // Make all chainable methods return the same builder with our response
    const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 
                     'like', 'ilike', 'is', 'in', 'contains', 'containedBy', 'range', 'order', 
                     'limit', 'offset', 'single', 'maybeSingle'];
    
    methods.forEach(method => {
      if ((queryBuilder as any)[method]) {
        ((queryBuilder as any)[method] as jest.Mock).mockImplementation((...args: any[]) => {
          // For terminal methods (single, maybeSingle), return the promise
          if (method === 'single' || method === 'maybeSingle') {
            return Promise.resolve(response);
          }
          // For chainable methods, return the builder
          return queryBuilder;
        });
      }
    });
    
    return queryBuilder;
  });
};

/**
 * Mock Supabase RPC call
 */
export const mockSupabaseRPC = (
  supabase: ReturnType<typeof createMockSupabaseClient>,
  functionName: string,
  response: any
) => {
  // First register the function in the mock registry if it doesn't exist
  if (!(rpcMocks as any)[functionName]) {
    (rpcMocks as any)[functionName] = jest.fn();
  }
  
  // Then set the response
  mockRPCResponse(functionName, response);
};

/**
 * Mock Supabase RPC error
 */
export const mockSupabaseRPCError = (
  supabase: ReturnType<typeof createMockSupabaseClient>,
  functionName: string,
  errorMessage: string
) => {
  // First register the function in the mock registry if it doesn't exist
  if (!(rpcMocks as any)[functionName]) {
    (rpcMocks as any)[functionName] = jest.fn();
  }
  
  // Then set the error response
  mockRPCError(functionName, errorMessage);
};

/**
 * Helper to create a mock Supabase error
 */
export const createSupabaseError = (message: string, code?: string, details?: any) => ({
  message,
  code: code || 'PGRST000',
  details: details || null,
  hint: null,
});

/**
 * Helper to create a successful Supabase response
 */
export const createSupabaseSuccess = <T>(data: T, count?: number) => ({
  data,
  error: null,
  count,
  status: 200,
  statusText: 'OK',
});

/**
 * Mock Supabase realtime subscription
 */
export const mockSupabaseRealtime = (
  supabase: ReturnType<typeof createMockSupabaseClient>,
  channel: string,
  events: Array<{ event: string; payload: any }>
) => {
  const mockChannel: any = {
    on: jest.fn((event: string, callback: (payload: any) => void) => {
      // Find matching events and schedule callbacks
      events
        .filter(e => e.event === event)
        .forEach(e => {
          setTimeout(() => callback(e.payload), 0);
        });
      return mockChannel;
    }),
    subscribe: jest.fn((callback?: (status: string) => void) => {
      if (callback) callback('subscribed');
      return Promise.resolve('subscribed');
    }),
    unsubscribe: jest.fn(),
    track: jest.fn(),
    send: jest.fn(),
  };
  
  (supabase.realtime.channel as jest.Mock).mockReturnValue(mockChannel);
  
  return mockChannel;
};

/**
 * Mock Supabase storage operations
 */
export const mockSupabaseStorage = (
  supabase: ReturnType<typeof createMockSupabaseClient>,
  bucket: string,
  files: Array<{ path: string; url: string; size?: number }>
) => {
  const mockBucket = supabase.storage.from(bucket);
  
  // Mock upload
  (mockBucket.upload as jest.Mock).mockImplementation((path: string) => {
    const file = files.find(f => f.path === path);
    if (file) {
      return Promise.resolve({ data: { path }, error: null });
    }
    return Promise.resolve({ 
      data: null, 
      error: createSupabaseError('File not found') 
    });
  });
  
  // Mock download
  (mockBucket.download as jest.Mock).mockImplementation((path: string) => {
    const file = files.find(f => f.path === path);
    if (file) {
      return Promise.resolve({ 
        data: new Blob(['mock file content'], { type: 'text/plain' }), 
        error: null 
      });
    }
    return Promise.resolve({ 
      data: null, 
      error: createSupabaseError('File not found') 
    });
  });
  
  // Mock list
  (mockBucket.list as jest.Mock).mockResolvedValue({
    data: files.map(f => ({
      name: f.path.split('/').pop(),
      id: f.path,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: { size: f.size || 1000 },
    })),
    error: null,
  });
  
  // Mock getPublicUrl
  (mockBucket.getPublicUrl as jest.Mock).mockImplementation((path: string) => {
    const file = files.find(f => f.path === path);
    return {
      data: { publicUrl: file?.url || `https://test.supabase.co/storage/v1/object/public/${bucket}/${path}` }
    };
  });
  
  return mockBucket;
};

/**
 * Helper to wait for all Supabase operations to complete
 */
export const waitForSupabaseOperations = async () => {
  // Wait for promises to resolve
  await new Promise(resolve => setTimeout(resolve, 0));
  
  // Flush any pending timers
  if (jest.isMockFunction(setTimeout)) {
    jest.runAllTimers();
  }
};

/**
 * Clean up all Supabase mocks
 */
export const cleanupSupabaseMocks = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
};

/**
 * Create a test transaction context
 */
export const createTestTransaction = () => {
  const transactionId = `test-trans-${Date.now()}`;
  
  return {
    id: transactionId,
    start: () => mockRPCResponse('start_transaction', { data: transactionId, error: null }),
    complete: () => mockRPCResponse('complete_transaction', { data: null, error: null }),
    rollback: (reason: string) => 
      mockRPCResponse('rollback_transaction', { 
        data: { success: true, transaction_id: transactionId, rollback_reason: reason },
        error: null 
      }),
    step: (stepName: string, sequence: number) =>
      mockRPCResponse('record_transaction_step', { data: null, error: null }),
  };
};

/**
 * Mock batch operations
 */
export const mockSupabaseBatch = (
  supabase: ReturnType<typeof createMockSupabaseClient>,
  operations: Array<{ table: string; operation: 'insert' | 'update' | 'delete'; data: any }>
) => {
  operations.forEach(({ table, operation, data }) => {
    const queryBuilder = supabase.from(table);
    (queryBuilder[operation] as jest.Mock).mockResolvedValueOnce({
      data: Array.isArray(data) ? data : [data],
      error: null,
    });
  });
};

// Export all helpers
export default {
  setupSupabaseTest,
  mockSupabaseAuth,
  mockSupabaseQuery,
  mockSupabaseRPC,
  mockSupabaseRPCError,
  createSupabaseError,
  createSupabaseSuccess,
  mockSupabaseRealtime,
  mockSupabaseStorage,
  waitForSupabaseOperations,
  cleanupSupabaseMocks,
  createTestTransaction,
  mockSupabaseBatch,
};