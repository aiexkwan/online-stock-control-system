# Ask Me Anything - OpenAI 驅動的智能資料庫查詢系統

## 概述

Ask Me Anything 是一個完全重新設計的智能資料庫查詢系統，使用 OpenAI GPT-4o 來處理自然語言問題並生成精確的 SQL 查詢。系統已完全移除之前的函數訓練和本地意圖分類，改為使用 OpenAI 的強大能力來理解用戶問題並生成適當的資料庫查詢。

## 系統架構

### 核心組件

1. **API 路由** (`app/api/ask-database/route.ts`)
   - 處理用戶查詢請求
   - 管理 OpenAI API 調用
   - 執行 SQL 查詢
   - 生成自然語言回應

2. **前端組件** (`app/components/AskDatabaseInlineCard.tsx`)
   - 用戶界面
   - 查詢輸入和結果顯示
   - 會話管理

3. **OpenAI Prompt** (`docs/openAIprompt`)
   - 詳細的系統指示
   - 資料庫結構映射
   - 查詢生成規則

## 工作流程

### 1. 用戶輸入處理
- 用戶輸入自然語言問題（支援中文和英文）
- 系統檢查用戶權限
- 檢查緩存中是否有相同查詢的結果

### 2. OpenAI SQL 生成
- 讀取 `docs/openAIprompt` 作為系統指示
- 包含會話歷史（最近3次對話）
- 使用 GPT-4o 生成 SQL 查詢
- 驗證生成的 SQL 是否為安全的 SELECT 查詢

### 3. SQL 執行
- 使用 Supabase RPC 函數 `execute_query` 執行 SQL
- 記錄執行時間和結果
- 處理錯誤和異常情況

### 4. 自然語言回應生成
- 使用 OpenAI 分析查詢結果
- 生成專業的英式風格回應
- 根據結果數據提供清晰的答案

### 5. 結果緩存和記錄
- 緩存查詢結果以提高性能
- 保存會話歷史
- 記錄 token 使用量

## 安全特性

### SQL 注入防護
- 只允許 SELECT 查詢
- 檢查危險關鍵字
- 防止多語句執行
- 使用 RPC 函數安全執行

### 權限控制
- 基於用戶電子郵件的權限檢查
- 開發環境下的測試模式
- 限制訪問特定用戶

### 數據保護
- 不暴露敏感的資料庫結構
- 錯誤訊息不包含內部細節
- 完整的審計軌跡

## 性能優化

### 緩存機制
- LRU 緩存查詢結果（2小時 TTL）
- 會話歷史緩存（24小時 TTL）
- 用戶名稱緩存

### 並行處理
- 並行執行權限檢查和歷史獲取
- 異步保存操作不阻塞回應
- 智能緩存鍵生成

### Token 管理
- 追蹤 OpenAI API 使用量
- 記錄每次查詢的 token 消耗
- 成本監控和優化

## 支援的查詢類型

### 基本統計查詢
- 托盤計數（今天、昨天、本週等）
- 產品庫存統計
- GRN 收貨記錄
- 轉移記錄統計

### 複雜分析查詢
- 庫存排名（最高/最低）
- 產品過濾（按顏色、類型等）
- 重量統計和分析
- 員工活動追蹤

### 歷史查詢
- 托盤歷史記錄
- 操作歷史
- 作廢記錄
- ACO 訂單狀態

## 使用範例

### 中文查詢
```
今天生成了多少個托盤？
顯示庫存最高的前5個產品
MHCOL2產品的總庫存是多少？
本週有哪些轉移記錄？
```

### 英文查詢
```
How many pallets were generated today?
Show top 5 products with highest inventory
What is the total inventory for MHCOL2?
What transfer records were made this week?
```

## 配置要求

### 環境變數
- `OPENAI_API_KEY`: OpenAI API 密鑰
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 項目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 匿名密鑰

### 資料庫要求
- 需要 `execute_query` RPC 函數
- 需要 `query_record` 表來記錄查詢歷史
- 適當的表權限設置

## 監控和調試

### 日誌記錄
- 詳細的請求/回應日誌
- OpenAI API 調用追蹤
- SQL 執行監控
- 錯誤和異常記錄

### 狀態檢查
- GET `/api/ask-database` 提供系統狀態
- 環境配置檢查
- 資料庫連接驗證
- 用戶權限狀態

### 測試工具
- `scripts/test-ask-database.js` 自動化測試腳本
- 支援多種查詢類型測試
- 性能和準確性驗證

## 未來改進

### 功能增強
- 支援更多語言
- 圖表和視覺化結果
- 查詢建議和自動完成
- 更智能的會話上下文

### 性能優化
- 更智能的緩存策略
- 查詢結果預計算
- 批量查詢支援
- 響應時間優化

### 安全增強
- 更細粒度的權限控制
- 查詢複雜度限制
- 速率限制
- 審計和合規性

## 技術債務清理

### 已移除的組件
- `intent-classifier.ts` - 本地意圖分類系統
- `answer-generator.ts` - 本地回答生成器
- `query_training/` - 函數訓練相關文件
- 所有 RPC 函數映射和本地處理邏輯

### 代碼簡化
- 統一的 OpenAI 處理流程
- 簡化的錯誤處理
- 更清晰的代碼結構
- 減少維護負擔

這個新實現提供了更強大、更靈活、更易維護的智能查詢系統，充分利用了 OpenAI 的先進能力來理解和處理複雜的自然語言查詢。 