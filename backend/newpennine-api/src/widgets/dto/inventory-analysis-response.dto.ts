export class InventoryAnalysisItemDto {
  productCode!: string;
  productDescription!: string;
  totalQuantity!: number;
  unit!: string;
  material!: string;
  totalPallets!: number;
  averageQuantityPerPallet!: number;
  locations!: string[];
  warehouses!: string[];
  lastUpdate!: string;
}

export class InventoryTurnoverDto {
  productCode!: string;
  averageTurnover!: number;
  fastMoving!: boolean;
  slowMoving!: boolean;
  daysInStock!: number;
}

export class WarehouseAnalysisDto {
  warehouse!: string;
  totalProducts!: number;
  totalQuantity!: number;
  totalPallets!: number;
  utilizationRate!: number;
  topProducts!: InventoryAnalysisItemDto[];
}

export class InventoryAnalysisResponseDto {
  summary!: {
    totalProducts: number;
    totalQuantity: number;
    totalPallets: number;
    totalWarehouses: number;
    lastUpdate: string;
  };
  productAnalysis!: InventoryAnalysisItemDto[];
  warehouseAnalysis!: WarehouseAnalysisDto[];
  turnoverAnalysis!: InventoryTurnoverDto[];
  alerts!: {
    lowStock: InventoryAnalysisItemDto[];
    overstock: InventoryAnalysisItemDto[];
    slowMoving: InventoryAnalysisItemDto[];
  };
  timestamp!: string;
  error?: string;
}
