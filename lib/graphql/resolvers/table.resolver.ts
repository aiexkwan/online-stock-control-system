/**
 * Table GraphQL Resolver
 * 處理統一表格數據查詢 - TableCard 核心邏輯
 */

import { createClient } from '@/app/utils/supabase/server';
import {
  TableDataInput,
  TableCardData,
  TableColumn,
  TableMetadata,
  TablePermissions,
  TableFilters,
  TableSorting,
  TablePagination,
  TableDataType,
  ColumnAlign,
  FormatterType,
  SortDirection,
  StringOperator,
  NumberOperator,
  DateOperator,
  ArrayOperator,
} from '@/types/generated/graphql';
import { startOfDay, endOfDay, subDays, format, isValid, parseISO } from 'date-fns';
import DataLoader from 'dataloader';

// 表格數據源配置映射
const TABLE_CONFIG_MAP: Record<string, TableDataSourceConfig> = {
  // 庫存分析表格
  inventory_analysis: {
    name: 'Inventory Analysis',
    description: 'Product inventory analysis with order demand',
    baseQuery: 'record_palletinfo',
    joins: [
      'data_code!inner(code, description, type, colour)',
    ],
    defaultColumns: ['productCode', 'description', 'currentStock', 'orderDemand', 'fulfillmentRate'],
    permissions: {
      canView: true,
      canEdit: false,
      canDelete: false,
      canCreate: false,
      canExport: true,
      canFilter: true,
      canSort: true,
    },
  },
  
  // 訂單列表表格
  orders_list: {
    name: 'Orders List',
    description: 'Order records listing',
    baseQuery: 'data_order',
    defaultColumns: ['uuid', 'time', 'remark', 'uploader_name', 'doc_url'],
    permissions: {
      canView: true,
      canEdit: true,
      canDelete: true,
      canCreate: true,
      canExport: true,
      canFilter: true,
      canSort: true,
    },
  },
  
  // 倉庫轉移列表
  warehouse_transfers: {
    name: 'Warehouse Transfer List',
    description: 'Warehouse transfer records',
    baseQuery: 'record_pallet_transfer',
    defaultColumns: ['id', 'pltnum', 'from_location', 'to_location', 'transferstart', 'transferdone'],
    permissions: {
      canView: true,
      canEdit: false,
      canDelete: false,
      canCreate: false,
      canExport: true,
      canFilter: true,
      canSort: true,
    },
  },
  
  // 歷史記錄樹表格
  history_tree: {
    name: 'History Tree',
    description: 'System operation history records',
    baseQuery: 'record_history',
    joins: [
      'user_profiles!inner(name, department, position)',
      'record_palletinfo(pltnum, quantity)',
    ],
    defaultColumns: ['timestamp', 'action', 'location', 'user_name', 'pallet_number'],
    permissions: {
      canView: true,
      canEdit: false,
      canDelete: false,
      canCreate: false,
      canExport: true,
      canFilter: true,
      canSort: true,
    },
  },
  
  // 生產詳情表格
  production_details: {
    name: 'Production Details',
    description: 'Production records and metrics',
    baseQuery: 'production_records',
    defaultColumns: ['timestamp', 'product_code', 'quantity', 'department', 'operator', 'efficiency'],
    permissions: {
      canView: true,
      canEdit: false,
      canDelete: false,
      canCreate: false,
      canExport: true,
      canFilter: true,
      canSort: true,
    },
  },
  
  // 訂單狀態列表
  order_states: {
    name: 'Order State List',
    description: 'Order status tracking',
    baseQuery: 'data_order',
    defaultColumns: ['uuid', 'status', 'time', 'remark', 'progress'],
    permissions: {
      canView: true,
      canEdit: true,
      canDelete: false,
      canCreate: false,
      canExport: true,
      canFilter: true,
      canSort: true,
    },
  },
};

// 數據源配置接口
interface TableDataSourceConfig {
  name: string;
  description: string;
  baseQuery: string;
  joins?: string[];
  defaultColumns: string[];
  permissions: TablePermissions;
  cacheConfig?: {
    ttl: number;
    strategy: string;
  };
}

// 列配置生成器
function generateTableColumns(dataSource: string, data: any[]): TableColumn[] {
  const config = TABLE_CONFIG_MAP[dataSource];
  if (!config || !data.length) {
    return [];
  }
  
  const sampleRecord = data[0];
  const columns: TableColumn[] = [];
  
  config.defaultColumns.forEach((key) => {
    const value = sampleRecord[key];
    const column: TableColumn = {
      key,
      header: formatColumnHeader(key),
      dataType: inferDataType(value),
      sortable: true,
      filterable: true,
      align: inferColumnAlign(key, value),
      formatter: {
        type: inferFormatterType(key, value),
        options: null,
      },
      required: false,
      hidden: false,
    };
    
    // 設置列寬度
    if (key.includes('id') || key.includes('uuid')) {
      column.width = '120px';
    } else if (key.includes('time') || key.includes('date')) {
      column.width = '180px';
    } else if (key.includes('description') || key.includes('remark')) {
      column.width = '300px';
    }
    
    columns.push(column);
  });
  
  return columns;
}

// 格式化列標題
function formatColumnHeader(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// 推斷數據類型
function inferDataType(value: any): TableDataType {
  if (value === null || value === undefined) {
    return TableDataType.String;
  }
  
  if (typeof value === 'number') {
    return TableDataType.Number;
  }
  
  if (typeof value === 'boolean') {
    return TableDataType.Boolean;
  }
  
  if (typeof value === 'string') {
    // 檢查是否為日期
    if (isValidDateString(value)) {
      return value.includes('T') ? TableDataType.Datetime : TableDataType.Date;
    }
    return TableDataType.String;
  }
  
  if (Array.isArray(value)) {
    return TableDataType.Array;
  }
  
  if (typeof value === 'object') {
    return TableDataType.Object;
  }
  
  return TableDataType.String;
}

// 檢查是否為有效日期字符串
function isValidDateString(dateString: string): boolean {
  const date = parseISO(dateString);
  return isValid(date);
}

// 推斷列對齊方式
function inferColumnAlign(key: string, value: any): ColumnAlign {
  if (typeof value === 'number') {
    return ColumnAlign.Right;
  }
  
  if (key.includes('id') || key.includes('uuid') || key.includes('code')) {
    return ColumnAlign.Center;
  }
  
  return ColumnAlign.Left;
}

// 推斷格式化器類型
function inferFormatterType(key: string, value: any): FormatterType {
  if (typeof value === 'number') {
    if (key.includes('rate') || key.includes('percentage')) {
      return FormatterType.Percentage;
    }
    if (key.includes('price') || key.includes('cost') || key.includes('value')) {
      return FormatterType.Currency;
    }
  }
  
  if (typeof value === 'boolean') {
    return FormatterType.Boolean;
  }
  
  if (typeof value === 'string') {
    if (isValidDateString(value)) {
      return value.includes('T') ? FormatterType.Datetime : FormatterType.Date;
    }
    
    if (key.includes('url') || key.includes('link')) {
      return FormatterType.Link;
    }
    
    if (value.length > 50) {
      return FormatterType.Truncate;
    }
  }
  
  return FormatterType.Default;
}

// 應用篩選器
function applyFilters(query: any, filters?: TableFilters): any {
  if (!filters) return query;
  
  // 字符串篩選
  if (filters.stringFilters) {
    filters.stringFilters.forEach((filter) => {
      switch (filter.operator) {
        case StringOperator.Equals:
          query = query.eq(filter.field, filter.value);
          break;
        case StringOperator.Contains:
          query = query.ilike(filter.field, `%${filter.value}%`);
          break;
        case StringOperator.StartsWith:
          query = query.ilike(filter.field, `${filter.value}%`);
          break;
        case StringOperator.EndsWith:
          query = query.ilike(filter.field, `%${filter.value}`);
          break;
        case StringOperator.NotEquals:
          query = query.neq(filter.field, filter.value);
          break;
        case StringOperator.NotContains:
          query = query.not(filter.field, 'ilike', `%${filter.value}%`);
          break;
      }
    });
  }
  
  // 數字篩選
  if (filters.numberFilters) {
    filters.numberFilters.forEach((filter) => {
      switch (filter.operator) {
        case NumberOperator.Equals:
          query = query.eq(filter.field, filter.value);
          break;
        case NumberOperator.Gt:
          query = query.gt(filter.field, filter.value);
          break;
        case NumberOperator.Gte:
          query = query.gte(filter.field, filter.value);
          break;
        case NumberOperator.Lt:
          query = query.lt(filter.field, filter.value);
          break;
        case NumberOperator.Lte:
          query = query.lte(filter.field, filter.value);
          break;
        case NumberOperator.Between:
          if (filter.min !== undefined && filter.max !== undefined) {
            query = query.gte(filter.field, filter.min).lte(filter.field, filter.max);
          }
          break;
        case NumberOperator.NotEquals:
          query = query.neq(filter.field, filter.value);
          break;
      }
    });
  }
  
  // 日期篩選
  if (filters.dateFilters) {
    filters.dateFilters.forEach((filter) => {
      const now = new Date();
      
      switch (filter.operator) {
        case DateOperator.Equals:
          if (filter.value) {
            const date = new Date(filter.value);
            query = query.gte(filter.field, startOfDay(date).toISOString())
                          .lte(filter.field, endOfDay(date).toISOString());
          }
          break;
        case DateOperator.Before:
          if (filter.value) {
            query = query.lt(filter.field, filter.value);
          }
          break;
        case DateOperator.After:
          if (filter.value) {
            query = query.gt(filter.field, filter.value);
          }
          break;
        case DateOperator.Between:
          if (filter.startDate && filter.endDate) {
            query = query.gte(filter.field, filter.startDate)
                          .lte(filter.field, filter.endDate);
          }
          break;
        case DateOperator.Today:
          query = query.gte(filter.field, startOfDay(now).toISOString())
                        .lte(filter.field, endOfDay(now).toISOString());
          break;
        case DateOperator.Yesterday:
          const yesterday = subDays(now, 1);
          query = query.gte(filter.field, startOfDay(yesterday).toISOString())
                        .lte(filter.field, endOfDay(yesterday).toISOString());
          break;
        case DateOperator.Last_7Days:
          query = query.gte(filter.field, subDays(now, 7).toISOString());
          break;
        case DateOperator.Last_30Days:
          query = query.gte(filter.field, subDays(now, 30).toISOString());
          break;
      }
    });
  }
  
  // 布爾篩選
  if (filters.booleanFilters) {
    filters.booleanFilters.forEach((filter) => {
      query = query.eq(filter.field, filter.value);
    });
  }
  
  // 數組篩選
  if (filters.arrayFilters) {
    filters.arrayFilters.forEach((filter) => {
      switch (filter.operator) {
        case ArrayOperator.In:
          query = query.in(filter.field, filter.values);
          break;
        case ArrayOperator.NotIn:
          query = query.not(filter.field, 'in', filter.values);
          break;
      }
    });
  }
  
  return query;
}

// 應用排序
function applySorting(query: any, sorting?: TableSorting): any {
  if (!sorting) return query;
  
  const ascending = sorting.sortOrder === SortDirection.Asc;
  query = query.order(sorting.sortBy, { ascending });
  
  // 二級排序
  if (sorting.secondarySort) {
    const secondaryAscending = sorting.secondarySort.sortOrder === SortDirection.Asc;
    query = query.order(sorting.secondarySort.sortBy, { ascending: secondaryAscending });
  }
  
  return query;
}

// 應用分頁
function applyPagination(query: any, pagination: TablePagination): any {
  const { limit, offset } = pagination;
  return query.range(offset, offset + limit - 1);
}

// 獲取表格數據
async function fetchTableData(
  supabase: any,
  dataSource: string,
  input: TableDataInput
): Promise<TableCardData> {
  const config = TABLE_CONFIG_MAP[dataSource];
  if (!config) {
    throw new Error(`Unknown data source: ${dataSource}`);
  }
  
  const startTime = Date.now();
  
  // 構建查詢
  let query = supabase.from(config.baseQuery);
  
  // 添加 joins
  if (config.joins) {
    const selectFields = config.joins.join(', ');
    query = query.select(`*, ${selectFields}`);
  } else {
    query = query.select('*');
  }
  
  // 應用篩選
  query = applyFilters(query, input.filters);
  
  // 應用排序
  query = applySorting(query, input.sorting);
  
  // 獲取總數（不含分頁）
  const countQuery = applyFilters(
    supabase.from(config.baseQuery).select('*', { count: 'exact', head: true }),
    input.filters
  );
  
  // 應用分頁
  query = applyPagination(query, input.pagination);
  
  // 執行查詢
  const [{ data, error }, { count, error: countError }] = await Promise.all([
    query,
    countQuery,
  ]);
  
  if (error) throw error;
  if (countError) throw countError;
  
  const queryTime = Date.now() - startTime;
  const totalCount = count || 0;
  const currentPage = Math.floor(input.pagination.offset / input.pagination.limit) + 1;
  const totalPages = Math.ceil(totalCount / input.pagination.limit);
  
  // 生成列配置
  const columns = generateTableColumns(dataSource, data || []);
  
  // 創建元數據
  const metadata: TableMetadata = {
    queryTime,
    cacheHit: false,
    dataSource,
    lastUpdated: new Date().toISOString(),
    totalRecords: totalCount,
    filteredRecords: data?.length || 0,
    permissions: config.permissions,
    generatedAt: new Date().toISOString(),
  };
  
  return {
    data: data || [],
    columns,
    totalCount,
    hasNextPage: input.pagination.offset + input.pagination.limit < totalCount,
    hasPreviousPage: input.pagination.offset > 0,
    currentPage,
    totalPages,
    filters: input.filters || null,
    sorting: input.sorting || null,
    metadata,
    lastUpdated: new Date().toISOString(),
    refreshInterval: 60,
    dataSource,
  };
}

// GraphQL Resolvers
export const tableResolvers = {
  Query: {
    // 統一表格數據查詢
    tableCardData: async (
      _: any,
      { input }: { input: TableDataInput },
      context: any
    ): Promise<TableCardData> => {
      const { supabase } = context;
      return fetchTableData(supabase, input.dataSource, input);
    },

    // 獲取表格列配置
    tableColumns: async (
      _: any,
      { dataSource }: { dataSource: string }
    ): Promise<TableColumn[]> => {
      const config = TABLE_CONFIG_MAP[dataSource];
      if (!config) {
        throw new Error(`Unknown data source: ${dataSource}`);
      }
      
      // 返回預設列配置
      return config.defaultColumns.map((key) => ({
        key,
        header: formatColumnHeader(key),
        dataType: TableDataType.String, // 預設值，實際使用時會推斷
        sortable: true,
        filterable: true,
        align: ColumnAlign.Left,
        formatter: {
          type: FormatterType.Default,
          options: null,
        },
        required: false,
        hidden: false,
      }));
    },

    // 獲取表格權限
    tablePermissions: async (
      _: any,
      { dataSource }: { dataSource: string }
    ): Promise<TablePermissions> => {
      const config = TABLE_CONFIG_MAP[dataSource];
      if (!config) {
        throw new Error(`Unknown data source: ${dataSource}`);
      }
      
      return config.permissions;
    },
  },

  Mutation: {
    // 導出表格數據
    exportTableData: async (
      _: any,
      { input }: { input: any },
      context: any
    ): Promise<any> => {
      // TODO: 實現導出功能
      throw new Error('Export functionality not yet implemented');
    },

    // 清除表格緩存
    clearTableCache: async (
      _: any,
      { dataSource }: { dataSource: string }
    ): Promise<boolean> => {
      // TODO: 實現緩存清除邏輯
      return true;
    },

    // 刷新表格數據
    refreshTableData: async (
      _: any,
      { dataSource }: { dataSource: string }
    ): Promise<boolean> => {
      // TODO: 實現數據刷新邏輯
      return true;
    },
  },

  Subscription: {
    // 表格數據更新訂閱
    tableDataUpdated: {
      subscribe: async function* (_: any, { dataSource }: { dataSource: string }) {
        // TODO: 實現實時訂閱邏輯
        throw new Error('Subscriptions not yet implemented');
      },
    },
  },
};