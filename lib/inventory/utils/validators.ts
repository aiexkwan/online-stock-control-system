/**
 * Common validation functions for inventory operations
 */

import { StockTransferDto, VoidPalletDto, InventoryAdjustmentDto } from '../types';
import { LocationMapper } from './locationMapper';

/**
 * Validate stock transfer request
 */
export function validateStockTransfer(transfer: StockTransferDto): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!transfer.palletNum?.trim()) {
    errors.push('Pallet number is required');
  }

  if (!transfer.productCode?.trim()) {
    errors.push('Product code is required');
  }

  if (!transfer.quantity || transfer.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  if (!transfer.fromLocation?.trim()) {
    errors.push('From location is required');
  }

  if (!transfer.toLocation?.trim()) {
    errors.push('To location is required');
  }

  // Location validation
  if (transfer.fromLocation && !LocationMapper.isValidLocation(transfer.fromLocation)) {
    errors.push(`Invalid from location: ${transfer.fromLocation}`);
  }

  if (transfer.toLocation && !LocationMapper.isValidLocation(transfer.toLocation)) {
    errors.push(`Invalid to location: ${transfer.toLocation}`);
  }

  // Same location check
  if (transfer.fromLocation && transfer.toLocation) {
    const fromDb = LocationMapper.toDbColumn(transfer.fromLocation);
    const toDb = LocationMapper.toDbColumn(transfer.toLocation);
    if (fromDb === toDb) {
      errors.push('Cannot transfer to the same location');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate void pallet request
 */
export function validateVoidPallet(data: VoidPalletDto): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.palletNum?.trim()) {
    errors.push('Pallet number is required');
  }

  if (!data.reason?.trim()) {
    errors.push('Void reason is required');
  }

  if (data.location && !LocationMapper.isValidLocation(data.location)) {
    errors.push(`Invalid location: ${data.location}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate inventory adjustment request
 */
export function validateInventoryAdjustment(adjustment: InventoryAdjustmentDto): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!adjustment.palletNum?.trim()) {
    errors.push('Pallet number is required');
  }

  if (!adjustment.adjustmentType) {
    errors.push('Adjustment type is required');
  }

  if (!adjustment.reason?.trim()) {
    errors.push('Adjustment reason is required');
  }

  // Type-specific validation
  switch (adjustment.adjustmentType) {
    case 'quantity':
      if (typeof adjustment.newValue !== 'number' || adjustment.newValue < 0) {
        errors.push('New quantity must be a non-negative number');
      }
      break;

    case 'location':
      if (typeof adjustment.newValue !== 'string' || !adjustment.newValue.trim()) {
        errors.push('New location is required');
      } else if (!LocationMapper.isValidLocation(adjustment.newValue)) {
        errors.push(`Invalid location: ${adjustment.newValue}`);
      }
      break;

    case 'status':
      if (typeof adjustment.newValue !== 'string' || !adjustment.newValue.trim()) {
        errors.push('New status is required');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate pallet number format
 */
export function validatePalletNumber(palletNum: string): boolean {
  if (!palletNum || typeof palletNum !== 'string') return false;

  // Basic validation - adjust pattern as needed
  const trimmed = palletNum.trim();
  return trimmed.length > 0 && trimmed.length <= 50; // Reasonable length limit
}

/**
 * Validate product code format
 */
export function validateProductCode(productCode: string): boolean {
  if (!productCode || typeof productCode !== 'string') return false;

  const trimmed = productCode.trim();
  return trimmed.length > 0 && trimmed.length <= 50;
}

/**
 * Validate quantity
 */
export function validateQuantity(quantity: any): boolean {
  const num = Number(quantity);
  return !isNaN(num) && num > 0 && Number.isInteger(num);
}
