/**
 * Test Factories for Mock Data Generation
 */

export function createSupabaseResponse<T>(data: T, count?: number) {
  return {
    data,
    error: null,
    count: count ?? null,
    status: 200,
    statusText: 'OK'
  };
}

export function createSupabaseError(message: string, code?: string) {
  return {
    data: null,
    error: {
      message,
      details: null,
      hint: null,
      code: code || 'UNKNOWN_ERROR'
    },
    count: null,
    status: 400,
    statusText: 'Bad Request'
  };
}

export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides
  };
}

export function createMockPallet(overrides = {}) {
  return {
    id: 'test-pallet-id',
    pallet_number: 'TEST-PALLET-001',
    product_code: 'PROD-001',
    quantity: 100,
    location: 'A1-B2',
    status: 'active',
    created_at: new Date().toISOString(),
    ...overrides
  };
}

export function createMockTransaction(overrides = {}) {
  return {
    id: 'test-transaction-id',
    source: 'manual',
    operation: 'create',
    status: 'pending',
    created_at: new Date().toISOString(),
    ...overrides
  };
}