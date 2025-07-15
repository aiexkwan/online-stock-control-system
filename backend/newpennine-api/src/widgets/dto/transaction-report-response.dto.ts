import { ApiProperty } from '@nestjs/swagger';

export class TransactionReportItemDto {
  @ApiProperty({ example: '2025-01-15T10:30:00Z' })
  timestamp: string;

  @ApiProperty({ example: 'Transfer' })
  transactionType: string;

  @ApiProperty({ example: 'PAL001' })
  palletId: string;

  @ApiProperty({ example: 'PROD001' })
  productCode: string;

  @ApiProperty({ example: 'Widget A' })
  productName: string;

  @ApiProperty({ example: 100 })
  quantity: number;

  @ApiProperty({ example: 'Injection' })
  fromLocation?: string;

  @ApiProperty({ example: 'Pipeline' })
  toLocation?: string;

  @ApiProperty({ example: 'user123' })
  userId?: string;

  @ApiProperty({ example: 'John Doe' })
  userName?: string;

  @ApiProperty({ example: 'Transfer for order #123' })
  notes?: string;
}

export class TransactionReportSummaryDto {
  @ApiProperty({ example: 150 })
  totalTransactions: number;

  @ApiProperty({ example: 10000 })
  totalQuantity: number;

  @ApiProperty({ example: 50 })
  uniqueProducts: number;

  @ApiProperty({ example: 25 })
  uniqueUsers: number;

  @ApiProperty({ example: { Transfer: 100, Receipt: 30, Adjustment: 20 } })
  transactionsByType: Record<string, number>;
}

export class TransactionReportMetadataDto {
  @ApiProperty({ example: '2025-01-15T10:30:00Z' })
  executed_at?: string;

  @ApiProperty({ example: '250ms' })
  calculation_time?: string;

  @ApiProperty({ example: '2025-01-01' })
  startDate: string;

  @ApiProperty({ example: '2025-01-15' })
  endDate: string;

  @ApiProperty({ example: 'All Warehouses' })
  warehouse?: string;
}

export class TransactionReportResponseDto {
  @ApiProperty({ 
    type: [TransactionReportItemDto],
    description: 'Array of transaction records'
  })
  transactions: TransactionReportItemDto[];

  @ApiProperty({ type: TransactionReportSummaryDto })
  summary: TransactionReportSummaryDto;

  @ApiProperty({ type: TransactionReportMetadataDto })
  metadata: TransactionReportMetadataDto;

  @ApiProperty({ example: '2025-01-15T10:30:00Z' })
  timestamp: string;

  @ApiProperty({ required: false })
  error?: string;
}