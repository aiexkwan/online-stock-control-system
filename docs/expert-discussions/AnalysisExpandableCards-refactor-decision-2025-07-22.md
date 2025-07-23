# 專家討論記錄 - AnalysisExpandableCards 重構決策 - 2025-07-22

## 參與專家
- 主導角色：產品經理
- 協作角色：分析師、架構專家、優化專家、QA專家、整合專家、文檔專家
- 討論深度：Level 4 (完整共識達成)

## 問題分析
### 核心問題
用戶要求修改 AnalysisExpandableCards，移除現有 7個自定義圖表，改為只顯示指定的 11個 UnifiedWidget，並實現左側選擇區精確控制右側顯示內容。

### 技術發現
1. **架構不匹配**：當前組件是展開式選擇器，但需求是被動顯示容器
2. **內容衝突**：現有 7個自定義圖表 vs 要求的 11個 UnifiedWidget  
3. **控制邏輯錯誤**：內部選擇 vs 外部控制

## 討論過程

### Level 1: 初步分析
**分析師觀點**：
- 問題根源：架構設計與實際需求不匹配
- 建議：方案A（完全重構）風險更低，符合KISS原則

**架構專家觀點**：
- 方案A符合UnifiedWidget標準架構，減少技術債務
- 長期維護成本更低

**優化專家觀點**：
- 方案A性能更好，利用統一載入器和快取機制
- 建議添加簡單漸入動畫補償

**QA專家觀點**：
- 方案A風險可控，測試策略清晰
- 方案B整合測試複雜度過高

**整合專家觀點**：
- 方案A整合接口清晰簡單
- 與AnalyticsTabSystem對接更直觀

### Level 2: 深度探討
**技術實現細節**：
- 確定11個分析相關的UnifiedWidget
- 新組件架構：selectedWidgets props + 網格佈局
- 動畫補償：簡單但有效的淡入動畫
- 性能優化：記憶化、預載入、漸進載入

**測試策略**：
- 單元測試：widget載入、錯誤處理、選擇邏輯
- 整合測試：與AnalyticsTabSystem數據流
- 性能測試：多widget載入基準

### Level 3: 衝突解決
**主要衝突**：
1. **性能 vs 功能**：解決方案 - 分頁顯示，最多同時顯示6個
2. **動畫 vs 簡潔**：解決方案 - 優先簡單動畫，未來可擴展
3. **標準化 vs 定制化**：解決方案 - 遵循標準但允許分析頁面擴展

### Level 4: 共識達成
**最終決策**：採用方案A（完全重構）+ 階段性實現

## 最終決策

### 產品經理裁定
基於專家討論，決定採用 **方案A（完全重構為簡單顯示容器）**

**投票結果**：6/6票支持方案A
- 分析師：✅ 根本原因分析支持標準化重構
- 架構專家：✅ 長期維護和技術債務考慮  
- 優化專家：✅ 性能和用戶體驗平衡
- QA專家：✅ 風險可控，測試策略清晰
- 整合專家：✅ 整合接口簡單明確
- 文檔專家：✅ 標準化有利於知識管理

### 執行計劃

#### Phase 1（立即執行）
1. ✅ 創建 AnalysisDisplayContainer 組件
2. ✅ 實現11個widget的選擇和顯示
3. ✅ 基礎淡入動畫
4. ✅ 網格布局（auto/2x2/3x3/4x2）
5. ✅ 重構AnalyticsTabSystem為左側選擇器

#### Phase 2（後續優化）
1. 添加展開動畫選項
2. 性能優化（虛擬化）
3. 高級篩選和搜索

### 技術實現

#### 11個選定的 UnifiedWidget
```typescript
const ANALYSIS_WIDGETS_CONFIG = {
  HistoryTreeV2: { gridSize: 'large', priority: 10, category: 'core' },
  InventoryOrderedAnalysisWidget: { gridSize: 'large', priority: 9, category: 'analysis' },
  StockDistributionChartV2: { gridSize: 'medium', priority: 8, category: 'charts' },
  StockLevelHistoryChart: { gridSize: 'medium', priority: 8, category: 'charts' },
  TopProductsByQuantityWidget: { gridSize: 'medium', priority: 7, category: 'charts' },
  TopProductsDistributionWidget: { gridSize: 'medium', priority: 7, category: 'charts' },
  TransferTimeDistributionWidget: { gridSize: 'medium', priority: 6, category: 'charts' },
  WarehouseWorkLevelAreaChart: { gridSize: 'medium', priority: 6, category: 'charts' },
  WarehouseTransferListWidget: { gridSize: 'large', priority: 8, category: 'lists' },
  TransactionReportWidget: { gridSize: 'medium', priority: 5, category: 'reports' },
  AnalysisExpandableCards: { gridSize: 'large', priority: 4, category: 'legacy' }
};
```

#### 新的佈局架構
- **左側**：分類的widget選擇器（checkbox形式）
- **右側**：AnalysisDisplayContainer 顯示選中的widgets
- **狀態管理**：selectedWidgets + expandedCategories
- **緩存**：10分鐘TTL，記住用戶選擇

#### 關鍵特性
1. **優先級排序**：按priority值排序顯示
2. **網格佈局**：支援4種佈局模式
3. **錯誤邊界**：widget載入失敗的優雅降級
4. **性能控制**：maxVisible限制同時顯示數量
5. **動畫效果**：Framer Motion漸入動畫

## 後續追蹤
- 檢查點：2025-07-23
- 評估標準：用戶體驗、載入性能、錯誤率
- 成功指標：
  - TypeScript錯誤 = 0
  - 測試覆蓋率 > 80%
  - 用戶滿意度反饋
  - 左側選擇精確控制右側顯示

## 學習點
1. **奧卡姆剃刀原則**：簡單問題用簡單解決方案
2. **專家協作**：6個專家視角確保決策全面性
3. **階段性實現**：平衡短期需求和長期可維護性
4. **標準化價值**：遵循UnifiedWidget系統降低複雜度

---
*記錄者：文檔專家*  
*討論時間：約45分鐘*  
*決策模式：專家議會投票制*