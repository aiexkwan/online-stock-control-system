import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class GrnReportDataQueryDto {
  @IsString()
  @IsNotEmpty()
  grnRef!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productCodes?: string[];
}
