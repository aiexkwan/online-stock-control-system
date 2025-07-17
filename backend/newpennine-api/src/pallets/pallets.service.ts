import { Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import {
  PalletsResponseDto,
  PalletDetailResponseDto,
  PalletDto,
} from './dto/pallet-response.dto';

@Injectable()
export class PalletsService {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  async getPallets(
    warehouse?: string,
    productCode?: string,
    series?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<PalletsResponseDto> {
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

      // Build the query
      let query = this.supabase.from('record_palletinfo').select(
        `
          plt_num,
          product_code,
          generate_time,
          series,
          plt_remark,
          product_qty,
          pdf_url,
          data_code!inner(
            description
          )
        `,
        { count: 'exact' },
      );

      // Apply filters
      if (productCode) {
        query = query.eq('product_code', productCode);
      }
      if (series) {
        query = query.eq('series', series);
      }
      // Note: warehouse filtering removed as record_inventory join was causing issues
      // TODO: Implement warehouse filtering using record_transfer table

      // Apply pagination
      query = query
        .range(offset, offset + limit - 1)
        .order('generate_time', { ascending: false });

      const { data, count, error } = await query;

      if (error) {
        console.error('Error fetching pallets:', error);
        throw error;
      }

      // Transform the data
      const transformedData: PalletDto[] = (data || []).map((item: any) => ({
        plt_num: item.plt_num,
        product_code: item.product_code,
        generate_time: item.generate_time,
        series: item.series,
        plt_remark: item.plt_remark,
        product_qty: item.product_qty,
        pdf_url: item.pdf_url,
        product_description: item.data_code?.description,
        location: null, // TODO: Get from latest record_transfer
        warehouse: null, // TODO: Get from latest record_transfer
      }));

      return {
        data: transformedData,
        total: count || 0,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error in getPallets:', error);
      throw error;
    }
  }

  async getPalletById(id: string): Promise<PalletDetailResponseDto> {
    try {
      if (!this.supabase) {
        throw new Error('Database connection not available');
      }

      // Get pallet info with related data
      const { data: palletData, error: palletError } = await this.supabase
        .from('record_palletinfo')
        .select(
          `
          *,
          data_code!inner(
            description,
            colour,
            standard_qty
          )
        `,
        )
        .eq('plt_num', id)
        .single();

      if (palletError) {
        console.error('Error fetching pallet:', palletError);
        throw palletError;
      }

      if (!palletData) {
        throw new Error('Pallet not found');
      }

      // Get recent transfers
      const { data: transfers, error: transferError } = await this.supabase
        .from('record_transfer')
        .select('*')
        .eq('plt_num', id)
        .order('transfer_time', { ascending: false })
        .limit(10);

      if (transferError) {
        console.error('Error fetching transfers:', transferError);
      }

      // Get recent history
      const { data: history, error: historyError } = await this.supabase
        .from('record_history')
        .select('*')
        .eq('plt_num', id)
        .order('time', { ascending: false })
        .limit(10);

      if (historyError) {
        console.error('Error fetching history:', historyError);
      }

      // Transform and return the data
      return {
        plt_num: palletData.plt_num,
        product_code: palletData.product_code,
        generate_time: palletData.generate_time,
        series: palletData.series,
        plt_remark: palletData.plt_remark,
        product_qty: palletData.product_qty,
        pdf_url: palletData.pdf_url,
        product_description: palletData.data_code?.description,
        location: transfers && transfers.length > 0 ? transfers[0].t_loc : null,
        warehouse: null, // TODO: Derive from location or implement warehouse mapping
        transfers: transfers || [],
        history: history || [],
        current_inventory: null, // TODO: Implement from record_inventory if needed
      };
    } catch (error) {
      console.error('Error in getPalletById:', error);
      throw error;
    }
  }
}
