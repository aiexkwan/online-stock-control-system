export class InventoryItemDto {
  id!: number;
  palletId!: string;
  productCode!: string;
  productDescription!: string;
  quantity!: number;
  unit!: string;
  material!: string;
  warehouse!: string;
  location!: string;
  timestamp!: string;
}

export class InventoryResponseDto {
  data!: InventoryItemDto[];
  total!: number;
  limit!: number;
  offset!: number;
  error?: string;
}
