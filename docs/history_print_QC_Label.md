# QC 標籤列印頁面 - 改進歷史記錄

## 最新重大改進

### 2025-06-09: Auto-Reprint 功能完全統一 QC Label 邏輯（最終版本）

**解決的問題**: 
- Auto-reprint 功能完成後需要手動下載 PDF 檔案
- 用戶需要額外步驟來列印標籤，影響工作流程效率
- Partially Damaged 情況下歷史記錄顯示 "XX" 而非實際替代棧板號
- Stock Level Updated 記錄包含不必要的 "(will be restored by reprint)" 文字
- **Auto-reprint 使用不同的 PDF 生成邏輯**（Puppeteer HTML vs React PDF）
- **PDF 格式和樣式完全不一致**（發現 Puppeteer API 使用 HTML 模板，不是 React PDF）
- Supabase Storage URL 存取權限問題導致 400 錯誤

**實施的解決方案**:
- **完全統一 PDF 生成**: Auto-reprint 在客戶端使用與 QC Label 完全相同的 React PDF 邏輯
- **統一 React PDF 組件**: 使用相同的 `PrintLabelPdf` 組件和 `prepareQcLabelData` 函數
- **統一列印邏輯**: 前端使用相同的 `mergeAndPrintPdfs` 函數
- **客戶端 PDF 生成**: API 返回 QC 資料，前端生成 PDF（避免服務器端 React PDF 問題）
- 在 auto-reprint 成功後自動更新原始棧板的歷史記錄，將 "XX" 替換為實際新棧板號
- 簡化 Stock Level Updated 記錄的 remark 格式

**技術細節**:
- **PDF 生成完全統一**: 
  - API 返回 `qcInputData`（與 QC Label 相同的資料格式）
  - 前端使用 `prepareQcLabelData(qcInputData)` 準備資料
  - 前端使用 `<PrintLabelPdf {...pdfLabelProps} />` React 組件
  - 前端使用 `pdf(pdfElement).toBlob()` 生成 PDF
- **資料結構完全統一**: 使用相同的 `QcInputData` 介面
- **前端邏輯完全統一**: 使用相同的 `mergeAndPrintPdfs([pdfArrayBuffer], fileName)` 邏輯
- **動態導入**: 使用 `import()` 動態載入 React PDF 相關模組
- 在 auto-reprint API 中查找並更新原始棧板的 "Partially Damaged" 歷史記錄
- 移除 Stock Level Updated 記錄中的冗餘文字

**重要發現**:
- Puppeteer API (`/api/print-label-pdf`) 實際使用 HTML 模板，不是 React PDF
- HTML 模板與 React PDF 的 `PrintLabelPdf` 組件格式完全不同
- 必須在客戶端使用 React PDF 才能確保格式完全一致

**修改的檔案**:
- `app/api/auto-reprint-label/route.ts` - **完全重構 PDF 生成邏輯**，使用 React PDF
- `app/void-pallet/hooks/useVoidPallet.ts` - 簡化為與 QC Label 相同的列印邏輯
- `app/void-pallet/actions.ts` - 優化 Stock Level Updated 記錄格式

**影響**: 
- **完全一致性**: Auto-reprint 與 QC Label 的 PDF 格式、樣式、內容完全一致
- **程式碼統一**: 兩個功能使用完全相同的 PDF 生成和列印邏輯
- **維護簡化**: 只需維護一套 PDF 生成邏輯（React PDF）
- **錯誤減少**: 避免 Supabase Storage URL 權限問題和 Puppeteer 相關問題
- **效能提升**: 直接在 API 中生成 PDF，減少內部網路請求
- 歷史記錄更加準確：顯示實際替代棧板號而非佔位符
- 簡化歷史記錄格式，移除冗餘資訊

---

### 2025-06-09: 增強重複防護和重試機制

**解決的問題**: 
- 針對重複棧板號插入增加額外防護措施
- 改善並發操作的錯誤處理
- 提升重複錯誤發生時的用戶體驗

**實施的解決方案**:
- 在 `createQcDatabaseEntriesWithTransaction()` 中新增插入前重複檢查
- 實施棧板號和系列號生成的重試機制
- 增強錯誤訊息以指導用戶處理重複情況
- 新增指數退避重試機制

**技術細節**:
- 資料庫插入前預先檢查現有棧板號
- 優雅處理 `PGRST116`（未找到記錄）與實際錯誤的區別
- 重試機制包含 3 次嘗試和遞增延遲（100ms, 200ms, 300ms）
- 針對重複棧板情況提供用戶友好的錯誤訊息

**修改的檔案**:
- `app/actions/qcActions.ts` - 增強重複防護和重試邏輯
- `app/components/qc-label-form/hooks/useQcLabelBusiness.tsx` - 前端錯誤處理改進

**技術實施詳情**:
- **後端改進**:
  - 插入前重複檢查，包含 `PGRST116` 錯誤代碼處理
  - 指數退避重試機制（100ms, 200ms, 300ms 延遲）
  - 增強錯誤訊息，區分重複與其他資料庫錯誤
  - 優雅處理約束違反，提供用戶友好訊息

- **前端改進**:
  - 棧板號生成自動重試（最多 3 次嘗試）
  - 早期檢測和處理重複棧板錯誤
  - 重複檢測時重置進度和表單狀態管理
  - 用戶通知系統，提供具體的重試指導

**影響**: 
- 消除生產環境中的重複主鍵約束違反錯誤
- 透過自動重試機制減少用戶挫折感
- 提供清晰、可操作的錯誤訊息，改善用戶體驗
- 提升系統在高並發負載下的韌性
- 增強調試能力，提供完整的日誌記錄

---

### 2025-06-08: 原子性棧板號生成實施

**解決的問題**: 
- 修復由競爭條件引起的重複棧板號生成問題
- 錯誤：`duplicate key value violates unique constraint "record_palletinfo_pkey"`

**實施的解決方案**:
- 使用 `generate_atomic_pallet_numbers_v2()` RPC 函數創建原子性棧板號生成
- 實施 `daily_pallet_sequence` 資料表進行序列管理
- 在 `app/actions/qcActions.ts` 中將舊的 `generatePalletNumbers()` 替換為原子性版本

**技術細節**:
- 新增具有原子性 UPDATE 操作的 `daily_pallet_sequence` 資料表
- 使用 `INSERT ... ON CONFLICT` 防止競爭條件
- 實施舊序列記錄的自動清理（7+ 天）
- 新增 `monitor_pallet_generation_performance_v2()` 效能監控

**修改的檔案**:
- `app/actions/qcActions.ts` - 更新為使用原子性 RPC 函數
- `scripts/fix-atomic-pallet-generation.sql` - 新的原子性函數
- `lib/atomicPalletUtils.ts` - TypeScript 包裝函數

**測試結果**:
- 並發測試：10 個請求 × 3 個棧板 = 30 個唯一號碼（0 個重複）
- 效能：10 個並發請求耗時 164ms
- 所有邊緣情況都得到妥善處理

**影響**: 
- 完全消除棧板號重複問題
- 提升多用戶環境下的系統可靠性
- 增強效能監控能力

---

## 先前的改進

### PDF 生成增強
- 改善 PDF 渲染效能
- 新增更好的 PDF 生成失敗錯誤處理
- 實施批次操作的進度追蹤

### UI/UX 改進
- 行動響應式設計增強
- 更好的表單驗證與即時回饋
- 改善載入狀態和用戶回饋

### 資料庫整合
- 增強資料庫操作的錯誤處理
- 改善交易管理
- 資料庫插入前更好的資料驗證

---

## 未來考量

- 監控原子性棧板生成效能
- 考慮實施大規模列印的批次操作
- 評估額外序列管理功能的需求 