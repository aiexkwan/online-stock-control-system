import { Injectable, Logger } from '@nestjs/common';
import { DatabaseRecord } from '@/types/database/tables';
import { SupabaseService } from '../supabase/supabase.service';
import {
  AwaitLocationCountQueryDto,
  StockLevelHistoryQueryDto,
} from './dto/rpc-query.dto';
import {
  AwaitLocationCountResponseDto,
  StockLevelHistoryResponseDto,
  RpcResponseDto,
} from './dto/rpc-response.dto';
import {
  RpcData,
  RpcResult,
  safeParseRpcData,
  validateRpcResult,
  SafeDatabaseValue,
  safeParseDatabaseValue,
} from '@/lib/validation/zod-schemas';
import { z } from 'zod';

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

  private calculateSummary(historyData: Record<string, SafeDatabaseValue>[]): {
    totalRecords: number;
    averageLevel: number;
    maxLevel: number;
    minLevel: number;
    dateRange: {
      start: string;
      end: string;
    };
  } {
    if (!historyData || historyData.length === 0) {
      return {
        totalRecords: 0,
        averageLevel: 0,
        maxLevel: 0,
        minLevel: 0,
        dateRange: {
          start: new Date(0).toISOString(),
          end: new Date().toISOString(),
        },
      };
    }

    // 安全取得数值，使用 Zod 驗證
    const levels = historyData
      .map((item) => safeParseDatabaseValue(item.stockLevel))
      .filter((level): level is number => typeof level === 'number');
    
    const dates = historyData
      .map((item) => safeParseDatabaseValue(item.date))
      .filter((date): date is string => typeof date === 'string')
      .map(dateStr => new Date(dateStr).getTime())
      .filter(timestamp => !isNaN(timestamp));

    if (levels.length === 0 || dates.length === 0) {
      return {
        totalRecords: historyData.length,
        averageLevel: 0,
        maxLevel: 0,
        minLevel: 0,
        dateRange: {
          start: new Date(0).toISOString(),
          end: new Date().toISOString(),
        },
      };
    }

    return {
      totalRecords: historyData.length,
      averageLevel: levels.reduce((sum, level) => sum + level, 0) / levels.length,
      maxLevel: Math.max(...levels),
      minLevel: Math.min(...levels),
      dateRange: {
        start: new Date(Math.min(...dates)).toISOString(),
        end: new Date(Math.max(...dates)).toISOString(),
      },
    };
  }

  async callRpcFunction(
    functionName: string,
    params: DatabaseRecord = {},
  ): Promise<RpcData> {
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

      // 使用 Zod 驗證返回数据
      const validatedData = safeParseRpcData(data);
      if (validatedData === null) {
        this.logger.warn(`RPC function ${functionName} returned invalid data type:`, typeof data);
        throw new Error(`Invalid data type returned from RPC function: ${functionName}`);
      }

      return validatedData;
    } catch (error) {
      this.logger.error(`Error in callRpcFunction (${functionName}):`, error);
      throw error;
    }
  }
}
