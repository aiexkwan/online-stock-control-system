# Admin Panel 頁面文檔

## 概述
Admin Panel 是系統的管理中心，整合了所有管理工具、數據監控功能和報告生成功能。經過多次重構和優化，現在提供了完整的管理體驗。

## 文件位置
- **主要文件**: `app/admin/page.tsx`
- **相關組件**: 
  - `app/components/PrintHistory.tsx`
  - `app/components/GrnHistory.tsx`
  - `app/components/PalletDonutChart.tsx`

## 功能特色

### 1. 統計卡片
- **今日生成棧板**: 顯示當日生成的棧板數量
- **今日轉移棧板**: 顯示當日轉移的棧板數量
- **過去3天生成**: 顯示過去3天的總生成量
- **轉移效率**: 計算過去3天的轉移效率百分比

### 2. 數據可視化
- **甜甜圈圖表**: 顯示棧板生成和轉移的比例
- **時間範圍選擇**: 支援今日、昨日、過去3天、過去7天
- **動態更新**: 根據選擇的時間範圍動態更新數據

### 3. 歷史記錄
- **完成產品歷史**: 顯示最近的產品完成記錄
- **物料接收歷史**: 顯示最近的GRN物料接收記錄
- **實時更新**: 自動載入最新的歷史數據

### 4. ACO 訂單進度
- **訂單選擇**: 下拉選單選擇未完成的ACO訂單
- **進度條顯示**: 視覺化顯示每個產品代碼的完成進度
- **完成百分比**: 精確計算和顯示完成百分比

### 5. 快速搜尋
- **產品代碼搜尋**: 輸入產品代碼快速查詢庫存
- **庫存分佈**: 顯示各個位置的庫存數量
  - Production (生產區)
  - Pipeline (管道)
  - Awaiting (等待區)
  - Fold Mill (摺疊廠)
  - Bulk Room (散裝室)
  - Back Car Park (後停車場)
  - Damage (損壞區)
- **總計顯示**: 計算和顯示總庫存量

## 版本歷史

### v3.0.0 - 全局 Header 整合
**日期**: 2024年12月
**主要變更**:
- 移除頁面內建的 header 導航欄
- 整合到全局 GlobalHeader 系統
- 簡化頁面結構，專注於內容展示
- 保留所有統計卡片和功能組件

**技術改進**:
- 移除重複的標題和導航元素
- 優化頁面載入性能
- 統一用戶體驗

### v2.5.0 - 完整重構
**日期**: 2024年11月
**主要變更**:
- 從 `/dashboard/access` 轉移所有統計功能
- 實現 BALOLO 風格的 popover 導航
- 整合完整的數據監控功能
- 添加 ACO 訂單進度追蹤

**功能增強**:
- 移除 Export Report，直接顯示四個報告選項：
  - ACO Order Report
  - GRN Report  
  - Transaction Report
  - Slate Report
- 改善左側功能欄設計
- 添加快速搜尋功能

### v2.0.0 - 主題統一
**日期**: 2024年10月
**主要變更**:
- 調整主題顏色符合系統風格
- 採用深色主題 (`bg-[#23263a]`, `text-orange-500`)
- 移除右上方 "Back to Dashboard" 按鈕
- 優化視覺一致性

### v1.0.0 - 初始版本
**日期**: 2024年9月
**主要變更**:
- 創建基本的 Admin Panel 結構
- 實現 popover 標籤導航
- 基礎管理功能整合

## 數據來源

### 統計數據
- **棧板信息**: `record_palletinfo` 表
- **轉移記錄**: `record_transfer` 表
- **過濾條件**: 排除 Material GRN 記錄 (`not 'ilike' '%Material GRN-%'`)

### ACO 訂單
- **數據來源**: `record_aco` 表
- **篩選條件**: `remain_qty > 0` (未完成訂單)
- **排序**: 按 `order_ref` 降序

### 庫存搜尋
- **數據來源**: `record_inventory` 表
- **搜尋方式**: 按 `product_code` 精確匹配
- **聚合計算**: 各位置庫存總和

## 技術實現

### 狀態管理
```typescript
interface DashboardStats {
  dailyDonePallets: number;
  dailyTransferredPallets: number;
  past3DaysGenerated: number;
  past3DaysTransferredPallets: number;
}

interface AcoOrder {
  order_ref: number;
  code: string;
  required_qty: number;
  remain_qty: number;
  latest_update: string;
}

interface InventoryLocation {
  product_code: string;
  injection: number;
  pipeline: number;
  await: number;
  fold: number;
  bulk: number;
  backcarpark: number;
  damage: number;
  total: number;
}
```

### 數據載入
- **並行查詢**: 使用 `Promise.all` 同時載入多個數據源
- **錯誤處理**: 完整的錯誤捕獲和用戶提示
- **載入狀態**: 骨架屏和載入指示器

### 動畫效果
- **Framer Motion**: 流暢的頁面進入動畫
- **交互反饋**: hover 效果和點擊反饋
- **響應式設計**: 適配各種螢幕尺寸

## 性能優化

### 構建大小
- **當前大小**: 13.8 kB
- **First Load JS**: 210 kB
- **優化策略**: 代碼分割和懶載入

### 查詢優化
- **索引使用**: 利用數據庫索引加速查詢
- **數據聚合**: 在前端進行數據聚合減少查詢次數
- **緩存策略**: 適當的數據緩存機制

## 用戶體驗

### 響應式設計
- **桌面**: 4列網格佈局
- **平板**: 2列網格佈局  
- **手機**: 單列佈局

### 交互設計
- **直觀導航**: 清晰的功能分類和描述
- **即時反饋**: 載入狀態和操作結果提示
- **鍵盤支援**: 支援鍵盤導航和快捷鍵

## 安全性

### 認證檢查
- **登入驗證**: 確保用戶已認證
- **權限控制**: 管理員權限檢查
- **會話管理**: 自動處理會話過期

### 數據安全
- **SQL 注入防護**: 使用參數化查詢
- **XSS 防護**: 輸入驗證和輸出編碼
- **CSRF 防護**: 使用 CSRF token

## 未來規劃

### 功能增強
- [ ] 實時數據更新 (WebSocket)
- [ ] 更多圖表類型支援
- [ ] 數據匯出功能
- [ ] 自定義儀表板

### 性能改進
- [ ] 虛擬滾動支援
- [ ] 更好的緩存策略
- [ ] 離線支援
- [ ] PWA 功能

### 用戶體驗
- [ ] 深色/淺色主題切換
- [ ] 個人化設定
- [ ] 快捷鍵支援
- [ ] 多語言支援

## 故障排除

### 常見問題
1. **數據載入失敗**: 檢查數據庫連接和權限
2. **統計數據不準確**: 確認時間範圍和過濾條件
3. **ACO 訂單不顯示**: 檢查 `remain_qty > 0` 的訂單是否存在
4. **搜尋功能無效**: 確認產品代碼格式和數據庫記錄

### 調試方法
- 檢查瀏覽器控制台錯誤
- 查看網路請求狀態
- 驗證數據庫查詢結果
- 確認用戶權限設定

## 相關文檔
- [Global Layout 文檔](./globalLayout.md)
- [Dashboard 文檔](./dashboard.md)
- [Export Report 改進](./exportReport-improvements.md)
- [ACO Report 改進](./aco-report-required-qty-improvement.md)
