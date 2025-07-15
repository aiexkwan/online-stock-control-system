import { IsOptional, IsString, IsNumberString, IsEnum } from 'class-validator';

export enum StockType {
  ALL = 'all',
  GOOD = 'good',
  DAMAGE = 'damage',
}

export class InventoryQueryDto {
  @IsOptional()
  @IsString()
  warehouse?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  productCode?: string;

  @IsOptional()
  @IsString()
  pltNum?: string;

  @IsOptional()
  @IsEnum(StockType)
  stockType?: StockType;

  @IsOptional()
  @IsNumberString()
  minQty?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsNumberString()
  offset?: string;
}
