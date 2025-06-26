# 倉庫管理系統

## 概述

倉庫管理系統係 NewPennine 倉庫管理系統嘅核心運營模組，專門負責倉庫操作監控、庫存轉移管理同倉庫效率優化。系統透過即時數據追蹤同可視化分析，為倉庫管理人員提供全面嘅操作洞察，確保倉庫運作嘅高效性同準確性。

## 頁面路由
- 主路由：`/admin/warehouse`
- 佈局組件：`CustomThemeLayout.tsx`
- 配置：`adminDashboardLayouts.ts` 中嘅 `warehouseLayout`

## 核心功能

### 1. 庫存位置管理
- **Await 位置監控**：實時追蹤 await 位置庫存數量
- **位置狀態追蹤**：監控各存儲位置狀態變化
- **庫存流轉分析**：分析庫存在不同位置間嘅流轉
- **容量利用率**：監控倉庫空間利用效率

### 2. 轉移操作管理
- **轉移記錄追蹤**：詳細記錄所有庫存轉移操作
- **轉移效率分析**：分析轉移操作嘅時間效率
- **操作員工作量**：追蹤同分析操作員工作表現
- **轉移時間分佈**：可視化轉移操作時間模式

### 3. 訂單狀態監控
- **訂單裝載狀態**：監控訂單裝載進度
- **待處理訂單**：追蹤待處理訂單數量
- **完成率統計**：計算訂單完成效率
- **異常訂單識別**：自動識別異常訂單

## 主要 Widget 組件

### 第一行 - 關鍵指標 Widgets

#### 1. AwaitLocationQtyWidget
**文件位置**：`app/admin/components/dashboard/widgets/AwaitLocationQtyWidget.tsx`
- **功能**：顯示 await 位置總庫存數量
- **數據源**：`record_inventory` 表 await 欄位總和
- **更新頻率**：即時更新
- **顯示格式**：大數字展示 + 趨勢指標
- **關鍵特性**：
  - 支援時間範圍篩選
  - 顯示與昨日對比
  - 異常數量警告

#### 2. YesterdayTransferCountWidget
**文件位置**：`app/admin/components/dashboard/widgets/YesterdayTransferCountWidget.tsx`
- **功能**：顯示昨日完成嘅轉移總數（含趨勢）
- **數據源**：`record_transfer` 表
- **時間支援**：支援 time frame selector
- **圖表類型**：數值 + 迷你趨勢圖
- **分析維度**：
  - 按小時分佈
  - 操作員效率
  - 轉移類型統計

#### 3. StillInAwaitWidget
**文件位置**：`app/admin/components/dashboard/widgets/StillInAwaitWidget.tsx`
- **功能**：顯示昨日完成但仍在 await 位置嘅數量
- **數據源**：`record_transfer` 同 `record_inventory` 關聯查詢
- **業務邏輯**：轉移完成但未最終入庫嘅產品
- **警告機制**：超過閾值自動警告
- **分析用途**：
  - 識別流程瓶頸
  - 監控入庫效率
  - 預警庫存積壓

#### 4. StillInAwaitPercentageWidget
**文件位置**：`app/admin/components/dashboard/widgets/StillInAwaitPercentageWidget.tsx`
- **功能**：顯示昨日完成但仍在 await 位置嘅百分比
- **計算公式**：(仍在 await 數量 / 昨日轉移總數) × 100%
- **視覺化**：進度條 + 百分比數值
- **目標設定**：可設定目標百分比同警告線
- **趨勢分析**：顯示百分比變化趨勢

### 第二行 - 操作分析 Widgets

#### 5. OrderStateListWidget
**文件位置**：`app/admin/components/dashboard/widgets/OrderStateListWidget.tsx`
- **功能**：顯示最新訂單狀態列表
- **數據源**：`data_order` 表
- **顯示內容**：
  - 訂單號
  - 已裝載數量
  - 未裝載數量
  - 完成百分比
  - 預計完成時間
- **交互功能**：
  - 點擊查看詳情
  - 排序同篩選
  - 導出訂單清單

#### 6. TransferTimeDistributionWidget
**文件位置**：`app/admin/components/dashboard/widgets/TransferTimeDistributionWidget.tsx`
- **功能**：線形圖顯示轉移時間分佈
- **數據源**：`record_transfer` 表時間分析
- **圖表類型**：線形圖 (LineChart)
- **時間支援**：支援 time frame selector
- **分析維度**：
  - 按小時分佈
  - 按操作員分佈
  - 按產品類型分佈
  - 效率瓶頸識別

#### 7. EmptyPlaceholderWidget
**文件位置**：`app/admin/components/dashboard/widgets/EmptyPlaceholderWidget.tsx`
- **功能**：預留空間嘅佔位 Widget
- **用途**：為未來功能預留位置
- **設計**：簡潔嘅佔位符設計
- **可配置**：可快速替換為新功能

### 第三行 - 詳細數據 Widgets

#### 8. WarehouseTransferListWidget
**文件位置**：`app/admin/components/dashboard/widgets/WarehouseTransferListWidget.tsx`
- **功能**：列表顯示倉庫部門嘅轉移記錄
- **數據源**：`record_transfer` 表（篩選倉庫部門）
- **顯示內容**：
  - 轉移時間
  - 棧板號
  - 操作員姓名
  - 源位置 → 目標位置
  - 產品信息
  - 操作狀態
- **功能特性**：
  - 實時更新轉移記錄
  - 按時間、操作員篩選
  - 分頁顯示大量數據
  - 導出轉移報表

#### 9. WarehouseWorkLevelAreaChart
**文件位置**：`app/admin/components/dashboard/widgets/WarehouseWorkLevelAreaChart.tsx`
- **功能**：Area Chart 顯示倉庫部門員工嘅 move 活動量
- **數據源**：`work_level` 表（篩選倉庫部門）
- **圖表類型**：區域圖 (AreaChart)
- **分析維度**：
  - 員工工作量對比
  - 工作時間分佈
  - 效率趨勢分析
  - 人力配置建議

## 技術實現細節

### 數據查詢優化
```typescript
// 倉庫數據查詢範例
interface WarehouseData {
  awaitQty: number;
  transferCounts: TransferCount[];
  orderStates: OrderState[];
  workLevels: WorkLevel[];
}

const fetchWarehouseData = async (timeRange: TimeRange): Promise<WarehouseData> => {
  const { data: awaitData } = await supabase
    .from('record_inventory')
    .select('await')
    .not('await', 'is', null);

  const awaitQty = awaitData?.reduce((sum, item) => sum + (item.await || 0), 0) || 0;

  const { data: transferData } = await supabase
    .from('record_transfer')
    .select('*')
    .gte('created_at', timeRange.start)
    .lte('created_at', timeRange.end)
    .eq('department', 'warehouse');

  return {
    awaitQty,
    transferCounts: processTransferCounts(transferData),
    orderStates: await fetchOrderStates(),
    workLevels: await fetchWorkLevels(timeRange)
  };
};
```

### 實時數據同步
- **WebSocket 連接**：實時監聽數據庫變化
- **事件驅動更新**：轉移操作觸發即時更新
- **樂觀 UI 更新**：操作即時反饋，後台同步
- **衝突解決**：併發操作衝突自動解決

### 性能優化策略
- **數據預聚合**：常用統計數據預計算
- **索引優化**：關鍵查詢字段建立複合索引
- **分頁查詢**：大量數據分頁加載
- **緩存機制**：熱點數據 Redis 緩存

## 用戶操作流程

### 1. 日常監控流程
1. **登入系統**：倉庫管理員身份驗證
2. **查看概況**：頁面頂部關鍵指標概覽
3. **分析趨勢**：查看轉移時間分佈圖
4. **檢查異常**：識別仍在 await 嘅異常情況
5. **深入分析**：點擊具體數據查看詳情

### 2. 轉移效率分析
1. **選擇時間範圍**：使用頁面時間選擇器
2. **查看分佈圖**：分析轉移時間模式
3. **識別瓶頸**：找出效率低下嘅時間段
4. **查看操作員**：分析個別操作員表現
5. **制定改進**：根據數據制定改進措施

### 3. 訂單狀態管理
1. **查看訂單列表**：最新訂單狀態一覽
2. **篩選訂單**：按狀態、時間篩選
3. **監控進度**：實時追蹤裝載進度
4. **處理異常**：識別同處理異常訂單
5. **生成報表**：導出訂單狀態報表

### 4. 工作量分析
1. **查看工作量圖表**：員工工作量分佈
2. **對比分析**：不同員工效率對比
3. **時間分析**：工作量時間分佈模式
4. **資源配置**：根據數據調整人力配置
5. **績效評估**：基於數據嘅績效評估

## 與其他系統整合

### 1. 庫存管理系統
- **庫存同步**：即時同步庫存位置變化
- **位置更新**：自動更新產品存儲位置
- **數量核對**：定期核對庫存數量一致性
- **異常報警**：庫存異常自動通知

### 2. 訂單管理系統
- **訂單狀態**：即時更新訂單裝載狀態
- **進度追蹤**：實時追蹤訂單執行進度
- **完成通知**：訂單完成自動通知相關人員
- **異常處理**：異常訂單自動標記同處理

### 3. 人力資源系統
- **工作量統計**：員工工作量數據提供給 HR
- **績效評估**：工作效率數據用於績效管理
- **排班優化**：根據工作量模式優化排班
- **培訓需求**：識別培訓需求同技能提升

### 4. WMS 核心系統
- **轉移執行**：執行系統生成嘅轉移指令
- **狀態回報**：轉移完成狀態回報給 WMS
- **異常處理**：轉移異常情況處理同記錄
- **數據校驗**：定期校驗數據一致性

## 高級功能

### 1. 智能轉移建議
```typescript
// 智能轉移建議算法
interface TransferSuggestion {
  palletId: string;
  currentLocation: string;
  suggestedLocation: string;
  priority: number;
  reason: string;
}

const generateTransferSuggestions = async (): Promise<TransferSuggestion[]> => {
  // 分析庫存分佈
  const distribution = await analyzeStockDistribution();
  
  // 識別瓶頸位置
  const bottlenecks = identifyBottlenecks(distribution);
  
  // 生成轉移建議
  const suggestions = generateSuggestions(bottlenecks);
  
  return suggestions.sort((a, b) => b.priority - a.priority);
};
```

### 2. 預測性維護
- **設備狀態監控**：監控倉庫設備運行狀態
- **故障預測**：基於歷史數據預測設備故障
- **維護計劃**：自動生成設備維護計劃
- **備件管理**：智能管理維護備件庫存

### 3. 路徑優化
- **拆撿路徑**：優化操作員拆撿路徑
- **轉移路徑**：優化庫存轉移路徑
- **區域規劃**：優化倉庫區域劃分
- **流量分析**：分析倉庫內人員流量模式

### 4. 異常檢測同處理
```typescript
// 異常檢測系統
interface AnomalyDetection {
  type: 'stock_discrepancy' | 'long_transfer_time' | 'location_overflow';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestedAction: string;
}

const detectAnomalies = async (): Promise<AnomalyDetection[]> => {
  const anomalies: AnomalyDetection[] = [];
  
  // 檢測庫存差異
  const stockDiscrepancies = await checkStockDiscrepancies();
  anomalies.push(...stockDiscrepancies);
  
  // 檢測轉移時間異常
  const timeAnomalies = await checkTransferTimeAnomalies();
  anomalies.push(...timeAnomalies);
  
  // 檢測位置容量異常
  const capacityAnomalies = await checkLocationCapacity();
  anomalies.push(...capacityAnomalies);
  
  return anomalies;
};
```

## 報表同分析

### 1. 標準報表
- **日報**：每日倉庫操作總結
- **週報**：週度效率分析報表
- **月報**：月度 KPI 達成情況
- **年報**：年度倉庫運營分析

### 2. 自定義報表
- **靈活配置**：用戶自定義報表內容
- **多維分析**：支援多維度數據分析
- **可視化**：豐富嘅圖表同視覺化選項
- **定時生成**：自動定時生成同發送報表

### 3. 實時儀表板
- **關鍵指標**：實時顯示關鍵運營指標
- **告警提示**：異常情況即時告警
- **趨勢分析**：實時趨勢圖表
- **操作監控**：實時操作活動監控

## 移動端支援

### 1. 響應式設計
- **自適應佈局**：適配手機同平板設備
- **觸控優化**：優化觸控操作體驗
- **離線支援**：關鍵功能離線可用
- **同步機制**：離線數據自動同步

### 2. 原生應用功能
- **掃碼功能**：條碼同二維碼掃描
- **拍照記錄**：現場照片記錄
- **語音輸入**：語音輸入產品信息
- **推送通知**：重要事件推送通知

## 未來發展規劃

### 技術升級
- **AI 集成**：機器學習優化倉庫操作
- **IoT 整合**：物聯網設備數據集成
- **區塊鏈**：操作記錄不可篡改
- **5G 應用**：高速網絡支援實時應用

### 功能擴展
- **自動化集成**：對接自動化設備
- **機器人協作**：與倉庫機器人協作
- **VR/AR 支援**：虛擬現實輔助操作
- **語音控制**：語音控制倉庫操作

### 智能化提升
- **智能調度**：AI 智能任務調度
- **預測分析**：需求預測同容量規劃
- **自適應優化**：系統自我學習同優化
- **決策支援**：智能決策支援系統