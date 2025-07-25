# GraphQL Schema Design Document

**Version**: 1.0  
**Date**: 2025-07-25  
**Author**: Backend Architecture Team  
**Status**: Draft

## 1. Executive Summary

This document outlines the comprehensive GraphQL schema design for the NewPennine WMS system. The schema is designed to replace 60+ REST endpoints with a unified, type-safe, and efficient GraphQL API that supports real-time subscriptions, optimized queries, and seamless integration with the Card component system.

## 2. Design Principles

### 2.1 Core Principles

1. **Schema-First Design**: Define schema before implementation
2. **Type Safety**: Strong typing for all entities and operations
3. **Performance**: Optimize for common query patterns
4. **Consistency**: Uniform naming and structure conventions
5. **Extensibility**: Design for future additions without breaking changes
6. **Security**: Built-in authentication and authorization

### 2.2 GraphQL Best Practices

- **Nullable by Default**: Fields are nullable unless explicitly required
- **Pagination**: All list queries support cursor-based pagination
- **Error Handling**: Consistent error types and messages
- **Versioning**: Schema evolution without versioning
- **Documentation**: Comprehensive descriptions for all types and fields

## 3. Schema Architecture

### 3.1 Layer Structure

```
┌─────────────────────────────────────────┐
│           Client Applications            │
│        (Web, Mobile, Desktop)           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          GraphQL Gateway                 │
│    (Authentication, Rate Limiting)       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Schema Layer                    │
│  ┌──────────┬─────────┬──────────────┐ │
│  │ Queries  │Mutations│ Subscriptions│ │
│  └──────────┴─────────┴──────────────┘ │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Resolver Layer                  │
│   (Business Logic, Validation)          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Data Layer                      │
│  ┌──────────┬─────────┬──────────────┐ │
│  │ Database │  Cache  │ External APIs│ │
│  └──────────┴─────────┴──────────────┘ │
└─────────────────────────────────────────┘
```

### 3.2 Module Organization

```graphql
# Root Schema
type Query {
  # Card Data Queries
  statsCardData(input: StatsQueryInput!): StatsCardData!
  chartCardData(input: ChartQueryInput!): ChartCardData!
  tableCardData(input: TableQueryInput!): TableCardData!
  # ... other card queries
  
  # Business Entity Queries
  products(filter: ProductFilter, pagination: PaginationInput): ProductConnection!
  orders(filter: OrderFilter, pagination: PaginationInput): OrderConnection!
  inventory(filter: InventoryFilter, pagination: PaginationInput): InventoryConnection!
  # ... other entity queries
}

type Mutation {
  # Card Operations
  updateCardConfig(input: UpdateCardConfigInput!): CardConfig!
  
  # Business Operations
  createProduct(input: CreateProductInput!): Product!
  updateOrder(id: ID!, input: UpdateOrderInput!): Order!
  transferInventory(input: TransferInventoryInput!): Transfer!
  # ... other mutations
}

type Subscription {
  # Real-time Updates
  alertCreated(severity: [AlertSeverity!]): Alert!
  inventoryChanged(locationId: ID): InventoryChange!
  orderStatusChanged(orderId: ID!): Order!
  # ... other subscriptions
}
```

## 4. Core Schema Components

### 4.1 Base Types and Interfaces

```graphql
# Base entity interface
interface Node {
  id: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# Timestamped interface
interface Timestamped {
  createdAt: DateTime!
  updatedAt: DateTime!
  deletedAt: DateTime
}

# Auditable interface
interface Auditable {
  createdBy: User!
  updatedBy: User!
  auditLog: [AuditEntry!]!
}

# Error handling
interface Error {
  code: String!
  message: String!
  field: String
}

type ValidationError implements Error {
  code: String!
  message: String!
  field: String
  value: JSON
}

type BusinessError implements Error {
  code: String!
  message: String!
  field: String
  context: JSON
}
```

### 4.2 Pagination System

```graphql
# Cursor-based pagination
interface Connection {
  edges: [Edge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

interface Edge {
  node: Node!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
  totalPages: Int!
  currentPage: Int!
}

# Generic pagination input
input PaginationInput {
  first: Int
  after: String
  last: Int
  before: String
  page: Int
  limit: Int = 20
}
```

### 4.3 Filtering and Sorting

```graphql
# Generic filter input
input FilterInput {
  and: [FilterInput!]
  or: [FilterInput!]
  not: FilterInput
  field: String
  operator: FilterOperator
  value: JSON
}

enum FilterOperator {
  EQ
  NEQ
  GT
  GTE
  LT
  LTE
  IN
  NIN
  LIKE
  ILIKE
  CONTAINS
  STARTS_WITH
  ENDS_WITH
  IS_NULL
  IS_NOT_NULL
}

# Generic sort input
input SortInput {
  field: String!
  direction: SortDirection!
}

enum SortDirection {
  ASC
  DESC
}
```

### 4.4 Common Inputs

```graphql
# Date range input
input DateRangeInput {
  start: DateTime!
  end: DateTime!
  timezone: String
}

# Search input
input SearchInput {
  query: String!
  fields: [String!]
  fuzzy: Boolean = false
  limit: Int = 10
}

# Batch operation input
input BatchOperationInput {
  ids: [ID!]!
  operation: BatchOperation!
  params: JSON
}

enum BatchOperation {
  UPDATE
  DELETE
  ARCHIVE
  RESTORE
  EXPORT
}
```

## 5. Business Domain Schema

### 5.1 Product Management

```graphql
type Product implements Node & Timestamped & Auditable {
  id: ID!
  code: String!
  name: String!
  description: String
  category: ProductCategory!
  specifications: ProductSpecifications!
  suppliers: [Supplier!]!
  inventory: InventoryConnection!
  # Timestamps and audit fields...
}

input CreateProductInput {
  code: String!
  name: String!
  description: String
  categoryId: ID!
  specifications: ProductSpecificationsInput!
  supplierIds: [ID!]
}

type ProductSpecifications {
  weight: Float
  dimensions: Dimensions
  color: String
  material: String
  customFields: JSON
}
```

### 5.2 Inventory Management

```graphql
type Inventory implements Node & Timestamped {
  id: ID!
  product: Product!
  location: Location!
  quantity: Int!
  reservedQuantity: Int!
  availableQuantity: Int!
  pallets: PalletConnection!
  movements: MovementConnection!
  # Timestamps...
}

type Location implements Node {
  id: ID!
  code: String!
  name: String!
  type: LocationType!
  warehouse: Warehouse!
  capacity: Int
  currentOccupancy: Int!
  coordinates: Coordinates
}

enum LocationType {
  INJECTION
  PIPELINE
  PREBOOK
  AWAIT
  FOLD
  BULK
  BACKCARPARK
  DAMAGE
}
```

### 5.3 Order Management

```graphql
type Order implements Node & Timestamped & Auditable {
  id: ID!
  orderNumber: String!
  customer: Customer!
  items: OrderItemConnection!
  status: OrderStatus!
  totalAmount: Money!
  shippingAddress: Address!
  tracking: TrackingInfo
  # Timestamps and audit fields...
}

enum OrderStatus {
  DRAFT
  CONFIRMED
  PROCESSING
  PICKING
  PACKING
  SHIPPED
  DELIVERED
  CANCELLED
  RETURNED
}

type OrderItem {
  id: ID!
  product: Product!
  quantity: Int!
  unitPrice: Money!
  totalPrice: Money!
  status: OrderItemStatus!
  allocatedPallets: [Pallet!]!
}
```

### 5.4 User and Authentication

```graphql
type User implements Node & Timestamped {
  id: ID!
  email: String!
  name: String!
  role: Role!
  department: Department
  permissions: [Permission!]!
  preferences: UserPreferences!
  lastLoginAt: DateTime
}

type Role {
  id: ID!
  name: String!
  permissions: [Permission!]!
  users: UserConnection!
}

type Permission {
  id: ID!
  resource: String!
  action: String!
  conditions: JSON
}
```

## 6. Card-Specific Schema

### 6.1 Stats Card

```graphql
type StatsCardData {
  stats: [StatsData!]!
  summary: StatsSummary!
  lastUpdated: DateTime!
  refreshInterval: Int
}

type StatsData {
  type: StatsType!
  value: Float!
  label: String!
  unit: String
  trend: Trend
  comparison: Comparison
  icon: String
  color: String
}

enum StatsType {
  TOTAL_ORDERS
  PENDING_ORDERS
  COMPLETED_ORDERS
  TOTAL_PRODUCTS
  LOW_STOCK_ITEMS
  TOTAL_PALLETS
  AVAILABLE_SPACE
  DAILY_TRANSFERS
}
```

### 6.2 Chart Card

```graphql
type ChartCardData {
  chartType: ChartType!
  data: ChartData!
  config: ChartConfig!
  lastUpdated: DateTime!
}

union ChartData = LineChartData | BarChartData | PieChartData | ScatterChartData

type LineChartData {
  datasets: [LineDataset!]!
  labels: [String!]!
}

type LineDataset {
  label: String!
  data: [Float!]!
  color: String
  tension: Float
}

enum ChartType {
  LINE
  BAR
  PIE
  DOUGHNUT
  SCATTER
  AREA
  RADAR
  BUBBLE
}
```

### 6.3 Table Card

```graphql
type TableCardData {
  columns: [TableColumn!]!
  rows: JSON!
  pagination: PageInfo!
  sorting: [SortConfig!]
  filters: [FilterConfig!]
  actions: [TableAction!]
  lastUpdated: DateTime!
}

type TableColumn {
  id: String!
  header: String!
  accessor: String!
  type: ColumnType!
  width: Int
  sortable: Boolean
  filterable: Boolean
  visible: Boolean
}

enum ColumnType {
  TEXT
  NUMBER
  DATE
  BOOLEAN
  CURRENCY
  PERCENTAGE
  ACTION
  CUSTOM
}
```

## 7. Real-time Subscriptions

### 7.1 Subscription Types

```graphql
type Subscription {
  # System notifications
  systemAlert(severity: [AlertSeverity!]): Alert!
  
  # Inventory updates
  inventoryChanged(
    productId: ID
    locationId: ID
    warehouseId: ID
  ): InventoryChange!
  
  # Order tracking
  orderStatusChanged(
    orderId: ID
    customerId: ID
    status: [OrderStatus!]
  ): Order!
  
  # User activity
  userActivity(
    userId: ID
    action: [UserAction!]
  ): ActivityLog!
  
  # Card data updates
  cardDataChanged(
    cardId: ID!
    userId: ID
  ): CardUpdateEvent!
}

type CardUpdateEvent {
  cardId: ID!
  cardType: CardType!
  updateType: UpdateType!
  data: JSON!
  timestamp: DateTime!
}

enum UpdateType {
  FULL_REFRESH
  PARTIAL_UPDATE
  CONFIG_CHANGE
  ERROR
}
```

## 8. Security and Authorization

### 8.1 Directives

```graphql
# Authentication directive
directive @auth(
  requires: AuthRequirement = USER
) on FIELD_DEFINITION | OBJECT

enum AuthRequirement {
  PUBLIC
  USER
  ADMIN
  SYSTEM
}

# Permission directive
directive @hasPermission(
  resource: String!
  action: String!
) on FIELD_DEFINITION

# Rate limiting directive
directive @rateLimit(
  max: Int!
  window: String!
  by: RateLimitBy = IP
) on FIELD_DEFINITION

enum RateLimitBy {
  IP
  USER
  API_KEY
}

# Field-level security
directive @sensitive(
  level: SensitivityLevel!
) on FIELD_DEFINITION

enum SensitivityLevel {
  PUBLIC
  INTERNAL
  CONFIDENTIAL
  SECRET
}
```

### 8.2 Authentication Flow

```graphql
type Mutation {
  # Authentication
  login(input: LoginInput!): AuthPayload!
  logout: Boolean!
  refreshToken(token: String!): AuthPayload!
  
  # Password management
  changePassword(input: ChangePasswordInput!): User!
  resetPassword(input: ResetPasswordInput!): Boolean!
  
  # Session management
  invalidateAllSessions: Boolean!
}

type AuthPayload {
  user: User!
  token: String!
  refreshToken: String!
  expiresAt: DateTime!
}

input LoginInput {
  email: String!
  password: String!
  rememberMe: Boolean = false
}
```

## 9. Performance Optimization

### 9.1 DataLoader Pattern

```typescript
// Example DataLoader implementation
const userLoader = new DataLoader(async (userIds) => {
  const users = await db.users.findMany({
    where: { id: { in: userIds } }
  });
  return userIds.map(id => users.find(user => user.id === id));
});

// Usage in resolver
const resolvers = {
  Order: {
    createdBy: (order) => userLoader.load(order.createdById)
  }
};
```

### 9.2 Query Complexity

```graphql
# Complexity directive
directive @complexity(
  value: Int!
  multipliers: [String!]
) on FIELD_DEFINITION

# Example usage
type Query {
  products(
    filter: ProductFilter
    pagination: PaginationInput
  ): ProductConnection! @complexity(value: 10, multipliers: ["pagination.limit"])
}
```

### 9.3 Caching Strategy

```graphql
# Cache directive
directive @cache(
  ttl: Int! # Time to live in seconds
  scope: CacheScope!
  key: String
) on FIELD_DEFINITION

enum CacheScope {
  PUBLIC
  PRIVATE
  USER
  ORGANIZATION
}

# Example usage
type Query {
  productCategories: [ProductCategory!]! @cache(ttl: 3600, scope: PUBLIC)
  userPreferences: UserPreferences! @cache(ttl: 300, scope: USER)
}
```

## 10. Error Handling

### 10.1 Error Types

```graphql
union MutationError = 
  | ValidationError
  | BusinessError
  | AuthenticationError
  | AuthorizationError
  | NotFoundError
  | ConflictError
  | RateLimitError

type MutationResponse {
  success: Boolean!
  message: String
  errors: [MutationError!]
  data: JSON
}

# Standardized mutation response
type CreateProductPayload {
  success: Boolean!
  product: Product
  errors: [MutationError!]
}
```

### 10.2 Error Codes

```typescript
enum ErrorCode {
  // Authentication errors (1xxx)
  UNAUTHENTICATED = 'ERR_1001',
  INVALID_CREDENTIALS = 'ERR_1002',
  TOKEN_EXPIRED = 'ERR_1003',
  
  // Authorization errors (2xxx)
  UNAUTHORIZED = 'ERR_2001',
  INSUFFICIENT_PERMISSIONS = 'ERR_2002',
  
  // Validation errors (3xxx)
  INVALID_INPUT = 'ERR_3001',
  MISSING_REQUIRED_FIELD = 'ERR_3002',
  
  // Business logic errors (4xxx)
  INSUFFICIENT_INVENTORY = 'ERR_4001',
  ORDER_ALREADY_PROCESSED = 'ERR_4002',
  
  // System errors (5xxx)
  INTERNAL_ERROR = 'ERR_5001',
  SERVICE_UNAVAILABLE = 'ERR_5002'
}
```

## 11. Migration Strategy

### 11.1 REST to GraphQL Mapping

| REST Endpoint | GraphQL Operation | Status |
|--------------|-------------------|---------|
| GET /api/products | query products | ⏳ Pending |
| POST /api/products | mutation createProduct | ⏳ Pending |
| GET /api/orders/:id | query order(id) | ⏳ Pending |
| PUT /api/orders/:id | mutation updateOrder | ⏳ Pending |
| ... | ... | ... |

### 11.2 Phased Migration

1. **Phase 1**: Core queries (products, orders, inventory)
2. **Phase 2**: Mutations and business operations
3. **Phase 3**: Subscriptions and real-time features
4. **Phase 4**: Advanced features and optimizations
5. **Phase 5**: Deprecate REST endpoints

### 11.3 Compatibility Layer

```typescript
// REST compatibility wrapper
app.get('/api/products', async (req, res) => {
  const result = await graphqlClient.query({
    query: PRODUCTS_QUERY,
    variables: {
      filter: convertRestFilterToGraphQL(req.query),
      pagination: convertRestPaginationToGraphQL(req.query)
    }
  });
  
  res.json(convertGraphQLResponseToRest(result));
});
```

## 12. Testing Strategy

### 12.1 Schema Testing

```typescript
// Schema validation test
describe('GraphQL Schema', () => {
  it('should have valid schema', () => {
    const errors = validateSchema(schema);
    expect(errors).toHaveLength(0);
  });
  
  it('should not have breaking changes', () => {
    const changes = findBreakingChanges(oldSchema, newSchema);
    expect(changes).toHaveLength(0);
  });
});
```

### 12.2 Resolver Testing

```typescript
// Resolver unit test
describe('Product Resolver', () => {
  it('should return products with pagination', async () => {
    const result = await resolvers.Query.products(
      null,
      { pagination: { limit: 10 } },
      context
    );
    
    expect(result.edges).toHaveLength(10);
    expect(result.pageInfo.hasNextPage).toBeDefined();
  });
});
```

### 12.3 Integration Testing

```typescript
// GraphQL integration test
describe('Product Operations', () => {
  it('should create and query product', async () => {
    const { data } = await client.mutate({
      mutation: CREATE_PRODUCT_MUTATION,
      variables: { input: productInput }
    });
    
    expect(data.createProduct.success).toBe(true);
    expect(data.createProduct.product.id).toBeDefined();
  });
});
```

## 13. Documentation

### 13.1 Schema Documentation

- All types must have descriptions
- All fields should have descriptions
- Complex fields need examples
- Deprecated fields must have migration notes

### 13.2 Generated Documentation

- Use GraphQL introspection for auto-documentation
- Generate TypeScript types from schema
- Create interactive GraphQL playground
- Maintain migration guides

## 14. Monitoring and Analytics

### 14.1 Metrics to Track

- Query execution time
- Resolver performance
- Error rates by operation
- Cache hit rates
- Query complexity scores
- Client usage patterns

### 14.2 Logging

```typescript
// Structured logging for GraphQL operations
const logPlugin = {
  requestDidStart() {
    return {
      willSendResponse(requestContext) {
        logger.info({
          operationName: requestContext.request.operationName,
          query: requestContext.request.query,
          variables: requestContext.request.variables,
          duration: requestContext.response.http.body.extensions.duration,
          errors: requestContext.errors
        });
      }
    };
  }
};
```

## 15. Future Considerations

1. **Federation**: Split schema into microservices
2. **Persisted Queries**: Improve performance and security
3. **Schema Stitching**: Integrate external GraphQL APIs
4. **Custom Scalars**: Add domain-specific types
5. **Subscriptions at Scale**: WebSocket optimization

## Appendices

### A. Naming Conventions

- **Types**: PascalCase (e.g., `ProductCategory`)
- **Fields**: camelCase (e.g., `createdAt`)
- **Enums**: SCREAMING_SNAKE_CASE (e.g., `ORDER_STATUS`)
- **Interfaces**: PascalCase with descriptive names
- **Input types**: Suffix with `Input` (e.g., `CreateProductInput`)
- **Connections**: Suffix with `Connection` (e.g., `ProductConnection`)

### B. References

- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [Relay Specification](https://relay.dev/docs/guides/graphql-server-specification/)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [DataLoader Pattern](https://github.com/graphql/dataloader)

---

**Document Status**: Living document, updated as schema evolves  
**Last Updated**: 2025-07-25  
**Next Review**: 2025-08-01