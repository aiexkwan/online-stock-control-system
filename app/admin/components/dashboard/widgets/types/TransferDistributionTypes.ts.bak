/**
 * Strategy 2: DTO/自定義 interface - Transfer Distribution Widget 類型定義
 * 用於轉移時間分佈相關組件的類型安全
 */

// Transfer 相關數據類型
export interface TransferTimeSlot {
  time: string;
  value: number;
  fullTime: string;
}

export interface TransferTimeDistributionData {
  timeSlots: TransferTimeSlot[];
  totalTransfers: number;
  optimized?: boolean;
  calculationTime?: string;
  peakHour?: string;
}

// API 響應類型
export interface TransferDistributionAPIResponse {
  timeSlots: unknown[];
  totalTransfers: number;
}

// Products Distribution 相關類型
export interface ProductDistributionItem {
  product_code: string;
  description?: string;
  value: number;
  percentage?: number;
  rank?: number;
}

export interface ProductsDistributionData {
  products: ProductDistributionItem[];
  totalValue: number;
  totalProducts: number;
  optimized?: boolean;
}

// 類型保護函數
export function isValidTimeSlot(slot: unknown): slot is TransferTimeSlot {
  if (!slot || typeof slot !== 'object') return false;

  const s = slot as Record<string, unknown>;
  return (
    typeof s.time === 'string' && typeof s.value === 'number' && typeof s.fullTime === 'string'
  );
}

export function isValidProductDistributionItem(item: unknown): item is ProductDistributionItem {
  if (!item || typeof item !== 'object') return false;

  const i = item as Record<string, unknown>;
  return typeof i.product_code === 'string' && typeof i.value === 'number';
}

// 數據轉換工具
export class TransferDistributionMapper {
  static transformAPITimeSlots(rawSlots: unknown[]): TransferTimeSlot[] {
    return rawSlots
      .filter((slot): slot is Record<string, unknown> => slot !== null && typeof slot === 'object')
      .map(slot => ({
        time: String(slot.time || ''),
        value: Number(slot.value || 0),
        fullTime: String(slot.fullTime || slot.time || ''),
      }))
      .filter(slot => slot.value >= 0);
  }

  static transformAPIProductItems(rawItems: unknown[]): ProductDistributionItem[] {
    return rawItems
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
      .map(item => ({
        product_code: String(item.product_code || 'Unknown'),
        description: item.description ? String(item.description) : undefined,
        value: Number(item.value || 0),
        percentage: item.percentage ? Number(item.percentage) : undefined,
        rank: item.rank ? Number(item.rank) : undefined,
      }))
      .filter(item => item.value > 0);
  }

  static calculatePeakHour(timeSlots: TransferTimeSlot[]): string | undefined {
    if (timeSlots.length === 0) return undefined;

    let maxValue = 0;
    let peakHour = '';

    timeSlots.forEach(slot => {
      if (slot.value > maxValue) {
        maxValue = slot.value;
        peakHour = slot.time;
      }
    });

    return peakHour || undefined;
  }

  static calculateTotalTransfers(timeSlots: TransferTimeSlot[]): number {
    return timeSlots.reduce((sum, slot) => sum + slot.value, 0);
  }
}

// Tooltip 格式化類型
export interface TransferTooltipData {
  label: string;
  value: number;
  formattedValue: string;
}

export function formatTransferTooltip(value: unknown, label: unknown): TransferTooltipData {
  const numValue = typeof value === 'number' ? value : 0;
  const strLabel = typeof label === 'string' ? label : 'Unknown';

  return {
    label: strLabel,
    value: numValue,
    formattedValue: `${numValue} transfers`,
  };
}
