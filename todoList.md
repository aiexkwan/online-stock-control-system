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