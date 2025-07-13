/**
 * Supabase MSW Handlers
 * Comprehensive mock handlers for Supabase API endpoints
 */

import { http, HttpResponse } from 'msw';
import { rpcMocks } from './supabase-rpc-mocks';
import { createMockPallet, createMockProduct, createMockUser } from './factories';

// Get Supabase URL from environment or use default
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bbmkuiplnzvpudszrend.supabase.co';

/**
 * Helper to create Supabase REST response
 */
const supabaseResponse = (data: any, options?: { count?: number; status?: number }) => {
  const response = HttpResponse.json(data, {
    status: options?.status || 200,
    headers: options?.count ? {
      'content-range': `0-${data.length - 1}/${options.count}`,
      'x-total-count': String(options.count),
    } : undefined,
  });
  return response;
};

/**
 * Helper to create Supabase error response
 */
const supabaseError = (message: string, code: string = 'PGRST000', status: number = 400) => {
  return HttpResponse.json(
    {
      message,
      code,
      details: null,
      hint: null,
    },
    { status }
  );
};

/**
 * Supabase RPC handlers
 */
export const supabaseRPCHandlers = [
  // Generic RPC handler that uses the mock registry
  http.post(`${SUPABASE_URL}/rest/v1/rpc/:functionName`, async ({ params, request }) => {
    const functionName = params.functionName as string;
    const body = await request.json();
    
    // Check if function exists in mock registry
    const mockFn = rpcMocks[functionName as keyof typeof rpcMocks];
    if (!mockFn) {
      return supabaseError(`function ${functionName} does not exist`, 'PGRST202', 404);
    }
    
    // Execute mock function
    try {
      const result = await mockFn(body);
      if (result.error) {
        return supabaseError(result.error.message, result.error.code);
      }
      return supabaseResponse(result.data);
    } catch (error) {
      return supabaseError('Internal server error', 'PGRST500', 500);
    }
  }),
];

/**
 * Supabase REST API handlers for tables
 */
export const supabaseTableHandlers = [
  // record_palletinfo
  http.get(`${SUPABASE_URL}/rest/v1/record_palletinfo`, ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || '10';
    const pallets = Array.from({ length: parseInt(limit) }, () => createMockPallet());
    
    return supabaseResponse(pallets, { count: 100 });
  }),

  http.post(`${SUPABASE_URL}/rest/v1/record_palletinfo`, async ({ request }) => {
    const data = await request.json();
    const pallets = Array.isArray(data) ? data : [data];
    return supabaseResponse(pallets.map(p => ({ ...createMockPallet(), ...p })));
  }),

  // record_inventory
  http.get(`${SUPABASE_URL}/rest/v1/record_inventory`, ({ request }) => {
    const url = new URL(request.url);
    const productCode = url.searchParams.get('product_code');
    
    const inventory = [
      {
        product_code: productCode || 'PROD-001',
        await: 100,
        qc: 200,
        warehouse: 500,
        production: 300,
        other_locations: 100,
        total_quantity: 1200,
        last_updated: new Date().toISOString(),
      },
    ];
    
    return supabaseResponse(inventory);
  }),

  // record_history
  http.get(`${SUPABASE_URL}/rest/v1/record_history`, ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || '50';
    
    const history = Array.from({ length: parseInt(limit) }, (_, i) => ({
      uuid: `hist-${i}`,
      time: new Date(Date.now() - i * 60000).toISOString(),
      id: 100 + i,
      action: ['move', 'create', 'void', 'update'][i % 4],
      plt_num: `PLT-${String(i + 1).padStart(3, '0')}`,
      loc: ['A1-01', 'B2-02', 'C3-03'][i % 3],
      remark: `Test action ${i + 1}`,
    }));
    
    return supabaseResponse(history, { count: 1000 });
  }),

  // record_transfer
  http.get(`${SUPABASE_URL}/rest/v1/record_transfer`, ({ request }) => {
    const transfers = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      plt_num: `PLT-${String(i + 1).padStart(3, '0')}`,
      product_code: `PROD-${String(i % 5 + 1).padStart(3, '0')}`,
      product_qty: 100,
      from_location: 'A1-01',
      to_location: 'B2-02',
      operator_id: 1,
      tran_date: new Date().toISOString(),
      status: 'completed',
    }));
    
    return supabaseResponse(transfers);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/record_transfer`, async ({ request }) => {
    const data = await request.json() as any;
    return supabaseResponse({ id: Date.now(), ...data, status: 'completed' });
  }),

  // data_code (products)
  http.get(`${SUPABASE_URL}/rest/v1/data_code`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('code');
    
    const products = Array.from({ length: 20 }, (_, i) => ({
      code: `PROD-${String(i + 1).padStart(3, '0')}`,
      description: `Product ${i + 1}`,
      colour: ['Red', 'Blue', 'Green', 'Yellow'][i % 4],
      standard_qty: 100,
      type: ['Injection', 'Assembly', 'Packaging'][i % 3],
      remark: `Test product ${i + 1}`,
    }));
    
    if (search) {
      const filtered = products.filter(p => p.code.includes(search));
      return supabaseResponse(filtered);
    }
    
    return supabaseResponse(products);
  }),

  // data_supplier
  http.get(`${SUPABASE_URL}/rest/v1/data_supplier`, ({ request }) => {
    const suppliers = Array.from({ length: 10 }, (_, i) => ({
      supplier_code: `SUP-${String(i + 1).padStart(3, '0')}`,
      supplier_name: `Supplier ${i + 1} Ltd`,
      contact_person: `Contact ${i + 1}`,
      contact_number: `+852 ${String(20000000 + i).slice(0, 8)}`,
      email: `supplier${i + 1}@example.com`,
    }));
    
    return supabaseResponse(suppliers);
  }),

  // data_id (users)
  http.get(`${SUPABASE_URL}/rest/v1/data_id`, ({ request }) => {
    const users = Array.from({ length: 5 }, (_, i) => createMockUser());
    return supabaseResponse(users);
  }),

  // record_grn
  http.get(`${SUPABASE_URL}/rest/v1/record_grn`, ({ request }) => {
    const grns = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      grn_number: `GRN-${String(1000 + i).padStart(6, '0')}`,
      material_code: `MAT-${String(i + 1).padStart(3, '0')}`,
      supplier_code: `SUP-${String(i % 5 + 1).padStart(3, '0')}`,
      quantity: 1000 + i * 100,
      receive_date: new Date().toISOString(),
      status: 'received',
    }));
    
    return supabaseResponse(grns);
  }),

  // record_aco
  http.get(`${SUPABASE_URL}/rest/v1/record_aco`, ({ request }) => {
    const orders = Array.from({ length: 10 }, (_, i) => ({
      order_ref: 1000 + i,
      product_code: `PROD-${String(i % 5 + 1).padStart(3, '0')}`,
      ordered_quantity: 1000,
      completed_quantity: i * 100,
      order_date: new Date().toISOString(),
      status: i < 5 ? 'in_progress' : 'completed',
    }));
    
    return supabaseResponse(orders);
  }),

  // stock_level
  http.get(`${SUPABASE_URL}/rest/v1/stock_level`, ({ request }) => {
    const stockLevels = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      code: `PROD-${String(i + 1).padStart(3, '0')}`,
      description: `Product ${i + 1}`,
      quantity: 1000 + i * 100,
      update_time: new Date().toISOString(),
    }));
    
    return supabaseResponse(stockLevels);
  }),

  // work_level
  http.get(`${SUPABASE_URL}/rest/v1/work_level`, ({ request }) => {
    const workLevels = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      date: new Date().toISOString().split('T')[0],
      qc: 50 + i * 10,
      move: 30 + i * 5,
      grn: 20 + i * 3,
    }));
    
    return supabaseResponse(workLevels);
  }),

  // grn_level
  http.get(`${SUPABASE_URL}/rest/v1/grn_level`, ({ request }) => {
    const grnLevels = Array.from({ length: 10 }, (_, i) => ({
      grn_ref: `GRN-${String(1000 + i).padStart(6, '0')}`,
      date: new Date().toISOString().split('T')[0],
      qty_mode_count: 50 + i * 5,
      weight_mode_count: 30 + i * 3,
      total_weight: 1000 + i * 100,
    }));
    
    return supabaseResponse(grnLevels);
  }),
];

/**
 * Supabase Auth handlers
 */
export const supabaseAuthHandlers = [
  // Sign in
  http.post(`${SUPABASE_URL}/auth/v1/token`, async ({ request }) => {
    const body = await request.json() as any;
    
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'test-user-id',
        email: body?.email || 'test@example.com',
        user_metadata: {
          name: 'Test User',
        },
      },
    });
  }),

  // Get user
  http.get(`${SUPABASE_URL}/auth/v1/user`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.includes('Bearer')) {
      return HttpResponse.json(
        { message: 'No authorization header' },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
      },
    });
  }),

  // Sign out
  http.post(`${SUPABASE_URL}/auth/v1/logout`, () => {
    return HttpResponse.json({});
  }),
];

/**
 * Supabase Realtime handlers
 */
export const supabaseRealtimeHandlers = [
  // WebSocket upgrade request
  http.get(`${SUPABASE_URL}/realtime/v1/websocket`, () => {
    return new HttpResponse(null, {
      status: 101,
      statusText: 'Switching Protocols',
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
      },
    });
  }),
];

/**
 * Supabase Storage handlers
 */
export const supabaseStorageHandlers = [
  // Upload file
  http.post(`${SUPABASE_URL}/storage/v1/object/:bucket/*`, async ({ params, request }) => {
    const bucket = params.bucket;
    const path = params['0']; // Wildcard path
    
    return HttpResponse.json({
      Key: `${bucket}/${path}`,
      Id: `file-${Date.now()}`,
    });
  }),

  // Get public URL
  http.get(`${SUPABASE_URL}/storage/v1/object/public/:bucket/*`, ({ params }) => {
    const bucket = params.bucket;
    const path = params['0'];
    
    // Return a mock file
    return new HttpResponse(new Blob(['Mock file content']), {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
  }),

  // List files
  http.get(`${SUPABASE_URL}/storage/v1/object/list/:bucket`, ({ params }) => {
    return HttpResponse.json([
      {
        name: 'test-file-1.pdf',
        id: 'file-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { size: 1024 },
      },
      {
        name: 'test-file-2.pdf',
        id: 'file-2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { size: 2048 },
      },
    ]);
  }),
];

/**
 * Combine all Supabase handlers
 */
export const allSupabaseHandlers = [
  ...supabaseRPCHandlers,
  ...supabaseTableHandlers,
  ...supabaseAuthHandlers,
  ...supabaseRealtimeHandlers,
  ...supabaseStorageHandlers,
];

/**
 * Error scenario handlers for testing error cases
 */
export const supabaseErrorHandlers = [
  // Database connection error
  http.get(`${SUPABASE_URL}/rest/v1/*`, () => {
    return supabaseError('Database connection failed', 'PGRST503', 503);
  }),

  // Authentication error
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json(
      { message: 'Invalid login credentials' },
      { status: 400 }
    );
  }),

  // RPC function error
  http.post(`${SUPABASE_URL}/rest/v1/rpc/*`, () => {
    return supabaseError('Function execution failed', 'PGRST204', 500);
  }),
];

// All handlers are already exported above individually