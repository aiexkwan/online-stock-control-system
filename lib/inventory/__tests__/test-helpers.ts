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

export const createMockSupabaseChain = (returnData: any = null, returnError: any = null) => {
  const methods: any = {
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
  methods.then = (callback: Function) => {
    return Promise.resolve({ data: returnData, error: returnError }).then(callback);
  };
  
  // Make the chain itself act as a resolved promise when awaited
  Object.defineProperty(methods, Symbol.toStringTag, {
    value: 'Promise'
  });
  
  // Ensure the chain can be awaited directly
  if (!('then' in methods)) {
    methods.then = (resolve: Function) => {
      return Promise.resolve({ data: returnData, error: returnError }).then(resolve);
    };
  }

  return methods;
};

export const createMockSupabaseClient = () => {
  const client = {
    from: jest.fn((table: string) => {
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

export const mockSuccessfulPalletSearch = (supabase: any, pallet: any) => {
  const chain = createMockSupabaseChain(pallet);
  supabase.from.mockReturnValueOnce(chain);
  return chain;
};

export const mockFailedPalletSearch = (supabase: any, error: string) => {
  const chain = createMockSupabaseChain(null, { message: error });
  supabase.from.mockReturnValueOnce(chain);
  return chain;
};

export const mockInventoryData = (supabase: any, inventory: any) => {
  const chain = createMockSupabaseChain(inventory);
  supabase.from.mockReturnValueOnce(chain);
  return chain;
};

export const mockBatchResult = (supabase: any, results: any[]) => {
  const chain = createMockSupabaseChain(results);
  supabase.from.mockReturnValueOnce(chain);
  return chain;
};

export const mockRPCCall = (supabase: any, result: any, error: any = null) => {
  supabase.rpc.mockResolvedValueOnce({ data: result, error });
};