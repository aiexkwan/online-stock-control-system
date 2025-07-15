import { Controller, Get, Query, Logger, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransfersService } from './transfers.service';
import { TransfersQueryDto } from './dto/transfers-query.dto';
import { TransfersListResponseDto } from './dto/transfer-response.dto';

@ApiTags('transfers')
@Controller('transfers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransfersController {
  private readonly logger = new Logger(TransfersController.name);

  constructor(private readonly transfersService: TransfersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get list of transfers with filtering, sorting and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of transfers',
    type: TransfersListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getTransfers(
    @Query() query: TransfersQueryDto,
  ): Promise<TransfersListResponseDto> {
    this.logger.log(`Getting transfers with query: ${JSON.stringify(query)}`);
    return this.transfersService.getTransfers(query);
  }
}
