/**
 * Unified Pallet Generation Module
 * 
 * This is the SINGLE source of truth for all pallet number and series generation
 * across the entire application. All components should import from this file.
 * 
 * V6 Implementation:
 * - Pre-generated daily pool of 300 pallet numbers
 * - Format: DDMMYY/1 to DDMMYY/300
 * - Series format: DDMMYY-XXXXXX (6 random alphanumeric)
 * - Three states: False (available), Holded (reserved), True (used)
 * - Automatic daily reset at 00:00
 * - 10-minute hold expiration
 */

// Re-export everything from V6 as the primary implementation
export {
  generateOptimizedPalletNumbersV6 as generatePalletNumbers,
  confirmPalletUsage,
  releasePalletReservation,
  getPalletBufferStatus,
  type GenerationOptions,
  type GenerationResult
} from './optimizedPalletGenerationV6';

// Export V6 specifically for migration purposes
export {
  generateOptimizedPalletNumbersV6,
  type GenerationOptions as GenerationOptionsV6,
  type GenerationResult as GenerationResultV6
} from './optimizedPalletGenerationV6';

/**
 * Main function to generate pallet numbers and series
 * This should be used by all components
 * 
 * @param count - Number of pallet numbers to generate
 * @param sessionId - Optional session identifier for debugging
 * @param supabase - Optional Supabase client instance
 * @returns Promise with palletNumbers and series arrays
 * 
 * @example
 * ```typescript
 * import { generatePalletNumbers } from '@/app/utils/palletGeneration';
 * 
 * const result = await generatePalletNumbers(5, 'qc-label-123');
 * if (result.success) {
 *   process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(result.palletNumbers); // ['140625/1', '140625/2', ...]
 *   process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(result.series); // ['140625-ABC123', '140625-DEF456', ...]
 * }
 * ```
 */

/**
 * Confirm that pallet numbers have been successfully used (printed)
 * Should be called after successful printing
 * 
 * @param palletNumbers - Array of pallet numbers to confirm
 * @param supabase - Optional Supabase client instance
 * @returns Promise<boolean> indicating success
 * 
 * @example
 * ```typescript
 * import { confirmPalletUsage } from '@/app/utils/palletGeneration';
 * 
 * const success = await confirmPalletUsage(['140625/1', '140625/2']);
 * ```
 */

/**
 * Release reserved pallet numbers back to available pool
 * Should be called when printing fails or is cancelled
 * 
 * @param palletNumbers - Array of pallet numbers to release
 * @param supabase - Optional Supabase client instance
 * @returns Promise<boolean> indicating success
 * 
 * @example
 * ```typescript
 * import { releasePalletReservation } from '@/app/utils/palletGeneration';
 * 
 * const success = await releasePalletReservation(['140625/1', '140625/2']);
 * ```
 */

/**
 * Get current status of the pallet buffer
 * Useful for monitoring and debugging
 * 
 * @param supabase - Optional Supabase client instance
 * @returns Promise with buffer statistics
 * 
 * @example
 * ```typescript
 * import { getPalletBufferStatus } from '@/app/utils/palletGeneration';
 * 
 * const status = await getPalletBufferStatus();
 * process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log(`Available: ${status.availableCount}/${status.totalCount}`);
 * ```
 */