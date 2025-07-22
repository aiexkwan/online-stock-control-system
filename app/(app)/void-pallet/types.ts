/**
 * Void Pallet System Type Definitions
 *
 * Types migrated to @/types/domains/void-pallet for better organization
 * This file now re-exports from the centralized location
 */

// 重新導出類型，保持向後兼容的同時實現類型統一管理
export type {
  PalletInfo,
  SearchParams,
  SearchResult,
  VoidParams,
  VoidResult,
  ReprintInfo,
  ReprintInfoInput,
  VoidReasonConfig,
  ErrorState,
  VoidPalletState,
  HistoryRecord,
  AutoReprintParams,
  AutoReprintResult,
  SearchType,
  ErrorType,
} from '@/types/domains/void-pallet';

// 保留原有的常量定義在本地，導入類型避免重複定義
import type { VoidReasonConfig } from '@/types/domains/void-pallet';

export const VOID_REASONS: VoidReasonConfig[] = [
  {
    value: 'Print Extra Label',
    label: 'Print Extra Label',
    allowsReprint: false,
    requiresDamageQty: false,
  },
  {
    value: 'Wrong Label',
    label: 'Wrong Label',
    allowsReprint: true,
    requiresDamageQty: false,
  },
  {
    value: 'Wrong Qty',
    label: 'Wrong Qty',
    allowsReprint: true,
    requiresDamageQty: false,
  },
  {
    value: 'Wrong Product Code',
    label: 'Wrong Product Code',
    allowsReprint: true,
    requiresDamageQty: false,
  },
  {
    value: 'Damage',
    label: 'Damage',
    allowsReprint: true,
    requiresDamageQty: true,
  },
  {
    value: 'Used Material',
    label: 'Used Material',
    allowsReprint: false,
    requiresDamageQty: false,
  },
  {
    value: 'Other',
    label: 'Other (Specify if possible)',
    allowsReprint: false,
    requiresDamageQty: false,
  },
];

export const SEARCH_TYPES = {
  QR: 'qr' as const,
  PALLET_NUM: 'pallet_num' as const,
};

export const ERROR_TYPES = {
  SEARCH: 'search' as const,
  VOID: 'void' as const,
  SYSTEM: 'system' as const,
  VALIDATION: 'validation' as const,
} as const;

// AutoReprint interfaces 已遷移到 @/types/domains/void-pallet
