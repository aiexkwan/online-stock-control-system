// Analytics and reporting related types

import { FilterValue } from './common';

// Import GraphQL types
export type {
  ChartType,
  AggregationType,
  TimeGranularity,
  ChartCardData,
  ChartQueryInput,
  ChartDataset,
  ChartConfig,
} from '@/types/generated/graphql';

// WorkLevelCard types
export interface WorkLevelCardProps {
  // Chart configuration
  chartTypes: any[]; // ChartType[]
  dataSources?: string[];
  dateRange?: { start: Date; end: Date };
  timeGranularity?: any; // TimeGranularity
  aggregationType?: any; // AggregationType
  groupBy?: string[];
  filters?: Record<string, FilterValue>;
  limit?: number;
  
  // Display options
  showComparison?: boolean;
  showPerformance?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  animationEnabled?: boolean;
  
  // Styling
  className?: string;
  height?: number | string;
  title?: string;
  subtitle?: string;
  isEditMode?: boolean;
  
  // Callbacks
  onChartClick?: <T = unknown>(chartType: any, data: ChartClickEventData<T>) => void;
  onRefresh?: () => void;
}

export interface WorkLevelData {
  date: string;
  department: string;
  level: number;
  target: number;
  variance: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface ChartClickEventData<T = unknown> {
  activePayload?: Array<{
    dataKey: string;
    value: T;
    payload: T;
  }>;
  activeIndex?: number;
  activeCoordinate?: { x: number; y: number };
  chartX?: number;
  chartY?: number;
}

// VerticalTimelineCard types
export interface VerticalTimelineCardProps {
  className?: string;
  events?: TimelineEvent[];
  orientation?: 'vertical' | 'horizontal';
  showConnectors?: boolean;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
  metadata?: Record<string, any>;
}

export interface TransferTimeFlowItem {
  palletId: string;
  material: string;
  fromLocation: string;
  toLocation: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'completed' | 'in_progress' | 'cancelled';
  operator?: string;
}

// AnalysisCardSelector types
export interface AnalysisCardSelectorProps {
  className?: string;
  cards?: AnalysisCard[];
  selectedCard?: string;
  onCardSelect?: (cardId: string) => void;
}

export interface AnalysisCard {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  category: 'performance' | 'inventory' | 'quality' | 'financial' | 'operational';
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  permissions?: string[];
}

export interface CardProps {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  category?: string;
  onClick?: () => void;
  isSelected?: boolean;
  isDisabled?: boolean;
}

