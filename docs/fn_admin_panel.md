# 管理面板系統

## 概述

管理面板系統係成個倉庫管理系統嘅綜合控制中心，提供全面嘅數據監控、報表生成、系統工具同管理功能。系統整合咗儀表板統計、ACO訂單追蹤、庫存搜尋、報表匯出、檔案上傳、棧板作廢、歷史查詢、資料庫更新同AI驅動嘅資料庫查詢。

## 系統架構

### 主要頁面
- `/admin`: 主管理面板頁面，提供完整嘅系統管理同監控
- `/admin/test-grid`: 網格系統測試頁面
- `/admin/layout`: 管理佈局包裝器，提供Dialog Context

### 核心組件結構

#### 主頁面組件
- `app/admin/page.tsx`: 伺服器組件，提供認證同錯誤邊界
- `app/admin/components/AdminPageClient.tsx`: 主客戶端組件，處理儀表板UI同小工具管理
- `app/admin/layout.tsx`: 佈局包裝器，提供Dialog Context

#### 增強儀表板系統
- `app/admin/components/dashboard/EnhancedDashboard.tsx`: iOS風格嘅小工具系統，支援拖放
- `app/admin/components/dashboard/AdminEnhancedDashboard.tsx`: 管理員專用嘅增強儀表板
- `app/admin/components/dashboard/AdminEnhancedDashboardSafe.tsx`: 帶錯誤處理嘅安全版本
- `app/admin/components/dashboard/AdminEnhancedDashboardSimple.tsx`: 簡化版儀表板
- `app/admin/components/dashboard/AdminEnhancedDashboardFixed.tsx`: 固定佈局儀表板

#### 小工具系統組件
- `app/admin/components/dashboard/registerAdminWidgets.ts`: 小工具註冊系統
- `app/admin/components/dashboard/GridWidget.tsx`: 基礎網格小工具組件
- `app/admin/components/dashboard/BaseWidgetWrapper.tsx`: 所有小工具嘅基礎包裝器
- `app/admin/components/dashboard/ResponsiveWidgetWrapper.tsx`: 響應式小工具容器

#### 管理小工具
位於 `app/admin/components/dashboard/widgets/`:
- `AcoOrderProgressWidget.tsx`: ACO訂單進度追蹤
- `InventorySearchWidget.tsx`: 即時庫存搜尋
- `OutputStatsWidget.tsx`: 生產輸出統計
- `RecentActivityWidget.tsx`: 最近系統活動
- `VoidPalletWidget.tsx`: 作廢棧板操作
- `MaterialReceivedWidget.tsx`: 物料接收統計
- `BookedOutStatsWidget.tsx`: 已預訂統計
- `FinishedProductWidget.tsx`: 成品追蹤
- `ChartWidget.tsx`: 數據可視化圖表
- `TestClickWidget.tsx`: 開發測試小工具

#### 對話框組件
- `app/components/admin-panel-menu/UploadFilesDialog.tsx`: 檔案上傳介面
- `app/components/admin-panel-menu/VoidPalletDialog.tsx`: 棧板作廢操作
- `app/components/admin-panel-menu/ViewHistoryDialog.tsx`: 歷史查看介面
- `app/components/admin-panel-menu/DatabaseUpdateDialog.tsx`: 資料庫更新操作
- `app/components/admin-panel-menu/AskDatabaseDialog.tsx`: AI資料庫查詢介面

#### 業務邏輯Hooks
- `app/admin/hooks/useAdminDashboard.ts`: 主儀表板操作hook
- `app/admin/hooks/useGridSystem.ts`: 網格佈局管理
- `app/admin/hooks/useWidgetData.ts`: 小工具數據獲取
- `app/admin/hooks/useDialogManagement.ts`: 對話框狀態管理
- `app/hooks/useAuth.tsx`: 用戶認證同角色管理

## 數據流向

### 資料庫表
- `record_palletinfo`: 棧板基本資訊
- `record_history`: 操作歷史記錄
- `record_transfer`: 轉移記錄
- `record_aco`: ACO訂單進度追蹤
- `record_grn`: GRN收貨記錄
- `record_inventory`: 庫存位置統計
- `data_code`: 產品代碼數據
- `data_supplier`: 供應商資訊
- `data_id`: 用戶認證
- `data_order`: 歷史訂單記錄
- `grn_level`: GRN收貨統計
- `stock_level`: 庫存統計
- `work_level`: 員工工作量統計
- `admin_dashboard_settings`: 用戶儀表板配置

### 小工具數據服務
- `app/admin/services/AdminDataService.ts`: 集中式小工具數據獲取
- `app/admin/services/adminDashboardSettingsService.ts`: 儀表板配置持久化
- 使用RPC函數進行優化數據檢索
- 使用React嘅cache()函數實現緩存

### 權限管理系統
- 基於角色嘅訪問控制（管理員、生產、倉庫）
- 功能權限控制
- 查詢權限管理
- 管理員權限驗證

## 功能模組

### 1. 儀表板小工具系統

#### 小工具功能
- **拖放**: 使用拖動手柄重新排列小工具
- **靈活尺寸**: 5種尺寸選項（小、中、大、特大、超大）
- **響應式網格**: 12列網格系統，帶斷點
- **持久佈局**: 用戶配置保存到資料庫
- **即時更新**: 小工具嘅自動刷新功能

#### 小工具管理
- 動態添加/刪除小工具
- 編輯小工具屬性
- 為每個用戶保存自定義佈局
- 重置為默認佈局
- 測試預覽模式

### 2. 快速搜尋模組

#### 庫存搜尋功能
- 產品代碼搜尋，帶自動建議
- 即時搜尋結果
- 按位置顯示庫存
- 總庫存統計
- 與其他小工具整合

### 3. 報表匯出模組

#### 報表類型
- ACO訂單報表
- GRN收貨報表
- 交易記錄
- Slate產品報表
- 完整數據匯出
- 自定義日期範圍報表

### 4. 系統工具模組

#### 檔案上傳
- PDF檔案支援
- 訂單分析
- 自動數據提取
- 重複檢查
- 進度追蹤

#### 棧板作廢操作
- 狀態變更管理
- 原因記錄
- 庫存自動調整
- 標籤重印支援
- 批量作廢功能

#### 歷史查詢
- 完整棧板歷史
- 操作追蹤
- 時間線顯示
- 詳細資訊查看
- 匯出功能

#### 資料庫更新
- 記錄修改
- 批量更新操作
- 數據完整性檢查
- 更新歷史記錄
- 回滾支援

#### AI資料庫查詢
- 自然語言查詢
- 智能SQL生成
- 查詢結果顯示
- 基於權限嘅訪問
- 查詢歷史追蹤

## 技術實現

### 前端技術
- React 18配合伺服器組件
- TypeScript用於類型安全
- Framer Motion用於動畫
- Tailwind CSS用於樣式
- Heroicons用於圖標
- React DnD用於拖放
- React PDF用於報表生成

### 狀態管理
- React Context用於全局狀態
- 自定義hooks用於業務邏輯
- 樂觀UI更新
- 錯誤邊界實現
- 載入狀態管理

### 後端整合
- Supabase作為後端服務
- 即時資料庫查詢
- 檔案存儲管理
- RPC函數用於複雜查詢
- 行級安全性（RLS）

### UI設計特色
- 玻璃擬態效果
- 帶漸變嘅深色主題
- 響應式斷點
- 動態背景元素
- 現代卡片設計
- 流暢動畫
- 觸控友好介面

## 介面佈局設計

### 頂部導航區
- 頁面標題同麵包屑
- 用戶資訊顯示
- 快速操作按鈕
- 系統狀態指示器
- 設置訪問

### 儀表板網格區
- 可自定義小工具網格
- 拖放支援
- 響應式列
- 小工具尺寸變化
- 空狀態處理

### 小工具類型
- **統計小工具**: 顯示關鍵指標
- **圖表小工具**: 數據可視化
- **列表小工具**: 表格數據顯示
- **操作小工具**: 快速操作
- **搜尋小工具**: 數據查詢

### 控制面板
- 編輯模式切換
- 添加小工具按鈕
- 佈局保存/重置
- 查看選項
- 幫助文檔

## API端點

### RPC函數
- `get_admin_dashboard_stats`: 集中式統計檢索
- `search_inventory_by_product`: 產品搜尋
- `get_operator_performance`: 性能指標
- `get_void_statistics`: 作廢棧板統計
- `get_time_range_stats`: 基於時間嘅統計

### REST API
- `/api/export-report/`: 報表生成
- `/api/upload-file/`: 檔案上傳服務
- `/api/analyze-order-pdf/`: PDF分析
- `/api/ask-database/`: AI查詢處理

## 權限控制系統

### 用戶角色
- **管理員**: 完整系統訪問
- **生產**: 限於生產功能
- **倉庫**: 限於倉庫操作

### 功能權限
- 儀表板自定義
- 報表生成
- 系統工具訪問
- AI查詢功能
- 數據修改權限

### 安全設計
- 操作日誌
- 敏感操作確認
- 數據訪問控制
- 會話管理
- API速率限制

## 性能優化

### 前端優化
- 組件延遲加載
- 昂貴操作嘅記憶化
- 大列表嘅虛擬滾動
- 防抖搜尋輸入
- 樂觀UI更新

### 資料庫優化
- 索引查詢
- 物化視圖
- 連接池
- 查詢結果緩存
- 批量操作

### 緩存策略
- React cache()用於伺服器數據
- 客戶端狀態緩存
- 小工具數據緩存
- 配置緩存
- 圖像優化

## 監控同日誌

### 操作監控
- 用戶操作追蹤
- 小工具使用分析
- 性能指標
- 錯誤率追蹤
- 功能採用率

### 日誌系統
- 操作日誌
- 錯誤收集
- 系統事件
- 安全事件
- 性能日誌

### 警報機制
- 系統異常警報
- 性能問題警告
- 安全事件通知
- 自動恢復
- 電郵通知

## 未來改進

### 計劃功能
- 即時協作
- 高級分析儀表板
- 移動應用整合
- 語音命令支援
- 機器學習洞察

### 技術改進
- WebSocket整合
- Service Worker實現
- 離線功能
- 增強緩存
- 性能監控

### 用戶體驗
- 可自定義主題
- 鍵盤快捷鍵
- 無障礙改進
- 多語言支援
- 教程系統