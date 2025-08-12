/**
 * GraphQL Schema for Department Cards
 * Enhanced with pagination, filtering, and query complexity analysis
 */

export const departmentTypeDefs = `
  # Pagination Support - Cursor-based pagination
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # Generic Connection Interface
  interface Connection {
    pageInfo: PageInfo!
    totalCount: Int!
  }

  # Pagination Input
  input PaginationInput {
    first: Int
    after: String
    last: Int
    before: String
  }

  # Stock Filter Input
  input StockFilterInput {
    stockCodePattern: String
    descriptionPattern: String
    minLevel: Int
    maxLevel: Int
    productTypes: [String!]
    updatedAfter: String
    updatedBefore: String
  }

  # Sort Options
  enum StockSortField {
    STOCK_CODE
    DESCRIPTION
    STOCK_LEVEL
    UPDATE_TIME
  }

  enum SortDirection {
    ASC
    DESC
  }

  input StockSortInput {
    field: StockSortField!
    direction: SortDirection!
  }

  # Department Statistics
  type DepartmentStats {
    todayFinished: Int
    todayTransferred: Int
    past7Days: Int!
    past14Days: Int!
    lastUpdated: String!
    # Query complexity: 1
  }

  # Enhanced Stock Item with additional fields
  type StockItem {
    stock: String!
    description: String
    stockLevel: Int!
    updateTime: String!
    type: String
    # New fields from stock_level table
    realTimeLevel: Int
    lastStockUpdate: String
    # Query complexity: 2
  }

  # Stock Item Connection for pagination
  type StockItemConnection implements Connection {
    edges: [StockItemEdge!]!
    nodes: [StockItem!]!
    pageInfo: PageInfo!
    totalCount: Int!
    # Query complexity: 3
  }

  type StockItemEdge {
    node: StockItem!
    cursor: String!
  }

  # Enhanced Machine State
  type MachineState {
    machineNumber: String!
    lastActiveTime: String
    state: MachineStatus!
    # New fields for better monitoring
    efficiency: Float
    currentTask: String
    nextMaintenance: String
    # Query complexity: 2
  }

  enum MachineStatus {
    ACTIVE
    IDLE
    MAINTENANCE
    OFFLINE
    UNKNOWN
  }

  # Recent Activity (for Warehouse)
  type RecentActivity {
    time: String!
    staff: String!
    action: String!
    detail: String!
    # Query complexity: 1
  }

  # Order Completion (for Warehouse)
  type OrderCompletion {
    orderRef: String!
    productQty: Int!
    loadedQty: Int!
    completionPercentage: Int!
    latestUpdate: String
    hasPdf: Boolean!
    docUrl: String
    # Query complexity: 2
  }

  # Order Detail
  type OrderDetail {
    actionTime: String!
    palletNum: String!
    description: String!
    productQty: Int!
    loadedBy: String!
    # Query complexity: 1
  }

  # Enhanced Injection Department Data
  type DepartmentInjectionData {
    stats: DepartmentStats!
    topStocks: StockItemConnection!
    materialStocks: StockItemConnection!
    machineStates: [MachineState!]!
    loading: Boolean!
    error: String
    # Query complexity: 10
  }

  # Enhanced Pipe Department Data with better filtering
  type DepartmentPipeData {
    stats: DepartmentStats!
    topStocks: StockItemConnection!
    materialStocks: StockItemConnection!
    machineStates: [MachineState!]!
    loading: Boolean!
    error: String
    # Performance metrics for pipes
    pipeProductionRate: Float
    materialConsumptionRate: Float
    # Query complexity: 12
  }

  # Enhanced Warehouse Department Data
  type DepartmentWarehouseData {
    stats: DepartmentStats!
    topStocks: StockItemConnection!
    materialStocks: StockItemConnection!
    recentActivities: [RecentActivity!]!
    orderCompletions: [OrderCompletion!]!
    loading: Boolean!
    error: String
    # Query complexity: 15
  }

  extend type Query {
    # Basic department queries (backward compatibility)
    departmentInjectionData: DepartmentInjectionData!
    departmentPipeData: DepartmentPipeData!
    departmentWarehouseData: DepartmentWarehouseData!

    # Enhanced queries with pagination and filtering
    departmentPipeDataAdvanced(
      stockPagination: PaginationInput
      stockFilter: StockFilterInput
      stockSort: StockSortInput
      materialPagination: PaginationInput
      materialFilter: StockFilterInput
      materialSort: StockSortInput
    ): DepartmentPipeData!
    # Query complexity: 15

    # Real-time stock levels from stock_level table
    realTimeStockLevels(
      pagination: PaginationInput
      filter: StockFilterInput
      sort: StockSortInput
    ): StockItemConnection!
    # Query complexity: 8

    # Machine status with real-time data
    machineStatusRealTime(
      departmentType: String!
    ): [MachineState!]!
    # Query complexity: 5
  }

`;