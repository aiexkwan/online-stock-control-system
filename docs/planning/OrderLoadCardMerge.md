# 訂單加載至 OrderLoadCard 整合計劃（簡化版）

*生成日期：2025-08-08*  
*修訂日期：2025-08-08*  
*狀態：實施中 - 第1天完成*  
*目標環境：2-3 個並發用戶，每天 10-20 個訂單，24/7 運作*

## 執行摘要

本文檔概述了一個**簡化且實用**的計劃，用於將 `/order-loading` 頁面的功能遷移到統一的 `OrderLoadCard.tsx` 組件中。

**關鍵策略：保留所有現有 UI 組件，僅改變容器結構。**

主要優勢：
- **2 天完成**（原計劃 8 天）
- **90% 組件重用**（直接使用現有組件）
- **零 UI 改動**（用戶體驗完全一致）
- **最小風險**（已驗證的組件）

---

## 1. 功能實現（保留現有 UI 體驗）

### 要實現的功能 ✅（使用現有組件）

#### A. 用戶認證（保留現有 UI）
- **4位數 ID 驗證**：使用現有的 ID 輸入界面
- **ID 持久化**：localStorage 保存（現有邏輯）
- **用戶名顯示**：顯示驗證後的用戶名

#### B. 訂單管理（保留現有卡片式 UI）
- **訂單卡片列表**：使用現有的訂單卡片設計
- **訂單搜索框**：保留現有搜索 UI
- **訂單選擇**：保留點擊卡片選擇的交互
- **訂單摘要顯示**：保留進度百分比、數量顯示

#### C. 核心操作（保留現有掃描界面）
- **UnifiedSearch 掃描**：保留現有掃描組件
- **批量加載面板**：保留 BatchLoadPanel
- **撤銷操作**：保留現有的撤銷對話框
- **數量驗證**：保留現有的驗證邏輯

#### D. 用戶反饋（保留所有現有反饋）
- **LoadingProgressChart**：保留進度圖表
- **聲音反饋**：保留 SoundSettingsToggle
- **Toast 通知**：保留 sonner 通知
- **移動視圖**：保留 MobileOrderLoading 組件

### 要移除的功能 ❌

- ~~虛擬滾動~~（20 個訂單不需要）
- ~~複雜緩存層~~（簡單的 SWR 就足夠）
- ~~異常檢測服務~~（過度設計）
- ~~性能監控~~（這個規模不需要）
- ~~批量操作~~（數據量小）
- ~~下拉刷新~~（簡單的刷新按鈕就足夠）
- ~~多個緩存 hooks~~（一個就夠）
- ~~GraphQL 集成~~（僅使用 Server Actions）

---

## 2. 簡化的數據流（僅 Server Actions）

```
┌─────────────────┐
│   用戶登錄      │
│   (4位數 ID)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Server Action:  │
│  validateUser   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Server Action:  │
│  fetchOrders    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   選擇訂單      │
│  (簡單列表)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   掃描條碼      │
│ (UnifiedSearch) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Server Action:  │
│loadPalletToOrder│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  更新 UI &      │
│  顯示 Toast     │
└─────────────────┘
```

**關鍵簡化：**
- 無 GraphQL 層
- 無複雜緩存
- 直接 Server Actions
- 簡單狀態更新

---

## 3. 組件架構（保留現有 UI）

### 組件結構 - 重用現有組件

```
OrderLoadCard.tsx (主組件容器)
├── useOrderLoad.ts (業務邏輯 hook)
└── components/ (直接使用現有組件)
    ├── BatchLoadPanel.tsx ✅ (保留原樣)
    ├── LoadingProgressChart.tsx ✅ (保留原樣)
    ├── MobileOrderLoading.tsx ✅ (保留原樣)
    ├── SoundSettingsToggle.tsx ✅ (保留原樣)
    ├── UnifiedLoadingReportDialog.tsx ✅ (保留原樣)
    └── VirtualizedOrderList.tsx ❌ (簡化為普通列表)
```

**重要：所有 UI 組件保持不變，只是包裝在 OrderLoadCard 中。**

### 簡化的狀態管理

```typescript
interface OrderLoadState {
  userId: string;
  orders: Order[];
  selectedOrder: Order | null;
  isLoading: boolean;
  lastLoad: LoadHistory | null; // 用於撤銷
}
```

**5 個字段而不是 15 個。**

### 簡化的 Props 接口

```typescript
interface OrderLoadCardProps {
  className?: string;
  defaultUserId?: string;
}
```

**2 個 props 而不是 8 個。**

---

## 4. 實施路線圖（2 天完成）

### 實施進度更新
**第 1 天 (2025-08-08) - ✅ 已完成**
- ✅ 創建 `useOrderLoad` hook (700+ 行)
- ✅ 更新 `OrderLoadCard.tsx` 整合所有組件
- ✅ 整合現有組件（ID驗證、訂單列表、掃描、批量加載）
- ✅ 連接 Server Actions
- ✅ 修復 TypeScript 類型錯誤
- ✅ 通過 typecheck 和 lint 檢查

### 第 1 天：整合現有組件
1. 創建 `OrderLoadCard.tsx` 容器
2. 複製 `useOrderLoad` 邏輯（基於現有 page.tsx）
3. 整合現有組件：
   - ID 驗證界面
   - 訂單卡片列表
   - UnifiedSearch 掃描
   - BatchLoadPanel
4. 連接 Server Actions（使用現有的）

### 第 2 天：完善與測試
5. 整合剩餘組件：
   - LoadingProgressChart
   - SoundSettingsToggle
   - MobileOrderLoading
   - UnifiedLoadingReportDialog
6. 確保所有功能正常運作
7. 移除虛擬滾動（簡化）
8. 基本測試

**更快完成，因為重用所有 UI。**

---

## 5. 技術方案

### Server Actions（無 GraphQL）

```typescript
// 簡單、直接的 server actions
'use server';

export async function validateUser(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('data_id')
    .select('*')
    .eq('id_number', userId)
    .single();
  return { valid: !!data, userName: data?.name };
}

export async function fetchOrders() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('data_order')
    .select('*')
    .eq('status', 'pending');
  return data || [];
}

export async function loadPalletToOrder(
  orderRef: string,
  palletNum: string
) {
  // 現有實現
  return { success: true, message: '已加載' };
}
```

### OrderLoadCard 實現範例（保留現有 UI）

```typescript
// OrderLoadCard.tsx
import { GlassmorphicCard } from '@/components/ui/glassmorphic-card';
import { useOrderLoad } from './useOrderLoad';
// 導入所有現有組件
import { BatchLoadPanel } from '@/app/(app)/order-loading/components/BatchLoadPanel';
import { LoadingProgressChart } from '@/app/(app)/order-loading/components/LoadingProgressChart';
import { MobileOrderLoading } from '@/app/(app)/order-loading/components/MobileOrderLoading';
import { SoundSettingsToggle } from '@/app/(app)/order-loading/components/SoundSettingsToggle';
import { UnifiedLoadingReportDialog } from '@/app/(app)/order-loading/components/UnifiedLoadingReportDialog';

export function OrderLoadCard({ className }: OrderLoadCardProps) {
  const {
    userId,
    userName,
    orders,
    selectedOrder,
    isLoading,
    recentLoads,
    handleLogin,
    handleOrderSelect,
    handleLoad,
    handleUndo,
    soundEnabled,
    toggleSound
  } = useOrderLoad();

  // 移動設備檢測
  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    // 使用現有的移動組件
    return (
      <MobileOrderLoading 
        userId={userId}
        orders={orders}
        onLoad={handleLoad}
        onUndo={handleUndo}
      />
    );
  }

  return (
    <GlassmorphicCard className={className}>
      <CardHeader>
        <CardTitle>訂單加載</CardTitle>
        <SoundSettingsToggle 
          enabled={soundEnabled} 
          onToggle={toggleSound} 
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {!userId ? (
          // 用戶登錄界面（保留現有設計）
          <div className="space-y-2">
            <Input 
              placeholder="輸入4位數ID"
              maxLength={4}
              onChange={(e) => handleLogin(e.target.value)}
            />
          </div>
        ) : (
          <>
            {/* 用戶信息顯示 */}
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              <span>{userName} ({userId})</span>
            </div>

            {/* 訂單列表（使用現有卡片設計） */}
            <div className="grid gap-2 max-h-96 overflow-auto">
              {orders.map(order => (
                <Card 
                  key={order.order_ref}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedOrder?.order_ref === order.order_ref && "border-primary"
                  )}
                  onClick={() => handleOrderSelect(order)}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between">
                      <span>{order.order_ref}</span>
                      <span>{order.loaded_qty}/{order.product_qty}</span>
                    </div>
                    <Progress 
                      value={(order.loaded_qty / order.product_qty) * 100} 
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 選中訂單的操作界面 */}
            {selectedOrder && (
              <>
                {/* 進度圖表 */}
                <LoadingProgressChart 
                  orderData={selectedOrder}
                  recentLoads={recentLoads}
                />

                {/* 掃描界面 */}
                <UnifiedSearch 
                  onScan={handleLoad}
                  placeholder="掃描托盤/系列號"
                  disabled={isLoading}
                />

                {/* 批量加載面板 */}
                <BatchLoadPanel 
                  orderRef={selectedOrder.order_ref}
                  onBatchLoad={handleLoad}
                />
              </>
            )}

            {/* 報告對話框 */}
            <UnifiedLoadingReportDialog 
              orderRef={selectedOrder?.order_ref}
              loadHistory={recentLoads}
            />
          </>
        )}
      </CardContent>
    </GlassmorphicCard>
  );
}
```

---

## 6. 依賴項（最少）

```json
{
  "dependencies": {
    "@/components/ui/unified-search": "existing",
    "@/components/ui/card": "existing",
    "sonner": "^1.0.0",
    "swr": "^2.0.0" // 可選，如需要
  }
}
```

無新的主要依賴。使用已有的。

---

## 7. 測試策略（簡單）

### 僅必要測試
- 用戶登錄流程
- 訂單加載成功
- 撤銷操作
- 錯誤處理

### 跳過這些測試
- 性能基準測試（不必要）
- 複雜的 E2E 場景（過度測試）
- 可訪問性審核（可以稍後進行）

---

## 8. 風險緩解

| 風險 | 解決方案 |
|------|----------|
| **功能缺失** | 真正需要時再添加 |
| **性能問題** | 20 個訂單不會發生 |
| **複雜錯誤** | 簡單代碼 = 更少錯誤 |
| **維護** | 更少代碼 = 更易維護 |

---

## 9. 對比：原計劃 vs 修訂版（保留 UI）

| 方面 | 原計劃 | 修訂計劃 | 優勢 |
|------|--------|----------|------|
| **實施時間** | 8 天 | **2 天** | **-75%** |
| **新文件數** | 15+ 文件 | **2 文件** | **-87%** |
| **UI 改動** | 重寫所有 | **零改動** | **100% 重用** |
| **組件重用** | 0% | **90%** | **最大化重用** |
| **用戶體驗** | 需重新適應 | **完全一致** | **無學習成本** |
| **測試需求** | 完整測試 | **最小測試** | **-80%** |

---

## 10. 結論

此修訂計劃的核心優勢：

### 實施優勢
- **2 天交付**（比原計劃快 75%）
- **90% 組件重用**（最大化利用現有代碼）
- **零 UI 學習曲線**（用戶體驗完全一致）
- **最小測試需求**（組件已經過驗證）

### 技術優勢
- **使用 Server Actions**（適合小規模系統）
- **保留所有現有組件**（降低風險）
- **簡化架構**（移除虛擬滾動等過度設計）
- **易於維護**（熟悉的代碼結構）

### 業務優勢
- **無需用戶培訓**（界面完全相同）
- **快速部署**（2 天內完成）
- **低風險**（重用已驗證組件）
- **完全滿足需求**（2-3 用戶，10-20 訂單/天）

**核心理念：最好的遷移是用戶感覺不到的遷移。**

---

## 11. 資料庫優化策略（小規模系統）

### 優化原則
針對 **2-3 個並發用戶，每天 10-20 個訂單** 的小規模系統，避免過度工程化，專注於實際需求。

### A. 必要索引 ✅ (已存在)

**用戶驗證 (data_id)**
```sql
-- ✅ 已存在 - 4位數 ID 查詢
CREATE INDEX idx_data_id_id ON data_id (id);
-- 用途: validateUser server action
-- 查詢模式: WHERE id = $1
```

**訂單列表 (data_order)**
```sql
-- ✅ 已存在 - 未完成訂單查詢
CREATE INDEX idx_order_incomplete ON data_order (order_ref) 
WHERE (loaded_qty)::integer < (product_qty)::integer;
-- 用途: fetchOrders server action
-- 查詢模式: 10-20 個訂單，預過濾未完成訂單

-- ✅ 已存在 - 訂單詳情查詢
CREATE INDEX idx_order_order_ref ON data_order (order_ref);
-- 用途: getOrderInfo server action
-- 查詢模式: WHERE order_ref = $1 ORDER BY product_code
```

**托盤資訊 (record_palletinfo)**
```sql
-- ✅ 已存在 - 托盤號碼查詢
CREATE UNIQUE INDEX record_palletinfo_pkey ON record_palletinfo (plt_num);
-- 用途: loadPalletToOrder RPC function
-- 查詢模式: WHERE plt_num = $1
```

**加載歷史 (order_loading_history)**
```sql
-- ✅ 已存在 - 撤銷操作查詢
CREATE INDEX idx_order_loading_action_time_order ON order_loading_history 
(action_time DESC, order_ref);
-- 用途: undoLoadPallet server action
-- 查詢模式: 最近的加載記錄
```

### B. 不需要的索引 ❌

對於小規模系統，以下索引是多餘的：
```sql
-- ❌ 複雜聚合查詢索引 (數據量小，不需要)
-- ❌ 全文搜索索引 (僅10-20個訂單)
-- ❌ 分區索引 (數據量不足)
-- ❌ BRIN 索引 (適用於大表，我們的表很小)
```

### C. 事務優化

**已使用 RPC 函數實現原子性** ✅
```sql
-- 現有實現已經優化
SELECT * FROM rpc_load_pallet_to_order($1, $2, $3, $4);
SELECT * FROM rpc_undo_load_pallet($1, $2, $3, $4, $5, $6);
```

**小規模優勢:**
- 無需複雜的事務管理
- RPC 函數確保 ACID 屬性
- 單一操作，競爭條件極少

### D. Server Actions 查詢優化

**1. 用戶驗證查詢**
```typescript
// ✅ 已優化 - 使用主鍵查詢
const { data } = await supabase
  .from('data_id')
  .select('name')
  .eq('id', userId)      // 使用索引: idx_data_id_id
  .single();             // 明確只需一筆記錄
```

**2. 訂單列表查詢**
```typescript
// ✅ 建議優化 - 添加 WHERE 條件
const { data } = await supabase
  .from('data_order')
  .select('order_ref, product_code, loaded_qty, product_qty')  // 只選需要的欄位
  .lt('loaded_qty', 'product_qty')    // 使用部分索引
  .order('created_at', { ascending: false })  // 最新的訂單
  .limit(50);            // 限制結果數量，小系統綽綽有餘
```

**3. 訂單詳情查詢**
```typescript
// ✅ 已優化
const { data } = await supabase
  .from('data_order')
  .select('*')
  .eq('order_ref', orderRef)    // 使用索引: idx_order_order_ref
  .order('product_code');       // 產品代碼排序，數據少無需索引
```

### E. 連接池建議 (小規模)

**Supabase 預設設定已足夠** ✅
```typescript
// 無需額外配置，預設值適合小規模：
// - 最大連接數: 25 (遠超 2-3 用戶需求)
// - 連接超時: 30 秒
// - 空閒超時: 10 分鐘
```

**實際使用模式:**
- 2-3 個並發用戶 = 最多 3-5 個活動連接
- Server Actions 自動管理連接
- 無需手動連接池配置

### F. 效能監控 (簡化)

**必要監控** ✅
```sql
-- 簡單查詢效能檢查 (開發時使用)
EXPLAIN ANALYZE 
SELECT * FROM data_order 
WHERE (loaded_qty)::integer < (product_qty)::integer;
```

**不需要的監控** ❌
- 複雜的 APM 工具
- 詳細的查詢統計
- 連接池監控 (系統太小)

### G. 建議實施 (優先級排序)

**高優先級 - 立即實施:**
1. 確認現有索引正常運作 ✅
2. Server Actions 查詢優化 ✅
3. RPC 函數事務處理 ✅

**低優先級 - 可選:**
1. 查詢效能基準測試 (僅開發時)
2. 慢查詢日誌 (如有問題時啟用)

**不實施:**
1. 複雜緩存層
2. 連接池調整
3. 高級監控工具

### H. 預期效能表現

以小規模系統而言，優化後預期：
- **用戶驗證**: < 10ms (主鍵查詢)
- **訂單列表**: < 20ms (10-20 筆記錄)
- **加載操作**: < 50ms (RPC 函數)
- **撤銷操作**: < 30ms (索引查詢)

**結論:** 現有的資料庫結構已經過度優化了。對於這個規模的系統，我們應該專注於代碼簡潔性而非效能調優。

---

## 11. 資料庫優化建議（由數據庫專家提供）

### A. 現有結構評估

對於 2-3 個並發用戶、每天 10-20 個訂單的規模，**現有數據庫已經足夠優化**。

#### 核心表分析
- **data_id**: 用戶驗證（已有適當索引）
- **data_order**: 訂單信息（索引充足）
- **record_history**: 活動日誌（索引合理）
- **record_palletinfo**: 托盤信息（主鍵索引足夠）

### B. 必要索引（全部已存在）✅

```sql
-- 用戶驗證
idx_data_id_id (id)

-- 訂單查詢
idx_order_incomplete (loaded_qty, product_qty)
idx_order_order_ref (order_ref)

-- 托盤查詢
record_palletinfo_pkey (plt_num)
idx_palletinfo_series (series)
```

### C. Server Action 查詢優化

```typescript
// 優化的訂單查詢（只選需要的欄位）
export async function fetchOrders() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('data_order')
    .select('order_ref, product_code, loaded_qty, product_qty')
    .lt('loaded_qty', 'product_qty')  // 使用現有索引
    .limit(50);  // 限制結果
  return data || [];
}

// 優化的用戶驗證
export async function validateUser(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('data_id')
    .select('id, name')  // 只選需要的欄位
    .eq('id_number', userId)
    .single();
  return { valid: !!data, userName: data?.name };
}
```

### D. RPC 函數使用建議

現有的 RPC 函數已經優化良好：
- `rpc_load_pallet_to_order` - 原子性操作，正確鎖定
- `rpc_undo_load_pallet` - 事務安全，數據一致

**直接使用現有 RPC，無需修改。**

### E. 連接池配置（最小化）

```javascript
// .env.local
DATABASE_POOL_SIZE=5  // 對 2-3 用戶足夠
DATABASE_IDLE_TIMEOUT=300000  // 5 分鐘
DATABASE_STATEMENT_TIMEOUT=30000  // 30 秒超時
```

### F. 性能預期

| 操作 | 預期響應時間 | 實際瓶頸 |
|------|-------------|----------|
| 用戶驗證 | < 10ms | 網絡延遲 |
| 獲取訂單 | < 20ms | 數據傳輸 |
| 加載托盤 | < 50ms | RPC 執行 |
| 撤銷操作 | < 30ms | 事務處理 |

### G. 監控建議（簡單）

```sql
-- 每週執行一次的簡單健康檢查
SELECT 
  tablename,
  n_live_tup as 活動記錄,
  n_dead_tup as 死記錄,
  last_vacuum as 最後清理時間
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN ('data_order', 'record_history')
ORDER BY n_dead_tup DESC;
```

### H. 關鍵結論

**對於這個規模：**
1. ✅ 使用現有索引和 RPC 函數
2. ✅ 簡單的 Server Actions
3. ✅ 預設連接池配置
4. ❌ 不需要額外索引
5. ❌ 不需要查詢優化器調整
6. ❌ 不需要分區或分片

**最重要的優化是保持簡單。**

---

## 附錄：我們不會構建的內容

明確地說，我們不會構建：
- GraphQL resolvers 和 schemas
- 複雜的緩存策略
- 為 20 個項目做虛擬滾動
- 異常檢測算法
- 性能監控儀表板
- 多層架構
- 不必要的抽象
- **額外的數據庫索引**
- **複雜的查詢優化**
- **自定義連接池**

我們會構建：
- 一個簡單、有效的訂單加載卡片
- 只做需要做的事
- 不多不少