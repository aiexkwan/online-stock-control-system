import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class StatsQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class InventoryQueryDto {
  @IsOptional()
  @IsString()
  warehouse?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsNumberString()
  offset?: string;
}
