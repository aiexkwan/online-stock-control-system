/**
 * Batch void functionality types
 */

import { PalletInfo } from '../types';

export interface BatchPalletItem {
  id: string; // Unique ID for React key
  palletInfo: PalletInfo;
  selected: boolean;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  scanTime: Date;
}

export interface BatchVoidState {
  mode: 'single' | 'batch';
  items: BatchPalletItem[];
  selectedCount: number;
  isProcessing: boolean;
  currentProcessingId: string | null;
  completedCount: number;
  errorCount: number;
}

export interface BatchVoidParams {
  items: BatchPalletItem[];
  voidReason: string;
  password: string;
  damageQuantity?: number; // Only for damage reason
}

export interface BatchVoidResult {
  success: boolean;
  results: Array<{
    plt_num: string;
    success: boolean;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface BatchScanSettings {
  maxItems: number;
  autoSelectAll: boolean;
  preventDuplicates: boolean;
  confirmBeforeExecute: boolean;
  showProgressDetails: boolean;
}

export const DEFAULT_BATCH_SETTINGS: BatchScanSettings = {
  maxItems: 50,
  autoSelectAll: true,
  preventDuplicates: true,
  confirmBeforeExecute: true,
  showProgressDetails: true,
};