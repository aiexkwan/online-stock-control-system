import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RpcQueryDto {
  @ApiProperty({ required: false, description: 'Function name to call' })
  @IsOptional()
  @IsString()
  functionName?: string;

  @ApiProperty({
    required: false,
    description: 'Parameters for the RPC function',
  })
  @IsOptional()
  params?: any;
}

export class AwaitLocationCountQueryDto {
  @ApiProperty({ required: false, description: 'Location filter' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false, description: 'Date filter' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class StockLevelHistoryQueryDto {
  @ApiProperty({ required: false, description: 'Product code filter' })
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiProperty({ required: false, description: 'Start date for history' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date for history' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Location filter' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false, description: 'Limit number of results' })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
