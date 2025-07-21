export class TransferRecordDto {
  transfer_id?: string;
  pallet_ref?: string;
  product_code?: string;
  product_description?: string;
  from_location?: string;
  to_location?: string;
  quantity?: number;
  transfer_date?: string;
  status?: string;
  transferred_by?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export class TransferListResponseDto {
  transfers!: TransferRecordDto[];
  total_records!: number;
  offset!: number;
  limit!: number;
  filters?: {
    startDate?: string;
    endDate?: string;
    fromLocation?: string;
    toLocation?: string;
    status?: string;
  };
}
