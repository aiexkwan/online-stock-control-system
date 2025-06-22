# GRN標籤列印系統

## 概述

GRN（Goods Received Note）標籤列印系統係用嚟記錄同管理收貨資訊嘅核心功能模組。系統整合咗用戶認證、供應商驗證、重量計算、資料庫記錄同PDF生成功能，為每批來貨嘅每個棧板產生專業嘅收貨標籤。

## 系統架構

### 主要頁面
- `/print-grnlabel`: GRN標籤列印主頁面

### 核心組件結構

#### 主要組件
- `app/print-grnlabel/page.tsx`: 主頁面提供標題同佈局
- `app/print-grnlabel/components/GrnLabelFormV2.tsx`: 核心表單組件處理所有GRN邏輯

#### 業務邏輯Hooks
- `app/print-grnlabel/hooks/useGrnLabelBusinessV2.ts`: 主要業務邏輯處理列印請求
- `app/print-grnlabel/hooks/useSupplierValidation.ts`: 供應商代碼驗證
- `app/print-grnlabel/hooks/useWeightCalculation.ts`: 重量計算邏輯
- `app/print-grnlabel/hooks/usePalletGenerationGrn.ts`: 棧板號碼同系列生成

#### 服務同動作
- `app/actions/grnActions.ts`: 處理所有GRN相關嘅資料庫操作
- `app/services/generateUniqueSeriesService.ts`: 生成唯一系列號碼
- `app/services/pdfGrnService.ts`: GRN標籤PDF生成

## 數據流向

### 資料庫表
- `record_palletinfo`: 棧板基本資訊（棧板號、系列號、產品代碼、數量）
- `record_grn`: GRN詳細記錄（GRN參考、物料代碼、供應商、重量、計數）
- `record_history`: 操作歷史追蹤
- `record_inventory`: 庫存位置更新
- `data_supplier`: 供應商資料驗證
- `data_code`: 產品代碼驗證
- `daily_pallet_sequence`: 每日棧板序列追蹤

### 重量計算系統

#### 棧板類型重量
- White Dry: 14kg
- White Wet: 19kg
- Chep Dry: 33kg
- Chep Wet: 38kg
- Euro: 30kg
- Not Included: 0kg

#### 包裝類型重量
- Still: 50kg
- Bag: 1kg
- Tote: 10kg
- Octo: 25kg
- Not Included: 0kg

#### 計算公式
```
淨重 = 毛重 - 棧板重量 - 包裝重量
```

## 工作流程

### 1. 用戶認證
- 自動獲取登入用戶嘅clock number
- 設置操作員身份資訊

### 2. 表單填寫

#### GRN詳情
- GRN號碼（必填）
- 供應商代碼（必填，即時驗證）
- 物料代碼（必填，即時驗證）

#### 容器選擇
- 棧板類型選擇
- 包裝類型選擇

#### 重量輸入
- 支援最多22個棧板
- 每個棧板輸入毛重
- 系統自動計算淨重
- 動態添加/刪除重量條目

### 3. 即時驗證
- 供應商代碼查詢`data_supplier`表
- 產品代碼查詢`data_code`表
- 表單完整性檢查
- 重量格式驗證

### 4. Clock號碼確認
- 點擊"列印GRN標籤"按鈕
- 彈出確認對話框
- 驗證操作員clock號碼

### 5. 數據處理

#### 棧板號碼生成
- 使用原子RPC函數`generate_atomic_pallet_numbers_v5`
- 格式：`DDMMYY/XX`（日期+序列號）
- 確保每日序列唯一性

#### 系列號碼生成
- 調用`generateMultipleUniqueSeries`
- 每個棧板獲得唯一系列號碼

#### 資料庫事務
- 使用`createGrnDatabaseEntriesWithTransaction`進行原子操作
- 插入記錄到多個表
- 確保數據一致性

### 6. PDF生成
- 為每個棧板生成GRN標籤PDF
- 包含：
  - Pennine標誌
  - QR碼（系列或產品代碼）
  - 產品資訊
  - 重量/數量詳情
  - GRN號碼同供應商名稱
  - 日期同操作員資訊
  - 棧板號碼
- 上傳到Supabase Storage `pallet-label-pdf` bucket

### 7. 列印執行
- 收集所有生成嘅PDF
- 合併多個PDF文件
- 觸發瀏覽器列印對話框
- 成功後重置表單

## 技術實現

### 前端技術
- React配合TypeScript
- 橙色主題UI設計
- 玻璃擬態效果
- 響應式佈局
- Framer Motion動畫

### 狀態管理
- React Hook Form用於表單管理
- 自定義hooks用於業務邏輯
- 樂觀UI更新
- 錯誤邊界保護

### 後端整合
- Supabase用於資料庫同存儲
- 原子RPC函數用於關鍵操作
- 即時數據驗證
- Service role用於繞過RLS

### UI設計特色
- 深藍背景配橙色強調色
- 工業設計風格
- 動態背景元素
- 現代卡片設計
- 流暢過渡動畫

## 介面佈局

### 左側主區域
- GRN詳細資訊輸入
- 容器類型選擇
- 表單驗證同提交

### 右側固定區域
- 重量摘要顯示
- 單行棧板重量輸入
- 即時淨重計算
- 緊湊設計優化空間

### 互動元素
- 橙色聚焦效果
- 漸變按鈕設計
- 懸停動畫
- 可收合說明部分

## API端點同函數

### RPC函數
- `generate_atomic_pallet_numbers_v5`: 原子棧板號碼生成
- `execute_sql_query`: SQL查詢執行

### Server Actions
- `createGrnDatabaseEntriesWithTransaction`: 創建GRN記錄
- `uploadPdfToStorage`: PDF上傳到存儲

### 驗證服務
- 供應商代碼驗證
- 產品代碼驗證
- Clock號碼驗證

## 錯誤處理

### 驗證錯誤
- 無效供應商代碼警告
- 無效產品代碼警告
- 重量格式錯誤
- 缺少必填欄位

### 資料庫錯誤
- 事務回滾機制
- 重複記錄檢測
- 連接失敗處理
- 詳細錯誤日誌

### PDF生成錯誤
- 生成失敗重試
- 上傳錯誤處理
- 列印服務異常
- 用戶友好消息

## 性能優化

### 前端優化
- 表單狀態記憶化
- 防抖輸入驗證
- 虛擬化長列表
- 懶加載組件

### 後端優化
- 批量資料庫操作
- 連接池管理
- 查詢結果緩存
- PDF生成流式處理

### 緩存策略
- 供應商數據緩存
- 產品資訊緩存
- 表單數據持久化
- PDF模板緩存

## 安全考慮

### 認證同授權
- 基於會話嘅認證
- Clock號碼驗證
- 角色基礎訪問
- 操作審計跟蹤

### 數據驗證
- 客戶端同服務器端驗證
- SQL注入預防
- XSS保護
- CSRF令牌

### 存儲安全
- 安全PDF上傳
- 訪問控制列表
- 加密傳輸
- 定期安全審計

## 監控同日誌

### 操作日誌
- 每個GRN創建記錄
- 用戶操作追蹤
- 錯誤事件記錄
- 性能指標

### 系統監控
- 資料庫性能
- PDF生成時間
- API響應時間
- 存儲使用情況

## 維護同故障排除

### 常見問題
1. **重複棧板號碼**
   - 檢查`daily_pallet_sequence`表
   - 驗證RPC函數操作
   - 清除Next.js緩存

2. **PDF生成失敗**
   - 檢查存儲權限
   - 驗證PDF模板
   - 查看錯誤日誌

3. **供應商驗證失敗**
   - 確認供應商代碼存在
   - 檢查資料庫連接
   - 驗證查詢權限

### 維護任務
- 定期清理舊PDF文件
- 更新供應商資料庫
- 優化資料庫索引
- 備份關鍵數據

## 未來改進

### 計劃功能
- 批量GRN導入
- 條碼掃描整合
- 移動應用支援
- 高級報表功能

### 技術升級
- WebSocket即時更新
- 離線模式支援
- 改進緩存策略
- 微服務架構

### 用戶體驗
- 鍵盤快捷鍵
- 自動保存草稿
- 多語言支援
- 改進無障礙功能