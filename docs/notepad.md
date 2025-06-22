# Dashboard 優化計劃

## 目標效果分析
參考：https://strml.github.io/react-grid-layout/examples/1-basic.html

### 官方示例特點：
1. **簡潔的視覺效果**
   - 純色背景塊
   - 清晰的邊框
   - 適當的間距
   - 拖動時有明顯的視覺反饋

2. **流暢的交互體驗**
   - 拖動順滑
   - 實時預覽位置
   - 碰撞檢測準確
   - 自動壓縮佈局

3. **核心功能**
   - 自由拖放
   - 調整大小
   - 響應式佈局
   - 佈局持久化

## 現有系統差異分析

### 主要問題對比：

| 功能特性 | 官方示例 | 現有系統 | 差異原因 |
|---------|---------|---------|----------|
| 拖動流暢度 | ★★★★★ | ★★☆☆☆ | 過多的重渲染、複雜的 Widget 內容 |
| 視覺簡潔度 | ★★★★★ | ★★☆☆☆ | Widget 內容過於複雜、樣式不統一 |
| 佈局穩定性 | ★★★★★ | ★★★☆☆ | 強制正方形限制、自定義邏輯衝突 |
| 響應速度 | ★★★★★ | ★★☆☆☆ | 每個 Widget 獨立請求數據 |

### 核心差異：
1. **過度複雜化**
   - 現有系統強制 Widget 保持正方形（h = w）
   - 過多的自定義邏輯干擾原生功能
   - Widget 內容太重（圖表、實時數據等）

2. **配置衝突**
   ```tsx
   // 現有問題配置
   compactType={null}  // 關閉了自動壓縮
   allowOverlap={true}  // 允許重疊
   onResize={(layout, oldItem, newItem) => {
     newItem.h = newItem.w;  // 強制正方形
   }}
   ```

3. **性能負擔**
   - 每個 Widget 都是完整的 React 組件
   - 包含複雜的業務邏輯
   - 實時數據更新造成頻繁重渲染

## 優化方案：回歸簡潔

### 第一步：簡化 Widget 結構（1天）
1. **創建輕量級 Widget 容器**
   ```tsx
   // LightweightWidget.tsx
   const LightweightWidget = memo(({ widget, isEditMode }) => {
     if (isEditMode) {
       // 編輯模式下只顯示佔位符
       return (
         <div className="w-full h-full bg-slate-800 border border-slate-600 rounded-lg p-4">
           <div className="text-white/60">{widget.type}</div>
         </div>
       );
     }
     
     // 非編輯模式才載入實際內容
     return <ActualWidgetContent widget={widget} />;
   });
   ```

2. **移除強制正方形限制**
   - 允許自由調整寬高比
   - 恢復 react-grid-layout 原生行為

### 第二步：恢復原生配置（0.5天）
```tsx
// 更接近官方示例的配置
<ResponsiveGridLayout
  className="layout"
  layouts={layouts}
  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
  cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
  rowHeight={30}
  compactType="vertical"  // 恢復自動壓縮
  preventCollision={false}
  isDraggable={true}
  isResizable={true}
  margin={[10, 10]}
  containerPadding={[10, 10]}
  useCSSTransforms={true}
  transformScale={1}
  allowOverlap={false}  // 禁止重疊
>
```

### 第三步：實現響應式 Widget 內容（1.5天）

1. **定義 Widget 尺寸級別**
   ```tsx
   // 基於網格大小定義內容顯示級別
   enum ContentLevel {
     MINIMAL = 'minimal',      // 1-2 格寬
     COMPACT = 'compact',      // 3-4 格寬
     STANDARD = 'standard',    // 5-6 格寬
     DETAILED = 'detailed',    // 7-9 格寬
     FULL = 'full'            // 10+ 格寬
   }
   
   // 計算當前顯示級別
   const getContentLevel = (width: number, height: number): ContentLevel => {
     const area = width * height;
     if (width <= 2 || area <= 4) return ContentLevel.MINIMAL;
     if (width <= 4 || area <= 12) return ContentLevel.COMPACT;
     if (width <= 6 || area <= 25) return ContentLevel.STANDARD;
     if (width <= 9 || area <= 49) return ContentLevel.DETAILED;
     return ContentLevel.FULL;
   };
   ```

2. **創建響應式 Widget 容器**
   ```tsx
   // ResponsiveWidget.tsx
   const ResponsiveWidget = ({ widget, gridProps }) => {
     const level = getContentLevel(gridProps.w, gridProps.h);
     
     return (
       <div className="w-full h-full relative">
         {/* 根據尺寸顯示不同內容 */}
         {level === ContentLevel.MINIMAL && (
           <MinimalContent widget={widget} />
         )}
         {level === ContentLevel.COMPACT && (
           <CompactContent widget={widget} />
         )}
         {level === ContentLevel.STANDARD && (
           <StandardContent widget={widget} />
         )}
         {level === ContentLevel.DETAILED && (
           <DetailedContent widget={widget} />
         )}
         {level === ContentLevel.FULL && (
           <FullContent widget={widget} />
         )}
       </div>
     );
   };
   ```

3. **實現不同級別的內容組件**
   ```tsx
   // 以 StatsWidget 為例
   
   // 最小化 - 只顯示數字
   const MinimalContent = ({ widget }) => (
     <div className="flex items-center justify-center h-full">
       <div className="text-2xl font-bold">42</div>
     </div>
   );
   
   // 緊湊 - 數字 + 標題
   const CompactContent = ({ widget }) => (
     <div className="p-3 flex flex-col justify-center h-full">
       <h3 className="text-sm text-gray-400">Total Orders</h3>
       <div className="text-3xl font-bold">42</div>
     </div>
   );
   
   // 標準 - 數字 + 標題 + 變化趨勢
   const StandardContent = ({ widget }) => (
     <div className="p-4 flex flex-col justify-between h-full">
       <h3 className="text-sm text-gray-400">Total Orders</h3>
       <div className="text-4xl font-bold">42</div>
       <div className="flex items-center text-sm">
         <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
         <span className="text-green-500">+12%</span>
       </div>
     </div>
   );
   
   // 詳細 - 添加小圖表
   const DetailedContent = ({ widget }) => (
     <div className="p-4 flex flex-col h-full">
       <h3 className="text-sm text-gray-400 mb-2">Total Orders</h3>
       <div className="text-4xl font-bold mb-3">42</div>
       <div className="flex-1 min-h-0">
         <MiniChart data={widget.data} />
       </div>
       <div className="flex items-center text-sm mt-2">
         <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
         <span className="text-green-500">+12% vs last week</span>
       </div>
     </div>
   );
   
   // 完整 - 所有功能
   const FullContent = ({ widget }) => (
     <div className="p-6 flex flex-col h-full">
       <div className="flex justify-between items-start mb-4">
         <div>
           <h3 className="text-lg font-semibold">Total Orders</h3>
           <p className="text-sm text-gray-400">Real-time tracking</p>
         </div>
         <div className="text-4xl font-bold">42</div>
       </div>
       <div className="flex-1 min-h-0">
         <FullChart data={widget.data} />
       </div>
       <div className="grid grid-cols-3 gap-4 mt-4">
         <div className="text-center">
           <div className="text-xs text-gray-400">Today</div>
           <div className="font-semibold">12</div>
         </div>
         <div className="text-center">
           <div className="text-xs text-gray-400">This Week</div>
           <div className="font-semibold">84</div>
         </div>
         <div className="text-center">
           <div className="text-xs text-gray-400">This Month</div>
           <div className="font-semibold">342</div>
         </div>
       </div>
     </div>
   );
   ```

4. **優化文字大小和間距**
   ```css
   /* 根據 Widget 大小調整字體 */
   .widget-minimal { font-size: 0.875rem; }
   .widget-compact { font-size: 1rem; }
   .widget-standard { font-size: 1.125rem; }
   .widget-detailed { font-size: 1.25rem; }
   .widget-full { font-size: 1.375rem; }
   
   /* 響應式內邊距 */
   .widget-minimal { padding: 0.5rem; }
   .widget-compact { padding: 0.75rem; }
   .widget-standard { padding: 1rem; }
   .widget-detailed { padding: 1.5rem; }
   .widget-full { padding: 2rem; }
   ```

5. **處理特殊 Widget 類型**
   ```tsx
   // 圖表類 Widget 的響應式處理
   const ChartWidget = ({ widget, gridProps }) => {
     const level = getContentLevel(gridProps.w, gridProps.h);
     
     // 太小時不顯示圖表
     if (level === ContentLevel.MINIMAL) {
       return <div className="p-2 text-center">Chart (Too small)</div>;
     }
     
     // 根據大小調整圖表配置
     const chartConfig = {
       showLegend: level >= ContentLevel.STANDARD,
       showAxis: level >= ContentLevel.COMPACT,
       showTooltip: level >= ContentLevel.STANDARD,
       showDataLabels: level >= ContentLevel.DETAILED,
     };
     
     return <Chart config={chartConfig} data={widget.data} />;
   };
   ```

### 第四步：性能優化（1天）
1. **懶加載 Widget 內容**
   ```tsx
   const WidgetContent = lazy(() => 
     import(`./widgets/${widget.type}`)
   );
   ```

2. **優化數據獲取**
   - 批量請求數據
   - 實施請求去重
   - 添加緩存層

### 第五步：漸進增強（1-2天）
1. **保留必要的業務功能**
   - Widget 數據刷新
   - 錯誤處理
   - 權限控制

2. **添加用戶友好特性**
   - 拖動時的視覺指引
   - 調整大小的實時預覽
   - 撤銷/重做功能

## 實施優先級

### 立即可做（影響最大）：
1. **移除正方形限制** - 30分鐘
2. **實現基礎響應式內容** - 3小時
3. **調整網格配置** - 1小時
4. **優化 CSS** - 2小時

### 響應式內容實現順序：
1. **定義尺寸級別系統** - 30分鐘
2. **創建通用響應式容器** - 1小時
3. **實現 3-5 個示例 Widget** - 2小時
4. **測試不同尺寸顯示效果** - 30分鐘

### 短期優化：
1. **實施懶加載** - 4小時
2. **優化數據請求** - 6小時
3. **統一視覺風格** - 4小時

### 長期改進：
1. **重構 Widget 架構** - 2-3天
2. **實施虛擬滾動** - 1-2天
3. **添加高級功能** - 2-3天

## 預期效果
- **拖動流暢度**：★★☆☆☆ → ★★★★☆
- **視覺簡潔度**：★★☆☆☆ → ★★★★★
- **佈局穩定性**：★★★☆☆ → ★★★★★
- **響應速度**：★★☆☆☆ → ★★★★☆

## 風險評估
- **低風險**：移除正方形限制、優化 CSS
- **中風險**：簡化 Widget 結構、調整配置
- **需測試**：懶加載實施、數據優化

## Widget 響應式內容範例

### 統計數字 Widget
```
1格：只顯示數字
3格：數字 + 標題
5格：數字 + 標題 + 趨勢 + 迷你圖表
7格：完整儀表板（數字 + 圖表 + 詳細分析）
```

### 圖表 Widget
```
1格：顯示 "Chart" 文字提示
3格：簡化圖表（無軸線、無圖例）
5格：完整圖表（軸線 + 圖例）
7格：互動圖表（工具提示 + 數據標籤 + 縮放）
```

### 列表 Widget
```
1格：顯示計數
3格：顯示前 3 項
5格：顯示前 5 項 + 基本信息
7格：顯示前 10 項 + 搜索 + 篩選
7+格：完整功能
```

### 實現優勢
1. **性能提升** - 小 Widget 渲染更少內容
2. **用戶體驗** - 根據空間顯示合適信息
3. **靈活性** - 用戶可自由調整查看詳細程度
4. **視覺統一** - 不同大小都保持美觀

## 結論
通過實現響應式 Widget 內容，配合移除不必要的限制，可以同時達到：
- 類似官方示例的流暢拖放體驗
- 根據尺寸智能顯示內容
- 保留業務功能的完整性

建議優先實施響應式內容系統，這是提升用戶體驗的關鍵。

---

## Widget 真實數據映射計劃

### 完整 Widget 列表和數據表確認

**已確認的 Supabase 表：**
- `record_palletinfo` - 生產板塊信息
- `record_aco` - ACO 訂單記錄
- `record_grn` - 收貨記錄
- `record_inventory` - 庫存記錄
- `record_transfer` - 轉移記錄（包含 tran_date, f_loc, t_loc, plt_num）
- `record_history` - 歷史記錄（包含 time, action, plt_num, loc, remark）
- `report_void` - 作廢報告（包含 time, plt_num, reason, damage_qty）

### 所有響應式 Widget 數據映射：

### 1. ResponsiveOutputStatsWidget（生產統計）✅ 已實施
**數據來源：**
- 表名：`record_palletinfo`
- 篩選條件：
  - `plt_remark = 'Finished In Production'`
  - 根據時間範圍篩選 `generate_time`

### 2. ResponsiveBookedOutStatsWidget（轉移統計）
**數據來源：**
- 表名：`record_transfer`
- 篩選條件：根據 `tran_date` 時間範圍

**獲取數據：**
1. **總轉移數（transferCount）**
   - 計算記錄總數
   - 列：COUNT(*)

2. **趨勢（trend）**
   - 與昨天的轉移數比較

3. **目的地分布（destinations）**
   - 按 `t_loc` 分組統計
   - 列：`t_loc`, COUNT(*)

4. **每小時數據（hourlyData）**
   - 按 `tran_date` 小時分組

### 3. ResponsiveChartWidget（庫存圖表）
**數據來源：**
- 表名：`record_inventory`
- 所有位置列：`injection`, `pipeline`, `prebook`, `await`, `fold`, `bulk`, `backcarpark`

### 4. ResponsiveAcoOrderProgressWidget（ACO 訂單進度）✅ 已實施
**數據來源：**
- 表名：`record_aco`
- 關聯表：`record_aco_detail`

### 5. ResponsiveFinishedProductWidget（生產歷史）✅ 已實施
**數據來源：**
- 表名：`record_palletinfo`
- 篩選：`plt_remark = 'Finished In Production'`

### 6. ResponsiveMaterialReceivedWidget（收貨統計）✅ 已實施
**數據來源：**
- 表名：`record_grn`

### 7. ResponsiveInventorySearchWidget（庫存搜索）✅ 已實施
**數據來源：**
- 表名：`record_inventory`

### 8. ResponsiveRecentActivityWidget（最近活動）
**數據來源：**
- 表名：`record_history`
- 列：`time`, `action`, `plt_num`, `loc`, `remark`

**獲取數據：**
1. **活動列表**
   - 按 `time` 降序排序
   - 限制最近 N 條記錄
   - 顯示：時間、動作、板號、位置

2. **活動統計**
   - 按 `action` 分組計數
   - 顯示不同動作的分布

### 其他 Widget（非響應式）：

### 9. VoidPalletWidget（作廢統計）
**數據來源：**
- 表名：`report_void`
- 列：`time`, `plt_num`, `reason`, `damage_qty`

### 10. TargetHitReportWidget（目標達成報告）
**數據來源：**
- 需要確認具體表名和業務邏輯

### 11. ProductionReportWidget（生產報告）
**數據來源：**
- 表名：`record_palletinfo`
- 需要與管理層確認報告需求

### 12. AskDatabaseWidget（AI 查詢）
**數據來源：**
- 動態查詢多個表
- 使用 AI 解析查詢意圖

### 13. ViewHistoryWidget（歷史查看）
**數據來源：**
- 表名：`record_history`
- 按 `plt_num` 搜索

### 14. DatabaseUpdateWidget（數據更新）
**數據來源：**
- 多表更新操作
- 需要管理權限

### 15. DocumentUploadWidget（文檔上傳）
**數據來源：**
- Supabase Storage
- 文檔元數據表（需確認）

### 16. ReportsWidget（報告導出）
**數據來源：**
- 多表聯合查詢
- 根據報告類型動態生成

### 數據獲取策略

#### 時間範圍處理：
```typescript
// 統一的時間範圍函數
const getTimeRange = (range: TimeRange) => {
  switch(range) {
    case 'Today': return getTodayRange();
    case 'Yesterday': return getYesterdayRange();
    case 'Past 3 days': return getDateRange(3);
    case 'Past 7 days': return getDateRange(7);
  }
}
```

#### 性能優化考慮：
1. 使用 `select` 指定需要的列
2. 添加適當的索引
3. 限制返回記錄數
4. 實施查詢緩存

### 實施順序建議：
1. ✅ ResponsiveOutputStatsWidget - 已完成
2. ⏳ ResponsiveBookedOutStatsWidget - 待實施（使用 record_transfer）
3. ⏳ ResponsiveChartWidget - 待實施
4. ⏳ ResponsiveRecentActivityWidget - 待實施（使用 record_history）

### 注意事項：
1. `record_transfer` 表用於轉移統計，包含 f_loc（來源）和 t_loc（目的地）
2. `record_history` 表用於活動記錄，包含所有操作歷史
3. `report_void` 表用於作廢/損壞統計
4. 時區處理統一使用 timezone utils
5. 錯誤處理要完善，避免因數據問題導致 widget 崩潰







非編輯模式：
  -  所有按鈕、輸入框、下拉選單都可以點擊 (Fail)
  -  不能拖動或調整大小(success, but cursor should change to drag cursor)

  編輯模式：
  -  可以拖動整個 widget（除了互動元素）(success)
  -  可以調整大小（右下角）(success)
  -  Widget 內的按鈕、輸入框仍然可以點擊(should be disable)