import { Injectable } from '@nestjs/common';
import { DatabaseRecord } from '@/lib/types/database';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  ProductsTypesResponseDto,
  ProductTypeDto,
} from './dto/products-types-response.dto';

@Injectable()
export class ProductsService {
  private supabase: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  async getProductTypes(): Promise<ProductsTypesResponseDto> {
    if (!this.supabase) {
      return {
        types: [],
        totalTypes: 0,
        timestamp: new Date().toISOString(),
        dataSource: 'data_code',
        error: 'Database connection not available',
      };
    }

    try {
      // Get all product types with counts
      const { data, error } = await this.supabase
        .from('data_code')
        .select('type')
        .not('type', 'eq', '-')
        .not('type', 'is', null);

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Count products per type
      const typeCounts = new Map<string, number>();
      data?.forEach((item: DatabaseRecord) => {
        const type = item.type;
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
      });

      // Convert to DTO format
      const types: ProductTypeDto[] = Array.from(typeCounts.entries())
        .filter(([type]) => type && type.trim() !== '')
        .map(([type, count]) => ({
          type,
          productCount: count,
          isActive: true,
        }))
        .sort((a, b) => a.type.localeCompare(b.type));

      return {
        types,
        totalTypes: types.length,
        timestamp: new Date().toISOString(),
        dataSource: 'data_code',
      };
    } catch (error) {
      return {
        types: [],
        totalTypes: 0,
        timestamp: new Date().toISOString(),
        dataSource: 'data_code',
        error: (error as Error).message,
      };
    }
  }
}
