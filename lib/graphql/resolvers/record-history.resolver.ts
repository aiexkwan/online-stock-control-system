/**
 * Record History GraphQL Resolver
 * Handles VerticalTimelineCard data with intelligent operation merging
 */

import { IResolvers } from '@graphql-tools/utils';
import { SupabaseClient } from '@supabase/supabase-js';
import { GraphQLContext } from './index';

// Types for internal processing
interface RawRecordHistoryEntry {
  id: string;
  time: string;
  id_operator?: number;
  action: string;
  plt_num?: string;
  loc?: string;
  remark: string;
  uuid: string;
}

interface RecordHistoryFilters {
  operatorId?: number;
  operatorName?: string;
  action?: string;
  actions?: string[];
  pltNum?: string;
  palletNumbers?: string[];
  location?: string;
  locations?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  departments?: string[];
  positions?: string[];
  searchTerm?: string;
}

interface RawDatabaseRecord {
  uuid: string;
  time: string;
  id: number;
  action: string;
  plt_num?: string;
  loc?: string;
  remark?: string;
  data_id?: {
    id: number;
    name?: string;
    department?: string;
    position?: string;
    email?: string;
  }[];
}

interface SqlQueryRecord {
  uuid: string;
  time: string;
  id_operator: number;
  action: string;
  plt_num?: string;
  loc?: string;
  remark?: string;
  operator_name?: string;
  operator_department?: string;
  operator_position?: string;
  operator_email?: string;
}

interface OperatorInfo {
  id: number;
  name: string;
  department?: string;
  position?: string;
  email?: string;
}

interface MergingConfig {
  timeWindowMinutes: number;
  sameOperatorOnly: boolean;
  sameActionOnly: boolean;
  minOperationsToMerge: number;
  maxOperationsPerGroup: number;
  includeSequentialAnalysis: boolean;
  groupByLocation: boolean;
}

interface MergedGroup {
  id: string;
  operatorId: number;
  operatorInfo: OperatorInfo;
  action: string;
  records: RawRecordHistoryEntry[];
  palletNumbers: string[];
  timeStart: Date;
  timeEnd: Date;
  locations: string[];
  remark: string;
}

// Default merging configuration
const DEFAULT_MERGING_CONFIG: MergingConfig = {
  timeWindowMinutes: 0, // Not used in new logic
  sameOperatorOnly: true,
  sameActionOnly: true,
  minOperationsToMerge: 1, // Merge even single operations
  maxOperationsPerGroup: 100,
  includeSequentialAnalysis: true,
  groupByLocation: false,
};

/**
 * Normalize action name for comparison
 * Groups similar actions together (e.g., "Finished QC", "QC Pass" and "QC" are the same)
 */
function normalizeAction(action: string): string {
  const actionLower = action.toLowerCase().trim();

  // Group all QC-related actions (including "Finished QC")
  if (actionLower.includes('qc') || actionLower.includes('quality')) return 'QC';

  // Group all upload-related actions
  if (actionLower.includes('upload')) {
    if (actionLower.includes('order')) return 'Order Upload';
    return 'Upload';
  }

  // Group all GRN-related actions (including "GRN Receiving")
  if (actionLower.includes('grn') || actionLower.includes('receiving')) return 'GRN';

  // Group all transfer-related actions
  if (actionLower.includes('transfer')) return 'Transfer';

  // Group all void-related actions
  if (actionLower.includes('void')) return 'Void';

  // Group all print-related actions
  if (actionLower.includes('print') || actionLower.includes('label')) return 'Print';

  return action.trim(); // Return original if no match
}

/**
 * Intelligent record merging algorithm - based on consecutive events
 * Merges records with:
 * 1) Same operator
 * 2) Same action type (normalized)
 * 3) Consecutive occurrence (no other actions in between)
 */
function mergeRecords(
  records: RawRecordHistoryEntry[],
  operators: Map<number, OperatorInfo>,
  config: MergingConfig
): MergedGroup[] {
  const groups: MergedGroup[] = [];
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  let currentGroup: RawRecordHistoryEntry[] = [];
  let currentOperatorId: number | null = null;
  let currentActionType: string | null = null;

  for (const record of sortedRecords) {
    const operatorId = record.id_operator || 0;
    const actionType = normalizeAction(record.action);

    // Check if this record continues the current group
    // Merge if same operator AND same action type (consecutive events)
    const canMerge =
      currentGroup.length > 0 &&
      operatorId === currentOperatorId &&
      actionType === currentActionType &&
      currentGroup.length < config.maxOperationsPerGroup;

    if (!canMerge && currentGroup.length > 0) {
      // Different operator or action type - finalize current group
      groups.push(createMergedGroup(currentGroup, operators, config));
      currentGroup = [];
    }

    // Add record to current group
    currentGroup.push(record);
    currentOperatorId = operatorId;
    currentActionType = actionType;
  }

  // Handle the last group
  if (currentGroup.length > 0) {
    groups.push(createMergedGroup(currentGroup, operators, config));
  }

  return groups;
}

/**
 * Create a merged group from raw records
 */
function createMergedGroup(
  records: RawRecordHistoryEntry[],
  operators: Map<number, OperatorInfo>,
  _config: MergingConfig
): MergedGroup {
  const firstRecord = records[0];
  const lastRecord = records[records.length - 1];
  const operatorId = firstRecord.id_operator || 0;
  const operatorInfo = operators.get(operatorId) || {
    id: operatorId,
    name: `Operator ${operatorId}`,
    department: undefined,
    position: undefined,
    email: undefined,
  };

  const palletNumbers = records
    .map(r => r.plt_num)
    .filter((plt): plt is string => !!plt)
    .filter((plt, index, arr) => arr.indexOf(plt) === index); // Unique values

  const locations = records
    .map(r => r.loc)
    .filter((loc): loc is string => !!loc)
    .filter((loc, index, arr) => arr.indexOf(loc) === index); // Unique values

  const timeStart = new Date(firstRecord.time);
  const timeEnd = new Date(lastRecord.time);

  // Generate unique ID for merged group
  const id = `merged_${firstRecord.uuid}_${records.length}`;

  // Combine remarks (take first non-empty or concatenate unique ones)
  let remark = firstRecord.remark;
  if (records.length > 1) {
    const uniqueRemarks = records
      .map(r => r.remark.trim())
      .filter(r => r.length > 0)
      .filter((r, index, arr) => arr.indexOf(r) === index);

    if (uniqueRemarks.length > 1) {
      remark = uniqueRemarks.join(' | ');
    } else if (uniqueRemarks.length === 1) {
      remark = uniqueRemarks[0];
    }
  }

  return {
    id,
    operatorId,
    operatorInfo,
    action: firstRecord.action,
    records,
    palletNumbers,
    timeStart,
    timeEnd,
    locations,
    remark,
  };
}

/**
 * Calculate efficiency metrics for merged group
 */
function calculateEfficiencyMetrics(group: MergedGroup) {
  const durationMinutes = (group.timeEnd.getTime() - group.timeStart.getTime()) / (1000 * 60);
  const operationsPerMinute = group.records.length / Math.max(durationMinutes, 0.1); // Avoid division by zero

  // Calculate average time between operations
  let averageTimeBetweenOps = 0;
  if (group.records.length > 1) {
    const intervals = [];
    for (let i = 1; i < group.records.length; i++) {
      const prevTime = new Date(group.records[i - 1].time);
      const currTime = new Date(group.records[i].time);
      intervals.push((currTime.getTime() - prevTime.getTime()) / 1000); // seconds
    }
    averageTimeBetweenOps =
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  return {
    duration: Math.round(durationMinutes * 60), // seconds
    efficiency: operationsPerMinute,
    averageTimeBetweenOps,
    isSequential: group.records.length > 1 && averageTimeBetweenOps < 300, // Consider sequential if avg < 5 minutes
  };
}

/**
 * Fetch operators information from data_id table
 */
async function _fetchOperators(
  supabase: SupabaseClient,
  operatorIds: number[]
): Promise<Map<number, OperatorInfo>> {
  const { data, error } = await supabase
    .from('data_id')
    .select('id, name, department, position, email')
    .in('id', operatorIds);

  if (error) {
    console.error('Error fetching operators:', error);
    return new Map();
  }

  const operatorMap = new Map<number, OperatorInfo>();
  data?.forEach(operator => {
    operatorMap.set(operator.id, {
      id: operator.id,
      name: operator.name,
      department: operator.department,
      position: operator.position,
      email: operator.email,
    });
  });

  return operatorMap;
}

/**
 * Build SQL query with filters
 */
function buildRecordHistoryQuery(filters: RecordHistoryFilters = {}) {
  let query = `
    SELECT 
      rh.uuid,
      rh.time,
      rh.id as id_operator,
      rh.action,
      rh.plt_num,
      rh.loc,
      rh.remark,
      di.name as operator_name,
      di.department as operator_department,
      di.position as operator_position,
      di.email as operator_email
    FROM record_history rh
    LEFT JOIN data_id di ON rh.id = di.id
    WHERE 1=1
  `;

  const params: (string | number | string[])[] = [];
  let paramIndex = 1;

  // Apply filters
  if (filters.operatorId) {
    query += ` AND rh.id = $${paramIndex++}`;
    params.push(filters.operatorId);
  }

  if (filters.operatorName) {
    query += ` AND di.name ILIKE $${paramIndex++}`;
    params.push(`%${filters.operatorName}%`);
  }

  if (filters.action) {
    query += ` AND rh.action = $${paramIndex++}`;
    params.push(filters.action);
  }

  if (filters.actions && filters.actions.length > 0) {
    query += ` AND rh.action = ANY($${paramIndex++})`;
    params.push(filters.actions);
  }

  if (filters.pltNum) {
    query += ` AND rh.plt_num ILIKE $${paramIndex++}`;
    params.push(`%${filters.pltNum}%`);
  }

  if (filters.palletNumbers && filters.palletNumbers.length > 0) {
    query += ` AND rh.plt_num = ANY($${paramIndex++})`;
    params.push(filters.palletNumbers);
  }

  if (filters.location) {
    query += ` AND rh.loc = $${paramIndex++}`;
    params.push(filters.location);
  }

  if (filters.locations && filters.locations.length > 0) {
    query += ` AND rh.loc = ANY($${paramIndex++})`;
    params.push(filters.locations);
  }

  if (filters.dateRange) {
    if (filters.dateRange.start) {
      query += ` AND rh.time >= $${paramIndex++}`;
      params.push(filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      query += ` AND rh.time <= $${paramIndex++}`;
      params.push(filters.dateRange.end);
    }
  }

  if (filters.departments && filters.departments.length > 0) {
    query += ` AND di.department = ANY($${paramIndex++})`;
    params.push(filters.departments);
  }

  if (filters.positions && filters.positions.length > 0) {
    query += ` AND di.position = ANY($${paramIndex++})`;
    params.push(filters.positions);
  }

  if (filters.searchTerm) {
    query += ` AND (
      di.name ILIKE $${paramIndex} OR 
      rh.action ILIKE $${paramIndex} OR 
      rh.plt_num ILIKE $${paramIndex} OR 
      rh.loc ILIKE $${paramIndex} OR
      rh.remark ILIKE $${paramIndex}
    )`;
    params.push(`%${filters.searchTerm}%`);
    paramIndex++;
  }

  return { query, params };
}

export const recordHistoryResolvers: IResolvers = {
  Query: {
    /**
     * Main record history query with intelligent merging
     */
    recordHistory: async (_parent, args, context: GraphQLContext) => {
      try {
        const {
          filters = {},
          pagination = { limit: 10, offset: 0 },
          sorting = { field: 'TIME_START', direction: 'DESC' },
          mergingConfig = DEFAULT_MERGING_CONFIG,
        } = args;

        const _startTime = Date.now();

        // Build and execute query using Supabase query builder instead of raw SQL
        let query = context.supabase.from('record_history').select(`
            uuid,
            time,
            id,
            action,
            plt_num,
            loc,
            remark,
            data_id!left (
              id,
              name,
              department,
              position,
              email
            )
          `);

        // Apply filters
        if (filters.operatorId) {
          query = query.eq('id', filters.operatorId);
        }

        if (filters.operatorName) {
          query = query.ilike('data_id.name', `%${filters.operatorName}%`);
        }

        if (filters.action) {
          query = query.eq('action', filters.action);
        }

        if (filters.actions && filters.actions.length > 0) {
          query = query.in('action', filters.actions);
        }

        if (filters.pltNum) {
          query = query.ilike('plt_num', `%${filters.pltNum}%`);
        }

        if (filters.location) {
          query = query.eq('loc', filters.location);
        }

        if (filters.dateRange) {
          if (filters.dateRange.start) {
            query = query.gte('time', filters.dateRange.start);
          }
          if (filters.dateRange.end) {
            query = query.lte('time', filters.dateRange.end);
          }
        }

        // Add sorting
        let sortField = 'time';
        if (sorting.field === 'OPERATOR_NAME') sortField = 'data_id.name';
        else if (sorting.field === 'ACTION') sortField = 'action';

        // Fetch more records than requested to account for merging
        // After merging, the number of groups will be less than raw records
        // Increase fetch limit to ensure we get all records that might be merged
        const fetchLimit = Math.min((pagination.limit || 10) * 50, 5000); // Fetch up to 50x requested or max 5000
        query = query
          .order(sortField, { ascending: sorting.direction === 'ASC' })
          .limit(fetchLimit);

        const { data: rawRecords, error } = await query;

        if (error) throw error;

        // Transform raw records to expected format
        const transformedRecords =
          rawRecords?.map((r: RawDatabaseRecord) => ({
            id: r.uuid,
            time: r.time,
            id_operator: r.id,
            action: r.action,
            plt_num: r.plt_num,
            loc: r.loc,
            remark: r.remark || '',
            uuid: r.uuid,
          })) || [];

        // Build operator map from joined data
        const operators = new Map<number, OperatorInfo>();
        rawRecords?.forEach((r: RawDatabaseRecord) => {
          if (r.data_id && r.data_id.length > 0 && r.id) {
            const operatorData = r.data_id[0];
            operators.set(r.id, {
              id: r.id,
              name: operatorData.name || `Operator ${r.id}`,
              department: operatorData.department,
              position: operatorData.position,
              email: operatorData.email,
            });
          }
        });

        // Apply intelligent merging
        const mergedGroups = mergeRecords(transformedRecords, operators, mergingConfig);

        // Sort merged groups based on sorting configuration
        mergedGroups.sort((a, b) => {
          let comparison = 0;

          switch (sorting.field) {
            case 'TIME_START':
              comparison = new Date(a.timeStart).getTime() - new Date(b.timeStart).getTime();
              break;
            case 'TIME_END':
              comparison = new Date(a.timeEnd).getTime() - new Date(b.timeEnd).getTime();
              break;
            case 'OPERATOR_NAME':
              comparison = (a.operatorInfo.name || '').localeCompare(b.operatorInfo.name || '');
              break;
            case 'ACTION':
              comparison = a.action.localeCompare(b.action);
              break;
            case 'COUNT':
              comparison = a.records.length - b.records.length;
              break;
            default:
              comparison = new Date(a.timeStart).getTime() - new Date(b.timeStart).getTime();
          }

          // Apply sort direction
          return sorting.direction === 'DESC' ? -comparison : comparison;
        });

        // Apply pagination to merged results
        const totalCount = mergedGroups.length;
        const start = pagination.offset || 0;
        const end = start + (pagination.limit || 10);
        const paginatedGroups = mergedGroups.slice(start, end);

        // Convert to GraphQL format
        const mergedRecords = paginatedGroups.map(group => {
          const metrics = calculateEfficiencyMetrics(group);

          return {
            id: group.id,
            operatorId: group.operatorId,
            operatorName: group.operatorInfo.name,
            operatorDepartment: group.operatorInfo.department,
            operatorPosition: group.operatorInfo.position,
            operatorEmail: group.operatorInfo.email,
            action: group.action,
            count: group.records.length,
            palletNumbers: group.palletNumbers,
            timeStart: group.timeStart.toISOString(),
            timeEnd: group.timeEnd.toISOString(),
            remark: group.remark,
            duration: metrics.duration,
            efficiency: metrics.efficiency,
            locations: group.locations,
            isSequential: metrics.isSequential,
            averageTimeBetweenOps: metrics.averageTimeBetweenOps,
          };
        });

        // Calculate summary statistics
        const summary = {
          totalOperations: transformedRecords.length,
          totalMergedRecords: totalCount,
          uniqueOperators: operators.size,
          uniqueActions: Array.from(new Set(transformedRecords.map(r => r.action))).length,
          uniqueLocations: Array.from(new Set(transformedRecords.map(r => r.loc).filter(Boolean)))
            .length,
          uniquePallets: Array.from(new Set(transformedRecords.map(r => r.plt_num).filter(Boolean)))
            .length,
          timeSpan:
            transformedRecords.length > 0
              ? {
                  start: new Date(
                    Math.min(...transformedRecords.map(r => new Date(r.time).getTime()))
                  ).toISOString(),
                  end: new Date(
                    Math.max(...transformedRecords.map(r => new Date(r.time).getTime()))
                  ).toISOString(),
                  durationHours:
                    (Math.max(...transformedRecords.map(r => new Date(r.time).getTime())) -
                      Math.min(...transformedRecords.map(r => new Date(r.time).getTime()))) /
                    (1000 * 60 * 60),
                }
              : {
                  start: new Date().toISOString(),
                  end: new Date().toISOString(),
                  durationHours: 0,
                },
          topOperators: [], // TODO: Implement detailed operator statistics
          topActions: [], // TODO: Implement detailed action statistics
          efficiencyMetrics: {
            averageOperationsPerMinute: 0, // TODO: Calculate
            fastestOperator: {
              operatorId: 0,
              operatorName: '',
              operationsPerMinute: 0,
              totalOperations: 0,
            },
            slowestOperator: {
              operatorId: 0,
              operatorName: '',
              operationsPerMinute: 0,
              totalOperations: 0,
            },
            peakHour: 0, // TODO: Calculate
            quietHour: 0, // TODO: Calculate
          },
          mergingStats: {
            totalOriginalRecords: transformedRecords.length,
            totalMergedGroups: totalCount,
            compressionRatio:
              transformedRecords.length > 0 ? totalCount / transformedRecords.length : 1,
            averageGroupSize: totalCount > 0 ? transformedRecords.length / totalCount : 0,
            largestGroupSize: Math.max(...mergedGroups.map(g => g.records.length), 0),
            sequentialGroups: mergedGroups.filter(g => calculateEfficiencyMetrics(g).isSequential)
              .length,
          },
        };

        const queryTime = Date.now() - _startTime;

        return {
          mergedRecords,
          totalCount,
          hasNextPage: end < totalCount,
          hasPreviousPage: start > 0,
          nextCursor: end < totalCount ? Buffer.from(`${end}`).toString('base64') : null,
          previousCursor:
            start > 0
              ? Buffer.from(`${Math.max(0, start - pagination.limit)}`).toString('base64')
              : null,
          summary,
          queryTime,
          cacheHit: false,
          appliedFilters: filters,
          pagination,
          sorting,
          mergingConfig,
        };
      } catch (error) {
        console.error('[RecordHistory] Query error:', error);
        throw new Error(
          `Failed to fetch record history: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },

    /**
     * Get raw records without merging
     */
    rawRecordHistory: async (_parent, args, context: GraphQLContext) => {
      try {
        const { filters = {}, pagination = { limit: 50, offset: 0 } } = args;

        const { query, params } = buildRecordHistoryQuery(filters);
        const finalQuery = `${query} ORDER BY rh.time DESC LIMIT ${pagination.limit} OFFSET ${pagination.offset}`;

        const { data, error } = await context.supabase.rpc('execute_sql', {
          query: finalQuery,
          params,
        });

        if (error) throw error;

        return data.map((record: SqlQueryRecord) => ({
          id: record.uuid,
          time: record.time,
          operatorId: record.id_operator,
          operatorName: record.operator_name,
          operatorDepartment: record.operator_department,
          operatorPosition: record.operator_position,
          operatorEmail: record.operator_email,
          action: record.action,
          pltNum: record.plt_num,
          location: record.loc,
          remark: record.remark,
          uuid: record.uuid,
        }));
      } catch (error) {
        console.error('[RawRecordHistory] Query error:', error);
        throw new Error(
          `Failed to fetch raw record history: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },

    /**
     * Search suggestions for autocomplete
     */
    recordHistorySearchSuggestions: async (_parent, args, context: GraphQLContext) => {
      try {
        const { field, query: searchQuery, limit = 10 } = args;

        let column: string;
        let table = 'record_history rh';
        let joinClause = '';

        switch (field) {
          case 'operator':
            column = 'di.name';
            joinClause = 'LEFT JOIN data_id di ON rh.id = di.id';
            break;
          case 'action':
            column = 'rh.action';
            break;
          case 'pallet':
            column = 'rh.plt_num';
            break;
          case 'location':
            column = 'rh.loc';
            break;
          default:
            throw new Error(`Invalid field: ${field}`);
        }

        const sqlQuery = `
          SELECT DISTINCT ${column} as suggestion
          FROM ${table}
          ${joinClause}
          WHERE ${column} ILIKE $1 AND ${column} IS NOT NULL
          ORDER BY ${column}
          LIMIT $2
        `;

        const { data, error } = await context.supabase.rpc('execute_sql', {
          query: sqlQuery,
          params: [`%${searchQuery}%`, limit],
        });

        if (error) throw error;

        return data.map((row: { suggestion: string }) => row.suggestion).filter(Boolean);
      } catch (error) {
        console.error('[SearchSuggestions] Error:', error);
        throw new Error(
          `Failed to fetch suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },
  },

  Mutation: {
    /**
     * Create new record history entry
     */
    createRecordHistoryEntry: async (_parent, args, context: GraphQLContext) => {
      try {
        const { input } = args;
        const timestamp = input.timestamp || new Date().toISOString();

        const { data, error } = await context.supabase
          .from('record_history')
          .insert({
            time: timestamp,
            id: input.operatorId,
            action: input.action,
            plt_num: input.pltNum,
            loc: input.location,
            remark: input.remark || '',
          })
          .select()
          .single();

        if (error) throw error;

        // Clear cache
        if (context.loaders.recordHistory) {
          context.loaders.recordHistory.clearAll();
        }

        return {
          id: data.uuid,
          time: data.time,
          operatorId: data.id,
          action: data.action,
          pltNum: data.plt_num,
          location: data.loc,
          remark: data.remark,
          uuid: data.uuid,
        };
      } catch (error) {
        console.error('[CreateRecordHistory] Error:', error);
        throw new Error(
          `Failed to create record history entry: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },

    /**
     * Clear record history cache
     */
    clearRecordHistoryCache: async (_parent, _args, context: GraphQLContext) => {
      try {
        if (context.loaders.recordHistory) {
          context.loaders.recordHistory.clearAll();
        }
        return true;
      } catch (error) {
        console.error('[ClearCache] Error:', error);
        return false;
      }
    },
  },
};
