type HeroIcon = React.ComponentType<{ className?: string }>;

// Icon component type
type IconComponent = React.ComponentType<{ className?: string }>;

// Card configuration
export interface CardConfig {
  component: string; // Component name (e.g., 'StockLevelListAndChartCard')
  displayName: string; // Display name (e.g., 'Stock Level')
  category: string; // Category it belongs to
}

// Category configuration
export interface CardCategory {
  id: string;
  label: string;
  icon: HeroIcon | IconComponent;
  color: string;
}

// Tab types
export type TabType = 'admin' | 'operation';

// Operation menu items
export interface OperationMenuItem {
  id: string;
  label: string;
  subItems?: { id: string; label: string }[];
}

// User info interface moved to common.ts

// Vertical timeline props
export interface VerticalTimelineCardProps {
  height?: string | number;
  className?: string;
  isEditMode?: boolean;
  _isEditMode?: boolean;
  timeFrame?: {
    start: Date;
    end: Date;
  };
  limit?: number;
}

// Transfer time flow item
export interface TransferTimeFlowItem {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  palletNumber: string;
  fromLocation: string;
  toLocation: string;
  formattedDate: string;
  formattedTime: string;
}
