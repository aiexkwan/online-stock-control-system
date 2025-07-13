/**
 * Order Loading Scenario Test Data
 * Provides complete test data sets for order loading workflows
 */

import {
  createMockAcoOrder,
  createMockGRNOrder,
  createMockPallet,
  createMockProduct,
  createMockSupplier,
  createMockUser,
  createMockWarehouseLocation,
  createMockBatch,
} from '../factories';

// Define scenario types
interface OrderLoadingScenario {
  name: string;
  description: string;
  order: ReturnType<typeof createMockAcoOrder>;
  pallets: Array<ReturnType<typeof createMockPallet>>;
  loadingBay: string;
  operator: ReturnType<typeof createMockUser>;
  product: ReturnType<typeof createMockProduct>;
  expectedResults: {
    loadedQuantity: number;
    remainingQuantity: number;
    palletCount: number;
    status: string;
    completionPercentage: number;
  };
}

interface GRNReceivingScenario {
  name: string;
  description: string;
  grnOrders: Array<ReturnType<typeof createMockGRNOrder>>;
  supplier: ReturnType<typeof createMockSupplier>;
  receiver: ReturnType<typeof createMockUser>;
  targetLocation: ReturnType<typeof createMockWarehouseLocation>;
  expectedResults: {
    totalPallets: number;
    totalGrossWeight: number;
    totalNetWeight: number;
    generatedPalletNumbers: string[];
  };
}

// Scenario 1: Complete order loading
export const completeOrderLoading: OrderLoadingScenario = (() => {
  const operator = createMockUser({ 
    id: 'loader-001', 
    full_name: 'Loading Operator',
    email: 'loader@warehouse.com',
  });
  
  const product = createMockProduct({
    product_code: 'PRD-WIDGET-001',
    product_name: 'Premium Widget',
    unit: 'PCS',
  });

  const order = createMockAcoOrder({
    order_number: 'ACO20240001',
    product_code: product.product_code,
    ordered_quantity: 1000,
    loaded_quantity: 0,
    status: 'pending',
    loading_bay: 'Bay 1',
  });

  // Create exactly enough pallets to fulfill the order
  const pallets = createMockBatch(createMockPallet, 5, {
    product_code: product.product_code,
    quantity: 200,
    status: 'active',
    location_code: 'D01-01', // Outbound area
  }).map((pallet, index) => ({
    ...pallet,
    pallet_code: `PLT2024${String(index + 1).padStart(4, '0')}`,
  }));

  return {
    name: 'Complete Order Loading',
    description: 'Load all required pallets to completely fulfill an order',
    order,
    pallets,
    loadingBay: order.loading_bay,
    operator,
    product,
    expectedResults: {
      loadedQuantity: 1000,
      remainingQuantity: 0,
      palletCount: 5,
      status: 'completed',
      completionPercentage: 100,
    },
  };
})();

// Scenario 2: Partial order loading
export const partialOrderLoading: OrderLoadingScenario = (() => {
  const operator = createMockUser({ 
    id: 'loader-002', 
    full_name: 'Shift Operator',
    email: 'shift.op@warehouse.com',
  });
  
  const product = createMockProduct({
    product_code: 'PRD-GADGET-002',
    product_name: 'Standard Gadget',
    unit: 'CTN',
  });

  const order = createMockAcoOrder({
    order_number: 'ACO20240002',
    product_code: product.product_code,
    ordered_quantity: 2000,
    loaded_quantity: 0,
    status: 'pending',
    loading_bay: 'Bay 2',
  });

  // Create only partial pallets (60% of order)
  const pallets = createMockBatch(createMockPallet, 6, {
    product_code: product.product_code,
    quantity: 200,
    status: 'active',
    location_code: 'D02-05',
  }).map((pallet, index) => ({
    ...pallet,
    pallet_code: `PLT2024${String(100 + index).padStart(4, '0')}`,
  }));

  return {
    name: 'Partial Order Loading',
    description: 'Load partial quantity when insufficient stock available',
    order,
    pallets,
    loadingBay: order.loading_bay,
    operator,
    product,
    expectedResults: {
      loadedQuantity: 1200,
      remainingQuantity: 800,
      palletCount: 6,
      status: 'in_progress',
      completionPercentage: 60,
    },
  };
})();

// Scenario 3: Multi-product loading
export const multiProductLoading: OrderLoadingScenario = (() => {
  const operator = createMockUser({ 
    id: 'loader-003', 
    full_name: 'Senior Loader',
    email: 'senior.loader@warehouse.com',
  });
  
  const primaryProduct = createMockProduct({
    product_code: 'PRD-COMBO-001',
    product_name: 'Combo Pack A',
    unit: 'SET',
  });

  const order = createMockAcoOrder({
    order_number: 'ACO20240003',
    product_code: primaryProduct.product_code,
    ordered_quantity: 500,
    loaded_quantity: 100, // Already partially loaded
    status: 'in_progress',
    loading_bay: 'Bay 3',
  });

  // Mixed pallets with different quantities
  const pallets = [
    createMockPallet({
      pallet_code: 'PLT20240201',
      product_code: primaryProduct.product_code,
      quantity: 150,
      status: 'active',
      location_code: 'D03-01',
    }),
    createMockPallet({
      pallet_code: 'PLT20240202',
      product_code: primaryProduct.product_code,
      quantity: 100,
      status: 'active',
      location_code: 'D03-02',
    }),
    createMockPallet({
      pallet_code: 'PLT20240203',
      product_code: primaryProduct.product_code,
      quantity: 150,
      status: 'active',
      location_code: 'D03-03',
    }),
  ];

  return {
    name: 'Multi-Product Loading',
    description: 'Continue loading a partially completed order',
    order,
    pallets,
    loadingBay: order.loading_bay,
    operator,
    product: primaryProduct,
    expectedResults: {
      loadedQuantity: 400, // Additional loaded
      remainingQuantity: 0,
      palletCount: 3,
      status: 'completed',
      completionPercentage: 100,
    },
  };
})();

// Scenario 4: GRN Receiving - Simple
export const simpleGRNReceiving: GRNReceivingScenario = (() => {
  const supplier = createMockSupplier({
    supplier_code: 'SUP0001',
    supplier_name: 'Premium Supplies Ltd',
  });

  const receiver = createMockUser({
    id: 'receiver-001',
    full_name: 'Receiving Clerk',
    email: 'receiving@warehouse.com',
  });

  const targetLocation = createMockWarehouseLocation({
    location_code: 'A01-01',
    warehouse_zone: 'INBOUND',
    current_capacity: 0,
    max_capacity: 5000,
  });

  const grnOrders = [
    createMockGRNOrder({
      grn_ref: 50001,
      sup_code: supplier.supplier_code,
      material_code: 'MAT-001-A',
      gross_weight: 1200,
      net_weight: 1000,
      pallet_count: 2.0,
      package_count: 20.0,
    }),
  ];

  return {
    name: 'Simple GRN Receiving',
    description: 'Receive a single GRN with standard pallets',
    grnOrders,
    supplier,
    receiver,
    targetLocation,
    expectedResults: {
      totalPallets: 2,
      totalGrossWeight: 1200,
      totalNetWeight: 1000,
      generatedPalletNumbers: ['PLT00000001', 'PLT00000002'],
    },
  };
})();

// Scenario 5: GRN Receiving - Complex
export const complexGRNReceiving: GRNReceivingScenario = (() => {
  const supplier = createMockSupplier({
    supplier_code: 'SUP0002',
    supplier_name: 'Global Materials Corp',
  });

  const receiver = createMockUser({
    id: 'receiver-002',
    full_name: 'Senior Receiver',
    email: 'sr.receiving@warehouse.com',
  });

  const targetLocation = createMockWarehouseLocation({
    location_code: 'A02-01',
    warehouse_zone: 'INBOUND',
    current_capacity: 500,
    max_capacity: 10000,
  });

  const grnOrders = [
    createMockGRNOrder({
      grn_ref: 50002,
      sup_code: supplier.supplier_code,
      material_code: 'MAT-002-A',
      gross_weight: 2500,
      net_weight: 2200,
      pallet_count: 3.5,
      package_count: 35.0,
    }),
    createMockGRNOrder({
      grn_ref: 50003,
      sup_code: supplier.supplier_code,
      material_code: 'MAT-002-B',
      gross_weight: 1800,
      net_weight: 1600,
      pallet_count: 2.5,
      package_count: 25.0,
    }),
    createMockGRNOrder({
      grn_ref: 50004,
      sup_code: supplier.supplier_code,
      material_code: 'MAT-002-C',
      gross_weight: 3200,
      net_weight: 3000,
      pallet_count: 4.0,
      package_count: 40.0,
    }),
  ];

  return {
    name: 'Complex GRN Receiving',
    description: 'Receive multiple GRNs with fractional pallet counts',
    grnOrders,
    supplier,
    receiver,
    targetLocation,
    expectedResults: {
      totalPallets: 10, // 3.5 + 2.5 + 4.0 rounded appropriately
      totalGrossWeight: 7500,
      totalNetWeight: 6800,
      generatedPalletNumbers: [
        'PLT00000003', 'PLT00000004', 'PLT00000005', 'PLT00000006',
        'PLT00000007', 'PLT00000008', 'PLT00000009', 'PLT00000010',
        'PLT00000011', 'PLT00000012',
      ],
    },
  };
})();

// Helper functions for order loading
export const calculateLoadingProgress = (
  order: ReturnType<typeof createMockAcoOrder>,
  loadedQuantity: number
) => {
  const totalLoaded = order.loaded_quantity + loadedQuantity;
  const percentage = Math.round((totalLoaded / order.ordered_quantity) * 100);
  const status = percentage >= 100 ? 'completed' : 'in_progress';
  
  return {
    totalLoaded,
    remaining: Math.max(0, order.ordered_quantity - totalLoaded),
    percentage: Math.min(100, percentage),
    status,
  };
};

// Helper function for GRN processing
export const processGRNReceiving = (scenario: GRNReceivingScenario) => {
  const palletNumbers: string[] = [];
  let palletCounter = scenario.expectedResults.generatedPalletNumbers[0]
    ? parseInt(scenario.expectedResults.generatedPalletNumbers[0].replace('PLT', ''))
    : 1;

  scenario.grnOrders.forEach(grn => {
    const palletCount = Math.ceil(grn.pallet_count);
    for (let i = 0; i < palletCount; i++) {
      palletNumbers.push(`PLT${String(palletCounter++).padStart(8, '0')}`);
    }
  });

  return {
    generatedPallets: palletNumbers,
    totalWeight: {
      gross: scenario.grnOrders.reduce((sum, grn) => sum + grn.gross_weight, 0),
      net: scenario.grnOrders.reduce((sum, grn) => sum + grn.net_weight, 0),
    },
    timestamp: new Date().toISOString(),
  };
};

// Validation helper for order loading
export const validateOrderLoading = (
  scenario: OrderLoadingScenario,
  actualResults: {
    loadedQuantity: number;
    status: string;
    palletCount: number;
  }
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (actualResults.loadedQuantity !== scenario.expectedResults.loadedQuantity) {
    errors.push(
      `Loaded quantity mismatch: expected ${scenario.expectedResults.loadedQuantity}, got ${actualResults.loadedQuantity}`
    );
  }

  if (actualResults.status !== scenario.expectedResults.status) {
    errors.push(
      `Status mismatch: expected ${scenario.expectedResults.status}, got ${actualResults.status}`
    );
  }

  if (actualResults.palletCount !== scenario.expectedResults.palletCount) {
    errors.push(
      `Pallet count mismatch: expected ${scenario.expectedResults.palletCount}, got ${actualResults.palletCount}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Get all scenarios
export const allOrderLoadingScenarios = [
  completeOrderLoading,
  partialOrderLoading,
  multiProductLoading,
];

export const allGRNReceivingScenarios = [
  simpleGRNReceiving,
  complexGRNReceiving,
];

export default {
  // Order Loading
  completeOrderLoading,
  partialOrderLoading,
  multiProductLoading,
  allOrderLoadingScenarios,
  calculateLoadingProgress,
  validateOrderLoading,
  
  // GRN Receiving
  simpleGRNReceiving,
  complexGRNReceiving,
  allGRNReceivingScenarios,
  processGRNReceiving,
};