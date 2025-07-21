import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TransferListQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  fromLocation?: string;

  @IsOptional()
  @IsString()
  toLocation?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50;
}
