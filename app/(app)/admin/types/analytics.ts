export interface WorkLevelData {
  level: number;
  description: string;
  count: number;
}

export interface ChartClickEventData {
  name: string;
  value: number;
  payload?: Record<string, unknown>;
}

export interface WorkLevelCardProps {
  data?: WorkLevelData[];
  loading?: boolean;
  className?: string;
  chartTypes?: string[];
  dataSources?: string[];
  dateRange?: { start: Date; end: Date };
  timeGranularity?: string;
  aggregationType?: string;
  groupBy?: string;
  filters?: Record<string, unknown>;
  limit?: number;
  showComparison?: boolean;
  showPerformance?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  animationEnabled?: boolean;
  _showLegend?: boolean;
  _showTooltip?: boolean;
  _animationEnabled?: boolean;
  height?: string | number;
  title?: string;
  subtitle?: string;
  _title?: string;
  _subtitle?: string;
  isEditMode?: boolean;
  onChartClick?: (data: ChartClickEventData) => void;
  onRefresh?: () => void;
}
