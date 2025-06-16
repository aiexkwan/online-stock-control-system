# QC 標籤列印功能文檔

## 功能概述
QC 標籤列印系統負責生成和列印質量控制標籤，支援 ACO 和 Slate 兩種產品類型。

## 系統架構

### 主要頁面
- `/print-label`: QC 標籤列印的主頁面，提供完整的標籤生成工作流程

### 核心組件結構

#### 主表單組件
- `app/components/qc-label-form/PerformanceOptimizedForm.tsx`: 主表單組件，負責使用者輸入處理和流程控制
- `app/components/qc-label-form/ProductSection.tsx`: 產品資訊輸入區塊
- `app/components/qc-label-form/ProgressSection.tsx`: 標籤列印進度顯示區塊

#### 輸入組件
- `app/components/qc-label-form/ProductCodeInput.tsx`: 產品代碼輸入組件，支援即時搜尋和驗證

#### 對話框組件
- `app/components/qc-label-form/ClockNumberConfirmDialog.tsx`: 操作員身份確認對話框
- `app/components/qc-label-form/ErrorBoundary.tsx`: 錯誤邊界處理組件

#### 表單元件
- `app/components/qc-label-form/EnhancedFormField.tsx`: 包含 EnhancedInput 和 EnhancedSelect 的增強表單欄位
- `app/components/qc-label-form/EnhancedProgressBar.tsx`: 現代化進度條組件
- `app/components/qc-label-form/ResponsiveLayout.tsx`: 響應式卡片佈局組件

#### 業務邏輯 Hooks（V2 優化版本）
- `app/components/qc-label-form/hooks/useQcLabelBusiness.tsx`: QC 標籤生成的核心業務邏輯
- `app/components/qc-label-form/hooks/modules/useFormValidation.tsx`: 表單驗證邏輯模組
- `app/components/qc-label-form/hooks/modules/useErrorHandler.tsx`: 統一錯誤處理模組
- `app/components/qc-label-form/hooks/modules/useDatabaseOperationsV2.tsx`: V2 版本數據庫操作模組
- `app/components/qc-label-form/hooks/modules/usePalletGenerationV2.tsx`: V2 版本托盤號生成模組
- `app/components/qc-label-form/hooks/modules/usePdfGenerationV2.tsx`: V2 版本 PDF 生成模組
- `app/components/qc-label-form/hooks/modules/useAutoSaveV2.tsx`: V2 版本自動保存模組
- `app/components/qc-label-form/hooks/modules/useSlateManagement.tsx`: Slate 產品管理模組
- `app/components/qc-label-form/hooks/modules/useAcoManagement.tsx`: ACO 產品管理模組

#### 服務層
- `app/components/qc-label-form/services/ErrorHandler.ts`: 錯誤處理服務
- `app/components/qc-label-form/services/`: 其他業務服務

## 數據流向

### 資料庫表結構
- `record_palletinfo`: 棧板基本資訊儲存
- `record_history`: 操作歷史記錄
- `data_code`: 產品代碼資料
- `record_inventory`: 庫存數量管理
- `data_id`: 操作員身份驗證
- `pallet_number_buffer`: 托盤號碼緩衝表（優化性能）
- `daily_pallet_sequence`: 每日托盤序列管理

### 儲存系統
- Supabase Storage `qc-labels` bucket: QC 標籤 PDF 檔案儲存
- Supabase Storage `pallet-label-pdf` bucket: 棧板標籤 PDF 檔案儲存

## 工作流程

### 1. 使用者輸入階段
- 操作員在 PerformanceOptimizedForm 中輸入產品代碼、數量等資訊
- ProductCodeInput 提供即時搜尋和驗證功能
- 系統進行即時表單驗證
- 支援 ACO 和 Slate 產品的特殊欄位輸入

### 2. 身份驗證階段
- 提交表單前彈出 ClockNumberConfirmDialog
- 要求操作員輸入工號進行身份驗證
- 驗證通過後啟動標籤生成流程

### 3. 資料準備階段（V2 優化）
useQcLabelBusiness Hook 執行以下操作：
- `usePalletGenerationV2`: 使用 V5 版本托盤號生成函數，支援數字排序
- `generateOptimizedPalletNumbersV5()`: 生成棧板號碼，格式為 `ddMMyy/N`
- `generateMultipleUniqueSeries()`: 生成系列號，格式為 `ddMMyy-XXXXXX`
- `prepareQcLabelData()`: 準備 PDF 生成所需的標籤資料

### 4. 批量處理階段（V2 優化）
使用 `useDatabaseOperationsV2` 模組：
- 插入 `record_palletinfo` 記錄棧板基本資訊
- 插入 `record_history` 記錄操作歷史
- 根據產品類型自動處理庫存更新
- 支援事務處理確保數據一致性

### 5. PDF 生成與儲存階段（V2 優化）
使用 `usePdfGenerationV2` 模組：
- `generateAndUploadPdf()` 根據準備的資料生成 QC 標籤 PDF
- 自動上傳 PDF 到 Supabase Storage 的 `qc-labels` 路徑
- 支援多個 PDF 的合併處理
- 優化 PDF 生成性能，減少等待時間

### 6. 列印觸發階段
- `mergeAndPrintPdfs()` 合併多個 PDF（如需要）
- 觸發瀏覽器列印對話框
- 使用者確認後執行實際列印

### 7. 進度監控與錯誤處理
- ProgressSection 和 EnhancedProgressBar 即時顯示處理狀態
- 錯誤分級處理（Critical/High/Medium/Low）
- 友好的錯誤訊息顯示
- 錯誤記錄到資料庫

### 8. 自動保存功能（V2 新增）
- 使用 `useAutoSaveV2` 模組自動保存表單狀態
- 防止意外關閉導致數據丟失
- 支援草稿恢復功能

## 技術實現

### 前端技術
- React 組件化架構設計
- Tailwind CSS 現代化 UI 框架
- 玻璃擬態設計風格
- 響應式設計支援
- TypeScript 類型安全

### 後端整合
- Supabase 作為後端服務
- 資料庫操作透過 Supabase Client
- 檔案儲存使用 Supabase Storage
- PDF 生成透過專用 API 服務

### UI 設計特色
- 深藍色/深色主題
- 動態漸層背景與網格紋理
- 半透明背景與背景模糊效果
- 邊框光效與懸停互動
- 現代化按鈕設計與載入動畫
- 清晰的視覺回饋系統

## API 端點

### PDF 生成 API
- `app/api/print-label-pdf/`: QC 標籤 PDF 生成服務
- 支援批量 PDF 生成
- 自動檔案上傳與管理

### 資料查詢 API
- 產品代碼驗證
- 庫存數量查詢
- 操作員身份驗證

### 自動補貨 API（V2 優化）
- `app/api/auto-reprint-label-v2/`: 自動補貨標籤生成
- 使用 V5 托盤號生成函數
- 優化性能和可靠性

## 配置要求

### 環境變數
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 專案 URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 服務角色金鑰

### 權限設定
- 資料庫表讀寫權限
- Supabase Storage bucket 存取權限
- PDF 生成服務權限

## 支援的產品類型

### 正常產品
- 標準 QC 標籤格式
- 自動庫存扣減
- 標準棧板號碼生成

### ACO 產品
- 包含訂單參考資訊
- 特殊標籤格式
- 客戶特定要求處理

### Slate 產品
- Slate 專用標籤格式
- 特殊產品描述處理
- 客製化標籤內容

## 效能優化（V2 版本）

### 前端優化
- 組件懶載入
- 表單狀態優化（模組化管理）
- 進度條效能優化
- 錯誤邊界保護
- 防抖和節流處理

### 後端優化
- 批量資料庫操作
- PDF 生成快取
- 檔案上傳優化
- 查詢效能優化
- 托盤號碼緩衝池機制

### 托盤號生成優化（V5）
- 使用 `generate_atomic_pallet_numbers_v5` RPC 函數
- 支援數字排序，解決字符串排序問題
- 實現緩衝池機制提升性能
- 自動清理過期緩衝條目

## 系統維護

### 托盤號碼緩衝區自動清理
- 使用 Supabase Scheduler（pg_cron）
- 每 5 分鐘自動執行清理
- 清理規則：
  - 刪除非今日的條目
  - 刪除已使用超過 2 小時的條目
  - 刪除未使用超過 30 分鐘的條目
  - 保持最多 100 個未使用條目

### 監控和維護
- 定期檢查托盤號生成日誌
- 監控緩衝區使用情況
- 檢查清理任務執行狀態
- 性能監控和優化

## 故障排除

### 常見問題

#### 1. 產品代碼搜尋不穩定
- 檢查網絡連接
- 確認產品代碼存在於數據庫
- 查看瀏覽器控制台錯誤

#### 2. 托盤號碼生成失敗
- 檢查 RPC 函數是否正常
- 確認數據庫權限
- 查看緩衝區狀態

#### 3. PDF 生成錯誤
- 檢查 Storage bucket 權限
- 確認 PDF API 服務正常
- 查看錯誤日誌

#### 4. 表單數據丟失
- 檢查自動保存功能
- 確認本地存儲可用
- 查看瀏覽器設置

### 調試工具
- 瀏覽器開發者工具
- Supabase Dashboard
- 系統日誌查詢
- 性能分析工具

## 最佳實踐

### 操作建議
1. 定期檢查產品代碼準確性
2. 確保操作員工號正確
3. 避免頻繁重複提交
4. 定期清理打印歷史

### 維護建議
1. 每週檢查系統日誌
2. 每月分析性能報告
3. 定期更新產品數據
4. 保持系統文檔更新

## 版本歷史

### V2.1 修復版本（2025-06-14）
- 修復產品代碼搜尋無限載入問題
- 修復時鐘號碼驗證卡住問題
- 移除所有 simple-client 使用，統一使用標準 browser client
- 修復表單驗證類型錯誤（`trim is not a function`）
- 改善錯誤處理和用戶體驗

### V2 優化版本（2025-06）
- 實現模組化架構
- 優化托盤號生成（V5）
- 增加自動保存功能
- 改進錯誤處理機制
- 實現自動清理功能

### V1 初始版本
- 基本 QC 標籤功能
- 支援 ACO/Slate 產品
- PDF 生成和打印
- 基礎錯誤處理