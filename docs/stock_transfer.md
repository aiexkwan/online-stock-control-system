# 庫存轉移系統

## 概述

庫存轉移系統是用於管理棧板在不同倉儲位置間移動的自動化功能模組。系統支援透過 QR Code 掃描或手動輸入棧板號/系列號進行智能搜尋，並根據預設業務規則自動計算目標位置，實現一鍵式庫存轉移操作。

## 系統架構

### 主要頁面
- `/stock-transfer`: 庫存轉移操作的主頁面，提供完整的轉移工作流程

### 核心組件結構

#### 主頁面組件
- `app/stock-transfer/page.tsx`: 庫存轉移頁面的主要邏輯和 UI 結構

#### 通用組件
- `components/ui/unified-search.tsx`: 統一搜尋組件，支援手動輸入和 QR Code 掃描
- `components/ui/stock-movement-layout.tsx`: 庫存移動頁面的統一佈局組件
- `app/components/qc-label-form/ClockNumberConfirmDialog.tsx`: 操作員身份確認對話框

#### UI 組件
- `StatusMessage`: 操作成功或失敗的狀態訊息顯示
- `OperationGuide`: 操作步驟指南顯示
- `ActivityLog`: 即時操作日誌顯示

#### 業務邏輯 Hooks
- `app/hooks/useStockMovement.tsx`: 庫存轉移的核心業務邏輯處理

## 數據流向

### 資料庫表結構
- `record_palletinfo`: 棧板基本資訊（棧板號、產品代碼、數量、系列號、備註）
- `record_history`: 所有操作歷史記錄，包含棧板當前位置資訊
- `record_inventory`: 各位置的產品庫存數量管理
- `data_id`: 操作員身份驗證資料
- `record_transfer`: 舊有轉移記錄表（已被 record_history 取代）

### 位置映射系統
系統維護位置名稱到資料庫欄位的映射關係：
- `Production` → `injection`
- `Await` → `await`
- `Fold Mill` → `fold_mill`
- `PipeLine` → `pipeline`
- `Bulk Room` → `bulk_room`

## 工作流程

### 1. 智能搜尋階段
- 使用者在 UnifiedSearch 組件中輸入棧板號或系列號，或掃描 QR Code
- 系統自動判斷輸入格式：
  - 包含 `/` 的視為棧板號（格式：`ddMMyy/N`）
  - 包含 `-` 的視為系列號（格式：`ddMMyy-XXXXXX`）
- 搜尋框具備自動聚焦功能，提升操作效率

### 2. 棧板資訊確認階段
useStockMovement Hook 執行 `searchPalletInfo` 功能：
- 從 `record_palletinfo` 獲取棧板基本資訊
- 從 `record_history` 獲取棧板最新位置資訊
- 保持原始大小寫進行精確匹配
- 顯示產品代碼、數量和當前位置

### 3. 目標位置計算階段
`calculateTargetLocation` 函數根據業務規則自動計算：
- **第一次移動**: `Await` → `Production`
- **第二次移動**: `Production` → `Fold Mill`
- **循環移動**: `Fold Mill` → `Production`
- **其他位置**: 統一移動到 `Production`
- **作廢棧板**: 位置為 'Voided' 的棧板無法移動

### 4. 身份驗證階段
- 系統彈出 ClockNumberConfirmDialog 要求輸入工號
- 驗證操作員身份後啟動轉移流程

### 5. 自動轉移執行階段
`executeStockTransfer` 函數執行以下操作：
- 插入 `record_history` 記錄：
  - `action`: "Stock Transfer"
  - `plt_num`: 棧板號
  - `loc`: 目標位置
  - `remark`: 轉移描述
  - `time`: 操作時間戳
- 更新 `record_inventory` 庫存：
  - 來源位置庫存減少
  - 目標位置庫存增加

### 6. 結果反饋階段
- 成功時顯示確認訊息並清除輸入
- 失敗時顯示錯誤訊息並保持狀態
- 搜尋框自動重新聚焦準備下次操作

## 技術實現

### 前端技術
- React Hooks 架構設計
- TypeScript 類型安全
- 深色主題 UI 設計
- 響應式佈局支援
- 即時狀態反饋

### 後端整合
- Supabase Client 直接資料庫操作
- 非原子性事務處理（前端執行多步驟操作）
- 即時資料同步
- 錯誤處理與回滾機制

### 搜尋功能特色
- 智能格式識別
- 大小寫敏感匹配
- QR Code 掃描支援
- 自動聚焦與清除
- 即時驗證反饋

## 業務規則引擎

### 轉移路徑規則
系統實現預定義的轉移路徑：
1. 新棧板從等待區開始（Await）
2. 進入生產區進行加工（Production）
3. 移至摺疊區進行後處理（Fold Mill）
4. 在生產區和摺疊區間循環
5. 其他位置統一回歸生產區

### 庫存管理規則
- 即時庫存數量更新
- 位置間庫存平衡維護
- 負庫存防護機制
- 庫存異常警告系統

## 自動化特色

### 一鍵式操作
- 掃描或輸入後自動執行轉移
- 無需手動確認目標位置
- 自動計算最佳轉移路徑
- 即時完成庫存更新

### 智能化處理
- 自動格式識別與驗證
- 智能目標位置計算
- 自動庫存數量調整
- 智能錯誤恢復機制

## 使用者體驗優化

### 操作簡化
- 移除手動執行按鈕
- 自動化轉移流程
- 簡化操作步驟
- 提升操作效率

### 視覺反饋
- 清晰的狀態指示
- 即時操作反饋
- 友好的錯誤訊息
- 直觀的操作指南

## 配置要求

### 環境變數
- Supabase 連接配置
- 資料庫存取權限
- 操作員驗證設定

### 權限設定
- 棧板資訊讀取權限
- 歷史記錄寫入權限
- 庫存數據更新權限
- 操作員身份驗證權限

## 效能考量

### 前端效能
- 組件狀態優化
- 搜尋結果快取
- 自動聚焦管理
- 記憶體使用優化

### 資料庫效能
- 索引優化查詢
- 批量操作處理
- 連接池管理
- 查詢結果快取

## 安全性設計

### 操作驗證
- 操作員身份確認
- 棧板狀態驗證
- 轉移權限檢查
- 操作日誌記錄

### 資料完整性
- 庫存數量一致性
- 轉移記錄完整性
- 錯誤狀態恢復
- 資料同步保證 