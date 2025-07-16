import { ApiProperty } from '@nestjs/swagger';

export class ProductionDetailsItemDto {
  @ApiProperty({
    description: 'Pallet number',
    example: 'PLT001',
  })
  plt_num: string;

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
    description: 'Product quantity',
    example: 100,
  })
  product_qty: number;

  @ApiProperty({
    description: 'Production timestamp',
    example: '2025-07-16T10:30:00Z',
  })
  generate_time: string;

  @ApiProperty({
    description: 'Pallet remarks',
    example: 'finished in production',
  })
  plt_remark: string;

  @ApiProperty({
    description: 'Product series',
    example: 'SER001',
  })
  series?: string;

  @ApiProperty({
    description: 'PDF document URL',
    example: 'https://example.com/document.pdf',
  })
  pdf_url?: string;

  @ApiProperty({
    description: 'Product colour',
    example: 'Red',
  })
  colour?: string;

  @ApiProperty({
    description: 'Product type',
    example: 'Finished Good',
  })
  type?: string;
}

export class ProductionDetailsMetadataDto {
  @ApiProperty({
    description: 'Total number of production records found',
    example: 150,
  })
  total_records: number;

  @ApiProperty({
    description: 'Number of unique products',
    example: 45,
  })
  unique_products: number;

  @ApiProperty({
    description: 'Total quantity produced',
    example: 15000,
  })
  total_quantity: number;

  @ApiProperty({
    description: 'Applied filters',
    example: { warehouse: 'warehouse_a', productType: 'Finished Good' },
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
}

export class ProductionDetailsResponseDto {
  @ApiProperty({
    description: 'List of production details',
    type: [ProductionDetailsItemDto],
  })
  details: ProductionDetailsItemDto[];

  @ApiProperty({
    description: 'Response metadata',
    type: ProductionDetailsMetadataDto,
  })
  metadata: ProductionDetailsMetadataDto;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2025-07-16T10:30:00Z',
  })
  timestamp: string;
}
