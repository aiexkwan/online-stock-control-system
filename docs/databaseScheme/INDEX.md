# 📚 資料庫架構文檔索引

本索引提供資料庫架構文檔庫的快速導航。

## 🔍 文檔說明
根據 README 規範，本文檔庫只能有一個資料庫結構文檔，以維護唯一性。

## 📋 文檔清單

| 檔案名稱 | 文檔主題 | 最後更新 | 覆蓋範圍 | 總表格數量 |
|---------|---------|----------|----------|----------|
| [databaseStructure.md](./databaseStructure.md) | Pennine 線上庫存控制系統 - 資料庫結構完整版 | 2025-07-23 | public, auth, storage, realtime, vault, supabase_migrations | 76個 |

## 📊 架構概覽

### Schema 分佈
- **public**: 核心業務表格（包含所有業務邏輯表格）
- **auth**: 身份驗證和授權相關表格
- **storage**: 檔案儲存管理表格
- **realtime**: 即時通訊相關表格
- **vault**: 敏感資料加密儲存
- **supabase_migrations**: 資料庫遷移記錄

### 主要業務模塊
1. **產品資料管理**
   - 產品主檔（data_code）
   - 磚板規格（data_slateinfo）
   - 供應商資料（data_supplier）

2. **用戶管理**
   - 員工資料（data_id）
   - 權限控制

3. **棧板管理**
   - 棧板資訊（record_palletinfo）
   - 編號管理（pallet_number_buffer）

4. **庫存管理**
   - 庫存分類帳（record_inventory）
   - 庫存水平（stock_level）
   - 轉移記錄（record_transfer）

5. **訂單處理**
   - 訂單主檔（record_aco）
   - 訂單明細（record_acoitem）
   - 發貨記錄（record_dispatch）

6. **交易記錄**
   - GRN收貨（record_grn）
   - 交易日誌（record_log）

7. **報表與分析**
   - 各類報表表格
   - 分析輔助表格

### 資料完整性
- **外鍵關係**：完整定義，確保參照完整性
- **索引策略**：針對查詢性能優化
- **約束條件**：包含檢查約束、唯一約束等

## 🔄 維護記錄
- 📅 2025-07-23：資料庫結構完整版建立
- 📅 2025-07-28：建立 INDEX.md 索引文件

## 📝 備註
- 資料庫結構文檔遵循單一真實來源原則
- 任何架構變更都應更新在 databaseStructure.md 中
- 嚴禁創建重複的資料庫結構文檔