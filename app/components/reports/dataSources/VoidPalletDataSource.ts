/**
 * Void Pallet Report Data Source
 * Wrapper for Server Actions
 */

import { ReportDataSource } from '../core/ReportConfig';
import { 
  getVoidPalletSummary, 
  getVoidPalletDetails, 
  getVoidReasonStats, 
  getVoidProductStats,
  type VoidPalletFilters
} from '@/app/actions/reportActions';

// Void Pallet Summary data source
const voidPalletSummaryDataSource: ReportDataSource = {
  id: 'void-pallet-summary',

  async fetch(filters: Record<string, any>) {
    const voidPalletFilters: VoidPalletFilters = {
      startDate: filters.startDate || '',
      endDate: filters.endDate || '',
      productCode: filters.productCode,
      operatorId: filters.operatorId,
      voidReason: filters.voidReason,
    };
    const result = await getVoidPalletSummary(voidPalletFilters);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch void pallet summary');
    }
    return result.data;
  },

  transform(data: any) {
    return data;
  },
};

// Void Pallet Details data source
const voidPalletDetailsDataSource: ReportDataSource = {
  id: 'void-pallet-details',

  async fetch(filters: Record<string, any>) {
    const voidPalletFilters: VoidPalletFilters = {
      startDate: filters.startDate || '',
      endDate: filters.endDate || '',
      productCode: filters.productCode,
      operatorId: filters.operatorId,
      voidReason: filters.voidReason,
    };
    const result = await getVoidPalletDetails(voidPalletFilters);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch void pallet details');
    }
    return result.data;
  },

  transform(data: any) {
    return data;
  },
};

// Void Reason Stats data source
const voidReasonStatsDataSource: ReportDataSource = {
  id: 'void-reasons',

  async fetch(filters: Record<string, any>) {
    const voidPalletFilters: VoidPalletFilters = {
      startDate: filters.startDate || '',
      endDate: filters.endDate || '',
      productCode: filters.productCode,
      operatorId: filters.operatorId,
      voidReason: filters.voidReason,
    };
    const result = await getVoidReasonStats(voidPalletFilters);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch void reason stats');
    }
    return result.data;
  },

  transform(data: any) {
    return data;
  },
};

// Void Product Stats data source
const voidProductStatsDataSource: ReportDataSource = {
  id: 'void-product-stats',

  async fetch(filters: Record<string, any>) {
    const voidPalletFilters: VoidPalletFilters = {
      startDate: filters.startDate || '',
      endDate: filters.endDate || '',
      productCode: filters.productCode,
      operatorId: filters.operatorId,
      voidReason: filters.voidReason,
    };
    const result = await getVoidProductStats(voidPalletFilters);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch void product stats');
    }
    return result.data;
  },

  transform(data: any) {
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