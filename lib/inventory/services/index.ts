/**
 * Export all inventory services
 */

export { UnifiedInventoryService } from './UnifiedInventoryService';
export { PalletService } from './PalletService';
export { TransactionService } from './TransactionService';

// Factory function to create inventory service with Supabase client
import { SupabaseClient } from '@supabase/supabase-js';
import { UnifiedInventoryService } from './UnifiedInventoryService';

export function createInventoryService(supabase: SupabaseClient): UnifiedInventoryService {
  return new UnifiedInventoryService(supabase);
}