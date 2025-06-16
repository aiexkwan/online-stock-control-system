# 托盤編號生成優化部署指南

## 背景
當前的 `generate_atomic_pallet_numbers_v3` 函數存在不穩定問題，需要升級到 v4 版本以提高穩定性。

## 部署步驟

### 1. 部署數據庫更改

在 Supabase Dashboard 的 SQL Editor 中執行以下腳本：

```sql
-- 執行 optimize-pallet-generation-v4.sql
-- 位置：scripts/optimize-pallet-generation-v4.sql
```

這將：
- 創建托盤編號緩衝表 `pallet_number_buffer`
- 部署新的 `generate_atomic_pallet_numbers_v4` 函數
- 創建清理和監控函數
- 添加必要的索引

### 2. 驗證部署

執行以下 SQL 驗證部署成功：

```sql
-- 檢查函數是否存在
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'generate_atomic_pallet_numbers_v4';

-- 檢查緩衝表是否創建
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'pallet_number_buffer';

-- 測試生成函數
SELECT generate_atomic_pallet_numbers_v4(3, 'test-deploy');
```

### 3. 更新前端代碼

#### 3.1 更新 QC Label Form 使用新的 Hook

編輯 `/app/components/qc-label-form/hooks/useQcLabelBusiness.tsx`：

```typescript
// 替換導入
import { useDatabaseOperations } from './modules/useDatabaseOperations';
// 改為
import { useDatabaseOperationsV2 } from './modules/useDatabaseOperationsV2';

// 更新使用
const { generatePalletNumbers, createQcRecords } = useDatabaseOperationsV2();
```

#### 3.2 添加監控頁面（可選）

在管理後台添加監控組件：

```typescript
// /app/admin/pallet-monitor/page.tsx
import { PalletGenerationMonitor } from '@/app/components/admin/PalletGenerationMonitor';

export default function PalletMonitorPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Pallet Generation Monitor</h1>
      <PalletGenerationMonitor />
    </div>
  );
}
```

### 4. 測試驗證

1. **基本功能測試**：
   - 在 Print Label 頁面生成單個標籤
   - 生成多個標籤（5-10個）
   - 測試批量處理功能

2. **並發測試**：
   - 同時開啟多個瀏覽器標籤
   - 同時生成標籤，確認無重複

3. **監控檢查**：
   - 訪問監控頁面
   - 確認序列號同步狀態
   - 檢查緩衝區運作正常

### 5. 回退計劃

如果出現問題，可以回退到 v3：

1. 前端代碼無需更改（自動回退機制）
2. 如需完全回退，恢復使用原 `useDatabaseOperations` hook

## 性能優化預期

- **穩定性提升**：通過緩衝機制減少實時生成壓力
- **並發性能**：使用 `FOR UPDATE` 鎖避免衝突
- **用戶體驗**：自動重試和回退機制
- **可觀測性**：實時監控和診斷工具

## 維護建議

1. **定期清理**：每天執行一次緩衝表清理
   ```sql
   SELECT cleanup_pallet_buffer();
   ```

2. **監控告警**：當序列不同步時及時修復

3. **性能追蹤**：定期查看監控數據，分析失敗模式