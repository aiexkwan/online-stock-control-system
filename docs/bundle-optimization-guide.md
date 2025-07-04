# 捆綁優化指南

## 概述
本指南記錄了 NewPennine Widget Registry V2 系統的捆綁優化過程。

## 運行捆綁分析

### 先決條件
- 已安裝 webpack-bundle-analyzer: `npm install --save-dev webpack-bundle-analyzer`
- 在 next.config.js 中添加了捆綁分析器配置

### 分析捆綁的步驟

1. **以分析模式構建**
   ```bash
   npm run analyze
   ```
   此命令運行 `ANALYZE=true npm run build`，觸發 webpack-bundle-analyzer 插件。

2. **查看分析報告**
   ```bash
   npm run analyze:view
   ```
   這會在瀏覽器中打開生成的 HTML 報告。

3. **分析輸出位置**
   - 報告: `bundle-analyzer/client.html`
   - 統計: `bundle-analyzer/client-stats.json`

## 優化結果

### 第三階段性能優化

#### 1. 代碼分割實施
- 應用於 11 個重型小部件（圖表、列表、報告）
- 將初始捆綁減少約 550KB
- 關鍵小部件優化：
  - 圖表小部件：ProductMixChartWidget、StockDistributionChart、StockLevelHistoryChart
  - 列表小部件：OrdersListWidget、WarehouseTransferListWidget
  - 報告小部件：TransactionReportWidget、GrnReportWidget
  - 分析小部件：AnalysisExpandableCards、AcoOrderProgressWidget

#### 2. React.memo 優化
- 應用於所有具有自定義比較功能的小部件
- 具體優化：
  - 統計小部件：防止在相同指標上重新渲染
  - 列表小部件：虛擬滾動和記憶化過濾/排序
  - 圖表小部件：緩存的數據轉換和配置
- 預期重新渲染減少：50-70%

#### 3. 智能預加載
- 基於路由的預加載常用小部件
- 預加載映射：
  - `/admin/warehouse`：倉庫相關小部件
  - `/admin/injection`：生產和統計小部件
  - `/admin/pipeline`：生產詳細信息和工作負載小部件

## A/B 測試配置更新

V2 系統的 A/B 測試流量分配已從 10% 更新為 50%：

```typescript
// 以前的配置
v2-system: 10% traffic
legacy-system: 90% traffic

// 新配置（已更新）
v2-system: 50% traffic
legacy-system: 50% traffic
```

這允許更廣泛地測試新小部件系統，同時通過以下方式保持風險管理：
- 10% 錯誤率自動回滾
- 實時性能監控
- 基於會話的跟踪

## 監控的關鍵指標

1. **捆綁大小減少**
   - 初始捆綁大小減少
   - 代碼分割效果
   - 延遲加載影響

2. **運行時性能**
   - 小部件加載時間
   - 互動時間（TTI）
   - 首次內容繪製（FCP）

3. **用戶體驗**
   - 舊系統和 V2 系統之間的錯誤率
   - 用戶參與度指標
   - 性能一致性

## 下一步

1. 監控捆綁分析結果
2. 跟踪 50% 流量的 A/B 測試性能
3. 確定其他優化機會
4. 考慮實施：
   - 未使用導出的樹搖
   - 微前端的模塊聯邦
   - 服務工作者緩存策略