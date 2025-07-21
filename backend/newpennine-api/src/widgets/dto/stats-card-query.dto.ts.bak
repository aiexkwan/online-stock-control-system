import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum StatsCardDataSource {
  TOTAL_PALLETS = 'total_pallets',
  TODAY_TRANSFERS = 'today_transfers',
  ACTIVE_PRODUCTS = 'active_products',
  PENDING_ORDERS = 'pending_orders',
  AWAIT_PERCENTAGE_STATS = 'await_percentage_stats',
  AWAIT_LOCATION_COUNT = 'await_location_count',
  TRANSFER_COUNT = 'transfer_count',
  PRODUCTION_STATS = 'production_stats',
  UPDATE_STATS = 'update_stats',
}

export class StatsCardQueryDto {
  @ApiProperty({
    description: 'Data source for the stats card',
    enum: StatsCardDataSource,
    example: StatsCardDataSource.TOTAL_PALLETS,
  })
  @IsEnum(StatsCardDataSource)
  dataSource!: StatsCardDataSource;

  @ApiProperty({
    description: 'Start date for filtering (YYYY-MM-DD)',
    required: false,
    example: '2025-01-01',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for filtering (YYYY-MM-DD)',
    required: false,
    example: '2025-12-31',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({
    description: 'Warehouse filter',
    required: false,
    example: 'W001',
  })
  @IsOptional()
  @IsString()
  warehouse?: string;

  @ApiProperty({
    description: 'Custom label for the stats card',
    required: false,
    example: 'Total Pallets',
  })
  @IsOptional()
  @IsString()
  label?: string;
}
