/**
 * Stock Take Report Data Source
 * Wrapper for Server Actions
 */

import { ReportDataSource } from '../core/ReportConfig';
import { DatabaseRecord } from '@/types/database/tables';
import {
  getStockTakeSummary,
  getStockTakeDetails,
  getNotCountedItems,
  type StockTakeFilters,
} from '@/app/actions/DownloadCentre-Actions';
import {
  safeString,
  safeOptionalString,
  safeOptionalNumber,
  safeCountStatus,
} from '@/lib/types/type-guards';
import { extractErrorMessage } from '@/lib/types/api';

// Stock Take Summary data source
const stockTakeSummaryDataSource: ReportDataSource = {
  id: 'stock-take-summary',

  async fetch(filters: Record<string, unknown>): Promise<DatabaseRecord[]> {
    const stockTakeFilters: StockTakeFilters = {
      stockTakeDate: safeString(filters.stockTakeDate, ''),
      productCode: safeOptionalString(filters.productCode),
      minVariance: safeOptionalNumber(filters.minVariance),
      countStatus: safeCountStatus(filters.countStatus),
    };
    const result = await getStockTakeSummary(stockTakeFilters);
    if (!result.success) {
      throw new Error(extractErrorMessage(result.error || 'Failed to fetch stock take summary'));
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

// Stock Take Details data source
const stockTakeDetailsDataSource: ReportDataSource = {
  id: 'stock-take-details',

  async fetch(filters: Record<string, unknown>): Promise<DatabaseRecord[]> {
    const stockTakeFilters: StockTakeFilters = {
      stockTakeDate: safeString(filters.stockTakeDate, ''),
      productCode: safeOptionalString(filters.productCode),
      minVariance: safeOptionalNumber(filters.minVariance),
      countStatus: safeCountStatus(filters.countStatus),
    };
    const result = await getStockTakeDetails(stockTakeFilters);
    if (!result.success) {
      throw new Error(extractErrorMessage(result.error || 'Failed to fetch stock take details'));
    }
    // 策略4: unknown + type narrowing - 安全的類型轉換
    const data = result.data;
    return Array.isArray(data) ? (data as unknown as DatabaseRecord[]) : [];
  },

  transform(data: DatabaseRecord[]) {
    return data;
  },
};

// Not Counted Items data source
const notCountedItemsDataSource: ReportDataSource = {
  id: 'not-counted-items',

  async fetch(filters: Record<string, unknown>): Promise<DatabaseRecord[]> {
    const stockTakeFilters: StockTakeFilters = {
      stockTakeDate: safeString(filters.stockTakeDate, ''),
      productCode: safeOptionalString(filters.productCode),
      minVariance: safeOptionalNumber(filters.minVariance),
      countStatus: safeCountStatus(filters.countStatus),
    };
    const result = await getNotCountedItems(stockTakeFilters);
    if (!result.success) {
      throw new Error(extractErrorMessage(result.error || 'Failed to fetch not counted items'));
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
export const stockTakeDataSources = new Map([
  ['stockTakeSummary', stockTakeSummaryDataSource],
  ['stockTakeDetails', stockTakeDetailsDataSource],
  ['notCountedItems', notCountedItemsDataSource],
]);
