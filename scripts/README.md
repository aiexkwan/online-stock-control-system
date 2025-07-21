# Scripts 目錄說明

本目錄包含系統維護、診斷同管理用嘅腳本。

## 📌 核心腳本（Package.json 引用）

- `init-auth.ts` - 初始化認證系統
- `auto-push.js` - 自動推送到 Git
- `kill-localhost.js` - 終止本地開發服務器

## 🔍 診斷工具（建議保留）

### 系統健康檢查
- `check-dashboard-config.js` - 檢查儀表板配置
- `check-stock-data.js` - 檢查庫存數據完整性
- `check-pallet-numbers.js` - 檢查棧板號碼系統
- `check-order-status.ts` - 檢查訂單處理狀態
- `check-foreign-key.js` - 驗證數據表關聯

### 環境檢查
- `check-env.js` - 檢查環境變數配置

## 🧹 清理腳本

### 活躍使用
- `cleanup-buffer-advanced.sql` - 定期清理棧板緩衝區
- `force-cleanup-buffer.sql` - 緊急清理緩衝區
- `setup-auto-cleanup-cron.sql` - 設置自動清理
- `deploy-cleanup-function-only.sql` - 部署清理函數

### 可能過時（建議檢查後刪除）
- `cleanup-dashboard-settings.js` - 功能重複
- `cleanup-all-records.js` - 功能重複
- `cleanup-dashboard-settings-batch.js` - 功能重複

## 🔧 修復腳本（建議保留）

- `fix-ask-database.js` - 修復 Ask Database 功能
- `fix-execute-sql-query.sql` - 修復 SQL 查詢安全檢查
- `fix-pallet-number-ordering.sql` - 修復棧板編號排序
- `fix-v5-array-ordering.sql` - 確保 v5 函數輸出排序

## 📊 RPC 函數定義

### 活躍使用
- `admin-dashboard-rpc-functions.sql` - 管理儀表板統計函數

### 未使用（考慮刪除或實施）
- `employee-statistics-rpc-functions.sql` - 員工統計函數
- `work-level-rpc-functions.sql` - 工作水平分析函數

## 🚀 部署同優化

### 棧板系統
- `create-pallet-v6-function.sql` - V6 棧板生成函數
- `deploy-v3-function.sql` - V3 棧板生成函數
- `optimize-pallet-generation-v4.sql` - V4 優化版本

### 數據庫優化
- `analyze-stock-transfer-indexes.sql` - 分析索引性能
- `optimize-stock-transfer-queries.sql` - 優化查詢
- `create-final-indexes.sql` - 創建性能索引

## 📦 一次性遷移（已完成可歸檔）

- `run-channel-migration.js` - 渠道遷移
- `run-dashboard-migration.js` - 儀表板遷移
- `createUsersFromDataID.ts` - 用戶創建
- `batchAddPasswordChangeFlag.ts` - 密碼標記更新

## 🛠️ 工具腳本

- `fetch-graphql-schema.js` - 獲取 GraphQL schema
- `list-tables.js` - 列出數據庫表
- `set-mcp-config.js` - 設置 MCP 配置

## ⚠️ 使用注意事項

1. 執行任何清理或修復腳本前，請先備份數據
2. 部分腳本需要特定環境變數（見各腳本頭部說明）
3. 一次性腳本執行後可移至 `archive/` 目錄
4. 診斷工具可定期運行監控系統健康

## 🗓️ 維護建議

- **每週**：運行診斷工具檢查系統健康
- **每月**：檢查清理腳本執行情況
- **每季**：評估未使用腳本，歸檔完成嘅遷移
- **持續**：記錄新腳本用途同執行結果
