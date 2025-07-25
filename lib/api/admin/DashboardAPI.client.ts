/**
 * Dashboard API Client-side implementation
 * 專門用於客戶端組件的 DashboardAPI
 */

import { DataAccessLayer } from '../core/DataAccessStrategy';
import { createClient } from '@/app/utils/supabase/client';

// Re-export types from main DashboardAPI
export type { DashboardWidgetData, DashboardParams, DashboardResult } from './DashboardAPI';

import type { DashboardWidgetData, DashboardParams, DashboardResult } from './DashboardAPI';

export class DashboardAPIClient extends DataAccessLayer<DashboardParams, DashboardResult> {
  constructor() {
    super('admin-dashboard-client');
  }

  /**
   * Client-side implementation - uses REST API
   */
  async clientFetch(params: DashboardParams): Promise<DashboardResult> {
    const queryParams = new URLSearchParams({
      widgets: params.widgetIds.join(','),
      ...(params.warehouse && { warehouse: params.warehouse }),
      ...(params.dateRange && {
        startDate: params.dateRange.start,
        endDate: params.dateRange.end,
      }),
    });

    const response = await fetch(`/api/admin/dashboard?${queryParams}`, {
      cache: 'no-store', // Dashboard data should be fresh
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }

    return response.json();
  }

  /**
   * Server-side implementation - not available in client
   */
  async serverFetch(params: DashboardParams): Promise<DashboardResult> {
    // In client components, fall back to clientFetch
    return this.clientFetch(params);
  }

  /**
   * Always use client-side for client components
   */
  protected isComplexQuery(): boolean {
    return false; // Use client-side by default
  }
}

// Factory function for client-side components
export function createDashboardAPIClient(): DashboardAPIClient {
  return new DashboardAPIClient();
}
