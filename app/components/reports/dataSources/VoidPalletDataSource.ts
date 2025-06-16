/**
 * Void Pallet Report 數據源
 * 從現有的 reportActions 和 voidReportService 遷移
 */

import { ReportDataSource, FilterValues } from '../core/ReportConfig';
import { createClientSupabase } from './createClientDataSource';

// Void Pallet Summary 數據源
export class VoidPalletSummaryDataSource implements ReportDataSource {
  id = 'voidPalletSummary';
  
  async fetch(filters: FilterValues) {
    const supabase = createClientSupabase();
    
    // 構建查詢
    let query = supabase
      .from('record_history')
      .select(`
        plt_num,
        time,
        remark,
        record_palletinfo!inner(
          product_code,
          product_qty
        )
      `)
      .eq('action', 'Void')
      .gte('time', filters.startDate)
      .lte('time', filters.endDate + 'T23:59:59');
    
    // 應用過濾器
    if (filters.productCode) {
      query = query.eq('record_palletinfo.product_code', filters.productCode);
    }
    
    if (filters.operatorId) {
      query = query.eq('id', filters.operatorId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch void summary: ${error.message}`);
    }
    
    return data || [];
  }
  
  transform(data: any[]) {
    // 計算摘要統計
    const summary = {
      totalVoided: data.length,
      totalQuantity: data.reduce((sum, item) => 
        sum + (item.record_palletinfo?.product_qty || 0), 0
      ),
      uniqueProducts: new Set(data.map(item => 
        item.record_palletinfo?.product_code
      ).filter(Boolean)).size,
      topReason: this.getMostCommonReason(data)
    };
    
    return summary;
  }
  
  private getMostCommonReason(data: any[]): string {
    const reasons = data.map(item => this.extractVoidReason(item.remark));
    const reasonCounts = new Map<string, number>();
    
    reasons.forEach(reason => {
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    });
    
    let topReason = 'Unknown';
    let maxCount = 0;
    
    reasonCounts.forEach((count, reason) => {
      if (count > maxCount) {
        maxCount = count;
        topReason = reason;
      }
    });
    
    return topReason;
  }
  
  private extractVoidReason(remark: string): string {
    if (!remark) return 'Unknown';
    
    // 從 remark 中提取 void reason
    const patterns = [
      /Reason:\s*([^,]+)/i,
      /void reason:\s*([^,]+)/i,
      /\(([^)]+)\)/
    ];
    
    for (const pattern of patterns) {
      const match = remark.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return 'Other';
  }
}

// Void Reason Stats 數據源
export class VoidReasonStatsDataSource implements ReportDataSource {
  id = 'voidReasonStats';
  
  async fetch(filters: FilterValues) {
    // 使用相同的查詢邏輯
    const summarySource = new VoidPalletSummaryDataSource();
    return await summarySource.fetch(filters);
  }
  
  transform(data: any[]) {
    const reasonStats = new Map<string, { count: number; quantity: number }>();
    
    data.forEach(item => {
      const reason = this.extractVoidReason(item.remark);
      const quantity = item.record_palletinfo?.product_qty || 0;
      
      if (!reasonStats.has(reason)) {
        reasonStats.set(reason, { count: 0, quantity: 0 });
      }
      
      const stats = reasonStats.get(reason)!;
      stats.count++;
      stats.quantity += quantity;
    });
    
    const total = data.length;
    
    return Array.from(reasonStats.entries()).map(([reason, stats]) => ({
      void_reason: reason,
      count: stats.count,
      total_quantity: stats.quantity,
      percentage: total > 0 ? stats.count / total : 0
    })).sort((a, b) => b.count - a.count);
  }
  
  private extractVoidReason(remark: string): string {
    // 重用相同的邏輯
    return new VoidPalletSummaryDataSource()['extractVoidReason'](remark);
  }
}

// Void Pallet Details 數據源
export class VoidPalletDetailsDataSource implements ReportDataSource {
  id = 'voidPalletDetails';
  
  async fetch(filters: FilterValues) {
    const supabase = createClientSupabase();
    
    let query = supabase
      .from('record_history')
      .select(`
        plt_num,
        time,
        remark,
        id,
        record_palletinfo!inner(
          product_code,
          product_qty
        ),
        data_id!inner(
          name
        ),
        data_code!inner(
          description
        )
      `)
      .eq('action', 'Void')
      .gte('time', filters.startDate)
      .lte('time', filters.endDate + 'T23:59:59')
      .order('time', { ascending: false });
    
    // 應用過濾器
    if (filters.productCode) {
      query = query.eq('record_palletinfo.product_code', filters.productCode);
    }
    
    if (filters.operatorId) {
      query = query.eq('id', filters.operatorId);
    }
    
    if (filters.voidReason) {
      query = query.ilike('remark', `%${filters.voidReason}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch void details: ${error.message}`);
    }
    
    return data || [];
  }
  
  transform(data: any[]) {
    return data.map(item => ({
      void_date: item.time,
      plt_num: item.plt_num,
      product_code: item.record_palletinfo?.product_code || '',
      product_description: item.data_code?.description || '',
      quantity: item.record_palletinfo?.product_qty || 0,
      void_reason: this.extractVoidReason(item.remark),
      operator_name: item.data_id?.name || `ID: ${item.id}`,
      remark: item.remark || ''
    }));
  }
  
  private extractVoidReason(remark: string): string {
    return new VoidPalletSummaryDataSource()['extractVoidReason'](remark);
  }
}

// Void Product Stats 數據源
export class VoidProductStatsDataSource implements ReportDataSource {
  id = 'voidProductStats';
  
  async fetch(filters: FilterValues) {
    // 使用相同的查詢邏輯
    const detailsSource = new VoidPalletDetailsDataSource();
    const rawData = await detailsSource.fetch(filters);
    return rawData;
  }
  
  transform(data: any[]) {
    const productStats = new Map<string, {
      description: string;
      count: number;
      totalQty: number;
    }>();
    
    data.forEach(item => {
      const code = item.record_palletinfo?.product_code;
      if (!code) return;
      
      if (!productStats.has(code)) {
        productStats.set(code, {
          description: item.data_code?.description || '',
          count: 0,
          totalQty: 0
        });
      }
      
      const stats = productStats.get(code)!;
      stats.count++;
      stats.totalQty += item.record_palletinfo?.product_qty || 0;
    });
    
    return Array.from(productStats.entries())
      .map(([code, stats]) => ({
        product_code: code,
        product_description: stats.description,
        void_count: stats.count,
        total_quantity: stats.totalQty,
        avg_quantity: stats.count > 0 ? stats.totalQty / stats.count : 0
      }))
      .sort((a, b) => b.void_count - a.void_count);
  }
}

// 導出所有數據源
export const voidPalletDataSources = new Map<string, ReportDataSource>([
  ['voidPalletSummary', new VoidPalletSummaryDataSource()],
  ['voidReasonStats', new VoidReasonStatsDataSource()],
  ['voidPalletDetails', new VoidPalletDetailsDataSource()],
  ['voidProductStats', new VoidProductStatsDataSource()]
]);