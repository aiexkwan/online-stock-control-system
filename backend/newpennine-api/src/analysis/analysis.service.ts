import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { WidgetCacheService } from '../widgets/cache/widget-cache.service';
import { 
  AcoOrderProgressCardsQueryDto,
  AcoOrderProgressCardsResponseDto,
  AcoOrderProgressCardDto,
} from './dto/aco-order-progress-cards-response.dto';
import { 
  AcoOrderProgressChartQueryDto,
  AcoOrderProgressChartResponseDto,
  ChartDataPointDto,
  ChartConfigDto,
  ChartTimeframe,
  ChartMetric,
} from './dto/aco-order-progress-chart-response.dto';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly cacheService: WidgetCacheService,
  ) {}

  /**
   * Get ACO order progress cards data
   */
  async getAcoOrderProgressCards(
    query: AcoOrderProgressCardsQueryDto,
  ): Promise<AcoOrderProgressCardsResponseDto> {
    const cacheKey = this.cacheService.generateKey('aco-order-progress-cards', query);
    
    // Try to get from cache first
    const cachedData = this.cacheService.get<AcoOrderProgressCardsResponseDto>(cacheKey);
    if (cachedData) {
      this.logger.debug('Returning cached ACO order progress cards data');
      return cachedData;
    }

    try {
      const supabase = this.supabaseService.getClient();
      
      // Get current period data
      const currentPeriodData = await this.getOrderStatsForPeriod(
        query.startDate,
        query.endDate,
        query.warehouse,
        query.status,
        query.customerRef,
      );

      // Get previous period data for comparison
      const previousPeriodData = await this.getPreviousPeriodStats(
        query.startDate,
        query.endDate,
        query.warehouse,
        query.status,
        query.customerRef,
      );

      // Generate cards
      const cards = this.generateProgressCards(currentPeriodData, previousPeriodData);

      const response: AcoOrderProgressCardsResponseDto = {
        cards,
        totalCards: cards.length,
        dateRange: this.formatDateRange(query.startDate, query.endDate),
        lastUpdated: new Date().toISOString(),
        metadata: {
          warehouse: query.warehouse || 'all',
          status: query.status || 'all',
          customerRef: query.customerRef || 'all',
        },
      };

      // Cache the result for 5 minutes
      this.cacheService.set(cacheKey, response, 5 * 60 * 1000);

      this.logger.log(`Generated ${cards.length} ACO order progress cards`);
      return response;

    } catch (error) {
      this.logger.error('Failed to get ACO order progress cards', error.stack);
      throw new Error(`Failed to fetch ACO order progress cards: ${error.message}`);
    }
  }

  /**
   * Get ACO order progress chart data
   */
  async getAcoOrderProgressChart(
    query: AcoOrderProgressChartQueryDto,
  ): Promise<AcoOrderProgressChartResponseDto> {
    const cacheKey = this.cacheService.generateKey('aco-order-progress-chart', query);
    
    // Try to get from cache first
    const cachedData = this.cacheService.get<AcoOrderProgressChartResponseDto>(cacheKey);
    if (cachedData) {
      this.logger.debug('Returning cached ACO order progress chart data');
      return cachedData;
    }

    try {
      const timeframe = query.timeframe || ChartTimeframe.DAILY;
      const metric = query.metric || ChartMetric.ORDER_COUNT;
      const limit = query.limit ? parseInt(query.limit, 10) : 30;

      // Get chart data based on timeframe and metric
      const chartData = await this.getChartDataPoints(
        query.startDate,
        query.endDate,
        timeframe,
        metric,
        query.warehouse,
        query.status,
        query.customerRef,
        limit,
      );

      // Generate chart configuration
      const config = this.generateChartConfig(metric, timeframe);

      // Calculate summary statistics
      const summary = this.calculateSummaryStats(chartData);

      const response: AcoOrderProgressChartResponseDto = {
        data: chartData,
        config,
        totalDataPoints: chartData.length,
        dateRange: this.formatDateRange(query.startDate, query.endDate),
        summary,
        lastUpdated: new Date().toISOString(),
        queryParams: {
          timeframe,
          metric,
          warehouse: query.warehouse || 'all',
          status: query.status || 'all',
          customerRef: query.customerRef || 'all',
        },
      };

      // Cache the result for 10 minutes
      this.cacheService.set(cacheKey, response, 10 * 60 * 1000);

      this.logger.log(`Generated ACO order progress chart with ${chartData.length} data points`);
      return response;

    } catch (error) {
      this.logger.error('Failed to get ACO order progress chart', error.stack);
      throw new Error(`Failed to fetch ACO order progress chart: ${error.message}`);
    }
  }

  /**
   * Get order statistics for a specific period
   */
  private async getOrderStatsForPeriod(
    startDate?: string,
    endDate?: string,
    warehouse?: string,
    status?: string,
    customerRef?: string,
  ): Promise<any> {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('record_aco')
      .select('*');

    // Apply filters
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (warehouse) {
      query = query.eq('warehouse', warehouse);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (customerRef) {
      query = query.eq('customer_ref', customerRef);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return this.processOrderStats(data || []);
  }

  /**
   * Get previous period statistics for comparison
   */
  private async getPreviousPeriodStats(
    startDate?: string,
    endDate?: string,
    warehouse?: string,
    status?: string,
    customerRef?: string,
  ): Promise<any> {
    if (!startDate || !endDate) {
      return null;
    }

    // Calculate previous period dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const periodLength = end.getTime() - start.getTime();
    
    const prevStart = new Date(start.getTime() - periodLength);
    const prevEnd = new Date(start.getTime() - 1);

    return this.getOrderStatsForPeriod(
      prevStart.toISOString().split('T')[0],
      prevEnd.toISOString().split('T')[0],
      warehouse,
      status,
      customerRef,
    );
  }

  /**
   * Process raw order data into statistics
   */
  private processOrderStats(orders: any[]): any {
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const inProgressOrders = orders.filter(o => o.status === 'in_progress').length;
    
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    
    // Calculate average processing time for completed orders
    const completedWithTimes = orders.filter(o => 
      o.status === 'completed' && o.created_at && o.completed_at
    );
    
    const avgProcessingTime = completedWithTimes.length > 0
      ? completedWithTimes.reduce((sum, order) => {
          const start = new Date(order.created_at);
          const end = new Date(order.completed_at);
          return sum + (end.getTime() - start.getTime());
        }, 0) / completedWithTimes.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    return {
      totalOrders,
      completedOrders,
      pendingOrders,
      inProgressOrders,
      completionRate,
      avgProcessingTime,
    };
  }

  /**
   * Generate progress cards from statistics
   */
  private generateProgressCards(
    currentStats: any,
    previousStats: any,
  ): AcoOrderProgressCardDto[] {
    const cards: AcoOrderProgressCardDto[] = [];

    // Total Orders card
    cards.push(this.createCard(
      'total_orders',
      'Total Orders',
      currentStats.totalOrders,
      previousStats?.totalOrders,
      'Orders processed',
      'orders',
      'package',
      'blue',
    ));

    // Completed Orders card
    cards.push(this.createCard(
      'completed_orders',
      'Completed Orders',
      currentStats.completedOrders,
      previousStats?.completedOrders,
      'Successfully completed',
      'orders',
      'check-circle',
      'green',
    ));

    // Completion Rate card
    cards.push(this.createCard(
      'completion_rate',
      'Completion Rate',
      Math.round(currentStats.completionRate),
      previousStats ? Math.round(previousStats.completionRate) : undefined,
      'Percentage completed',
      'metrics',
      'percent',
      'purple',
    ));

    // Average Processing Time card
    cards.push(this.createCard(
      'avg_processing_time',
      'Avg Processing Time',
      Math.round(currentStats.avgProcessingTime * 10) / 10,
      previousStats ? Math.round(previousStats.avgProcessingTime * 10) / 10 : undefined,
      'Hours per order',
      'metrics',
      'clock',
      'orange',
    ));

    return cards;
  }

  /**
   * Create a single progress card
   */
  private createCard(
    id: string,
    title: string,
    value: number,
    previousValue?: number,
    description?: string,
    category?: string,
    icon?: string,
    color?: string,
  ): AcoOrderProgressCardDto {
    let percentageChange: number | undefined;
    let trend: 'up' | 'down' | 'stable' | undefined;

    if (previousValue !== undefined && previousValue > 0) {
      percentageChange = ((value - previousValue) / previousValue) * 100;
      
      if (Math.abs(percentageChange) < 1) {
        trend = 'stable';
      } else if (percentageChange > 0) {
        trend = 'up';
      } else {
        trend = 'down';
      }
    }

    return {
      id,
      title,
      value,
      previousValue,
      percentageChange: percentageChange ? Math.round(percentageChange * 100) / 100 : undefined,
      trend,
      description,
      category,
      icon,
      color,
    };
  }

  /**
   * Get chart data points based on timeframe and metric
   */
  private async getChartDataPoints(
    startDate?: string,
    endDate?: string,
    timeframe: ChartTimeframe = ChartTimeframe.DAILY,
    metric: ChartMetric = ChartMetric.ORDER_COUNT,
    warehouse?: string,
    status?: string,
    customerRef?: string,
    limit: number = 30,
  ): Promise<ChartDataPointDto[]> {
    const supabase = this.supabaseService.getClient();

    // Use RPC function for complex aggregation
    const { data, error } = await supabase.rpc('get_aco_order_progress_chart', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_timeframe: timeframe,
      p_metric: metric,
      p_warehouse: warehouse,
      p_status: status,
      p_customer_ref: customerRef,
      p_limit: limit,
    });

    if (error) {
      this.logger.warn(`RPC function not available, falling back to basic query: ${error.message}`);
      return this.getFallbackChartData(startDate, endDate, timeframe, metric, warehouse, status, customerRef, limit);
    }

    return (data || []).map((row: any) => ({
      date: row.date,
      value: row.value,
      previousValue: row.previous_value,
      metadata: row.metadata,
    }));
  }

  /**
   * Fallback method for chart data when RPC is not available
   */
  private async getFallbackChartData(
    startDate?: string,
    endDate?: string,
    timeframe: ChartTimeframe = ChartTimeframe.DAILY,
    metric: ChartMetric = ChartMetric.ORDER_COUNT,
    warehouse?: string,
    status?: string,
    customerRef?: string,
    limit: number = 30,
  ): Promise<ChartDataPointDto[]> {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('record_aco')
      .select('created_at, status, completed_at');

    // Apply filters
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);
    if (warehouse) query = query.eq('warehouse', warehouse);
    if (status) query = query.eq('status', status);
    if (customerRef) query = query.eq('customer_ref', customerRef);

    query = query.order('created_at', { ascending: true }).limit(1000);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch chart data: ${error.message}`);
    }

    // Process data into chart points
    return this.processChartData(data || [], timeframe, metric, limit);
  }

  /**
   * Process raw data into chart data points
   */
  private processChartData(
    orders: any[],
    timeframe: ChartTimeframe,
    metric: ChartMetric,
    limit: number,
  ): ChartDataPointDto[] {
    // Group data by timeframe
    const groupedData = this.groupByTimeframe(orders, timeframe);
    
    // Convert to chart data points
    const chartPoints: ChartDataPointDto[] = Object.entries(groupedData)
      .map(([date, orderGroup]) => {
        let value: number;
        
        switch (metric) {
          case ChartMetric.ORDER_COUNT:
            value = orderGroup.length;
            break;
          case ChartMetric.COMPLETION_RATE:
            const completed = orderGroup.filter(o => o.status === 'completed').length;
            value = orderGroup.length > 0 ? (completed / orderGroup.length) * 100 : 0;
            break;
          case ChartMetric.PROCESSING_TIME:
            const completedWithTimes = orderGroup.filter(o => 
              o.status === 'completed' && o.created_at && o.completed_at
            );
            value = completedWithTimes.length > 0
              ? completedWithTimes.reduce((sum, order) => {
                  const start = new Date(order.created_at);
                  const end = new Date(order.completed_at);
                  return sum + (end.getTime() - start.getTime());
                }, 0) / completedWithTimes.length / (1000 * 60 * 60)
              : 0;
            break;
          default:
            value = orderGroup.length;
        }

        return {
          date,
          value: Math.round(value * 100) / 100,
          metadata: {
            orderCount: orderGroup.length,
            completedCount: orderGroup.filter(o => o.status === 'completed').length,
          },
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-limit);

    return chartPoints;
  }

  /**
   * Group orders by timeframe
   */
  private groupByTimeframe(orders: any[], timeframe: ChartTimeframe): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    orders.forEach(order => {
      const date = new Date(order.created_at);
      let key: string;

      switch (timeframe) {
        case ChartTimeframe.DAILY:
          key = date.toISOString().split('T')[0];
          break;
        case ChartTimeframe.WEEKLY:
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case ChartTimeframe.MONTHLY:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case ChartTimeframe.QUARTERLY:
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(order);
    });

    return grouped;
  }

  /**
   * Generate chart configuration
   */
  private generateChartConfig(metric: ChartMetric, timeframe: ChartTimeframe): ChartConfigDto {
    const config: ChartConfigDto = {
      type: 'line',
      title: 'ACO Order Progress',
      xAxisLabel: 'Date',
      yAxisLabel: 'Count',
      colors: ['#3b82f6', '#ef4444', '#10b981'],
      height: 400,
    };

    switch (metric) {
      case ChartMetric.ORDER_COUNT:
        config.title = 'ACO Order Count Over Time';
        config.yAxisLabel = 'Number of Orders';
        break;
      case ChartMetric.COMPLETION_RATE:
        config.title = 'ACO Order Completion Rate';
        config.yAxisLabel = 'Completion Rate (%)';
        break;
      case ChartMetric.PROCESSING_TIME:
        config.title = 'Average Processing Time';
        config.yAxisLabel = 'Hours';
        break;
      case ChartMetric.ORDER_VALUE:
        config.title = 'Order Value Trends';
        config.yAxisLabel = 'Value';
        break;
    }

    return config;
  }

  /**
   * Calculate summary statistics for chart data
   */
  private calculateSummaryStats(data: ChartDataPointDto[]): any {
    if (data.length === 0) {
      return {
        average: 0,
        minimum: 0,
        maximum: 0,
        trend: 'stable',
      };
    }

    const values = data.map(d => d.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);

    // Simple trend calculation
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (data.length >= 2) {
      const firstHalf = data.slice(0, Math.floor(data.length / 2));
      const secondHalf = data.slice(Math.floor(data.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;
      
      const change = ((secondAvg - firstAvg) / firstAvg) * 100;
      
      if (Math.abs(change) > 5) {
        trend = change > 0 ? 'increasing' : 'decreasing';
      }
    }

    return {
      average: Math.round(average * 100) / 100,
      minimum,
      maximum,
      trend,
    };
  }

  /**
   * Format date range for display
   */
  private formatDateRange(startDate?: string, endDate?: string): string {
    if (!startDate && !endDate) {
      return 'All time';
    }
    
    if (!startDate) {
      return `Until ${endDate}`;
    }
    
    if (!endDate) {
      return `From ${startDate}`;
    }
    
    return `${startDate} to ${endDate}`;
  }
}