# Stock Transfer 資料庫優化文檔

## 優化策略

### 1. 索引優化

#### 新增索引：

**record_palletinfo 表：**
- `idx_palletinfo_plt_num` - 托盤號索引（單列）
- `idx_palletinfo_series` - 系列號索引（部分索引，僅非空值）
- `idx_palletinfo_plt_series_info` - 複合索引（覆蓋查詢）

**record_history 表：**
- `idx_history_plt_time_desc` - 托盤號+時間降序複合索引
- `idx_history_loc` - 位置索引

**其他相關表：**
- record_transfer、record_inventory、data_id 的相關索引

### 2. 物化視圖優化

#### mv_pallet_current_location
- 預先計算每個托盤的當前位置
- 避免每次查詢都要排序和聯接
- 支援並發刷新（CONCURRENTLY）

**優勢：**
- 查詢速度提升 5-10 倍
- 減少複雜的 JOIN 和 ORDER BY 操作
- 自動跟踪刷新需求

### 3. 查詢函數優化

#### search_pallet_optimized()
```sql
-- 使用物化視圖進行查詢
-- 自動檢查是否需要刷新
-- 支援托盤號和系列號查詢
```

#### batch_search_pallets()
```sql
-- 批量查詢多個前綴
-- 減少網路往返次數
-- 優化預加載性能
```

## 實施步驟

### 1. 執行索引分析腳本
```bash
# 在 Supabase SQL Editor 執行
/scripts/analyze-stock-transfer-indexes.sql
```

### 2. 創建優化結構
```bash
# 在 Supabase SQL Editor 執行
/scripts/optimize-stock-transfer-queries.sql
```

### 3. 更新應用程式碼
```typescript
// 使用優化的查詢 hook
import { useOptimizedStockQuery } from '@/app/hooks/useOptimizedStockQuery';

// 替換原有查詢邏輯
const { searchPalletOptimized } = useOptimizedStockQuery();
```

## 性能改進預期

### 查詢速度提升：
- **托盤號查詢**: 從 50-100ms 降至 5-10ms
- **系列號查詢**: 從 100-200ms 降至 10-20ms
- **批量預加載**: 從多次查詢降至單次批量查詢

### 資料庫負載降低：
- 減少全表掃描
- 利用索引覆蓋查詢
- 物化視圖緩存結果

## 維護建議

### 1. 定期刷新物化視圖
```sql
-- 可設置 pg_cron 定期執行
SELECT periodic_mv_refresh();
```

### 2. 監控索引使用情況
```sql
-- 查看索引使用統計
SELECT * FROM pg_stat_user_indexes
WHERE tablename IN ('record_palletinfo', 'record_history');
```

### 3. 更新統計信息
```sql
-- 定期執行 ANALYZE
ANALYZE record_palletinfo;
ANALYZE record_history;
```

## 注意事項

1. **物化視圖延遲**
   - 資料有 5 分鐘的最大延遲
   - 關鍵操作後會自動標記需要刷新

2. **索引維護成本**
   - 插入/更新操作會稍微變慢
   - 但查詢性能大幅提升

3. **空間使用**
   - 物化視圖會佔用額外存儲空間
   - 定期監控資料庫大小

## 後續優化建議

1. **分區表**
   - 對 record_history 按時間分區
   - 提升歷史資料查詢性能

2. **連接池優化**
   - 調整 Supabase 連接池設置
   - 減少連接開銷

3. **查詢快取**
   - 配合應用層快取使用
   - 進一步減少資料庫訪問