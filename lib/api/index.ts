/**
 * Unified API Entry Point
 * Central registry for all data access APIs
 */

// Core exports
import { DataAccessLayer as DataAccessLayerBase } from './core/DataAccessStrategy';
export { DataAccessLayerBase as DataAccessLayer };
export { DataAccessMetricsManager, type DataAccessConfig } from './core/DataAccessStrategy';

// Inventory APIs
export { StockLevelsAPI, createStockLevelsAPI, useStockLevels } from './inventory/StockLevelsAPI';

// Admin APIs
export { DashboardAPI, createDashboardAPI } from './admin/DashboardAPI';

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
  private apis: Map<string, DataAccessLayerBase<Record<string, unknown>, Record<string, unknown>>> =
    new Map();

  static getInstance(): APIFactory {
    if (!this.instance) {
      this.instance = new APIFactory();
    }
    return this.instance;
  }

  /**
   * Get or create an API instance
   */
  getAPI<T extends DataAccessLayerBase<Record<string, unknown>, Record<string, unknown>>>(
    type: 'stockLevels' | 'dashboard' | string,
    factory: () => T
  ): T {
    if (!this.apis.has(type)) {
      this.apis.set(type, factory());
    }
    return this.apis.get(type) as T;
  }

  /**
   * Get or create an API instance with typed parameters
   */
  getTypedAPI<TParams extends Record<string, unknown>, TResult extends Record<string, unknown>>(
    type: string,
    factory: () => DataAccessLayerBase<TParams, TResult>
  ): DataAccessLayerBase<TParams, TResult> {
    if (!this.apis.has(type)) {
      this.apis.set(
        type,
        factory() as DataAccessLayerBase<Record<string, unknown>, Record<string, unknown>>
      );
    }
    return this.apis.get(type) as DataAccessLayerBase<TParams, TResult>;
  }

  /**
   * Get or create an API instance (legacy method for backward compatibility)
   */
  getLegacyAPI<T extends DataAccessLayerBase<Record<string, unknown>, Record<string, unknown>>>(
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

// Import modules statically to avoid webpack originalFactory.call issues
import { createStockLevelsAPI } from './inventory/StockLevelsAPI';
import { createDashboardAPI } from './admin/DashboardAPI';

// Convenience methods with static imports
export const api = {
  stockLevels: () => {
    return APIFactory.getInstance().getAPI(
      'stockLevels',
      createStockLevelsAPI as unknown as () => DataAccessLayerBase<
        Record<string, unknown>,
        Record<string, unknown>
      >
    );
  },
  dashboard: () => {
    return APIFactory.getInstance().getAPI(
      'dashboard',
      createDashboardAPI as unknown as () => DataAccessLayerBase<
        Record<string, unknown>,
        Record<string, unknown>
      >
    );
  },
};
