import { IsDateString, IsOptional } from 'class-validator';

export class TransactionReportQueryDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  warehouse?: string;
}
