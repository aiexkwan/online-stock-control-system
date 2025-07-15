export class StockDistributionItemDto {
  product_code!: string;
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

export class StockDistributionResponseDto {
  data!: StockDistributionItemDto[];
  total!: number;
  offset!: number;
  limit!: number;
}
