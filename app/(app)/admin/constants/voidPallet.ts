/**
 * Void Pallet Card Constants
 * Centralized configuration for void pallet operations
 */

export const VOID_REASONS = [
  { value: 'Damaged', label: 'Damaged' },
  { value: 'Expired', label: 'Expired' },
  { value: 'Quality Issue', label: 'Quality Issue' },
  { value: 'Wrong Item', label: 'Wrong Item' },
  { value: 'Lost', label: 'Lost' },
  { value: 'System Error', label: 'System Error' },
  { value: 'Other', label: 'Other' }
] as const;