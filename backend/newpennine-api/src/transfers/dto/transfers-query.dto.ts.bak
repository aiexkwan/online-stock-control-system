import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum TransferStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum SortBy {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  TRANSFER_DATE = 'transfer_date',
  QUANTITY = 'quantity',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class TransfersQueryDto {
  @ApiProperty({ required: false, description: 'Filter by pallet ID' })
  @IsOptional()
  @IsString()
  palletId?: string;

  @ApiProperty({ required: false, description: 'Filter by product code' })
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiProperty({ required: false, description: 'Filter by source location' })
  @IsOptional()
  @IsString()
  fromLocation?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by destination location',
  })
  @IsOptional()
  @IsString()
  toLocation?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by transfer status',
    enum: TransferStatus,
  })
  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus;

  @ApiProperty({
    required: false,
    description: 'Filter by user ID who performed the transfer',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    required: false,
    description: 'Filter transfers from this date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({
    required: false,
    description: 'Filter transfers to this date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiProperty({
    required: false,
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @ApiProperty({
    required: false,
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiProperty({
    required: false,
    description: 'Sort by field',
    enum: SortBy,
    default: SortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy: SortBy = SortBy.CREATED_AT;

  @ApiProperty({
    required: false,
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;

  @ApiProperty({
    required: false,
    description: 'Search text for pallet ID or product code',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
