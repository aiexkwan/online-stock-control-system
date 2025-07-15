export class PalletDto {
  plt_num: string;
  product_code: string;
  generate_time: string;
  series: string;
  plt_remark?: string;
  product_qty: number;
  pdf_url?: string;
  // Additional fields from joins
  product_description?: string;
  location?: string;
  warehouse?: string;
}

export class PalletsResponseDto {
  data: PalletDto[];
  total: number;
  limit: number;
  offset: number;
  error?: string;
}

export class PalletDetailResponseDto extends PalletDto {
  // Additional detailed information
  transfers?: any[];
  history?: any[];
  current_inventory?: any;
}
