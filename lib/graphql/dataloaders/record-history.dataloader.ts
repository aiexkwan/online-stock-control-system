/**
 * Record History DataLoader
 * Optimized batch loading for record history data with caching
 */

import DataLoader from 'dataloader';
import { SupabaseClient } from '@supabase/supabase-js';

// Types
export interface RecordHistoryKey {
  filters: Record<string, unknown>;
  pagination: {
    limit: number;
    offset: number;
  };
  mergingConfig: {
    timeWindowMinutes: number;
    sameOperatorOnly: boolean;
    sameActionOnly: boolean;
  };
}

export interface RecordHistoryEntry {
  id: string;
  time: string;
  operatorId?: number;
  operatorName?: string;
  operatorDepartment?: string;
  action: string;
  pltNum?: string;
  location?: string;
  remark: string;
  uuid: string;
}

export interface OperatorInfo {
  id: number;
  name: string;
  department?: string;
  position?: string;
  email?: string;
}

export interface RecordHistoryBatch {
  records: RecordHistoryEntry[];
  totalCount: number;
  operators: Map<number, OperatorInfo>;
}

// Define RecordHistoryData as the return type of the DataLoader
export type RecordHistoryData = RecordHistoryBatch;

/**
 * Create key for DataLoader caching
 */
function createRecordHistoryKey(
  filters: Record<string, unknown> = {},
  pagination = { limit: 10, offset: 0 },
  mergingConfig = { timeWindowMinutes: 5, sameOperatorOnly: true, sameActionOnly: true }
): string {
  return JSON.stringify({
    filters: Object.keys(filters)
      .sort()
      .reduce(
        (sorted, key) => {
          sorted[key] = filters[key];
          return sorted;
        },
        {} as Record<string, unknown>
      ),
    pagination,
    mergingConfig,
  });
}

/**
 * Build SQL query for record history with optimized joins
 */
function buildOptimizedQuery(keys: RecordHistoryKey[]): {
  query: string;
  params: unknown[];
  keyMappings: Array<{ key: string; startIndex: number; count: number }>;
} {
  // For simplicity, we'll batch similar queries together
  // In a more complex implementation, we could optimize for overlapping date ranges

  const baseQuery = `
    WITH operator_info AS (
      SELECT id, name, department, position, email
      FROM data_id
    ),
    record_data AS (
      SELECT 
        rh.uuid,
        rh.time,
        rh.id as operator_id,
        rh.action,
        rh.plt_num,
        rh.loc,
        rh.remark,
        oi.name as operator_name,
        oi.department as operator_department,
        oi.position as operator_position,
        oi.email as operator_email,
        ROW_NUMBER() OVER (ORDER BY rh.time DESC) as row_num
      FROM record_history rh
      LEFT JOIN operator_info oi ON rh.id = oi.id
      WHERE 1=1
  `;

  // For batch processing, we'll create union queries
  const subQueries: string[] = [];
  const allParams: unknown[] = [];
  const keyMappings: Array<{ key: string; startIndex: number; count: number }> = [];

  let paramIndex = 1;
  let resultOffset = 0;

  keys.forEach((key, _keyIndex) => {
    const filters = key.filters;
    let subQuery = baseQuery;
    const params: unknown[] = [];

    // Apply filters for this specific key
    if (filters.operatorId) {
      subQuery += ` AND rh.id = $${paramIndex++}`;
      params.push(filters.operatorId);
    }

    if (filters.action) {
      subQuery += ` AND rh.action = $${paramIndex++}`;
      params.push(filters.action);
    }

    if (
      filters.dateRange &&
      typeof filters.dateRange === 'object' &&
      'start' in filters.dateRange &&
      filters.dateRange.start
    ) {
      subQuery += ` AND rh.time >= $${paramIndex++}`;
      params.push(filters.dateRange.start);
    }

    if (
      filters.dateRange &&
      typeof filters.dateRange === 'object' &&
      'end' in filters.dateRange &&
      filters.dateRange.end
    ) {
      subQuery += ` AND rh.time <= $${paramIndex++}`;
      params.push(filters.dateRange.end);
    }

    // Add more filters as needed...

    subQuery += `) SELECT * FROM record_data WHERE row_num > ${key.pagination.offset} AND row_num <= ${key.pagination.offset + key.pagination.limit}`;

    subQueries.push(`(${subQuery})`);
    allParams.push(...params);

    keyMappings.push({
      key: createRecordHistoryKey(key.filters, key.pagination, key.mergingConfig),
      startIndex: resultOffset,
      count: key.pagination.limit,
    });

    resultOffset += key.pagination.limit;
  });

  const finalQuery = subQueries.join(' UNION ALL ') + ' ORDER BY time DESC';

  return {
    query: finalQuery,
    params: allParams,
    keyMappings,
  };
}

/**
 * Create Record History DataLoader
 */
export function createRecordHistoryDataLoader(supabase: SupabaseClient) {
  // Main record history loader
  const recordHistoryLoader = new DataLoader<string, RecordHistoryBatch>(
    async (keys: readonly string[]) => {
      try {
        // Parse keys back to objects
        const parsedKeys = keys.map(key => JSON.parse(key) as RecordHistoryKey);

        // Build optimized batch query
        const { query, params, keyMappings } = buildOptimizedQuery(parsedKeys);

        // Execute batch query
        const { data: rawResults, error } = await supabase.rpc('execute_sql', { query, params });

        if (error) {
          console.error('RecordHistory DataLoader error:', error);
          throw error;
        }

        // Get all unique operator IDs for operator info lookup
        const operatorIds = Array.from(
          new Set(
            rawResults
              .map((r: { operator_id: number }) => r.operator_id)
              .filter((id: number | null | undefined) => id !== null && id !== undefined)
          )
        );

        // Fetch operator information in batch
        const { data: operatorData, error: operatorError } = await supabase
          .from('data_id')
          .select('id, name, department, position, email')
          .in('id', operatorIds);

        if (operatorError) {
          console.error('Operator lookup error:', operatorError);
        }

        // Create operator map
        const operators = new Map<number, OperatorInfo>();
        operatorData?.forEach(op => {
          operators.set(op.id, {
            id: op.id,
            name: op.name,
            department: op.department,
            position: op.position,
            email: op.email,
          });
        });

        // Distribute results back to each key
        const resultBatches: RecordHistoryBatch[] = [];

        keyMappings.forEach(mapping => {
          const keyResults = rawResults.slice(
            mapping.startIndex,
            mapping.startIndex + mapping.count
          );

          const records: RecordHistoryEntry[] = keyResults.map(
            (r: {
              uuid: string;
              time: string;
              operator_id?: number;
              operator_name?: string;
              operator_department?: string;
              action: string;
              plt_num?: string;
              loc?: string;
              remark: string;
            }) => ({
              id: r.uuid,
              time: r.time,
              operatorId: r.operator_id,
              operatorName: r.operator_name,
              operatorDepartment: r.operator_department,
              action: r.action,
              pltNum: r.plt_num,
              location: r.loc,
              remark: r.remark,
              uuid: r.uuid,
            })
          );

          resultBatches.push({
            records,
            totalCount: keyResults.length, // This would need a separate count query for exact total
            operators,
          });
        });

        return resultBatches;
      } catch (error) {
        console.error('RecordHistory DataLoader batch error:', error);
        // Return error for each key
        return keys.map(() => {
          throw error;
        });
      }
    },
    {
      // DataLoader options
      maxBatchSize: 50, // Limit batch size
      cacheKeyFn: (key: string) => key, // Use the key as-is for caching
      batchScheduleFn: callback => setTimeout(callback, 10), // Small delay to batch requests
    }
  );

  // Operator information loader (separate for better caching)
  const operatorLoader = new DataLoader<number, OperatorInfo | null>(
    async (operatorIds: readonly number[]) => {
      try {
        const { data, error } = await supabase
          .from('data_id')
          .select('id, name, department, position, email')
          .in('id', [...operatorIds]);

        if (error) throw error;

        // Create lookup map
        const operatorMap = new Map<number, OperatorInfo>();
        data?.forEach(op => {
          operatorMap.set(op.id, {
            id: op.id,
            name: op.name,
            department: op.department,
            position: op.position,
            email: op.email,
          });
        });

        // Return results in same order as requested IDs
        return operatorIds.map(id => operatorMap.get(id) || null);
      } catch (error) {
        console.error('Operator DataLoader error:', error);
        throw error;
      }
    },
    {
      maxBatchSize: 100,
    }
  );

  // Action statistics loader for autocomplete and analytics
  const actionStatsLoader = new DataLoader<string, string[]>(
    async (prefixes: readonly string[]) => {
      try {
        // Get unique actions that start with any of the prefixes
        const conditions = prefixes.map((_, index) => `action ILIKE $${index + 1}`).join(' OR ');
        const params = prefixes.map(prefix => `${prefix}%`);

        const { data, error } = await supabase.rpc('execute_sql', {
          query: `
              SELECT DISTINCT action 
              FROM record_history 
              WHERE ${conditions}
              ORDER BY action 
              LIMIT 100
            `,
          params,
        });

        if (error) throw error;

        const allActions = data.map((row: { action: string }) => row.action);

        // Return matching actions for each prefix
        return prefixes.map(prefix =>
          allActions.filter((action: string) =>
            action.toLowerCase().startsWith(prefix.toLowerCase())
          )
        );
      } catch (error) {
        console.error('ActionStats DataLoader error:', error);
        throw error;
      }
    }
  );

  return {
    recordHistoryLoader,
    operatorLoader,
    actionStatsLoader,

    // Utility methods
    loadRecordHistory: (
      filters: Record<string, unknown> = {},
      pagination = { limit: 10, offset: 0 },
      mergingConfig = { timeWindowMinutes: 5, sameOperatorOnly: true, sameActionOnly: true }
    ) => {
      const key = createRecordHistoryKey(filters, pagination, mergingConfig);
      return recordHistoryLoader.load(key);
    },

    loadOperator: (operatorId: number) => {
      return operatorLoader.load(operatorId);
    },

    loadActionSuggestions: (prefix: string) => {
      return actionStatsLoader.load(prefix);
    },

    // Cache management
    clearAll: () => {
      recordHistoryLoader.clearAll();
      operatorLoader.clearAll();
      actionStatsLoader.clearAll();
    },

    clearRecordHistory: (
      filters?: Record<string, unknown>,
      pagination?: { limit: number; offset: number },
      mergingConfig?: {
        timeWindowMinutes: number;
        sameOperatorOnly: boolean;
        sameActionOnly: boolean;
      }
    ) => {
      if (filters || pagination || mergingConfig) {
        const key = createRecordHistoryKey(filters, pagination, mergingConfig);
        recordHistoryLoader.clear(key);
      } else {
        recordHistoryLoader.clearAll();
      }
    },

    clearOperator: (operatorId: number) => {
      operatorLoader.clear(operatorId);
    },

    // Prime cache with data
    primeRecordHistory: (key: string, data: RecordHistoryBatch) => {
      recordHistoryLoader.prime(key, data);
    },

    primeOperator: (operatorId: number, data: OperatorInfo) => {
      operatorLoader.prime(operatorId, data);
    },
  };
}

export type RecordHistoryDataLoader = ReturnType<typeof createRecordHistoryDataLoader>;
