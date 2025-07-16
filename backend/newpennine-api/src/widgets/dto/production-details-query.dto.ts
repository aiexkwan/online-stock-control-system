import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ProductionDetailsQueryDto {
  @ApiProperty({
    description: 'Start date for production details (ISO 8601)',
    example: '2025-07-01T00:00:00Z',
  })
  @IsNotEmpty({ message: 'Start date is required' })
  @IsString({ message: 'Start date must be a string' })
  startDate: string;

  @ApiProperty({
    description: 'End date for production details (ISO 8601)',
    example: '2025-07-16T23:59:59Z',
  })
  @IsNotEmpty({ message: 'End date is required' })
  @IsString({ message: 'End date must be a string' })
  endDate: string;

  @ApiProperty({
    description: 'Filter by warehouse location',
    example: 'warehouse_a',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Warehouse must be a string' })
  warehouse?: string;

  @ApiProperty({
    description: 'Filter by product type',
    example: 'Finished Good',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Product type must be a string' })
  productType?: string;

  @ApiProperty({
    description: 'Maximum number of records to return',
    minimum: 1,
    maximum: 1000,
    default: 50,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @Type(() => Number)
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(1000, { message: 'Limit cannot exceed 1000' })
  limit?: number = 50;
}
