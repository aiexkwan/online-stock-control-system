/**
 * Location-specific type definitions
 * Provides enhanced location types and utilities
 */

import { DatabaseLocationColumn, StandardLocation } from '../utils/locationMapper';

/**
 * Location transfer validation result
 */
export interface LocationTransferValidation {
  isValid: boolean;
  fromLocation: {
    standard: StandardLocation | null;
    dbColumn: DatabaseLocationColumn | null;
    exists: boolean;
  };
  toLocation: {
    standard: StandardLocation | null;
    dbColumn: DatabaseLocationColumn | null;
    exists: boolean;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Location capacity information
 */
export interface LocationCapacity {
  location: StandardLocation;
  dbColumn: DatabaseLocationColumn;
  maxCapacity: number | null; // null means unlimited
  currentOccupancy: number;
  availableSpace: number | null;
  utilizationPercentage: number;
}

/**
 * Location transfer rules
 */
export interface LocationTransferRule {
  fromLocation: StandardLocation;
  allowedDestinations: StandardLocation[];
  restrictedDestinations: StandardLocation[];
  requiresApproval: boolean;
  approvalRoles?: string[];
}

/**
 * Default transfer rules for the system
 */
export const DEFAULT_TRANSFER_RULES: LocationTransferRule[] = [
  {
    fromLocation: 'DAMAGE',
    allowedDestinations: [], // Damage location typically doesn't allow transfers out
    restrictedDestinations: ['PRODUCTION', 'PIPELINE', 'PREBOOK', 'AWAITING', 'FOLD', 'BULK', 'BACK_CARPARK', 'AWAIT_GRN'],
    requiresApproval: true,
    approvalRoles: ['admin', 'manager']
  },
  {
    fromLocation: 'AWAIT_GRN',
    allowedDestinations: ['PRODUCTION', 'PIPELINE', 'AWAITING'], // Only to active locations after GRN
    restrictedDestinations: ['DAMAGE'],
    requiresApproval: false
  }
];

/**
 * Location group for categorization
 */
export type LocationGroup = 'production' | 'storage' | 'staging' | 'special';

/**
 * Location metadata
 */
export interface LocationMetadata {
  standard: StandardLocation;
  dbColumn: DatabaseLocationColumn;
  displayName: string;
  group: LocationGroup;
  sortOrder: number;
  icon?: string;
  color?: string;
  description?: string;
}

/**
 * Complete location metadata definitions
 */
export const LOCATION_METADATA: Record<StandardLocation, LocationMetadata> = {
  'PRODUCTION': {
    standard: 'PRODUCTION',
    dbColumn: 'injection',
    displayName: 'Production',
    group: 'production',
    sortOrder: 1,
    icon: 'factory',
    color: '#3B82F6',
    description: 'Active production area'
  },
  'PIPELINE': {
    standard: 'PIPELINE',
    dbColumn: 'pipeline',
    displayName: 'Pipeline',
    group: 'production',
    sortOrder: 2,
    icon: 'flow',
    color: '#8B5CF6',
    description: 'In-process pipeline'
  },
  'PREBOOK': {
    standard: 'PREBOOK',
    dbColumn: 'prebook',
    displayName: 'Prebook',
    group: 'staging',
    sortOrder: 3,
    icon: 'calendar',
    color: '#10B981',
    description: 'Pre-booked for orders'
  },
  'AWAITING': {
    standard: 'AWAITING',
    dbColumn: 'await',
    displayName: 'Awaiting',
    group: 'staging',
    sortOrder: 4,
    icon: 'clock',
    color: '#F59E0B',
    description: 'Awaiting next action'
  },
  'FOLD': {
    standard: 'FOLD',
    dbColumn: 'fold',
    displayName: 'Fold',
    group: 'storage',
    sortOrder: 5,
    icon: 'layers',
    color: '#6366F1',
    description: 'Folded storage area'
  },
  'BULK': {
    standard: 'BULK',
    dbColumn: 'bulk',
    displayName: 'Bulk',
    group: 'storage',
    sortOrder: 6,
    icon: 'package',
    color: '#84CC16',
    description: 'Bulk storage area'
  },
  'BACK_CARPARK': {
    standard: 'BACK_CARPARK',
    dbColumn: 'backcarpark',
    displayName: 'Back Carpark',
    group: 'storage',
    sortOrder: 7,
    icon: 'parking',
    color: '#06B6D4',
    description: 'External storage area'
  },
  'DAMAGE': {
    standard: 'DAMAGE',
    dbColumn: 'damage',
    displayName: 'Damage',
    group: 'special',
    sortOrder: 8,
    icon: 'alert',
    color: '#EF4444',
    description: 'Damaged goods area'
  },
  'AWAIT_GRN': {
    standard: 'AWAIT_GRN',
    dbColumn: 'await_grn',
    displayName: 'Awaiting GRN',
    group: 'staging',
    sortOrder: 9,
    icon: 'inbox',
    color: '#78716C',
    description: 'Awaiting goods receipt'
  }
};

/**
 * Get locations by group
 */
export function getLocationsByGroup(group: LocationGroup): LocationMetadata[] {
  return Object.values(LOCATION_METADATA)
    .filter(loc => loc.group === group)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Check if transfer is allowed based on rules
 */
export function isTransferAllowed(
  fromLocation: StandardLocation,
  toLocation: StandardLocation,
  rules: LocationTransferRule[] = DEFAULT_TRANSFER_RULES
): { allowed: boolean; requiresApproval: boolean; reason?: string } {
  const rule = rules.find(r => r.fromLocation === fromLocation);
  
  if (!rule) {
    // No specific rules, transfer is allowed
    return { allowed: true, requiresApproval: false };
  }
  
  // Check if destination is explicitly restricted
  if (rule.restrictedDestinations.includes(toLocation)) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `Transfer from ${fromLocation} to ${toLocation} is not allowed`
    };
  }
  
  // Check if destination is in allowed list (if specified)
  if (rule.allowedDestinations.length > 0 && !rule.allowedDestinations.includes(toLocation)) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `${toLocation} is not in the allowed destinations for ${fromLocation}`
    };
  }
  
  return {
    allowed: true,
    requiresApproval: rule.requiresApproval
  };
}