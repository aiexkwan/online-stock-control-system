// Print Label Form Constants

// Retry attempts
export const MAX_PALLET_GENERATION_RETRIES = 5;
export const MAX_PALLET_GENERATION_RETRIES_PROD = 5;
export const MAX_PALLET_GENERATION_RETRIES_DEV = 3;
export const MAX_SERIES_GENERATION_RETRIES = 3;
export const MAX_DUPLICATE_CHECK_ATTEMPTS = 3;
export const MAX_ATTEMPTS_GENERAL = 3;
export const MAX_ATTEMPTS_PRODUCTION = 7;

// Delays and timeouts (in milliseconds)
export const COOLDOWN_PERIOD_PROD = 5000; // 5 seconds in production
export const COOLDOWN_PERIOD_DEV = 3000; // 3 seconds in development
export const DUPLICATE_CHECK_DELAY_BASE = 200;
export const CACHE_CONTROL_TIMEOUT = 3600; // 1 hour in seconds
export const RETRY_DELAY_BASE = 1000;
export const RETRY_DELAY_BASE_PROD = 2000;
export const RETRY_DELAY_BASE_VERCEL = 800;
export const RETRY_DELAY_BASE_DEV = 500;
export const SERIES_RETRY_DELAY_BASE = 100;
export const RPC_RETRY_DELAY_BASE = 100;
export const INITIAL_RETRY_DELAY_VERCEL = 300;

// Limits and counts
export const MAX_PALLET_COUNT = 5;
export const MIN_ACO_ORDER_REF_LENGTH = 5;
export const MAX_BATCH_SIZE = 50; // For series generation
export const DEFAULT_ACO_PALLET_START_COUNT = 1;

// Array indices
export const FIRST_INDEX = 0;
export const CLOCK_NUMBER_EMAIL_INDEX = 0;

// Status codes and magic values
export const ONE_HOUR_CACHE = '3600';
export const SLATE_DEFAULT_COUNT = '1';
export const HUNDRED_MODULO = 100;
export const ORDINAL_SUFFIX_SPECIAL_CASE_11 = 11;
export const ORDINAL_SUFFIX_SPECIAL_CASE_12 = 12;
export const ORDINAL_SUFFIX_SPECIAL_CASE_13 = 13;
export const ORDINAL_SUFFIX_REMAINDER_1 = 1;
export const ORDINAL_SUFFIX_REMAINDER_2 = 2;
export const ORDINAL_SUFFIX_REMAINDER_3 = 3;
export const ORDINAL_SUFFIX_REMAINDER_10 = 10;

// Date format constants
export const DATE_PAD_LENGTH = 2;
export const YEAR_SLICE_LENGTH = -2;