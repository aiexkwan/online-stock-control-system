/**
 * Record History GraphQL Queries
 * Client-side queries for VerticalTimelineCard component
 */

import { gql } from '@apollo/client';

// Main query for merged record history with intelligent grouping
export const GET_RECORD_HISTORY = gql`
  query GetRecordHistory(
    $filters: RecordHistoryFilters
    $pagination: RecordHistoryPagination
    $sorting: RecordHistorySort
    $mergingConfig: MergingConfig
  ) {
    recordHistory(
      filters: $filters
      pagination: $pagination
      sorting: $sorting
      mergingConfig: $mergingConfig
    ) {
      mergedRecords {
        id
        operatorId
        operatorName
        operatorDepartment
        operatorPosition
        operatorEmail
        action
        count
        palletNumbers
        timeStart
        timeEnd
        remark
        duration
        efficiency
        locations
        isSequential
        averageTimeBetweenOps
      }
      totalCount
      hasNextPage
      hasPreviousPage
      nextCursor
      previousCursor

      summary {
        totalOperations
        totalMergedRecords
        uniqueOperators
        uniqueActions
        uniqueLocations
        uniquePallets

        timeSpan {
          start
          end
          durationHours
        }

        topOperators {
          operatorId
          operatorName
          operationCount
          percentage
          avgEfficiency
        }

        topActions {
          action
          count
          percentage
          avgDuration
        }

        efficiencyMetrics {
          averageOperationsPerMinute
          fastestOperator {
            operatorId
            operatorName
            operationsPerMinute
            totalOperations
          }
          slowestOperator {
            operatorId
            operatorName
            operationsPerMinute
            totalOperations
          }
          peakHour
          quietHour
        }

        mergingStats {
          totalOriginalRecords
          totalMergedGroups
          compressionRatio
          averageGroupSize
          largestGroupSize
          sequentialGroups
        }
      }

      queryTime
      cacheHit

      appliedFilters {
        operatorId
        operatorName
        action
        pltNum
        location
        dateRange {
          start
          end
        }
        searchTerm
        departments
        positions
        actions
        palletNumbers
        locations
        hasMultipleOperations
      }

      pagination {
        limit
        offset
        cursor
      }

      sorting {
        field
        direction
      }

      mergingConfig {
        timeWindowMinutes
        sameOperatorOnly
        sameActionOnly
        minOperationsToMerge
        maxOperationsPerGroup
        includeSequentialAnalysis
        groupByLocation
      }
    }
  }
`;

// Query for raw record history without merging
export const GET_RAW_RECORD_HISTORY = gql`
  query GetRawRecordHistory(
    $filters: RecordHistoryFilters
    $pagination: RecordHistoryPagination
    $sorting: RecordHistorySort
  ) {
    rawRecordHistory(filters: $filters, pagination: $pagination, sorting: $sorting) {
      id
      time
      operatorId
      operatorName
      operatorDepartment
      operatorPosition
      operatorEmail
      action
      pltNum
      location
      remark
      uuid
    }
  }
`;

// Query for search suggestions (autocomplete)
export const GET_RECORD_HISTORY_SUGGESTIONS = gql`
  query GetRecordHistorySearchSuggestions($field: String!, $query: String!, $limit: Int = 10) {
    recordHistorySearchSuggestions(field: $field, query: $query, limit: $limit)
  }
`;

// Query for operator activity summary
export const GET_OPERATOR_ACTIVITY = gql`
  query GetOperatorActivity($operatorIds: [Int!], $dateRange: DateRangeInput!) {
    operatorActivity(operatorIds: $operatorIds, dateRange: $dateRange) {
      operatorId
      operatorName
      operationCount
      percentage
      avgEfficiency
    }
  }
`;

// Query for trends and analytics
export const GET_RECORD_HISTORY_TRENDS = gql`
  query GetRecordHistoryTrends(
    $filters: RecordHistoryFilters
    $timeGranularity: TimeGranularity = HOUR
  ) {
    recordHistoryTrends(filters: $filters, timeGranularity: $timeGranularity) {
      hourlyDistribution {
        hour
        operationCount
        uniqueOperators
        avgEfficiency
      }

      dailyDistribution {
        date
        operationCount
        uniqueOperators
        avgEfficiency
        peakHour
      }

      operatorTrends {
        operatorId
        operatorName
        trend {
          timestamp
          value
          label
        }
        totalGrowth
      }

      actionTrends {
        action
        trend {
          timestamp
          value
          label
        }
        totalGrowth
      }

      efficiencyTrends {
        timestamp
        avgOperationsPerMinute
        activeOperators
      }
    }
  }
`;

// Query for single merged record details
export const GET_MERGED_RECORD = gql`
  query GetMergedRecord($id: ID!) {
    mergedRecord(id: $id) {
      id
      operatorId
      operatorName
      operatorDepartment
      operatorPosition
      operatorEmail
      action
      count
      palletNumbers
      timeStart
      timeEnd
      remark
      duration
      efficiency
      locations
      isSequential
      averageTimeBetweenOps
    }
  }
`;

// Mutation for creating new record history entry
export const CREATE_RECORD_HISTORY_ENTRY = gql`
  mutation CreateRecordHistoryEntry($input: CreateRecordHistoryInput!) {
    createRecordHistoryEntry(input: $input) {
      id
      time
      operatorId
      action
      pltNum
      location
      remark
      uuid
    }
  }
`;

// Mutation for bulk creating record history entries
export const BULK_CREATE_RECORD_HISTORY = gql`
  mutation BulkCreateRecordHistory($entries: [CreateRecordHistoryInput!]!) {
    bulkCreateRecordHistory(entries: $entries) {
      success
      failed
      errors {
        message
        code
        field
      }
    }
  }
`;

// Mutation for exporting record history data
export const EXPORT_RECORD_HISTORY = gql`
  mutation ExportRecordHistory($input: RecordHistoryExportInput!) {
    exportRecordHistory(input: $input) {
      downloadUrl
      fileName
      fileSize
      recordCount
      expiresAt
    }
  }
`;

// Mutation for updating merging configuration
export const UPDATE_MERGING_CONFIG = gql`
  mutation UpdateMergingConfig($config: MergingConfig!) {
    updateMergingConfig(config: $config)
  }
`;

// Mutation for clearing cache
export const CLEAR_RECORD_HISTORY_CACHE = gql`
  mutation ClearRecordHistoryCache {
    clearRecordHistoryCache
  }
`;

// Subscription for real-time record history updates
export const RECORD_HISTORY_UPDATED = gql`
  subscription RecordHistoryUpdated(
    $operatorIds: [Int!]
    $actions: [String!]
    $locations: [String!]
  ) {
    recordHistoryUpdated(operatorIds: $operatorIds, actions: $actions, locations: $locations) {
      type
      record {
        id
        time
        operatorId
        action
        pltNum
        location
        remark
        uuid
      }
      affectedMergedRecord {
        id
        operatorId
        operatorName
        action
        count
        palletNumbers
        timeStart
        timeEnd
        remark
        duration
        efficiency
        locations
        isSequential
        averageTimeBetweenOps
      }
      operatorId
      timestamp
    }
  }
`;

// Subscription for operator activity alerts
export const OPERATOR_ACTIVITY_ALERT = gql`
  subscription OperatorActivityAlert(
    $operatorIds: [Int!]
    $thresholdOperationsPerMinute: Float = 10.0
  ) {
    operatorActivityAlert(
      operatorIds: $operatorIds
      thresholdOperationsPerMinute: $thresholdOperationsPerMinute
    ) {
      operatorId
      operatorName
      operationsPerMinute
      totalOperations
    }
  }
`;

// Subscription for high-frequency operation alerts
export const HIGH_FREQUENCY_ALERT = gql`
  subscription HighFrequencyAlert($timeWindowMinutes: Int = 1, $minOperationsPerWindow: Int = 20) {
    highFrequencyAlert(
      timeWindowMinutes: $timeWindowMinutes
      minOperationsPerWindow: $minOperationsPerWindow
    ) {
      id
      operatorId
      operatorName
      action
      count
      palletNumbers
      timeStart
      timeEnd
      remark
      duration
      efficiency
      locations
      isSequential
      averageTimeBetweenOps
    }
  }
`;

// Fragment definitions for reusability
export const MERGED_RECORD_FRAGMENT = gql`
  fragment MergedRecordFields on MergedRecordHistory {
    id
    operatorId
    operatorName
    operatorDepartment
    operatorPosition
    operatorEmail
    action
    count
    palletNumbers
    timeStart
    timeEnd
    remark
    duration
    efficiency
    locations
    isSequential
    averageTimeBetweenOps
  }
`;

export const RAW_RECORD_FRAGMENT = gql`
  fragment RawRecordFields on RecordHistoryEntry {
    id
    time
    operatorId
    operatorName
    operatorDepartment
    operatorPosition
    operatorEmail
    action
    pltNum
    location
    remark
    uuid
  }
`;

export const SUMMARY_FRAGMENT = gql`
  fragment RecordHistorySummaryFields on RecordHistorySummary {
    totalOperations
    totalMergedRecords
    uniqueOperators
    uniqueActions
    uniqueLocations
    uniquePallets

    timeSpan {
      start
      end
      durationHours
    }

    topOperators {
      operatorId
      operatorName
      operationCount
      percentage
      avgEfficiency
    }

    topActions {
      action
      count
      percentage
      avgDuration
    }

    efficiencyMetrics {
      averageOperationsPerMinute
      fastestOperator {
        operatorId
        operatorName
        operationsPerMinute
        totalOperations
      }
      slowestOperator {
        operatorId
        operatorName
        operationsPerMinute
        totalOperations
      }
      peakHour
      quietHour
    }

    mergingStats {
      totalOriginalRecords
      totalMergedGroups
      compressionRatio
      averageGroupSize
      largestGroupSize
      sequentialGroups
    }
  }
`;

// TypeScript type definitions for better type safety
export interface RecordHistoryFilters {
  operatorId?: number;
  operatorName?: string;
  operatorEmail?: string;
  action?: string;
  pltNum?: string;
  location?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
  searchTerm?: string;
  departments?: string[];
  positions?: string[];
  actions?: string[];
  palletNumbers?: string[];
  locations?: string[];
  minDuration?: number;
  maxDuration?: number;
  hasMultipleOperations?: boolean;
}

export interface RecordHistoryPagination {
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface RecordHistorySort {
  field?:
    | 'TIME_START'
    | 'TIME_END'
    | 'OPERATOR_NAME'
    | 'ACTION'
    | 'COUNT'
    | 'DURATION'
    | 'EFFICIENCY'
    | 'PALLET_COUNT';
  direction?: 'ASC' | 'DESC';
}

export interface MergingConfig {
  timeWindowMinutes?: number;
  sameOperatorOnly?: boolean;
  sameActionOnly?: boolean;
  minOperationsToMerge?: number;
  maxOperationsPerGroup?: number;
  includeSequentialAnalysis?: boolean;
  groupByLocation?: boolean;
}

export interface MergedRecordHistory {
  id: string;
  operatorId: number;
  operatorName: string;
  operatorDepartment?: string;
  operatorPosition?: string;
  operatorEmail?: string;
  action: string;
  count: number;
  palletNumbers: string[];
  timeStart: string;
  timeEnd: string;
  remark: string;
  duration: number;
  efficiency: number;
  locations: string[];
  isSequential: boolean;
  averageTimeBetweenOps: number;
}

export interface RecordHistoryEntry {
  id: string;
  time: string;
  operatorId?: number;
  operatorName?: string;
  operatorDepartment?: string;
  operatorPosition?: string;
  operatorEmail?: string;
  action: string;
  pltNum?: string;
  location?: string;
  remark: string;
  uuid: string;
}

// Default values for easier use
export const DEFAULT_PAGINATION: RecordHistoryPagination = {
  limit: 10,
  offset: 0,
};

export const DEFAULT_SORT: RecordHistorySort = {
  field: 'TIME_START',
  direction: 'DESC',
};

export const DEFAULT_MERGING_CONFIG: MergingConfig = {
  timeWindowMinutes: 5,
  sameOperatorOnly: true,
  sameActionOnly: true,
  minOperationsToMerge: 2,
  maxOperationsPerGroup: 50,
  includeSequentialAnalysis: true,
  groupByLocation: false,
};
