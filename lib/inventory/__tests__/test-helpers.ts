import { DatabaseRecord } from '@/lib/types/database';

// Jest mock function type
type MockFunction<T = unknown> = jest.Mock<T>;

// Mock chain methods type
interface MockChainMethods {
  select: MockFunction;
  insert: MockFunction;
  update: MockFunction;
  delete: MockFunction;
  upsert: MockFunction;
  eq: MockFunction;
  neq: MockFunction;
  gt: MockFunction;
  gte: MockFunction;
  lt: MockFunction;
  lte: MockFunction;
  like: MockFunction;
  ilike: MockFunction;
  is: MockFunction;
  in: MockFunction;
  contains: MockFunction;
  containedBy: MockFunction;
  range: MockFunction;
  order: MockFunction;
  limit: MockFunction;
  single: MockFunction;
  maybeSingle: MockFunction;
  then?: (callback: (value: { data: DatabaseRecord[] | null; error: unknown }) => unknown) => Promise<unknown>;
}

// Mock Supabase client type
interface MockSupabaseClient {
  from: MockFunction<MockChainMethods>;
  rpc: MockFunction<Promise<{ data: DatabaseRecord | null; error: unknown }>>;
  auth: {
    getUser: MockFunction<Promise<{ data: { user: { id: string } } | null; error: unknown }>>;
    getSession: MockFunction<Promise<{ data: { session: { user: { id: string } } } | null; error: unknown }>>;
  };
}

// Error type for mocks
interface MockError {
  message: string;
}

/**
 * Test helpers for inventory module tests
 */

// Dummy test to satisfy Jest
describe('test-helpers', () => {
  it('should export helper functions', () => {
    expect(createMockSupabaseChain).toBeDefined();
    expect(createMockSupabaseClient).toBeDefined();
  });
});

export const createMockSupabaseChain = (returnData: DatabaseRecord | null = null, returnError: DatabaseRecord | null = null): MockChainMethods => {
  const methods: MockChainMethods = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    gt: jest.fn(),
    gte: jest.fn(),
    lt: jest.fn(),
    lte: jest.fn(),
    like: jest.fn(),
    ilike: jest.fn(),
    is: jest.fn(),
    in: jest.fn(),
    contains: jest.fn(),
    containedBy: jest.fn(),
    range: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
  };

  // Make all methods chainable
  Object.keys(methods).forEach(key => {
    if (key === 'single' || key === 'maybeSingle') {
      methods[key].mockResolvedValue({ data: returnData, error: returnError });
    } else {
      methods[key].mockReturnValue(methods);
    }
  });

  // Add special handling for promise-like behavior
  methods.then = (callback: (value: { data: DatabaseRecord[] | null; error: unknown }) => unknown) => {
    return Promise.resolve({ data: returnData, error: returnError }).then(callback);
  };
  
  // Make the chain itself act as a resolved promise when awaited
  Object.defineProperty(methods, Symbol.toStringTag, {
    value: 'Promise'
  });
  
  // Ensure the chain can be awaited directly
  if (!('then' in methods)) {
    methods.then = (resolve: (value: { data: DatabaseRecord[] | null; error: unknown }) => unknown) => {
      return Promise.resolve({ data: returnData, error: returnError }).then(resolve);
    };
  }

  return methods;
};

export const createMockSupabaseClient = (): MockSupabaseClient => {
  const client: MockSupabaseClient = {
    from: jest.fn((_table: string) => {
      const chain = createMockSupabaseChain();
      // Ensure all chain methods are properly mocked
      return chain;
    }),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: jest.fn().mockResolvedValue({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null
      })
    }
  };

  return client;
};

export const mockSuccessfulPalletSearch = (supabase: MockSupabaseClient, pallet: DatabaseRecord) => {
  const chain = createMockSupabaseChain(pallet);
  supabase.from.mockReturnValueOnce(chain);
  return chain;
};

export const mockFailedPalletSearch = (supabase: MockSupabaseClient, error: string) => {
  const chain = createMockSupabaseChain(null, { message: error });
  supabase.from.mockReturnValueOnce(chain);
  return chain;
};

export const mockInventoryData = (supabase: MockSupabaseClient, inventory: DatabaseRecord) => {
  const chain = createMockSupabaseChain(inventory);
  supabase.from.mockReturnValueOnce(chain);
  return chain;
};

export const mockBatchResult = (supabase: MockSupabaseClient, results: DatabaseRecord[]) => {
  const chain = createMockSupabaseChain(results);
  supabase.from.mockReturnValueOnce(chain);
  return chain;
};

export const mockRPCCall = (supabase: MockSupabaseClient, result: DatabaseRecord, error: DatabaseRecord | null = null) => {
  supabase.rpc.mockResolvedValueOnce({ data: result, error });
};