import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Logger,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { GrnService } from './grn.service';
import { DatabaseRecord } from '@/lib/types/database';
import { GrnReferencesQueryDto } from './dto/grn-references-query.dto';
import { GrnMaterialCodesQueryDto } from './dto/grn-material-codes-query.dto';
import { GrnReportDataQueryDto } from './dto/grn-report-data-query.dto';
import {
  GrnReferencesResponseDto,
  GrnMaterialCodesResponseDto,
  GrnReportDataResponseDto,
} from './dto/grn-responses.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('grn')
@UseGuards(JwtAuthGuard)
export class GrnController {
  private readonly logger = new Logger(GrnController.name);

  constructor(private readonly grnService: GrnService) {}

  /**
   * 獲取所有 GRN 參考號
   * GET /api/v1/grn/references
   */
  @Get('references')
  @HttpCode(HttpStatus.OK)
  async getGrnReferences(
    @Query() query: GrnReferencesQueryDto,
  ): Promise<GrnReferencesResponseDto> {
    this.logger.log('Fetching GRN references', { query });
    return this.grnService.getGrnReferences(query);
  }

  /**
   * 獲取特定 GRN 的材料代碼
   * GET /api/v1/grn/:grnRef/material-codes
   */
  @Get(':grnRef/material-codes')
  @HttpCode(HttpStatus.OK)
  async getGrnMaterialCodes(
    @Param('grnRef') grnRef: string,
  ): Promise<GrnMaterialCodesResponseDto> {
    this.logger.log('Fetching GRN material codes', { grnRef });

    const query: GrnMaterialCodesQueryDto = { grnRef };
    return this.grnService.getGrnMaterialCodes(query);
  }

  /**
   * 獲取 GRN 報告數據
   * GET /api/v1/grn/:grnRef/report-data
   */
  @Get(':grnRef/report-data')
  @HttpCode(HttpStatus.OK)
  async getGrnReportData(
    @Param('grnRef') grnRef: string,
    @Query('productCodes') productCodes?: string | string[],
  ): Promise<GrnReportDataResponseDto> {
    this.logger.log('Fetching GRN report data', { grnRef, productCodes });

    // 處理 productCodes 參數
    let processedProductCodes: string[] | undefined;
    if (productCodes) {
      if (Array.isArray(productCodes)) {
        processedProductCodes = productCodes;
      } else {
        // 如果是字符串，嘗試解析為數組
        try {
          processedProductCodes = JSON.parse(productCodes);
        } catch {
          // 如果解析失敗，將其視為單個產品代碼
          processedProductCodes = [productCodes];
        }
      }
    }

    const query: DatabaseRecord = {
      grnRef,
    };

    if (processedProductCodes && processedProductCodes.length > 0) {
      query.productCodes = processedProductCodes;
    }

    const typedQuery = query as GrnReportDataQueryDto;

    return this.grnService.getGrnReportData(typedQuery);
  }
}
