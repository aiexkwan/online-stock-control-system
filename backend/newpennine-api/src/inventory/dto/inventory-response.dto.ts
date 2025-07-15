export class InventoryDto {
  id: number;
  plt_num: string;
  product_code: string;
  loc: string;
  warehouse: string;
  qty: number;
  damage: number;
  total_qty: number;
  last_update?: string;
  // Additional fields from joins
  product_description?: string;
  product_colour?: string;
  product_unit?: string;
  pallet_series?: string;
  pallet_generate_time?: string;
}

export class InventoryResponseDto {
  data: InventoryDto[];
  total: number;
  limit: number;
  offset: number;
  error?: string;
}

export class InventoryDetailResponseDto extends InventoryDto {
  // Additional detailed information
  transfers?: any[];
  history?: any[];
  pallet_info?: any;
}

export class InventorySummaryDto {
  warehouse: string;
  total_locations: number;
  total_pallets: number;
  total_good_qty: number;
  total_damage_qty: number;
  total_qty: number;
  products_count: number;
}

export class InventorySummaryResponseDto {
  data: InventorySummaryDto[];
  error?: string;
}
