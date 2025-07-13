// Mock factories for testing

import { faker } from '@faker-js/faker';

// User factory
export const createMockUser = (overrides?: Partial<any>) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  full_name: faker.person.fullName(),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

// Product factory
export const createMockProduct = (overrides?: Partial<any>) => ({
  id: faker.string.uuid(),
  product_code: faker.string.alphanumeric(8).toUpperCase(),
  product_name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  unit: 'PCS',
  category: faker.commerce.department(),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

// Pallet factory
export const createMockPallet = (overrides?: Partial<any>) => ({
  id: faker.string.uuid(),
  pallet_code: `PLT${faker.string.numeric(8)}`,
  product_code: faker.string.alphanumeric(8).toUpperCase(),
  quantity: faker.number.int({ min: 1, max: 1000 }),
  location_code: `A${faker.string.numeric(2)}-${faker.string.numeric(2)}`,
  status: faker.helpers.arrayElement(['active', 'void', 'reserved']),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

// Stock movement factory
export const createMockStockMovement = (overrides?: Partial<any>) => ({
  id: faker.string.uuid(),
  pallet_code: `PLT${faker.string.numeric(8)}`,
  from_location: `A${faker.string.numeric(2)}-${faker.string.numeric(2)}`,
  to_location: `B${faker.string.numeric(2)}-${faker.string.numeric(2)}`,
  quantity: faker.number.int({ min: 1, max: 1000 }),
  movement_type: faker.helpers.arrayElement(['transfer', 'adjustment', 'return']),
  moved_by: faker.string.uuid(),
  created_at: faker.date.recent().toISOString(),
  ...overrides,
});

// ACO Order factory
export const createMockAcoOrder = (overrides?: Partial<any>) => ({
  id: faker.string.uuid(),
  order_number: `ACO${faker.string.numeric(8)}`,
  product_code: faker.string.alphanumeric(8).toUpperCase(),
  ordered_quantity: faker.number.int({ min: 10, max: 5000 }),
  loaded_quantity: faker.number.int({ min: 0, max: 5000 }),
  status: faker.helpers.arrayElement(['pending', 'in_progress', 'completed', 'cancelled']),
  loading_bay: faker.helpers.arrayElement(['Bay 1', 'Bay 2', 'Bay 3', 'Bay 4']),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

// Transaction log factory
export const createMockTransactionLog = (overrides?: Partial<any>) => ({
  id: faker.string.uuid(),
  table_name: faker.helpers.arrayElement(['pallets', 'stock_movements', 'aco_orders']),
  operation: faker.helpers.arrayElement(['INSERT', 'UPDATE', 'DELETE']),
  record_id: faker.string.uuid(),
  old_data: {},
  new_data: {},
  user_id: faker.string.uuid(),
  created_at: faker.date.recent().toISOString(),
  ...overrides,
});

// Batch factory utilities
export const createMockBatch = <T>(
  factory: (overrides?: Partial<T>) => T,
  count: number,
  overrides?: Partial<T>
): T[] => {
  return Array.from({ length: count }, () => factory(overrides));
};

// Supabase response factory
export const createSupabaseResponse = <T>(
  data: T | T[] | null,
  error: any = null,
  count?: number
) => ({
  data,
  error,
  count,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK',
});

// GRN (Goods Receipt Note) factory
export const createMockGRNOrder = (overrides?: Partial<any>) => {
  const grossWeight = faker.number.int({ min: 100, max: 5000 });
  const netWeight = faker.number.int({ min: 80, max: Math.min(4500, grossWeight) });
  
  return {
    grn_ref: faker.number.int({ min: 10000, max: 99999 }),
    plt_num: `PLT${faker.string.numeric(8)}`,
    sup_code: `SUP${faker.string.numeric(4)}`,
    material_code: faker.string.alphanumeric(10).toUpperCase(),
    gross_weight: grossWeight,
    net_weight: netWeight,
    uuid: faker.string.uuid(),
    pallet: `P${faker.string.numeric(3)}`,
    package: `PKG${faker.string.numeric(5)}`,
    pallet_count: faker.number.float({ min: 0.5, max: 10, fractionDigits: 1 }),
    package_count: faker.number.float({ min: 1, max: 100, fractionDigits: 1 }),
    creat_time: faker.date.recent().toISOString(),
    ...overrides,
  };
};

// Supplier factory
export const createMockSupplier = (overrides?: Partial<any>) => ({
  supplier_code: `SUP${faker.string.numeric(4)}`,
  supplier_name: faker.company.name(),
  ...overrides,
});

// Warehouse Location factory
export const createMockWarehouseLocation = (overrides?: Partial<any>) => {
  const maxCapacity = faker.number.int({ min: 100, max: 5000 });
  const currentCapacity = faker.number.int({ min: 0, max: maxCapacity });
  
  return {
    location_code: `${faker.helpers.arrayElement(['A', 'B', 'C', 'D'])}${faker.string.numeric(2)}-${faker.string.numeric(2)}`,
    warehouse_zone: faker.helpers.arrayElement(['INBOUND', 'STORAGE', 'PICKING', 'OUTBOUND']),
    location_type: faker.helpers.arrayElement(['FLOOR', 'RACK', 'SHELF', 'BIN']),
    max_capacity: maxCapacity,
    current_capacity: currentCapacity,
    is_active: faker.datatype.boolean(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
};

// Mock Supabase error
export const createSupabaseError = (message: string, code?: string) => ({
  message,
  code: code || 'PGRST116',
  details: null,
  hint: null,
});