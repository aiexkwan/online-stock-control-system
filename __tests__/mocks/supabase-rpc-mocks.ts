/**
 * Supabase RPC Mock System
 * Comprehensive mock implementations for all RPC functions
 * Generated based on database RPC function analysis
 */

import { createMockPallet, createMockProduct, createMockUser } from './factories';

// Types for RPC function responses
type RPCResponse<T = any> = {
  data: T | null;
  error: any | null;
};

// Helper to create successful RPC response
const success = <T>(data: T): RPCResponse<T> => ({
  data,
  error: null,
});

// Helper to create error RPC response
const error = (message: string, code?: string): RPCResponse => ({
  data: null,
  error: { message, code: code || 'RPC_ERROR' },
});

/**
 * RPC Mock Registry
 * Maps RPC function names to their mock implementations
 */
export const rpcMocks = {
  // ===========================================
  // Pallet Management Functions
  // ===========================================
  
  generate_atomic_pallet_numbers_v6: jest.fn((params: { p_count: number; p_session_id?: string }) => {
    const pallets = Array.from({ length: params.p_count }, (_, i) => ({
      pallet_number: `${new Date().toISOString().slice(2, 10).replace(/-/g, '')}/${i + 1}`,
      series: `${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${String(i + 1).padStart(6, '0')}`,
    }));
    return success(pallets);
  }),

  search_pallet_info: jest.fn((params: { p_search_type: string; p_search_value: string }) => {
    return success({
      pallets: [createMockPallet()],
      total_count: 1,
    });
  }),

  search_pallet_optimized: jest.fn((params: { p_search_type: string; p_search_value: string }) => {
    return success([
      {
        plt_num: 'PLT-001',
        product_code: 'PROD-001',
        product_qty: 100,
        plt_remark: 'Test pallet',
        series: 'SER-001',
        current_location: 'A1-01',
        last_update: new Date().toISOString(),
      },
    ]);
  }),

  batch_search_pallets: jest.fn((params: { p_patterns: string[] }) => {
    return success(params.p_patterns.map(pattern => createMockPallet()));
  }),

  process_qc_label_unified: jest.fn((params: any) => {
    return success({
      success: true,
      data: {
        pallets: Array.from({ length: params.p_count }, () => createMockPallet()),
        statistics: {
          total_generated: params.p_count,
          product_code: params.p_product_code,
          total_quantity: params.p_product_qty * params.p_count,
        },
      },
      workflow_result: {
        inventory_updated: true,
        work_level_updated: true,
        history_recorded: true,
      },
    });
  }),

  process_grn_label_unified: jest.fn((params: any) => {
    return success({
      success: true,
      data: {
        pallets: Array.from({ length: params.p_count }, () => ({
          ...createMockPallet(),
          grn_number: params.p_grn_number,
          supplier_code: params.p_supplier_code,
        })),
      },
      statistics: {
        total_generated: params.p_count,
        grn_number: params.p_grn_number,
      },
      workflow_result: {
        grn_level_updated: true,
        stock_level_updated: true,
        work_level_updated: true,
      },
    });
  }),

  // ===========================================
  // Inventory Management Functions
  // ===========================================

  rpc_search_inventory_with_chart: jest.fn((params: { p_product_code: string; p_include_chart?: boolean }) => {
    return success({
      inventory: {
        product_code: params.p_product_code,
        total_quantity: 1000,
        locations: {
          await: 100,
          qc: 200,
          warehouse: 500,
          other: 200,
        },
      },
      chart_data: params.p_include_chart ? {
        labels: ['7 days ago', '6 days ago', '5 days ago', '4 days ago', '3 days ago', '2 days ago', 'Today'],
        values: [800, 850, 900, 950, 980, 990, 1000],
      } : null,
    });
  }),

  update_stock_level: jest.fn((params: { p_product_code: string; p_quantity: number; p_description?: string }) => {
    return success(true);
  }),

  execute_stock_transfer: jest.fn((params: any) => {
    return success({
      success: true,
      transfer_id: `TRANS-${Date.now()}`,
      from_location: params.p_from_location,
      to_location: params.p_to_location,
      quantity: params.p_product_qty,
    });
  }),

  rpc_get_stock_distribution: jest.fn((params: { p_stock_type?: string }) => {
    return success({
      distribution: [
        { location: 'Warehouse', quantity: 5000, percentage: 50 },
        { location: 'QC', quantity: 2000, percentage: 20 },
        { location: 'Await', quantity: 1500, percentage: 15 },
        { location: 'Production', quantity: 1500, percentage: 15 },
      ],
      total_quantity: 10000,
    });
  }),

  // ===========================================
  // Order Management Functions
  // ===========================================

  get_aco_order_details: jest.fn((params: { p_product_code: string; p_order_ref?: string }) => {
    return success({
      available_orders: [
        {
          order_ref: 'ORD-001',
          product_code: params.p_product_code,
          ordered_quantity: 1000,
          completed_quantity: 500,
          remaining_quantity: 500,
        },
      ],
      order_details: params.p_order_ref ? {
        order_ref: params.p_order_ref,
        product_code: params.p_product_code,
        status: 'in_progress',
      } : null,
    });
  }),

  check_aco_order_completion: jest.fn((params: { p_order_ref: number }) => {
    return success({
      order_ref: params.p_order_ref,
      is_complete: false,
      completion_percentage: 75,
      remaining_quantity: 250,
    });
  }),

  rpc_load_pallet_to_order: jest.fn((params: any) => {
    return success({
      success: true,
      order_ref: params.p_order_ref,
      pallet_loaded: params.p_pallet_input,
      updated_quantity: 100,
    });
  }),

  rpc_get_aco_order_report: jest.fn((params: { p_order_ref: number }) => {
    return success({
      order_ref: params.p_order_ref,
      items: [],
      summary: {
        total_pallets: 10,
        total_quantity: 1000,
        completion_rate: 0.75,
      },
    });
  }),

  // ===========================================
  // Transaction Management Functions
  // ===========================================

  start_transaction: jest.fn((params: any) => {
    const transactionId = params.p_transaction_id || `trans-${Date.now()}`;
    return success(transactionId);
  }),

  complete_transaction: jest.fn((params: { p_transaction_id: string }) => {
    return success(null);
  }),

  record_transaction_step: jest.fn((params: any) => {
    return success(null);
  }),

  rollback_transaction: jest.fn((params: { p_transaction_id: string; p_rollback_reason: string }) => {
    return success({
      success: true,
      transaction_id: params.p_transaction_id,
      rollback_reason: params.p_rollback_reason,
      affected_records: 0,
    });
  }),

  // ===========================================
  // Dashboard & Reporting Functions
  // ===========================================

  rpc_get_history_tree: jest.fn((params: { p_limit?: number; p_offset?: number }) => {
    return success({
      events: [],
      total_count: 0,
      has_more: false,
    });
  }),

  rpc_get_production_stats: jest.fn((params: any) => {
    return success(params.p_metric === 'pallet_count' ? 100 : 10000);
  }),

  rpc_get_staff_workload: jest.fn((params: any) => {
    return success([
      {
        work_date: new Date().toISOString().split('T')[0],
        staff_name: 'Test User',
        action_count: 50,
      },
    ]);
  }),

  rpc_get_warehouse_work_level: jest.fn((params: any) => {
    return success({
      daily_stats: [],
      operator_stats: [],
      peak_hours: [],
      summary: {
        total_moves: 1000,
        average_per_day: 100,
        peak_day: 'Monday',
      },
    });
  }),

  // ===========================================
  // Utility Functions
  // ===========================================

  search_product_code: jest.fn((params: { p_code: string }) => {
    return success({
      code: params.p_code,
      description: 'Test Product',
      standard_qty: '100',
      type: 'Injection',
    });
  }),

  search_supplier_code: jest.fn((params: { p_code: string }) => {
    return success({
      supplier_code: params.p_code,
      supplier_name: 'Test Supplier Ltd',
    });
  }),

  execute_sql_query: jest.fn((params: { query_text: string }) => {
    // Mock safe SQL execution
    return success({
      rows: [],
      row_count: 0,
      execution_time: 10,
    });
  }),

  // ===========================================
  // Buffer & Maintenance Functions
  // ===========================================

  reset_daily_pallet_buffer: jest.fn(() => {
    return success(null);
  }),

  refresh_pallet_location_mv: jest.fn(() => {
    return success(null);
  }),

  check_pallet_buffer_health: jest.fn(() => {
    return success({
      total_count: 300,
      available_count: 250,
      used_count: 50,
      health_status: 'healthy',
    });
  }),

  // ===========================================
  // Work Level Functions
  // ===========================================

  update_work_level_qc: jest.fn((params: { p_user_id: number; p_pallet_count: number }) => {
    return success({
      success: true,
      user_id: params.p_user_id,
      updated_count: params.p_pallet_count,
    });
  }),

  update_work_level_move: jest.fn((params: { p_user_id: number; p_move_count?: number }) => {
    return success('Work level updated successfully');
  }),

  update_grn_workflow: jest.fn((params: any) => {
    return success({
      grn_level_updated: true,
      work_level_updated: true,
      stock_level_updated: true,
    });
  }),
};

/**
 * Create a mock RPC function that uses the registry
 */
export const createMockRPC = () => {
  return jest.fn((functionName: string, params: any = {}) => {
    const mockFn = rpcMocks[functionName as keyof typeof rpcMocks];
    
    if (!mockFn) {
      console.warn(`RPC function '${functionName}' not found in mock registry`);
      return error(`Unknown RPC function: ${functionName}`);
    }
    
    return mockFn(params);
  });
};

/**
 * Setup RPC mocks for a test suite
 */
export const setupRPCMocks = (customMocks: Partial<typeof rpcMocks> = {}) => {
  // Merge custom mocks with default mocks
  Object.assign(rpcMocks, customMocks);
  
  // Return cleanup function
  return () => {
    // Reset all mocks
    Object.values(rpcMocks).forEach(mock => {
      if (mock && typeof mock.mockReset === 'function') {
        mock.mockReset();
      }
    });
  };
};

/**
 * Helper to mock specific RPC responses for testing
 */
export const mockRPCResponse = (functionName: string, response: any) => {
  const mockFn = rpcMocks[functionName as keyof typeof rpcMocks];
  if (mockFn) {
    mockFn.mockReturnValueOnce(response);
  }
};

/**
 * Helper to mock RPC errors for testing
 */
export const mockRPCError = (functionName: string, errorMessage: string) => {
  const mockFn = rpcMocks[functionName as keyof typeof rpcMocks];
  if (mockFn) {
    mockFn.mockReturnValueOnce(error(errorMessage));
  }
};

// Export individual mock functions for direct use
export const {
  generate_atomic_pallet_numbers_v6,
  search_pallet_info,
  process_qc_label_unified,
  process_grn_label_unified,
  rpc_search_inventory_with_chart,
  execute_stock_transfer,
  get_aco_order_details,
  rpc_get_warehouse_work_level,
} = rpcMocks;