export class StatsResponseDto {
  totalPallets: number;
  activeTransfers: number;
  todayGRN: number;
  pendingOrders: number;
  timestamp: string;
  error?: string;
}
