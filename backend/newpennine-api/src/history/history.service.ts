import { Injectable, Logger } from '@nestjs/common';
import { DatabaseRecord } from '@/types/database/tables';
import { SupabaseService } from '../supabase/supabase.service';
import { HistoryQueryDto } from './dto/history-query.dto';
import {
  HistoryResponseDto,
  HistoryRecordDto,
} from './dto/history-response.dto';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getHistory(query: HistoryQueryDto): Promise<HistoryResponseDto> {
    const { page = 1, limit = 20, sortBy = 'time', sortOrder = 'desc' } = query;
    const offset = (page - 1) * limit;

    try {
      const supabase = this.supabaseService.getClient();

      // Build the base query - remove the join for now as it's causing schema cache issues
      let baseQuery = supabase
        .from('record_history')
        .select('*', { count: 'exact' });

      // Apply filters
      if (query.userId) {
        baseQuery = baseQuery.eq('user_id', query.userId);
      }

      if (query.palletId) {
        baseQuery = baseQuery.eq('pallet_id', query.palletId);
      }

      if (query.productCode) {
        baseQuery = baseQuery.eq('product_code', query.productCode);
      }

      if (query.action) {
        baseQuery = baseQuery.eq('action', query.action);
      }

      if (query.location) {
        baseQuery = baseQuery.eq('location', query.location);
      }

      if (query.startDate) {
        baseQuery = baseQuery.gte('time', query.startDate);
      }

      if (query.endDate) {
        baseQuery = baseQuery.lte('time', query.endDate);
      }

      if (query.search) {
        baseQuery = baseQuery.or(
          `description.ilike.%${query.search}%,action.ilike.%${query.search}%`,
        );
      }

      // Apply sorting
      baseQuery = baseQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const { data, error, count } = await baseQuery.range(
        offset,
        offset + limit - 1,
      );

      if (error) {
        this.logger.error('Error fetching history records:', error);
        throw new Error(`Failed to fetch history records: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / limit);
      const hasNext = page < totalPages;
      const hasPrevious = page > 1;

      // Transform data to match DTO
      const transformedData: HistoryRecordDto[] =
        data?.map((record) => ({
          id: record.id,
          userId: record.user_id,
          username: record.data_id?.username || null,
          palletId: record.pallet_id,
          productCode: record.product_code,
          productName: record.product_name,
          action: record.action,
          location: record.location,
          quantity: record.quantity,
          weight: record.weight,
          description: record.description,
          previousState: record.previous_state,
          newState: record.new_state,
          metadata: record.metadata,
          timestamp: record.time,
          createdAt: record.created_at,
          updatedAt: record.updated_at,
        })) || [];

      return {
        data: transformedData,
        total: count || 0,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrevious,
      };
    } catch (error) {
      this.logger.error('Error in getHistory:', error);
      throw error;
    }
  }

  async getHistoryByPalletId(palletId: string): Promise<HistoryRecordDto[]> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('record_history')
        .select(
          `
          *,
          data_id!record_history_user_id_fkey (
            username
          )
        `,
        )
        .eq('pallet_id', palletId)
        .order('time', { ascending: false });

      if (error) {
        this.logger.error(
          `Error fetching history for pallet ${palletId}:`,
          error,
        );
        throw new Error(`Failed to fetch history for pallet: ${error.message}`);
      }

      return (
        data?.map((record) => ({
          id: record.id,
          userId: record.user_id,
          username: record.data_id?.username || null,
          palletId: record.pallet_id,
          productCode: record.product_code,
          productName: record.product_name,
          action: record.action,
          location: record.location,
          quantity: record.quantity,
          weight: record.weight,
          description: record.description,
          previousState: record.previous_state,
          newState: record.new_state,
          metadata: record.metadata,
          timestamp: record.time,
          createdAt: record.created_at,
          updatedAt: record.updated_at,
        })) || []
      );
    } catch (error) {
      this.logger.error('Error in getHistoryByPalletId:', error);
      throw error;
    }
  }

  async getHistoryByUserId(userId: string): Promise<HistoryRecordDto[]> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase
        .from('record_history')
        .select(
          `
          *,
          data_id!record_history_user_id_fkey (
            username
          )
        `,
        )
        .eq('user_id', userId)
        .order('time', { ascending: false });

      if (error) {
        this.logger.error(`Error fetching history for user ${userId}:`, error);
        throw new Error(`Failed to fetch history for user: ${error.message}`);
      }

      return (
        data?.map((record) => ({
          id: record.id,
          userId: record.user_id,
          username: record.data_id?.username || null,
          palletId: record.pallet_id,
          productCode: record.product_code,
          productName: record.product_name,
          action: record.action,
          location: record.location,
          quantity: record.quantity,
          weight: record.weight,
          description: record.description,
          previousState: record.previous_state,
          newState: record.new_state,
          metadata: record.metadata,
          timestamp: record.time,
          createdAt: record.created_at,
          updatedAt: record.updated_at,
        })) || []
      );
    } catch (error) {
      this.logger.error('Error in getHistoryByUserId:', error);
      throw error;
    }
  }

  async createHistoryRecord(
    userId: string,
    action: string,
    data: Partial<{
      palletId: string;
      productCode: string;
      productName: string;
      location: string;
      quantity: number;
      weight: number;
      description: string;
      previousState: Record<string, unknown>;
      newState: Record<string, unknown>;
      metadata: DatabaseRecord[];
    }>,
  ): Promise<HistoryRecordDto> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data: result, error } = await supabase
        .from('record_history')
        .insert({
          user_id: userId,
          action,
          pallet_id: data.palletId,
          product_code: data.productCode,
          product_name: data.productName,
          location: data.location,
          quantity: data.quantity,
          weight: data.weight,
          description: data.description,
          previous_state: data.previousState,
          new_state: data.newState,
          metadata: data.metadata,
          time: new Date().toISOString(),
        })
        .select(
          `
          *,
          data_id!record_history_user_id_fkey (
            username
          )
        `,
        )
        .single();

      if (error) {
        this.logger.error('Error creating history record:', error);
        throw new Error(`Failed to create history record: ${error.message}`);
      }

      return {
        id: result.id,
        userId: result.user_id,
        username: result.data_id?.username || null,
        palletId: result.pallet_id,
        productCode: result.product_code,
        productName: result.product_name,
        action: result.action,
        location: result.location,
        quantity: result.quantity,
        weight: result.weight,
        description: result.description,
        previousState: result.previous_state,
        newState: result.new_state,
        metadata: result.metadata,
        timestamp: result.time,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      };
    } catch (error) {
      this.logger.error('Error in createHistoryRecord:', error);
      throw error;
    }
  }
}
