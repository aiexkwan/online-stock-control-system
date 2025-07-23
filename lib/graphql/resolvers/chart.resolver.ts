/**
 * Chart GraphQL Resolver
 * 處理統一的圖表數據查詢
 */

import { createClient } from '@/app/utils/supabase/server';
import {
  ChartType,
  ChartCardData,
  ChartQueryInput,
  SingleChartQueryInput,
  ChartConfig,
  ChartDataset,
  ChartDataPoint,
  TimeGranularity,
  AggregationType,
} from '@/types/generated/graphql';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import DataLoader from 'dataloader';

// 圖表配置映射
const CHART_CONFIG_MAP: Record<string, Partial<ChartConfig>> = {
  stockDistribution: {
    type: ChartType.Treemap,
    title: 'Stock Distribution',
    description: 'Product distribution across warehouses',
  },
  warehouseWorkLevel: {
    type: ChartType.Area,
    title: 'Warehouse Work Level',
    description: 'Warehouse activity over time',
  },
  transferTimeDistribution: {
    type: ChartType.Bar,
    title: 'Transfer Time Distribution',
    description: 'Distribution of transfer completion times',
  },
  stockLevelHistory: {
    type: ChartType.Line,
    title: 'Stock Level History',
    description: 'Historical stock levels',
  },
  transferActivity: {
    type: ChartType.Line,
    title: 'Transfer Activity',
    description: 'Transfer activity trends',
  },
  qualityMetrics: {
    type: ChartType.Mixed,
    title: 'Quality Metrics',
    description: 'Quality control metrics',
  },
  efficiencyTrends: {
    type: ChartType.Line,
    title: 'Efficiency Trends',
    description: 'Operational efficiency over time',
  },
  productionRate: {
    type: ChartType.Bar,
    title: 'Production Rate',
    description: 'Production output by period',
  },
};

// 數據聚合函數
function aggregateData(
  data: any[],
  aggregationType: AggregationType,
  valueField: string
): number {
  if (!data.length) return 0;

  const values = data.map((d) => d[valueField] || 0);

  switch (aggregationType) {
    case AggregationType.Sum:
      return values.reduce((a, b) => a + b, 0);
    case AggregationType.Average:
      return values.reduce((a, b) => a + b, 0) / values.length;
    case AggregationType.Min:
      return Math.min(...values);
    case AggregationType.Max:
      return Math.max(...values);
    case AggregationType.Count:
      return values.length;
    case AggregationType.Median:
      const sorted = values.sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}

// 時間粒度格式化
function formatTimeGranularity(date: Date, granularity: TimeGranularity): string {
  switch (granularity) {
    case TimeGranularity.Minute:
      return format(date, 'yyyy-MM-dd HH:mm');
    case TimeGranularity.Hour:
      return format(date, 'yyyy-MM-dd HH:00');
    case TimeGranularity.Day:
      return format(date, 'yyyy-MM-dd');
    case TimeGranularity.Week:
      return format(date, 'yyyy-ww');
    case TimeGranularity.Month:
      return format(date, 'yyyy-MM');
    case TimeGranularity.Quarter:
      return `${format(date, 'yyyy')}-Q${Math.floor(date.getMonth() / 3) + 1}`;
    case TimeGranularity.Year:
      return format(date, 'yyyy');
    default:
      return format(date, 'yyyy-MM-dd');
  }
}

// 獲取圖表數據
async function fetchChartData(
  supabase: any,
  chartType: ChartType,
  input: ChartQueryInput | SingleChartQueryInput
): Promise<ChartCardData> {
  const now = new Date();

  // 根據圖表類型獲取數據
  switch (chartType) {
    case ChartType.Treemap:
      return fetchTreemapData(supabase, input);
    case ChartType.Area:
      return fetchAreaChartData(supabase, input);
    case ChartType.Bar:
      return fetchBarChartData(supabase, input);
    case ChartType.Line:
      return fetchLineChartData(supabase, input);
    default:
      return createEmptyChartData(chartType);
  }
}

// Treemap 數據（庫存分佈）
async function fetchTreemapData(
  supabase: any,
  input: ChartQueryInput | SingleChartQueryInput
): Promise<ChartCardData> {
  const { data, error } = await supabase
    .from('record_palletinfo')
    .select(`
      productcode,
      quantity,
      location,
      data_code!inner(
        code,
        description,
        type,
        colour
      )
    `)
    .gt('quantity', 0);

  if (error) throw error;

  // 按產品分組並聚合
  const groupedData = data.reduce((acc: any, item: any) => {
    const key = item.productcode;
    if (!acc[key]) {
      acc[key] = {
        productCode: key,
        productName: item.data_code.description,
        totalQuantity: 0,
        locations: {},
      };
    }
    acc[key].totalQuantity += item.quantity;
    acc[key].locations[item.location] = (acc[key].locations[item.location] || 0) + item.quantity;
    return acc;
  }, {});

  const chartData: ChartDataPoint[] = Object.values(groupedData)
    .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
    .slice(0, input.limit || 20)
    .map((item: any) => ({
      x: item.productCode,
      y: item.totalQuantity,
      label: item.productName,
      value: item.totalQuantity,
      metadata: {
        locations: item.locations,
      },
    }));

  return {
    datasets: [
      {
        id: 'stock-distribution',
        label: 'Stock Distribution',
        data: chartData,
        type: 'SINGLE' as any,
        hidden: false,
      },
    ],
    labels: chartData.map((d) => d.x),
    config: {
      ...CHART_CONFIG_MAP.stockDistribution,
      responsive: true,
      maintainAspectRatio: false,
      legend: { display: false },
      tooltip: { enabled: true },
    } as ChartConfig,
    performance: {
      totalQueries: 1,
      cachedQueries: 0,
      averageResponseTime: Date.now() - now.getTime(),
      dataAge: 0,
    },
    lastUpdated: now.toISOString(),
    refreshInterval: 300,
    dataSource: 'supabase',
  };
}

// Area Chart 數據（倉庫工作量）
async function fetchAreaChartData(
  supabase: any,
  input: ChartQueryInput | SingleChartQueryInput
): Promise<ChartCardData> {
  const dateRange = input.dateRange || {
    start: subDays(new Date(), 7).toISOString(),
    end: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('record_pallet_transfer')
    .select('transferdone, from_location, to_location')
    .gte('transferdone', dateRange.start)
    .lte('transferdone', dateRange.end)
    .order('transferdone');

  if (error) throw error;

  // 按時間粒度分組
  const granularity = (input as ChartQueryInput).timeGranularity || TimeGranularity.Day;
  const groupedData = data.reduce((acc: any, item: any) => {
    const key = formatTimeGranularity(new Date(item.transferdone), granularity);
    if (!acc[key]) {
      acc[key] = { date: key, count: 0 };
    }
    acc[key].count++;
    return acc;
  }, {});

  const chartData: ChartDataPoint[] = Object.values(groupedData)
    .sort((a: any, b: any) => a.date.localeCompare(b.date))
    .map((item: any) => ({
      x: item.date,
      y: item.count,
      label: item.date,
      value: item.count,
      metadata: {},
    }));

  return {
    datasets: [
      {
        id: 'warehouse-work-level',
        label: 'Transfer Count',
        data: chartData,
        type: 'SINGLE' as any,
        color: '#3b82f6',
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        hidden: false,
      },
    ],
    labels: chartData.map((d) => d.x),
    config: {
      ...CHART_CONFIG_MAP.warehouseWorkLevel,
      responsive: true,
      maintainAspectRatio: false,
      xAxis: {
        type: 'category',
        display: true,
      },
      yAxis: {
        type: 'linear',
        display: true,
        label: 'Transfer Count',
      },
      legend: { display: true, position: 'top' },
      tooltip: { enabled: true, mode: 'index', intersect: false },
    } as ChartConfig,
    performance: {
      totalQueries: 1,
      cachedQueries: 0,
      averageResponseTime: Date.now() - new Date().getTime(),
      dataAge: 0,
    },
    lastUpdated: new Date().toISOString(),
    refreshInterval: 300,
    dataSource: 'supabase',
  };
}

// Bar Chart 數據（轉移時間分佈）
async function fetchBarChartData(
  supabase: any,
  input: ChartQueryInput | SingleChartQueryInput
): Promise<ChartCardData> {
  const { data, error } = await supabase
    .from('record_pallet_transfer')
    .select('transferstart, transferdone')
    .not('transferdone', 'is', null)
    .not('transferstart', 'is', null)
    .limit(1000);

  if (error) throw error;

  // 計算轉移時間（小時）
  const transferTimes = data.map((item: any) => {
    const start = new Date(item.transferstart);
    const end = new Date(item.transferdone);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60)); // 小時
  });

  // 創建直方圖數據
  const histogram: Record<string, number> = {};
  transferTimes.forEach((time) => {
    const bucket = time < 24 ? `${time}h` : '24h+';
    histogram[bucket] = (histogram[bucket] || 0) + 1;
  });

  const chartData: ChartDataPoint[] = Object.entries(histogram)
    .sort((a, b) => {
      const aNum = parseInt(a[0]) || 999;
      const bNum = parseInt(b[0]) || 999;
      return aNum - bNum;
    })
    .map(([time, count]) => ({
      x: time,
      y: count,
      label: time,
      value: count,
      metadata: {},
    }));

  return {
    datasets: [
      {
        id: 'transfer-time-distribution',
        label: 'Transfer Count',
        data: chartData,
        type: 'SINGLE' as any,
        backgroundColor: '#10b981',
        hidden: false,
      },
    ],
    labels: chartData.map((d) => d.x),
    config: {
      ...CHART_CONFIG_MAP.transferTimeDistribution,
      responsive: true,
      maintainAspectRatio: false,
      xAxis: {
        type: 'category',
        display: true,
        label: 'Time to Complete',
      },
      yAxis: {
        type: 'linear',
        display: true,
        label: 'Number of Transfers',
      },
      legend: { display: false },
      tooltip: { enabled: true },
    } as ChartConfig,
    performance: {
      totalQueries: 1,
      cachedQueries: 0,
      averageResponseTime: Date.now() - new Date().getTime(),
      dataAge: 0,
    },
    lastUpdated: new Date().toISOString(),
    refreshInterval: 600,
    dataSource: 'supabase',
  };
}

// Line Chart 數據（庫存歷史）
async function fetchLineChartData(
  supabase: any,
  input: ChartQueryInput | SingleChartQueryInput
): Promise<ChartCardData> {
  const dateRange = input.dateRange || {
    start: subDays(new Date(), 30).toISOString(),
    end: new Date().toISOString(),
  };

  // 這裡簡化處理，實際應該從歷史記錄表獲取
  const { data, error } = await supabase
    .from('record_palletinfo')
    .select('quantity, created_at')
    .gte('created_at', dateRange.start)
    .lte('created_at', dateRange.end)
    .order('created_at');

  if (error) throw error;

  // 按天分組
  const groupedData = data.reduce((acc: any, item: any) => {
    const date = format(new Date(item.created_at), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = { date, totalQuantity: 0 };
    }
    acc[date].totalQuantity += item.quantity;
    return acc;
  }, {});

  const chartData: ChartDataPoint[] = Object.values(groupedData)
    .sort((a: any, b: any) => a.date.localeCompare(b.date))
    .map((item: any) => ({
      x: item.date,
      y: item.totalQuantity,
      label: item.date,
      value: item.totalQuantity,
      metadata: {},
    }));

  return {
    datasets: [
      {
        id: 'stock-level-history',
        label: 'Stock Level',
        data: chartData,
        type: 'SINGLE' as any,
        borderColor: '#8b5cf6',
        backgroundColor: 'transparent',
        hidden: false,
      },
    ],
    labels: chartData.map((d) => d.x),
    config: {
      ...CHART_CONFIG_MAP.stockLevelHistory,
      responsive: true,
      maintainAspectRatio: false,
      xAxis: {
        type: 'category',
        display: true,
      },
      yAxis: {
        type: 'linear',
        display: true,
        label: 'Total Stock',
      },
      legend: { display: true, position: 'top' },
      tooltip: { enabled: true, mode: 'index', intersect: false },
    } as ChartConfig,
    performance: {
      totalQueries: 1,
      cachedQueries: 0,
      averageResponseTime: Date.now() - new Date().getTime(),
      dataAge: 0,
    },
    lastUpdated: new Date().toISOString(),
    refreshInterval: 300,
    dataSource: 'supabase',
  };
}

// 創建空圖表數據
function createEmptyChartData(chartType: ChartType): ChartCardData {
  return {
    datasets: [],
    labels: [],
    config: {
      type: chartType,
      title: 'No Data',
      description: 'No data available',
      responsive: true,
      maintainAspectRatio: false,
      legend: { display: false },
      tooltip: { enabled: false },
    } as ChartConfig,
    performance: {
      totalQueries: 0,
      cachedQueries: 0,
      averageResponseTime: 0,
      dataAge: 0,
    },
    lastUpdated: new Date().toISOString(),
    refreshInterval: 300,
    dataSource: 'empty',
  };
}

// GraphQL Resolvers
export const chartResolvers = {
  Query: {
    // 批量獲取圖表數據
    chartCardData: async (
      _: any,
      { input }: { input: ChartQueryInput },
      context: any
    ): Promise<ChartCardData> => {
      const { supabase } = context;

      // 目前簡化處理，只返回第一個圖表類型的數據
      if (input.chartTypes.length > 0) {
        return fetchChartData(supabase, input.chartTypes[0], input);
      }

      return createEmptyChartData(ChartType.Line);
    },

    // 獲取單個圖表數據
    chartData: async (
      _: any,
      { input }: { input: SingleChartQueryInput },
      context: any
    ): Promise<ChartCardData> => {
      const { supabase } = context;
      return fetchChartData(supabase, input.chartType, input);
    },

    // 獲取可用的圖表配置
    availableCharts: async (
      _: any,
      { category }: { category?: string }
    ): Promise<ChartConfig[]> => {
      // 返回所有配置
      return Object.values(CHART_CONFIG_MAP).map((config) => ({
        ...config,
        responsive: true,
        maintainAspectRatio: false,
        legend: { display: true, position: 'top' },
        tooltip: { enabled: true },
      })) as ChartConfig[];
    },
  },

  Subscription: {
    // 訂閱圖表數據更新
    chartUpdated: {
      subscribe: async function* (_: any, { chartTypes }: { chartTypes: ChartType[] }) {
        // TODO: 實現實時訂閱邏輯
      },
    },
  },
};