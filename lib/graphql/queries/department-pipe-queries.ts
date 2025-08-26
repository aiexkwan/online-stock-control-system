/**
 * GraphQL Queries for DepartPipeCard
 * Client-side query examples using the enhanced GraphQL architecture
 */

import { gql } from '@apollo/client';

// Basic department pipe data query (backward compatible)
export const DEPARTMENT_PIPE_DATA_QUERY = gql`
  query GetDepartmentPipeData {
    departmentPipeData {
      stats {
        todayFinished
        past7Days
        past14Days
        lastUpdated
      }
      topStocks {
        nodes {
          stock
          description
          stockLevel
          updateTime
          type
          realTimeLevel
          lastStockUpdate
        }
        totalCount
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
      materialStocks {
        nodes {
          stock
          description
          stockLevel
          updateTime
          type
          realTimeLevel
          lastStockUpdate
        }
        totalCount
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
      machineStates {
        machineNumber
        lastActiveTime
        state
        efficiency
        currentTask
        nextMaintenance
      }
      pipeProductionRate
      materialConsumptionRate
      loading
      error
    }
  }
`;

// Advanced department pipe data query with pagination and filtering
export const DEPARTMENT_PIPE_DATA_ADVANCED_QUERY = gql`
  query GetDepartmentPipeDataAdvanced(
    $stockPagination: PaginationInput
    $stockFilter: StockFilterInput
    $stockSort: StockSortInput
    $materialPagination: PaginationInput
    $materialFilter: StockFilterInput
    $materialSort: StockSortInput
  ) {
    departmentPipeDataAdvanced(
      stockPagination: $stockPagination
      stockFilter: $stockFilter
      stockSort: $stockSort
      materialPagination: $materialPagination
      materialFilter: $materialFilter
      materialSort: $materialSort
    ) {
      stats {
        todayFinished
        past7Days
        past14Days
        lastUpdated
      }
      topStocks {
        nodes {
          stock
          description
          stockLevel
          updateTime
          type
          realTimeLevel
          lastStockUpdate
        }
        totalCount
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
      materialStocks {
        nodes {
          stock
          description
          stockLevel
          updateTime
          type
          realTimeLevel
          lastStockUpdate
        }
        totalCount
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
      machineStates {
        machineNumber
        lastActiveTime
        state
        efficiency
        currentTask
        nextMaintenance
      }
      pipeProductionRate
      materialConsumptionRate
      loading
      error
    }
  }
`;

// Real-time stock levels query
export const REAL_TIME_STOCK_LEVELS_QUERY = gql`
  query GetRealTimeStockLevels(
    $pagination: PaginationInput
    $filter: StockFilterInput
    $sort: StockSortInput
  ) {
    realTimeStockLevels(pagination: $pagination, filter: $filter, sort: $sort) {
      nodes {
        stock
        description
        stockLevel
        updateTime
        type
        realTimeLevel
        lastStockUpdate
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

// Machine status real-time query
export const MACHINE_STATUS_REAL_TIME_QUERY = gql`
  query GetMachineStatusRealTime($departmentType: String!) {
    machineStatusRealTime(departmentType: $departmentType) {
      machineNumber
      lastActiveTime
      state
      efficiency
      currentTask
      nextMaintenance
    }
  }
`;

// Subscriptions removed - using polling strategy instead
// DepartPipeCard uses pollInterval for data refresh

// Query fragments for code reuse
export const STOCK_ITEM_FRAGMENT = gql`
  fragment StockItemFields on StockItem {
    stock
    description
    stockLevel
    updateTime
    type
    realTimeLevel
    lastStockUpdate
  }
`;

export const STOCK_ITEM_CONNECTION_FRAGMENT = gql`
  fragment StockItemConnectionFields on StockItemConnection {
    nodes {
      ...StockItemFields
    }
    totalCount
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
  ${STOCK_ITEM_FRAGMENT}
`;

export const MACHINE_STATE_FRAGMENT = gql`
  fragment MachineStateFields on MachineState {
    machineNumber
    lastActiveTime
    state
    efficiency
    currentTask
    nextMaintenance
  }
`;

export const DEPARTMENT_STATS_FRAGMENT = gql`
  fragment DepartmentStatsFields on DepartmentStats {
    todayFinished
    todayTransferred
    past7Days
    past14Days
    lastUpdated
  }
`;

// Optimized query using fragments
export const DEPARTMENT_PIPE_DATA_WITH_FRAGMENTS = gql`
  query GetDepartmentPipeDataOptimized {
    departmentPipeData {
      stats {
        ...DepartmentStatsFields
      }
      topStocks {
        ...StockItemConnectionFields
      }
      materialStocks {
        ...StockItemConnectionFields
      }
      machineStates {
        ...MachineStateFields
      }
      pipeProductionRate
      materialConsumptionRate
      loading
      error
    }
  }
  ${DEPARTMENT_STATS_FRAGMENT}
  ${STOCK_ITEM_CONNECTION_FRAGMENT}
  ${MACHINE_STATE_FRAGMENT}
`;

// TypeScript interfaces for query variables
export interface PaginationInput {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

export interface StockFilterInput {
  stockCodePattern?: string;
  descriptionPattern?: string;
  minLevel?: number;
  maxLevel?: number;
  productTypes?: string[];
  updatedAfter?: string;
  updatedBefore?: string;
}

export interface StockSortInput {
  field: 'STOCK_CODE' | 'DESCRIPTION' | 'STOCK_LEVEL' | 'UPDATE_TIME';
  direction: 'ASC' | 'DESC';
}

export interface DepartmentPipeDataAdvancedVariables {
  stockPagination?: PaginationInput;
  stockFilter?: StockFilterInput;
  stockSort?: StockSortInput;
  materialPagination?: PaginationInput;
  materialFilter?: StockFilterInput;
  materialSort?: StockSortInput;
}

export interface RealTimeStockLevelsVariables {
  pagination?: PaginationInput;
  filter?: StockFilterInput;
  sort?: StockSortInput;
}

export interface MachineStatusRealTimeVariables {
  departmentType: string;
}

// Example usage with Apollo Client hooks
export const QUERY_EXAMPLES = {
  // Basic usage
  basic: {
    query: DEPARTMENT_PIPE_DATA_QUERY,
    variables: {},
  },

  // Advanced usage with pagination
  withPagination: {
    query: DEPARTMENT_PIPE_DATA_ADVANCED_QUERY,
    variables: {
      stockPagination: { first: 10 },
      stockFilter: { productTypes: ['Pipe'] },
      stockSort: { field: 'STOCK_LEVEL', direction: 'DESC' },
      materialPagination: { first: 5 },
      materialFilter: { productTypes: ['Material'] },
      materialSort: { field: 'UPDATE_TIME', direction: 'DESC' },
    } as DepartmentPipeDataAdvancedVariables,
  },

  // Real-time stock levels
  realTimeStocks: {
    query: REAL_TIME_STOCK_LEVELS_QUERY,
    variables: {
      pagination: { first: 20 },
      filter: { minLevel: 0 },
      sort: { field: 'STOCK_LEVEL', direction: 'DESC' },
    } as RealTimeStockLevelsVariables,
  },

  // Machine status for pipe department
  machineStatus: {
    query: MACHINE_STATUS_REAL_TIME_QUERY,
    variables: {
      departmentType: 'PIPE',
    } as MachineStatusRealTimeVariables,
  },
};

// Apollo Client options for different query types
export const APOLLO_CLIENT_OPTIONS = {
  // For frequently updated data
  realTime: {
    fetchPolicy: 'cache-and-network' as const,
    pollInterval: 30000, // 30 seconds
    notifyOnNetworkStatusChange: true,
  },

  // For static reference data
  static: {
    fetchPolicy: 'cache-first' as const,
    pollInterval: 300000, // 5 minutes
  },

  // For one-time queries
  oneTime: {
    fetchPolicy: 'network-only' as const,
  },
};
