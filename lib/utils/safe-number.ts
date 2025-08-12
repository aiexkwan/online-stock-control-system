/**
 * Safe number conversion utility
 * Migrated from widgets/types/enhanced-card-types.ts
 */

export function safeNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}