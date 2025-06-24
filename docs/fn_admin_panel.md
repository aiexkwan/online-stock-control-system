# 管理面板系統

## 概述

管理面板系統係 NewPennine 倉庫管理系統嘅綜合控制中心，提供全面嘅數據監控、報表生成、系統工具同管理功能。系統採用主題式佈局設計，每個主題針對特定業務功能進行優化。

## 系統架構

### 主要頁面路由
- `/admin`: 主管理面板入口
- `/admin/[theme]`: 主題式管理頁面
  - `/admin/injection`: 注塑生產監控
  - `/admin/pipeline`: 生產流程管理
  - `/admin/warehouse`: 倉庫管理
  - `/admin/upload`: 文件上傳中心
  - `/admin/update`: 數據更新
  - `/admin/stock-management`: 庫存管理
  - `/admin/system`: 系統監控
  - `/admin/analysis`: 數據分析
- `/admin/pallet-monitor`: 棧板監控頁面

### 核心組件結構

#### 主頁面組件
- `app/admin/page.tsx`: 主入口頁面（重定向到 injection 主題）
- `app/admin/[theme]/page.tsx`: 動態主題頁面
- `app/admin/layout.tsx`: 管理面板佈局包裝器
- `app/admin/components/NewAdminDashboard.tsx`: 主儀表板組件

#### 佈局系統
- `app/admin/components/dashboard/adminDashboardLayouts.ts`: 所有主題佈局定義
- `app/admin/components/dashboard/CustomThemeLayout.tsx`: injection/pipeline/warehouse 佈局
- `app/admin/components/dashboard/UploadUpdateLayout.tsx`: upload/update 主題佈局
- `app/admin/components/dashboard/StockManagementLayout.tsx`: 庫存管理佈局
- `app/admin/components/dashboard/SystemLayout.tsx`: 系統監控佈局
- `app/admin/components/dashboard/AnalysisLayout.tsx`: 分析報表佈局

#### Widget 渲染系統
- `app/admin/components/dashboard/AdminWidgetRenderer.tsx`: Widget 動態渲染器
- `app/admin/components/dashboard/WidgetCard.tsx`: 統一 Widget 卡片樣式
- `app/admin/types/widgetSizeRecommendations.ts`: Widget 尺寸建議

#### 主要 Widget 組件
位於 `app/admin/components/dashboard/widgets/`:

**數據監控類**
- `AcoOrderProgressWidget.tsx`: ACO 訂單進度追蹤
- `OutputStatsWidget.tsx`: 生產輸出統計
- `MaterialReceivedWidget.tsx`: 物料接收統計
- `BookedOutStatsWidget.tsx`: 已預訂統計
- `FinishedProductWidget.tsx`: 成品追蹤
- `UnusedStockWidget.tsx`: 未使用庫存
- `ProductMixChartWidget.tsx`: 產品組合圖表
- `PendingGrnWidget.tsx`: 待處理 GRN

**操作類**
- `InventorySearchWidget.tsx`: 即時庫存搜尋
- `VoidPalletWidget.tsx`: 作廢棧板操作
- `RecentActivityWidget.tsx`: 最近系統活動
- `QuickActionsWidget.tsx`: 快速操作
- `ReportsWidget.tsx`: 報表生成
- `DocumentUploadWidget.tsx`: 文檔上傳（舊版）
- `DatabaseUpdateWidget.tsx`: 數據庫更新
- `AskDatabaseWidget.tsx`: AI 數據庫查詢

**上傳類（新 3D UI）**
- `Folder3D.tsx`: 3D 文件夾組件
- `UploadFilesWidget.tsx`: 通用文件上傳
- `UploadOrdersWidget.tsx`: 訂單 PDF 上傳（含 AI 分析）
- `UploadProductSpecWidget.tsx`: 產品規格上傳
- `UploadPhotoWidget.tsx`: 照片上傳
- `OrdersListWidget.tsx`: 訂單上傳歷史
- `OtherFilesListWidget.tsx`: 其他文件上傳歷史
- `HistoryTree.tsx`: 歷史樹狀視圖
- `GoogleDriveUploadToast.tsx`: 上傳進度提示
- `OrderAnalysisResultDialog.tsx`: 訂單分析結果對話框

**響應式組件**
- `ResponsiveOutputStatsWidget.tsx`: 響應式輸出統計
- `ResponsiveChartWidget.tsx`: 響應式圖表
- `ResponsiveInventorySearchWidget.tsx`: 響應式庫存搜尋
- 其他響應式 Widget...

#### UI 組件
- `app/admin/components/MenuBar.tsx`: Glow Menu 導航系統
- `app/admin/components/StarfieldBackground.tsx`: 星空背景效果
- `app/admin/components/UniversalTimeRangeSelector.tsx`: 時間範圍選擇器
- `app/admin/components/UniversalChatbot.tsx`: AI 助手
- `app/admin/components/LoadingScreen.tsx`: 加載畫面

#### 業務邏輯 Hooks
- `app/admin/hooks/useAdminDashboard.ts`: 主儀表板操作
- `app/admin/hooks/useGridSystem.ts`: 網格系統計算（部分棄用）
- `app/admin/hooks/useWidgetData.ts`: Widget 數據獲取
- `app/hooks/useAuth.tsx`: 用戶認證同角色管理

## 主題系統

### 1. Injection（注塑生產）
- 實時生產監控
- 輸出統計
- ACO 訂單追蹤
- 最近活動

### 2. Pipeline（生產流程）
- 物料接收追蹤
- 生產流程狀態
- 待處理訂單
- 效率分析

### 3. Warehouse（倉庫管理）
- 庫存搜尋
- 棧板管理
- 位置追蹤
- 物料流動

### 4. Upload（文件上傳）
**特色：3D Folder UI**
- 訂單 PDF 上傳（含 OpenAI 分析）
- 產品規格文檔
- 照片上傳
- 其他文件
- 上傳歷史查看

### 5. Update（數據更新）
- 批量數據更新
- 記錄修改
- 歷史追蹤
- 數據驗證

### 6. Stock Management（庫存管理）
- 庫存水平監控
- 未使用庫存
- 庫存調整
- 報表生成

### 7. System（系統監控）
- 系統性能
- 用戶活動
- 錯誤日誌
- 系統健康

### 8. Analysis（數據分析）
- 產品組合分析
- 趨勢分析
- 性能指標
- 自定義報表

## 數據流向

### 資料庫表
- `record_palletinfo`: 棧板基本資訊
- `record_history`: 操作歷史記錄
- `record_transfer`: 轉移記錄
- `record_aco`: ACO 訂單進度追蹤
- `record_grn`: GRN 收貨記錄
- `record_inventory`: 庫存位置統計
- `data_code`: 產品代碼數據
- `data_supplier`: 供應商資訊
- `data_id`: 用戶認證
- `data_order`: 訂單記錄
- `doc_upload`: 文檔上傳記錄
- `grn_level`: GRN 收貨統計
- `stock_level`: 庫存統計
- `work_level`: 員工工作量統計

### Widget 數據服務
- 使用 Supabase 實時查詢
- React Query 緩存管理
- 樂觀 UI 更新
- 錯誤重試機制

### 權限管理系統
- 基於角色嘅訪問控制（管理員、生產、倉庫）
- 功能權限控制
- 查詢權限管理
- 頁面級別權限

## 功能模組

### 1. 3D 文件上傳系統

#### 特色功能
- **3D Folder UI**: CSS 3D transforms 實現立體效果
- **拖放上傳**: 支援拖放文件到文件夾
- **多文件支援**: 批量上傳處理
- **進度追蹤**: Google Drive 風格進度提示
- **文件預覽**: 圖片即時預覽

#### 訂單 PDF 分析
- OpenAI GPT-4 自動分析
- 提取訂單信息（order_ref, product_code, quantity）
- 自動插入數據庫
- ACO 產品自動識別
- 郵件通知功能

### 2. 庫存搜尋模組

#### 功能特點
- 產品代碼自動完成
- 實時庫存查詢
- 按位置分組顯示
- 總庫存統計
- 導出功能

### 3. 報表系統

#### 報表類型
- ACO 訂單報表
- GRN 收貨報表
- 交易記錄報表
- 庫存盤點報表
- 棧板作廢報表
- 自定義日期範圍

### 4. AI 數據庫查詢

#### 功能特色
- 自然語言查詢
- SQL 自動生成
- 結果可視化
- 查詢歷史
- 權限控制

### 5. 實時監控

#### 監控指標
- 生產輸出率
- 物料接收量
- 庫存水平
- 系統性能
- 用戶活動

## 技術實現

### 前端技術棧
- **React 18**: 使用 Server Components
- **Next.js 14.2.30**: App Router
- **TypeScript**: 類型安全
- **Tailwind CSS**: 樣式系統
- **Framer Motion**: 動畫效果
- **Recharts**: 數據可視化
- **React Hook Form**: 表單管理

### UI/UX 設計
- **玻璃擬態效果**: backdrop-blur, 半透明背景
- **深色主題**: 黑色/灰色基調
- **漸變效果**: 品牌色彩漸變
- **響應式設計**: 適配各種設備
- **3D 效果**: CSS 3D transforms
- **動畫過渡**: 流暢的狀態轉換

### 狀態管理
- React Context（全局狀態）
- React Query（服務器狀態）
- Local State（組件狀態）
- URL State（路由狀態）

### 後端整合
- **Supabase**: PostgreSQL 數據庫
- **實時訂閱**: 數據即時更新
- **Row Level Security**: 數據安全
- **Storage**: 文件存儲
- **Edge Functions**: 服務端邏輯

## API 端點

### REST API
- `/api/upload-file/`: 文件上傳
- `/api/analyze-order-pdf/`: PDF 分析
- `/api/export-report/`: 報表導出
- `/api/ask-database/`: AI 查詢

### Supabase RPC
- 複雜查詢優化
- 數據聚合
- 批量操作
- 統計計算

## 性能優化

### 前端優化
- 組件懶加載
- 代碼分割
- 圖片優化
- 緩存策略
- 虛擬滾動

### 數據優化
- 查詢優化
- 索引使用
- 分頁加載
- 數據預取
- 批量更新

### UI 優化
- 骨架屏
- 樂觀更新
- 錯誤邊界
- 加載狀態
- 防抖節流

## 安全措施

### 認證授權
- Supabase Auth
- JWT Token
- 角色權限
- 頁面保護
- API 保護

### 數據安全
- RLS 政策
- 輸入驗證
- SQL 注入防護
- XSS 防護
- CSRF 保護

### 操作審計
- 用戶活動日誌
- 數據修改記錄
- 文件上傳記錄
- 查詢歷史
- 錯誤日誌

## 部署架構

### 環境配置
- 開發環境
- 測試環境
- 生產環境
- 環境變量管理

### 監控告警
- 性能監控
- 錯誤追蹤
- 用戶行為分析
- 系統健康檢查
- 實時告警

## 未來發展

### 計劃功能
- 移動端優化
- 離線支援
- 更多 AI 功能
- 數據導入導出增強
- 第三方整合

### 技術改進
- 性能持續優化
- 更好的錯誤處理
- 測試覆蓋提升
- 文檔完善
- 國際化支援