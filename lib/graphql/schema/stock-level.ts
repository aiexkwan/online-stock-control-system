/**
 * Stock Level GraphQL Schema
 * Schema for stock level operations with filtering by product type
 */

export const stockLevelSchema = `
# Stock Level Types
type StockLevelRecord {
  uuid: ID!
  stock: String!
  description: String!
  stockLevel: Int!
  updateTime: DateTime!
  
  # Relations
  productInfo: ProductInfo
}

type ProductInfo {
  code: String!
  description: String!
  type: String!
  colour: String!
  standardQty: Int
}

type StockLevelListResult {
  records: [StockLevelRecord!]!
  totalCount: Int!
  lastUpdated: DateTime!
}

type StockLevelChartPoint {
  date: DateTime!
  stockCode: String!
  stockLevel: Int!
  description: String!
}

type StockLevelChartResult {
  chartData: [StockLevelChartPoint!]!
  productCodes: [String!]!
  dateRange: DateRange!
}

type StockLevelStats {
  totalProducts: Int!
  totalStock: Int!
  lastUpdate: DateTime!
  productsByType: [ProductTypeCount!]!
}

type ProductTypeCount {
  type: String!
  count: Int!
  totalStock: Int!
}

# Input Types
input StockLevelFilter {
  productType: String
  productCodes: [String!]
  dateRange: DateRangeInput
  minStockLevel: Int
  maxStockLevel: Int
}

# Query Extensions
extend type Query {
  # Get latest stock levels for a specific product type
  stockLevelList(
    productType: String
  ): StockLevelListResult!
  
  # Get stock level chart data for past 21 days
  stockLevelChart(
    productType: String
    days: Int = 21
  ): StockLevelChartResult!
  
  # Get stock level statistics
  stockLevelStats(
    filter: StockLevelFilter
  ): StockLevelStats!
}
`;
