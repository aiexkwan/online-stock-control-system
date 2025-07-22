/**
 * Strategy 2: DTO/自定義 type interface - Stock Chart Widget 類型定義
 * 為庫存圖表相關 Widget 組件提供類型安全
 */

// 基礎庫存數據類型
export interface StockData {
  stock: string;
  stock_level: number;
  description?: string;
  type?: string;
  product_code?: string;
  [key: string]: unknown;
}

// Stock Distribution Chart 數據類型
export interface StockDistributionData {
  name: string;
  size: number;
  value: number;
  percentage: number;
  color: string;
  fill: string;
  description: string;
  type: string;
  stock: string;
  stock_level: number;
}

// Chart 數據點類型 (用於歷史圖表)
export interface ChartDataPoint {
  time: string;
  timestamp: Date;
  [productCode: string]: unknown; // 動態的產品代碼欄位
}

// API 響應包裝類型
export interface StockApiResponse {
  success?: boolean;
  data?: unknown;
  responseTime?: number;
  [key: string]: unknown;
}

// Widget API 包裝類型
export interface StockWidgetApiWrapper {
  value?: unknown;
  error?: string;
  [key: string]: unknown;
}

// 自定義事件類型
export interface StockTypeChangeEventDetail {
  type: string;
  data: StockData[];
}

export interface StockTypeChangeEvent extends CustomEvent {
  detail: StockTypeChangeEventDetail;
}

// Recharts Tooltip Props (類型安全版本)
export interface StockTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    payload: StockDistributionData;
  }>;
  label?: string;
}

// Recharts Content Props (類型安全版本)
export interface StockTreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  percentage?: number;
  fill?: string;
  payload?: StockDistributionData;
}

// 歷史圖表 Tooltip Props
export interface HistoryTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

// 圖例 Props
export interface LegendProps {
  payload?: Array<{
    value: string;
    type: string;
    color: string;
  }>;
}

// 錯誤類型
export interface StockChartError {
  message: string;
  code?: string;
  context?: 'api' | 'chart' | 'data';
}

// 類型保護函數
export function isStockData(data: unknown): data is StockData {
  if (!data || typeof data !== 'object') return false;

  const stock = data as Record<string, unknown>;
  return typeof stock.stock === 'string' && typeof stock.stock_level === 'number';
}

export function isStockDataArray(data: unknown): data is StockData[] {
  return Array.isArray(data) && data.every(isStockData);
}

export function isStockApiResponse(data: unknown): data is StockApiResponse {
  return data !== null && typeof data === 'object';
}

export function isStockWidgetApiWrapper(data: unknown): data is StockWidgetApiWrapper {
  return data !== null && typeof data === 'object';
}

export function isStockTypeChangeEvent(event: Event): event is StockTypeChangeEvent {
  const customEvent = event as CustomEvent;
  return (
    customEvent.detail &&
    typeof customEvent.detail === 'object' &&
    typeof customEvent.detail.type === 'string' &&
    Array.isArray(customEvent.detail.data)
  );
}

export function isStockTooltipProps(props: unknown): props is StockTooltipProps {
  if (!props || typeof props !== 'object') return false;

  const p = props as Record<string, unknown>;
  return (
    (p.active === undefined || typeof p.active === 'boolean') &&
    (p.payload === undefined || Array.isArray(p.payload)) &&
    (p.label === undefined || typeof p.label === 'string')
  );
}

export function isHistoryTooltipProps(props: unknown): props is HistoryTooltipProps {
  if (!props || typeof props !== 'object') return false;

  const p = props as Record<string, unknown>;
  return (
    (p.active === undefined || typeof p.active === 'boolean') &&
    (p.payload === undefined || Array.isArray(p.payload)) &&
    (p.label === undefined || typeof p.label === 'string')
  );
}

// DTO 轉換函數
export class StockChartMapper {
  static extractStockDataFromApiResponse(response: unknown): StockData[] {
    if (!isStockApiResponse(response)) return [];

    // 處理嵌套響應格式
    let data = response.data;
    if (data && typeof data === 'object' && 'data' in data) {
      const nestedData = data as Record<string, unknown>;
      data = nestedData.data;
    }

    if (isStockDataArray(data)) {
      return data;
    }

    return [];
  }

  static extractStockDataFromWidgetWrapper(wrapper: unknown): StockData[] {
    if (!isStockWidgetApiWrapper(wrapper)) return [];

    if (isStockDataArray(wrapper.value)) {
      return wrapper.value;
    }

    return [];
  }

  static extractStringArrayFromWidgetWrapper(wrapper: unknown): string[] {
    if (!isStockWidgetApiWrapper(wrapper)) return [];

    if (Array.isArray(wrapper.value) && wrapper.value.every(item => typeof item === 'string')) {
      return wrapper.value as string[];
    }

    return [];
  }

  static extractErrorFromApiResponse(response: unknown): string | null {
    if (!isStockApiResponse(response)) return 'Invalid response format';

    if (response.error && typeof response.error === 'string') {
      return response.error;
    }

    return null;
  }

  static extractErrorFromWidgetWrapper(wrapper: unknown): string | null {
    if (!isStockWidgetApiWrapper(wrapper)) return 'Invalid data format';

    if (wrapper.error && typeof wrapper.error === 'string') {
      return wrapper.error;
    }

    return null;
  }

  static createStockDistributionData(
    rawData: StockData[],
    type: string,
    colors: string[]
  ): StockDistributionData[] {
    if (!rawData || !Array.isArray(rawData)) return [];

    // 過濾選定類型
    let filteredData = rawData;
    if (type !== 'all' && type !== 'ALL TYPES') {
      filteredData = rawData.filter(item => item.type === type);
    }

    // 按庫存量排序
    const sortedData = filteredData
      .filter(item => item.stock_level > 0)
      .sort((a, b) => b.stock_level - a.stock_level);

    const totalStock = sortedData.reduce((sum, item) => sum + item.stock_level, 0);

    return sortedData.map((item, index) => ({
      name: item.product_code || item.stock,
      size: item.stock_level,
      value: item.stock_level,
      percentage: totalStock > 0 ? (item.stock_level / totalStock) * 100 : 0,
      color: colors[index % colors.length] || '#000000',
      fill: colors[index % colors.length] || '#000000',
      description: item.description || '-',
      type: item.type || '-',
      stock: item.product_code || item.stock,
      stock_level: item.stock_level,
    }));
  }

  static validateCustomEvent(event: Event): StockTypeChangeEventDetail | null {
    if (!isStockTypeChangeEvent(event)) {
      return null;
    }

    return event.detail;
  }

  static safeExtractTooltipData(props: unknown): {
    isValid: boolean;
    data: StockDistributionData | null;
  } {
    if (!isStockTooltipProps(props)) {
      return { isValid: false, data: null };
    }

    if (!props.active || !props.payload || props.payload.length === 0) {
      return { isValid: false, data: null };
    }

    return {
      isValid: true,
      data: props.payload[0].payload,
    };
  }

  static safeExtractHistoryTooltipData(props: unknown): {
    isValid: boolean;
    entries: Array<{ name: string; value: number; color: string }>;
    label: string;
  } {
    if (!isHistoryTooltipProps(props)) {
      return { isValid: false, entries: [], label: '' };
    }

    if (!props.active || !props.payload || props.payload.length === 0) {
      return { isValid: false, entries: [], label: '' };
    }

    const entries = props.payload.map(entry => ({
      name: entry.name,
      value: entry.value,
      color: entry.color,
    }));

    return {
      isValid: true,
      entries,
      label: props.label || '',
    };
  }

  static createStockChartError(
    error: unknown,
    context?: StockChartError['context']
  ): StockChartError {
    if (error instanceof Error) {
      return {
        message: error.message,
        context,
      };
    }

    if (typeof error === 'string') {
      return {
        message: error,
        context,
      };
    }

    return {
      message: 'Unknown error occurred',
      context,
    };
  }
}
