# 專案現正進行的改進紀錄

## 當前進行中的任務

### Admin Dashboard 優化 (2025-06-16 開始)
- [ ] 改善對話框管理 - 使用 Context 或狀態管理庫
  - [ ] 創建統一的 DialogContext
  - [ ] 實施對話框狀態管理
  - [ ] 減少 prop drilling
- [ ] 添加數據視覺化圖表
  - [ ] 整合圖表庫 (recharts/chart.js)
  - [ ] 實施趨勢圖組件
  - [ ] 添加熱力圖功能
  - [ ] 創建互動式儀表板
- [ ] 實施權限細分
  - [ ] 設計 RBAC 系統架構
  - [ ] 創建權限管理介面
  - [ ] 實施功能級別權限控制
  - [ ] 添加權限檢查 HOC/Hook
- [ ] 添加自定義儀表板
  - [ ] 設計小部件系統
  - [ ] 實施拖放功能
  - [ ] 創建配置保存機制
  - [ ] 添加預設布局模板

### 報表系統統一框架 ✅ (2025-06-16 完成)
- [x] 建立統一報表生成框架
- [x] 遷移 Void Pallet Report 到統一框架
- [x] 遷移 Order Loading Report 到統一框架
- [x] 遷移 Stock Take Report 到統一框架
- [x] 建立報表儀表板（以 Dialog 方式開啟）
- [x] 修復 UI 組件相容性問題
- [x] 統一界面語言為英文
- [x] 套用系統一致的深色主題風格


## 已完成任務歸檔

### Stock Transfer 系統全面優化 ✅ (2025-06-15)
- [x] 數據庫層優化
  - [x] 創建物化視圖 mv_pallet_current_location 預計算托盤位置
  - [x] 實施 search_pallet_optimized 函數（查詢速度提升 10 倍）
  - [x] 修復新增托盤追蹤問題（添加 record_palletinfo 觸發器）
  - [x] 部署 search_pallet_optimized_v2 智能回退機制
  - [x] 實施 smart_refresh_mv 和 force_sync_pallet_mv 函數
- [x] 前端性能優化
  - [x] 實施 5 分鐘 TTL 記憶體快取機制
  - [x] 樂觀更新（Optimistic UI）- 即時 UI 反饋
  - [x] 預加載常用托盤資料
  - [x] 優化搜索流程（操作時間從 5-6 秒減少到 2-3 秒）
- [x] 代碼架構重構
  - [x] 組件拆分（主頁面從 474 行減少到 ~350 行）
    - PageHeader、PalletSearchSection、TransferLogSection
    - TransferLogItem 使用 React.memo 優化
  - [x] Hook 重構（保持完全向後兼容）
    - palletSearchService - 統一搜尋服務
    - usePalletSearch - 可重用的搜尋 Hook
    - useStockTransfer - 專門的轉移邏輯
    - useActivityLog - 活動日誌管理
  - [x] 樣式優化（constants/styles.ts 統一管理）
- [x] 用戶體驗改進
  - [x] 無障礙功能（WCAG 2.1 兼容）
    - 鍵盤快捷鍵（Ctrl+K、/、Escape、?）
    - Skip Navigation 連結
    - ARIA 標籤和語義化 HTML
  - [x] 視覺反饋優化
    - 待處理狀態琥珀色脈動效果
    - 錯誤狀態紅色閃爍警示
    - Loading toast 即時提示

### GRN Label 系統優化 ✅ (2025-06-14)
- [x] 組件模組化
  - [x] 抽取托盤類型選擇為獨立組件 `PalletTypeSelector`
  - [x] 抽取包裝類型選擇為獨立組件 `PackageTypeSelector`
  - [x] 抽取重量輸入列表為獨立組件 `WeightInputList`
  - [x] 創建專門的 `GrnDetailCard` 組件
- [x] 業務邏輯分離
  - [x] 創建 `useGrnLabelBusiness` hook 管理核心業務邏輯
  - [x] 創建 `useSupplierValidation` hook 處理供應商驗證
  - [x] 創建 `useWeightCalculation` hook 處理重量計算
  - [x] 創建 `usePalletGenerationGrn` hook 管理托盤號生成
- [x] 常量和配置提取
  - [x] 創建 `constants/grnConstants.ts` 文件
  - [x] 提取托盤重量常量 (PALLET_WEIGHTS)
  - [x] 提取包裝重量常量 (PACKAGE_WEIGHTS)
  - [x] 提取最大托盤數常量 (MAX_PALLETS)
- [x] 代碼重用優化
  - [x] 創建統一的 `usePalletGeneration` hook
  - [x] 更新 `usePalletGenerationGrn` 使用統一 hook
  - [x] 標記 deprecated 的托盤生成函數
  - [x] 更新 auto-reprint-label 使用統一的 V6 生成
  - [x] 創建 `palletActions.ts` 為 server-side 托盤生成提供統一介面
  - [x] 統一 PDF 生成邏輯
  - [x] 共享驗證邏輯組件
  - [x] 創建共享的供應商驗證組件

### V2 優化擴展到其他標籤系統 ✅ (2025-01-13)
- [x] 將 V2 優化套用到 GRN 標籤生成
  - [x] 創建 app/components/grn-label-form/hooks/useDatabaseOperationsV2.tsx
  - [x] 創建 app/components/grn-label-form/hooks/useFormPersistence.tsx
  - [x] 創建 app/components/grn-label-form/hooks/usePdfGeneration.tsx
  - [x] 創建 app/components/grn-label-form/hooks/useGrnLabelBusiness.tsx
  - [x] 使用優化的托盤編號生成機制 (generateOptimizedPalletNumbers)
- [x] 確認 QC 標籤列印已使用 V2 優化
  - [x] 已在 app/components/qc-label-form/hooks/modules/useDatabaseOperationsV2.tsx 中實施
- [x] 將 V2 優化套用到標籤重印功能
  - [x] 創建 app/api/auto-reprint-label-v2/route.ts
  - [x] 更新 void-pallet hook 使用 V2 API 端點
  - [x] 實施優化的托盤編號生成與回退機制

### PRINT-LABEL 頁面優化 ✅ (2025-01-13)
- [x] 第一階段優化完成
  - [x] 清理 console.log 語句 (移除106個)
  - [x] 提取魔術數字為常量 (創建 constants.ts)
  - [x] 添加 React.memo 優化 (優化16個組件)
- [x] 第二階段優化完成
  - [x] 拆分 useQcLabelBusiness hook (1067行 → 348行, 減少67%)
    - [x] 創建 useAuth hook - 處理用戶認證
    - [x] 創建 useFormValidation hook - 處理表單驗證
    - [x] 創建 useClockConfirmation hook - 處理時鐘確認
    - [x] 創建 useAcoManagement hook - 處理 ACO 訂單
    - [x] 創建 useSlateManagement hook - 處理 Slate 產品
    - [x] 創建 usePdfGeneration hook - 處理 PDF 生成
    - [x] 創建 useDatabaseOperations hook - 處理數據庫操作
    - [x] 創建 useStockUpdates hook - 處理庫存更新
  - [x] 實施統一表單驗證 (useFormValidation)
  - [x] 優化資料庫查詢 (useDatabaseOperations)
- [x] 第三階段優化完成
  - [x] 添加表單持久化 (useFormPersistence hook)
    - [x] 自動保存表單數據到 localStorage
    - [x] 防抖機制避免頻繁寫入
    - [x] 表單持久化指示器顯示保存狀態
    - [x] 成功提交後自動清除保存數據
  - [x] 實施串流 PDF 生成 (useStreamingPdfGeneration hook)
    - [x] 支援批量並行處理 PDF
    - [x] 可取消的串流操作
    - [x] 即時進度回饋
    - [x] 串流/批量模式切換開關
  - [x] 擴展批量處理能力 (useBatchProcessing hook)
    - [x] 批量處理對話框界面
    - [x] CSV 檔案上傳和模板下載
    - [x] 批量項目狀態追蹤
    - [x] 批量結果匯出功能

### 系統安全修復 ✅ (2025-01-13)
- [x] 移除 next.config.js 中的硬編碼 API Keys
- [x] 更新 .env 檔案環境變數命名
- [x] 用戶已更換暴露的 API Keys

### 托盤編號生成穩定性優化 ✅ (2025-01-13)
- [x] 部署 generate_atomic_pallet_numbers_v4 RPC 函數
  - [x] 創建優化的 SQL 腳本 (optimize-pallet-generation-v4.sql)
  - [x] 實施緩衝表機制
  - [x] 添加 FOR UPDATE 鎖定避免並發問題
  - [x] 修復 SQL 語法問題（索引創建、保留字衝突、列名歧義）
- [x] 實施托盤編號緩衝表機制
  - [x] 創建 pallet_number_buffer 表
  - [x] 實施預生成和清理機制
- [x] 更新前端使用 useDatabaseOperationsV2 hook
  - [x] 創建優化的生成函數 (optimizedPalletGeneration.ts)
  - [x] 實施多重回退機制 (v4 → v3 → local)
  - [x] 整合到 useQcLabelBusiness hook
- [x] 添加監控工具到管理後台
  - [x] 創建 PalletGenerationMonitor 組件
  - [x] 創建管理頁面 (/admin/pallet-monitor)
  - [x] 創建測試頁面 (/test-pallet-generation)
- [x] 測試並驗證穩定性改進
  - [x] SQL 腳本成功部署到數據庫
  - [x] 測試函數正常運行

## 已完成任務歸檔

### ORDER LOADING 優化 ✅
- [x] 實施原子事務 (RPC functions)
- [x] 永久重複防止
- [x] 統一數據存儲 (record_history)
- [x] 庫存級別追蹤

### 數據庫索引優化 ✅
- [x] 全系統索引分析
- [x] 創建優化索引
- [x] 性能測試驗證

## 注意事項
- 所有 UI 文字必須為英文
- 代碼註解使用中文
- 不可修改現有數據表結構

---
*全數完成後需清除內容，循環再用*