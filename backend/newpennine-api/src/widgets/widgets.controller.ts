import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WidgetsService } from './widgets.service';
import { StatsQueryDto, InventoryQueryDto } from './dto/query.dto';
import { StatsResponseDto } from './dto/stats-response.dto';
import { InventoryResponseDto } from './dto/inventory-response.dto';
import { InventoryAnalysisResponseDto } from './dto/inventory-analysis-response.dto';
import { StatsCardQueryDto } from './dto/stats-card-query.dto';
import { StatsCardResponseDto } from './dto/stats-card-response.dto';
import { WidgetPermissions, WIDGET_PERMISSION_CONSTANTS } from './guards/widget-permissions.guard';
import { InventoryOrderedAnalysisQueryDto } from './dto/inventory-ordered-analysis-query.dto';
import { InventoryOrderedAnalysisResponseDto } from './dto/inventory-ordered-analysis-response.dto';
import { ProductDistributionQueryDto } from './dto/product-distribution-query.dto';
import { ProductDistributionResponseDto } from './dto/product-distribution-response.dto';
import { TransactionReportQueryDto } from './dto/transaction-report-query.dto';
import { TransactionReportResponseDto } from './dto/transaction-report-response.dto';

@ApiTags('widgets')
@Controller('widgets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Get('stats')
  @WidgetPermissions([WIDGET_PERMISSION_CONSTANTS.VIEW_DASHBOARD])
  @ApiOperation({ summary: 'Get basic statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(
    @Query(ValidationPipe) query: StatsQueryDto,
  ): Promise<StatsResponseDto> {
    try {
      return await this.widgetsService.getStats(query.startDate, query.endDate);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch statistics',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('inventory')
  @WidgetPermissions([WIDGET_PERMISSION_CONSTANTS.VIEW_INVENTORY])
  @ApiOperation({ summary: 'Get inventory data' })
  @ApiResponse({ status: 200, description: 'Inventory data retrieved successfully' })
  async getInventory(
    @Query(ValidationPipe) query: InventoryQueryDto,
  ): Promise<InventoryResponseDto> {
    try {
      const limit = query.limit ? parseInt(query.limit, 10) : 100;
      const offset = query.offset ? parseInt(query.offset, 10) : 0;

      return await this.widgetsService.getInventory(
        query.warehouse,
        limit,
        offset,
      );
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch inventory data',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('dashboard-stats')
  @WidgetPermissions([WIDGET_PERMISSION_CONSTANTS.VIEW_DASHBOARD])
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  async getDashboardStats(
    @Query(ValidationPipe) query: StatsQueryDto,
  ): Promise<StatsResponseDto> {
    try {
      return await this.widgetsService.getDashboardStats(query.startDate, query.endDate);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch dashboard statistics',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('inventory-analysis')
  @WidgetPermissions([WIDGET_PERMISSION_CONSTANTS.VIEW_ANALYTICS])
  @ApiOperation({ summary: 'Get inventory analysis data' })
  @ApiResponse({ status: 200, description: 'Inventory analysis data retrieved successfully' })
  async getInventoryAnalysis(
    @Query(ValidationPipe) query: InventoryQueryDto,
  ): Promise<InventoryAnalysisResponseDto> {
    try {
      return await this.widgetsService.getInventoryAnalysis(query.warehouse);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch inventory analysis data',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats-card')
  @WidgetPermissions([WIDGET_PERMISSION_CONSTANTS.VIEW_DASHBOARD])
  @ApiOperation({ summary: 'Get stats card data based on data source' })
  @ApiResponse({ 
    status: 200, 
    description: 'Stats card data retrieved successfully',
    type: StatsCardResponseDto,
  })
  async getStatsCard(
    @Query(ValidationPipe) query: StatsCardQueryDto,
  ): Promise<StatsCardResponseDto> {
    try {
      return await this.widgetsService.getStatsCard(query);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch stats card data',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('inventory-ordered-analysis')
  @WidgetPermissions([WIDGET_PERMISSION_CONSTANTS.VIEW_ANALYTICS])
  @ApiOperation({ summary: 'Get inventory vs order demand analysis' })
  @ApiResponse({ 
    status: 200, 
    description: 'Inventory ordered analysis data retrieved successfully',
    type: InventoryOrderedAnalysisResponseDto,
  })
  async getInventoryOrderedAnalysis(
    @Query(ValidationPipe) query: InventoryOrderedAnalysisQueryDto,
  ): Promise<InventoryOrderedAnalysisResponseDto> {
    try {
      return await this.widgetsService.getInventoryOrderedAnalysis(query);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch inventory ordered analysis data',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('product-distribution')
  @WidgetPermissions([WIDGET_PERMISSION_CONSTANTS.VIEW_DASHBOARD])
  @ApiOperation({ summary: 'Get product distribution data for pie chart' })
  @ApiResponse({ 
    status: 200, 
    description: 'Product distribution data retrieved successfully',
    type: ProductDistributionResponseDto,
  })
  async getProductDistribution(
    @Query(ValidationPipe) query: ProductDistributionQueryDto,
  ): Promise<ProductDistributionResponseDto> {
    try {
      return await this.widgetsService.getProductDistribution(query);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch product distribution data',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('transaction-report')
  @WidgetPermissions([WIDGET_PERMISSION_CONSTANTS.VIEW_REPORTS])
  @ApiOperation({ summary: 'Get transaction report data for date range' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction report data retrieved successfully',
    type: TransactionReportResponseDto,
  })
  async getTransactionReport(
    @Query(ValidationPipe) query: TransactionReportQueryDto,
  ): Promise<TransactionReportResponseDto> {
    try {
      return await this.widgetsService.getTransactionReport(query);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch transaction report data',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
