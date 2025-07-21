# Unified Widgets Storybook Stories

## 概覽

本文檔描述為統一組件（UnifiedStatsWidget、UnifiedChartWidget、UnifiedTableWidget）創建的 Storybook Stories。這些 Stories 用於展示組件的各種狀態和用戶交互體驗。

## 已創建的 Stories

### 1. SimpleUnifiedWidgets.stories.tsx

這是一個完整可用的 Stories 文件，包含所有三個統一組件的簡化版本演示：

#### Stats Widget Stories
- **StatsDefault**: 基本統計顯示
- **StatsEfficiency**: 效率百分比顯示
- **StatsLoading**: 載入狀態
- **StatsError**: 錯誤狀態

#### Chart Widget Stories  
- **ChartBarDefault**: 柱狀圖顯示
- **ChartPieDistribution**: 餅圖分布顯示
- **ChartLoading**: 圖表載入狀態
- **ChartError**: 圖表錯誤狀態

#### Table Widget Stories
- **TableDefault**: 基本表格顯示
- **TableEmpty**: 空數據表格
- **TableLoading**: 表格載入狀態
- **TableError**: 表格錯誤狀態

#### Combined Layout
- **AllWidgetsCombined**: 所有組件組合佈局演示

### 2. Mock Wrapper Components

由於統一組件依賴特定的 hooks，我們創建了 mock wrapper 組件：

- **UnifiedStatsWidgetMockWrapper**: 統計組件的 mock 版本
- **UnifiedChartWidgetMockWrapper**: 圖表組件的 mock 版本  
- **UnifiedTableWidgetMockWrapper**: 表格組件的 mock 版本

### 3. Mock Data Support

創建了完整的 mock 數據支持：

- **unifiedWidgetsMocks.ts**: 統一的 mock 數據工廠
- 包含各種測試場景（成功、載入、錯誤、邊界情況）
- 支持性能測試和極端數值測試

## 使用方法

### 啟動 Storybook

```bash
npm run storybook
```

### 訪問 Stories

1. 啟動後訪問 http://localhost:6006
2. 在左側導航欄中找到 "Dashboard/Unified Widgets Demo"
3. 瀏覽各種 Story 變體

### Story 功能特點

#### 響應式設計
- 所有組件都支持響應式佈局
- 在不同螢幕尺寸下都能正常顯示

#### 狀態管理
- **Loading**: 骨架屏動畫效果
- **Error**: 清晰的錯誤信息顯示
- **Empty**: 友好的空狀態提示
- **Success**: 完整的數據展示

#### 數據格式化
- 自動處理大數值（K、M 格式）
- 百分比自動轉換
- 日期時間格式化
- 長文本截斷處理

## 技術實現

### 架構設計

1. **Mock-First 方法**: 使用 mock 組件避免複雜依賴
2. **故事驅動開發**: 每個 Story 展示特定用例
3. **用戶體驗優先**: 重點展示實際用戶交互

### 組件隔離

- 每個 Story 都是獨立的
- Mock 數據確保可預測的行為
- 無需外部 API 或數據庫連接

### 樣式系統

- 使用 Tailwind CSS 進行樣式設計
- 支持深色/淺色主題切換
- 一致的設計語言

## 最佳實踐

### Story 命名規範

- 使用描述性名稱（如 `StatsDefault`、`ChartLoading`）
- 按組件類型分組
- 包含狀態信息（Loading、Error、Empty）

### Mock 數據設計

- 使用真實數據結構
- 涵蓋邊界情況
- 支持不同數據大小

### 文檔和註釋

- 每個組件包含清晰的 props 描述
- 使用 TypeScript 確保類型安全
- 內聯註釋說明特殊邏輯

## 開發工作流

### 新增 Story

1. 在 `SimpleUnifiedWidgets.stories.tsx` 中新增 Story
2. 創建對應的 mock 數據
3. 測試所有狀態變化
4. 更新文檔

### 測試流程

1. **視覺測試**: 在 Storybook 中檢查組件外觀
2. **交互測試**: 驗證用戶交互行為
3. **響應式測試**: 測試不同螢幕尺寸
4. **無障礙測試**: 確保可訪問性

## 故障排除

### 常見問題

1. **Hook 依賴錯誤**: 使用 mock wrapper 解決
2. **樣式問題**: 檢查 Tailwind CSS 配置
3. **類型錯誤**: 確保 TypeScript 配置正確

### 解決方案

- 簡化組件依賴
- 使用 mock 數據替代真實 API
- 確保所有導入路徑正確

## 效能考慮

### 載入性能

- 懶加載大型組件
- 優化 mock 數據大小
- 使用 React.memo 防止不必要重渲染

### Bundle Size

- 只導入需要的組件
- 使用動態導入減少初始 bundle 大小
- Tree shaking 移除未使用的代碼

## 未來計劃

### 改進方向

1. **增加更多 Story 變體**
   - 更多數據類型展示
   - 更複雜的交互場景
   - 主題定制選項

2. **自動化測試集成**
   - Visual regression 測試
   - Accessibility 測試
   - Performance 測試

3. **文檔增強**
   - 交互式範例
   - 設計系統整合
   - 使用指南更新

### 技術升級

- 支持最新版本的 Storybook
- 整合新的測試工具
- 性能監控和分析

## 總結

這套 Storybook Stories 提供了完整的統一組件展示和測試環境，支持：

- **開發者體驗**: 快速預覽組件行為
- **設計系統**: 一致的組件使用規範  
- **測試驗證**: 全面的狀態和用例覆蓋
- **文檔參考**: 清晰的使用指南

通過這些 Stories，團隊可以更好地理解和使用統一組件系統，提高開發效率和代碼質量。
