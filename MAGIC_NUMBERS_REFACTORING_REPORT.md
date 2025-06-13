# Magic Numbers Refactoring Report

## Summary
I have successfully identified and extracted magic numbers from the print-label related files into a centralized constants file. This improves code maintainability and makes it easier to adjust these values in the future.

## Constants File Created
- **Location**: `/app/components/qc-label-form/constants.ts`

## Magic Numbers Found and Refactored

### 1. **Retry Attempts**
- `5` → `MAX_PALLET_GENERATION_RETRIES_PROD` (production pallet generation retries)
- `3` → `MAX_PALLET_GENERATION_RETRIES_DEV` (development pallet generation retries)
- `3` → `MAX_SERIES_GENERATION_RETRIES` (series generation retries)
- `3` → `MAX_DUPLICATE_CHECK_ATTEMPTS` (duplicate check attempts)
- `3` → `MAX_ATTEMPTS_GENERAL` (general retry attempts)
- `7` → `MAX_ATTEMPTS_PRODUCTION` (production environment retries)

### 2. **Delays and Timeouts (milliseconds)**
- `5000` → `COOLDOWN_PERIOD_PROD` (5 seconds cooldown in production)
- `3000` → `COOLDOWN_PERIOD_DEV` (3 seconds cooldown in development)
- `200` → `DUPLICATE_CHECK_DELAY_BASE` (base delay for duplicate checks)
- `3600` → `CACHE_CONTROL_TIMEOUT` / `ONE_HOUR_CACHE` (1 hour cache control)
- `1000` → `RETRY_DELAY_BASE` (base retry delay)
- `2000` → `RETRY_DELAY_BASE_PROD` (production retry delay base)
- `800` → `RETRY_DELAY_BASE_VERCEL` (Vercel environment retry delay)
- `500` → `RETRY_DELAY_BASE_DEV` (development retry delay)
- `300` → `INITIAL_RETRY_DELAY_VERCEL` (initial Vercel retry delay)
- `100` → `SERIES_RETRY_DELAY_BASE` / `RPC_RETRY_DELAY_BASE` (base delays for series/RPC)

### 3. **Limits and Counts**
- `5` → `MAX_PALLET_COUNT` (maximum pallet labels per print)
- `5` → `MIN_ACO_ORDER_REF_LENGTH` (minimum ACO order reference length)
- `1` → `DEFAULT_ACO_PALLET_START_COUNT` (default starting count for pallets)
- `'1'` → `SLATE_DEFAULT_COUNT` (default count for Slate products)

### 4. **Array Indices**
- `0` → `FIRST_INDEX` (general first index)
- `0` → `CLOCK_NUMBER_EMAIL_INDEX` (index for extracting clock number from email)

### 5. **Ordinal Suffix Magic Numbers**
- `10` → `ORDINAL_SUFFIX_REMAINDER_10` (modulo 10 for ordinal suffix)
- `100` → `HUNDRED_MODULO` (modulo 100 for ordinal suffix)
- `11` → `ORDINAL_SUFFIX_SPECIAL_CASE_11` (special case for 11th)
- `12` → `ORDINAL_SUFFIX_SPECIAL_CASE_12` (special case for 12th)
- `13` → `ORDINAL_SUFFIX_SPECIAL_CASE_13` (special case for 13th)
- `1` → `ORDINAL_SUFFIX_REMAINDER_1` (remainder 1 for "st" suffix)
- `2` → `ORDINAL_SUFFIX_REMAINDER_2` (remainder 2 for "nd" suffix)
- `3` → `ORDINAL_SUFFIX_REMAINDER_3` (remainder 3 for "rd" suffix)

### 6. **Date Formatting**
- `2` → `DATE_PAD_LENGTH` (padding length for date components)
- `-2` → `YEAR_SLICE_LENGTH` (slice length for year extraction)

## Files Modified

### 1. `/app/components/qc-label-form/hooks/useQcLabelBusiness.tsx`
- Added import for constants
- Replaced hardcoded values with named constants
- Improved readability of ordinal suffix generation logic

### 2. `/app/components/qc-label-form/PerformanceOptimizedForm.tsx`
- Added import for constants
- Replaced hardcoded pallet count limit
- Replaced hardcoded Slate default count
- Made error messages dynamic using constants

### 3. `/app/actions/qcActions.ts`
- Added comprehensive import for all server-side constants
- Replaced all retry attempts and delays with named constants
- Improved cache control configuration
- Made date formatting consistent with constants

## Benefits

1. **Centralized Configuration**: All magic numbers are now in one place, making it easy to adjust system behavior.
2. **Self-Documenting Code**: Named constants clearly express their purpose.
3. **Consistency**: Same values are guaranteed to be used across all files.
4. **Maintainability**: Changes to limits, delays, or retry logic can be made in one place.
5. **Environment-Specific Configuration**: Clear separation between production and development values.

## Recommendations

1. Consider moving environment-specific constants to environment variables for even more flexibility.
2. Add unit tests to verify that these constants are used correctly.
3. Document any business logic reasons for specific values (e.g., why 5 pallet maximum).
4. Consider grouping related constants into nested objects for better organization.