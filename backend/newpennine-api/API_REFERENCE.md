# NewPennine API 參考文檔

## 概述
本文檔提供 NewPennine 系統嘅完整 API 參考，包括 REST API、RPC 函數同 Supabase 實時訂閱。

## 基礎配置

### API 端點
```
基礎URL: https://your-project.supabase.co
REST API: /rest/v1
RPC API: /rest/v1/rpc
Auth API: /auth/v1
Storage API: /storage/v1
```

### 認證
所有 API 請求需要包含認證頭：
```http
Authorization: Bearer YOUR_ACCESS_TOKEN
apikey: YOUR_ANON_KEY
```

## REST API

### 棧板管理

#### 獲取棧板列表
```http
GET /rest/v1/record_palletinfo
```

查詢參數：
- `product_code`: 產品代碼過濾
- `created_at`: 創建時間過濾
- `limit`: 返回數量限制
- `offset`: 分頁偏移

響應範例：
```json
[
  {
    "plt_num": "211224/0001",
    "series": "SER123456",
    "product_code": "PT001",
    "product_qty": 100,
    "created_at": "2024-12-21T10:00:00Z"
  }
]
```

#### 創建棧板
```http
POST /rest/v1/record_palletinfo
Content-Type: application/json

{
  "plt_num": "211224/0001",
  "series": "SER123456",
  "product_code": "PT001",
  "product_qty": 100
}
```

### 庫存查詢

#### 獲取庫存水平
```http
GET /rest/v1/stock_level
```

查詢參數：
- `product_code`: 產品代碼
- `quantity.gte`: 最小數量
- `quantity.lte`: 最大數量

#### 獲取庫存位置
```http
GET /rest/v1/record_inventory?plt_num=eq.{pallet_number}
```

響應包含各位置數量：
```json
{
  "plt_num": "211224/0001",
  "injection": 0,
  "pipeline": 0,
  "await": 100,
  "fold": 0,
  "bulk": 0,
  "prebook": 0,
  "backcarpark": 0,
  "damage": 0
}
```

### 歷史記錄

#### 查詢操作歷史
```http
GET /rest/v1/record_history
```

查詢參數：
- `plt_num`: 棧板號碼
- `action`: 操作類型
- `time`: 時間範圍
- `order`: 排序方式

## RPC 函數

### 棧板號碼生成

#### generate_atomic_pallet_numbers_v5
生成唯一棧板號碼
```http
POST /rest/v1/rpc/generate_atomic_pallet_numbers_v5
Content-Type: application/json

{
  "p_count": 5,
  "p_session_id": "session-123"
}
```

響應：
```json
[
  "211224/0001",
  "211224/0002",
  "211224/0003",
  "211224/0004",
  "211224/0005"
]
```

### 訂單處理

#### rpc_load_pallet_to_order
裝載棧板到訂單
```http
POST /rest/v1/rpc/rpc_load_pallet_to_order
Content-Type: application/json

{
  "p_order_ref": "ORD123456",
  "p_pallet_input": "211224/0001",
  "p_user_id": 1001,
  "p_user_name": "John Doe"
}
```

響應：
```json
{
  "success": true,
  "message": "棧板成功裝載",
  "loaded_quantity": 100,
  "remaining_quantity": 400
}
```

### 查詢執行

#### execute_sql_query
執行安全 SQL 查詢（僅 SELECT）
```http
POST /rest/v1/rpc/execute_sql_query
Content-Type: application/json

{
  "query": "SELECT * FROM stock_level WHERE quantity < 100"
}
```

### 統計函數

#### get_admin_dashboard_stats
獲取管理面板統計數據
```http
POST /rest/v1/rpc/get_admin_dashboard_stats
Content-Type: application/json

{}
```

響應包含：
- 每日生產統計
- ACO訂單進度
- 庫存摘要
- 轉移統計
- GRN收貨數據

## Supabase 實時訂閱

### 訂閱棧板更新
```javascript
const subscription = supabase
  .channel('pallets')
  .on('postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'record_palletinfo'
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

### 訂閱庫存變化
```javascript
const inventoryChannel = supabase
  .channel('inventory')
  .on('postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'record_inventory'
    },
    (payload) => {
      console.log('Inventory updated!', payload)
    }
  )
  .subscribe()
```

## 文件上傳 API

### 上傳標籤圖片
```http
POST /storage/v1/object/labels/{filename}
Content-Type: image/png

[Binary data]
```

### 獲取文件URL
```javascript
const { data: publicUrl } = supabase
  .storage
  .from('labels')
  .getPublicUrl('path/to/file.png')
```

## 錯誤處理

### 錯誤格式
```json
{
  "error": {
    "code": "23505",
    "message": "duplicate key value violates unique constraint",
    "details": "Key (plt_num)=(211224/0001) already exists."
  }
}
```

### 常見錯誤碼
- `400`: 請求格式錯誤
- `401`: 未授權
- `403`: 權限不足
- `404`: 資源不存在
- `409`: 衝突（如重複鍵）
- `500`: 服務器內部錯誤

## 批量操作

### 批量插入
```http
POST /rest/v1/record_palletinfo
Content-Type: application/json
Prefer: return=representation

[
  {
    "plt_num": "211224/0001",
    "product_code": "PT001",
    "product_qty": 100
  },
  {
    "plt_num": "211224/0002",
    "product_code": "PT001",
    "product_qty": 100
  }
]
```

### 批量更新
```http
PATCH /rest/v1/stock_level?product_code=in.(PT001,PT002)
Content-Type: application/json

{
  "last_updated": "2024-12-21T10:00:00Z"
}
```

## 分頁同排序

### 分頁
```http
GET /rest/v1/record_palletinfo?limit=20&offset=40
```

### 排序
```http
GET /rest/v1/record_palletinfo?order=created_at.desc
```

### 複合排序
```http
GET /rest/v1/record_palletinfo?order=product_code.asc,created_at.desc
```

## 過濾操作符

- `eq`: 等於
- `neq`: 不等於
- `gt`: 大於
- `gte`: 大於等於
- `lt`: 小於
- `lte`: 小於等於
- `like`: 模糊匹配
- `ilike`: 不區分大小寫模糊匹配
- `in`: 在列表中
- `is`: IS (用於 NULL)

範例：
```http
GET /rest/v1/stock_level?quantity=gte.100&product_code=like.PT*
```

## Rate Limiting

API 請求限制：
- 認證用戶: 1000 請求/小時
- 匿名用戶: 100 請求/小時

超出限制返回：
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 3600
```

## Webhook

### 設置 Webhook
通過 Supabase 控制台設置數據庫觸發器同 Webhook：

1. 創建數據庫觸發器
2. 配置 Webhook URL
3. 設置事件類型（INSERT, UPDATE, DELETE）

### Webhook 負載格式
```json
{
  "type": "INSERT",
  "table": "record_palletinfo",
  "record": {
    "plt_num": "211224/0001",
    "product_code": "PT001",
    "product_qty": 100
  },
  "schema": "public",
  "old_record": null
}
```

## SDK 使用範例

### JavaScript/TypeScript
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 查詢數據
const { data, error } = await supabase
  .from('record_palletinfo')
  .select('*')
  .eq('product_code', 'PT001')
  .order('created_at', { ascending: false })
  .limit(10)

// 調用 RPC
const { data: palletNumbers } = await supabase
  .rpc('generate_atomic_pallet_numbers_v5', {
    p_count: 5,
    p_session_id: 'session-123'
  })
```

## 最佳實踐

1. **使用連接池**: 避免為每個請求創建新連接
2. **批量操作**: 盡可能使用批量插入/更新
3. **選擇字段**: 只查詢需要嘅字段
4. **使用索引**: 確保查詢條件有適當索引
5. **錯誤重試**: 實施指數退避重試策略
6. **緩存策略**: 對不常變化嘅數據實施緩存

## 安全建議

1. **永遠不要**在客戶端暴露 service_role key
2. **使用** RLS 政策保護敏感數據
3. **驗證**所有用戶輸入
4. **限制** API 請求頻率
5. **記錄**所有關鍵操作
6. **加密**敏感數據

---

*更多詳細信息，請參考 [Supabase 官方文檔](https://supabase.com/docs)*
