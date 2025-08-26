/**
 * GRN (Goods Receipt Note) Type Definitions
 * Core type definitions for the GRN label system
 *
 * These types are used throughout the GRN label generation and printing system
 * to ensure type safety for pallet types, package types, and label modes.
 */

/**
 * Pallet type keys for different pallet configurations
 * Used in weight calculations and label generation
 */
export type PalletTypeKey =
  | 'whiteDry'
  | 'whiteWet'
  | 'chepDry'
  | 'chepWet'
  | 'euro'
  | 'notIncluded';

/**
 * Package type keys for different packaging options
 * Used in weight calculations and label generation
 */
export type PackageTypeKey = 'still' | 'bag' | 'tote' | 'octo' | 'notIncluded';

/**
 * Label mode for determining display format
 * - 'qty': Display quantity-based information
 * - 'weight': Display weight-based information
 */
export type LabelMode = 'qty' | 'weight';
