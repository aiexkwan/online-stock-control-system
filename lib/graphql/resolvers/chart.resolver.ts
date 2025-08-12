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
  ChartDatasetType,
} from '@/types/generated/graphql';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import DataLoader from 'dataloader';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database/supabase';

// 定義 Supabase client 類型
type SupabaseClientType = SupabaseClient<Database>;

// 定義 GraphQL Context 類型
interface ChartResolverContext {
  supabase: SupabaseClientType;
  user?: { id: string; email: string; role: string };
}

// 定義資料庫查詢結果類型
interface PalletInfoQueryResult {
  product_code: string;
  product_qty: number;
  current_location?: string;
  generate_time?: string;
  data_code?: {
    code: string;
    description: string;
    type: string;
    colour: string;
  };
}

interface TransferQueryResult {
  transferstart: string;
  transferdone: string | null;
  from_location?: string;
  to_location?: string;
}

interface ProductDistributionData {
  productCode: string;
  productName: string;
  totalQuantity: number;
  locations: Record<string, number>;
}

interface WorkLevelData {
  id: string;
  staffName: string;
  qc: number;
  move: number;
  grn: number;
  loading: number;
  latest_update: string;
  total: number;
}

interface StaffWorkHistory {
  staffId: string;
  staffName: string;
  department: string;
  dataPoints: Array<{
    timestamp: string;
    total: number;
  }>;
}

interface WorkLevelRecord {
  id: number;
  qc?: number;
  move?: number;
  grn?: number;
  loading?: number;
  latest_update: string;
}

interface StaffRecord {
  id: number;
  name?: string;
  department?: string;
}

// 定義數據處理類型
interface GroupedData {
  [key: string]: {
    [field: string]: unknown;
    count?: number;
    totalQuantity?: number;
  };
}

interface TimeSeriesDataPoint {
  date: string;
  count?: number;
  totalQuantity?: number;
}

// 定義聚合數據元素類型
interface AggregateDataItem {
  [key: string]: number | string | unknown;
}

// 圖表配置映射
const CHART_CONFIG_MAP: Record<string, Partial<ChartConfig>> = {
  stockDistribution: {
    type: ChartType.Treemap,
    title: 'Stock Distribution',
    description: 'Product distribution across warehouses',
  },
  warehouseWorkLevel: {
    type: ChartType.Line,
    title: 'Work Level',
    description: 'Staff work level over past 7 days',
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
  data: AggregateDataItem[],
  aggregationType: AggregationType,
  valueField: string
): number {
  if (!data.length) return 0;

  const values = data.map(d => Number(d[valueField]) || 0);

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
  supabase: SupabaseClientType,
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
  supabase: SupabaseClientType,
  input: ChartQueryInput | SingleChartQueryInput
): Promise<ChartCardData> {
  // Direct query approach - no MV needed
  // Step 1: Get pallet info
  const { data: pallets, error: palletError } = await supabase
    .from('record_palletinfo')
    .select('plt_num, product_code, product_qty')
    .gt('product_qty', 0);
  
  if (palletError) throw palletError;
  
  if (!pallets || pallets.length === 0) {
    return createEmptyChartData(ChartType.Treemap);
  }
  
  // Step 2: Get current locations for all pallets
  const pltNums = pallets.map(p => p.plt_num);
  const { data: locations, error: locationError } = await supabase
    .from('record_history')
    .select('plt_num, loc, time')
    .in('plt_num', pltNums)
    .order('time', { ascending: false });
  
  if (locationError) throw locationError;
  
  // Create location map (only keep latest location for each pallet)
  const locationMap = new Map<string, string>();
  locations?.forEach(loc => {
    if (loc.plt_num && loc.loc && !locationMap.has(loc.plt_num)) {
      locationMap.set(loc.plt_num, loc.loc);
    }
  });
  
  // Combine data
  const data = pallets.map(p => ({
    product_code: p.product_code,
    product_qty: p.product_qty,
    current_location: locationMap.get(p.plt_num) || 'Await'
  }));

  // 按產品分組並聚合
  interface ProductInfoQueryResult {
    product_code: string;
    current_location?: string;
    product_qty?: number;
    [key: string]: unknown;
  }
  
  const groupedData = (data as ProductInfoQueryResult[] || []).reduce((acc: Record<string, ProductDistributionData>, item: ProductInfoQueryResult) => {
    const key = item.product_code;
    if (!acc[key]) {
      acc[key] = {
        productCode: key,
        productName: key, // 簡化處理，使用產品代碼作為名稱
        totalQuantity: 0,
        locations: {},
      };
    }
    const productData = acc[key];
    const qty = item.product_qty || 0;
    productData.totalQuantity += qty;
    if (item.current_location) {
      productData.locations[item.current_location] = (productData.locations[item.current_location] || 0) + qty;
    }
    return acc;
  }, {});

  const chartData: ChartDataPoint[] = (Object.values(groupedData) as ProductDistributionData[])
    .sort(
      (a: ProductDistributionData, b: ProductDistributionData) => b.totalQuantity - a.totalQuantity
    )
    .slice(0, ('limit' in input ? input.limit : undefined) || 20)
    .map((item: ProductDistributionData) => ({
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
        type: ChartDatasetType.Single,
        hidden: false,
      },
    ],
    labels: chartData.map(d => d.x),
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
      averageResponseTime: Date.now() - new Date().getTime(),
      dataAge: 0,
    },
    lastUpdated: new Date().toISOString(),
    refreshInterval: 300,
    dataSource: 'supabase',
  };
}

// Area Chart 數據（倉庫工作量）
async function fetchAreaChartData(
  supabase: SupabaseClientType,
  input: ChartQueryInput | SingleChartQueryInput
): Promise<ChartCardData> {
  const dateRange = input.dateRange || {
    start: subDays(new Date(), 7).toISOString(),
    end: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('record_transfer')
    .select('tran_date, f_loc, t_loc, plt_num')
    .gte('tran_date', dateRange.start)
    .lte('tran_date', dateRange.end)
    .order('tran_date');

  if (error) throw error;

  // 按時間粒度分組
  const granularity = (input as ChartQueryInput).timeGranularity || TimeGranularity.Day;
  
  interface TransferQueryResult {
    tran_date?: string;
    f_loc?: string;
    t_loc?: string;
    plt_num?: string;
    [key: string]: unknown;
  }
  
  const groupedData = (data as TransferQueryResult[] || []).reduce((acc: Record<string, TimeSeriesDataPoint>, item: TransferQueryResult) => {
    const key = formatTimeGranularity(new Date(item.tran_date || ''), granularity);
    if (!acc[key]) {
      acc[key] = { date: key, count: 0 };
    }
    const entry = acc[key];
    if (entry && entry.count !== undefined) {
      entry.count++;
    }
    return acc;
  }, {});

  const chartData: ChartDataPoint[] = (Object.values(groupedData) as TimeSeriesDataPoint[])
    .sort((a: TimeSeriesDataPoint, b: TimeSeriesDataPoint) => a.date.localeCompare(b.date))
    .map((item: TimeSeriesDataPoint) => ({
      x: item.date,
      y: item.count || 0,
      label: item.date,
      value: item.count || 0,
      metadata: {},
    }));

  return {
    datasets: [
      {
        id: 'warehouse-work-level',
        label: 'Transfer Count',
        data: chartData,
        type: ChartDatasetType.Single,
        color: '#3b82f6',
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        hidden: false,
      },
    ],
    labels: chartData.map(d => d.x),
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
  supabase: SupabaseClientType,
  input: ChartQueryInput | SingleChartQueryInput
): Promise<ChartCardData> {
  const { data, error } = await supabase
    .from('record_transfer')
    .select('tran_date, f_loc, t_loc, plt_num')
    .not('tran_date', 'is', null)
    .limit(1000);

  if (error) throw error;

  // 計算位置間轉移統計
  interface TransferLocationQueryResult {
    tran_date: string;
    f_loc?: string;
    t_loc?: string;
    plt_num?: string;
    [key: string]: unknown;
  }
  
  const locations = (data as TransferLocationQueryResult[] || []).reduce((acc: Record<string, number>, item: TransferLocationQueryResult) => {
    const fromLoc = item.f_loc || 'Unknown';
    const toLoc = item.t_loc || 'Unknown';
    const locationPair = `${fromLoc} → ${toLoc}`;
    acc[locationPair] = (acc[locationPair] || 0) + 1;
    return acc;
  }, {});

  // 創建圓餅圖數據 - 取前10個最常見的轉移路徑
  const sortedLocations = Object.entries(locations)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  const chartData: ChartDataPoint[] = sortedLocations
    .map(([location, count]) => ({
      x: location,
      y: count,
      label: location,
      value: count,
      metadata: {},
    }));

  return {
    datasets: [
      {
        id: 'transfer-time-distribution',
        label: 'Transfer Count',
        data: chartData,
        type: ChartDatasetType.Single,
        backgroundColor: '#10b981',
        hidden: false,
      },
    ],
    labels: chartData.map(d => d.x),
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
  supabase: SupabaseClientType,
  input: ChartQueryInput | SingleChartQueryInput
): Promise<ChartCardData> {
  const dateRange = input.dateRange || {
    start: subDays(new Date(), 30).toISOString(),
    end: new Date().toISOString(),
  };

  // 這裡簡化處理，實際應該從歷史記錄表獲取
  const { data, error } = await supabase
    .from('record_palletinfo')
    .select('product_code, product_qty, generate_time')
    .gte('generate_time', dateRange.start)
    .lte('generate_time', dateRange.end)
    .order('generate_time');

  if (error) throw error;

  // 按天分組
  interface HistoryQueryResult {
    generate_time?: string;
    product_qty?: number;
    [key: string]: unknown;
  }
  
  const groupedData = (data as HistoryQueryResult[] || []).reduce((acc: Record<string, TimeSeriesDataPoint>, item: HistoryQueryResult) => {
    const date = format(new Date(item.generate_time || ''), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = { date, count: 0, totalQuantity: 0 };
    }
    const qty = item.product_qty || 0;
    acc[date].totalQuantity = (acc[date].totalQuantity || 0) + qty;
    return acc;
  }, {});

  const chartData: ChartDataPoint[] = (Object.values(groupedData) as TimeSeriesDataPoint[])
    .sort((a: TimeSeriesDataPoint, b: TimeSeriesDataPoint) => a.date.localeCompare(b.date))
    .map((item: TimeSeriesDataPoint) => ({
      x: item.date,
      y: item.totalQuantity || 0,
      label: item.date,
      value: item.totalQuantity || 0,
      metadata: {},
    }));

  return {
    datasets: [
      {
        id: 'stock-level-history',
        label: 'Stock Level',
        data: chartData,
        type: ChartDatasetType.Single,
        borderColor: '#8b5cf6',
        backgroundColor: 'transparent',
        hidden: false,
      },
    ],
    labels: chartData.map(d => d.x),
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

// Work Level Chart 數據
async function fetchWorkLevelData(
  supabase: SupabaseClientType,
  input: ChartQueryInput | SingleChartQueryInput
): Promise<ChartCardData> {
  // 獲取最新的數據（根據最後更新時間）
  // 首先找出最新的更新時間
  const { data: latestData, error: latestError } = await supabase
    .from('work_level')
    .select('latest_update')
    .order('latest_update', { ascending: false })
    .limit(1);

  if (latestError) throw latestError;
  
  if (!latestData || latestData.length === 0) {
    return createEmptyChartData(ChartType.Line);
  }

  const latestUpdate = new Date((latestData[0] as { latest_update: string }).latest_update);
  const past7Days = subDays(latestUpdate, 7);
  
  // 查詢 work_level 表格，獲取最新更新時間往前7天的所有記錄
  const { data: workLevelData, error: workLevelError } = await supabase
    .from('work_level')
    .select('id, qc, move, grn, loading, latest_update')
    .gte('latest_update', past7Days.toISOString())
    .lte('latest_update', latestUpdate.toISOString())
    .order('latest_update');

  if (workLevelError) throw workLevelError;

  // 類型斷言確保類型安全
  const typedWorkLevelData = (workLevelData || []) as WorkLevelRecord[];

  // 獲取員工姓名和部門
  const staffIds = [...new Set(typedWorkLevelData.map(item => item.id))];
  const { data: staffData, error: staffError } = await supabase
    .from('data_id')
    .select('id, name, department')
    .in('id', staffIds);

  if (staffError) throw staffError;

  // 類型斷言確保類型安全
  const typedStaffData = (staffData || []) as StaffRecord[];

  // 創建員工 ID 到資訊的映射
  const staffInfoMap: Record<string, { name: string; department: string }> = {};
  typedStaffData.forEach(staff => {
    staffInfoMap[staff.id.toString()] = {
      name: staff.name || staff.id.toString(),
      department: staff.department || 'Unknown'
    };
  });

  // 按員工分組數據並計算每個時間點的工作總量
  const staffHistoryMap: Record<string, StaffWorkHistory> = {};
  
  typedWorkLevelData.forEach(item => {
    const staffId = item.id.toString();
    const staffInfo = staffInfoMap[staffId] || { name: staffId, department: 'Unknown' };
    const total = (item.qc || 0) + (item.move || 0) + (item.grn || 0) + (item.loading || 0);
    const timestamp = format(new Date(item.latest_update), 'yyyy-MM-dd HH:mm');
    
    if (!staffHistoryMap[staffId]) {
      staffHistoryMap[staffId] = {
        staffId,
        staffName: staffInfo.name,
        department: staffInfo.department,
        dataPoints: []
      };
    }
    
    staffHistoryMap[staffId].dataPoints.push({
      timestamp,
      total
    });
  });

  // 獲取所有唯一時間點並排序
  const allTimestamps = [...new Set(
    Object.values(staffHistoryMap).flatMap(staff => 
      staff.dataPoints.map(dp => dp.timestamp)
    )
  )].sort();

  // 準備數據集 - 每個員工一條線
  const datasets: ChartDataset[] = Object.values(staffHistoryMap).map((staff, index) => {
    // 為每個時間點創建數據點，如果沒有數據則使用最近的值
    const dataPoints: ChartDataPoint[] = [];
    let lastValue = 0;
    
    allTimestamps.forEach(timestamp => {
      const dataPoint = staff.dataPoints.find(dp => dp.timestamp === timestamp);
      if (dataPoint) {
        lastValue = dataPoint.total;
      }
      dataPoints.push({
        x: timestamp,
        y: lastValue,
        label: `${staff.staffName}: ${lastValue}`,
        value: lastValue,
        metadata: {
          staffId: staff.staffId,
          staffName: staff.staffName,
          department: staff.department
        }
      });
    });

    // 生成不同顏色
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FD7272', '#C44569',
      '#F8B500', '#5CDB95', '#FC5185', '#3FC1C9', '#364F6B',
      '#A8E6CF', '#FFDAB9', '#FF8B94', '#D1C4E9', '#B2DFDB'
    ];
    const color = colors[index % colors.length];

    return {
      id: `staff-${staff.staffId}`,
      label: staff.staffName,
      data: dataPoints,
      type: ChartDatasetType.Single,
      borderColor: color,
      backgroundColor: 'transparent',
      hidden: false,
    };
  });

  // 獲取所有唯一的部門
  const uniqueDepartments = [...new Set(Object.values(staffHistoryMap).map(staff => staff.department))].sort();

  return {
    datasets,
    labels: allTimestamps,
    config: {
      ...CHART_CONFIG_MAP.warehouseWorkLevel,
      responsive: true,
      maintainAspectRatio: false,
      xAxis: {
        type: 'category',
        display: true,
        label: 'Time',
      },
      yAxis: {
        type: 'linear',
        display: true,
        label: 'Total Work Count',
        min: 0,
      },
      legend: { 
        display: true, 
        position: 'top',
        labels: {
          color: '#ffffff' // 白色文字
        }
      },
      tooltip: { 
        enabled: true, 
        mode: 'index', 
        intersect: false 
      },
      // 黑色背景樣式配置
      plugins: {
        backgroundColor: '#000000',
        gridColor: '#333333',
        textColor: '#ffffff',
        departments: uniqueDepartments // 傳遞部門列表
      }
    } as ChartConfig,
    performance: {
      totalQueries: 3, // 增加了一個查詢來獲取最新時間
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
      _: unknown,
      { input }: { input: ChartQueryInput },
      context: ChartResolverContext
    ): Promise<ChartCardData> => {
      const { supabase } = context;

      // 目前簡化處理，只返回第一個圖表類型的數據
      if (input.chartTypes.length > 0) {
        const chartType = input.chartTypes[0];
        
        // 特殊處理 Work Level 圖表
        // 檢查是否包含特定的 filters 或 metadata 來識別 Work Level 圖表
        if (chartType === ChartType.Line && 
            (input.filters?.chartId === 'WorkLevelCard' || 
             input.filters?.dataSource === 'work_level')) {
          return fetchWorkLevelData(supabase, input);
        }
        
        return fetchChartData(supabase, chartType, input);
      }

      return createEmptyChartData(ChartType.Line);
    },

    // 獲取單個圖表數據
    chartData: async (
      _: unknown,
      { input }: { input: SingleChartQueryInput },
      context: ChartResolverContext
    ): Promise<ChartCardData> => {
      const { supabase } = context;
      return fetchChartData(supabase, input.chartType, input);
    },

    // 獲取可用的圖表配置
    availableCharts: async (
      _: unknown,
      { category }: { category?: string }
    ): Promise<ChartConfig[]> => {
      // 返回所有配置
      return Object.values(CHART_CONFIG_MAP).map(config => ({
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
      subscribe: async function* (_: unknown, { chartTypes }: { chartTypes: ChartType[] }) {
        // TODO: 實現實時訂閱邏輯
      },
    },
  },
};
