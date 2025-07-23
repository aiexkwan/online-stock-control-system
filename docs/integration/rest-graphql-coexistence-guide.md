# REST 和 GraphQL 共存策略指南

## 概述

本系統實現了 REST API 和 GraphQL API 的完整共存架構，支援智能數據源切換、自動降級和性能監控。本指南詳細說明如何使用和配置這個雙模式系統。

## 架構概覽

```
┌─────────────────────────────────────────────────────────────┐
│                    Widget Layer                             │
├─────────────────────────────────────────────────────────────┤
│                UnifiedDataLayer                             │
│  ┌─────────────────┐     ┌─────────────────────────────────┐│
│  │  Auto Routing   │────▶│   Configuration Manager        ││
│  └─────────────────┘     └─────────────────────────────────┘│
├─────────────────────┬─────────────────────────────────────────┤
│   GraphQL Client    │            REST Client               │
├─────────────────────┴─────────────────────────────────────────┤
│        Apollo Client           unified-api-client          │
├─────────────────────┬─────────────────────────────────────────┤
│   /api/graphql      │         /api/v1/*                   │
└─────────────────────┴─────────────────────────────────────────┘
```

## 核心組件

### 1. UnifiedDataLayer

統一數據層提供透明的 API 切換和降級功能：

```typescript
import { unifiedDataLayer, DataSourceType } from '@/lib/api/unified-data-layer';

// 自動選擇數據源
const result = await unifiedDataLayer.query({
  source: DataSourceType.AUTO, // 自動決定
  variables: { widgetId: 'stock_levels' }
});

// 手動指定數據源
const restResult = await unifiedDataLayer.query({
  source: DataSourceType.REST,
  endpoint: '/api/inventory/stock-levels',
  variables: { warehouse: 'main' }
});

const graphqlResult = await unifiedDataLayer.query({
  source: DataSourceType.GRAPHQL,
  query: STOCK_LEVELS_QUERY,
  variables: { warehouse: 'main' }
});
```

### 2. 數據源配置管理器

配置驅動的路由決策系統：

```typescript
import { dataSourceConfig } from '@/lib/data/data-source-config';

// 添加自定義規則
dataSourceConfig.addRule({
  id: 'peak_hours_rest',
  name: '高峰時段使用 REST',
  condition: {
    type: 'time',
    value: [9, 17], // 9AM-5PM
    operator: 'between'
  },
  target: DataSourceType.REST,
  priority: 80,
  enabled: true,
  fallbackEnabled: true
});

// 添加 A/B 測試
dataSourceConfig.addABTest({
  experimentId: 'graphql_performance_test',
  name: 'GraphQL 性能測試',
  enabled: true,
  trafficPercentage: 20, // 20% 用戶
  targetDataSource: DataSourceType.GRAPHQL,
  startDate: new Date(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天
});
```

## Widget 整合指南

### 基本 Widget 實現

```typescript
// Widget 組件示例
import { unifiedDataLayer } from '@/lib/api/unified-data-layer';

export default function MyWidget() {
  const [data, setData] = useState(null);
  const [dataSource, setDataSource] = useState<DataSourceType>(DataSourceType.AUTO);

  const fetchData = async () => {
    const result = await unifiedDataLayer.getWidgetData(
      'my_widget_id',
      { 
        timeRange: 'today',
        // 自動根據 widget 配置選擇數據源
      }
    );

    setData(result.data);
    setDataSource(result.source);
  };

  return (
    <div>
      {/* 顯示數據源指示器 */}
      <Badge variant={dataSource === DataSourceType.GRAPHQL ? "default" : "secondary"}>
        {dataSource.toUpperCase()}
      </Badge>
      
      {/* Widget 內容 */}
      {data && <div>{/* 渲染數據 */}</div>}
    </div>
  );
}
```

### Widget 映射配置

在 `unified-data-layer.ts` 中添加 widget 映射：

```typescript
const WIDGET_MAPPINGS: WidgetDataMapping = {
  my_widget: {
    graphql: {
      query: gql`
        query GetMyWidgetData($param: String!) {
          myWidgetData(param: $param) {
            field1
            field2
            nested {
              field3
            }
          }
        }
      `,
      transform: (data) => {
        // GraphQL 數據轉換邏輯
        return data.myWidgetData;
      }
    },
    rest: {
      endpoint: '/api/my-widget',
      method: 'GET',
      transform: (data) => {
        // REST 數據轉換邏輯
        return data.result;
      }
    },
    preferredSource: DataSourceType.GRAPHQL
  }
};
```

## 配置規則詳解

### 規則類型

#### 1. 用戶基礎規則
```typescript
{
  type: 'user',
  value: 'admin_user_id',
  operator: 'equals'
}
```

#### 2. Widget 分類規則
```typescript
{
  type: 'widget',
  value: ['charts', 'analysis'],
  operator: 'contains'
}
```

#### 3. 性能基礎規則
```typescript
{
  type: 'performance',
  value: 3000, // 3秒
  operator: 'gt'
}
```

#### 4. 時間基礎規則
```typescript
{
  type: 'time',
  value: [22, 6], // 晚上10點到早上6點
  operator: 'between'
}
```

#### 5. Feature Flag 規則
```typescript
{
  type: 'feature_flag',
  value: 'enable_graphql_beta'
}
```

### 優先級系統

- **100+**: 緊急或性能相關規則
- **50-99**: Widget 或用戶特定規則
- **10-49**: 一般業務規則
- **1-9**: 默認或備用規則

## API 管理接口

### 獲取系統狀態

```bash
# 獲取完整狀態
GET /api/admin/data-source-config?action=status

# 僅獲取性能指標
GET /api/admin/data-source-config?action=metrics
```

### 動態配置管理

```bash
# 臨時切換數據源（5分鐘）
POST /api/admin/data-source-config
{
  "action": "switch_data_source",
  "targetSource": "graphql",
  "duration": 300000
}

# 添加新規則
POST /api/admin/data-source-config
{
  "action": "add_rule",
  "rule": {
    "id": "custom_rule_1",
    "name": "自定義規則",
    "condition": {
      "type": "widget",
      "value": "special_widget"
    },
    "target": "rest",
    "priority": 60,
    "enabled": true
  }
}
```

## 監控面板

### DataSourceMonitorWidget

系統提供專用的監控 Widget，可以：

- 實時監控 REST 和 GraphQL 性能
- 顯示當前活動規則和 A/B 測試
- 提供快速切換操作
- 查看成功率和響應時間趨勢

```typescript
// 在管理面板中添加監控 Widget
import DataSourceMonitorWidget from '@/app/(app)/admin/components/dashboard/widgets/DataSourceMonitorWidget';

// Widget 會自動顯示：
// - 默認數據源
// - Fallback 狀態
// - 活動規則數量
// - API 性能指標
// - 快速操作按鈕
```

## 最佳實踐

### 1. 數據源選擇建議

**優先使用 GraphQL 的場景：**
- 複雜的關聯查詢
- 需要精確字段選擇
- 圖表和分析類 Widget
- 實時數據訂閱

**優先使用 REST 的場景：**
- 簡單的 CRUD 操作
- 文件上傳/下載
- 第三方系統整合
- 緩存友好的數據

### 2. 性能優化

```typescript
// 使用適當的緩存策略
const result = await unifiedDataLayer.query({
  source: DataSourceType.AUTO,
  cachePolicy: 'cache-first', // GraphQL
  variables: { id: 'widget_1' }
});

// 批量請求優化
const results = await Promise.all([
  unifiedDataLayer.getWidgetData('widget_1', params1),
  unifiedDataLayer.getWidgetData('widget_2', params2),
  unifiedDataLayer.getWidgetData('widget_3', params3)
]);
```

### 3. 錯誤處理

```typescript
try {
  const result = await unifiedDataLayer.query(options);
  
  if (result.error) {
    console.error('Data layer error:', result.error);
    // 處理業務錯誤
  }
  
  console.log(`Data from ${result.source} in ${result.executionTime}ms`);
} catch (error) {
  console.error('Network or system error:', error);
  // 處理系統錯誤
}
```

### 4. 測試策略

```typescript
// 單元測試
import { unifiedDataLayer } from '@/lib/api/unified-data-layer';

test('should fallback to REST when GraphQL fails', async () => {
  // Mock GraphQL failure
  // Assert REST is used
});

// 整合測試
test('configuration rules should work correctly', async () => {
  // Test rule evaluation
  // Test data source selection
});
```

## 遷移指南

### 階段 1: 基礎設置
1. 確保 GraphQL 端點正常工作
2. 配置基本的 Widget 映射
3. 啟用監控面板

### 階段 2: 漸進遷移
1. 選擇試點 Widget 進行雙模式支援
2. 配置適當的降級規則
3. 監控性能指標

### 階段 3: 全面部署
1. 擴展到所有 Widget
2. 優化配置規則
3. 建立運維流程

### 階段 4: 持續優化
1. 基於指標調整策略
2. A/B 測試新功能
3. 清理遺留代碼

## 故障排除

### 常見問題

1. **GraphQL 查詢失敗**
   - 檢查 schema 定義
   - 驗證查詢語法
   - 確認權限設置

2. **REST API 錯誤**
   - 檢查端點路徑
   - 驗證請求格式
   - 確認參數傳遞

3. **配置規則不生效**
   - 檢查規則優先級
   - 驗證條件邏輯
   - 確認規則啟用狀態

### 調試工具

```typescript
// 啟用詳細日誌
unifiedDataLayer.setMetricsEnabled(true);

// 檢查配置狀態
const status = unifiedDataLayer.getConfigStatus();
console.log('Current config:', status);

// 手動測試數據源
await unifiedDataLayer.switchDataSource(DataSourceType.GRAPHQL, 60000);
```

## 結論

REST 和 GraphQL 共存策略提供了：

- **靈活性**: 根據場景選擇最適合的 API
- **可靠性**: 自動降級和錯誤恢復
- **可觀察性**: 完整的監控和指標
- **可配置性**: 動態規則和 A/B 測試
- **向後兼容**: 平滑的遷移路徑

通過合理使用這個系統，可以確保在技術演進過程中維持系統的穩定性和性能。