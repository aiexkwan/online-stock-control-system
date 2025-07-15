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
          id,
          pallet_id,
          product_code,
          quantity,
          from_location,
          to_location,
          status,
          user_id,
          transfer_date,
          notes,
          created_at,
          updated_at
        `);

      // Apply filters to both queries
      const applyFilters = (query: any) => {
        if (palletId) {
          query = query.eq('pallet_id', palletId);
        }

        if (productCode) {
          query = query.eq('product_code', productCode);
        }

        if (fromLocation) {
          query = query.eq('from_location', fromLocation);
        }

        if (toLocation) {
          query = query.eq('to_location', toLocation);
        }

        if (status) {
          query = query.eq('status', status);
        }

        if (userId) {
          query = query.eq('user_id', userId);
        }

        if (fromDate) {
          query = query.gte('transfer_date', fromDate);
        }

        if (toDate) {
          query = query.lte('transfer_date', toDate);
        }

        if (search) {
          query = query.or(
            `pallet_id.ilike.%${search}%,product_code.ilike.%${search}%`,
          );
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
          id: transfer.id,
          palletId: transfer.pallet_id,
          productCode: transfer.product_code,
          quantity: transfer.quantity,
          fromLocation: transfer.from_location,
          toLocation: transfer.to_location,
          status: transfer.status || 'completed',
          userId: transfer.user_id,
          transferDate: new Date(transfer.transfer_date),
          notes: transfer.notes,
          createdAt: new Date(transfer.created_at),
          updatedAt: new Date(transfer.updated_at),
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
      created_at: 'created_at',
      updated_at: 'updated_at',
      transfer_date: 'transfer_date',
      quantity: 'quantity',
    };

    return fieldMap[sortBy] || 'created_at';
  }
}
