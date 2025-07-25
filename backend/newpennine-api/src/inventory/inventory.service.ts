import { Injectable } from '@nestjs/common';
import { DatabaseRecord } from '@/types/database/tables';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import {
  InventoryResponseDto,
  InventoryDetailResponseDto,
  InventoryDto,
  InventorySummaryResponseDto,
  InventorySummaryDto,
} from './dto/inventory-response.dto';
import { StockType } from './dto/inventory-query.dto';
import { StockDistributionQueryDto } from './dto/stock-distribution-query.dto';
import { StockDistributionResponseDto } from './dto/stock-distribution-response.dto';
import { StockLevelsQueryDto } from './dto/stock-levels-query.dto';
import {
  StockLevelsResponseDto,
  StockLevelItemDto,
} from './dto/stock-levels-response.dto';

@Injectable()
export class InventoryService {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  async getInventory(
    warehouse?: string,
    location?: string,
    productCode?: string,
    pltNum?: string,
    stockType?: StockType,
    minQty?: number,
    limit: number = 50,
    offset: number = 0,
  ): Promise<InventoryResponseDto> {
    try {
      if (!this.supabase) {
        return {
          data: [],
          total: 0,
          limit,
          offset,
          error: 'Database connection not available',
        };
      }

      // Build the query - removing non-existent columns
      let query = this.supabase.from('record_inventory').select(
        `
          plt_num,
          product_code,
          damage,
          latest_update,
          injection,
          pipeline,
          prebook,
          await,
          fold,
          bulk,
          backcarpark,
          await_grn,
          data_code!inner(
            description,
            colour,
            standard_qty
          )
        `,
        { count: 'exact' },
      );

      // Apply filters
      // Note: warehouse and location filters removed as these columns don't exist in record_inventory
      // TODO: Implement warehouse/location filtering using record_transfer table
      if (productCode) {
        query = query.eq('product_code', productCode);
      }
      if (pltNum) {
        query = query.eq('plt_num', pltNum);
      }

      // Stock type filter - using available columns
      if (stockType && stockType !== StockType.ALL) {
        if (stockType === StockType.DAMAGE) {
          query = query.gt('damage', 0);
        }
        // TODO: Implement GOOD stock type filtering using location-based logic
      }

      // Note: Minimum quantity filter removed as 'qty' column doesn't exist
      // TODO: Implement minimum quantity filtering using location-based totals

      // Apply pagination
      query = query
        .range(offset, offset + limit - 1)
        .order('warehouse', { ascending: true })
        .order('loc', { ascending: true });

      const { data, count, error } = await query;

      if (error) {
        console.error('Error fetching inventory:', error);
        throw error;
      }

      // Transform the data - mapping to available columns
      const transformedData: InventoryDto[] = (data || []).map(
        (item: Record<string, unknown>) => {
          // Calculate total quantity from all location columns
          const totalGoodQty =
            (item.injection || 0) +
            (item.pipeline || 0) +
            (item.prebook || 0) +
            (item.await || 0) +
            (item.fold || 0) +
            (item.bulk || 0) +
            (item.backcarpark || 0) +
            (item.await_grn || 0);

          return {
            id: item.uuid || item.plt_num, // Use UUID or plt_num as ID
            plt_num: item.plt_num,
            product_code: item.product_code,
            loc: 'Multiple', // Since we have multiple location columns
            warehouse: 'Main', // Default warehouse
            qty: totalGoodQty,
            damage: item.damage || 0,
            total_qty: totalGoodQty + (item.damage || 0),
            last_update: item.latest_update,
            product_description: item.data_code?.description,
            product_colour: item.data_code?.colour,
            product_unit: null, // Not available in data_code
            pallet_series: null, // Not joined in this query
            pallet_generate_time: null, // Not joined in this query
          };
        },
      );

      return {
        data: transformedData,
        total: count || 0,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error in getInventory:', error);
      throw error;
    }
  }

  async getInventoryById(id: number): Promise<InventoryDetailResponseDto> {
    try {
      if (!this.supabase) {
        throw new Error('Database connection not available');
      }

      // Get inventory record with related data
      const { data: inventoryData, error: inventoryError } = await this.supabase
        .from('record_inventory')
        .select(
          `
          *,
          data_code!inner(
            description,
            colour,
            standard_qty,
            unit,
            status
          ),
          record_palletinfo!inner(
            *
          )
        `,
        )
        .eq('id', id)
        .single();

      if (inventoryError) {
        console.error('Error fetching inventory:', inventoryError);
        throw inventoryError;
      }

      if (!inventoryData) {
        throw new Error('Inventory record not found');
      }

      // Get recent transfers for this pallet
      const { data: transfers, error: transferError } = await this.supabase
        .from('record_transfer')
        .select('*')
        .eq('plt_num', inventoryData.plt_num)
        .order('transfer_time', { ascending: false })
        .limit(10);

      if (transferError) {
        console.error('Error fetching transfers:', transferError);
      }

      // Get recent history for this pallet
      const { data: history, error: historyError } = await this.supabase
        .from('record_history')
        .select('*')
        .eq('plt_num', inventoryData.plt_num)
        .order('time', { ascending: false })
        .limit(10);

      if (historyError) {
        console.error('Error fetching history:', historyError);
      }

      // Transform and return the data
      return {
        id: inventoryData.id,
        plt_num: inventoryData.plt_num,
        product_code: inventoryData.product_code,
        loc: inventoryData.loc,
        warehouse: inventoryData.warehouse,
        qty: inventoryData.qty || 0,
        damage: inventoryData.damage || 0,
        total_qty: (inventoryData.qty || 0) + (inventoryData.damage || 0),
        last_update: inventoryData.last_update,
        product_description: inventoryData.data_code?.description,
        product_colour: inventoryData.data_code?.colour,
        product_unit: inventoryData.data_code?.unit,
        pallet_series: inventoryData.record_palletinfo?.series,
        pallet_generate_time: inventoryData.record_palletinfo?.generate_time,
        transfers: transfers || [],
        history: history || [],
        pallet_info: inventoryData.record_palletinfo || null,
      };
    } catch (error) {
      console.error('Error in getInventoryById:', error);
      throw error;
    }
  }

  async getInventorySummary(): Promise<InventorySummaryResponseDto> {
    try {
      if (!this.supabase) {
        return {
          data: [],
          error: 'Database connection not available',
        };
      }

      // Get inventory summary grouped by warehouse
      const { data, error } = await this.supabase.rpc(
        'get_inventory_summary_by_warehouse',
      );

      if (error) {
        console.error('Error fetching inventory summary:', error);
        throw error;
      }

      // If RPC doesn't exist, fall back to manual aggregation
      if (!data) {
        const { data: inventoryData, error: fallbackError } =
          await this.supabase
            .from('record_inventory')
            .select('warehouse, loc, plt_num, product_code, qty, damage');

        if (fallbackError) {
          console.error('Error fetching inventory data:', fallbackError);
          throw fallbackError;
        }

        // Manual aggregation
        const summaryMap = new Map<string, InventorySummaryDto>();

        inventoryData?.forEach((item: DatabaseRecord) => {
          const key = item.warehouse;
          if (!summaryMap.has(key)) {
            summaryMap.set(key, {
              warehouse: key,
              total_locations: new Set(),
              total_pallets: new Set(),
              total_good_qty: 0,
              total_damage_qty: 0,
              total_qty: 0,
              products_count: new Set(),
            } as any);
          }

          const summary = summaryMap.get(key);
          (summary as any).total_locations.add(item.loc);
          (summary as any).total_pallets.add(item.plt_num);
          (summary as any).products_count.add(item.product_code);
          summary.total_good_qty += item.qty || 0;
          summary.total_damage_qty += item.damage || 0;
          summary.total_qty += (item.qty || 0) + (item.damage || 0);
        });

        const summaryData: InventorySummaryDto[] = Array.from(
          summaryMap.values(),
        ).map((summary) => ({
          warehouse: summary.warehouse,
          total_locations: (summary as any).total_locations.size,
          total_pallets: (summary as any).total_pallets.size,
          total_good_qty: summary.total_good_qty,
          total_damage_qty: summary.total_damage_qty,
          total_qty: summary.total_qty,
          products_count: (summary as any).products_count.size,
        }));

        return {
          data: summaryData,
        };
      }

      return {
        data: data as InventorySummaryDto[],
      };
    } catch (error) {
      console.error('Error in getInventorySummary:', error);
      throw error;
    }
  }

  async getStockDistribution(
    query: StockDistributionQueryDto,
  ): Promise<StockDistributionResponseDto> {
    try {
      if (!this.supabase) {
        return {
          data: [],
          total: 0,
          offset: query.offset || 0,
          limit: query.limit || 50,
        };
      }

      // 首先嘗試使用 RPC 函數（如果存在）
      const { data: rpcData, error: rpcError } = await this.supabase.rpc(
        'get_stock_distribution',
        {
          limit_count: query.limit,
          offset_count: query.offset,
        },
      );

      if (!rpcError && rpcData) {
        console.log('Using RPC function for stock distribution');
        return {
          data: rpcData,
          total: rpcData.length,
          offset: query.offset || 0,
          limit: query.limit || 50,
        };
      }

      // Fallback to direct query
      console.log('Using direct query for stock distribution');
      const { data, error, count } = await this.supabase
        .from('record_inventory')
        .select(
          `
          product_code,
          injection,
          pipeline,
          prebook,
          await,
          fold,
          bulk,
          await_grn,
          backcarpark,
          data_code!inner(
            description,
            colour,
            type
          )
        `,
          { count: 'exact' },
        )
        .order('product_code')
        .range(
          query.offset || 0,
          (query.offset || 0) + (query.limit || 50) - 1,
        );

      if (error) {
        console.error('Error fetching stock distribution:', error);
        throw error;
      }

      // Transform the data
      const transformedData = (data || []).map(
        (item: Record<string, unknown>) => ({
          product_code: item.product_code,
          injection: item.injection || 0,
          pipeline: item.pipeline || 0,
          prebook: item.prebook || 0,
          await: item.await || 0,
          fold: item.fold || 0,
          bulk: item.bulk || 0,
          await_grn: item.await_grn || 0,
          backcarpark: item.backcarpark || 0,
          data_code: {
            description: item.data_code?.description,
            colour: item.data_code?.colour,
            type: item.data_code?.type,
          },
        }),
      );

      return {
        data: transformedData,
        total: count || 0,
        offset: query.offset || 0,
        limit: query.limit || 50,
      };
    } catch (error) {
      console.error('Error in getStockDistribution:', error);
      throw error;
    }
  }

  async getStockLevels(
    query: StockLevelsQueryDto,
  ): Promise<StockLevelsResponseDto> {
    try {
      if (!this.supabase) {
        return {
          stockLevels: [],
          totalItems: 0,
          timestamp: new Date().toISOString(),
          dataSource: 'record_inventory',
          error: 'Database connection not available',
        };
      }

      // Build query with joins to get product information
      let dbQuery = this.supabase.from('record_inventory').select(
        `
          product_code,
          injection,
          pipeline,
          prebook,
          await,
          fold,
          bulk,
          await_grn,
          backcarpark,
          latest_update,
          data_code!inner(
            description,
            type
          )
        `,
        { count: 'exact' },
      );

      // Apply filters
      if (query.productType) {
        dbQuery = dbQuery.eq('data_code.type', query.productType);
      }

      if (query.productCode) {
        dbQuery = dbQuery.eq('product_code', query.productCode);
      }

      // Apply stock level filters
      if (query.minStockLevel !== undefined) {
        // Calculate total stock and filter by minimum
        dbQuery = dbQuery.gte('injection', query.minStockLevel);
      }

      if (query.maxStockLevel !== undefined) {
        // Calculate total stock and filter by maximum
        dbQuery = dbQuery.lte('injection', query.maxStockLevel);
      }

      // Apply pagination
      const limit = query.limit || 100;
      const offset = query.offset || 0;

      dbQuery = dbQuery
        .range(offset, offset + limit - 1)
        .order('product_code', { ascending: true });

      const { data, count, error } = await dbQuery;

      if (error) {
        console.error('Error fetching stock levels:', error);
        throw error;
      }

      // Transform the data
      const stockLevels: StockLevelItemDto[] = (data || []).map(
        (item: Record<string, unknown>) => {
          const totalStock =
            (item.injection || 0) +
            (item.pipeline || 0) +
            (item.prebook || 0) +
            (item.await || 0) +
            (item.fold || 0) +
            (item.bulk || 0) +
            (item.await_grn || 0) +
            (item.backcarpark || 0);

          return {
            productCode: item.product_code,
            productDescription: item.data_code?.description,
            productType: item.data_code?.type,
            stockLevel: totalStock,
            lastUpdated: item.latest_update,
            location: 'Multi-Location', // Since we're aggregating across locations
          };
        },
      );

      return {
        stockLevels,
        totalItems: count || 0,
        timestamp: new Date().toISOString(),
        dataSource: 'record_inventory',
      };
    } catch (error) {
      console.error('Error in getStockLevels:', error);
      return {
        stockLevels: [],
        totalItems: 0,
        timestamp: new Date().toISOString(),
        dataSource: 'record_inventory',
        error: (error as Error).message,
      };
    }
  }
}
