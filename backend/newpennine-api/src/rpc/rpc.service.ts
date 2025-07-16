import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  AwaitLocationCountQueryDto,
  StockLevelHistoryQueryDto,
} from './dto/rpc-query.dto';
import {
  AwaitLocationCountResponseDto,
  StockLevelHistoryResponseDto,
} from './dto/rpc-response.dto';

@Injectable()
export class RpcService {
  private readonly logger = new Logger(RpcService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getAwaitLocationCount(
    query: AwaitLocationCountQueryDto,
  ): Promise<AwaitLocationCountResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log('Calling await_location_count RPC function');

      const { data, error } = await this.supabaseService
        .getClient()
        .rpc('rpc_get_await_location_count', {});

      if (error) {
        this.logger.error('Error calling await_location_count:', error);
        throw new Error(`RPC Error: ${error.message}`);
      }

      const executionTime = Date.now() - startTime;
      this.logger.log(`await_location_count executed in ${executionTime}ms`);

      // Process the response data based on the actual RPC function response
      const response: AwaitLocationCountResponseDto = {
        count: data?.await_count || 0,
        locations: [], // The optimized RPC doesn't return location breakdown
        lastUpdated: data?.calculation_time || new Date().toISOString(),
      };

      return response;
    } catch (error) {
      this.logger.error('Error in getAwaitLocationCount:', error);
      throw error;
    }
  }

  async getStockLevelHistory(
    query: StockLevelHistoryQueryDto,
  ): Promise<StockLevelHistoryResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log('Calling stock_level_history RPC function');

      const { data, error } = await this.supabaseService
        .getClient()
        .rpc('stock_level_history', {
          p_product_code: query.productCode || null,
          p_start_date: query.startDate || null,
          p_end_date: query.endDate || null,
          p_location: query.location || null,
          p_limit: query.limit || 100,
        });

      if (error) {
        this.logger.error('Error calling stock_level_history:', error);
        throw new Error(`RPC Error: ${error.message}`);
      }

      const executionTime = Date.now() - startTime;
      this.logger.log(`stock_level_history executed in ${executionTime}ms`);

      // Process the response data
      const historyData = data?.history || [];
      const summary = this.calculateSummary(historyData);

      const response: StockLevelHistoryResponseDto = {
        productCode: query.productCode || 'ALL',
        history: historyData,
        summary,
      };

      return response;
    } catch (error) {
      this.logger.error('Error in getStockLevelHistory:', error);
      throw error;
    }
  }

  private calculateSummary(historyData: any[]): any {
    if (!historyData || historyData.length === 0) {
      return {
        totalRecords: 0,
        averageLevel: 0,
        maxLevel: 0,
        minLevel: 0,
        dateRange: {
          start: null,
          end: null,
        },
      };
    }

    const levels = historyData.map((item) => item.stockLevel);
    const dates = historyData.map((item) => item.date);

    return {
      totalRecords: historyData.length,
      averageLevel:
        levels.reduce((sum, level) => sum + level, 0) / levels.length,
      maxLevel: Math.max(...levels),
      minLevel: Math.min(...levels),
      dateRange: {
        start: Math.min(...dates.map((d) => new Date(d).getTime())),
        end: Math.max(...dates.map((d) => new Date(d).getTime())),
      },
    };
  }

  async callRpcFunction(functionName: string, params: any = {}): Promise<any> {
    const startTime = Date.now();

    try {
      this.logger.log(`Calling RPC function: ${functionName}`);

      const { data, error } = await this.supabaseService
        .getClient()
        .rpc(functionName, params);

      if (error) {
        this.logger.error(`Error calling ${functionName}:`, error);
        throw new Error(`RPC Error: ${error.message}`);
      }

      const executionTime = Date.now() - startTime;
      this.logger.log(`${functionName} executed in ${executionTime}ms`);

      return data;
    } catch (error) {
      this.logger.error(`Error in callRpcFunction (${functionName}):`, error);
      throw error;
    }
  }
}
