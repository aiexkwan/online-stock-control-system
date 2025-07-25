/**
 * Order Loading Report Data Source
 * Wrapper for Server Actions
 */

import { ReportDataSource } from '../core/ReportConfig';
import { DatabaseRecord } from '@/types/database/tables';
import {
  getOrderLoadingSummary,
  getOrderProgress,
  getLoadingDetails,
  getUserPerformance,
  type OrderLoadingFilters,
} from '@/app/actions/reportActions';
import { safeString, safeOptionalString, safeOptionalNumber } from '@/types/core/guards';

// Order Loading Summary data source
const orderLoadingSummaryDataSource: ReportDataSource = {
  id: 'order-loading-summary',

  async fetch(filters: Record<string, unknown>): Promise<DatabaseRecord[]> {
    const orderLoadingFilters: OrderLoadingFilters = {
      dateRange: safeString(filters.dateRange, ''),
      orderNumber: safeOptionalString(filters.orderNumber),
      productCode: safeOptionalString(filters.productCode),
      userId: safeOptionalNumber(filters.userId),
    };
    const result = await getOrderLoadingSummary(orderLoadingFilters);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch order loading summary');
    }
    // 策略4: unknown + type narrowing - 安全的類型轉換
    const data = result.data;
    if (!data) return [];
    // 如果是對象，將其包裝成數組
    if (typeof data === 'object' && !Array.isArray(data)) {
      return [data as unknown as DatabaseRecord];
    }
    // 如果是數組，直接返回
    return Array.isArray(data) ? (data as unknown as DatabaseRecord[]) : [];
  },

  transform(data: DatabaseRecord[]) {
    return data;
  },
};

// Order Progress data source
const orderProgressDataSource: ReportDataSource = {
  id: 'order-progress',

  async fetch(filters: Record<string, unknown>): Promise<DatabaseRecord[]> {
    const orderLoadingFilters: OrderLoadingFilters = {
      dateRange: safeString(filters.dateRange, ''),
      orderNumber: safeOptionalString(filters.orderNumber),
      productCode: safeOptionalString(filters.productCode),
      userId: safeOptionalNumber(filters.userId),
    };
    const result = await getOrderProgress(orderLoadingFilters);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch order progress');
    }
    // 策略4: unknown + type narrowing - 安全的類型轉換
    const data = result.data;
    return Array.isArray(data) ? (data as unknown as DatabaseRecord[]) : [];
  },

  transform(data: DatabaseRecord[]) {
    return data;
  },
};

// Loading Details data source
const loadingDetailsDataSource: ReportDataSource = {
  id: 'loading-details',

  async fetch(filters: Record<string, unknown>): Promise<DatabaseRecord[]> {
    const orderLoadingFilters: OrderLoadingFilters = {
      dateRange: safeString(filters.dateRange, ''),
      orderNumber: safeOptionalString(filters.orderNumber),
      productCode: safeOptionalString(filters.productCode),
      userId: safeOptionalNumber(filters.userId),
    };
    const result = await getLoadingDetails(orderLoadingFilters);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch loading details');
    }
    // 策略4: unknown + type narrowing - 安全的類型轉換
    const data = result.data;
    return Array.isArray(data) ? (data as unknown as DatabaseRecord[]) : [];
  },

  transform(data: DatabaseRecord[]) {
    return data;
  },
};

// User Performance data source
const userPerformanceDataSource: ReportDataSource = {
  id: 'user-performance',

  async fetch(filters: Record<string, unknown>): Promise<DatabaseRecord[]> {
    const orderLoadingFilters: OrderLoadingFilters = {
      dateRange: safeString(filters.dateRange, ''),
      orderNumber: safeOptionalString(filters.orderNumber),
      productCode: safeOptionalString(filters.productCode),
      userId: safeOptionalNumber(filters.userId),
    };
    const result = await getUserPerformance(orderLoadingFilters);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch user performance');
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
export const orderLoadingDataSources = new Map([
  ['orderLoadingSummary', orderLoadingSummaryDataSource],
  ['orderProgress', orderProgressDataSource],
  ['loadingDetails', loadingDetailsDataSource],
  ['userPerformance', userPerformanceDataSource],
]);
