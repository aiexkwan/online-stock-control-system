import { ApiProperty } from '@nestjs/swagger';

export class StockLevelItemDto {
  @ApiProperty({
    description: 'Product code',
    example: 'PROD001',
  })
  productCode!: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Widget A',
  })
  productDescription?: string;

  @ApiProperty({
    description: 'Product type',
    example: 'EasyLiner',
  })
  productType?: string;

  @ApiProperty({
    description: 'Current stock level',
    example: 150,
  })
  stockLevel!: number;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-01-15T10:30:00Z',
  })
  lastUpdated?: string;

  @ApiProperty({
    description: 'Warehouse/Location',
    example: 'Injection',
  })
  location?: string;
}

export class StockLevelsResponseDto {
  @ApiProperty({
    type: [StockLevelItemDto],
    description: 'List of stock levels',
  })
  stockLevels!: StockLevelItemDto[];

  @ApiProperty({
    description: 'Total number of stock items',
    example: 100,
  })
  totalItems!: number;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2025-01-15T10:30:00Z',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Data source identifier',
    example: 'record_inventory',
  })
  dataSource!: string;

  @ApiProperty({
    required: false,
    description: 'Error message if any',
  })
  error?: string;
}
