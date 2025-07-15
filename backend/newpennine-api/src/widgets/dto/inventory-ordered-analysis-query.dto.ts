import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class InventoryOrderedAnalysisQueryDto {
  @ApiPropertyOptional({
    description: 'Product type to filter by',
    example: 'Injection Plastic',
  })
  @IsOptional()
  @IsString()
  productType?: string;

  @ApiPropertyOptional({
    description: 'Array of product codes to filter by',
    example: ['PROD001', 'PROD002'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productCodes?: string[];
}
