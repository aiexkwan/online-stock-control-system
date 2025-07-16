import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StaffWorkloadQueryDto {
  @ApiProperty({
    description: 'Start date for staff workload analysis (ISO 8601)',
    example: '2025-07-01T00:00:00Z',
  })
  @IsNotEmpty({ message: 'Start date is required' })
  @IsString({ message: 'Start date must be a string' })
  startDate: string;

  @ApiProperty({
    description: 'End date for staff workload analysis (ISO 8601)',
    example: '2025-07-16T23:59:59Z',
  })
  @IsNotEmpty({ message: 'End date is required' })
  @IsString({ message: 'End date must be a string' })
  endDate: string;

  @ApiProperty({
    description: 'Filter by department',
    example: 'injection',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Department must be a string' })
  department?: string;

  @ApiProperty({
    description: 'Filter by specific user ID',
    example: 'user123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'User ID must be a string' })
  userId?: string;

  @ApiProperty({
    description: 'Filter by action type',
    example: 'QC passed',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Action type must be a string' })
  actionType?: string;
}
