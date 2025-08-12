import { ApiProperty } from '@nestjs/swagger';
import { 
  RpcData, 
  RpcResultSchema,
  validateRpcResult,
  type RpcResult 
} from '@/lib/validation/zod-schemas';
import { z } from 'zod';

// 使用 Zod 驗證的 RPC 回應類型
export class RpcResponseDto implements RpcResult {
  @ApiProperty({ description: 'Success status' })
  success!: boolean;

  @ApiProperty({ description: 'Response data - type-safe with Zod validation' })
  data?: RpcData;

  @ApiProperty({ description: 'Error message if any' })
  error?: string;

  @ApiProperty({ description: 'Success message if any' })
  message?: string;

  @ApiProperty({ description: 'Execution time in milliseconds' })
  executionTime?: number;

  @ApiProperty({ description: 'Result count' })
  count?: number;

  // 静態工具方法：安全建立 RPC 回應
  static create(data: unknown): RpcResponseDto {
    const validation = validateRpcResult(data);
    if (!validation.success) {
      throw new Error(`Invalid RPC response data: ${validation.error}`);
    }
    return validation.data as RpcResponseDto;
  }

  // 驗證方法：確保数據的有效性
  validate(): boolean {
    return RpcResultSchema.safeParse(this).success;
  }
}

// Await Location Count 特定回應 Schema
const AwaitLocationCountSchema = z.object({
  count: z.number(),
  locations: z.array(z.object({
    location: z.string(),
    count: z.number(),
  })),
  lastUpdated: z.string(),
});

export class AwaitLocationCountResponseDto {
  @ApiProperty({ description: 'Total count of await locations' })
  count!: number;

  @ApiProperty({ description: 'Location breakdown' })
  locations!: {
    location: string;
    count: number;
  }[];

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated!: string;

  // Zod 驗證方法
  static validate(data: unknown): data is AwaitLocationCountResponseDto {
    return AwaitLocationCountSchema.safeParse(data).success;
  }

  static create(data: unknown): AwaitLocationCountResponseDto {
    const result = AwaitLocationCountSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`Invalid AwaitLocationCount data: ${result.error.message}`);
    }
    return result.data as AwaitLocationCountResponseDto;
  }
}

// Stock Level History 特定回應 Schema
const StockLevelHistoryResponseSchema = z.object({
  productCode: z.string(),
  history: z.array(z.object({
    date: z.string(),
    stockLevel: z.number(),
    location: z.string(),
    changeType: z.string(),
    previousLevel: z.number(),
    newLevel: z.number(),
  })),
  summary: z.object({
    totalRecords: z.number(),
    averageLevel: z.number(),
    maxLevel: z.number(),
    minLevel: z.number(),
    dateRange: z.object({
      start: z.string(),
      end: z.string(),
    }),
  }),
});

export class StockLevelHistoryResponseDto {
  @ApiProperty({ description: 'Product code' })
  productCode!: string;

  @ApiProperty({ description: 'Stock level history data' })
  history!: {
    date: string;
    stockLevel: number;
    location: string;
    changeType: string;
    previousLevel: number;
    newLevel: number;
  }[];

  @ApiProperty({ description: 'Summary statistics' })
  summary!: {
    totalRecords: number;
    averageLevel: number;
    maxLevel: number;
    minLevel: number;
    dateRange: {
      start: string;
      end: string;
    };
  };

  // Zod 驗證方法
  static validate(data: unknown): data is StockLevelHistoryResponseDto {
    return StockLevelHistoryResponseSchema.safeParse(data).success;
  }

  static create(data: unknown): StockLevelHistoryResponseDto {
    const result = StockLevelHistoryResponseSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`Invalid StockLevelHistory data: ${result.error.message}`);
    }
    return result.data as StockLevelHistoryResponseDto;
  }
}

// 導出類型
export type AwaitLocationCountResponse = z.infer<typeof AwaitLocationCountSchema>;
export type StockLevelHistoryResponse = z.infer<typeof StockLevelHistoryResponseSchema>;
