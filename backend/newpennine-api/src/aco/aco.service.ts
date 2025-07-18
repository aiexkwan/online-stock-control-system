import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AcoByDateQueryDto } from './dto/aco-by-date-query.dto';
import { AcoReferencesQueryDto } from './dto/aco-references-query.dto';
import {
  AcoByDateResponseDto,
  AcoReferencesResponseDto,
} from './dto/aco-responses.dto';

@Injectable()
export class AcoService {
  private readonly logger = new Logger(AcoService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * 按日期獲取 ACO 訂單
   */
  async getAcoByDate(query: AcoByDateQueryDto): Promise<AcoByDateResponseDto> {
    try {
      // 首先嘗試使用 RPC 函數
      const { data: rpcData, error: rpcError } = await this.supabaseService
        .getClient()
        .rpc('get_aco_orders_by_date', {
          order_date: query.orderDate,
          limit_count: query.limit,
          offset_count: query.offset,
        });

      if (!rpcError && rpcData) {
        this.logger.debug('Using RPC function for ACO orders by date');
        return {
          orderDate: query.orderDate,
          records: rpcData,
          total_records: rpcData.length,
          offset: query.offset || 0,
          limit: query.limit || 50,
        };
      }

      // Fallback to direct query
      this.logger.debug('Using direct query for ACO orders by date');
      const { data, error, count } = await this.supabaseService
        .getClient()
        .from('record_aco')
        .select(
          `
          aco_ref,
          order_date,
          product_description,
          product_code,
          product_quantity,
          supplier_name,
          status,
          created_at,
          updated_at
        `,
          { count: 'exact' },
        )
        .eq('order_date', query.orderDate)
        .order('created_at', { ascending: false })
        .range(
          query.offset || 0,
          (query.offset || 0) + (query.limit || 50) - 1,
        );

      if (error) {
        throw new Error(`Failed to fetch ACO orders by date: ${error.message}`);
      }

      return {
        orderDate: query.orderDate,
        records: data || [],
        total_records: count || 0,
        offset: query.offset || 0,
        limit: query.limit || 50,
      };
    } catch (error) {
      this.logger.error(
        'Error fetching ACO orders by date:',
        (error as Error).message,
      );
      throw error;
    }
  }

  /**
   * 獲取所有 ACO 參考號
   */
  async getAcoReferences(
    query: AcoReferencesQueryDto,
  ): Promise<AcoReferencesResponseDto> {
    try {
      // 首先嘗試使用 RPC 函數
      const { data: rpcData, error: rpcError } = await this.supabaseService
        .getClient()
        .rpc('get_aco_references', {
          limit_count: query.limit,
          offset_count: query.offset,
        });

      if (!rpcError && rpcData) {
        this.logger.debug('Using RPC function for ACO references');
        return {
          references: rpcData.map((item: Record<string, unknown>) => item.aco_ref),
          total: rpcData.length,
          offset: query.offset || 0,
          limit: query.limit || 50,
        };
      }

      // Fallback to direct query
      this.logger.debug('Using direct query for ACO references');
      const { data, error, count } = await this.supabaseService
        .getClient()
        .from('record_aco')
        .select('aco_ref', { count: 'exact' })
        .not('aco_ref', 'is', null)
        .order('aco_ref', { ascending: false })
        .range(
          query.offset || 0,
          (query.offset || 0) + (query.limit || 50) - 1,
        );

      if (error) {
        throw new Error(`Failed to fetch ACO references: ${error.message}`);
      }

      const uniqueRefs = [...new Set(data?.map((item) => item.aco_ref) || [])];

      return {
        references: uniqueRefs,
        total: count || 0,
        offset: query.offset || 0,
        limit: query.limit || 50,
      };
    } catch (error) {
      this.logger.error(
        'Error fetching ACO references:',
        (error as Error).message,
      );
      throw error;
    }
  }
}
