/**
 * Void Pallet Report Data Source
 * Wrapper for Server Actions
 */

import { ReportDataSource } from '../core/ReportConfig';
import { DatabaseRecord } from '@/types/database/tables';
import {
  getVoidPalletSummary,
  getVoidPalletDetails,
  getVoidReasonStats,
  getVoidProductStats,
  type VoidPalletFilters,
} from '@/app/actions/DownloadCentre-Actions';
import { safeString, safeOptionalString, safeOptionalNumber } from '@/lib/types/type-guards';
import { isErrorResult, extractErrorMessage } from '@/lib/types/api';

// Void Pallet Summary data source
const voidPalletSummaryDataSource: ReportDataSource = {
  id: 'void-pallet-summary',

  async fetch(filters: Record<string, unknown>): Promise<DatabaseRecord[]> {
    const voidPalletFilters: VoidPalletFilters = {
      startDate: safeString(filters.startDate, ''),
      endDate: safeString(filters.endDate, ''),
      productCode: safeOptionalString(filters.productCode),
      operatorId: safeOptionalNumber(filters.operatorId),
      voidReason: safeOptionalString(filters.voidReason),
    };
    const result = await getVoidPalletSummary(voidPalletFilters);
    if (isErrorResult(result)) {
      throw new Error(extractErrorMessage(result.error) || 'Failed to fetch void pallet summary');
    }
    // 策略4: unknown + type narrowing - 安全的類型轉換
    const data = result.data;
    if (!data) return [];
    if (typeof data === 'object' && !Array.isArray(data)) {
      return [data as unknown as DatabaseRecord];
    }
    return Array.isArray(data) ? (data as unknown as DatabaseRecord[]) : [];
  },

  transform(data: DatabaseRecord[]) {
    return data;
  },
};

// Void Pallet Details data source
const voidPalletDetailsDataSource: ReportDataSource = {
  id: 'void-pallet-details',

  async fetch(filters: Record<string, unknown>): Promise<DatabaseRecord[]> {
    const voidPalletFilters: VoidPalletFilters = {
      startDate: safeString(filters.startDate, ''),
      endDate: safeString(filters.endDate, ''),
      productCode: safeOptionalString(filters.productCode),
      operatorId: safeOptionalNumber(filters.operatorId),
      voidReason: safeOptionalString(filters.voidReason),
    };
    const result = await getVoidPalletDetails(voidPalletFilters);
    if (isErrorResult(result)) {
      throw new Error(extractErrorMessage(result.error) || 'Failed to fetch void pallet details');
    }
    // 策略4: unknown + type narrowing - 安全的類型轉換
    const data = result.data;
    return Array.isArray(data) ? (data as unknown as DatabaseRecord[]) : [];
  },

  transform(data: DatabaseRecord[]) {
    return data;
  },
};

// Void Reason Stats data source
const voidReasonStatsDataSource: ReportDataSource = {
  id: 'void-reasons',

  async fetch(filters: Record<string, unknown>): Promise<DatabaseRecord[]> {
    const voidPalletFilters: VoidPalletFilters = {
      startDate: safeString(filters.startDate, ''),
      endDate: safeString(filters.endDate, ''),
      productCode: safeOptionalString(filters.productCode),
      operatorId: safeOptionalNumber(filters.operatorId),
      voidReason: safeOptionalString(filters.voidReason),
    };
    const result = await getVoidReasonStats(voidPalletFilters);
    if (isErrorResult(result)) {
      throw new Error(extractErrorMessage(result.error) || 'Failed to fetch void reason stats');
    }
    // 策略4: unknown + type narrowing - 安全的類型轉換
    const data = result.data;
    return Array.isArray(data) ? (data as unknown as DatabaseRecord[]) : [];
  },

  transform(data: DatabaseRecord[]) {
    return data;
  },
};

// Void Product Stats data source
const voidProductStatsDataSource: ReportDataSource = {
  id: 'void-product-stats',

  async fetch(filters: Record<string, unknown>): Promise<DatabaseRecord[]> {
    const voidPalletFilters: VoidPalletFilters = {
      startDate: safeString(filters.startDate, ''),
      endDate: safeString(filters.endDate, ''),
      productCode: safeOptionalString(filters.productCode),
      operatorId: safeOptionalNumber(filters.operatorId),
      voidReason: safeOptionalString(filters.voidReason),
    };
    const result = await getVoidProductStats(voidPalletFilters);
    if (isErrorResult(result)) {
      throw new Error(extractErrorMessage(result.error) || 'Failed to fetch void product stats');
    }
    // 策略4: unknown + type narrowing - 安全的類型轉換
    const data = result.data;
    return Array.isArray(data) ? (data as unknown as DatabaseRecord[]) : [];
  },

  transform(data: DatabaseRecord[]) {
    return data;
  },
};

// Export data sources map
export const voidPalletDataSources = new Map([
  ['voidPalletSummary', voidPalletSummaryDataSource],
  ['voidPalletDetails', voidPalletDetailsDataSource],
  ['voidReasonStats', voidReasonStatsDataSource],
  ['voidProductStats', voidProductStatsDataSource],
]);
