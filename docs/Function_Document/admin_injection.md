# 注塑生產監控系統

## 概述

注塑生產監控系統係 NewPennine 倉庫管理系統嘅生產監控核心模組，專門監控注塑車間嘅生產活動。系統透過即時數據分析，提供全面嘅生產統計、員工工作量追蹤同產品排行分析，幫助管理層優化生產效率。

## 頁面路由
- 主路由：`/admin/injection`
- 佈局組件：`CustomThemeLayout.tsx`
- 配置：`adminDashboardLayouts.ts` 中嘅 `injectionLayout`

## 核心功能

### 1. 生產統計監控
- **今日生產統計**：即時追蹤當日棧板數量同產品總數
- **產品排行分析**：顯示 Top 5/10 生產產品
- **生產明細追蹤**：棧板號、產品碼、數量、QC人員記錄
- **非 U 系列專注**：專門監控非 U 開頭產品嘅生產

### 2. 員工工作量分析
- **QC 工作量**：質檢人員工作統計
- **GRN 工作量**：收貨人員作業統計
- **Move 工作量**：轉移操作統計
- **綜合工作量**：三種操作總和分析

## 主要 Widget 組件

### 生產監控類 Widgets

#### 1. OutputStatsWidget
**文件位置**：`app/admin/components/dashboard/widgets/OutputStatsWidget.tsx`
- **功能**：顯示今日生產統計（棧板數/產品數量）
- **數據源**：`record_history` 表 GRN 記錄
- **更新頻率**：即時
- **過濾條件**：非 U 開頭產品

#### 2. ProductMixChartWidget
**文件位置**：`app/admin/components/dashboard/widgets/ProductMixChartWidget.tsx`
- **功能**：產品組合視覺化分析
- **圖表類型**：餅圖 (PieChart)
- **數據源**：`record_history` 聚合查詢
- **顯示內容**：產品代碼、數量、百分比

#### 3. MaterialReceivedWidget
**文件位置**：`app/admin/components/dashboard/widgets/MaterialReceivedWidget.tsx`
- **功能**：物料接收統計追蹤
- **數據源**：GRN 記錄
- **統計範圍**：今日/本週/本月
- **顯示方式**：數值統計同趨勢圖

#### 4. BookedOutStatsWidget
**文件位置**：`app/admin/components/dashboard/widgets/BookedOutStatsWidget.tsx`
- **功能**：已預訂產品統計
- **數據源**：`record_transfer` 表
- **統計內容**：已裝載、待裝載數量
- **更新方式**：即時查詢

#### 5. FinishedProductWidget
**文件位置**：`app/admin/components/dashboard/widgets/FinishedProductWidget.tsx`
- **功能**：成品追蹤統計
- **監控範圍**：注塑車間成品
- **數據展示**：成品數量、位置分佈
- **狀態追蹤**：生產→QC→入庫流程

#### 6. UnusedStockWidget
**文件位置**：`app/admin/components/dashboard/widgets/UnusedStockWidget.tsx`
- **功能**：未使用庫存監控
- **數據源**：`stock_level` 表
- **統計範圍**：長期未使用產品
- **警報功能**：超期庫存提醒

### 操作輔助類 Widgets

#### 7. InventorySearchWidget
**文件位置**：`app/admin/components/dashboard/widgets/InventorySearchWidget.tsx`
- **功能**：即時庫存搜尋
- **搜尋範圍**：產品代碼、位置、數量
- **自動完成**：產品代碼智能提示
- **結果展示**：分組顯示、統計總數

#### 8. RecentActivityWidget
**文件位置**：`app/admin/components/dashboard/widgets/RecentActivityWidget.tsx`
- **功能**：最近系統活動追蹤
- **監控範圍**：生產、轉移、QC 活動
- **時間範圍**：最近 24 小時
- **活動類型**：GRN、Move、Transfer

## 技術實現細節

### 數據查詢優化
```typescript
// 生產統計查詢範例
const { data: outputStats } = useQuery({
  queryKey: ['outputStats', 'injection'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('record_history')
      .select('*')
      .eq('action', 'GRN')
      .not('product_code', 'like', 'U%')
      .gte('created_at', today);
    
    return processOutputData(data);
  },
  refetchInterval: 30000 // 30秒更新一次
});
```

### 即時更新機制
- **Supabase 實時訂閱**：監聽 `record_history` 表變化
- **React Query 緩存**：TTL 5分鐘，自動重新獲取
- **樂觀 UI 更新**：操作即時反饋，異步同步

### 權限控制
- **角色檢查**：管理員、生產主管可完整訪問
- **數據過濾**：根據用戶部門過濾顯示數據
- **操作權限**：只有授權用戶可進行數據修改

## 用戶操作流程

### 1. 生產監控流程
1. **登入系統**：管理員/生產主管身份驗證
2. **進入頁面**：導航到 `/admin/injection`
3. **查看統計**：即時生產數據概覽
4. **深入分析**：點擊具體 Widget 查看詳細數據
5. **導出報表**：生成生產統計報表

### 2. 員工工作量追蹤
1. **選擇時間範圍**：使用頁面時間選擇器
2. **查看工作量**：各崗位員工工作統計
3. **效率分析**：對比不同員工工作效率
4. **工作分配**：根據數據調整人員配置

### 3. 產品排行分析
1. **查看 Top 產品**：自動排序顯示熱門產品
2. **趨勢分析**：產品生產趨勢變化
3. **產能規劃**：根據需求調整生產計劃
4. **資源配置**：優化原料同設備配置

## 與其他系統整合

### 1. 倉庫管理系統
- **庫存同步**：生產數據即時更新庫存
- **位置管理**：成品自動分配存儲位置
- **轉移觸發**：達到批次要求自動觸發轉移

### 2. 訂單管理系統
- **需求對接**：根據訂單需求調整生產計劃
- **進度追蹤**：訂單完成進度即時更新
- **交期管理**：預測交貨時間

### 3. 品質管理系統
- **QC 集成**：質檢結果自動記錄
- **不良品追蹤**：問題產品標記同追蹤
- **品質統計**：合格率統計分析

### 4. 人力資源系統
- **員工績效**：工作量數據用於績效評估
- **排班優化**：根據工作量調整排班
- **培訓需求**：識別技能提升需求

## 性能優化策略

### 前端優化
- **組件懶加載**：Widget 按需加載
- **虛擬滾動**：大量數據列表優化
- **圖表緩存**：圖表數據本地緩存
- **防抖節流**：搜尋同過濾操作優化

### 數據庫優化
- **索引優化**：關鍵查詢字段建立索引
- **查詢合併**：相關數據一次性獲取
- **分頁加載**：大量歷史數據分頁顯示
- **預聚合**：常用統計數據預計算

### 網絡優化
- **CDN 加速**：靜態資源 CDN 分發
- **壓縮傳輸**：數據 gzip 壓縮
- **並行請求**：多個 Widget 數據並行獲取
- **緩存策略**：HTTP 緩存同瀏覽器緩存

## 監控同維護

### 錯誤監控
- **Widget 錯誤邊界**：避免單個 Widget 錯誤影響整頁
- **API 錯誤處理**：網絡錯誤自動重試
- **數據驗證**：前端數據完整性檢查
- **日誌記錄**：操作日誌詳細記錄

### 性能監控
- **加載時間**：頁面同 Widget 加載性能
- **查詢效率**：數據庫查詢性能監控
- **用戶體驗**：操作響應時間追蹤
- **資源使用**：內存同 CPU 使用監控

### 數據一致性
- **即時同步**：生產數據即時同步到各系統
- **數據校驗**：定期數據一致性檢查
- **備份恢復**：重要數據定期備份
- **故障恢復**：系統故障快速恢復機制

## 未來發展規劃

### 功能擴展
- **預測分析**：基於歷史數據預測生產需求
- **自動報警**：異常情況自動通知
- **移動端支援**：手機端生產監控
- **語音控制**：語音查詢生產數據

### 技術升級
- **AI 集成**：機器學習優化生產計劃
- **IoT 整合**：設備數據直接採集
- **區塊鏈**：生產數據不可篡改記錄
- **邊緣計算**：本地數據處理能力

### 用戶體驗提升
- **個性化儀表板**：用戶自定義 Widget 佈局
- **智能提示**：基於行為模式嘅智能建議
- **協作功能**：跨部門數據共享協作
- **多語言支援**：國際化界面支援