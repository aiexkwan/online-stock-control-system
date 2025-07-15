import { ApiProperty } from '@nestjs/swagger';

export class RpcResponseDto<T = any> {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response data' })
  data?: T;

  @ApiProperty({ description: 'Error message if any' })
  error?: string;

  @ApiProperty({ description: 'Response metadata' })
  metadata?: {
    executionTime: number;
    functionName: string;
    count?: number;
  };
}

export class AwaitLocationCountResponseDto {
  @ApiProperty({ description: 'Total count of await locations' })
  count: number;

  @ApiProperty({ description: 'Location breakdown' })
  locations: {
    location: string;
    count: number;
  }[];

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: string;
}

export class StockLevelHistoryResponseDto {
  @ApiProperty({ description: 'Product code' })
  productCode: string;

  @ApiProperty({ description: 'Stock level history data' })
  history: {
    date: string;
    stockLevel: number;
    location: string;
    changeType: string;
    previousLevel: number;
    newLevel: number;
  }[];

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    totalRecords: number;
    averageLevel: number;
    maxLevel: number;
    minLevel: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}
