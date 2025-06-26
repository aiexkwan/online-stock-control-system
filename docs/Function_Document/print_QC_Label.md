# QC標籤列印系統

## 概述

QC標籤列印系統係用嚟生成同列印質量控制標籤嘅核心功能，支援ACO同Slate兩種特殊產品類型。系統提供完整嘅標籤生成工作流程，包括產品驗證、數量管理、操作員認證同PDF生成。

## 系統架構

### 主要頁面
- `/print-label`: QC標籤列印主頁面

### 核心組件結構

#### 主表單組件
- `app/components/qc-label-form/PerformanceOptimizedForm.tsx`: 主表單組件，處理用戶輸入同流程控制
- `app/components/qc-label-form/ProductSection.tsx`: 產品資訊輸入區塊
- `app/components/qc-label-form/ProgressSection.tsx`: 標籤列印進度顯示

#### 輸入組件
- `app/components/qc-label-form/ProductCodeInput.tsx`: 產品代碼輸入，支援即時搜尋同驗證
- `app/components/qc-label-form/EnhancedFormField.tsx`: 增強表單欄位組件
- `app/components/qc-label-form/EnhancedProgressBar.tsx`: 現代化進度條

#### 對話框組件
- `app/components/qc-label-form/ClockNumberConfirmDialog.tsx`: 操作員身份確認
- `app/components/qc-label-form/ErrorBoundary.tsx`: 錯誤邊界處理

#### 業務邏輯Hooks（V2優化版）
- `app/components/qc-label-form/hooks/useQcLabelBusiness.tsx`: QC標籤生成核心業務邏輯
- `app/components/qc-label-form/hooks/modules/useFormValidation.tsx`: 表單驗證邏輯
- `app/components/qc-label-form/hooks/modules/useErrorHandler.tsx`: 統一錯誤處理
- `app/components/qc-label-form/hooks/modules/useDatabaseOperationsV2.tsx`: 資料庫操作
- `app/components/qc-label-form/hooks/modules/usePalletGenerationV2.tsx`: 棧板號生成
- `app/components/qc-label-form/hooks/modules/usePdfGenerationV2.tsx`: PDF生成
- `app/components/qc-label-form/hooks/modules/useAutoSaveV2.tsx`: 自動保存
- `app/components/qc-label-form/hooks/modules/useSlateManagement.tsx`: Slate產品管理
- `app/components/qc-label-form/hooks/modules/useAcoManagement.tsx`: ACO產品管理

## 數據流向

### 資料庫表
- `record_palletinfo`: 棧板基本資訊儲存
- `record_history`: 操作歷史記錄
- `record_inventory`: 庫存數量管理
- `data_code`: 產品代碼資料
- `data_id`: 操作員身份驗證
- `pallet_number_buffer`: 棧板號碼緩衝池
- `daily_pallet_sequence`: 每日棧板序列管理
- `record_aco`: ACO訂單記錄（ACO產品專用）
- `record_slate`: Slate產品記錄（Slate產品專用）

### 存儲系統
- Supabase Storage `pallet-label-pdf` bucket: QC標籤PDF檔案儲存

## 工作流程

### 1. 產品資訊輸入
- 輸入產品代碼，系統即時搜尋驗證
- 顯示產品描述同標準數量
- 輸入實際數量同棧板數量
- 可選輸入操作員clock號碼

### 2. 特殊產品處理

#### ACO產品
- 需要輸入ACO訂單參考號
- 系統查詢訂單詳情同剩餘數量
- 確保不超過訂單剩餘數量
- 自動更新訂單完成狀態

#### Slate產品
- 需要輸入批次號碼
- 特殊標籤格式處理
- 記錄到`record_slate`表

### 3. 身份驗證
- 提交前彈出clock號碼確認對話框
- 驗證操作員身份
- 記錄QC clock號碼

### 4. 數據準備（V2優化）
- 使用`generate_atomic_pallet_numbers_v5` RPC函數生成棧板號
- 格式：`DDMMYY/XXXX`（日期+4位數字序列）
- 生成唯一系列號格式：`DDMMYY-XXXXXX`
- 準備PDF生成所需數據

### 5. 批量處理（V2優化）
- 原子性資料庫操作確保數據一致性
- 插入`record_palletinfo`記錄
- 插入`record_history`操作記錄
- 更新`record_inventory`庫存
- ACO產品更新`record_aco`
- Slate產品更新`record_slate`

### 6. PDF生成同儲存
- 根據數據生成QC標籤PDF
- 包含內容：
  - 公司標誌
  - QR碼（產品代碼+棧板號）
  - 產品代碼同描述
  - 數量、日期、操作員/QC clock號碼
  - 工作訂單資訊（如適用）
  - 棧板號碼
- 上傳PDF到Supabase Storage
- 支援多個PDF合併

### 7. 列印觸發
- 合併所有PDF（如需要）
- 觸發瀏覽器列印對話框
- 用戶確認後執行列印

### 8. 進度監控同錯誤處理
- 即時顯示處理狀態
- 錯誤分級處理（嚴重/高/中/低）
- 友好錯誤消息顯示
- 錯誤記錄到資料庫

## 技術實現

### 前端技術
- React組件化架構
- TypeScript類型安全
- Tailwind CSS現代化UI
- 玻璃擬態設計風格
- 響應式設計支援

### 狀態管理
- React Hook Form表單管理
- 模組化hooks架構
- 自動保存功能
- 錯誤邊界保護

### 後端整合
- Supabase作為後端服務
- RPC函數用於原子操作
- 即時數據驗證
- PDF生成API服務

### UI設計特色
- 深藍色/深色主題
- 動態漸變背景
- 半透明玻璃效果
- 邊框光效同懸停互動
- 現代化按鈕設計
- 清晰視覺回饋

## 標籤格式

### 標準QC標籤
- 尺寸：210mm x 145mm
- 包含公司標誌（左上）
- QR碼（右上）
- 產品資訊（中間）
- 數據表格（數量、日期、clock號碼）
- 棧板號碼（右下）

### ACO特殊標籤
- 額外顯示ACO訂單參考
- 訂單特定要求處理

### Slate特殊標籤
- 顯示批次號碼
- 客製化產品描述

## API端點

### PDF生成API
- `/api/print-label-pdf/`: QC標籤PDF生成
- 支援批量PDF生成
- 自動檔案上傳管理

### 數據查詢API
- 產品代碼驗證
- 庫存數量查詢
- 操作員身份驗證
- ACO訂單查詢

### 自動補貨API
- `/api/auto-reprint-label-v2/`: 自動補貨標籤生成
- 使用V5棧板號生成函數
- 優化性能同可靠性

## 棧板號生成優化（V5）

### 核心功能
- 使用`generate_atomic_pallet_numbers_v5` RPC函數
- 支援數字排序（解決字符串排序問題）
- 實現緩衝池機制提升性能
- 原子性操作確保唯一性

### 緩衝池機制
- 預生成棧板號碼存入`pallet_number_buffer`
- 減少實時生成延遲
- 自動補充緩衝池
- 防止並發衝突

### 自動清理
- 使用Supabase Scheduler（pg_cron）
- 每5分鐘自動執行清理
- 清理規則：
  - 刪除非今日條目
  - 刪除已使用超過2小時條目
  - 刪除未使用超過30分鐘條目
  - 保持最多100個未使用條目

## 性能優化

### 前端優化
- 組件懶加載
- 表單狀態模組化管理
- 進度條性能優化
- 防抖同節流處理
- 虛擬列表渲染

### 後端優化
- 批量資料庫操作
- PDF生成快取
- 檔案上傳優化
- 查詢性能優化
- 連接池管理

### 緩存策略
- 產品代碼搜尋結果緩存
- 表單數據本地存儲
- PDF模板緩存
- API響應緩存

## 錯誤處理機制

### 分級錯誤處理
- **嚴重錯誤**: 系統無法繼續（資料庫連接失敗）
- **高級錯誤**: 操作失敗（棧板號生成失敗）
- **中級錯誤**: 部分功能受影響（PDF生成錯誤）
- **低級錯誤**: 非關鍵問題（驗證警告）

### 錯誤恢復
- 自動重試機制
- 降級處理策略
- 用戶友好提示
- 詳細錯誤日誌

## 監控同維護

### 系統監控
- 棧板號生成日誌
- 緩衝區使用情況
- 清理任務執行狀態
- API性能指標

### 日常維護
- 檢查錯誤日誌
- 監控緩衝池狀態
- 清理過期PDF文件
- 更新產品數據

### 故障排除

#### 產品代碼搜尋問題
- 檢查網絡連接
- 確認產品代碼存在
- 查看控制台錯誤
- 檢查API權限

#### 棧板號生成失敗
- 檢查RPC函數狀態
- 確認資料庫權限
- 查看緩衝區狀態
- 檢查序列號衝突

#### PDF生成錯誤
- 檢查Storage權限
- 確認PDF API正常
- 查看錯誤日誌
- 驗證數據完整性

## 最佳實踐

### 操作建議
1. 定期檢查產品代碼準確性
2. 確保操作員工號正確
3. 避免頻繁重複提交
4. 及時處理錯誤提示

### 性能建議
1. 批量列印優於單個列印
2. 避免高峰期大量操作
3. 定期清理歷史數據
4. 優化產品搜尋查詢

### 安全建議
1. 定期更新操作員權限
2. 審核異常操作記錄
3. 保護敏感數據
4. 定期安全審計

## 版本歷史

### V2.1修復版（2025-06-14）
- 修復產品代碼搜尋無限載入
- 修復clock號碼驗證卡住
- 統一使用標準browser client
- 修復表單驗證類型錯誤
- 改善錯誤處理同用戶體驗

### V2優化版（2025-06）
- 實現模組化架構
- 優化棧板號生成（V5）
- 增加自動保存功能
- 改進錯誤處理機制
- 實現自動清理功能

### V1初始版
- 基本QC標籤功能
- 支援ACO/Slate產品
- PDF生成同列印
- 基礎錯誤處理