import { ApiProperty } from '@nestjs/swagger';

export class VoidRecordDto {
  @ApiProperty({
    description: 'Unique identifier for the void record',
    example: 'uuid-12345-67890',
  })
  uuid: string;

  @ApiProperty({
    description: 'Pallet number',
    example: 'PLT001',
  })
  plt_num: string;

  @ApiProperty({
    description: 'Timestamp when void occurred',
    example: '2025-01-15T14:30:00.000Z',
  })
  time: string;

  @ApiProperty({
    description: 'Reason for voiding',
    example: 'Damaged',
  })
  reason: string;

  @ApiProperty({
    description: 'Quantity of damaged items',
    example: 5,
    nullable: true,
  })
  damage_qty: number | null;

  @ApiProperty({
    description: 'Product code',
    example: 'PROD001',
    required: false,
  })
  product_code?: string;

  @ApiProperty({
    description: 'Product quantity',
    example: 100,
    required: false,
  })
  product_qty?: number;

  @ApiProperty({
    description: 'User name who performed the void',
    example: 'John Doe',
    required: false,
  })
  user_name?: string;

  @ApiProperty({
    description: 'User ID who performed the void',
    example: 1,
    required: false,
  })
  user_id?: number;

  @ApiProperty({
    description: 'Pallet location',
    example: 'A1-B2-C3',
    required: false,
  })
  plt_loc?: string;

  @ApiProperty({
    description: 'Void quantity',
    example: 10,
  })
  void_qty: number;
}

export class VoidReasonDistributionDto {
  @ApiProperty({
    description: 'Void reason name',
    example: 'Damaged',
  })
  reason: string;

  @ApiProperty({
    description: 'Total void quantity for this reason',
    example: 150,
  })
  total_void_qty: number;

  @ApiProperty({
    description: 'Number of void records for this reason',
    example: 25,
  })
  record_count: number;

  @ApiProperty({
    description: 'Percentage of total void quantity',
    example: 35.5,
  })
  percentage: number;
}

export class VoidTrendDataDto {
  @ApiProperty({
    description: 'Date period',
    example: '2025-01-15',
  })
  period: string;

  @ApiProperty({
    description: 'Total void quantity for this period',
    example: 75,
  })
  total_void_qty: number;

  @ApiProperty({
    description: 'Number of void records for this period',
    example: 12,
  })
  record_count: number;
}

export class TopVoidedProductDto {
  @ApiProperty({
    description: 'Product code',
    example: 'PROD001',
  })
  product_code: string;

  @ApiProperty({
    description: 'Total void quantity for this product',
    example: 200,
  })
  total_void_qty: number;

  @ApiProperty({
    description: 'Number of void records for this product',
    example: 15,
  })
  record_count: number;

  @ApiProperty({
    description: 'Percentage of total void quantity',
    example: 28.5,
  })
  percentage: number;
}

export class VoidUserActivityDto {
  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  user_name: string;

  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  user_id: number;

  @ApiProperty({
    description: 'Total void quantity performed by this user',
    example: 125,
  })
  total_void_qty: number;

  @ApiProperty({
    description: 'Number of void records performed by this user',
    example: 18,
  })
  record_count: number;

  @ApiProperty({
    description: 'Percentage of total void quantity',
    example: 22.3,
  })
  percentage: number;
}

export class VoidRecordsAnalysisResponseDto {
  @ApiProperty({
    description: 'Total void quantity in the selected period',
    example: 750,
  })
  total_void_qty: number;

  @ApiProperty({
    description: 'Total number of void records',
    example: 85,
  })
  total_records: number;

  @ApiProperty({
    description: 'Average void quantity per record',
    example: 8.8,
  })
  average_void_qty: number;

  @ApiProperty({
    description: 'Distribution of void reasons for pie chart',
    type: [VoidReasonDistributionDto],
  })
  reason_distribution: VoidReasonDistributionDto[];

  @ApiProperty({
    description: 'Trend data for line/bar chart',
    type: [VoidTrendDataDto],
  })
  trend_data: VoidTrendDataDto[];

  @ApiProperty({
    description: 'Top voided products',
    type: [TopVoidedProductDto],
  })
  top_voided_products: TopVoidedProductDto[];

  @ApiProperty({
    description: 'User activity for void records',
    type: [VoidUserActivityDto],
  })
  user_activity: VoidUserActivityDto[];

  @ApiProperty({
    description: 'Detailed void records',
    type: [VoidRecordDto],
  })
  void_records: VoidRecordDto[];

  @ApiProperty({
    description: 'Analysis metadata',
    example: {
      generated_at: '2025-01-15T10:30:00.000Z',
      date_range: {
        start: '2025-01-01T00:00:00.000Z',
        end: '2025-01-31T23:59:59.999Z',
      },
      filters_applied: {
        product_codes: ['PROD001', 'PROD002'],
        reasons: ['Damaged', 'Expired'],
      },
    },
  })
  metadata: {
    generated_at: string;
    date_range: {
      start: string;
      end: string;
    };
    filters_applied: {
      product_codes?: string[];
      reasons?: string[];
    };
  };
}
