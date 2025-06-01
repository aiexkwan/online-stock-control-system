# 資料庫結構文檔

> **最後更新**: 2025/5/25  
> **MCP工具連接狀態**: ✅ 成功連接  
> **Supabase項目**: bbmkuiplnzvpudszrend  

## 📊 資料庫概覽

- **總表格數**: 14個

## 📋 表格詳細信息

### 1. `data_code`

| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
| `code` | string | "0010" |
| `description` | string | "xxxBeany Baby Box" |
| `colour` | string | "-" |
| `standard_qty` | number | 1 |
| `type` | string | "ACO" |

### 2. `data_id`

| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
| `name` | string | "Matthew" |
| `id` | number | 1767 |
| `email` | string | "matthew@pennineindustries.com" |
| `uuid` | string | (由SUPABASE自動生成) |

### 3. `data_slateinfo`

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

| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
| `supplier_code` | string | "4P" |
| `supplier_name` | string | "Safic Alcan" |

### 5. `record_aco`

| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
| `uuid` | string | (由SUPABASE自動生成) |
| `order_ref` | number | 123456 |
| `code` | string | "MHWEDGE30" |
| `required_qty` | number | 600 |
| `remain_qty` | number | 0 |
| `latest_update` | string | (由SUPABASE自動生成) |

### 6. `record_history`

| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
| `time` | string | (由SUPABASE自動生成) |
| `id` | number | 5942 |
| `action` | string | "Finished QC" |
| `plt_num` | string | "250525/1" |
| `loc` | string | "Await" |
| `remark` | string | "ACO Ref : 123456" |
| `uuid` | string | (由SUPABASE自動生成) |

### 7. `record_inventory`

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
| `latest_update` | string | (由SUPABASE自動生成) |
| `plt_num` | string | "250525/1" |
| `damage` | number | 0 |

### 8. `record_palletinfo`

| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
| `generate_time` | string | (由SUPABASE自動生成) |
| `plt_num` | string | "250525/1" |
| `product_code` | string | "MHWEDGE30" |
| `series` | string | "250525-BC6K22" |
| `plt_remark` | string | "Finished In Production ACO ..." |
| `product_qty` | number | 120 |

### 9. `record_transfer`

| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
| `tran_date` | timestamp with time zone | (由SUPABASE自動生成) |
| `f_loc` | string | "Fold" |
| `t_loc` | string | "Await" |
| `plt_num` | string | "250525/1" |
| `operator_id` | number | 1234 |

### 10. `record_grn`

| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
| `grn_ref` | number | 123456 |
| `plt_num` | string | "250525/1" |
| `sup_code` | string | "AV" |
| `material_code` | string | "MEP9090150" |
| `gross_weight` | string | 123456 |
| `net_weight` | string | 123456 |
| `pallet` | string | "Euro" |
| `package` | string | "Bag" |
| `pallet_count` | number | 1 |
| `package_count` | number | 2 |

### 11. `record_slate`

| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
| `code` | string | "RS504X" |
| `plt_num` | string | "250525/1" |
| `setter` | string | "John" |
| `mach_num` | string | "Mach. No. 14" |
| `material` | string | "Mix Material 39" |
| `batch_num` | string | "393939A" |
| `weight` | number | 200 |
| `t_thick` | number | 300 |
| `b_thick` | number | 400 |
| `length` | number | 500 |
| `width` | number | 100 |
| `centre_hole` | number | 80 |
| `colour` | string | "Black" |
| `shape` | string | "Circle" |
| `flame_test` | number | 10 |
| `remark` | string | "Flame Going On" |
| `uuid` | string | (由SUPABASE自動生成) |
| `first_off` | data | "25-MAY-2025" |

### 12. `record_void`

| 欄位名稱 | 資料類型 | 範例值 |
|---------|---------|--------|
| `uuid` | string | (由SUPABASE自動生成) |
| `time` | timestamp with time zone | (由SUPABASE自動生成) |
| `plt_num` | string | "250525/1" |
| `reason` | string | "Damaged |
| `damage_qty` | number | 1000 |

## 📋 空表格

以下表格已創建但目前無數據：

- `debug_log`
- `report_log`
- `report_void`

## 📝 更新記錄

| 日期 | 更新內容 | 更新者 |
|------|---------|--------|
| 2025/5/25 | 自動更新資料庫結構信息 | 自動化腳本 |

---

> **注意**: 此文檔由自動化腳本生成。如需更新，請運行 `node scripts/update-database-docs.js`
