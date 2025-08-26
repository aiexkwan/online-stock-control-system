/**
 * ACO Order Types
 * 從 types/api/response.ts 遷移的 ACO 訂單相關類型
 */

export interface AcoOrderUpdateResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: {
    updated_orders?: number;
    failed_updates?: Array<{
      order_number: string;
      reason: string;
    }>;
    order_ref?: number;
    product_code?: string;
    order_completed?: boolean;
  };
}
