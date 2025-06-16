# Widget 資料提取方式檢查清單

## 1. Stats Card Widget (`EnhancedStatsCardWidget`)
**檔案**: `app/components/dashboard/widgets/EnhancedStatsCardWidget.tsx`
**資料來源**: 
- 根據 `dataSource` 配置提取不同數據
- 使用模擬數據 (Math.random())
- **問題**: 沒有連接真實數據源

## 2. Output Stats Widget (`OutputStatsWidget`)
**檔案**: `app/components/dashboard/widgets/OutputStatsWidget.tsx`
**資料來源**:
```typescript
// 今日產出
supabase
  .from('record_palletinfo')
  .select('*', { count: 'exact', head: true })
  .gte('generate_time', todayStart)
  .lte('generate_time', todayEnd)
  .not('plt_remark', 'ilike', '%Material GRN-%')
```
- **時間範圍**: Today, Yesterday, Past 3 days, This week
- **資料表**: `record_palletinfo`
- **篩選條件**: 排除 Material GRN

## 3. Booked Out Stats Widget (`BookedOutStatsWidget`)
**檔案**: `app/components/dashboard/widgets/BookedOutStatsWidget.tsx`
**資料來源**:
```typescript
// 獲取棧板編號
const palletResult = await supabase
  .from('record_palletinfo')
  .select('plt_num')
  .gte('generate_time', todayStart)
  .lte('generate_time', todayEnd)
  .not('plt_remark', 'ilike', '%Material GRN-%');

// 計算轉移數量
const transferResult = await supabase
  .from('record_transfer')
  .select('plt_num')
  .in('plt_num', palletNums);
```
- **資料表**: `record_palletinfo`, `record_transfer`
- **計算方式**: 查找已轉移的棧板數量

## 4. Ask Database Widget (`EnhancedAskDatabaseWidget`)
**檔案**: `app/components/dashboard/widgets/EnhancedAskDatabaseWidget.tsx`
**資料來源**:
- 使用 OpenAI API 執行自然語言查詢
- 通過 `/api/ask-database` endpoint
- **需要**: OpenAI API Key

## 5. Product Mix Chart Widget (`ProductMixChartWidget`)
**檔案**: `app/components/dashboard/widgets/ProductMixChartWidget.tsx`
**資料來源**:
```typescript
// 使用模擬數據
const mockData = [
  { name: 'Product A', value: Math.floor(Math.random() * 1000) + 500 },
  { name: 'Product B', value: Math.floor(Math.random() * 800) + 400 },
  // ...
];
```
- **問題**: 完全使用模擬數據，沒有連接真實數據源

## 6. ACO Order Progress Widget (`AcoOrderProgressWidget`)
**檔案**: `app/components/dashboard/widgets/AcoOrderProgressWidget.tsx`
**資料來源**:
```typescript
// 未完成訂單
supabase
  .from('record_aco')
  .select('*')
  .gt('remain_qty', 0)
  .order('order_ref', { ascending: false })

// 訂單進度
supabase
  .from('record_aco')
  .select('*')
  .eq('order_ref', orderRef)
```
- **資料表**: `record_aco`
- **計算**: 完成百分比 = ((required_qty - remain_qty) / required_qty) * 100

## 7. Inventory Search Widget (`InventorySearchWidget`)
**檔案**: `app/components/dashboard/widgets/InventorySearchWidget.tsx`
**資料來源**:
```typescript
supabase
  .from('record_inventory')
  .select('*')
  .eq('product_code', productCode.toUpperCase())
```
- **資料表**: `record_inventory`
- **聚合欄位**: injection, pipeline, await, fold, bulk, backcarpark, damage

## 8. Finished Product Widget (`FinishedProductWidget`)
**檔案**: `app/components/dashboard/widgets/FinishedProductWidget.tsx`
**資料來源**:
```typescript
// 使用 PrintHistory 組件
// 從 record_palletinfo 表獲取數據
// 篩選非 Material GRN 的記錄
```

## 9. Material Received Widget (`MaterialReceivedWidget`)
**檔案**: `app/components/dashboard/widgets/MaterialReceivedWidget.tsx`
**資料來源**:
```typescript
// 使用 GrnHistory 組件
// 從 record_grn 表獲取 GRN 記錄
```

## 10. Pallet Overview Widget (`PalletOverviewWidget`)
**檔案**: `app/components/dashboard/widgets/PalletOverviewWidget.tsx`
**資料來源**:
```typescript
// 使用 PalletDonutChart 組件
// 計算產出和轉移的棧板數量
```

## 11. Void Stats Widget (`VoidStatsWidget`)
**檔案**: `app/components/dashboard/widgets/VoidStatsWidget.tsx`
**資料來源**:
```typescript
// 使用 VoidStatisticsCard 組件
// 從 record_void 表獲取作廢統計
```

## 12. Void Pallet Widget (`VoidPalletWidget`)
**檔案**: `app/components/dashboard/widgets/VoidPalletWidget.tsx`
**資料來源**:
```typescript
// 總數和時間範圍統計
supabase.from('record_void').select('*', { count: 'exact', head: true })

// 最近作廢記錄
supabase
  .from('record_void')
  .select('*')
  .order('void_date', { ascending: false })
  .limit(size === WidgetSize.MEDIUM ? 5 : 10)
```
- **資料表**: `record_void`
- **圖表**: 7天趨勢

## 13. View History Widget (`ViewHistoryWidget`)
**檔案**: `app/components/dashboard/widgets/ViewHistoryWidget.tsx`
**資料來源**:
```typescript
// 使用 record_transfer 表作為查詢記錄
supabase
  .from('record_transfer')
  .select('*', { count: 'exact', head: true })
  .gte('updated_at', todayStart)
```
- **問題**: 使用 transfer 表代替專門的查詢記錄表

## 14. Database Update Widget (`DatabaseUpdateWidget`)
**檔案**: `app/components/dashboard/widgets/DatabaseUpdateWidget.tsx`
**資料來源**:
```typescript
// 產品和庫存統計
supabase.from('data_product').select('*', { count: 'exact', head: true })
supabase.from('record_inventory').select('*', { count: 'exact', head: true })

// 使用模擬的更新記錄
```
- **問題**: 更新記錄是模擬的，沒有真實的更新日誌表

## 15. Document Upload Widget (`DocumentUploadWidget`)
**檔案**: `app/components/dashboard/widgets/DocumentUploadWidget.tsx`
**資料來源**:
- 完全使用模擬數據
- **問題**: 沒有連接真實的文件上傳記錄

## 16. Analytics Dashboard Widget (`AnalyticsDashboardWidget`)
**檔案**: `app/components/dashboard/widgets/AnalyticsDashboardWidget.tsx`
**資料來源**:
- 完全使用模擬數據
- **問題**: 沒有計算真實的效率、利用率等指標

## 17. Reports Widget (`ReportsWidget`)
**檔案**: `app/components/dashboard/widgets/ReportsWidget.tsx`
**資料來源**:
- 完全使用模擬數據
- **問題**: 沒有連接真實的報表生成記錄

---

## 需要修正的問題總結

### 1. 缺少真實數據連接的 Widgets:
- Stats Card Widget - 需要定義真實的數據源
- Product Mix Chart Widget - 需要從 inventory 或 palletinfo 計算產品分佈
- Document Upload Widget - 需要文件上傳記錄表
- Analytics Dashboard Widget - 需要計算真實指標
- Reports Widget - 需要報表生成記錄表

### 2. 使用錯誤資料表的 Widgets:
- View History Widget - 應該使用專門的查詢歷史表，而不是 transfer 表

### 3. 需要新建的資料表:
- `query_history` - 記錄用戶查詢歷史
- `file_uploads` - 記錄文件上傳
- `report_generation` - 記錄報表生成
- `system_updates` - 記錄系統更新日誌

### 4. 需要優化的查詢:
- 多個 widget 重複查詢相同數據（如棧板統計）
- 可以考慮創建視圖或存儲過程來優化

### 5. 時區問題:
- 確保所有日期時間計算使用正確的時區

請檢查並提供修改建議，我會根據你的要求進行修正。