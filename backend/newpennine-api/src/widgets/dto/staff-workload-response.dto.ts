import { ApiProperty } from '@nestjs/swagger';

export class StaffWorkloadItemDto {
  @ApiProperty({
    description: 'Date of the workload entry',
    example: '2025-07-16',
  })
  date: string;

  @ApiProperty({
    description: 'Number of tasks completed',
    example: 45,
  })
  task_count: number;

  @ApiProperty({
    description: 'User ID who completed the tasks',
    example: 'user123',
  })
  user_id: string;

  @ApiProperty({
    description: 'Department where tasks were completed',
    example: 'injection',
  })
  department?: string;

  @ApiProperty({
    description: 'Type of action performed',
    example: 'QC passed',
  })
  action_type: string;

  @ApiProperty({
    description: 'Total processing time in minutes',
    example: 240,
  })
  processing_time_minutes?: number;
}

export class StaffWorkloadSummaryDto {
  @ApiProperty({
    description: 'Total number of tasks completed',
    example: 1500,
  })
  total_tasks: number;

  @ApiProperty({
    description: 'Average tasks per day',
    example: 95.5,
  })
  avg_tasks_per_day: number;

  @ApiProperty({
    description: 'Peak workload day',
    example: '2025-07-15',
  })
  peak_day: string;

  @ApiProperty({
    description: 'Maximum tasks completed in a single day',
    example: 120,
  })
  peak_tasks: number;

  @ApiProperty({
    description: 'Number of active staff members',
    example: 8,
  })
  active_staff_count: number;

  @ApiProperty({
    description: 'Most productive staff member',
    example: 'user123',
  })
  top_performer?: string;
}

export class StaffWorkloadMetadataDto {
  @ApiProperty({
    description: 'Applied filters',
    example: { department: 'injection', actionType: 'QC passed' },
  })
  filters: Record<string, any>;

  @ApiProperty({
    description: 'Query execution time in milliseconds',
    example: 45,
  })
  execution_time_ms: number;

  @ApiProperty({
    description: 'Timestamp when the query was executed',
    example: '2025-07-16T10:30:00Z',
  })
  executed_at: string;

  @ApiProperty({
    description: 'Date range analyzed',
    example: { start: '2025-07-01', end: '2025-07-16' },
  })
  date_range: { start: string; end: string };
}

export class StaffWorkloadResponseDto {
  @ApiProperty({
    description: 'Daily workload data',
    type: [StaffWorkloadItemDto],
  })
  workload: StaffWorkloadItemDto[];

  @ApiProperty({
    description: 'Workload summary statistics',
    type: StaffWorkloadSummaryDto,
  })
  summary: StaffWorkloadSummaryDto;

  @ApiProperty({
    description: 'Response metadata',
    type: StaffWorkloadMetadataDto,
  })
  metadata: StaffWorkloadMetadataDto;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2025-07-16T10:30:00Z',
  })
  timestamp: string;
}
