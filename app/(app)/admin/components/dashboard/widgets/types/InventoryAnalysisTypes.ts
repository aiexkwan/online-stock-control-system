/**
 * Strategy 2: DTO/自定義 type interface - Inventory Analysis Widget 類型定義
 * 為庫存分析相關 Widget 組件提供類型安全
 */

// 庫存分析基礎類型
export interface ProductAnalysis {
  productCode: string;
  description: string;
  currentStock: number;
  orderDemand: number;
  remainingStock: number;
  fulfillmentRate: number;
  isSufficient: boolean;
}

export interface AnalysisSummary {
  totalStock: number;
  totalDemand: number;
  totalRemaining: number;
  overallSufficient: boolean;
  insufficientCount: number;
  sufficientCount: number;
}

export interface InventoryAnalysisResponse {
  products: ProductAnalysis[];
  summary: AnalysisSummary;
  metadata?: {
    executed_at: string;
    calculation_time?: string;
    calculationTime?: string; // Alternative key for compatibility
  };
}

// 訂單進度類型
export interface OrderProgress {
  uuid: string;
  order_ref: string;
  account_num: string;
  product_code: string;
  product_desc: string;
  product_qty: number;
  loaded_qty: number;
  created_at: string;
  progress: number;
  progress_text: string;
  status: 'pending' | 'in_progress' | 'completed';
  status_color: 'red' | 'yellow' | 'orange' | 'green';
}

// Widget API 響應包裝類型
export interface WidgetApiDataWrapper {
  value?: unknown;
  error?: string;
  metadata?: {
    calculationTime?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Custom Event 類型定義
export interface StockTypeChangeEvent extends CustomEvent {
  detail: {
    type: string;
    data: Array<Record<string, unknown>>;
  };
}

// 類型保護函數
export function isProductAnalysis(data: unknown): data is ProductAnalysis {
  if (!data || typeof data !== 'object') return false;

  const product = data as Record<string, unknown>;
  return (
    typeof product.productCode === 'string' &&
    typeof product.description === 'string' &&
    typeof product.currentStock === 'number' &&
    typeof product.orderDemand === 'number' &&
    typeof product.remainingStock === 'number' &&
    typeof product.fulfillmentRate === 'number' &&
    typeof product.isSufficient === 'boolean'
  );
}

export function isAnalysisSummary(data: unknown): data is AnalysisSummary {
  if (!data || typeof data !== 'object') return false;

  const summary = data as Record<string, unknown>;
  return (
    typeof summary.totalStock === 'number' &&
    typeof summary.totalDemand === 'number' &&
    typeof summary.totalRemaining === 'number' &&
    typeof summary.overallSufficient === 'boolean' &&
    typeof summary.insufficientCount === 'number' &&
    typeof summary.sufficientCount === 'number'
  );
}

export function isInventoryAnalysisResponse(data: unknown): data is InventoryAnalysisResponse {
  if (!data || typeof data !== 'object') return false;

  const response = data as Record<string, unknown>;
  return (
    Array.isArray(response.products) &&
    response.products.every(isProductAnalysis) &&
    isAnalysisSummary(response.summary)
  );
}

export function isOrderProgress(data: unknown): data is OrderProgress {
  if (!data || typeof data !== 'object') return false;

  const order = data as Record<string, unknown>;
  return (
    typeof order.uuid === 'string' &&
    typeof order.order_ref === 'string' &&
    typeof order.product_code === 'string' &&
    typeof order.product_qty === 'number' &&
    typeof order.loaded_qty === 'number' &&
    typeof order.progress === 'number' &&
    ['pending', 'in_progress', 'completed'].includes(order.status as string) &&
    ['red', 'yellow', 'orange', 'green'].includes(order.status_color as string)
  );
}

export function isWidgetApiDataWrapper(data: unknown): data is WidgetApiDataWrapper {
  return data !== null && typeof data === 'object';
}

// DTO 轉換和處理函數
export class InventoryAnalysisMapper {
  static extractInventoryAnalysisFromWrapper(wrapper: unknown): InventoryAnalysisResponse | null {
    if (!isWidgetApiDataWrapper(wrapper)) return null;

    if (isInventoryAnalysisResponse(wrapper.value)) {
      return wrapper.value;
    }

    return null;
  }

  static extractCalculationTime(wrapper: unknown): string {
    if (!isWidgetApiDataWrapper(wrapper)) return '';

    if (wrapper.metadata?.calculationTime) {
      return wrapper.metadata.calculationTime;
    }

    if (wrapper.metadata?.calculation_time) {
      return wrapper.metadata.calculation_time as string;
    }

    return '';
  }

  static extractOrdersFromApiResponse(data: unknown): OrderProgress[] {
    // 處理直接數組格式
    if (Array.isArray(data)) {
      return data
        .map(item => this.transformRawDataToOrderProgress(item))
        .filter((order): order is OrderProgress => order !== null);
    }

    // 處理包裝格式
    if (isWidgetApiDataWrapper(data) && Array.isArray(data.value)) {
      return data.value
        .map(item => this.transformRawDataToOrderProgress(item))
        .filter((order): order is OrderProgress => order !== null);
    }

    return [];
  }

  private static transformRawDataToOrderProgress(item: unknown): OrderProgress | null {
    if (!item || typeof item !== 'object') return null;

    const rawOrder = item as Record<string, unknown>;

    // 安全的類型轉換
    const productQty =
      typeof rawOrder.product_qty === 'number'
        ? rawOrder.product_qty
        : parseInt(String(rawOrder.product_qty || '0'), 10) || 0;

    const loadedQty = parseInt(String(rawOrder.loaded_qty || '0'), 10);

    // 計算進度
    const progress = productQty > 0 ? (loadedQty / productQty) * 100 : 0;

    // 判斷狀態
    let status: OrderProgress['status'] = 'pending';
    let statusColor: OrderProgress['status_color'] = 'red';

    if (progress >= 100) {
      status = 'completed';
      statusColor = 'green';
    } else if (progress > 0) {
      status = 'in_progress';
      statusColor = progress >= 75 ? 'orange' : 'yellow';
    }

    return {
      uuid: String(rawOrder.uuid || ''),
      order_ref: String(rawOrder.order_ref || ''),
      account_num: String(rawOrder.account_num || ''),
      product_code: String(rawOrder.product_code || ''),
      product_desc: String(rawOrder.product_desc || ''),
      product_qty: productQty,
      loaded_qty: loadedQty,
      created_at: String(rawOrder.created_at || ''),
      progress,
      progress_text: `${loadedQty}/${productQty}`,
      status,
      status_color: statusColor,
    };
  }

  static extractErrorFromWrapper(wrapper: unknown): string | null {
    if (!isWidgetApiDataWrapper(wrapper)) return 'Invalid data format';

    if (wrapper.error && typeof wrapper.error === 'string') {
      return wrapper.error;
    }

    return null;
  }

  static validateStockTypeChangeEvent(event: Event): event is StockTypeChangeEvent {
    const customEvent = event as CustomEvent;
    return (
      customEvent.detail &&
      typeof customEvent.detail === 'object' &&
      typeof customEvent.detail.type === 'string' &&
      Array.isArray(customEvent.detail.data)
    );
  }
}
