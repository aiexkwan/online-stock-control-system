# 資料庫結構文檔

> **最後更新**: 2025/5/25  
> **MCP工具連接狀態**: ✅ 成功連接  
> **Supabase項目**: bbmkuiplnzvpudszrend  

## 📊 資料庫概覽

- **總表格數**: 14個
- **總記錄數**: 8,545筆
- **有數據的表格**: 8個
- **空表格**: 6個

## 📋 表格詳細信息

### 1. `data_code`
**記錄數**: 8,411筆  

| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
| `code` | string | "0010" |
| `description` | string | "xxxBeany Baby Box" |
| `colour` | string | "-" |
| `standard_qty` | number | "-" |
| `type` | string | "-" |

### 2. `data_id`
**記錄數**: 22筆  

| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
| `name` | string | "Matthew" |
| `id` | number | 1767 |
| `email` | string | "matthew@pennineindustries.com" |
| `uuid` | string | "bda83282-2417-4784-b74e-38e..." |

### 3. `data_slateinfo`
**記錄數**: 14筆  

| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
| `product_code` | string | "RS500" |
| `description` | string | "Ecoslate - Grey" |
| `tool_num` | string | "-" |
| `weight` | string | "675g - 730g" |
| `thickness_top` | string | "Top 3.50mm" |
| `thickness_bottom` | string | "Bottom 7.5mm" |
| `length` | string | "430mm" |
| `width` | string | "300mm" |
| `hole_to_bottom` | string | "-" |
| `colour` | string | "Grey" |
| `shapes` | string | "Colonial" |

### 4. `data_supplier`
**記錄數**: 64筆  

| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
| `supplier_code` | string | "4P" |
| `supplier_name` | string | "Safic Alcan" |

### 5. `record_aco`
**記錄數**: 1筆  

| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
| `uuid` | string | "fcdb3d5f-1410-45c3-b15f-f56..." |
| `order_ref` | number | 123456 |
| `code` | string | "MHWEDGE30" |
| `required_qty` | number | 600 |
| `remain_qty` | number | 0 |
| `latest_update` | string | "2025-05-24T23:42:15.915407+..." |

### 6. `record_history`
**記錄數**: 11筆  

| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
| `time` | string | "2025-05-24T23:42:15.433+00:00" |
| `id` | number | 5942 |
| `action` | string | "Finished QC" |
| `plt_num` | string | "250525/1" |
| `loc` | string | "Await" |
| `remark` | string | "ACO Ref : 123456" |
| `uuid` | string | "8c99de10-a422-4128-b567-c55..." |

### 7. `record_inventory`
**記錄數**: 11筆  

| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
| `product_code` | string | "MHWEDGE30" |
| `injection` | number | 0 |
| `pipeline` | number | 0 |
| `prebook` | number | 0 |
| `await` | number | 120 |
| `fold` | number | 0 |
| `bulk` | number | 0 |
| `backcarpark` | number | 0 |
| `uuid` | string | "dff8266d-2642-443b-96fe-67d..." |
| `latest_update` | string | "2025-05-24T23:42:15.85891+0..." |
| `plt_num` | string | "250525/1" |
| `damage` | number | 0 |

### 8. `record_palletinfo`
**記錄數**: 11筆  

| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
| `generate_time` | string | "2025-05-24T23:42:15.758608+..." |
| `plt_num` | string | "250525/1" |
| `product_code` | string | "MHWEDGE30" |
| `series` | string | "250525-BC6K22" |
| `plt_remark` | string | "Finished In Production ACO ..." |
| `product_qty` | number | 120 |

## 📋 空表格

以下表格已創建但目前無數據：

- `debug_log`
- `record_grn`
- `record_slate`
- `record_transfer`
- `report_log`
- `report_void`

## 📊 統計摘要

| 表格名稱 | 記錄數 | 狀態 |
|---------|--------|------|
| `data_code` | 8,411 | ✅ 有數據 |
| `data_id` | 22 | ✅ 有數據 |
| `data_slateinfo` | 14 | ✅ 有數據 |
| `data_supplier` | 64 | ✅ 有數據 |
| `debug_log` | 0 | ⚪ 空表格 |
| `record_aco` | 1 | ✅ 有數據 |
| `record_grn` | 0 | ⚪ 空表格 |
| `record_history` | 11 | ✅ 有數據 |
| `record_inventory` | 11 | ✅ 有數據 |
| `record_palletinfo` | 11 | ✅ 有數據 |
| `record_slate` | 0 | ⚪ 空表格 |
| `record_transfer` | 0 | ⚪ 空表格 |
| `report_log` | 0 | ⚪ 空表格 |
| `report_void` | 0 | ⚪ 空表格 |

## 📝 更新記錄

| 日期 | 更新內容 | 更新者 |
|------|---------|--------|
| 2025/5/25 | 自動更新資料庫結構信息 | 自動化腳本 |

---

> **注意**: 此文檔由自動化腳本生成。如需更新，請運行 `node scripts/update-database-docs.js`
