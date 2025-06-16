# Pallet Generation V6 Migration Guide

## Overview

The V6 pallet generation system is now the standard across the entire application. This system provides:

- Pre-generated daily pool of 300 pallet numbers
- Built-in series generation (no separate series utils needed)
- Three-state management: False (available), Holded (reserved), True (used)
- Automatic daily reset and expired hold cleanup
- Better performance and reliability

## Key Changes

### 1. Unified Import Location

**Old way (multiple imports):**
```typescript
import { generateOptimizedPalletNumbersV5 } from '@/app/utils/optimizedPalletGenerationV5';
import { generateMultipleUniqueSeries } from '@/lib/seriesUtils';
```

**New way (single import):**
```typescript
import { generatePalletNumbers, confirmPalletUsage, releasePalletReservation } from '@/app/utils/palletGeneration';
```

### 2. Function Changes

**Old way:**
```typescript
// Generate pallet numbers
const result = await generateOptimizedPalletNumbersV5({
  count: 5,
  maxRetries: 5,
  retryDelay: 1500,
  enableFallback: true
});

// Generate series separately
const series = await generateMultipleUniqueSeries(5, supabase);
```

**New way:**
```typescript
// Generate both pallet numbers and series in one call
const result = await generatePalletNumbers({
  count: 5,
  sessionId: 'qc-label-123' // Optional, for debugging
}, supabase); // Supabase client is optional

// Result includes both arrays
const { palletNumbers, series } = result;
```

### 3. Confirmation and Release

V6 introduces proper state management for pallet numbers:

```typescript
// After successful printing
const confirmed = await confirmPalletUsage(palletNumbers, supabase);

// On error or cancellation
const released = await releasePalletReservation(palletNumbers, supabase);
```

## Implementation Status

### ✅ Components Updated to V6:

1. **QC Label Components**
   - `/app/components/qc-label-form/hooks/modules/useDatabaseOperationsV2.tsx`
   - `/app/components/qc-label-form/hooks/useQcLabelBusiness.tsx`

2. **GRN Label Components**
   - `/app/components/grn-label-form/hooks/useDatabaseOperationsV2.tsx`
   - `/app/components/grn-label-form/hooks/useGrnLabelBusiness.tsx`

3. **API Routes**
   - `/app/api/auto-reprint-label-v2/route.ts`

4. **Server Actions**
   - `/app/actions/grnActions.ts` - `generateGrnPalletNumbersAndSeries`

### ⚠️ Deprecated Functions:

- `generateOptimizedPalletNumbers` (V1-V3)
- `generateOptimizedPalletNumbersV5`
- `generatePalletNumbersDirectQuery`
- `generateMultipleUniqueSeries` (no longer needed)

## Database Changes

The V6 system uses a simplified `pallet_number_buffer` table:

```sql
CREATE TABLE pallet_number_buffer (
    id INTEGER PRIMARY KEY,
    pallet_number TEXT NOT NULL UNIQUE,
    series TEXT NOT NULL UNIQUE,
    date_str TEXT NOT NULL,
    used TEXT NOT NULL DEFAULT 'False' CHECK (used IN ('False', 'Holded', 'True')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Cron Jobs

Two cron jobs are set up:

1. **Daily Reset** - Runs at 00:00 to generate 300 new pallet numbers
2. **Expired Hold Cleanup** - Runs every 30 minutes to release holds older than 10 minutes

## Best Practices

1. **Always use the unified import:**
   ```typescript
   import { generatePalletNumbers } from '@/app/utils/palletGeneration';
   ```

2. **Always confirm or release:**
   ```typescript
   try {
     const result = await generatePalletNumbers({ count: 5 });
     // ... do work ...
     await confirmPalletUsage(result.palletNumbers);
   } catch (error) {
     await releasePalletReservation(result.palletNumbers);
   }
   ```

3. **Monitor buffer status:**
   ```typescript
   const status = await getPalletBufferStatus();
   console.log(`Available: ${status.availableCount}/${status.totalCount}`);
   ```

## Troubleshooting

1. **"No pallet numbers available" error**
   - Check if daily reset ran: `SELECT * FROM get_pallet_buffer_status();`
   - Manually reset if needed: `SELECT reset_daily_pallet_buffer();`

2. **Duplicate series errors**
   - V6 handles series generation automatically
   - Check for unique constraint violations in logs

3. **Performance issues**
   - V6 is faster than previous versions
   - Check for expired holds: `SELECT cleanup_expired_holds();`

## Future Considerations

- The buffer size (300) can be adjusted in `reset_daily_pallet_buffer` function
- Hold timeout (10 minutes) can be adjusted in `cleanup_expired_holds` function
- Consider adding monitoring dashboards for buffer usage