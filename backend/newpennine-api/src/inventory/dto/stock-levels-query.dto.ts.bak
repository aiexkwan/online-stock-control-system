import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class StockLevelsQueryDto {
  @ApiPropertyOptional({
    description: 'Product type filter',
    example: 'EasyLiner',
  })
  @IsOptional()
  @IsString()
  productType?: string;

  @ApiPropertyOptional({
    description: 'Product code filter',
    example: 'PROD001',
  })
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional({
    description: 'Minimum stock level filter',
    example: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  minStockLevel?: number;

  @ApiPropertyOptional({
    description: 'Maximum stock level filter',
    example: 1000,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  maxStockLevel?: number;

  @ApiPropertyOptional({
    description: 'Limit number of results',
    example: 100,
    default: 100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Offset for pagination',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  offset?: number;
}
