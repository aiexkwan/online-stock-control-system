# InventoryOrderedAnalysisWidget 手動測試指南

## 測試前準備
1. 確保 Next.js 開發服務器正在運行：`npm run dev`
2. 確保可以訪問 http://localhost:3000

## 測試步驟

### 1. 登入系統
- 訪問 http://localhost:3000/main-login
- 使用以下憑證登入：
  - Email: akwan@pennineindustries.com
  - Password: X315Y316

### 2. 導航到管理儀表板
- 登入後，導航到 http://localhost:3000/admin/injection
- 或選擇其他主題：pipeline, warehouse

### 3. 驗證 Widget 顯示
確認以下元素可見：
- [ ] "Inventory Ordered Analysis" 標題
- [ ] 總體狀態卡片（Stock Sufficient/Insufficient）
- [ ] Total Stock 數值
- [ ] Order Demand 數值
- [ ] Remaining Stock 數值
- [ ] Order Fulfillment Rate 進度條

### 4. 驗證產品列表
檢查產品分析列表：
- [ ] 每個產品顯示產品代碼和描述
- [ ] 顯示 Stock、Demand、Remain 數值
- [ ] 顯示 Fulfillment 百分比和進度條
- [ ] 庫存不足的產品排在前面
- [ ] 庫存不足的產品有警告圖標

### 5. 驗證與 Stock Type Selector 的交互
如果頁面上有 Stock Type Distribution widget：
- [ ] 點擊不同的產品類型（如 Injection Plastic、Pipeline）
- [ ] 確認 Inventory Ordered Analysis widget 相應更新
- [ ] 確認只顯示選中類型的產品

### 6. 驗證加載狀態
- [ ] 刷新頁面
- [ ] 確認 widget 顯示 skeleton 加載狀態
- [ ] 確認數據加載後正確顯示

### 7. 驗證數據模式指示器
檢查 widget 右上角：
- [ ] 如果使用 GraphQL：顯示 "⚡ GraphQL"
- [ ] 如果使用 Server Action：顯示 "🔄 Fallback"
- [ ] 顯示查詢時間（如 "25ms"）

## 測試結果記錄

| 測試項目 | 通過 | 備註 |
|---------|------|------|
| Widget 正確顯示 | ☐ | |
| 總體狀態正確 | ☐ | |
| 產品列表正確 | ☐ | |
| 庫存計算準確 | ☐ | |
| 與其他 widget 交互正常 | ☐ | |
| 加載狀態正常 | ☐ | |
| 性能良好（<1秒加載） | ☐ | |

## 已知問題
- WSL 環境下 Playwright 無法連接到 Windows 上的 localhost
- 建議在 Windows 環境直接運行自動化測試

## 測試日期
- 測試人員：_______________
- 測試日期：_______________
- 測試結果：☐ 通過 ☐ 失敗