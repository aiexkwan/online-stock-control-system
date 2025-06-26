# 盤點（週期盤點）系統

## 概述

盤點系統係用嚟進行庫存盤點同驗證嘅核心功能，允許倉庫員工通過掃描QR碼或手動輸入棧板號碼嚟進行庫存點算。系統支援批量模式、即時驗證同準確嘅差異分析。

## 系統架構

### 主要頁面
- `/stock-take/cycle-count`: 週期盤點主頁面
- `/stock-take/report`: 盤點報表頁面

### 核心組件結構

#### 盤點頁面組件
- `app/stock-take/cycle-count/page.tsx`: 主盤點頁面
- `app/stock-take/cycle-count/ScanInterface.tsx`: 掃描介面組件
- `app/stock-take/cycle-count/BatchMode.tsx`: 批量模式組件
- `app/stock-take/cycle-count/NumberPad.tsx`: 觸控數字鍵盤

#### 報表組件
- `app/stock-take/report/page.tsx`: 盤點報表頁面
- `app/stock-take/report/StockTakeReportClient.tsx`: 報表客戶端組件
- `app/stock-take/report/components/DailySummaryCards.tsx`: 每日摘要卡片
- `app/stock-take/report/components/DetailedTable.tsx`: 詳細數據表格

#### 業務邏輯
- `app/stock-take/cycle-count/api.ts`: API調用函數
- `app/stock-take/cycle-count/types.ts`: 類型定義
- `app/stock-take/cycle-count/utils.ts`: 工具函數

## 數據流向

### 資料庫表
- `record_stocktake`: 盤點交易記錄
  - `product_code`: 產品代碼
  - `plt_num`: 棧板號碼（首次盤點為null）
  - `product_desc`: 產品描述
  - `remain_qty`: 剩餘數量
  - `counted_qty`: 實際點算數量
  - `counted_id`: 盤點員ID
  - `counted_name`: 盤點員姓名
  - `created_at`: 盤點時間戳

- `stock_level`: 當前系統庫存水平
  - `product_code`: 產品代碼
  - `stock_level`: 系統庫存數量
  - `update_time`: 最後更新時間

- `record_palletinfo`: 棧板主數據
  - `series`: 系列號（QR碼內容）
  - `plt_num`: 棧板號碼
  - `product_code`: 產品代碼
  - `product_qty`: 產品數量

- `data_code`: 產品主數據
  - `code`: 產品代碼
  - `description`: 產品描述

## 工作流程

### 1. 盤點準備
- 用戶進入週期盤點頁面
- 系統顯示掃描介面或手動輸入選項
- 用戶可選擇普通模式或批量模式

### 2. 掃描/輸入流程

#### QR碼掃描
- 掃描棧板標籤上嘅QR碼
- 系統解析系列號
- 查詢`record_palletinfo`獲取棧板資訊

#### 手動輸入
- 輸入棧板號碼（格式：DDMMYY/X）
- 系統驗證格式
- 查詢棧板資訊

### 3. 數據處理邏輯

#### 首次盤點（每日首個產品）
- 檢查`record_stocktake`當日記錄
- 如無記錄，從`stock_level`獲取系統庫存
- 創建初始記錄（plt_num為null）
- 顯示當前系統庫存水平

#### 後續盤點
- 檢查係咪已經盤點過（防止重複）
- 顯示數字鍵盤輸入實際數量
- 計算剩餘數量（前次剩餘 - 本次點算）
- 創建新盤點記錄

### 4. 批量模式
- 掃描多個棧板到隊列
- 批量輸入每個棧板數量
- 一次提交所有盤點記錄
- 編輯或刪除隊列項目

### 5. 盤點報表

#### 每日摘要
- 總產品數
- 已盤點產品數
- 總差異（盤點vs系統）
- 高差異項目（>10%）

#### 詳細報表
- 產品代碼同描述
- 起始庫存水平
- 盤點數量
- 系統庫存水平
- 差異數量同百分比
- 已盤點棧板數
- 高差異突出顯示

## 技術實現

### 前端技術
- React配合TypeScript
- 移動優先響應式設計
- 觸控友好介面
- 實時驗證同回饋

### 狀態管理
- React hooks用於組件狀態
- 批量模式隊列管理
- 錯誤狀態處理
- 載入狀態指示

### API設計

#### 掃描API
```typescript
POST /api/stock-count/scan
Body: { 
  qrCode?: string,
  palletNumber?: string 
}
Response: {
  success: boolean,
  data: {
    plt_num: string,
    product_code: string,
    product_qty: number,
    product_desc: string,
    current_stock?: number
  }
}
```

#### 處理API
```typescript
POST /api/stock-count/process
Body: {
  plt_num: string,
  product_code: string,
  counted_qty: number
}
Response: {
  success: boolean,
  data: {
    remain_qty: number,
    is_first_count: boolean
  }
}
```

#### 批量處理API
```typescript
POST /api/stock-count/batch-process
Body: {
  items: Array<{
    plt_num: string,
    product_code: string,
    counted_qty: number
  }>
}
```

### UI設計特色
- 深色主題適合倉庫環境
- 大按鈕適合手持設備
- 清晰嘅視覺回饋
- 進度指示器
- 錯誤消息友好顯示

## 功能特點

### 即時驗證
- 防止重複盤點
- 格式驗證
- 數量合理性檢查
- 即時錯誤提示

### 差異分析
- 自動計算差異
- 百分比顯示
- 高差異警報
- 顏色編碼指示

### 用戶體驗
- 鍵盤快捷鍵支援
- 自動聚焦下一個輸入
- 批量操作優化
- 離線隊列支援

### 報表功能
- CSV匯出（UTF-8 BOM）
- 日期選擇器
- 差異過濾器
- 打印友好格式

## 安全考慮

### 用戶認證
- 需要登入才能訪問
- 追蹤盤點員身份
- 操作審計記錄

### 數據驗證
- 客戶端同服務器端驗證
- 防止SQL注入
- 輸入清理
- 權限檢查

### 防錯機制
- 防止重複盤點
- 事務處理確保一致性
- 錯誤回滾
- 數據備份

## 性能優化

### 前端優化
- 組件懶加載
- 虛擬滾動長列表
- 防抖搜尋輸入
- 優化重新渲染

### 後端優化
- 索引優化查詢
- 批量操作減少請求
- 緩存常用數據
- 連接池管理

### 移動優化
- 觸控手勢支援
- 減少網絡請求
- 本地存儲隊列
- 壓縮數據傳輸

## 監控同維護

### 操作監控
- 盤點進度追蹤
- 異常差異警報
- 用戶活動日誌
- 性能指標

### 數據質量
- 差異趨勢分析
- 產品準確率
- 盤點覆蓋率
- 時間效率

### 維護任務
- 定期清理舊記錄
- 優化資料庫索引
- 更新產品數據
- 校準系統庫存

## 故障排除

### 常見問題

#### 掃描失敗
- 檢查相機權限
- 確認QR碼清晰
- 驗證網絡連接
- 查看錯誤日誌

#### 重複盤點錯誤
- 確認棧板號碼
- 檢查日期設置
- 查詢盤點記錄
- 聯繫管理員

#### 數據不一致
- 檢查最新庫存更新
- 驗證盤點時間
- 查看其他交易
- 運行差異報告

## 最佳實踐

### 盤點策略
1. 每日固定時間盤點
2. 先盤點高價值產品
3. 使用批量模式提高效率
4. 及時處理高差異項目

### 數據準確性
1. 仔細核對數量
2. 避免估算數字
3. 記錄異常情況
4. 定期校驗結果

### 團隊協作
1. 分配盤點區域
2. 避免重複工作
3. 及時溝通問題
4. 統一盤點方法

## 未來改進

### 計劃功能
- 自動盤點排程
- 智能差異分析
- 預測性庫存
- 移動應用程式

### 技術升級
- 離線完整支援
- RFID整合
- 語音輸入
- AR輔助盤點

### 報表增強
- 實時儀表板
- 趨勢圖表
- 自定義報表
- 自動異常通知