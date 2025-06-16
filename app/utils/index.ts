/**
 * Centralized exports for utility functions
 * 
 * Import pallet generation functions from here for cleaner imports:
 * import { generatePalletNumbers } from '@/app/utils';
 */

// Pallet Generation - V6 is the standard
export {
  generatePalletNumbers,
  confirmPalletUsage,
  releasePalletReservation,
  getPalletBufferStatus,
  type GenerationOptions,
  type GenerationResult
} from './palletGeneration';

// Other utilities can be added here as needed