import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { TransfersQueryDto } from './dto/transfers-query.dto';
import {
  TransferResponseDto,
  TransfersListResponseDto,
} from './dto/transfer-response.dto';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  async getTransfers(
    query: TransfersQueryDto,
  ): Promise<TransfersListResponseDto> {
    try {
      if (!this.supabase) {
        throw new Error('Database connection not available');
      }

      const {
        palletId,
        productCode,
        fromLocation,
        toLocation,
        status,
        userId,
        fromDate,
        toDate,
        page,
        limit,
        sortBy,
        sortOrder,
        search,
      } = query;

      // Build the base query
      let countQuery = this.supabase
        .from('record_transfer')
        .select('*', { count: 'exact', head: true });

      let dataQuery = this.supabase.from('record_transfer').select(`
          plt_num,
          f_loc,
          t_loc,
          operator_id,
          tran_date,
          uuid
        `);

      // Apply filters to both queries
      const applyFilters = (query: any) => {
        if (palletId) {
          query = query.eq('plt_num', palletId);
        }

        // Note: product_code is not directly available in record_transfer
        // It would need to be joined from record_palletinfo

        if (fromLocation) {
          query = query.eq('f_loc', fromLocation);
        }

        if (toLocation) {
          query = query.eq('t_loc', toLocation);
        }

        // Note: status field doesn't exist in record_transfer

        if (userId) {
          query = query.eq('operator_id', userId);
        }

        if (fromDate) {
          query = query.gte('tran_date', fromDate);
        }

        if (toDate) {
          query = query.lte('tran_date', toDate);
        }

        if (search) {
          query = query.or(`plt_num.ilike.%${search}%`);
        }

        return query;
      };

      // Apply filters to both queries
      countQuery = applyFilters(countQuery);
      dataQuery = applyFilters(dataQuery);

      // Get total count
      const { count } = await countQuery;
      const totalCount = count || 0;

      // Apply sorting
      const sortField = this.mapSortField(sortBy);
      dataQuery = dataQuery.order(sortField, {
        ascending: sortOrder === 'asc',
      });

      // Apply pagination
      const offset = (page - 1) * limit;
      dataQuery = dataQuery.range(offset, offset + limit - 1);

      // Execute query
      const { data: transfers, error } = await dataQuery;

      if (error) {
        this.logger.error('Error fetching transfers:', error);
        throw error;
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrevious = page > 1;

      // Map to response DTOs
      const items: TransferResponseDto[] = (transfers || []).map((transfer) => {
        const result: any = {
          id: transfer.uuid,
          palletId: transfer.plt_num,
          productCode: '', // Will need to join with record_palletinfo to get this
          quantity: 0, // Not available in record_transfer
          fromLocation: transfer.f_loc,
          toLocation: transfer.t_loc,
          status: 'completed', // Default since not in table
          userId: transfer.operator_id,
          transferDate: new Date(transfer.tran_date),
          notes: '', // Not available in record_transfer
          createdAt: new Date(transfer.tran_date), // Using tran_date as created_at
          updatedAt: new Date(transfer.tran_date), // Using tran_date as updated_at
        };

        // Only add optional properties if they have values
        if ((transfer as any).product_name) {
          result.productName = (transfer as any).product_name;
        }

        if ((transfer as any).user_name) {
          result.userName = (transfer as any).user_name;
        }

        return result as TransferResponseDto;
      });

      return {
        items,
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrevious,
      };
    } catch (error) {
      this.logger.error('Error fetching transfers:', error);
      throw error;
    }
  }

  private mapSortField(sortBy: string): string {
    const fieldMap: Record<string, string> = {
      created_at: 'tran_date',
      updated_at: 'tran_date',
      transfer_date: 'tran_date',
      quantity: 'tran_date', // No quantity field, using tran_date as fallback
    };

    return fieldMap[sortBy] || 'tran_date';
  }
}
