# Analysis Module

這個模組提供分析相關的 API 端點，主要用於儀表板分析圖表的數據獲取。

## 功能特點

- ACO 訂單進度卡片數據
- ACO 訂單進度圖表數據  
- 支援多種時間範圍和指標
- 內建緩存機制以提升性能
- 完整的錯誤處理

## API 端點

### GET /api/v1/analysis/aco-order-progress-cards

獲取 ACO 訂單進度卡片數據，提供統計概覽。

**查詢參數：**
- `startDate` (可選): 開始日期 (YYYY-MM-DD)
- `endDate` (可選): 結束日期 (YYYY-MM-DD)  
- `warehouse` (可選): 倉庫篩選
- `status` (可選): 訂單狀態篩選
- `customerRef` (可選): 客戶參考篩選

**響應格式：**
```json
{
  "cards": [
    {
      "id": "total_orders",
      "title": "Total Orders",
      "value": 156,
      "previousValue": 142,
      "percentageChange": 9.86,
      "trend": "up",
      "description": "Orders processed",
      "category": "orders",
      "icon": "package",
      "color": "blue"
    }
  ],
  "totalCards": 4,
  "dateRange": "2025-01-01 to 2025-01-31",
  "lastUpdated": "2025-07-15T10:30:00Z",
  "metadata": {
    "warehouse": "all",
    "status": "all"
  }
}
```

### GET /api/v1/analysis/aco-order-progress-chart

獲取 ACO 訂單進度圖表的時間序列數據。

**查詢參數：**
- `startDate` (可選): 開始日期 (YYYY-MM-DD)
- `endDate` (可選): 結束日期 (YYYY-MM-DD)
- `timeframe` (可選): 時間聚合方式 (daily, weekly, monthly, quarterly)
- `metric` (可選): 指標類型 (order_count, completion_rate, processing_time, order_value)
- `warehouse` (可選): 倉庫篩選
- `status` (可選): 訂單狀態篩選
- `customerRef` (可選): 客戶參考篩選
- `limit` (可選): 數據點數量限制

**響應格式：**
```json
{
  "data": [
    {
      "date": "2025-07-15",
      "value": 25,
      "previousValue": 20,
      "metadata": {
        "orderCount": 25,
        "completionRate": 0.85
      }
    }
  ],
  "config": {
    "type": "line",
    "title": "ACO Order Progress Over Time",
    "xAxisLabel": "Date",
    "yAxisLabel": "Order Count",
    "colors": ["#3b82f6", "#ef4444", "#10b981"],
    "height": 400
  },
  "totalDataPoints": 30,
  "dateRange": "2025-01-01 to 2025-01-31",
  "summary": {
    "average": 22.5,
    "minimum": 15,
    "maximum": 30,
    "trend": "increasing"
  },
  "lastUpdated": "2025-07-15T10:30:00Z",
  "queryParams": {
    "timeframe": "daily",
    "metric": "order_count",
    "warehouse": "W001"
  }
}
```

## 認證與權限

所有端點都需要：
- JWT 認證 token
- 適當的 widget 權限

## 緩存策略

- 卡片數據：5 分鐘緩存
- 圖表數據：10 分鐘緩存
- 使用查詢參數作為緩存鍵

## 數據源

主要從以下表格獲取數據：
- `record_aco`: ACO 訂單數據
- 相關的 RPC 函數（如果可用）

## 錯誤處理

所有錯誤都會返回標準化的錯誤響應：
```json
{
  "status": 500,
  "error": "Failed to fetch ACO order progress cards",
  "message": "Database connection failed",
  "timestamp": "2025-07-15T10:30:00Z"
}
```

## 擴展性

這個模組設計為可擴展的，未來可以輕易添加新的分析端點：
- 庫存周轉分析
- 用戶活動熱圖
- 熱門產品庫存分析
- 庫存盤點準確性趨勢

## 開發指南

### 添加新的分析端點

1. 在 `dto/` 目錄創建新的 query 和 response DTOs
2. 在 `AnalysisService` 添加新的方法
3. 在 `AnalysisController` 添加新的路由
4. 更新此文檔

### 性能優化

- 使用 RPC 函數處理複雜查詢
- 實施適當的緩存策略
- 限制返回的數據點數量
- 使用分頁處理大量數據

### 測試

創建單元測試和集成測試：
- 測試各種查詢參數組合
- 測試錯誤處理
- 測試緩存功能
- 測試數據轉換邏輯
