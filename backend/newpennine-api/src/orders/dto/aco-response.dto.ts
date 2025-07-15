import { ApiProperty } from '@nestjs/swagger';
import { AcoStatus } from './aco-query.dto';

export class AcoRecordDto {
  @ApiProperty({
    description: 'ACO record ID',
    example: 'ACO-2024-001',
  })
  id: string;

  @ApiProperty({
    description: 'ACO ID',
    example: 'ACO-2024-001',
  })
  aco_id: string;

  @ApiProperty({
    description: 'Product code',
    example: 'PRD-001',
  })
  product_code: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Sample Product',
  })
  product_description?: string;

  @ApiProperty({
    description: 'Supplier name',
    example: 'Supplier ABC',
  })
  supplier: string;

  @ApiProperty({
    description: 'Quantity ordered',
    example: 100,
  })
  quantity: number;

  @ApiProperty({
    description: 'Unit price',
    example: 25.5,
  })
  unit_price?: number;

  @ApiProperty({
    description: 'Total amount',
    example: 2550.0,
  })
  total_amount?: number;

  @ApiProperty({
    description: 'Order status',
    enum: AcoStatus,
    example: AcoStatus.PENDING,
  })
  status: AcoStatus;

  @ApiProperty({
    description: 'Expected delivery date',
    example: '2024-07-20T10:00:00Z',
  })
  expected_delivery?: string;

  @ApiProperty({
    description: 'Actual delivery date',
    example: '2024-07-18T14:30:00Z',
  })
  actual_delivery?: string;

  @ApiProperty({
    description: 'Notes or comments',
    example: 'Urgent delivery required',
  })
  notes?: string;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2024-07-15T09:00:00Z',
  })
  created_at: string;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2024-07-15T09:30:00Z',
  })
  updated_at: string;

  @ApiProperty({
    description: 'Created by user ID',
    example: 'user123',
  })
  created_by?: string;

  @ApiProperty({
    description: 'Updated by user ID',
    example: 'user456',
  })
  updated_by?: string;
}

export class AcoResponseDto {
  @ApiProperty({
    description: 'Array of ACO records',
    type: [AcoRecordDto],
  })
  data: AcoRecordDto[];

  @ApiProperty({
    description: 'Total count of records',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 15,
  })
  total_pages: number;

  @ApiProperty({
    description: 'Has next page',
    example: true,
  })
  has_next: boolean;

  @ApiProperty({
    description: 'Has previous page',
    example: false,
  })
  has_previous: boolean;
}
