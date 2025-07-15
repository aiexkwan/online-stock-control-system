export class ChartDataPointDto {
  date: string;
  value: number;
  previousValue?: number;
  metadata?: Record<string, any>;
}

export class ChartConfigDto {
  type: string;
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  colors?: string[];
  height?: number;
}

export class AcoOrderProgressChartResponseDto {
  data: ChartDataPointDto[];
  config: ChartConfigDto;
  totalDataPoints: number;
  dateRange: string;
  summary?: {
    average: number;
    minimum: number;
    maximum: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  lastUpdated: string;
  queryParams?: Record<string, any>;
}