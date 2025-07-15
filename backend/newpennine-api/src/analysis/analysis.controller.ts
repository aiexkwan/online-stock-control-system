import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalysisService } from './analysis.service';
import { AcoOrderProgressCardsQueryDto } from './dto/aco-order-progress-cards-query.dto';
import { AcoOrderProgressCardsResponseDto } from './dto/aco-order-progress-cards-response.dto';
import { AcoOrderProgressChartQueryDto } from './dto/aco-order-progress-chart-query.dto';
import { AcoOrderProgressChartResponseDto } from './dto/aco-order-progress-chart-response.dto';

@Controller('analysis')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('aco-order-progress-cards')
  async getAcoOrderProgressCards(
    @Query() query: AcoOrderProgressCardsQueryDto,
  ): Promise<AcoOrderProgressCardsResponseDto> {
    try {
      return await this.analysisService.getAcoOrderProgressCards(query);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch ACO order progress cards',
          message: (error as Error).message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('aco-order-progress-chart')
  async getAcoOrderProgressChart(
    @Query() query: AcoOrderProgressChartQueryDto,
  ): Promise<AcoOrderProgressChartResponseDto> {
    try {
      return await this.analysisService.getAcoOrderProgressChart(query);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch ACO order progress chart data',
          message: (error as Error).message,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Additional analysis endpoints can be added here in the future
  // Examples:
  // - @Get('inventory-turnover-analysis')
  // - @Get('user-activity-heatmap')
  // - @Get('top-products-inventory')
  // - @Get('stocktake-accuracy-trend')
}
