import { ApiProperty } from '@nestjs/swagger';

export class TopProductItemDto {
  @ApiProperty({
    description: 'Product code',
    example: 'PROD001',
  })
  product_code: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Sample Product',
  })
  description: string;

  @ApiProperty({
    description: 'Total quantity produced',
    example: 1500,
  })
  total_quantity: number;

  @ApiProperty({
    description: 'Product colour',
    example: 'Red',
    required: false,
  })
  colour?: string;

  @ApiProperty({
    description: 'Product type',
    example: 'Finished Good',
    required: false,
  })
  type?: string;

  @ApiProperty({
    description: 'Total value (if sortBy is value)',
    example: 15000.5,
  })
  total_value?: number;

  @ApiProperty({
    description: 'Number of pallets',
    example: 15,
  })
  pallet_count: number;
}

export class TopProductsByQuantityMetadataDto {
  @ApiProperty({
    description: 'Total number of products found',
    example: 150,
  })
  total_products: number;

  @ApiProperty({
    description: 'Applied filters',
    example: { warehouse: 'warehouse_a', timeRange: '30d' },
  })
  filters: Record<string, any>;

  @ApiProperty({
    description: 'Query execution time in milliseconds',
    example: 45,
  })
  execution_time_ms: number;

  @ApiProperty({
    description: 'Timestamp when the query was executed',
    example: '2025-07-16T10:30:00Z',
  })
  executed_at: string;

  @ApiProperty({
    description: 'Sort field used',
    example: 'quantity',
  })
  sort_by: string;
}

export class TopProductsByQuantityResponseDto {
  @ApiProperty({
    description: 'List of top products',
    type: [TopProductItemDto],
  })
  products: TopProductItemDto[];

  @ApiProperty({
    description: 'Response metadata',
    type: TopProductsByQuantityMetadataDto,
  })
  metadata: TopProductsByQuantityMetadataDto;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2025-07-16T10:30:00Z',
  })
  timestamp: string;
}
