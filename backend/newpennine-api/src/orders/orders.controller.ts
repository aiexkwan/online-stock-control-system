import {
  Controller,
  Get,
  Query,
  Param,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { AcoQueryDto } from './dto/aco-query.dto';
import { AcoResponseDto, AcoRecordDto } from './dto/aco-response.dto';
import { GrnQueryDto } from './dto/grn-query.dto';
import { GrnResponseDto, GrnRecordDto } from './dto/grn-response.dto';

interface OrderStats {
  total: number;
  by_status: Record<string, number>;
}

@ApiTags('Orders')
@Controller('api/v1/orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Get('aco')
  @ApiOperation({
    summary: 'Get ACO orders',
    description:
      'Retrieve ACO (Anticipated Change Order) records with filtering, sorting, and pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'ACO orders retrieved successfully',
    type: AcoResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getAcoOrders(@Query() query: AcoQueryDto): Promise<AcoResponseDto> {
    this.logger.log(`Fetching ACO orders with query: ${JSON.stringify(query)}`);
    return this.ordersService.getAcoOrders(query);
  }

  @Get('aco/:id')
  @ApiOperation({
    summary: 'Get ACO order by ID',
    description: 'Retrieve a specific ACO order by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ACO order ID',
    type: String,
    example: 'ACO-2024-001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'ACO order retrieved successfully',
    type: AcoRecordDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'ACO order not found',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getAcoOrderById(@Param('id') id: string): Promise<AcoRecordDto> {
    this.logger.log(`Fetching ACO order with ID: ${id}`);
    return this.ordersService.getAcoOrderById(id);
  }

  @Get('aco/stats')
  @ApiOperation({
    summary: 'Get ACO order statistics',
    description:
      'Retrieve statistics for ACO orders including total count and status breakdown',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'ACO order statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: {
          type: 'number',
          description: 'Total number of ACO orders',
          example: 150,
        },
        by_status: {
          type: 'object',
          description: 'Count of orders by status',
          example: {
            pending: 50,
            processing: 30,
            completed: 60,
            cancelled: 10,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getAcoOrderStats(): Promise<OrderStats> {
    this.logger.log('Fetching ACO order statistics');
    return this.ordersService.getAcoOrderStats();
  }

  @Get('grn')
  @ApiOperation({
    summary: 'Get GRN orders',
    description:
      'Retrieve GRN (Goods Received Note) records with filtering, sorting, and pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'GRN orders retrieved successfully',
    type: GrnResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getGrnOrders(@Query() query: GrnQueryDto): Promise<GrnResponseDto> {
    this.logger.log(`Fetching GRN orders with query: ${JSON.stringify(query)}`);
    return this.ordersService.getGrnOrders(query);
  }

  @Get('grn/:id')
  @ApiOperation({
    summary: 'Get GRN order by ID',
    description: 'Retrieve a specific GRN order by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'GRN order ID',
    type: String,
    example: 'GRN-2024-001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'GRN order retrieved successfully',
    type: GrnRecordDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'GRN order not found',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getGrnOrderById(@Param('id') id: string): Promise<GrnRecordDto> {
    this.logger.log(`Fetching GRN order with ID: ${id}`);
    return this.ordersService.getGrnOrderById(id);
  }

  @Get('grn/stats')
  @ApiOperation({
    summary: 'Get GRN order statistics',
    description:
      'Retrieve statistics for GRN orders including total count and status breakdown',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'GRN order statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: {
          type: 'number',
          description: 'Total number of GRN orders',
          example: 120,
        },
        by_status: {
          type: 'object',
          description: 'Count of orders by status',
          example: {
            pending: 20,
            received: 30,
            quality_check: 15,
            approved: 40,
            rejected: 5,
            completed: 10,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getGrnOrderStats(): Promise<OrderStats> {
    this.logger.log('Fetching GRN order statistics');
    return this.ordersService.getGrnOrderStats();
  }
}
