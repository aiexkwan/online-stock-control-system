# 路由頁面遷移到卡片系統的遷移計劃
*文件版本：1.1.0*  
*創建日期：2025-08-11*  
*更新日期：2025-08-11*  
*狀態：規劃中 - 已識別關鍵記憶體問題*

## 執行摘要
本文件概述了從個別路由頁面遷移到集中式卡片系統的全面遷移計劃。目標是整合功能、提高可維護性，並通過 TabSelectorCard 儀表板提供統一的用戶體驗。

**⚠️ 關鍵更新**：
1. 在具有自動輪詢的卡片中識別出記憶體洩漏問題。遷移計劃現在包括強制性的數據刷新策略變更。
2. **最終目標：完全移除所有虛擬路由**，只保留單一入口 `/page` 與認證相關頁面。

## 當前系統分析

### 現有路由頁面
|| 路由路徑 | 描述 | 卡片替代 | 覆蓋狀態 |
||------------|-------------|------------------|-----------------|
|| `/order-loading` | 使用棧板的訂單裝載 | `OrderLoadCard` |  100% |
|| `/print-grnlabel` | GRN 標籤生成 | `GRNLabelCard` |  100% |
|| `/print-label` | QC 標籤列印 | `QCLabelCard` |  100% |
|| `/productUpdate` | 產品數據管理 | `DataUpdateCard` |  100% |
|| `/stock-transfer` | 位置間庫存移動 | `StockTransferCard` |  100% |
|| `/admin/stock-count` | 庫存盤點操作 | `StockCountCard` |  100% |
|| `/page` | 統一卡片容器頁面 | `TabSelectorCard` |  新建 |

### 最終系統結構（遷移完成後）
|| 路由路徑 | 用途 | 類型 |
||------------|--------|-------|
|| `/` | 根頁面，重定向到 /page | 入口 |
|| `/page` | **唯一的應用程式頁面** | 主頁面 |
|| `/main-login` | 主要身份驗證 | 認證 |
|| `/main-login/change` | 密碼更改 | 認證 |
|| `/main-login/reset` | 密碼重置 | 認證 |
|| `/main-login/register` | 用戶註冊 | 認證 |
|| `/main-login/simple` | 簡單登錄 | 認證 |
|| `/change-password` | 應用內密碼更改 | 認證 |
|| `/new-password` | 新密碼設置 | 認證 |

**注意：沒有任何虛擬路由！所有功能通過 `/page?card=XXX` 訪問**

### 卡片系統組件
|| 卡片組件 | 功能 | 源組件 |
||----------------|----------|-------------------|
|| `OrderLoadCard` | 訂單裝載操作 | 使用 `/order-loading` 組件 |
|| `GRNLabelCard` | GRN 標籤生成 | 使用 `/print-grnlabel` 組件 |
|| `QCLabelCard` | QC 標籤列印 | 使用 `/print-label` 組件 |
|| `DataUpdateCard` | 產品/供應商管理 | 獨立實現 |
|| `StockTransferCard` | 庫存轉移 | 使用 `/stock-transfer` 組件 |
|| `StockCountCard` | 庫存盤點 | 使用管理員庫存盤點鉤子 |
|| `VoidPalletCard` | 作廢棧板操作 | 新功能 |
|| `AnalysisCardSelector` | 小部件選擇 | 分析小部件 |
|| `ChatbotCard` | AI 助手 | AI 整合 |
|| `DownloadCenterCard` | 報告下載 | 報告生成 |
|| `UploadCenterCard` | 數據上傳 | 批量操作 |
|| `WorkLevelCard` | 工作級別監控 | 性能指標 |
|| `DepartInjCard` | 注射部門 | 部門特定 |
|| `DepartPipeCard` | 管道部門 | 部門特定 |
|| `DepartWareCard` | 倉庫部門 | 部門特定 |
|| `StockHistoryCard` | 庫存歷史追蹤 | 審計追蹤 |
|| `StockLevelListAndChartCard` | 庫存可視化 | 庫存概覽 |
|| `VerticalTimelineCard` | 時間線視圖 | 事件追蹤 |
|| `TabSelectorCard` | 主儀表板選擇器 | 中央導航 |

## 關鍵記憶體問題與解決方案

### 已識別的問題
在第 1 週測試期間，我們發現具有自動輪詢的卡片（DepartInjCard、DepartPipeCard、DepartWareCard、WorkLevelCard）會造成嚴重的記憶體累積：
- **60 秒輪詢**累積約 25MB/小時
- **8 小時會話**可累積 200MB 以上
- **24 小時會話**可達 600MB 以上並導致瀏覽器崩潰
- **Apollo InMemoryCache** 無限制增長
- 在切換卡片或卸載時**沒有清理機制**

### 強制性數據刷新策略變更

#### 新政策：僅手動刷新
1. **移除所有自動輪詢**（`pollInterval` 設置）
2. **在以下情況載入數據**：
   - 首次訪問卡片
   - 重新訪問卡片（切換回來）
   - 用戶手動點擊刷新圖標
3. **為所有數據卡片添加刷新圖標**
4. **實施智能緩存**，帶有 TTL（生存時間）

#### 實施要求
```typescript
// 之前（記憶體洩漏）
const { data } = useQuery(QUERY, {
  pollInterval: 60000, // ❌ 移除此行
  fetchPolicy: 'cache-and-network',
});

// 之後（手動刷新 + 重新訪問刷新）
const { data, refetch, loading } = useQuery(QUERY, {
  fetchPolicy: 'network-first', // 掛載/重新訪問時獲取新數據
  notifyOnNetworkStatusChange: true,
});

// 卡片重新訪問時刷新
useEffect(() => {
  refetch(); // 卡片顯示時獲取新數據
}, []); // 在組件掛載時運行（訪問或重新訪問）

// Add Refresh Icon (subtle, in card header)
<div className="flex items-center justify-between">
  <h2>Card Title</h2>
  <div className="flex items-center gap-2 text-slate-400">
    <span className="text-xs">{formatTime(lastUpdated)}</span>
    <ArrowPathIcon 
      className="h-4 w-4 cursor-pointer hover:text-white transition-colors"
      onClick={() => refetch()}
      title="Refresh data"
    />
  </div>
</div>
```

#### 需要變更的受影響卡片
|| 卡片 | 當前輪詢 | 需要採取的操作 |
||------|----------------|-----------------|
|| DepartInjCard | 60秒 | 移除輪詢，添加刷新圖標 |
|| DepartPipeCard | 60秒 | 移除輪詢，添加刷新圖標 |
|| DepartWareCard | 30秒 | 移除輪詢，添加刷新圖標 |
|| WorkLevelCard | 60秒 | 移除輪詢，添加刷新圖標 |
|| StockLevelListAndChartCard | 掛載時 | 添加刷新圖標 |
|| AnalysisCardSelector 小部件 | 各種 | 審查並更新所有 |

## 遷移策略

### 階段 0：記憶體修復實施（第 1.5 週 - 緊急）
1. **停止自動輪詢**
   - [ ] 從 useQuery 鉤子中移除所有 `pollInterval`
   - [ ] 為所有具有數據獲取的卡片添加清理函數
   - [ ] 為所有異步操作實施中止控制器

2. **實施手動刷新用戶界面**
   - [ ] 創建標準化的 RefreshIcon 組件（僅圖標，非按鈕）
   - [ ] 在卡片標題中添加刷新圖標（微妙、非侵入性）
   - [ ] 顯示"最後更新"時間戳
   - [ ] 添加刷新期間的加載狀態
   - [ ] Use tooltip to show "Click to refresh data"

3. **Apollo 緩存配置**
   - [ ] 設置緩存大小限制
   - [ ] 實施緩存驅逐策略
   - [ ] 為舊條目添加垃圾回收

4. **智能數據管理**
   - [ ] 實施基於可見性的數據獲取
   - [ ] 在標籤在後台時停止操作
   - [ ] 卡片卸載時清除緩存

### 階段 1：驗證與測試（第 2 週 - 之前的第 1 週）
1. **功能覆蓋驗證**
   - [ ] 針對原始頁面功能測試每個卡片
   - [ ] 驗證所有業務邏輯是否保留
   - [ ] 確認數據流和狀態管理
   - [ ] 驗證列印操作（GRN、QC 標籤）
   - [ ] 測試移動響應性

2. **性能比較**
   - [ ] 測量加載時間：頁面 vs 卡片
   - [ ] 檢查包大小影響
   - [ ] 驗證延遲加載效果
   - [ ] 測試並發操作

3. **用戶體驗測試**
   - [ ] 導航流程驗證
   - [ ] 無障礙合規性（WCAG 2.1）
   - [ ] 移動設備測試
   - [ ] 錯誤處理驗證

### 階段 2：路由棄用（第 3 週 - 之前的第 2 週）
1. **創建單一入口頁面**
   ```typescript
   // app/(app)/page/page.tsx - 新建
   'use client';
   import { TabSelectorCard } from '@/app/(app)/admin/cards/TabSelectorCard';
   
   export default function UnifiedPage() {
     return <TabSelectorCard />;
   }
   ```

2. **實施臨時重定向（過渡期）**
   ```typescript
   // app/(app)/[deprecated-route]/page.tsx
   import { redirect } from 'next/navigation';
   
   export default function DeprecatedPage() {
     redirect('/page?card=[CardName]');
   }
   ```

3. **要棄用的所有路由**
   - `/order-loading` → `/page?card=OrderLoadCard`
   - `/print-grnlabel` → `/page?card=GRNLabelCard`
   - `/print-label` → `/page?card=QCLabelCard`
   - `/productUpdate` → `/page?card=DataUpdateCard`
   - `/stock-transfer` → `/page?card=StockTransferCard`
   - `/admin/analytics` → `/page`
   - `/admin/stock-count` → `/page?card=StockCountCard`
   - `/admin` → `/page`

### 階段 3：代碼清理（第 4 週 - 之前的第 3 週）
1. **組件重構**
   - [ ] 將共享組件提取到 `/lib/components`
   - [ ] 刪除頁面和卡片之間的重複代碼
   - [ ] 合併鉤子和實用程序
   - [ ] 更新導入路徑

2. **文件刪除列表**
   ```
   # 刪除所有虛擬路由頁面
   app/(app)/order-loading/page.tsx
   app/(app)/print-grnlabel/page.tsx
   app/(app)/print-label/page.tsx
   app/(app)/productUpdate/page.tsx
   app/(app)/stock-transfer/page.tsx
   app/(app)/admin/stock-count/page.tsx
   app/(app)/admin/analytics/page.tsx  # 也刪除此頁面
   app/(app)/admin/page.tsx            # 刪除重定向頁面
   ```

3. **組件遷移**
   - 將可重用組件移動到適當的卡片目錄
   - 更新卡片中的組件導入
   - 刪除頁面特定的佈局

### 階段 4：集成與優化（第 5 週 - 之前的第 4 週）
1. **TabSelectorCard 增強**
   - [ ] 為直接卡片訪問添加深度鏈接支持
   - [ ] 實施卡片預加載策略
   - [ ] 添加鍵盤導航
   - [ ] 增強卡片切換動畫

2. **性能優化**
   - [ ] 為每個卡片實施代碼拆分
   - [ ] 為可能的下一個卡片添加預取
   - [ ] 優化包大小
   - [ ] 添加性能監控

3. **狀態管理**
   - [ ] 集中卡片狀態管理
   - [ ] 實施狀態持久化
   - [ ] 在卡片切換時添加狀態重置
   - [ ] 處理跨卡片通信

## 技術考慮

### 遷移的好處
1. **集中管理**
   - 通過 TabSelectorCard 單一入口
   - 所有操作的一致 UI/UX
   - 簡化導航結構

2. **改進的可維護性**
   - 減少代碼重複
   - 一致的組件架構
   - 更容易測試和調試

3. **更好的性能**
   - 卡片延遲加載
   - 共享組件緩存
   - 減少初始包大小

4. **增強的用戶體驗**
   - 操作間無頁面刷新
   - 更快的上下文切換
   - 持久的用戶會話狀態

### 潛在風險與緩解措施（已更新）
|| 風險 | 影響 | 緩解措施 |
||------|--------|------------|
|| **自動輪詢導致的記憶體洩漏** | **關鍵** | **移除所有輪詢，僅手動刷新** |
|| 功能回歸 | 高 | 全面的端到端測試 |
|| 性能下降 | 中 | 性能基準測試 |
|| 用戶困惑 | 中 | 清晰的遷移溝通 |
|| 深度鏈接丟失 | 低 | 實施 URL 參數 |
|| SEO 影響 | 低 | 不適用（內部應用） |
|| 用戶對手動刷新的抵觸 | 中 | 帶有時間戳、刷新圖標的清晰 UX |

## 實施檢查清單

### 遷移前
- [ ] 完成所有卡片的功能測試
- [ ] 記錄任何缺失的功能
- [ ] 創建回滾計劃
- [ ] 通知利益相關者

### 遷移期間
- [ ] 逐步實施重定向
- [ ] 監控錯誤率
- [ ] 收集用戶反饋
- [ ] 保持並行可用性

### 遷移後
- [ ] 刪除棄用的代碼
- [ ] 更新文檔
- [ ] 性能審核
- [ ] 必要時進行用戶培訓

## 測試策略

### 單元測試
```typescript
// 隔離測試每個卡片
describe('卡片名稱', () => {
  it('應保持所有原始功能', () => {
    // 測試核心功能
  });
});
```

### 集成測試
```typescript
// 在 TabSelectorCard 中測試卡片
describe('TabSelectorCard 集成', () => {
  it('應正確加載和切換卡片', () => {
    // 測試卡片切換
  });
});
```

### 端到端測試
```typescript
// 使用 Playwright 測試完整工作流程
test('完整訂單裝載工作流程', async ({ page }) => {
  await page.goto('/page?card=OrderLoadCard');
  // 測試完整工作流程
});
```

## 回滾計劃
1. 保留棄用頁面但隱藏
2. 在環境變量中維護重定向開關
3. 通過功能標誌快速還原
4. 必要時使用數據庫遷移腳本

## 成功指標
- [ ] 實現 100% 功能等效
- [ ] 頁面加載時間提高 >20%
- [ ] 生產環境零關鍵錯誤
- [ ] 維持或改善用戶滿意度
- [ ] 代碼減少 >30%

## 時間表（已更新）
|| 週 | 階段 | 交付成果 |
||------|-------|--------------|
|| 1 | 驗證與測試 | ✅ 測試報告完成，識別記憶體問題 |
|| 1.5 | **記憶體修復（緊急）** | 移除自動輪詢，添加刷新圖標 |
|| 2 | 重新驗證 | 驗證記憶體修復，性能測試 |
|| 3 | 路由棄用 | 實施重定向 |
|| 4 | 代碼清理 | 刪除棄用代碼 |
|| 5 | 集成與優化 | 最終優化系統 |

## 批准與簽字
- [ ] 技術負責人審查
- [ ] QA 團隊批准
- [ ] 利益相關者簽字
- [ ] 生產部署批准

---

## 附錄：記憶體管理最佳實踐

### 刷新圖標實施標準
```typescript
// 所有卡片的標準刷新圖標組件
interface RefreshIconProps {
  onRefresh: () => void;
  lastUpdated?: Date;
  loading?: boolean;
}

const CardRefreshIcon: React.FC<RefreshIconProps> = ({ 
  onRefresh, 
  lastUpdated, 
  loading 
}) => {
  return (
    <div className="flex items-center gap-2 text-slate-400">
      {lastUpdated && (
        <span className="text-xs">
          {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </span>
      )}
      <ArrowPathIcon
        className={cn(
          "h-4 w-4 cursor-pointer transition-all",
          loading && "animate-spin",
          !loading && "hover:text-white hover:rotate-180"
        )}
        onClick={!loading ? onRefresh : undefined}
        title={loading ? "Refreshing..." : "Refresh data"}
      />
    </div>
  );
};
```

### User Communication Strategy
1. **Auto-refresh Behavior**: Data automatically refreshes when switching between cards
2. **Manual Refresh**: Click refresh icon for latest data while staying on same card
3. **Loading State**: Spin the refresh icon during data fetch
4. **Success Feedback**: Brief green flash or checkmark after successful refresh

---
*本文件是一份動態文件，將隨遷移進程不斷更新。*