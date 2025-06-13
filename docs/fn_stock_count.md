# Stock Count (Cycle Count) 功能規劃

## 功能概述

盤點系統允許用戶通過掃描 QR Code 來進行庫存盤點，自動記錄數量並更新庫存信息。

## 頁面結構

### 1. 初始狀態
- 顯示 "Scan To Start" 區域
- "Remain To Count" 區域預設隱藏

### 2. 掃描流程
- 用戶掃描 PALLET LABEL 上的 QR CODE
- 返回 PALLET SERIES
- 系統查詢相關數據

### 3. 數據處理流程
- 查詢 pallet 信息
- 檢查當天記錄
- 處理新增或更新記錄
- 更新顯示信息

## 數據庫表結構

### record_palletinfo
- `series` - Pallet 系列號
- `plt_num` - Pallet 編號
- `product_code` - 產品代碼
- `product_qty` - 產品數量

### record_stocktake
- `uuid` - 自動生成
- `created_at` - 自動生成
- `product_code` - 產品代碼
- `plt_num` - Pallet 編號
- `product_desc` - 產品描述
- `remain_qty` - 剩餘數量
- `counted_qty` - 已盤點數量
- `counted_id` - 盤點員 ID
- `counted_name` - 盤點員姓名

### stock_level
- `product_code` - 產品代碼
- `stock_level` - 庫存水平
- `update_time` - 更新時間

### data_code
- `code` - 產品代碼
- `description` - 產品描述

### data_id
- `email` - 用戶郵箱
- `id` - 用戶 ID
- `name` - 用戶姓名

## 業務邏輯流程

### 1. QR Code 掃描
```
用戶掃描 QR Code
  ↓
獲取 PALLET SERIES
  ↓
查詢 record_palletinfo 表
  ↓
返回 plt_num, product_code, product_qty
```

### 2. 檢查當天記錄
```
使用 product_code
  ↓
查詢 record_stocktake 表 (當天 + product_code)
  ↓
判斷是否存在記錄
```

#### 2.1 無當天記錄 (首次盤點該產品)
```
查詢 stock_level 表
  ↓
獲取當天 stock_level
  ↓
創建 record_stocktake 記錄:
- product_code: 掃描獲得
- plt_num: 留空
- product_desc: 從 data_code 查詢
- remain_qty: stock_level
- counted_qty: 0
- counted_id: 從 data_id 查詢
- counted_name: 從 data_id 查詢
```

#### 2.2 有當天記錄 (繼續盤點)
```
檢查 plt_num 是否已存在
  ↓
如果存在: 顯示錯誤 "This pallet already be counted today"
  ↓
如果不存在: 顯示數字鍵盤輸入數量
  ↓
創建新的 record_stocktake 記錄:
- product_code: 掃描獲得
- plt_num: 掃描獲得
- product_desc: 從 data_code 查詢
- remain_qty: 最新 remain_qty - 輸入數量
- counted_qty: 輸入數量
- counted_id: 從 data_id 查詢
- counted_name: 從 data_id 查詢
```

### 3. 更新顯示
```
成功處理後
  ↓
顯示 "Remain To Count" 區域
  ↓
顯示更新後的 remain_qty
```

## API 設計

### 1. 掃描 QR Code API
```typescript
POST /api/stock-count/scan
Body: { qrCode: string }
Response: {
  success: boolean,
  data: {
    plt_num: string,
    product_code: string,
    product_qty: number,
    series: string
  },
  error?: string
}
```

### 2. 處理盤點 API
```typescript
POST /api/stock-count/process
Body: {
  plt_num: string,
  product_code: string,
  counted_qty?: number // 可選，用於繼續盤點時輸入數量
}
Response: {
  success: boolean,
  data: {
    remain_qty: number,
    is_first_count: boolean,
    already_counted: boolean
  },
  error?: string
}
```

### 3. 獲取今日盤點狀態 API
```typescript
GET /api/stock-count/status
Response: {
  success: boolean,
  data: {
    total_products: number,
    counted_products: number,
    remaining_products: number
  }
}
```

## 組件設計

### 1. 主頁面組件 (CycleCountPage)
- 管理整體狀態
- 控制顯示邏輯
- 處理掃描結果

### 2. 掃描組件 (ScanToStart)
- QR Code 掃描功能
- 相機權限處理
- 掃描結果處理

### 3. 計數顯示組件 (RemainToCount)
- 顯示剩餘數量
- 動態更新數據

### 4. 數字鍵盤組件 (NumberPad)
- 數量輸入界面
- 驗證輸入
- 確認提交

## 錯誤處理

### 1. QR Code 錯誤
- 無效的 QR Code 格式
- 未找到對應的 Pallet 信息

### 2. 數據庫錯誤
- 查詢失敗
- 插入失敗
- 權限錯誤

### 3. 業務邏輯錯誤
- Pallet 已被盤點
- 用戶認證失敗
- 數量輸入無效

## 安全考慮

### 1. 用戶認證
- 確保用戶已登錄
- 驗證用戶權限

### 2. 數據驗證
- 驗證 QR Code 格式
- 驗證數量輸入
- 防止重複提交

### 3. 事務處理
- 確保數據一致性
- 回滾機制

## 性能優化

### 1. 數據庫查詢優化
- 使用索引
- 避免 N+1 查詢

### 2. 前端優化
- 組件懶加載
- 狀態管理優化

### 3. 緩存策略
- 用戶信息緩存
- 產品信息緩存

## 測試計劃

### 1. 單元測試
- API 函數測試
- 組件邏輯測試

### 2. 集成測試
- 掃描流程測試
- 數據庫操作測試

### 3. 用戶測試
- 掃描體驗測試
- 界面交互測試
