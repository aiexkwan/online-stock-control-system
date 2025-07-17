# 監控端點文檔

## 概述

本文檔描述了 NewPennine 倉庫管理系統新增的四個企業級監控端點，提供深度健康檢查、業務指標監控、資料庫性能監控和告警配置管理功能。

## 端點列表

### 1. 深度健康檢查 `/api/v1/health/deep`

**功能**: 提供詳細的系統健康狀態檢查，包括資料庫連接、Supabase 服務狀態、Redis 連接和系統資源監控。

**方法**: `GET`, `HEAD`

**回應格式**:
```json
{
  "status": "healthy | degraded | unhealthy",
  "version": "v1",
  "timestamp": "2025-07-17T10:30:00Z",
  "uptime": "3600s",
  "environment": "production",
  "services": {
    "database": {
      "service": "database",
      "status": "healthy",
      "responseTime": 45,
      "details": {
        "tablesChecked": 3,
        "successfulQueries": 3,
        "avgResponseTime": 15
      }
    },
    "supabase": { ... },
    "redis": { ... },
    "system": { ... }
  },
  "summary": {
    "totalServices": 4,
    "healthyServices": 4,
    "degradedServices": 0,
    "unhealthyServices": 0,
    "overallStatus": "healthy"
  }
}
```

**使用範例**:
```bash
curl -X GET http://localhost:3000/api/v1/health/deep
```

### 2. 業務指標監控 `/api/v1/metrics/business`

**功能**: 監控核心業務運營指標，包括 QC 標籤列印、庫存轉移、訂單處理和倉庫操作統計。

**方法**: `GET`, `HEAD`

**回應格式**:
```json
{
  "status": "success",
  "timestamp": "2025-07-17T10:30:00Z",
  "metrics": {
    "qcLabelPrinting": {
      "todayCount": 150,
      "yesterdayCount": 142,
      "weeklyCount": 1050,
      "monthlyCount": 4200,
      "avgProcessingTime": 2.5,
      "errorRate": 1.2,
      "topProducts": [...]
    },
    "stockTransfer": {
      "todayCount": 89,
      "pendingCount": 12,
      "completedToday": 77,
      "avgTransferTime": 15.5,
      "topLocations": [...]
    },
    "orderProcessing": { ... },
    "warehouseOperations": { ... },
    "systemActivity": { ... }
  },
  "summary": {
    "totalOperations": 294,
    "systemHealth": "good",
    "alerts": []
  }
}
```

**使用範例**:
```bash
curl -X GET http://localhost:3000/api/v1/metrics/business
```

### 3. 資料庫性能監控 `/api/v1/metrics/database`

**功能**: 詳細的資料庫性能指標，包括連接池狀態、查詢性能、RPC 函數統計和系統健康監控。

**方法**: `GET`, `HEAD`

**回應格式**:
```json
{
  "status": "success",
  "timestamp": "2025-07-17T10:30:00Z",
  "databaseVersion": "PostgreSQL 15.x (Supabase)",
  "metrics": {
    "connectionPool": {
      "totalConnections": 25,
      "activeConnections": 18,
      "utilizationRate": 18
    },
    "queryPerformance": {
      "averageQueryTime": 125.5,
      "slowQueriesCount": 2,
      "queriesPerSecond": 8.0,
      "cacheHitRate": 85.5,
      "slowestQueries": [...]
    },
    "rpcFunctions": {
      "totalCalls": 2830,
      "averageExecutionTime": 45.7,
      "failureRate": 1.1,
      "mostCalledFunctions": [...]
    },
    "systemHealth": { ... }
  },
  "summary": {
    "overallHealth": "good",
    "criticalIssues": [],
    "recommendations": [...]
  }
}
```

**使用範例**:
```bash
curl -X GET http://localhost:3000/api/v1/metrics/database
```

### 4. 告警配置管理 `/api/v1/alerts/config`

**功能**: 系統告警規則和通知管理，支援閾值配置、通知設定和告警規則管理。

**方法**: `GET`, `PUT`, `POST`, `DELETE`, `HEAD`

#### GET - 獲取告警配置
```json
{
  "status": "success",
  "timestamp": "2025-07-17T10:30:00Z",
  "config": {
    "enabled": true,
    "thresholds": {
      "system": {
        "cpu": { "warning": 70, "critical": 85 },
        "memory": { "warning": 75, "critical": 90 }
      },
      "business": { ... },
      "database": { ... }
    },
    "notifications": {
      "email": {
        "enabled": true,
        "recipients": ["admin@newpennine.com"]
      },
      "slack": { ... }
    }
  },
  "rules": [...],
  "stats": {
    "totalRules": 5,
    "activeRules": 5,
    "recentAlerts": 3
  }
}
```

#### PUT - 更新告警配置
```bash
curl -X PUT http://localhost:3000/api/v1/alerts/config \
  -H "Content-Type: application/json" \
  -d '{
    "thresholds": {
      "system": {
        "cpu": { "warning": 75, "critical": 90 }
      }
    }
  }'
```

#### POST - 創建新告警規則
```bash
curl -X POST http://localhost:3000/api/v1/alerts/config \
  -H "Content-Type: application/json" \
  -d '{
    "name": "高 CPU 使用率告警",
    "type": "threshold",
    "category": "system",
    "condition": {
      "metric": "system.cpu",
      "operator": "gt",
      "value": 85,
      "duration": 300
    },
    "actions": [
      {
        "type": "email",
        "target": "admin@newpennine.com"
      }
    ]
  }'
```

#### DELETE - 刪除告警規則
```bash
curl -X DELETE "http://localhost:3000/api/v1/alerts/config?id=rule-123"
```

## 監控集成

### Prometheus 集成
這些端點可以直接與 Prometheus 集成進行監控：

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'newpennine-monitoring'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/v1/metrics/business'
    scrape_interval: 30s
```

### Grafana 儀表板
建議創建以下儀表板：

1. **系統健康儀表板** - 使用 `/api/v1/health/deep`
2. **業務操作儀表板** - 使用 `/api/v1/metrics/business`
3. **資料庫性能儀表板** - 使用 `/api/v1/metrics/database`
4. **告警管理儀表板** - 使用 `/api/v1/alerts/config`

### 告警規則建議

#### 系統告警
- CPU 使用率 > 85% 持續 5 分鐘
- 記憶體使用率 > 90% 持續 3 分鐘
- 磁碟使用率 > 95%

#### 業務告警
- QC 標籤列印錯誤率 > 5%
- 待處理庫存轉移 > 50 個
- 系統響應時間 > 1000ms

#### 資料庫告警
- 連接池使用率 > 90%
- 平均查詢時間 > 5000ms
- RPC 函數失敗率 > 10%

## 性能考量

- 所有端點都設置了適當的快取控制標頭
- 支援 HEAD 請求進行快速健康檢查
- 使用並行查詢減少響應時間
- 實施適當的錯誤處理和優雅降級

## 安全考量

- 所有端點都應該在生產環境中進行適當的身份驗證
- 建議使用 API 密鑰或 JWT 進行保護
- 敏感信息（如資料庫密碼）不會暴露在響應中
- 實施適當的速率限制

## 測試

執行以下命令測試所有端點：

```bash
# 使用提供的測試腳本
node test-new-endpoints.js

# 或手動測試
curl -X GET http://localhost:3000/api/v1/health/deep
curl -X GET http://localhost:3000/api/v1/metrics/business
curl -X GET http://localhost:3000/api/v1/metrics/database
curl -X GET http://localhost:3000/api/v1/alerts/config
```

## 故障排除

### 常見問題

1. **端點返回 500 錯誤**
   - 檢查 Supabase 連接配置
   - 確保 Redis 服務正在運行
   - 查看服務器日誌獲取詳細錯誤信息

2. **數據不準確**
   - 確保資料庫表結構正確
   - 檢查 RPC 函數是否正常工作
   - 驗證快取設置

3. **響應時間過長**
   - 優化資料庫查詢
   - 考慮增加快取層
   - 檢查網絡連接

### 日誌位置
- 應用日誌：檢查 Next.js 控制台輸出
- 錯誤日誌：查看 `console.error` 輸出
- 效能日誌：使用內建的效能監控

## 版本資訊

- **版本**: v1
- **API 版本**: v1
- **兼容性**: Next.js 14, TypeScript, Supabase
- **更新日期**: 2025-07-17

## 支援

如有問題或需要支援，請聯繫：
- 技術支援：tech@newpennine.com
- 系統管理：admin@newpennine.com