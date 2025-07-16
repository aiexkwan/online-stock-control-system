import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { WidgetCacheService } from '../widgets/cache/widget-cache.service';
import { AcoOrderProgressCardsQueryDto } from './dto/aco-order-progress-cards-query.dto';
import {
  AcoOrderProgressCardsResponseDto,
  AcoOrderProgressCardDto,
} from './dto/aco-order-progress-cards-response.dto';
import {
  AcoOrderProgressChartQueryDto,
  ChartTimeframe,
  ChartMetric,
} from './dto/aco-order-progress-chart-query.dto';
import {
  AcoOrderProgressChartResponseDto,
  ChartDataPointDto,
  ChartConfigDto,
} from './dto/aco-order-progress-chart-response.dto';
import { VoidRecordsAnalysisQueryDto } from './dto/void-records-analysis-query.dto';
import {
  VoidRecordsAnalysisResponseDto,
  VoidRecordDto,
  VoidReasonDistributionDto,
  VoidTrendDataDto,
  TopVoidedProductDto,
  VoidUserActivityDto,
} from './dto/void-records-analysis-response.dto';

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
    const cacheKey = this.cacheService.generateKey(
      'aco-order-progress-cards',
      query,
    );

    // Try to get from cache first
    const cachedData =
      this.cacheService.get<AcoOrderProgressCardsResponseDto>(cacheKey);
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
      const cards = this.generateProgressCards(
        currentPeriodData,
        previousPeriodData,
      );

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
      this.logger.error(
        'Failed to get ACO order progress cards',
        (error as Error).stack,
      );
      throw new Error(
        `Failed to fetch ACO order progress cards: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get ACO order progress chart data
   */
  async getAcoOrderProgressChart(
    query: AcoOrderProgressChartQueryDto,
  ): Promise<AcoOrderProgressChartResponseDto> {
    const cacheKey = this.cacheService.generateKey(
      'aco-order-progress-chart',
      query,
    );

    // Try to get from cache first
    const cachedData =
      this.cacheService.get<AcoOrderProgressChartResponseDto>(cacheKey);
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

      this.logger.log(
        `Generated ACO order progress chart with ${chartData.length} data points`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        'Failed to get ACO order progress chart',
        (error as Error).stack,
      );
      throw new Error(
        `Failed to fetch ACO order progress chart: ${(error as Error).message}`,
      );
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

    let query = supabase.from('record_aco').select('*');

    // Apply date filters only (other filters not supported by current schema)
    if (startDate) {
      query = query.gte('latest_update', startDate);
    }
    if (endDate) {
      query = query.lte('latest_update', endDate);
    }

    // Note: warehouse, status, customer_ref filters are not available in current schema
    // These would need to be added to the database schema for full functionality

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

    // Calculate completion based on finished_qty vs required_qty
    const completedOrders = orders.filter(
      (o) => o.finished_qty >= o.required_qty,
    ).length;

    const partialOrders = orders.filter(
      (o) => o.finished_qty > 0 && o.finished_qty < o.required_qty,
    ).length;

    const pendingOrders = orders.filter(
      (o) => !o.finished_qty || o.finished_qty === 0,
    ).length;

    const completionRate =
      totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Calculate average completion percentage
    const avgCompletionPercentage =
      totalOrders > 0
        ? orders.reduce((sum, order) => {
            const completion =
              order.required_qty > 0
                ? ((order.finished_qty || 0) / order.required_qty) * 100
                : 0;
            return sum + Math.min(completion, 100);
          }, 0) / totalOrders
        : 0;

    return {
      totalOrders,
      completedOrders,
      partialOrders,
      pendingOrders,
      completionRate,
      avgCompletionPercentage,
      // Legacy field for compatibility
      avgProcessingTime: 0,
      inProgressOrders: partialOrders,
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
    cards.push(
      this.createCard(
        'total_orders',
        'Total Orders',
        currentStats.totalOrders,
        previousStats?.totalOrders,
        'Orders processed',
        'orders',
        'package',
        'blue',
      ),
    );

    // Completed Orders card
    cards.push(
      this.createCard(
        'completed_orders',
        'Completed Orders',
        currentStats.completedOrders,
        previousStats?.completedOrders,
        'Successfully completed',
        'orders',
        'check-circle',
        'green',
      ),
    );

    // Completion Rate card
    cards.push(
      this.createCard(
        'completion_rate',
        'Completion Rate',
        Math.round(currentStats.completionRate),
        previousStats ? Math.round(previousStats.completionRate) : undefined,
        'Percentage completed',
        'metrics',
        'percent',
        'purple',
      ),
    );

    // Average Processing Time card
    cards.push(
      this.createCard(
        'avg_processing_time',
        'Avg Processing Time',
        Math.round(currentStats.avgProcessingTime * 10) / 10,
        previousStats
          ? Math.round(previousStats.avgProcessingTime * 10) / 10
          : undefined,
        'Hours per order',
        'metrics',
        'clock',
        'orange',
      ),
    );

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

    const result: any = {
      id,
      title,
      value,
    };

    if (previousValue !== undefined) {
      result.previousValue = previousValue;
    }

    if (percentageChange !== undefined) {
      result.percentageChange = Math.round(percentageChange * 100) / 100;
    }

    if (trend !== undefined) {
      result.trend = trend;
    }

    return result as AcoOrderProgressCardDto;
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
      this.logger.warn(
        `RPC function not available, falling back to basic query: ${error.message}`,
      );
      return this.getFallbackChartData(
        startDate,
        endDate,
        timeframe,
        metric,
        warehouse,
        status,
        customerRef,
        limit,
      );
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
      .select('latest_update, required_qty, finished_qty, order_ref, code');

    // Apply filters
    if (startDate) query = query.gte('latest_update', startDate);
    if (endDate) query = query.lte('latest_update', endDate);
    // Note: warehouse, status, customer_ref filters not available in current schema

    query = query.order('latest_update', { ascending: true }).limit(1000);

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
            const completed = orderGroup.filter(
              (o) => (o.finished_qty || 0) >= (o.required_qty || 1),
            ).length;
            value =
              orderGroup.length > 0 ? (completed / orderGroup.length) * 100 : 0;
            break;
          case ChartMetric.PROCESSING_TIME:
            // Calculate average completion percentage as a proxy for processing efficiency
            value =
              orderGroup.length > 0
                ? orderGroup.reduce((sum, order) => {
                    const completion =
                      order.required_qty > 0
                        ? ((order.finished_qty || 0) / order.required_qty) * 100
                        : 0;
                    return sum + Math.min(completion, 100);
                  }, 0) / orderGroup.length
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
            completedCount: orderGroup.filter(
              (o) => (o.finished_qty || 0) >= (o.required_qty || 1),
            ).length,
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
  private groupByTimeframe(
    orders: any[],
    timeframe: ChartTimeframe,
  ): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    orders.forEach((order) => {
      const date = new Date(order.latest_update);
      let key = '';

      switch (timeframe) {
        case ChartTimeframe.DAILY:
          key = date.toISOString().split('T')[0] || '';
          break;
        case ChartTimeframe.WEEKLY:
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0] || '';
          break;
        case ChartTimeframe.MONTHLY:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case ChartTimeframe.QUARTERLY:
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        default:
          key = date.toISOString().split('T')[0] || '';
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key]?.push(order);
    });

    return grouped;
  }

  /**
   * Generate chart configuration
   */
  private generateChartConfig(
    metric: ChartMetric,
    timeframe: ChartTimeframe,
  ): ChartConfigDto {
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

    const values = data.map((d) => d.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);

    // Simple trend calculation
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (data.length >= 2) {
      const firstHalf = data.slice(0, Math.floor(data.length / 2));
      const secondHalf = data.slice(Math.floor(data.length / 2));

      const firstAvg =
        firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
      const secondAvg =
        secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;

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

  /**
   * Get void records analysis
   */
  async getVoidRecordsAnalysis(
    query: VoidRecordsAnalysisQueryDto,
  ): Promise<VoidRecordsAnalysisResponseDto> {
    const cacheKey = this.cacheService.generateKey(
      'void-records-analysis',
      query,
    );

    // Try to get from cache first
    const cachedData =
      this.cacheService.get<VoidRecordsAnalysisResponseDto>(cacheKey);
    if (cachedData) {
      this.logger.debug('Returning cached void records analysis data');
      return cachedData;
    }

    try {
      // Fetch void records with related data
      const voidRecords = await this.fetchVoidRecords(query);

      // Process the data for analysis
      const analysisData = this.processVoidRecordsAnalysis(voidRecords, query);

      const response: VoidRecordsAnalysisResponseDto = {
        total_void_qty: analysisData.totalVoidQty,
        total_records: analysisData.totalRecords,
        average_void_qty: analysisData.averageVoidQty,
        reason_distribution: analysisData.reasonDistribution,
        trend_data: analysisData.trendData,
        top_voided_products: analysisData.topVoidedProducts,
        user_activity: analysisData.userActivity,
        void_records: analysisData.detailedRecords,
        metadata: {
          generated_at: new Date().toISOString(),
          date_range: {
            start: query.startDate || new Date('2020-01-01').toISOString(),
            end: query.endDate || new Date().toISOString(),
          },
          filters_applied: {
            ...(query.productCodes && { product_codes: query.productCodes }),
            ...(query.reasons && { reasons: query.reasons }),
          },
        },
      };

      // Cache the result for 15 minutes
      this.cacheService.set(cacheKey, response, 15 * 60 * 1000);

      this.logger.log(
        `Generated void records analysis with ${analysisData.totalRecords} records`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        'Failed to get void records analysis',
        (error as Error).stack,
      );
      throw new Error(
        `Failed to fetch void records analysis: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Fetch void records from database with filters
   */
  private async fetchVoidRecords(
    query: VoidRecordsAnalysisQueryDto,
  ): Promise<any[]> {
    const supabase = this.supabaseService.getClient();

    try {
      // Try RPC function first for optimized query
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_void_records_analysis',
        {
          p_start_date: query.startDate,
          p_end_date: query.endDate,
          p_product_codes: query.productCodes,
          p_reasons: query.reasons,
        },
      );

      if (!rpcError && rpcData) {
        this.logger.log('Using RPC function for void records analysis');
        return rpcData;
      }

      this.logger.warn(
        'RPC function not available, falling back to manual queries',
      );

      // Fallback to manual query approach
      return await this.fetchVoidRecordsFallback(query);
    } catch (error) {
      this.logger.error('Error in fetchVoidRecords', (error as Error).stack);
      throw error;
    }
  }

  /**
   * Fallback method for fetching void records
   */
  private async fetchVoidRecordsFallback(
    query: VoidRecordsAnalysisQueryDto,
  ): Promise<any[]> {
    const supabase = this.supabaseService.getClient();

    // Step 1: Fetch void records from report_void table
    let voidQuery = supabase
      .from('report_void')
      .select('uuid, plt_num, time, reason, damage_qty')
      .order('time', { ascending: false });

    // Apply date filters
    if (query.startDate) {
      voidQuery = voidQuery.gte('time', query.startDate);
    }
    if (query.endDate) {
      voidQuery = voidQuery.lte('time', query.endDate);
    }

    // Apply reason filters
    if (query.reasons && query.reasons.length > 0) {
      voidQuery = voidQuery.in('reason', query.reasons);
    }

    const { data: voidRecords, error: voidError } = await voidQuery;

    if (voidError) {
      throw new Error(`Failed to fetch void records: ${voidError.message}`);
    }

    if (!voidRecords || voidRecords.length === 0) {
      return [];
    }

    // Step 2: Get pallet info for product codes
    const palletNumbers = Array.from(
      new Set(voidRecords.map((v) => v.plt_num)),
    );
    const { data: palletInfos, error: palletError } = await supabase
      .from('record_palletinfo')
      .select('plt_num, product_code, product_qty')
      .in('plt_num', palletNumbers);

    if (palletError) {
      this.logger.warn(`Failed to fetch pallet info: ${palletError.message}`);
    }

    // Create pallet info map
    const palletInfoMap = new Map();
    if (palletInfos) {
      palletInfos.forEach((p) => palletInfoMap.set(p.plt_num, p));
    }

    // Step 3: Get user info from history records
    const { data: historyRecords, error: historyError } = await supabase
      .from('record_history')
      .select(
        `
        plt_num,
        time,
        id,
        loc,
        data_id (
          id,
          name
        )
      `,
      )
      .eq('action', 'Void Pallet')
      .in('plt_num', palletNumbers)
      .order('time', { ascending: false });

    if (historyError) {
      this.logger.warn(
        `Failed to fetch history records: ${historyError.message}`,
      );
    }

    // Create user map
    const userMap = new Map();
    if (historyRecords) {
      historyRecords.forEach((h) => {
        if (!userMap.has(h.plt_num)) {
          userMap.set(h.plt_num, {
            user: h.data_id,
            loc: h.loc,
          });
        }
      });
    }

    // Step 4: Combine all data
    let combinedRecords = voidRecords.map((voidRecord) => {
      const palletInfo = palletInfoMap.get(voidRecord.plt_num);
      const historyInfo = userMap.get(voidRecord.plt_num);

      const voidQty =
        voidRecord.damage_qty !== null && voidRecord.damage_qty > 0
          ? voidRecord.damage_qty
          : palletInfo?.product_qty || 0;

      return {
        uuid: voidRecord.uuid,
        plt_num: voidRecord.plt_num,
        time: voidRecord.time,
        reason: voidRecord.reason,
        damage_qty: voidRecord.damage_qty,
        product_code: palletInfo?.product_code || 'N/A',
        product_qty: palletInfo?.product_qty || 0,
        user_name: historyInfo?.user?.name || 'System',
        user_id: historyInfo?.user?.id || 0,
        plt_loc: historyInfo?.loc || 'Voided',
        void_qty: voidQty,
      };
    });

    // Step 5: Apply product code filters if specified
    if (query.productCodes && query.productCodes.length > 0) {
      combinedRecords = combinedRecords.filter((record) =>
        query.productCodes!.includes(record.product_code),
      );
    }

    return combinedRecords;
  }

  /**
   * Process void records data for analysis
   */
  private processVoidRecordsAnalysis(
    voidRecords: any[],
    query: VoidRecordsAnalysisQueryDto,
  ): {
    totalVoidQty: number;
    totalRecords: number;
    averageVoidQty: number;
    reasonDistribution: VoidReasonDistributionDto[];
    trendData: VoidTrendDataDto[];
    topVoidedProducts: TopVoidedProductDto[];
    userActivity: VoidUserActivityDto[];
    detailedRecords: VoidRecordDto[];
  } {
    if (voidRecords.length === 0) {
      return {
        totalVoidQty: 0,
        totalRecords: 0,
        averageVoidQty: 0,
        reasonDistribution: [],
        trendData: [],
        topVoidedProducts: [],
        userActivity: [],
        detailedRecords: [],
      };
    }

    const totalVoidQty = voidRecords.reduce(
      (sum, record) => sum + (record.void_qty || 0),
      0,
    );
    const totalRecords = voidRecords.length;
    const averageVoidQty = totalRecords > 0 ? totalVoidQty / totalRecords : 0;

    // Process reason distribution
    const reasonDistribution = this.processReasonDistribution(
      voidRecords,
      totalVoidQty,
    );

    // Process trend data
    const trendData = this.processTrendData(
      voidRecords,
      query.groupBy || 'day',
    );

    // Process top voided products
    const topVoidedProducts = this.processTopVoidedProducts(
      voidRecords,
      totalVoidQty,
      query.topProductsLimit || 10,
    );

    // Process user activity
    const userActivity = this.processUserActivity(voidRecords, totalVoidQty);

    // Process detailed records
    const detailedRecords = this.processDetailedRecords(voidRecords);

    return {
      totalVoidQty: Math.round(totalVoidQty * 100) / 100,
      totalRecords,
      averageVoidQty: Math.round(averageVoidQty * 100) / 100,
      reasonDistribution,
      trendData,
      topVoidedProducts,
      userActivity,
      detailedRecords,
    };
  }

  /**
   * Process reason distribution for pie chart
   */
  private processReasonDistribution(
    voidRecords: any[],
    totalVoidQty: number,
  ): VoidReasonDistributionDto[] {
    const reasonMap = new Map<string, { qty: number; count: number }>();

    voidRecords.forEach((record) => {
      const reason = record.reason || 'Unknown';
      const qty = record.void_qty || 0;

      if (!reasonMap.has(reason)) {
        reasonMap.set(reason, { qty: 0, count: 0 });
      }

      const stats = reasonMap.get(reason)!;
      stats.qty += qty;
      stats.count += 1;
    });

    return Array.from(reasonMap.entries())
      .map(([reason, stats]) => ({
        reason,
        total_void_qty: Math.round(stats.qty * 100) / 100,
        record_count: stats.count,
        percentage:
          totalVoidQty > 0
            ? Math.round((stats.qty / totalVoidQty) * 10000) / 100
            : 0,
      }))
      .sort((a, b) => b.total_void_qty - a.total_void_qty);
  }

  /**
   * Process trend data for line/bar chart
   */
  private processTrendData(
    voidRecords: any[],
    groupBy: 'day' | 'week' | 'month',
  ): VoidTrendDataDto[] {
    const trendMap = new Map<string, { qty: number; count: number }>();

    voidRecords.forEach((record) => {
      const date = new Date(record.time);
      let period = '';

      switch (groupBy) {
        case 'day':
          period = date.toISOString().split('T')[0] || '';
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          period = weekStart.toISOString().split('T')[0] || '';
          break;
        case 'month':
          period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!trendMap.has(period)) {
        trendMap.set(period, { qty: 0, count: 0 });
      }

      const stats = trendMap.get(period)!;
      stats.qty += record.void_qty || 0;
      stats.count += 1;
    });

    return Array.from(trendMap.entries())
      .map(([period, stats]) => ({
        period,
        total_void_qty: Math.round(stats.qty * 100) / 100,
        record_count: stats.count,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Process top voided products
   */
  private processTopVoidedProducts(
    voidRecords: any[],
    totalVoidQty: number,
    limit: number,
  ): TopVoidedProductDto[] {
    const productMap = new Map<string, { qty: number; count: number }>();

    voidRecords.forEach((record) => {
      const product = record.product_code || 'Unknown';
      const qty = record.void_qty || 0;

      if (!productMap.has(product)) {
        productMap.set(product, { qty: 0, count: 0 });
      }

      const stats = productMap.get(product)!;
      stats.qty += qty;
      stats.count += 1;
    });

    return Array.from(productMap.entries())
      .map(([product_code, stats]) => ({
        product_code,
        total_void_qty: Math.round(stats.qty * 100) / 100,
        record_count: stats.count,
        percentage:
          totalVoidQty > 0
            ? Math.round((stats.qty / totalVoidQty) * 10000) / 100
            : 0,
      }))
      .sort((a, b) => b.total_void_qty - a.total_void_qty)
      .slice(0, limit);
  }

  /**
   * Process user activity
   */
  private processUserActivity(
    voidRecords: any[],
    totalVoidQty: number,
  ): VoidUserActivityDto[] {
    const userMap = new Map<
      string,
      { qty: number; count: number; id: number }
    >();

    voidRecords.forEach((record) => {
      const userName = record.user_name || 'Unknown';
      const userId = record.user_id || 0;
      const qty = record.void_qty || 0;

      if (!userMap.has(userName)) {
        userMap.set(userName, { qty: 0, count: 0, id: userId });
      }

      const stats = userMap.get(userName)!;
      stats.qty += qty;
      stats.count += 1;
    });

    return Array.from(userMap.entries())
      .map(([user_name, stats]) => ({
        user_name,
        user_id: stats.id,
        total_void_qty: Math.round(stats.qty * 100) / 100,
        record_count: stats.count,
        percentage:
          totalVoidQty > 0
            ? Math.round((stats.qty / totalVoidQty) * 10000) / 100
            : 0,
      }))
      .sort((a, b) => b.total_void_qty - a.total_void_qty);
  }

  /**
   * Process detailed records for display
   */
  private processDetailedRecords(voidRecords: any[]): VoidRecordDto[] {
    return voidRecords.map((record) => ({
      uuid: record.uuid,
      plt_num: record.plt_num,
      time: record.time,
      reason: record.reason || 'Unknown',
      damage_qty: record.damage_qty,
      product_code: record.product_code || 'N/A',
      product_qty: record.product_qty || 0,
      user_name: record.user_name || 'Unknown',
      user_id: record.user_id || 0,
      plt_loc: record.plt_loc || 'N/A',
      void_qty: record.void_qty || 0,
    }));
  }
}
