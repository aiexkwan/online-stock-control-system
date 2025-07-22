/**
 * Unified Pallet Service
 * Consolidates pallet search and management logic from multiple sources
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { IPalletService } from '../interfaces/IPalletService';
import {
  PalletInfo,
  PalletInfoWithLocation,
  PalletSearchResult,
  VoidPalletDto,
  HistoryRecord,
  InventoryFilter,
} from '../types';
import { LocationMapper, DatabaseLocationColumn } from '../utils/locationMapper';
import { validatePalletNumber } from '../utils/validators';

export class PalletService implements IPalletService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Search for a pallet by series or pallet number
   * Consolidates logic from palletSearchService.ts and various hooks
   */
  async search(searchType: 'series' | 'pallet_num', value: string): Promise<PalletSearchResult> {
    const startTime = Date.now();

    try {
      if (!value?.trim()) {
        return {
          pallet: null,
          error: 'Search value is required',
          searchTime: Date.now() - startTime,
        };
      }

      const trimmedValue = value.trim();

      // Query pallet info
      const { data: palletData, error: palletError } = await this.supabase
        .from('record_palletinfo')
        .select('*')
        .eq(searchType === 'series' ? 'series' : 'plt_num', trimmedValue)
        .single();

      if (palletError || !palletData) {
        return {
          pallet: null,
          error: palletError?.message || 'Pallet not found',
          searchTime: Date.now() - startTime,
        };
      }

      // Get current location from history
      const location = await this.getCurrentLocation(palletData.plt_num);

      // Check if voided
      const isVoided = await this.checkIfVoided(palletData.plt_num);

      const result: PalletInfoWithLocation = {
        ...palletData,
        location: location || undefined,
        locationDisplay: location ? LocationMapper.getDisplayName(location) : undefined,
        is_voided: isVoided,
      };

      return {
        pallet: result,
        searchTime: Date.now() - startTime,
      };
    } catch (error: unknown) {
      console.error('[PalletService] Search error:', error);
      return {
        pallet: null,
        error: error instanceof Error ? error.message : 'Search failed',
        searchTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Search pallets by product code
   */
  async searchByProductCode(productCode: string): Promise<PalletInfo[]> {
    try {
      const { data, error } = await this.supabase
        .from('record_palletinfo')
        .select('*')
        .eq('product_code', productCode)
        .order('generate_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: unknown) {
      console.error('[PalletService] Search by product code error:', error);
      return [];
    }
  }

  /**
   * Search pallets by location
   */
  async searchByLocation(location: string): Promise<PalletInfoWithLocation[]> {
    try {
      const dbColumn = LocationMapper.toDbColumn(location);
      if (!dbColumn) {
        throw new Error(`Invalid location: ${location}`);
      }

      // This requires a more complex query to get pallets at a specific location
      // Would need to join with inventory records
      const { data, error } = await this.supabase
        .from('record_inventory')
        .select(
          `
          plt_num,
          record_palletinfo!inner(*)
        `
        )
        .gt(dbColumn, 0)
        .order('latest_update', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => {
        const palletInfo = Array.isArray(item.record_palletinfo)
          ? item.record_palletinfo[0]
          : item.record_palletinfo;

        return {
          ...palletInfo,
          location: location,
          locationDisplay: LocationMapper.getDisplayName(location),
        };
      });
    } catch (error: unknown) {
      console.error('[PalletService] Search by location error:', error);
      return [];
    }
  }

  /**
   * Create a new pallet record
   */
  async create(data: Partial<PalletInfo>): Promise<PalletInfo> {
    try {
      if (!data.plt_num || !data.product_code || !data.series) {
        throw new Error('Missing required fields: plt_num, product_code, series');
      }

      const { data: newPallet, error } = await this.supabase
        .from('record_palletinfo')
        .insert([
          {
            ...data,
            generate_time: data.generate_time || new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return newPallet;
    } catch (error: unknown) {
      console.error('[PalletService] Create error:', error);
      throw error;
    }
  }

  /**
   * Update pallet information
   */
  async update(palletNum: string, data: Partial<PalletInfo>): Promise<PalletInfo> {
    try {
      const { data: updated, error } = await this.supabase
        .from('record_palletinfo')
        .update(data)
        .eq('plt_num', palletNum)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } catch (error: unknown) {
      console.error('[PalletService] Update error:', error);
      throw error;
    }
  }

  /**
   * Delete a pallet (not recommended - use void instead)
   */
  async delete(palletNum: string): Promise<void> {
    throw new Error('Direct deletion not allowed. Use void() instead.');
  }

  /**
   * Check if pallet exists
   */
  async exists(palletNum: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('record_palletinfo')
        .select('plt_num')
        .eq('plt_num', palletNum)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate pallet and return its info
   */
  async validate(
    palletNum: string
  ): Promise<{ valid: boolean; pallet?: PalletInfo; error?: string }> {
    try {
      if (!validatePalletNumber(palletNum)) {
        return { valid: false, error: 'Invalid pallet number format' };
      }

      const { pallet, error } = await this.search('pallet_num', palletNum);

      if (error || !pallet) {
        return { valid: false, error: error || 'Pallet not found' };
      }

      // Check if pallet is voided by looking at history
      const isVoided = await this.checkIfVoided(palletNum);
      if (isVoided) {
        return { valid: false, error: 'Pallet has been voided', pallet };
      }

      return { valid: true, pallet };
    } catch (error: unknown) {
      return { valid: false, error: error instanceof Error ? error.message : 'Validation failed' };
    }
  }

  /**
   * Void a pallet
   */
  async void(data: VoidPalletDto): Promise<void> {
    // This would typically be handled by a separate void operation
    // that updates inventory and creates history records
    throw new Error('Void operation should use UnifiedInventoryService.voidPallet()');
  }

  /**
   * Get pallet history
   */
  async getHistory(palletNum: string, limit: number = 50): Promise<HistoryRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('record_history')
        .select('*')
        .eq('plt_num', palletNum)
        .order('time', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error: unknown) {
      console.error('[PalletService] Get history error:', error);
      return [];
    }
  }

  /**
   * Get current location of a pallet
   */
  async getCurrentLocation(palletNum: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('record_history')
        .select('loc')
        .eq('plt_num', palletNum)
        .order('time', { ascending: false })
        .limit(1)
        .single();

      if (error || !data?.loc) return null;

      // Convert DB column to standard location if needed
      const standardLocation = LocationMapper.fromDbColumn(data.loc as DatabaseLocationColumn);
      return standardLocation;
    } catch (error) {
      console.error('[PalletService] Get current location error:', error);
      return null;
    }
  }

  /**
   * Search multiple pallets at once
   */
  async searchMultiple(palletNums: string[]): Promise<Map<string, PalletInfo>> {
    try {
      if (!palletNums.length) return new Map();

      const { data, error } = await this.supabase
        .from('record_palletinfo')
        .select('*')
        .in('plt_num', palletNums);

      if (error) throw error;

      const resultMap = new Map<string, PalletInfo>();
      (data || []).forEach(pallet => {
        resultMap.set(pallet.plt_num, pallet);
      });

      return resultMap;
    } catch (error: unknown) {
      console.error('[PalletService] Search multiple error:', error);
      return new Map();
    }
  }

  /**
   * Validate multiple pallets at once
   */
  async validateMultiple(palletNums: string[]): Promise<Map<string, boolean>> {
    try {
      const pallets = await this.searchMultiple(palletNums);
      const resultMap = new Map<string, boolean>();

      for (const palletNum of palletNums) {
        const pallet = pallets.get(palletNum);
        if (!pallet) {
          resultMap.set(palletNum, false);
          continue;
        }

        // Check if voided using history
        const isVoided = await this.checkIfVoided(palletNum);
        resultMap.set(palletNum, !isVoided);
      }

      return resultMap;
    } catch (error: unknown) {
      console.error('[PalletService] Validate multiple error:', error);
      return new Map();
    }
  }

  /**
   * Check if pallet is voided
   * Private helper method
   */
  private async checkIfVoided(palletNum: string): Promise<boolean> {
    try {
      const history = await this.getHistory(palletNum, 1);
      return history.some(
        record =>
          record.action.toLowerCase().includes('void') ||
          record.action.toLowerCase().includes('damage')
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Create pallet alias for create method
   */
  async createPallet(data: Partial<PalletInfo>): Promise<PalletInfo> {
    return this.create(data);
  }

  /**
   * Get pallet history alias for getHistory method
   */
  async getPalletHistory(palletNum: string, limit?: number): Promise<HistoryRecord[]> {
    return this.getHistory(palletNum, limit || 50);
  }

  /**
   * Get pallets by filter
   */
  async getByFilter(filter: InventoryFilter): Promise<PalletInfoWithLocation[]> {
    try {
      let query = this.supabase.from('record_palletinfo').select('*');

      if (filter.productCodes?.length) {
        query = query.in('product_code', filter.productCodes);
      }

      if (filter.dateFrom) {
        query = query.gte('generate_time', filter.dateFrom);
      }

      if (filter.dateTo) {
        query = query.lte('generate_time', filter.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(pallet => ({
        ...pallet,
        locationDisplay: 'Unknown Location', // Would need to join with inventory to get actual location
      }));
    } catch (error: unknown) {
      console.error('[PalletService] Get by filter error:', error);
      return [];
    }
  }
}
