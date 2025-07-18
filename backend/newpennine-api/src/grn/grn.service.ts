import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { GrnReferencesQueryDto } from './dto/grn-references-query.dto';
import { GrnMaterialCodesQueryDto } from './dto/grn-material-codes-query.dto';
import { GrnReportDataQueryDto } from './dto/grn-report-data-query.dto';
import {
  GrnReferencesResponseDto,
  GrnMaterialCodesResponseDto,
  GrnReportDataResponseDto,
} from './dto/grn-responses.dto';

@Injectable()
export class GrnService {
  private readonly logger = new Logger(GrnService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * 獲取所有 GRN 參考號
   */
  async getGrnReferences(
    query: GrnReferencesQueryDto,
  ): Promise<GrnReferencesResponseDto> {
    try {
      // 首先嘗試使用 RPC 函數（如果存在）
      const { data: rpcData, error: rpcError } = await this.supabaseService
        .getClient()
        .rpc('get_grn_references', {
          limit_count: query.limit,
          offset_count: query.offset,
        });

      if (!rpcError && rpcData) {
        this.logger.debug('Using RPC function for GRN references');
        return {
          references: rpcData.map((item: Record<string, unknown>) => item.grn_ref),
          total: rpcData.length,
          offset: query.offset || 0,
          limit: query.limit || 100,
        };
      }

      // Fallback to direct query
      this.logger.debug('Using direct query for GRN references');
      const { data, error, count } = await this.supabaseService
        .getClient()
        .from('record_grn')
        .select('grn_ref', { count: 'exact' })
        .not('grn_ref', 'is', null)
        .order('grn_ref', { ascending: false })
        .range(
          query.offset || 0,
          (query.offset || 0) + (query.limit || 100) - 1,
        );

      if (error) {
        throw new Error(`Failed to fetch GRN references: ${error.message}`);
      }

      const uniqueRefs = [...new Set(data?.map((item) => item.grn_ref) || [])];

      return {
        references: uniqueRefs,
        total: count || 0,
        offset: query.offset || 0,
        limit: query.limit || 100,
      };
    } catch (error) {
      this.logger.error(
        'Error fetching GRN references:',
        (error as Error).message,
      );
      throw error;
    }
  }

  /**
   * 獲取特定 GRN 的材料代碼
   */
  async getGrnMaterialCodes(
    query: GrnMaterialCodesQueryDto,
  ): Promise<GrnMaterialCodesResponseDto> {
    try {
      // 首先嘗試使用 RPC 函數
      const { data: rpcData, error: rpcError } = await this.supabaseService
        .getClient()
        .rpc('get_grn_material_codes', {
          grn_reference: query.grnRef,
        });

      if (!rpcError && rpcData) {
        this.logger.debug('Using RPC function for GRN material codes');
        return {
          grnRef: query.grnRef,
          materialCodes: rpcData.map((item: Record<string, unknown>) => item.material_code),
          total: rpcData.length,
        };
      }

      // Fallback to direct query
      this.logger.debug('Using direct query for GRN material codes');
      const { data, error } = await this.supabaseService
        .getClient()
        .from('record_grn')
        .select('material_code')
        .eq('grn_ref', query.grnRef)
        .not('material_code', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch material codes: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new NotFoundException(
          `No material codes found for GRN reference: ${query.grnRef}`,
        );
      }

      const uniqueCodes = [...new Set(data.map((item) => item.material_code))];

      return {
        grnRef: query.grnRef,
        materialCodes: uniqueCodes,
        total: uniqueCodes.length,
      };
    } catch (error) {
      this.logger.error(
        'Error fetching GRN material codes:',
        (error as Error).message,
      );
      throw error;
    }
  }

  /**
   * 獲取 GRN 報告數據
   */
  async getGrnReportData(
    query: GrnReportDataQueryDto,
  ): Promise<GrnReportDataResponseDto> {
    try {
      // 首先嘗試使用 RPC 函數
      const { data: rpcData, error: rpcError } = await this.supabaseService
        .getClient()
        .rpc('get_grn_report_data', {
          grn_reference: query.grnRef,
          product_codes: query.productCodes || [],
        });

      if (!rpcError && rpcData && rpcData.length > 0) {
        this.logger.debug('Using RPC function for GRN report data');
        const firstRecord = rpcData[0];

        return {
          grnRef: query.grnRef,
          material_description: firstRecord.material_description,
          supplier_name: firstRecord.supplier_name,
          report_date: firstRecord.report_date,
          records: rpcData.map((record: Record<string, unknown>) => ({
            supplier_invoice_number: record.supplier_invoice_number,
            date_received: record.date_received,
            package_count: record.package_count,
            gross_weight: record.gross_weight,
            net_weight: record.net_weight,
            pallet_weight: record.pallet_weight,
          })),
          total_records: rpcData.length,
        };
      }

      // Fallback to direct query
      this.logger.debug('Using direct query for GRN report data');
      let grnQuery = this.supabaseService
        .getClient()
        .from('record_grn')
        .select(
          `
          grn_ref,
          material_code,
          supplier_invoice_number,
          date_received,
          package_count,
          gross_weight,
          net_weight,
          data_code!inner(description),
          data_supplier!inner(supplier_name)
        `,
        )
        .eq('grn_ref', query.grnRef);

      if (query.productCodes && query.productCodes.length > 0) {
        grnQuery = grnQuery.in('material_code', query.productCodes);
      }

      const { data, error } = await grnQuery;

      if (error) {
        throw new Error(`Failed to fetch GRN report data: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new NotFoundException(
          `No report data found for GRN reference: ${query.grnRef}`,
        );
      }

      const firstRecord = data[0];

      const result: Record<string, unknown> = {
        grnRef: query.grnRef,
        records: data.map((record: Record<string, unknown>) => ({
          supplier_invoice_number: record.supplier_invoice_number,
          date_received: record.date_received,
          package_count: record.package_count,
          gross_weight: record.gross_weight,
          net_weight: record.net_weight,
          pallet_weight: record.pallet_weight,
        })),
        total_records: data.length,
      };

      if (firstRecord) {
        const materialDescription = (firstRecord.data_code as any)?.description;
        if (materialDescription) {
          result.material_description = materialDescription;
        }

        const supplierName = (firstRecord.data_supplier as any)?.supplier_name;
        if (supplierName) {
          result.supplier_name = supplierName;
        }
      }

      result.report_date = new Date().toISOString().split('T')[0];

      return result as GrnReportDataResponseDto;
    } catch (error) {
      this.logger.error(
        'Error fetching GRN report data:',
        (error as Error).message,
      );
      throw error;
    }
  }
}
