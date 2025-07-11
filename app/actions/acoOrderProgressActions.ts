'use server';

import { createDashboardAPI } from '@/lib/api/admin/DashboardAPI';

export interface AcoOrder {
  order_ref: number;
  latest_update: string;
  total_required: number;
  total_finished: number;
  total_remaining: number;
  product_count: number;
  completion_percentage: number;
}

export interface AcoOrderProgress {
  code: string;
  required_qty: number;
  completed_qty: number;
  remain_qty: number;
  completion_percentage: number;
}

export interface GetAcoIncompleteOrdersVariables {
  limit?: number;
  offset?: number;
}

export interface GetAcoOrderProgressVariables {
  orderRef: number;
}

/**
 * Server Action: 獲取未完成的 ACO 訂單列表
 */
export async function getAcoIncompleteOrdersAction(
  variables?: GetAcoIncompleteOrdersVariables
): Promise<AcoOrder[]> {
  try {
    const dashboardAPI = createDashboardAPI();
    
    const result = await dashboardAPI.serverFetch({
      widgetIds: ['statsCard'],
      params: {
        dataSource: 'aco_incomplete_orders',
        limit: variables?.limit || 50,
        offset: variables?.offset || 0,
      },
    });

    if (result.widgets && result.widgets.length > 0) {
      const widgetData = result.widgets[0];
      return widgetData.data?.incomplete_orders || [];
    }

    return [];
  } catch (error) {
    console.error('[ACO Orders Server Action] Error:', error);
    throw new Error('Failed to fetch incomplete ACO orders');
  }
}

/**
 * Server Action: 獲取特定訂單的進度詳情
 */
export async function getAcoOrderProgressAction(
  variables: GetAcoOrderProgressVariables
): Promise<AcoOrderProgress[]> {
  try {
    const dashboardAPI = createDashboardAPI();
    
    const result = await dashboardAPI.serverFetch({
      widgetIds: ['statsCard'],
      params: {
        dataSource: 'aco_order_progress',
        orderRef: variables.orderRef,
      },
    });

    if (result.widgets && result.widgets.length > 0) {
      const widgetData = result.widgets[0];
      return widgetData.data?.order_progress || [];
    }

    return [];
  } catch (error) {
    console.error('[ACO Order Progress Server Action] Error:', error);
    throw new Error('Failed to fetch ACO order progress');
  }
}

/**
 * 組合函數：獲取訂單和進度數據
 */
export async function getAcoOrderDataAction(variables: {
  ordersLimit?: number;
  ordersOffset?: number;
  selectedOrderRef?: number;
}) {
  const orders = await getAcoIncompleteOrdersAction({
    limit: variables.ordersLimit,
    offset: variables.ordersOffset,
  });

  let progress: AcoOrderProgress[] = [];
  if (variables.selectedOrderRef) {
    progress = await getAcoOrderProgressAction({
      orderRef: variables.selectedOrderRef,
    });
  }

  return {
    incompleteOrders: orders,
    orderProgress: progress,
  };
}