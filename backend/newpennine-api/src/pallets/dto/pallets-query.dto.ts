import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class PalletsQueryDto {
  @IsOptional()
  @IsString()
  warehouse?: string;

  @IsOptional()
  @IsString()
  productCode?: string;

  @IsOptional()
  @IsString()
  series?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsNumberString()
  offset?: string;
}
