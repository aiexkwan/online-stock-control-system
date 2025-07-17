# NewPennine WMS API 參考文檔

**版本**: v2.0.7  
**日期**: 2025-07-17  
**維護者**: Backend & API Team  
**狀態**: 生產就緒

## 概述

本文檔提供 NewPennine 倉庫管理系統的完整 API 參考，包括監控 API、告警 API、健康檢查 API 和業務邏輯 API。所有 API 都遵循 RESTful 設計原則，支援 JSON 格式的請求和響應。

## 基礎配置

### API 端點
```
基礎URL: https://your-domain.com
健康檢查: /api/v1/health, /api/v2/health
性能指標: /api/v1/metrics
告警管理: /api/v1/alerts/*
業務API: /api/v1/pallets, /api/v1/inventory
```

### 認證
所有 API 請求需要包含認證頭：
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

## 監控和健康檢查 API

### 1. 基本健康檢查

```http
GET /api/v1/health
```

**響應範例:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-17T10:00:00Z",
  "uptime": "2d 4h 32m",
  "version": "v2.0.7",
  "environment": "production"
}
```

### 2. 進階健康檢查

```http
GET /api/v2/health
```

**響應範例:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-17T10:00:00Z",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": "15ms",
      "connections": 12
    },
    "cache": {
      "status": "healthy",
      "hitRate": "95.2%",
      "memory": "128MB"
    }
  },
  "performance": {
    "cpuUsage": "45%",
    "memoryUsage": "62%",
    "diskUsage": "38%"
  }
}
```

### 3. 性能指標

```http
GET /api/v1/metrics
```

**響應範例:**
```json
{
  "api_response_time": {
    "avg": "120ms",
    "p95": "250ms",
    "p99": "500ms"
  },
  "database_query_time": {
    "avg": "45ms",
    "slow_queries": 3
  },
  "error_rate": "0.02%",
  "active_users": 15,
  "memory_usage": "512MB",
  "cpu_usage": "45%"
}
```

### 4. 緩存指標

```http
GET /api/v1/cache/metrics
```

**響應範例:**
```json
{
  "hit_rate": "95.2%",
  "miss_rate": "4.8%",
  "total_requests": 10000,
  "memory_usage": "128MB",
  "evictions": 5,
  "keys_count": 2500
}
```

## 告警管理 API

### 1. 告警規則管理

#### 獲取所有告警規則
```http
GET /api/v1/alerts/rules
```

**響應範例:**
```json
{
  "rules": [
    {
      "id": "rule-001",
      "name": "High API Response Time",
      "level": "warning",
      "metric": "api_response_time",
      "condition": "greater_than",
      "threshold": 2000,
      "enabled": true,
      "created_at": "2025-07-17T10:00:00Z"
    }
  ],
  "total": 7,
  "page": 1,
  "limit": 20
}
```

#### 創建告警規則
```http
POST /api/v1/alerts/rules
Content-Type: application/json

{
  "name": "High Memory Usage",
  "description": "Alert when memory usage exceeds 85%",
  "level": "warning",
  "metric": "memory_usage",
  "condition": "greater_than",
  "threshold": 85,
  "timeWindow": 300,
  "evaluationInterval": 60,
  "notifications": [
    {
      "channel": "email",
      "config": {
        "recipients": ["ops@newpennine.com"]
      }
    }
  ]
}
```

#### 更新告警規則
```http
PUT /api/v1/alerts/rules/{rule-id}
Content-Type: application/json

{
  "threshold": 90,
  "enabled": false
}
```

#### 刪除告警規則
```http
DELETE /api/v1/alerts/rules/{rule-id}
```

### 2. 告警歷史

#### 獲取告警歷史
```http
GET /api/v1/alerts/history?limit=50&page=1&level=warning
```

**響應範例:**
```json
{
  "alerts": [
    {
      "id": "alert-001",
      "rule_id": "rule-001",
      "level": "warning",
      "message": "API response time exceeded 2000ms",
      "value": 2150,
      "threshold": 2000,
      "triggered_at": "2025-07-17T10:00:00Z",
      "resolved_at": "2025-07-17T10:05:00Z",
      "duration": "5m"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 50
}
```

### 3. 通知配置

#### 獲取通知設定
```http
GET /api/v1/alerts/notifications
```

#### 更新通知設定
```http
PUT /api/v1/alerts/notifications
Content-Type: application/json

{
  "email": {
    "enabled": true,
    "recipients": ["ops@newpennine.com"],
    "smtp": {
      "host": "smtp.gmail.com",
      "port": 587,
      "user": "alerts@newpennine.com"
    }
  },
  "slack": {
    "enabled": true,
    "webhook_url": "https://hooks.slack.com/services/...",
    "channel": "#newpennine-alerts"
  }
}
```

## 業務邏輯 API

### 1. 棧板管理

#### 獲取棧板列表
```http
GET /api/v1/pallets?limit=20&page=1&product_code=PT001
```

**響應範例:**
```json
{
  "pallets": [
    {
      "plt_num": "211224/0001",
      "series": "SER123456",
      "product_code": "PT001",
      "product_qty": 100,
      "created_at": "2024-12-21T10:00:00Z",
      "created_by": "user123"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

#### 創建棧板
```http
POST /api/v1/pallets
Content-Type: application/json

{
  "product_code": "PT001",
  "product_qty": 100,
  "series": "SER123456"
}
```

#### 獲取棧板詳情
```http
GET /api/v1/pallets/{plt_num}
```

### 2. 庫存管理

#### 獲取庫存水平
```http
GET /api/v1/inventory/levels?product_code=PT001
```

**響應範例:**
```json
{
  "levels": [
    {
      "product_code": "PT001",
      "description": "產品描述",
      "total_qty": 500,
      "injection_qty": 100,
      "pipeline_qty": 200,
      "await_qty": 150,
      "fold_qty": 50,
      "bulk_qty": 0,
      "pallet_count": 5
    }
  ]
}
```

#### 庫存轉移
```http
POST /api/v1/inventory/transfer
Content-Type: application/json

{
  "plt_num": "211224/0001",
  "from_location": "await",
  "to_location": "pipeline",
  "quantity": 50
}
```

### 3. 訂單管理

#### 獲取訂單列表
```http
GET /api/v1/orders?status=pending&limit=20
```

#### 訂單裝載
```http
POST /api/v1/orders/{order_id}/load
Content-Type: application/json

{
  "pallets": [
    {
      "plt_num": "211224/0001",
      "quantity": 100
    }
  ]
}
```

## RPC 函數 API

### 1. 棧板號碼生成

```http
POST /api/v1/rpc/generate-pallet-numbers
Content-Type: application/json

{
  "count": 5,
  "session_id": "session-123"
}
```

**響應範例:**
```json
{
  "success": true,
  "pallet_numbers": [
    "211224/0001",
    "211224/0002",
    "211224/0003",
    "211224/0004",
    "211224/0005"
  ],
  "session_id": "session-123"
}
```

### 2. 查詢執行

```http
POST /api/v1/rpc/execute-query
Content-Type: application/json

{
  "query": "SELECT * FROM stock_level WHERE quantity < 100",
  "parameters": []
}
```

### 3. 統計數據

```http
GET /api/v1/rpc/dashboard-stats
```

**響應範例:**
```json
{
  "daily_production": {
    "pallets_created": 25,
    "total_quantity": 2500
  },
  "order_progress": {
    "pending_orders": 5,
    "completed_orders": 15
  },
  "inventory_summary": {
    "total_products": 150,
    "low_stock_products": 3
  }
}
```

## 檔案管理 API

### 1. 檔案上傳

```http
POST /api/v1/files/upload
Content-Type: multipart/form-data

{
  "file": [binary data],
  "type": "label",
  "plt_num": "211224/0001"
}
```

### 2. 檔案下載

```http
GET /api/v1/files/{file_id}
```

### 3. 檔案列表

```http
GET /api/v1/files?type=label&limit=20
```

## 報表 API

### 1. 生成報表

```http
POST /api/v1/reports/generate
Content-Type: application/json

{
  "type": "inventory",
  "format": "excel",
  "filters": {
    "product_code": "PT001",
    "date_range": {
      "start": "2025-07-01",
      "end": "2025-07-17"
    }
  }
}
```

### 2. 下載報表

```http
GET /api/v1/reports/{report_id}/download
```

## 錯誤處理

### 標準錯誤格式
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters",
    "details": "Parameter 'product_code' is required",
    "timestamp": "2025-07-17T10:00:00Z",
    "request_id": "req-123456"
  }
}
```

### 常見錯誤碼
- `400 BAD_REQUEST`: 請求格式錯誤
- `401 UNAUTHORIZED`: 未授權訪問
- `403 FORBIDDEN`: 權限不足
- `404 NOT_FOUND`: 資源不存在
- `409 CONFLICT`: 資源衝突
- `422 VALIDATION_ERROR`: 驗證失敗
- `429 RATE_LIMIT_EXCEEDED`: 超出速率限制
- `500 INTERNAL_ERROR`: 服務器內部錯誤

## API 版本管理

### 版本控制策略
- 主版本: 破壞性變更
- 次版本: 新功能添加
- 修訂版本: 錯誤修復

### 版本標識
```http
# 使用 URL 路徑
GET /api/v1/health
GET /api/v2/health

# 使用 Header
GET /api/health
Accept: application/vnd.newpennine.v2+json
```

## 速率限制

### 限制規則
```
認證用戶: 1000 請求/小時
管理員: 5000 請求/小時
系統監控: 無限制
```

### 響應標頭
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642723200
```

## 批量操作

### 批量創建棧板
```http
POST /api/v1/pallets/batch
Content-Type: application/json

{
  "pallets": [
    {
      "product_code": "PT001",
      "product_qty": 100
    },
    {
      "product_code": "PT002",
      "product_qty": 200
    }
  ]
}
```

### 批量更新
```http
PATCH /api/v1/pallets/batch
Content-Type: application/json

{
  "updates": [
    {
      "plt_num": "211224/0001",
      "product_qty": 150
    }
  ]
}
```

## 分頁和過濾

### 分頁參數
```http
GET /api/v1/pallets?page=1&limit=20&sort=created_at&order=desc
```

### 過濾參數
```http
GET /api/v1/pallets?product_code=PT001&created_after=2025-07-01&status=active
```

## WebSocket 實時 API

### 連接端點
```
ws://localhost:3000/ws/realtime
```

### 訂閱事件
```json
{
  "type": "subscribe",
  "channel": "pallets",
  "filters": {
    "product_code": "PT001"
  }
}
```

### 事件格式
```json
{
  "type": "pallet_created",
  "data": {
    "plt_num": "211224/0001",
    "product_code": "PT001",
    "product_qty": 100
  },
  "timestamp": "2025-07-17T10:00:00Z"
}
```

## SDK 使用範例

### JavaScript/TypeScript
```typescript
import { NewPennineAPI } from '@newpennine/api-client';

const api = new NewPennineAPI({
  baseURL: 'https://your-domain.com',
  apiKey: 'your-api-key'
});

// 健康檢查
const health = await api.health.check();

// 獲取棧板
const pallets = await api.pallets.list({
  limit: 20,
  productCode: 'PT001'
});

// 創建告警規則
const rule = await api.alerts.rules.create({
  name: 'High Memory Usage',
  metric: 'memory_usage',
  threshold: 85
});
```

### Python
```python
from newpennine_api import NewPennineAPI

api = NewPennineAPI(
    base_url='https://your-domain.com',
    api_key='your-api-key'
)

# 健康檢查
health = api.health.check()

# 獲取指標
metrics = api.metrics.get()

# 創建告警規則
rule = api.alerts.rules.create({
    'name': 'High CPU Usage',
    'metric': 'cpu_usage',
    'threshold': 80
})
```

## 測試和開發

### 測試端點
```http
POST /api/v1/test/create-sample-data
GET /api/v1/test/reset-database
```

### 開發工具
- **API 文檔**: `/api/docs`
- **Swagger UI**: `/api/swagger`
- **Postman Collection**: `/api/postman.json`

## 最佳實踐

### 1. 錯誤處理
```javascript
try {
  const response = await api.pallets.create(palletData);
  console.log('Success:', response.data);
} catch (error) {
  if (error.response?.status === 422) {
    console.error('Validation error:', error.response.data.error.details);
  } else {
    console.error('API error:', error.message);
  }
}
```

### 2. 重試機制
```javascript
const retryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error) => {
    return error.response?.status >= 500;
  }
};
```

### 3. 緩存策略
```javascript
const cacheConfig = {
  ttl: 300, // 5 分鐘
  maxSize: 1000,
  strategy: 'lru'
};
```

## 安全建議

1. **使用 HTTPS**: 所有 API 調用必須使用 HTTPS
2. **令牌管理**: 定期更新 API 密鑰
3. **輸入驗證**: 驗證所有輸入參數
4. **速率限制**: 實施適當的速率限制
5. **日誌記錄**: 記錄所有 API 調用

---

**版本**: v2.0.7  
**建立日期**: 2025-07-17  
**最後更新**: 2025-07-17  
**下次審查**: 2025-10-17  

**維護者**: NewPennine Backend & API Team  
**技術支援**: api-support@newpennine.com  
**文檔路徑**: `/docs/manual/api-reference.md`