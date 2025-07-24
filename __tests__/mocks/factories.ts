/**
 * Test factories for creating mock data
 * Updated for Cards architecture
 */

import { Database } from '@/lib/database.types';
import { DatabaseRecord } from '@/types/database/tables';
import { AdminWidgetConfig } from '@/types/components/dashboard';
import { ListType } from '@/types/generated/graphql';
import { FormType } from '@/app/(app)/admin/components/dashboard/cards/FormCard';

type Tables = Database['public']['Tables'];
type PalletInfo = Tables['record_palletinfo']['Row'];
type SupabaseResponse<T> = {
  data: T | null;
  error: unknown | null;
  count?: number | null;
  status?: number;
  statusText?: string;
};

/**
 * Create a mock pallet object
 */
export function createMockPallet(overrides: Partial<PalletInfo> = {}): PalletInfo {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    pallet_id: 'PAL123',
    product_code: 'PROD001',
    product_name: 'Test Product',
    quantity: 100,
    warehouse: 'Warehouse A',
    location: 'A1-B2-C3',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'test-user',
    notes: null,
    batch_number: null,
    expiry_date: null,
    supplier_id: null,
    supplier_name: null,
    ...overrides,
  } as PalletInfo;
}

/**
 * Create a Supabase success response
 */
export function createSupabaseResponse<T>(data: T, options: Partial<SupabaseResponse<T>> = {}): SupabaseResponse<T> {
  return {
    data,
    error: null,
    status: 200,
    statusText: 'OK',
    ...options,
  };
}

/**
 * Create a Supabase error response
 */
export function createSupabaseError(message: string, code?: string): SupabaseResponse<null> {
  return {
    data: null,
    error: {
      message,
      code: code || 'UNKNOWN_ERROR',
      details: null,
      hint: null,
    },
    status: 400,
    statusText: 'Bad Request',
  };
}

/**
 * Create a mock supplier
 */
export function createMockSupplier(overrides: DatabaseRecord = {}) {
  return {
    id: '456e7890-e89b-12d3-a456-426614174001',
    supplier_code: 'SUP001',
    supplier_name: 'Test Supplier',
    contact_email: 'supplier@test.com',
    contact_phone: '0123456789',
    address: '123 Test Street',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock product
 */
export function createMockProduct(overrides: DatabaseRecord = {}) {
  return {
    id: '789e0123-e89b-12d3-a456-426614174002',
    product_code: 'PROD001',
    product_name: 'Test Product',
    description: 'A test product',
    unit_price: 10.99,
    stock_level: 1000,
    min_stock_level: 100,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock transaction log entry
 */
export function createMockTransactionLog(overrides: DatabaseRecord = {}) {
  return {
    id: '012e3456-e89b-12d3-a456-426614174003',
    transaction_type: 'CREATE',
    table_name: 'record_palletinfo',
    record_id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: 'test-user',
    timestamp: new Date().toISOString(),
    old_values: null,
    new_values: { status: 'active' },
    ...overrides,
  };
}

/**
 * Create a mock inventory record
 */
export function createMockInventory(overrides: DatabaseRecord = {}) {
  return {
    id: '345e6789-e89b-12d3-a456-426614174004',
    product_code: 'PROD001',
    warehouse: 'Warehouse A',
    quantity: 500,
    reserved_quantity: 50,
    available_quantity: 450,
    last_updated: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock user
 */
export function createMockUser(overrides: DatabaseRecord = {}) {
  return {
    id: '678e9012-e89b-12d3-a456-426614174005',
    email: 'test@example.com',
    username: 'testuser',
    role: 'user',
    active: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// Cards Architecture Mock Factories

/**
 * Create a mock ListCard configuration
 */
export function createMockListCardConfig(overrides: Partial<AdminWidgetConfig> = {}): AdminWidgetConfig {
  return {
    type: 'list',
    title: 'Test List Card',
    gridArea: 'list-area',
    component: 'ListCard',
    dataSource: 'ORDER_STATE',
    metrics: ['listType:OrderState', 'pageSize:10'],
    ...overrides,
  };
}

/**
 * Create a mock FormCard configuration
 */
export function createMockFormCardConfig(overrides: Partial<AdminWidgetConfig> = {}): AdminWidgetConfig {
  return {
    type: 'form',
    title: 'Test Form Card',
    gridArea: 'form-area',
    component: 'FormCard',
    ...overrides,
  };
}

/**
 * Create a mock StatsCard configuration
 */
export function createMockStatsCardConfig(overrides: Partial<AdminWidgetConfig> = {}): AdminWidgetConfig {
  return {
    type: 'stats',
    title: 'Test Stats Card',
    gridArea: 'stats-area',
    component: 'StatsCard',
    metrics: ['totalOrders', 'pendingOrders', 'completedOrders'],
    ...overrides,
  };
}

/**
 * Create a mock ChartCard configuration
 */
export function createMockChartCardConfig(overrides: Partial<AdminWidgetConfig> = {}): AdminWidgetConfig {
  return {
    type: 'chart',
    title: 'Test Chart Card',
    gridArea: 'chart-area',
    component: 'ChartCard',
    chartType: 'line',
    dataSource: 'analytics',
    ...overrides,
  };
}

/**
 * Create mock GraphQL query response for ListCard
 */
export function createMockListData(listType: ListType = ListType.OrderState) {
  const baseItems = [
    {
      id: '1',
      title: 'Test Item 1',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: '2', 
      title: 'Test Item 2',
      status: 'pending',
      created_at: new Date().toISOString(),
    },
  ];

  return {
    data: {
      getListData: {
        items: baseItems,
        metadata: {
          listType,
          totalCount: baseItems.length,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    },
  };
}

/**
 * Create mock form data for FormCard
 */
export function createMockFormData(formType: FormType = FormType.PRODUCT_EDIT) {
  return {
    formType,
    fields: [
      {
        name: 'product_code',
        type: 'TEXT',
        label: 'Product Code',
        required: true,
        value: 'PROD001',
      },
      {
        name: 'product_name',
        type: 'TEXT', 
        label: 'Product Name',
        required: true,
        value: 'Test Product',
      },
      {
        name: 'quantity',
        type: 'NUMBER',
        label: 'Quantity',
        required: true,
        value: 100,
      },
    ],
  };
}
