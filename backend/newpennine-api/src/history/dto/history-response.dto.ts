import { ApiProperty } from '@nestjs/swagger';

export class HistoryRecordDto {
  @ApiProperty({
    description: 'Unique identifier for the history record',
    example: 'hist_123456',
  })
  id!: string;

  @ApiProperty({
    description: 'User ID who performed the action',
    example: 'user123',
  })
  userId!: string;

  @ApiProperty({
    description: 'Username of the user',
    example: 'john.doe',
    required: false,
  })
  username?: string;

  @ApiProperty({
    description: 'Pallet ID involved in the action',
    example: 'P001',
    required: false,
  })
  palletId?: string;

  @ApiProperty({
    description: 'Product code involved in the action',
    example: 'PROD001',
    required: false,
  })
  productCode?: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Sample Product',
    required: false,
  })
  productName?: string;

  @ApiProperty({
    description: 'Action performed',
    example: 'create',
  })
  action!: string;

  @ApiProperty({
    description: 'Location where action was performed',
    example: 'A-01-01',
    required: false,
  })
  location?: string;

  @ApiProperty({
    description: 'Quantity involved in the action',
    example: 100,
    required: false,
  })
  quantity?: number;

  @ApiProperty({
    description: 'Weight involved in the action',
    example: 50.5,
    required: false,
  })
  weight?: number;

  @ApiProperty({
    description: 'Description of the action',
    example: 'Pallet transferred from A-01-01 to B-02-02',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Previous state before the action',
    example: { location: 'A-01-01', quantity: 100 },
    required: false,
  })
  previousState?: any;

  @ApiProperty({
    description: 'New state after the action',
    example: { location: 'B-02-02', quantity: 100 },
    required: false,
  })
  newState?: any;

  @ApiProperty({
    description: 'Additional metadata',
    example: { batch: 'B001', supplier: 'SUP001' },
    required: false,
  })
  metadata?: any;

  @ApiProperty({
    description: 'Timestamp when the action was performed',
    example: '2024-07-15T10:30:00Z',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2024-07-15T10:30:00Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2024-07-15T10:30:00Z',
  })
  updatedAt!: string;
}

export class HistoryResponseDto {
  @ApiProperty({
    description: 'Array of history records',
    type: [HistoryRecordDto],
  })
  data!: HistoryRecordDto[];

  @ApiProperty({
    description: 'Total number of records',
    example: 150,
  })
  total!: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Number of records per page',
    example: 20,
  })
  limit!: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages!: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNext!: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPrevious!: boolean;
}
