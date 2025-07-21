import { ApiProperty } from '@nestjs/swagger';

export class ProductAnalysisDto {
  @ApiProperty({ description: 'Product code', example: 'PROD001' })
  productCode!: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Injection Plastic Part A',
  })
  description!: string;

  @ApiProperty({ description: 'Current stock quantity', example: 1500 })
  currentStock!: number;

  @ApiProperty({ description: 'Order demand quantity', example: 1200 })
  orderDemand!: number;

  @ApiProperty({
    description: 'Remaining stock after fulfilling orders',
    example: 300,
  })
  remainingStock!: number;

  @ApiProperty({ description: 'Fulfillment rate percentage', example: 100 })
  fulfillmentRate!: number;

  @ApiProperty({
    description: 'Whether stock is sufficient for orders',
    example: true,
  })
  isSufficient!: boolean;
}

export class AnalysisSummaryDto {
  @ApiProperty({
    description: 'Total stock quantity across all products',
    example: 5000,
  })
  totalStock!: number;

  @ApiProperty({
    description: 'Total demand quantity across all orders',
    example: 4500,
  })
  totalDemand!: number;

  @ApiProperty({
    description: 'Total remaining stock after fulfilling all orders',
    example: 500,
  })
  totalRemaining!: number;

  @ApiProperty({
    description: 'Whether overall stock is sufficient',
    example: true,
  })
  overallSufficient!: boolean;

  @ApiProperty({
    description: 'Count of products with insufficient stock',
    example: 2,
  })
  insufficientCount!: number;

  @ApiProperty({
    description: 'Count of products with sufficient stock',
    example: 8,
  })
  sufficientCount!: number;
}

export class InventoryOrderedAnalysisMetadataDto {
  @ApiProperty({
    description: 'Execution timestamp',
    example: '2025-07-15T10:30:00Z',
  })
  executed_at!: string;

  @ApiProperty({
    description: 'Calculation time',
    example: '25ms',
    required: false,
  })
  calculation_time?: string;
}

export class InventoryOrderedAnalysisResponseDto {
  @ApiProperty({
    description: 'List of product analysis',
    type: [ProductAnalysisDto],
  })
  products!: ProductAnalysisDto[];

  @ApiProperty({
    description: 'Summary statistics',
    type: AnalysisSummaryDto,
  })
  summary!: AnalysisSummaryDto;

  @ApiProperty({
    description: 'Metadata about the analysis',
    type: InventoryOrderedAnalysisMetadataDto,
    required: false,
  })
  metadata?: InventoryOrderedAnalysisMetadataDto;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2025-07-15T10:30:00Z',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Error message if any',
    required: false,
    example: 'Database connection error',
  })
  error?: string;
}
