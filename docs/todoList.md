# Todo List - NewPennine Project

## 已完成 ✅

### Dashboard 自定義功能
- [x] 將 admin 頁面功能遷移到 dashboard widgets
- [x] 實現 widget 尺寸調整（2x2、4x4、6x6）
- [x] 創建 widget 選擇對話框（分步驟選擇）
- [x] 實現 dashboard 設定雲端同步（Supabase）

### Widget 數據修正
- [x] ProductMixChartWidget - 改用 stock_level 表
- [x] InventorySearchWidget - await 欄位合併 await + await_grn
- [x] DatabaseUpdateWidget - 6x6 只顯示功能按鈕
- [x] AnalyticsDashboardWidget - 暫時註釋
- [x] DocumentUploadWidget - 改名為 Document Management，從 Supabase buckets 獲取檔案數量
- [x] ReportsWidget - 改為 quick access 樣式
- [x] ViewHistoryWidget - Recent Activity 從 record_history 取資料
- [x] MaterialReceivedWidget - 從 record_grn 取資料

### Widget 顯示模式優化
- [x] FinishedProductWidget - 完成各模式優化
  - 2x2：顯示當天完成板數
  - 4x4：上方折線圖(2/3) + 下方 Top 5 產品明細(1/3)
  - 6x6：上方折線圖(2/3) + 下方 Top 5 產品明細含數量(1/3)
  - 統一時間範圍選擇器控制整個 widget
  - Today/Yesterday 按小時分組，其他按日期分組

### Widget 顯示模式優化（續）
- [x] InventorySearchWidget - 調整各模式顯示
  - 2x2：不支援（顯示提示訊息）
  - 4x4：套用現時 6x6 模式的顯示內容及形式
  - 6x6：上半部維持現有顯示，下半部加入折線圖（過去 7 天庫存量 vs 訂單數量）
  - 數據來源：record_inventory（庫存），data_order（訂單）
  - 庫存量 = injection + pipeline + prebook + await + await_grn + fold + bulk + backcarpark

- [x] RecentActivityWidget - 調整各模式顯示
  - 2x2：不支援（顯示提示訊息）
  - 4x4：顯示最近 10 條記錄（支援滾動顯示更多），顯示格式：{time} - {action} - {id} - {plt_num}
  - 6x6：顯示最近 15 條記錄（支援滾動顯示更多），顯示格式：{time} - {action} - {id} - {plt_num} - {remark}
  - 數據來源：record_history 表
  - 只顯示 action="Finished QC", "Stock Transfer", "GRN Receiving", "Order Load"
  - 加入欄位標題（column headers）

- [x] OutputStatsWidget - 調整各模式顯示
  - 2x2：顯示當天生成的 pallet number 總數，不支援 data range pick
  - 4x4：顯示當天生成的 pallet number 總數和 product_code 及其 qty 總和（明細列表），支援 data range pick
  - 6x6：分成上中下(1:1:2)，支援 data range pick
    - 上部份：根據 data range，顯示生成的 pallet number 總數
    - 中部份：根據 data range，顯示生成的 product_code 及其 qty 總和（明細列表）
    - 下部份：根據 data range，以棒型圖顯示每日 top 3 product_code 及其 qty 總和
  - 數據來源：record_palletinfo 表
  - 只顯示 plt_remark="Finished In Production"

- [x] Stock Level Widget (原 ProductMixChartWidget) - 調整各模式顯示
  - 2x2：不支援（顯示提示訊息）
  - 4x4：按 stock 類型分類顯示庫存，支援類型選擇
  - 6x6：包括 4x4 所有功能 + 圓餅圖視覺化（上下比例 1:2）
  - 數據來源：stock_level 表（庫存），data_code 表（產品類型）
  - 修正數據庫欄位名稱：data_code.code（非 product_code）
  - 修正數據獲取問題：分批獲取 data_code 記錄以避免 1000 條限制
  - 圓餅圖增大 56.25%，加入引導線標籤，移除圖例

- [x] Stock Transfer Widget (原 BookedOutStatsWidget) - 調整各模式顯示
  - 2x2：顯示當天 transfer 的總數量，不支援 date range
  - 4x4：顯示各員工 transfer 總數量，支援 date range（Today/Yesterday 顯示時間，其他顯示日期）
  - 6x6：包括 4x4 功能 + 折線圖視覺化（上下比例 1:1.5）
  - 數據來源：record_transfer 表
  - 按 operator_id 分組統計
  - Today/Yesterday 顯示每小時數據，其他顯示每日數據
  - 移除 x 軸日期顯示

- [x] System Update Widget (原 DatabaseUpdateWidget) - 調整各模式顯示
  - 2x2：不支援
  - 4x4：Quick access 按鈕 + 最近更新記錄
    - Update Product Info 按鈕：導向 Database Update dialog 的 Product update 分頁
    - Update Supplier Info 按鈕：導向 Database Update dialog 的 material supplier update 分頁
    - 顯示最近 10 條更新記錄（Product Added, Product Update, Supplier Added, Supplier Update）
  - 6x6：不支援
  - 數據來源：record_history 表
  - 修正重複記錄問題：使用 UUID 作為唯一標識符

- [x] Document Management Widget (原 DocumentUploadWidget) - 調整各模式顯示
  - 2x2：不支援（顯示提示訊息）
  - 4x4：Quick access 按鈕（高度增加 20%）+ 上傳歷史（最近 6 條）
  - 6x6：Quick access 按鈕 + 上傳歷史（最近 10 條）
  - 移除 Orders, Pictures, Specs 統計
  - 加入欄位標題（Date/Time, Document Name, Uploaded By）
  - 顯示格式：{created_at} - {doc_name} - {upload_by}
  - 6x6 模式更新：{created_at} - {doc_name} - {file_size} - {upload_by}
  - 數據來源：doc_upload 表
  - 實現分頁功能（Load more...）
  - 使用批量查詢從 data_id 表獲取用戶名稱
  - 修復 RLS 權限問題
  - 加入手動刷新按鈕

- [x] 文件上傳功能寫入 doc_upload 表
  - 修改 /api/upload-file 路由：加入寫入 doc_upload 表記錄
  - 修改 /api/analyze-order-pdf 路由：加入寫入 doc_upload 表記錄（包括緩存版本）
  - 更新 UploadFilesDialog：傳遞當前用戶 ID 到上傳 API
  - 更新 UploadFilesOnlyDialog：傳遞當前用戶 ID 到上傳 API
  - 更新 UploadOrderPDFDialog：已在 API 中處理記錄寫入
  - doc_upload 表欄位：doc_name, upload_by, doc_type, doc_url, file_size, folder
  - 建立 doc_upload 表和 RLS 政策

- [x] ACO Order Progress Widget - 調整各模式顯示
  - 2x2 模式：保持不變
  - 4x4 模式：保持不變
  - 6x6 模式：保持不變，加入顯示 latest_update
  - 數據來源：record_aco 表
  - 在每個進度條下方加入 "Last updated" 顯示
  - 修正日期格式為 "MMM dd, yyyy HH:mm"

- [x] Report Center Widget (原 ReportsWidget) - 調整各模式顯示
  - 2x2 模式：不支援（顯示提示訊息）
  - 4x4 模式：顯示 4 個報表快速存取（Order Loading, GRN, Transaction, ACO Order）以 2x2 排列
  - 6x6 模式：顯示所有 7 個報表快速存取以 2x5 排列
  - 報表類型：Void Pallet Report, Order Loading Report, Stock Take Report, ACO Order Report, Transaction Report, GRN Report, Export All Data
  - 實現點擊後導向對應功能
  - 移除 Overview widget

- [x] 移除 Quick Actions Widget
  - 從 widget 註冊中移除
  - 清理相關檔案引用
  - 處理保存的 dashboard 中的引用錯誤

## 進行中 🔄

### 時區問題
- [ ] 解決 Supabase（美國時間）與用戶（英國時間）的時區差異
- [ ] 確保所有日期時間計算使用正確時區

## 待處理 📋

### Dashboard 優化
- [ ] 優化 widget 載入性能
- [ ] 添加 widget 載入錯誤處理
- [ ] 實現 widget 數據快取機制
- [ ] 添加 widget 刷新間隔設定

### 數據準確性
- [ ] 檢查所有 widget 的數據查詢邏輯
- [ ] 確保統計數據的準確性
- [ ] 優化查詢效率

### 用戶體驗
- [ ] 添加 widget 載入動畫
- [ ] 改善錯誤提示訊息
- [ ] 優化移動設備顯示
- [ ] 添加鍵盤快捷鍵支援

### 新功能建議
- [ ] 添加自定義報表生成器
- [ ] 實現數據導出功能（Excel/CSV）
- [ ] 添加更多圖表類型選項
- [ ] 實現實時數據更新（WebSocket）

### 系統維護
- [ ] 清理未使用的代碼和組件
- [ ] 更新文檔
- [ ] 添加單元測試
- [ ] 優化打包大小

## 已知問題 🐛

1. **時區問題**
   - Supabase 使用美國時間
   - 用戶在英國（可能有 1 小時誤差）
   - 需要統一時區處理邏輯

2. **性能問題**
   - 大量 widget 同時載入可能影響性能
   - 需要實現懶加載或虛擬滾動

3. **數據一致性**
   - 某些 widget 可能顯示過時數據
   - 需要實現更好的快取策略

## 優先級說明
- 🔴 高優先級：影響核心功能
- 🟡 中優先級：改善用戶體驗
- 🟢 低優先級：優化和新功能