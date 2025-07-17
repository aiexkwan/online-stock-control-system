/**
 * Order Loading Report Data Source
 * Wrapper for Server Actions
 */

import { ReportDataSource } from '../core/ReportConfig';
import { 
  getOrderLoadingSummary, 
  getOrderProgress, 
  getLoadingDetails, 
  getUserPerformance,
  type OrderLoadingFilters
} from '@/app/actions/reportActions';

// Order Loading Summary data source
const orderLoadingSummaryDataSource: ReportDataSource = {
  id: 'order-loading-summary',

  async fetch(filters: Record<string, any>) {
    const orderLoadingFilters: OrderLoadingFilters = {
      dateRange: filters.dateRange || '',
      orderNumber: filters.orderNumber,
      productCode: filters.productCode,
      userId: filters.userId,
    };
    const result = await getOrderLoadingSummary(orderLoadingFilters);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch order loading summary');
    }
    return result.data;
  },

  transform(data: any) {
    return data;
  },
};

// Order Progress data source
const orderProgressDataSource: ReportDataSource = {
  id: 'order-progress',

  async fetch(filters: Record<string, any>) {
    const orderLoadingFilters: OrderLoadingFilters = {
      dateRange: filters.dateRange || '',
      orderNumber: filters.orderNumber,
      productCode: filters.productCode,
      userId: filters.userId,
    };
    const result = await getOrderProgress(orderLoadingFilters);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch order progress');
    }
    return result.data;
  },

  transform(data: any) {
    return data;
  },
};

// Loading Details data source
const loadingDetailsDataSource: ReportDataSource = {
  id: 'loading-details',

  async fetch(filters: Record<string, any>) {
    const orderLoadingFilters: OrderLoadingFilters = {
      dateRange: filters.dateRange || '',
      orderNumber: filters.orderNumber,
      productCode: filters.productCode,
      userId: filters.userId,
    };
    const result = await getLoadingDetails(orderLoadingFilters);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch loading details');
    }
    return result.data;
  },

  transform(data: any) {
    return data;
  },
};

// User Performance data source
const userPerformanceDataSource: ReportDataSource = {
  id: 'user-performance',

  async fetch(filters: Record<string, any>) {
    const orderLoadingFilters: OrderLoadingFilters = {
      dateRange: filters.dateRange || '',
      orderNumber: filters.orderNumber,
      productCode: filters.productCode,
      userId: filters.userId,
    };
    const result = await getUserPerformance(orderLoadingFilters);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch user performance');
    }
    return result.data;
  },

  transform(data: any) {
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