/**
 * Order Loading Report 數據源
 * 從現有的 loadingReportService 遷移
 */

import { ReportDataSource, FilterValues } from '../core/ReportConfig';
import { createClientSupabase } from './createClientDataSource';

// Order Loading Summary 數據源
export class OrderLoadingSummaryDataSource implements ReportDataSource {
  id = 'orderLoadingSummary';
  
  async fetch(filters: FilterValues) {
    const supabase = createClientSupabase();
    
    // 解析日期範圍
    const [startDate, endDate] = this.parseDateRange(filters.dateRange);
    
    // 構建查詢
    let query = supabase
      .from('record_order_loading')
      .select(`
        order_number,
        product_code,
        product_qty,
        loaded_qty,
        user_id,
        created_at,
        updated_at,
        data_order!inner(
          order_date,
          status
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59');
    
    // 應用過濾器
    if (filters.orderNumber) {
      query = query.eq('order_number', filters.orderNumber);
    }
    
    if (filters.productCode) {
      query = query.eq('product_code', filters.productCode);
    }
    
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch order loading summary: ${error.message}`);
    }
    
    return (data || []) as any[];
  }
  
  transform(data: any[]) {
    // 按訂單分組計算
    const orderMap = new Map<string, {
      totalQty: number;
      loadedQty: number;
      status: string;
    }>();
    
    data.forEach(item => {
      const orderNumber = item.order_number;
      if (!orderMap.has(orderNumber)) {
        orderMap.set(orderNumber, {
          totalQty: 0,
          loadedQty: 0,
          status: Array.isArray(item.data_order) ? (item.data_order[0]?.status || 'pending') : (item.data_order?.status || 'pending')
        });
      }
      
      const order = orderMap.get(orderNumber)!;
      order.totalQty += parseInt(item.product_qty || '0');
      order.loadedQty += parseInt(item.loaded_qty || '0');
    });
    
    // 計算統計
    const completedOrders = Array.from(orderMap.values())
      .filter(order => order.loadedQty >= order.totalQty).length;
    
    const totalItemsLoaded = data.reduce((sum, item) => 
      sum + parseInt(item.loaded_qty || '0'), 0
    );
    
    const completionRates = Array.from(orderMap.values()).map(order => 
      order.totalQty > 0 ? order.loadedQty / order.totalQty : 0
    );
    
    const avgCompletionRate = completionRates.length > 0
      ? completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length
      : 0;
    
    return {
      totalOrders: orderMap.size,
      completedOrders,
      totalItemsLoaded,
      avgCompletionRate
    };
  }
  
  private parseDateRange(dateRange: string): [string, string] {
    if (dateRange && dateRange.includes('|')) {
      return dateRange.split('|') as [string, string];
    }
    return ['', ''];
  }
}

// Order Progress 數據源
export class OrderProgressDataSource implements ReportDataSource {
  id = 'orderProgress';
  
  async fetch(filters: FilterValues) {
    const summarySource = new OrderLoadingSummaryDataSource();
    const rawData = await summarySource.fetch(filters);
    
    // 按訂單分組
    const orderMap = new Map<string, any>();
    
    rawData.forEach(item => {
      const orderNumber = item.order_number;
      if (!orderMap.has(orderNumber)) {
        orderMap.set(orderNumber, {
          order_number: orderNumber,
          order_date: Array.isArray(item.data_order) ? item.data_order[0]?.order_date : item.data_order?.order_date,
          total_qty: 0,
          loaded_qty: 0,
          products: new Set()
        });
      }
      
      const order = orderMap.get(orderNumber)!;
      order.total_qty += parseInt(item.product_qty || '0');
      order.loaded_qty += parseInt(item.loaded_qty || '0');
      order.products.add(item.product_code);
    });
    
    return Array.from(orderMap.values());
  }
  
  transform(data: any[]) {
    return data.map(order => {
      const completionRate = order.total_qty > 0 
        ? order.loaded_qty / order.total_qty 
        : 0;
      
      return {
        order_number: order.order_number,
        order_date: order.order_date,
        total_items: order.total_qty,
        loaded_items: order.loaded_qty,
        completion_rate: completionRate,
        status: completionRate >= 1 ? 'Completed' : 
                completionRate > 0 ? 'Partial' : 'Pending'
      };
    }).sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
  }
}

// Loading Details 數據源
export class LoadingDetailsDataSource implements ReportDataSource {
  id = 'loadingDetails';
  
  async fetch(filters: FilterValues) {
    const supabase = createClientSupabase();
    const [startDate, endDate] = this.parseDateRange(filters.dateRange);
    
    let query = supabase
      .from('record_order_loading_history')
      .select(`
        id,
        order_number,
        product_code,
        loaded_qty,
        action,
        user_id,
        created_at,
        data_id!inner(
          name
        ),
        data_code!inner(
          description
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59')
      .order('created_at', { ascending: false });
    
    // 應用過濾器
    if (filters.orderNumber) {
      query = query.eq('order_number', filters.orderNumber);
    }
    
    if (filters.productCode) {
      query = query.eq('product_code', filters.productCode);
    }
    
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch loading details: ${error.message}`);
    }
    
    return data || [];
  }
  
  transform(data: any[]) {
    return data.map(item => ({
      timestamp: item.created_at,
      order_number: item.order_number,
      product_code: item.product_code,
      product_description: item.data_code?.description || '',
      loaded_qty: item.loaded_qty,
      user_name: item.data_id?.name || `User ${item.user_id}`,
      action: item.action || 'Load'
    }));
  }
  
  private parseDateRange(dateRange: string): [string, string] {
    if (dateRange && dateRange.includes('|')) {
      return dateRange.split('|') as [string, string];
    }
    return ['', ''];
  }
}

// User Performance 數據源
export class UserPerformanceDataSource implements ReportDataSource {
  id = 'userPerformance';
  
  async fetch(filters: FilterValues) {
    const detailsSource = new LoadingDetailsDataSource();
    const rawData = await detailsSource.fetch(filters);
    return rawData;
  }
  
  transform(data: any[]) {
    // 按用戶分組統計
    const userStats = new Map<string, {
      user_name: string;
      total_loads: number;
      total_quantity: number;
      load_times: number[];
    }>();
    
    // 按時間排序以計算加載時間
    const sortedData = [...data].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    sortedData.forEach(item => {
      const userId = item.user_id || 'unknown';
      
      if (!userStats.has(userId)) {
        userStats.set(userId, {
          user_name: item.user_name,
          total_loads: 0,
          total_quantity: 0,
          load_times: []
        });
      }
      
      const stats = userStats.get(userId)!;
      stats.total_loads++;
      stats.total_quantity += item.loaded_qty || 0;
    });
    
    return Array.from(userStats.entries()).map(([userId, stats]) => ({
      user_id: userId,
      user_name: stats.user_name,
      total_loads: stats.total_loads,
      total_quantity: stats.total_quantity,
      avg_load_time: 'N/A' // 需要更複雜的計算
    })).sort((a, b) => b.total_loads - a.total_loads);
  }
}

// 導出所有數據源
export const orderLoadingDataSources = new Map<string, ReportDataSource>([
  ['orderLoadingSummary', new OrderLoadingSummaryDataSource()],
  ['orderProgress', new OrderProgressDataSource()],
  ['loadingDetails', new LoadingDetailsDataSource()],
  ['userPerformance', new UserPerformanceDataSource()]
]);