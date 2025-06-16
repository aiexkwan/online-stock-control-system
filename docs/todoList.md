# 專案待改進紀錄

## 高優先級
1. **ORDER LOADING 性能優化** ✅
   - 實施客戶端緩存 (React Query)
   - 添加性能監控
   - 實施 Realtime 更新

2. **系統安全性**
   - 確認所有 API Keys 在環境變數中 ✅ (已修復硬編碼問題並更換 API Keys)
   - 檢查 RLS 政策

3. **PRINT-LABEL 頁面優化** ✅

4. **托盤編號生成穩定性優化**
   - 修復 generate_atomic_pallet_numbers_v3 不穩定問題
   - 實施 v4 版本 RPC 函數
   - 添加緩衝機制和回退方案
   - 建立監控和診斷工具
   - ✅ 第一階段（已完成）
     - 清理 console.log (106個)
     - 提取魔術數字為常量
     - 添加 React.memo 優化
   - ✅ 第二階段（已完成）
     - 拆分大型 hooks (useQcLabelBusiness 1067行 → 348行)
     - 統一表單驗證邏輯
     - 優化資料庫查詢
   - ✅ 第三階段（已完成）
     - 添加表單持久化
     - 實施串流 PDF 生成
     - 擴展批量處理能力

5. **Stock Transfer 系統優化** ✅ (2025-06-15 全部完成)
   - ✅ 優化搜索後直接進入員工ID輸入 (2025-06-15 完成)
     - 移除不必要的托盤信息顯示步驟
     - 操作時間從 5-6 秒減少到 2-3 秒
   - ✅ 實施預加載和快取機制提升響應速度 (2025-06-15 完成)
     - 實施 5 分鈘 TTL 記憶體快取
     - 支援背景刷新和預加載
     - 重複搜尋近乎即時響應
   - ✅ 優化數據庫查詢減少延遲 (2025-06-15 完成)
     - 創建物化視圖 mv_pallet_current_location
     - 實施 search_pallet_optimized 和 batch_search_pallets 函數
     - 自動刷新機制確保資料一致性
   - ✅ 實施樂觀更新（Optimistic UI）(2025-06-15 完成)
     - 即時 UI 反饋，不需等待資料庫回應
     - 防止重複操作的衝突檢測
     - 失敗自動回滾狀態
     - 待處理狀態的視覺指示（琥珀色脈動效果）
   - ✅ 修復物化視圖新增托盤追蹤問題 (2025-06-15 完成)
     - 新增 record_palletinfo 觸發器
     - 實施 search_pallet_optimized_v2 智能回退機制
     - 部署 smart_refresh_mv 和 force_sync_pallet_mv 函數

6. **Stock Transfer 頁面重構** ✅ (2025-06-15 完成)
   - ✅ 組件拆分 (2025-06-15 完成)
     - PageHeader、PalletSearchSection、TransferLogSection 等
     - 主頁面從 474 行減少到 ~350 行
     - 使用 React.memo 優化性能
   - ✅ Hook 重構 (2025-06-15 完成)
     - 創建 palletSearchService 統一搜尋服務
     - 實施 usePalletSearch、useStockTransfer、useActivityLog
     - 保持完全向後兼容
   - ✅ 樣式優化 (2025-06-15 完成)
     - 創建 constants/styles.ts 統一管理
     - 提取重複樣式為常量
   - ✅ 無障礙功能 (2025-06-15 完成)
     - 實施鍵盤快捷鍵（Ctrl+K、/、Escape、?）
     - 添加 Skip Navigation、ARIA 標籤
     - 完整的鍵盤導航支援

## 中優先級
1. **共享組件優化** ✅
   - [x] 創建共享的供應商驗證組件

2. **用戶體驗改善** (部分完成)
   - ✅ 添加鍵盤快捷鍵 (2025-06-15 Stock Transfer 已實施)
   - 優化移動設備體驗
   - 改善錯誤提示（確保英文）

3. **代碼品質**
   - 統一代碼註解為中文 (發現大量英文註解需翻譯)
   - 移除未使用的組件
   - 優化重複代碼

4. **Stock Transfer 穩定性和反饋** (部分完成)
   - ✅ 減少不必要的狀態更新和重新渲染 (樂觀更新已優化)
   - ✅ 實施錯誤恢復機制避免操作中斷 (自動回滾機制已實施)
   - 添加語音反饋支持（成功/失敗提示音）

## 低優先級
1. **功能增強**
   - 離線支持
   - 批量操作
   - 高級報表

2. **文檔完善**
   - 更新所有功能說明文檔
   - 添加 API 文檔

3. **Stock Transfer 代碼重構** (低優先級)
   - 拆分 page.tsx（確保不影響性能）
   - 添加單元測試
   - 提取可重用組件

## GRN Label 系統優化 ✅ (2025-06-14 完成)

### 高優先級 ✅
1. **組件模組化** ✅
   - [x] 抽取托盤類型選擇為獨立組件 `PalletTypeSelector`
   - [x] 抽取包裝類型選擇為獨立組件 `PackageTypeSelector`
   - [x] 抽取重量輸入列表為獨立組件 `WeightInputList`
   - [x] 創建專門的 `GrnDetailCard` 組件

2. **業務邏輯分離** ✅
   - [x] 創建 `useGrnLabelBusiness` hook 管理核心業務邏輯
   - [x] 創建 `useSupplierValidation` hook 處理供應商驗證
   - [x] 創建 `useWeightCalculation` hook 處理重量計算
   - [x] 創建 `usePalletGenerationGrn` hook 管理托盤號生成

3. **常量和配置提取** ✅
   - [x] 創建 `constants/grnConstants.ts` 文件
   - [x] 提取托盤重量常量 (PALLET_WEIGHTS)
   - [x] 提取包裝重量常量 (PACKAGE_WEIGHTS)
   - [x] 提取最大托盤數常量 (MAX_PALLETS)

4. **代碼重用優化** ✅
   - [x] 創建統一的 `usePalletGeneration` hook
   - [x] 更新 `usePalletGenerationGrn` 使用統一 hook
   - [x] 標記 deprecated 的托盤生成函數
   - [x] 更新 auto-reprint-label 使用統一的 V6 生成

### 中優先級
4. **狀態管理優化** ✅ (2025-06-14 完成)
   - [x] 使用 useReducer 統一管理表單狀態
   - [x] 創建 GrnFormReducer
   - [x] 優化狀態更新邏輯

5. **錯誤處理統一化** ✅ (2025-06-15 完成)
   - [x] 創建統一的錯誤處理服務 `GrnErrorHandler`
   - [x] 實現錯誤分級（low, medium, high, critical）
   - [x] 添加錯誤恢復機制（托盤號回滾）

6. **性能優化** (進行中)
   - [x] 使用 useMemo 優化重量計算 ✅ (已在 useWeightCalculation 實現)
   - [x] 使用 useCallback 優化事件處理器 ✅ (已在 GrnLabelFormV2 實現)
   - [x] 優化多個托盤輸入的顯示 ✅ (2025-06-15 實施可調整高度容器)
   - [ ] 懶加載 PDF 相關組件

### 低優先級
7. **代碼復用**
   - [x] 創建共用的 usePalletGeneration hook ✅
   - [x] 統一 PDF 生成邏輯 ✅
   - [x] 共享驗證邏輯組件 ✅

8. **測試和文檔**
   - [ ] 添加單元測試
   - [ ] 創建 Storybook 組件文檔
   - [ ] 添加 JSDoc 註釋

## Admin Dashboard 優化任務 (進行中)
1. **改善對話框管理**
   - 使用 Context 或狀態管理庫統一管理對話框狀態
   - 減少組件間的狀態傳遞
   - 實施統一的對話框控制機制

2. **添加數據視覺化圖表**
   - 添加趨勢圖顯示每日/每週數據變化
   - 實施熱力圖顯示產品活動
   - 增加互動式圖表組件

3. **實施權限細分**
   - 功能級別的權限控制
   - 基於角色的訪問控制 (RBAC)
   - 細化到按鈕級別的權限管理

4. **添加自定義儀表板**
   - 用戶可配置的小部件系統
   - 拖放式儀表板布局
   - 保存用戶自定義配置

## 注意事項
- 所有新功能必須遵循 CLAUDE.mdc 規範
- UI 文字必須為英文
- 不可修改數據表結構