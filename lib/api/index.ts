/**
 * Unified API Entry Point
 * Central registry for all data access APIs
 */

// Core exports
export {
  DataAccessLayer,
  DataAccessMetricsManager,
  type DataAccessConfig,
} from './core/DataAccessStrategy';

// Inventory APIs
export { StockLevelsAPI, createStockLevelsAPI, useStockLevels } from './inventory/StockLevelsAPI';

// Admin APIs
export { DashboardAPI, createDashboardAPI, getDashboardData } from './admin/DashboardAPI';

// Real-time hooks
export { useRealtimeStock, useRealtimePallet } from './hooks/useRealtimeStock';

// Type exports
export type {
  StockLevelParams,
  StockLevelResult,
  StockLevelItem,
} from './inventory/StockLevelsAPI';

export type { DashboardParams, DashboardResult, DashboardWidgetData } from './admin/DashboardAPI';

/**
 * API Factory - Creates all API instances with shared configuration
 */
export class APIFactory {
  private static instance: APIFactory;
  private apis: Map<string, DataAccessLayer<any, any>> = new Map();

  static getInstance(): APIFactory {
    if (!this.instance) {
      this.instance = new APIFactory();
    }
    return this.instance;
  }

  /**
   * Get or create an API instance
   */
  getAPI<T extends DataAccessLayer<any, any>>(
    type: 'stockLevels' | 'dashboard' | string,
    factory: () => T
  ): T {
    if (!this.apis.has(type)) {
      this.apis.set(type, factory());
    }
    return this.apis.get(type) as T;
  }

  /**
   * Clear all cached API instances
   */
  clearCache(): void {
    this.apis.clear();
  }
}

// Convenience methods with lazy loading
export const api = {
  stockLevels: () => {
    const { createStockLevelsAPI } = require('./inventory/StockLevelsAPI');
    return APIFactory.getInstance().getAPI('stockLevels', createStockLevelsAPI);
  },
  dashboard: () => {
    const { createDashboardAPI } = require('./admin/DashboardAPI');
    return APIFactory.getInstance().getAPI('dashboard', createDashboardAPI);
  },
};
