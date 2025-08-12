import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { HistoryQueryDto } from './dto/history-query.dto';
import {
  HistoryResponseDto,
  HistoryRecordDto,
} from './dto/history-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  HistoryStateSchema,
  validateHistoryState,
  type HistoryState,
} from '@/lib/validation/zod-schemas';
import { z } from 'zod';

@ApiTags('History')
@Controller('api/v1/history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HistoryController {
  private readonly logger = new Logger(HistoryController.name);

  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Get history records',
    description:
      'Retrieve paginated history records with optional filtering and sorting',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'History records retrieved successfully',
    type: HistoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getHistory(
    @Query() query: HistoryQueryDto,
  ): Promise<HistoryResponseDto> {
    this.logger.log('Fetching history records with query:', query);

    try {
      return await this.historyService.getHistory(query);
    } catch (error) {
      this.logger.error('Error fetching history records:', error);
      throw error;
    }
  }

  @Get('pallet/:palletId')
  @ApiOperation({
    summary: 'Get history records by pallet ID',
    description: 'Retrieve all history records for a specific pallet',
  })
  @ApiParam({
    name: 'palletId',
    description: 'Pallet ID to filter history records',
    example: 'P001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pallet history records retrieved successfully',
    type: [HistoryRecordDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Pallet not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getHistoryByPalletId(
    @Param('palletId') palletId: string,
  ): Promise<HistoryRecordDto[]> {
    this.logger.log(`Fetching history records for pallet: ${palletId}`);

    try {
      return await this.historyService.getHistoryByPalletId(palletId);
    } catch (error) {
      this.logger.error(
        `Error fetching history for pallet ${palletId}:`,
        error,
      );
      throw error;
    }
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get history records by user ID',
    description: 'Retrieve all history records for a specific user',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID to filter history records',
    example: 'user123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User history records retrieved successfully',
    type: [HistoryRecordDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getHistoryByUserId(
    @Param('userId') userId: string,
  ): Promise<HistoryRecordDto[]> {
    this.logger.log(`Fetching history records for user: ${userId}`);

    try {
      return await this.historyService.getHistoryByUserId(userId);
    } catch (error) {
      this.logger.error(`Error fetching history for user ${userId}:`, error);
      throw error;
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new history record',
    description: 'Create a new history record for audit trail',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'History record created successfully',
    type: HistoryRecordDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request body',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async createHistoryRecord(
    @Body()
    createHistoryDto: {
      userId: string;
      action: string;
      palletId?: string;
      productCode?: string;
      productName?: string;
      location?: string;
      quantity?: number;
      weight?: number;
      description?: string;
      previousState?: HistoryState;
      newState?: HistoryState;
      metadata?: HistoryState;
    },
  ): Promise<HistoryRecordDto> {
    this.logger.log('Creating new history record:', createHistoryDto);

    try {
      // Validate state objects using Zod schemas
      if (createHistoryDto.previousState) {
        const validationResult = validateHistoryState(createHistoryDto.previousState);
        if (!validationResult.success) {
          throw new BadRequestException(`Invalid previousState: ${validationResult.error}`);
        }
      }

      if (createHistoryDto.newState) {
        const validationResult = validateHistoryState(createHistoryDto.newState);
        if (!validationResult.success) {
          throw new BadRequestException(`Invalid newState: ${validationResult.error}`);
        }
      }

      if (createHistoryDto.metadata) {
        const validationResult = validateHistoryState(createHistoryDto.metadata);
        if (!validationResult.success) {
          throw new BadRequestException(`Invalid metadata: ${validationResult.error}`);
        }
      }

      const { userId, action, ...data } = createHistoryDto;
      return await this.historyService.createHistoryRecord(
        userId,
        action,
        data,
      );
    } catch (error) {
      this.logger.error('Error creating history record:', error);
      throw error;
    }
  }
}
