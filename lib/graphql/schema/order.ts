export const orderTypeDefs = `
  # Warehouse Order Types (Loading-focused)
  type WarehouseOrder {
    id: ID!
    orderRef: String!
    customerName: String
    status: WarehouseOrderStatus!
    items: [WarehouseOrderItem!]!
    totalQuantity: Int!
    loadedQuantity: Int!
    remainingQuantity: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    completedAt: DateTime
  }

  type WarehouseOrderItem {
    id: ID!
    orderId: ID!
    productCode: String!
    productDesc: String
    quantity: Int!
    loadedQuantity: Int!
    status: WarehouseOrderItemStatus!
  }

  type AcoOrder {
    orderRef: Int!
    productCode: String!
    productDesc: String
    quantityOrdered: Int!
    quantityUsed: Int!
    remainingQuantity: Int!
    completionStatus: String!
    lastUpdated: DateTime
  }

  type OrderLoadingRecord {
    timestamp: DateTime!
    orderNumber: String!
    productCode: String!
    loadedQty: Int!
    userName: String!
    action: String!
  }

  enum WarehouseOrderStatus {
    PENDING
    IN_PROGRESS
    COMPLETED
    CANCELLED
  }

  enum WarehouseOrderItemStatus {
    PENDING
    PARTIAL
    COMPLETED
  }

  # Input Types
  input WarehouseOrderFilterInput {
    orderRef: String
    status: WarehouseOrderStatus
    dateRange: DateRangeInput
    customerName: String
  }

  input OrderLoadingFilterInput {
    startDate: String!
    endDate: String!
    orderRef: String
    productCode: String
    actionBy: String
  }

  input UpdateAcoOrderInput {
    orderRef: Int!
    productCode: String!
    quantityUsed: Int!
    skipUpdate: Boolean
    orderCompleted: Boolean
  }


  # Response Types
  type WarehouseOrdersResponse {
    items: [WarehouseOrder!]!
    total: Int!
    aggregates: WarehouseOrderAggregates
  }

  type WarehouseOrderAggregates {
    totalOrders: Int!
    pendingOrders: Int!
    completedOrders: Int!
    totalQuantity: Int!
    loadedQuantity: Int!
  }

  type OrderLoadingResponse {
    records: [OrderLoadingRecord!]!
    total: Int!
    summary: LoadingSummary
  }

  type LoadingSummary {
    totalLoaded: Int!
    uniqueOrders: Int!
    uniqueProducts: Int!
    averageLoadPerOrder: Float!
  }

  type UpdateAcoOrderResponse {
    success: Boolean!
    message: String
    order: AcoOrder
    emailSent: Boolean
    error: Error
  }

  type AcoOrderReportResponse {
    data: [AcoOrder!]!
    total: Int!
    reference: String!
    generatedAt: DateTime!
  }

  # Queries
  extend type Query {
    # Get warehouse orders with filtering and pagination
    warehouseOrders(input: WarehouseOrderFilterInput): WarehouseOrdersResponse!
    
    # Get single warehouse order by ID or reference
    warehouseOrder(id: ID, orderRef: String): WarehouseOrder
    
    # Get ACO order report data
    acoOrderReport(reference: String!): AcoOrderReportResponse!
    
    # Get order loading records
    orderLoadingRecords(input: OrderLoadingFilterInput!): OrderLoadingResponse!
  }

  # Mutations
  extend type Mutation {
    # Update ACO order quantities
    updateAcoOrder(input: UpdateAcoOrderInput!): UpdateAcoOrderResponse!
    
    # Update warehouse order status
    updateWarehouseOrderStatus(orderId: ID!, status: WarehouseOrderStatus!): WarehouseOrder!
    
    # Cancel warehouse order
    cancelWarehouseOrder(orderId: ID!, reason: String): WarehouseOrder!
  }
`;
