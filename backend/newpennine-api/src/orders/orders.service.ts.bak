import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { DatabaseRecord } from '@/types/database/tables';
import { AcoQueryDto } from './dto/aco-query.dto';
import { AcoResponseDto, AcoRecordDto } from './dto/aco-response.dto';
import { GrnQueryDto } from './dto/grn-query.dto';
import { GrnResponseDto, GrnRecordDto } from './dto/grn-response.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getAcoOrders(query: AcoQueryDto): Promise<AcoResponseDto> {
    try {
      const {
        page = 1,
        limit = 10,
        sort_by = 'created_at',
        sort_order = 'desc',
      } = query;
      const offset = (page - 1) * limit;

      let baseQuery = this.supabaseService
        .getClient()
        .from('record_aco')
        .select('*', { count: 'exact' });

      // Apply filters
      if (query.aco_id) {
        baseQuery = baseQuery.eq('aco_id', query.aco_id);
      }

      if (query.product_code) {
        baseQuery = baseQuery.eq('product_code', query.product_code);
      }

      if (query.supplier) {
        baseQuery = baseQuery.ilike('supplier', `%${query.supplier}%`);
      }

      if (query.status) {
        baseQuery = baseQuery.eq('status', query.status);
      }

      if (query.start_date) {
        baseQuery = baseQuery.gte('created_at', query.start_date);
      }

      if (query.end_date) {
        baseQuery = baseQuery.lte('created_at', query.end_date);
      }

      if (query.search) {
        baseQuery = baseQuery.or(
          `aco_id.ilike.%${query.search}%,product_code.ilike.%${query.search}%,supplier.ilike.%${query.search}%,notes.ilike.%${query.search}%`,
        );
      }

      // Apply sorting
      baseQuery = baseQuery.order(sort_by, { ascending: sort_order === 'asc' });

      // Apply pagination
      baseQuery = baseQuery.range(offset, offset + limit - 1);

      const { data, error, count } = await baseQuery;

      if (error) {
        this.logger.error(`Error fetching ACO orders: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to fetch ACO orders');
      }

      const total = count || 0;
      const total_pages = Math.ceil(total / limit);

      return {
        data: data as AcoRecordDto[],
        total,
        page,
        limit,
        total_pages,
        has_next: page < total_pages,
        has_previous: page > 1,
      };
    } catch (error) {
      this.logger.error(
        `Error in getAcoOrders: ${(error as Error).message}`,
        error,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch ACO orders');
    }
  }

  async getGrnOrders(query: GrnQueryDto): Promise<GrnResponseDto> {
    try {
      const {
        page = 1,
        limit = 10,
        sort_by = 'created_at',
        sort_order = 'desc',
      } = query;
      const offset = (page - 1) * limit;

      let baseQuery = this.supabaseService
        .getClient()
        .from('record_grn')
        .select('*', { count: 'exact' });

      // Apply filters
      if (query.grn_id) {
        baseQuery = baseQuery.eq('grn_id', query.grn_id);
      }

      if (query.product_code) {
        baseQuery = baseQuery.eq('product_code', query.product_code);
      }

      if (query.supplier) {
        baseQuery = baseQuery.ilike('supplier', `%${query.supplier}%`);
      }

      if (query.status) {
        baseQuery = baseQuery.eq('status', query.status);
      }

      if (query.po_number) {
        baseQuery = baseQuery.eq('po_number', query.po_number);
      }

      if (query.start_date) {
        baseQuery = baseQuery.gte('created_at', query.start_date);
      }

      if (query.end_date) {
        baseQuery = baseQuery.lte('created_at', query.end_date);
      }

      if (query.min_quantity) {
        baseQuery = baseQuery.gte('quantity_received', query.min_quantity);
      }

      if (query.max_quantity) {
        baseQuery = baseQuery.lte('quantity_received', query.max_quantity);
      }

      if (query.search) {
        baseQuery = baseQuery.or(
          `grn_id.ilike.%${query.search}%,product_code.ilike.%${query.search}%,supplier.ilike.%${query.search}%,po_number.ilike.%${query.search}%,batch_number.ilike.%${query.search}%,notes.ilike.%${query.search}%`,
        );
      }

      // Apply sorting
      baseQuery = baseQuery.order(sort_by, { ascending: sort_order === 'asc' });

      // Apply pagination
      baseQuery = baseQuery.range(offset, offset + limit - 1);

      const { data, error, count } = await baseQuery;

      if (error) {
        this.logger.error(`Error fetching GRN orders: ${error.message}`, error);
        throw new InternalServerErrorException('Failed to fetch GRN orders');
      }

      const total = count || 0;
      const total_pages = Math.ceil(total / limit);

      return {
        data: data as GrnRecordDto[],
        total,
        page,
        limit,
        total_pages,
        has_next: page < total_pages,
        has_previous: page > 1,
      };
    } catch (error) {
      this.logger.error(
        `Error in getGrnOrders: ${(error as Error).message}`,
        error,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch GRN orders');
    }
  }

  async getAcoOrderById(id: string): Promise<AcoRecordDto> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('record_aco')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        this.logger.error(
          `Error fetching ACO order by ID: ${error.message}`,
          error,
        );
        throw new NotFoundException(`ACO order with ID ${id} not found`);
      }

      return data as AcoRecordDto;
    } catch (error) {
      this.logger.error(
        `Error in getAcoOrderById: ${(error as Error).message}`,
        error,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch ACO order');
    }
  }

  async getGrnOrderById(id: string): Promise<GrnRecordDto> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('record_grn')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        this.logger.error(
          `Error fetching GRN order by ID: ${error.message}`,
          error,
        );
        throw new NotFoundException(`GRN order with ID ${id} not found`);
      }

      return data as GrnRecordDto;
    } catch (error) {
      this.logger.error(
        `Error in getGrnOrderById: ${(error as Error).message}`,
        error,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch GRN order');
    }
  }

  async getAcoOrderStats(): Promise<any> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('record_aco')
        .select('status')
        .not('status', 'is', null);

      if (error) {
        this.logger.error(`Error fetching ACO stats: ${error.message}`, error);
        throw new InternalServerErrorException(
          'Failed to fetch ACO statistics',
        );
      }

      const stats = data.reduce(
        (acc: Record<string, number>, record: DatabaseRecord) => {
          acc[record.status] = (acc[record.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        total: data.length,
        by_status: stats,
      };
    } catch (error) {
      this.logger.error(
        `Error in getAcoOrderStats: ${(error as Error).message}`,
        error,
      );
      throw new InternalServerErrorException('Failed to fetch ACO statistics');
    }
  }

  async getGrnOrderStats(): Promise<any> {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('record_grn')
        .select('status')
        .not('status', 'is', null);

      if (error) {
        this.logger.error(`Error fetching GRN stats: ${error.message}`, error);
        throw new InternalServerErrorException(
          'Failed to fetch GRN statistics',
        );
      }

      const stats = data.reduce(
        (acc: Record<string, number>, record: DatabaseRecord) => {
          acc[record.status] = (acc[record.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        total: data.length,
        by_status: stats,
      };
    } catch (error) {
      this.logger.error(
        `Error in getGrnOrderStats: ${(error as Error).message}`,
        error,
      );
      throw new InternalServerErrorException('Failed to fetch GRN statistics');
    }
  }
}
