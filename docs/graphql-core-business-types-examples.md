# GraphQL 核心業務表類型使用示例

本文檔展示如何使用新增的 5 個核心業務表的 GraphQL 類型定義。

## 1. 石板信息 (SlateInfo)

### 查詢單個石板信息
```graphql
query GetSlateInfo($productCode: String!) {
  slateInfo(productCode: $productCode) {
    productCode
    description
    toolNum
    weight
    thicknessTop
    thicknessBottom
    length
    width
    holeToBottom
    colour
    shapes
    uuid
    product {
      code
      description
      colour
      type
    }
  }
}
```

### 分頁查詢石板信息
```graphql
query GetSlateInfos($filter: SlateInfoFilterInput, $pagination: PaginationInput) {
  slateInfos(filter: $filter, pagination: $pagination) {
    edges {
      cursor
      node {
        productCode
        description
        weight
        colour
        shapes
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      totalCount
    }
  }
}
```

### 創建石板信息
```graphql
mutation CreateSlateInfo($input: CreateSlateInfoInput!) {
  createSlateInfo(input: $input) {
    productCode
    description
    uuid
    product {
      code
      description
    }
  }
}
```

## 2. ACO記錄 (AcoRecord)

### 查詢ACO記錄
```graphql
query GetAcoRecord($uuid: ID!) {
  acoRecord(uuid: $uuid) {
    uuid
    orderRef
    code
    requiredQty
    finishedQty
    remainingQty
    completionRate
    latestUpdate
    product {
      code
      description
    }
  }
}
```

### 按訂單查詢ACO記錄
```graphql
query GetAcoRecordsByOrder($orderRef: Int!) {
  acoRecordsByOrder(orderRef: $orderRef) {
    uuid
    code
    requiredQty
    finishedQty
    completionRate
    product {
      description
      colour
    }
  }
}
```

### 更新ACO記錄進度
```graphql
mutation UpdateAcoProgress($uuid: ID!, $finishedQty: Int!) {
  updateAcoRecordProgress(uuid: $uuid, finishedQty: $finishedQty) {
    uuid
    finishedQty
    remainingQty
    completionRate
  }
}
```

## 3. 盤點記錄 (StocktakeRecord)

### 查詢盤點記錄
```graphql
query GetStocktakeRecord($uuid: ID!) {
  stocktakeRecord(uuid: $uuid) {
    uuid
    productCode
    pltNum
    productDesc
    remainQty
    countedQty
    variance
    variancePercentage
    status
    countedId
    countedName
    createdAt
    product {
      code
      description
    }
    pallet {
      pltNum
      quantity
    }
  }
}
```

### 差異報告查詢
```graphql
query GetVarianceReport($dateRange: DateRangeInput, $minVariancePercentage: Float) {
  stocktakeVarianceReport(
    dateRange: $dateRange, 
    minVariancePercentage: $minVariancePercentage
  ) {
    uuid
    productCode
    productDesc
    remainQty
    countedQty
    variance
    variancePercentage
    status
    countedName
  }
}
```

### 批量更新盤點記錄
```graphql
mutation BatchUpdateStocktake($records: [BatchStocktakeUpdateInput!]!) {
  batchUpdateStocktakeRecords(records: $records) {
    successful
    failed
    totalVariance
    errors {
      uuid
      error
    }
    records {
      uuid
      countedQty
      variance
      status
    }
  }
}
```

## 4. 訂單裝載歷史 (OrderLoadingHistory)

### 查詢訂單裝載歷史
```graphql
query GetOrderLoadingHistory($uuid: ID!) {
  orderLoadingHistory(uuid: $uuid) {
    uuid
    orderRef
    palletNum
    productCode
    quantity
    actionType
    actionBy
    actionTime
    remark
    product {
      code
      description
    }
    pallet {
      pltNum
      quantity
    }
    operator {
      name
      department
    }
  }
}
```

### 按訂單查詢裝載歷史
```graphql
query GetLoadingHistoryByOrder($orderRef: String!) {
  orderLoadingHistoryByOrder(orderRef: $orderRef) {
    uuid
    palletNum
    productCode
    quantity
    actionType
    actionBy
    actionTime
    remark
  }
}
```

### 操作員活動查詢
```graphql
query GetOperatorActivity($actionBy: String!, $dateRange: DateRangeInput!) {
  orderLoadingHistoryByOperator(actionBy: $actionBy, dateRange: $dateRange) {
    uuid
    orderRef
    palletNum
    productCode
    quantity
    actionType
    actionTime
  }
}
```

## 5. GRN層級 (GrnLevel)

### 查詢GRN層級
```graphql
query GetGrnLevel($uuid: ID!) {
  grnLevel(uuid: $uuid) {
    uuid
    latestUpdate
    totalGross
    totalUnit
    grnRef
    totalNet
    averageWeight
    netToGrossRatio
    grn {
      grnNumber
      status
    }
  }
}
```

### GRN層級匯總
```graphql
query GetGrnLevelSummary($dateRange: DateRangeInput) {
  grnLevelSummary(dateRange: $dateRange) {
    totalRecords
    totalGrossWeight
    totalNetWeight
    totalUnits
    averageGrossWeight
    averageNetWeight
    averageNetToGrossRatio
    byGrnRef {
      grnRef
      recordCount
      totalGross
      totalNet
      totalUnits
    }
  }
}
```

## 統計分析查詢

### 石板信息統計
```graphql
query GetSlateInfoStats {
  slateInfoStatistics {
    totalProducts
    productsWithWeight
    productsWithDimensions
    averageWeight
    averageThickness
    commonColours {
      colour
      count
      percentage
    }
    commonShapes {
      shape
      count
      percentage
    }
  }
}
```

### ACO記錄匯總
```graphql
query GetAcoSummary($dateRange: DateRangeInput) {
  acoRecordSummary(dateRange: $dateRange) {
    totalOrders
    completedOrders
    pendingOrders
    overdeliveredOrders
    totalRequiredQty
    totalFinishedQty
    averageCompletionRate
    topProductsByVolume {
      productCode
      orderCount
      totalRequired
      totalFinished
      completionRate
    }
  }
}
```

### 訂單裝載匯總
```graphql
query GetLoadingSummary($dateRange: DateRangeInput) {
  orderLoadingSummary(dateRange: $dateRange) {
    totalRecords
    totalQuantityLoaded
    totalQuantityUnloaded
    netQuantityChange
    uniqueOrders
    uniqueProducts
    uniquePallets
    topOperators {
      operatorName
      totalActions
      totalQuantity
      loadActions
      unloadActions
      lastActivity
    }
    dailyActivity {
      date
      totalActions
      totalQuantity
      uniqueOrders
      uniqueOperators
    }
  }
}
```

## 實時訂閱

### ACO記錄進度更新訂閱
```graphql
subscription SubscribeAcoProgress($orderRefs: [Int!]) {
  acoRecordProgressUpdated(orderRefs: $orderRefs) {
    uuid
    orderRef
    code
    finishedQty
    completionRate
    latestUpdate
  }
}
```

### 盤點記錄更新訂閱
```graphql
subscription SubscribeStocktakeUpdates($productCodes: [String!]) {
  stocktakeRecordUpdated(productCodes: $productCodes) {
    uuid
    productCode
    countedQty
    variance
    status
  }
}
```

### 訂單裝載活動訂閱
```graphql
subscription SubscribeLoadingActivity($orderRefs: [String!]) {
  orderLoadingActivity(orderRefs: $orderRefs) {
    uuid
    orderRef
    palletNum
    productCode
    quantity
    actionType
    actionBy
    actionTime
  }
}
```

## 變數範例

```json
{
  "productCode": "SLATE001",
  "uuid": "123e4567-e89b-12d3-a456-426614174000",
  "orderRef": 12345,
  "dateRange": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  },
  "pagination": {
    "page": 1,
    "limit": 20
  },
  "filter": {
    "productCode": "SLATE",
    "colour": "Grey",
    "hasWeight": true
  }
}
```

這些範例展示了如何充分利用新增的 GraphQL 類型來查詢和操作核心業務數據，包括基本的 CRUD 操作、複雜的過濾和分頁、統計分析，以及實時數據訂閱。