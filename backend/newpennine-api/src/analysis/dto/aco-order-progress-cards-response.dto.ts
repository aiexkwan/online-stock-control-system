export class AcoOrderProgressCardDto {
  id: string;
  title: string;
  value: number;
  previousValue?: number;
  percentageChange?: number;
  trend?: 'up' | 'down' | 'stable';
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
}

export class AcoOrderProgressCardsResponseDto {
  cards: AcoOrderProgressCardDto[];
  totalCards: number;
  dateRange?: string;
  lastUpdated: string;
  metadata?: Record<string, any>;
}