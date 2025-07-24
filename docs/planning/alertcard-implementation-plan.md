# AlertCard 實施計劃

**創建日期**: 2025-07-24
**狀態**: 待實施
**預計完成**: 3天

## 概述

AlertCard是第8個統一Card組件，旨在整合所有告警相關功能，提供一個統一、高效的告警管理界面。

## 技術架構

### 1. 文件結構
```
app/(app)/admin/components/dashboard/cards/
├── AlertCard.tsx              # 主組件
├── AlertCard.demo.tsx         # 示例和文檔
└── __tests__/
    └── AlertCard.test.tsx     # 單元測試

lib/graphql/
├── resolvers/
│   └── alert.resolver.ts      # GraphQL解析器
└── schema/
    └── alert.ts               # GraphQL類型定義
```

### 2. 組件實現

#### AlertCard.tsx
```typescript
import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { AlertTriangle, Bell, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useWidgetToast } from '@/app/(app)/admin/hooks/useWidgetToast';

interface AlertCardProps {
  widgetId: string;
  title?: string;
  compact?: boolean;
  filters?: {
    severity?: string[];
    status?: string[];
    category?: string[];
  };
  onAlertClick?: (alert: Alert) => void;
  onRefresh?: () => void;
}

export function AlertCard({
  widgetId,
  title = 'System Alerts',
  compact = false,
  filters,
  onAlertClick,
  onRefresh,
}: AlertCardProps) {
  // 實現細節...
}
```

### 3. GraphQL整合

#### Schema定義
```typescript
// lib/graphql/schema/alert.ts
export const alertTypeDefs = gql`
  type Alert {
    id: ID!
    ruleName: String!
    level: AlertLevel!
    state: AlertState!
    message: String!
    value: Float!
    threshold: Float!
    triggeredAt: DateTime!
    acknowledgedAt: DateTime
    resolvedAt: DateTime
    assignedTo: String
    category: String!
    source: String!
    metadata: JSON
  }

  enum AlertLevel {
    CRITICAL
    WARNING
    INFO
  }

  enum AlertState {
    ACTIVE
    ACKNOWLEDGED
    RESOLVED
  }

  type AlertStats {
    total: Int!
    active: Int!
    acknowledged: Int!
    resolved: Int!
    byLevel: AlertLevelStats!
    byCategory: JSON!
  }

  type AlertLevelStats {
    critical: Int!
    warning: Int!
    info: Int!
  }

  input AlertFilterInput {
    levels: [AlertLevel!]
    states: [AlertState!]
    categories: [String!]
    dateRange: DateRangeInput
    search: String
  }

  extend type Query {
    alerts(
      filter: AlertFilterInput
      pagination: PaginationInput
      sort: SortInput
    ): AlertConnection!
    
    alertStats(timeRange: TimeRangeInput): AlertStats!
    
    alertById(id: ID!): Alert
  }

  extend type Mutation {
    acknowledgeAlert(id: ID!, note: String): Alert!
    resolveAlert(id: ID!, resolution: String!): Alert!
    assignAlert(id: ID!, userId: String!): Alert!
    snoozeAlert(id: ID!, until: DateTime!): Alert!
    batchAcknowledgeAlerts(ids: [ID!]!): BatchOperationResult!
    batchResolveAlerts(ids: [ID!]!, resolution: String!): BatchOperationResult!
  }

  extend type Subscription {
    alertCreated(severity: [AlertLevel!]): Alert!
    alertUpdated(id: ID): Alert!
  }
`;
```

#### Resolver實現
```typescript
// lib/graphql/resolvers/alert.resolver.ts
export const alertResolvers = {
  Query: {
    alerts: async (_, { filter, pagination, sort }, { dataSources }) => {
      return dataSources.alertAPI.getAlerts({ filter, pagination, sort });
    },
    
    alertStats: async (_, { timeRange }, { dataSources }) => {
      return dataSources.alertAPI.getAlertStats(timeRange);
    },
  },
  
  Mutation: {
    acknowledgeAlert: async (_, { id, note }, { dataSources, user }) => {
      return dataSources.alertAPI.acknowledgeAlert(id, user.id, note);
    },
    
    resolveAlert: async (_, { id, resolution }, { dataSources, user }) => {
      return dataSources.alertAPI.resolveAlert(id, user.id, resolution);
    },
  },
  
  Subscription: {
    alertCreated: {
      subscribe: (_, { severity }, { pubsub }) => {
        return pubsub.asyncIterator(['ALERT_CREATED']);
      },
    },
  },
};
```

## 實施階段

### Day 1: 基礎架構
- [ ] 創建AlertCard組件結構
- [ ] 實現GraphQL Schema
- [ ] 創建Alert Resolver
- [ ] 基本UI實現（列表視圖）
- [ ] 整合現有告警數據

### Day 2: 核心功能
- [ ] 實現過濾功能
- [ ] 添加排序選項
- [ ] 批量操作支援
- [ ] 整合通知系統
- [ ] Compact/Full模式切換

### Day 3: 高級功能
- [ ] WebSocket實時更新
- [ ] 告警歷史查看
- [ ] 規則管理界面
- [ ] 性能優化
- [ ] 測試和文檔

## 整合檢查清單

### 數據整合
- [ ] 連接現有告警數據庫
- [ ] 整合NotificationService
- [ ] 同步AlertRuleEngine
- [ ] 緩存策略實施

### UI整合
- [ ] 使用統一的Card樣式
- [ ] 整合useWidgetToast
- [ ] 響應式設計驗證
- [ ] 動畫效果實現

### 性能優化
- [ ] 虛擬滾動實施
- [ ] 查詢優化
- [ ] 緩存策略
- [ ] Bundle大小檢查

## 測試計劃

### 單元測試
```typescript
describe('AlertCard', () => {
  it('should render alert list correctly');
  it('should filter alerts by severity');
  it('should handle acknowledge action');
  it('should update on real-time events');
  it('should switch between compact and full mode');
});
```

### 集成測試
- GraphQL查詢和變更
- 實時訂閱功能
- 通知系統集成
- 權限控制

### E2E測試
- 完整的告警工作流
- 批量操作
- 實時更新
- 錯誤處理

## 性能指標

- 初始加載時間 < 500ms
- 列表渲染 < 16ms/幀
- 實時更新延遲 < 100ms
- Bundle大小增加 < 50KB

## 風險管理

1. **數據量問題**
   - 實施分頁
   - 使用虛擬滾動
   - 服務端過濾

2. **實時性能**
   - WebSocket連接池
   - 消息去重
   - 斷線重連

3. **向後兼容**
   - 保留舊API
   - 功能標誌
   - 漸進式遷移

## 成功標準

1. 統一所有告警相關功能
2. 提高告警處理效率50%
3. 減少告警響應時間
4. 用戶滿意度提升
5. 零生產環境錯誤

## 參考資源

- [AlertDashboard源碼](../app/(app)/admin/components/alerts/AlertDashboard.tsx)
- [NotificationService文檔](../lib/alerts/notifications/NotificationService.ts)
- [GraphQL最佳實踐](./graphql-best-practices.md)
- [Card架構指南](./card-architecture-guide.md)