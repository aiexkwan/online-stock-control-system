import { ApiProperty } from '@nestjs/swagger';

export class StatsCardMetadataDto {
  @ApiProperty({
    description: 'Whether the calculation was optimized',
    example: true,
  })
  optimized: boolean;

  @ApiProperty({
    description: 'Time taken for calculation in milliseconds',
    example: '150ms',
  })
  calculationTime: string;

  @ApiProperty({
    description: 'Data source used for calculation',
    example: 'total_pallets',
  })
  dataSource: string;

  @ApiProperty({
    description: 'Whether data was cached',
    example: true,
  })
  cached?: boolean;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2025-07-15T12:00:00Z',
  })
  lastUpdated?: string;
}

export class StatsCardResponseDto {
  @ApiProperty({
    description: 'The main statistic value',
    example: 1250,
  })
  value: number | string;

  @ApiProperty({
    description: 'Display label for the statistic',
    example: 'Total Pallets',
    required: false,
  })
  label?: string;

  @ApiProperty({
    description: 'Trend percentage (positive for increase, negative for decrease)',
    example: 5.2,
    required: false,
  })
  trend?: number;

  @ApiProperty({
    description: 'Additional metadata about the calculation',
    type: StatsCardMetadataDto,
    required: false,
  })
  metadata?: StatsCardMetadataDto;

  @ApiProperty({
    description: 'Timestamp when the data was generated',
    example: '2025-07-15T12:00:00Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Error message if calculation failed',
    required: false,
  })
  error?: string;
}