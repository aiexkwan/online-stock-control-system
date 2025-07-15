import { ApiProperty } from '@nestjs/swagger';

export class TransferResponseDto {
  @ApiProperty({ description: 'Transfer record ID' })
  id: string;

  @ApiProperty({ description: 'Pallet ID' })
  palletId: string;

  @ApiProperty({ description: 'Product code' })
  productCode: string;

  @ApiProperty({ description: 'Product name', required: false })
  productName?: string;

  @ApiProperty({ description: 'Transfer quantity' })
  quantity: number;

  @ApiProperty({ description: 'Source location' })
  fromLocation: string;

  @ApiProperty({ description: 'Destination location' })
  toLocation: string;

  @ApiProperty({ description: 'Transfer status' })
  status: string;

  @ApiProperty({ description: 'User ID who performed the transfer' })
  userId: string;

  @ApiProperty({ description: 'User name', required: false })
  userName?: string;

  @ApiProperty({ description: 'Transfer date' })
  transferDate: Date;

  @ApiProperty({ description: 'Transfer notes', required: false })
  notes?: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}

export class TransfersListResponseDto {
  @ApiProperty({
    description: 'List of transfers',
    type: [TransferResponseDto],
  })
  items: TransferResponseDto[];

  @ApiProperty({ description: 'Total number of transfers' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrevious: boolean;
}
