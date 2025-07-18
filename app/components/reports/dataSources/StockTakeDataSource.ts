/**
 * Stock Take Report Data Source
 * Wrapper for Server Actions
 */

import { ReportDataSource } from '../core/ReportConfig';
import { DatabaseRecord } from '@/lib/types/database';
import { 
  getStockTakeSummary, 
  getStockTakeDetails, 
  getNotCountedItems,
  type StockTakeFilters
} from '@/app/actions/reportActions';

// Stock Take Summary data source
const stockTakeSummaryDataSource: ReportDataSource = {
  id: 'stock-take-summary',

  async fetch(filters: Record<string, any>) {
    const stockTakeFilters: StockTakeFilters = {
      stockTakeDate: filters.stockTakeDate || '',
      productCode: filters.productCode,
      minVariance: filters.minVariance,
      countStatus: filters.countStatus,
    };
    const result = await getStockTakeSummary(stockTakeFilters);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch stock take summary');
    }
    return result.data;
  },

  transform(data: DatabaseRecord[]) {
    return data;
  },
};

// Stock Take Details data source
const stockTakeDetailsDataSource: ReportDataSource = {
  id: 'stock-take-details',

  async fetch(filters: Record<string, any>) {
    const stockTakeFilters: StockTakeFilters = {
      stockTakeDate: filters.stockTakeDate || '',
      productCode: filters.productCode,
      minVariance: filters.minVariance,
      countStatus: filters.countStatus,
    };
    const result = await getStockTakeDetails(stockTakeFilters);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch stock take details');
    }
    return result.data;
  },

  transform(data: DatabaseRecord[]) {
    return data;
  },
};

// Not Counted Items data source
const notCountedItemsDataSource: ReportDataSource = {
  id: 'not-counted-items',

  async fetch(filters: Record<string, any>) {
    const stockTakeFilters: StockTakeFilters = {
      stockTakeDate: filters.stockTakeDate || '',
      productCode: filters.productCode,
      minVariance: filters.minVariance,
      countStatus: filters.countStatus,
    };
    const result = await getNotCountedItems(stockTakeFilters);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch not counted items');
    }
    return result.data;
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