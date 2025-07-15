import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { WarehouseTransfersService } from './warehouse-transfers.service';
import { TransferListQueryDto } from './dto/transfer-list-query.dto';
import { TransferListResponseDto } from './dto/transfer-responses.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('warehouse-transfers')
@UseGuards(JwtAuthGuard)
export class WarehouseTransfersController {
  private readonly logger = new Logger(WarehouseTransfersController.name);

  constructor(
    private readonly warehouseTransfersService: WarehouseTransfersService,
  ) {}

  /**
   * 獲取倉庫轉移列表
   * GET /api/v1/warehouse-transfers/list
   */
  @Get('list')
  @HttpCode(HttpStatus.OK)
  async getTransferList(
    @Query() query: TransferListQueryDto,
  ): Promise<TransferListResponseDto> {
    this.logger.log('Fetching warehouse transfer list', { query });
    return this.warehouseTransfersService.getTransferList(query);
  }
}