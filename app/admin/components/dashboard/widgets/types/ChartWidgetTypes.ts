/**
 * Strategy 2: DTO/自定義 type interface - Chart Widget 類型定義
 * 為 Dashboard Widgets 中的圖表組件提供類型安全
 */

// Recharts Tooltip 類型定義
export interface RechartsTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: string;
    payload: Record<string, unknown>;
  }>;
  label?: string;
  coordinate?: { x: number; y: number };
}

// Recharts Treemap Content 類型定義
export interface RechartsTreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: {
    name: string;
    value: number;
    color: string;
    description?: string;
    [key: string]: unknown;
  };
  index?: number;
  depth?: number;
}

// Stock Distribution 相關類型
export interface StockTypeInfo {
  key: string;
  label: string;
  color: string;
  enabled: boolean;
}

export interface ProductStockData {
  product_code: string;
  injection?: number;
  pipeline?: number;
  prebook?: number;
  await?: number;
  fold?: number;
  bulk?: number;
  await_grn?: number;
  backcarpark?: number;
  data_code?: {
    description?: string;
    colour?: string;
    type?: string;
  };
}

export interface TreemapDataItem {
  name: string;
  value: number;
  color: string;
  description?: string;
}

// Chart 配置類型
export interface ChartConfigOptions {
  showLegend?: boolean;
  showTooltip?: boolean;
  animationDuration?: number;
  colors?: string[];
  height?: number;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

// 通用圖表數據類型
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
  [key: string]: unknown;
}

// 圖表狀態類型
export interface ChartState {
  data: ChartDataPoint[];
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

// 圖表過濾器類型
export interface ChartFilter {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string | number | boolean;
}

// 類型保護函數
export function isValidTooltipProps(props: unknown): props is RechartsTooltipProps {
  if (!props || typeof props !== 'object') return false;
  
  const p = props as Record<string, unknown>;
  return (
    (p.active === undefined || typeof p.active === 'boolean') &&
    (p.payload === undefined || Array.isArray(p.payload)) &&
    (p.label === undefined || typeof p.label === 'string')
  );
}

export function isValidTreemapContentProps(props: unknown): props is RechartsTreemapContentProps {
  if (!props || typeof props !== 'object') return false;
  
  const p = props as Record<string, unknown>;
  return (
    (p.x === undefined || typeof p.x === 'number') &&
    (p.y === undefined || typeof p.y === 'number') &&
    (p.width === undefined || typeof p.width === 'number') &&
    (p.height === undefined || typeof p.height === 'number')
  );
}

export function isValidStockData(data: unknown): data is ProductStockData {
  if (!data || typeof data !== 'object') return false;
  
  const d = data as Record<string, unknown>;
  return typeof d.product_code === 'string';
}

// DTO 轉換函數
// Chart 處理後數據類型
export interface ChartProcessedData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }>;
}

export class ChartDataMapper {
  static transformStockDataToTreemap(stockData: ProductStockData[], stockTypes: StockTypeInfo[]): TreemapDataItem[] {
    const result: TreemapDataItem[] = [];
    
    stockData.forEach(item => {
      stockTypes.forEach(type => {
        if (type.enabled && item[type.key as keyof ProductStockData]) {
          const value = item[type.key as keyof ProductStockData] as number;
          if (value > 0) {
            result.push({
              name: `${item.product_code} (${type.label})`,
              value,
              color: type.color,
              description: item.data_code?.description || item.product_code,
            });
          }
        }
      });
    });
    
    return result.sort((a, b) => b.value - a.value);
  }

  static extractTooltipData(props: RechartsTooltipProps): {
    isActive: boolean;
    value: number | null;
    name: string | null;
    color: string | null;
  } {
    if (!props.active || !props.payload || props.payload.length === 0) {
      return {
        isActive: false,
        value: null,
        name: null,
        color: null,
      };
    }

    const firstPayload = props.payload[0];
    return {
      isActive: true,
      value: firstPayload.value,
      name: firstPayload.name,
      color: firstPayload.color,
    };
  }

  static validateAndTransformChartData(data: unknown[]): ChartDataPoint[] {
    return data
      .filter((item): item is Record<string, unknown> => 
        item !== null && typeof item === 'object'
      )
      .map(item => ({
        name: String(item.name || 'Unknown'),
        value: Number(item.value || 0),
        color: String(item.color || '#8884d8'),
        ...item,
      }))
      .filter(item => item.value > 0);
  }
}