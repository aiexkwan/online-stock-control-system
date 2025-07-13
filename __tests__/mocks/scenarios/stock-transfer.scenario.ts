/**
 * Stock Transfer Scenario Test Data
 * Provides complete test data sets for stock transfer workflows
 */

import {
  createMockPallet,
  createMockWarehouseLocation,
  createMockStockMovement,
  createMockUser,
  createMockProduct,
  createMockBatch,
} from '../factories';

// Define scenario types
interface StockTransferScenario {
  name: string;
  description: string;
  sourceLocation: ReturnType<typeof createMockWarehouseLocation>;
  targetLocation: ReturnType<typeof createMockWarehouseLocation>;
  pallets: Array<ReturnType<typeof createMockPallet>>;
  movements: Array<ReturnType<typeof createMockStockMovement>>;
  user: ReturnType<typeof createMockUser>;
  expectedResults: {
    totalQuantity: number;
    movementCount: number;
    sourceCapacityAfter: number;
    targetCapacityAfter: number;
  };
}

// Scenario 1: Simple single pallet transfer
export const simplePalletTransfer: StockTransferScenario = (() => {
  const user = createMockUser({ id: 'user-001', full_name: 'Test Operator' });
  const sourceLocation = createMockWarehouseLocation({
    location_code: 'A01-01',
    warehouse_zone: 'STORAGE',
    current_capacity: 1000,
    max_capacity: 2000,
  });
  const targetLocation = createMockWarehouseLocation({
    location_code: 'B02-05',
    warehouse_zone: 'PICKING',
    current_capacity: 500,
    max_capacity: 2000,
  });
  const pallet = createMockPallet({
    pallet_code: 'PLT00000001',
    location_code: sourceLocation.location_code,
    quantity: 100,
    status: 'active',
  });
  const movement = createMockStockMovement({
    pallet_code: pallet.pallet_code,
    from_location: sourceLocation.location_code,
    to_location: targetLocation.location_code,
    quantity: pallet.quantity,
    movement_type: 'transfer',
    moved_by: user.id,
  });

  return {
    name: 'Simple Pallet Transfer',
    description: 'Transfer a single pallet from storage to picking area',
    sourceLocation,
    targetLocation,
    pallets: [pallet],
    movements: [movement],
    user,
    expectedResults: {
      totalQuantity: 100,
      movementCount: 1,
      sourceCapacityAfter: 900,
      targetCapacityAfter: 600,
    },
  };
})();

// Scenario 2: Bulk transfer multiple pallets
export const bulkPalletTransfer: StockTransferScenario = (() => {
  const user = createMockUser({ id: 'user-002', full_name: 'Warehouse Manager' });
  const sourceLocation = createMockWarehouseLocation({
    location_code: 'C03-01',
    warehouse_zone: 'STORAGE',
    current_capacity: 3000,
    max_capacity: 5000,
  });
  const targetLocation = createMockWarehouseLocation({
    location_code: 'D04-10',
    warehouse_zone: 'OUTBOUND',
    current_capacity: 1000,
    max_capacity: 5000,
  });
  
  // Create 5 pallets with same product
  const productCode = 'PRD001';
  const pallets = createMockBatch(createMockPallet, 5, {
    location_code: sourceLocation.location_code,
    product_code: productCode,
    quantity: 200,
    status: 'active',
  }).map((pallet, index) => ({
    ...pallet,
    pallet_code: `PLT0000${1000 + index}`,
  }));

  const movements = pallets.map(pallet =>
    createMockStockMovement({
      pallet_code: pallet.pallet_code,
      from_location: sourceLocation.location_code,
      to_location: targetLocation.location_code,
      quantity: pallet.quantity,
      movement_type: 'transfer',
      moved_by: user.id,
    })
  );

  return {
    name: 'Bulk Pallet Transfer',
    description: 'Transfer multiple pallets of same product in one operation',
    sourceLocation,
    targetLocation,
    pallets,
    movements,
    user,
    expectedResults: {
      totalQuantity: 1000, // 5 pallets × 200 each
      movementCount: 5,
      sourceCapacityAfter: 2000,
      targetCapacityAfter: 2000,
    },
  };
})();

// Scenario 3: Partial pallet transfer
export const partialPalletTransfer: StockTransferScenario = (() => {
  const user = createMockUser({ id: 'user-003', full_name: 'Pick Operator' });
  const sourceLocation = createMockWarehouseLocation({
    location_code: 'A05-03',
    warehouse_zone: 'STORAGE',
    current_capacity: 1500,
    max_capacity: 3000,
  });
  const targetLocation = createMockWarehouseLocation({
    location_code: 'B06-02',
    warehouse_zone: 'PICKING',
    current_capacity: 800,
    max_capacity: 2000,
  });
  
  const originalPallet = createMockPallet({
    pallet_code: 'PLT00002000',
    location_code: sourceLocation.location_code,
    quantity: 500,
    status: 'active',
  });

  // Split pallet - transfer only part of quantity
  const transferQuantity = 150;
  const movement = createMockStockMovement({
    pallet_code: originalPallet.pallet_code,
    from_location: sourceLocation.location_code,
    to_location: targetLocation.location_code,
    quantity: transferQuantity,
    movement_type: 'transfer',
    moved_by: user.id,
  });

  // After partial transfer, original pallet remains with reduced quantity
  const remainingPallet = {
    ...originalPallet,
    quantity: originalPallet.quantity - transferQuantity,
  };

  const newPallet = {
    ...originalPallet,
    pallet_code: 'PLT00002001', // New pallet ID for transferred portion
    location_code: targetLocation.location_code,
    quantity: transferQuantity,
  };

  return {
    name: 'Partial Pallet Transfer',
    description: 'Transfer part of a pallet quantity, splitting into two pallets',
    sourceLocation,
    targetLocation,
    pallets: [remainingPallet, newPallet],
    movements: [movement],
    user,
    expectedResults: {
      totalQuantity: 150,
      movementCount: 1,
      sourceCapacityAfter: 1350, // 1500 - 150
      targetCapacityAfter: 950,  // 800 + 150
    },
  };
})();

// Scenario 4: Failed transfer (validation errors)
export const failedTransferScenario: StockTransferScenario = (() => {
  const user = createMockUser({ id: 'user-004', full_name: 'New Operator' });
  const sourceLocation = createMockWarehouseLocation({
    location_code: 'E07-01',
    warehouse_zone: 'STORAGE',
    current_capacity: 100,
    max_capacity: 2000,
  });
  const targetLocation = createMockWarehouseLocation({
    location_code: 'F08-05',
    warehouse_zone: 'PICKING',
    current_capacity: 1950,
    max_capacity: 2000,
    is_active: false, // Inactive location
  });
  
  const pallet = createMockPallet({
    pallet_code: 'PLT00003000',
    location_code: sourceLocation.location_code,
    quantity: 200,
    status: 'void', // Void pallet cannot be transferred
  });

  // This movement should fail validation
  const movement = createMockStockMovement({
    pallet_code: pallet.pallet_code,
    from_location: sourceLocation.location_code,
    to_location: targetLocation.location_code,
    quantity: pallet.quantity,
    movement_type: 'transfer',
    moved_by: user.id,
  });

  return {
    name: 'Failed Transfer Scenario',
    description: 'Transfer attempt that should fail due to validation errors',
    sourceLocation,
    targetLocation,
    pallets: [pallet],
    movements: [movement],
    user,
    expectedResults: {
      totalQuantity: 0, // No transfer should occur
      movementCount: 0,
      sourceCapacityAfter: 100, // Unchanged
      targetCapacityAfter: 1950, // Unchanged
    },
  };
})();

// Helper function to generate scenario data
export const generateScenarioData = (scenario: StockTransferScenario) => {
  return {
    ...scenario,
    timestamp: new Date().toISOString(),
    transactionId: `TRANS-${Date.now()}`,
  };
};

// Get all scenarios
export const allScenarios = [
  simplePalletTransfer,
  bulkPalletTransfer,
  partialPalletTransfer,
  failedTransferScenario,
];

// Scenario validation helper
export const validateScenarioExecution = (
  scenario: StockTransferScenario,
  actualResults: {
    transferredQuantity: number;
    successfulMovements: number;
    sourceCapacityAfter: number;
    targetCapacityAfter: number;
  }
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (actualResults.transferredQuantity !== scenario.expectedResults.totalQuantity) {
    errors.push(
      `Quantity mismatch: expected ${scenario.expectedResults.totalQuantity}, got ${actualResults.transferredQuantity}`
    );
  }

  if (actualResults.successfulMovements !== scenario.expectedResults.movementCount) {
    errors.push(
      `Movement count mismatch: expected ${scenario.expectedResults.movementCount}, got ${actualResults.successfulMovements}`
    );
  }

  if (actualResults.sourceCapacityAfter !== scenario.expectedResults.sourceCapacityAfter) {
    errors.push(
      `Source capacity mismatch: expected ${scenario.expectedResults.sourceCapacityAfter}, got ${actualResults.sourceCapacityAfter}`
    );
  }

  if (actualResults.targetCapacityAfter !== scenario.expectedResults.targetCapacityAfter) {
    errors.push(
      `Target capacity mismatch: expected ${scenario.expectedResults.targetCapacityAfter}, got ${actualResults.targetCapacityAfter}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default {
  simplePalletTransfer,
  bulkPalletTransfer,
  partialPalletTransfer,
  failedTransferScenario,
  allScenarios,
  generateScenarioData,
  validateScenarioExecution,
};