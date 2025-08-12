export const inventoryTypeDefs = `
  # 庫存項目類型
  type StockItem {
    productCode: String!
    productDesc: String!
    warehouse: String!
    location: String!
    quantity: Int!
    value: Float!
    lastUpdated: DateTime!
    palletCount: Int!
  }

  # 庫存聚合統計
  type StockAggregates {
    totalQuantity: Int!
    totalValue: Float!
    totalPallets: Int!
    uniqueProducts: Int!
  }

  # 庫存等級響應
  type StockLevelsResponse {
    items: [StockItem!]!
    total: Int!
    aggregates: StockAggregates!
  }

  # 庫存查詢篩選器
  input StockLevelsFilter {
    warehouse: String
    productCode: String
    minQty: Int
    maxQty: Int
    includeZeroStock: Boolean
  }

  # 庫存排序選項
  enum StockSortBy {
    QUANTITY
    VALUE
    LOCATION
    PRODUCT_CODE
  }

  # 庫存查詢輸入
  input StockLevelsInput {
    filter: StockLevelsFilter
    sortBy: StockSortBy
    limit: Int = 50
    offset: Int = 0
  }

  # 托盤信息類型
  type PalletInfo {
    plt_num: String!
    product_code: String!
    product_qty: Int!
    generate_time: DateTime!
    series: String
    f_loc: String
    qc_status: String
  }

  # 庫存轉移類型
  type StockTransfer {
    id: ID!
    productCode: String!
    productDesc: String!
    quantity: Int!
    fromLocation: String!
    toLocation: String!
    status: TransferStatus!
    createdBy: String!
    createdAt: DateTime!
    completedAt: DateTime
    notes: String
    pallet_number: String
    # 新增: 關聯的托盤信息
    pallet: PalletInfo
  }

  # 轉移狀態枚舉
  enum TransferStatus {
    PENDING
    IN_PROGRESS
    COMPLETED
    CANCELLED
  }

  # 創建轉移輸入
  input CreateTransferInput {
    productCode: String!
    quantity: Int!
    fromLocation: String!
    toLocation: String!
    notes: String
  }

  # 轉移響應
  type TransferResponse {
    success: Boolean!
    transfer: StockTransfer
    message: String
  }

  # 批量轉移輸入
  input BatchTransferItem {
    productCode: String!
    quantity: Int!
    fromLocation: String!
    toLocation: String!
  }

  # 批量轉移響應
  type BatchTransferResponse {
    success: Boolean!
    successCount: Int!
    failureCount: Int!
    transfers: [StockTransfer!]!
    errors: [String!]
  }

  # InventoryAnalysis Types
  input InventoryAnalysisInput {
    productCodes: [String!]
    productType: String
    filters: InventoryAnalysisFiltersInput
    sorting: InventoryAnalysisSortInput
    pagination: PaginationInput
  }

  input InventoryAnalysisFiltersInput {
    warehouse: String
    category: String
    minQuantity: Int
    maxQuantity: Int
    includeZeroStock: Boolean
    dateRange: DateRangeInput
  }

  input InventoryAnalysisSortInput {
    sortBy: InventoryAnalysisSortField
    direction: SortDirection
  }

  enum InventoryAnalysisSortField {
    PRODUCT_CODE
    QUANTITY
    VALUE
    MOVEMENT
    LAST_ACTIVITY
  }

  enum SortDirection {
    ASC
    DESC
  }

  input PaginationInput {
    first: Int
    after: String
    offset: Int
  }


  type InventoryAnalysisResult {
    products: InventoryAnalysisProductConnection!
    aggregation: InventoryAnalysisAggregation!
    metadata: AnalysisMetadata!
    lastUpdated: DateTime!
    refreshInterval: Int!
    dataSource: String!
  }

  type InventoryAnalysisProductConnection {
    edges: [InventoryAnalysisProductEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type InventoryAnalysisProductEdge {
    cursor: String!
    node: InventoryAnalysisProduct!
  }

  type InventoryAnalysisProduct {
    productCode: String!
    productName: String!
    category: String
    quantity: Int!
    value: Float!
    movement: Int!
    lastActivity: DateTime
    warehouse: String!
    location: String
    palletCount: Int!
    unitPrice: Float
    averageMovement: Float
    turnoverRate: Float
    stockStatus: StockStatus!
  }

  enum StockStatus {
    IN_STOCK
    LOW_STOCK
    OUT_OF_STOCK
    OVERSTOCK
  }

  type InventoryAnalysisAggregation {
    totalProducts: Int!
    totalQuantity: Int!
    totalValue: Float!
    totalPallets: Int!
    categoryBreakdown: [CategoryBreakdown!]!
    warehouseBreakdown: [WarehouseBreakdown!]!
    movementSummary: MovementSummary!
  }

  type CategoryBreakdown {
    category: String!
    productCount: Int!
    totalQuantity: Int!
    totalValue: Float!
    percentage: Float!
  }

  type WarehouseBreakdown {
    warehouse: String!
    productCount: Int!
    totalQuantity: Int!
    totalValue: Float!
    percentage: Float!
  }

  type MovementSummary {
    fastMoving: Int!
    slowMoving: Int!
    noMovement: Int!
    averageTurnover: Float!
  }

  type AnalysisMetadata {
    requestId: String!
    executionTimeMs: Int!
    queryComplexity: Int!
    dataFreshness: DateTime!
    cacheStatus: CacheStatus!
  }

  enum CacheStatus {
    HIT
    MISS
    PARTIAL
    REFRESH
  }


  # P0 Charts - Phase 2 Migration Types
  type ProductInventoryData {
    productCode: String!
    productName: String!
    description: String
    colour: String
    totalQuantity: Int!
    stockBreakdown: ProductStockBreakdown!
    lastUpdated: DateTime!
    # 新增：歷史趨勢數據
    trend: InventoryTrend
  }

  type ProductStockBreakdown {
    await: Int!
    bulk: Int!
    fold: Int!
    damage: Int!
    injection: Int!
    pipeline: Int!
    prebook: Int!
    backcarpark: Int!
    other: Int!
  }

  type InventoryTrend {
    last7Days: [Int!]!
    last30Days: [Int!]!
    changeRate: Float!
  }
  
  # InventoryTurnoverAnalysis Types
  type InventoryTurnoverData {
    productCode: String!
    productName: String!
    inventory: Int!
    demand: Int!
    turnoverRatio: Float!
    status: TurnoverStatus!
    lastOrderDate: DateTime
    averageDailyDemand: Float
  }
  
  enum TurnoverStatus {
    HIGH_DEMAND
    BALANCED
    OVERSTOCKED
    NO_DEMAND
  }

  # StocktakeAccuracyTrend Types
  type StocktakeAccuracyData {
    date: String!
    fullDate: String!
    accuracy: Float!
    counted: Int!
    expected: Int!
    discrepancy: Int!
    products: Int!
    scannedItems: Int!
    discrepancyCount: Int!
    period: String!
  }

  type StocktakeAccuracyTrend {
    data: [StocktakeAccuracyData!]!
    averageAccuracy: Float!
    trend: Float!
    summary: StocktakeAccuracySummary!
    lastUpdated: DateTime!
    dataSource: String!
    refreshInterval: Int!
  }

  type StocktakeAccuracySummary {
    daysAtTarget: Int! # Days meeting ≥95%
    daysNearTarget: Int! # Days at 90-94%
    daysNeedImprovement: Int! # Days <90%
    totalDays: Int!
    targetRate: Float! # 95%
  }

  # RealTimeInventoryMap Types
  type LocationInventoryData {
    locationKey: String!
    locationName: String!
    totalQuantity: Int!
    uniqueProducts: Int!
    utilization: Float!
    density: InventoryDensity!
    lastUpdated: DateTime!
  }

  enum InventoryDensity {
    EMPTY
    NORMAL
    HIGH
    CROWDED
  }

  type RealTimeInventoryMap {
    locations: [LocationInventoryData!]!
    totalInventory: Int!
    totalProducts: Int!
    maxLocationInventory: Int!
    summary: InventoryMapSummary!
    lastUpdated: DateTime!
    refreshInterval: Int!
    dataSource: String!
  }

  type InventoryMapSummary {
    emptyLocations: Int!
    normalLocations: Int!
    highLocations: Int!
    crowdedLocations: Int!
    totalLocations: Int!
    averageUtilization: Float!
  }

  # P2 Component - StockTypeSelectorCard Types
  type StockByTypeData {
    stock: String! # product_code
    description: String
    type: String
    stock_level: Int!
    colour: String
    warehouse: String
    last_updated: DateTime!
  }

  type ProductTypeData {
    type: String!
    productCount: Int!
    totalStock: Int!
  }

  # P2 Component - TransferTimeDistributionCard Types
  type TransferTimeSlot {
    time: String!         # Hour label (e.g., "08:00")
    value: Int!           # Number of transfers
    fullTime: String!     # Full timestamp
  }

  type TransferTimeDistribution {
    timeSlots: [TransferTimeSlot!]!
    totalTransfers: Int!
    peakHour: String
    startDate: DateTime!
    endDate: DateTime!
  }

  # P2 Component - TopProductsDistributionCard Types
  type ProductDistributionItem {
    productCode: String!
    productName: String
    quantity: Int!
    value: Float!
    percentage: Float!
    colour: String
    warehouse: String
  }

  type TopProductsDistribution {
    products: [ProductDistributionItem!]!
    totalQuantity: Int!
    totalValue: Float!
    topProduct: String
    distributionType: String!  # "QUANTITY" or "VALUE"
    startDate: DateTime!
    endDate: DateTime!
  }

  # Pallet History Types
  type PalletHistoryResponse {
    items: [PalletHistoryItem!]!
    total: Int!
    productInfo: ProductInfo
  }

  type PalletHistoryItem {
    time: DateTime!
    operatorName: String!
    palletNum: String!
    action: String!
    remark: String!
    location: String
  }

  type ProductInfo {
    productCode: String!
    totalPallets: Int!
    series: String
  }

  extend type Query {
    # P2 Component - StockTypeSelectorCard
    # 獲取所有產品類型
    productTypes: [ProductTypeData!]!
      @auth(requires: VIEWER)
      @cache(ttl: 300, scope: USER)
    
    # 按類型獲取庫存數據
    stockByType(
      productType: String
      includeZeroStock: Boolean = false
      limit: Int = 100
    ): [StockByTypeData!]!
      @auth(requires: VIEWER)
      @cache(ttl: 300, scope: USER)
    
    # P2 Component - TransferTimeDistributionCard
    # 獲取轉移時間分布數據
    transferTimeDistribution(
      dateRange: DateRangeInput!
      warehouseId: String
      groupBy: String = "hour"
    ): TransferTimeDistribution!
      @auth(requires: VIEWER)
      @cache(ttl: 300, scope: USER)
    
    # P2 Component - TopProductsDistributionCard
    # 獲取產品分布數據 (用於 donut chart)
    topProductsDistribution(
      dateRange: DateRangeInput!
      limit: Int = 10
      warehouseId: String
      distributionType: String = "QUANTITY"  # "QUANTITY" or "VALUE"
      includeZeroQuantity: Boolean = false
    ): TopProductsDistribution!
      @auth(requires: VIEWER)
      @cache(ttl: 300, scope: USER)

    # 獲取庫存等級
    stockLevels(input: StockLevelsInput): StockLevelsResponse!
    
    # 獲取單個產品的庫存詳情
    stockDetail(productCode: String!, warehouse: String): StockItem
    
    # 獲取庫存轉移記錄
    stockTransfers(
      status: TransferStatus
      fromDate: String
      toDate: String
      limit: Int = 50
      offset: Int = 0
    ): [StockTransfer!]!
    
    # 獲取單個轉移詳情
    transferDetail(id: ID!): StockTransfer

    # InventoryAnalysis Single Query - 整合 RPC 優化
    inventoryAnalysis(input: InventoryAnalysisInput!): InventoryAnalysisResult!

    # P0 Charts - Phase 2 Migration
    # 1. TopProductsInventoryChart - 查詢多表：產品表+庫存表+歷史數據
    topProductsInventory(
      limit: Int = 10
      dateRange: DateRangeInput
      warehouseId: String
      excludeZeroStock: Boolean = true
    ): [ProductInventoryData!]!
      @auth(requires: VIEWER)
      @cache(ttl: 300, scope: USER)
    
    # 2. InventoryTurnoverAnalysis - 查詢多表：庫存表+訂單表+需求計算
    inventoryTurnoverAnalysis(
      limit: Int = 20
      dateRange: DateRangeInput
      warehouseId: String
      minTurnoverRate: Float = 0
    ): [InventoryTurnoverData!]!
      @auth(requires: VIEWER)
      @cache(ttl: 300, scope: USER)
    
    # 4. StocktakeAccuracyTrend - 查詢多表：盤點記錄+產品表+時間聚合
    stocktakeAccuracyTrend(
      dateRange: DateRangeInput
      limit: Int = 30
      productCodes: [String!]
    ): StocktakeAccuracyTrend!
      @auth(requires: VIEWER)
      @cache(ttl: 300, scope: USER)
    
    # 5. RealTimeInventoryMap - 查詢多表：庫存表+產品表+位置聚合
    realTimeInventoryMap(
      warehouseId: String
      includeEmptyLocations: Boolean = true
      productCodes: [String!]
    ): RealTimeInventoryMap!
      @auth(requires: VIEWER)
      @cache(ttl: 60, scope: USER)
    
    # Pallet History Query
    palletHistory(productCode: String!): PalletHistoryResponse!
      @auth(requires: VIEWER)
      @cache(ttl: 300, scope: USER)
  }

  extend type Mutation {
    # 創建庫存轉移
    createTransfer(input: CreateTransferInput!): TransferResponse!
    
    # 批量創建轉移
    batchTransfer(items: [BatchTransferItem!]!): BatchTransferResponse!
    
    # 更新轉移狀態
    updateTransferStatus(id: ID!, status: TransferStatus!): TransferResponse!
    
    # 取消轉移
    cancelTransfer(id: ID!, reason: String): TransferResponse!
  }
`;