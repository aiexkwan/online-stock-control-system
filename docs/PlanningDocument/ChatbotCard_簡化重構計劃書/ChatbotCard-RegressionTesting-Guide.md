# ChatbotCard 重構回歸測試指南

## 概覽

本文檔提供 ChatbotCard 重構後的完整回歸測試指南，確保重構達到預期的性能改進目標，並且不會破壞現有功能。

## 重構基準對比

### 重構前 (Baseline)

- **代碼行數**: 1074 行
- **狀態數量**: 17 個狀態
- **組件結構**: 單一大型組件
- **記憶體使用**: 約 5MB
- **初始載入時間**: ~2.5 秒

### 重構後 (Target)

- **代碼行數**: 312 行 (-70%)
- **狀態數量**: 6 個核心狀態 (-65%)
- **組件結構**: 模組化多組件架構
- **記憶體使用**: 減少 17.8%
- **性能改進**: 15-20% 提升

## 測試架構

### 測試層級

```
E2E 測試 (Playwright)
├── 跨瀏覽器兼容性
├── 響應式設計驗證
└── 完整用戶流程

整合測試 (Vitest + RTL)
├── 組件協作測試
├── 狀態管理整合
└── API 集成測試

單元測試 (Vitest + RTL)
├── 核心功能測試
├── 錯誤處理測試
└── 性能基準測試
```

### 測試文件結構

```
__tests__/
├── regression/chatbot-refactor/
│   ├── ChatbotCard.regression.test.tsx     # 主要回歸測試
│   ├── CrossBrowser.regression.test.tsx    # 跨瀏覽器兼容性
│   └── RegressionTestSuite.ts              # 測試套件執行器
├── e2e/chatbot-refactor/
│   └── ChatbotCard.e2e.spec.ts             # E2E 測試
├── performance/chatbot-refactor/
│   └── Performance.benchmark.test.ts       # 性能基準測試
└── integration/chatbot-refactor/
    └── (現有整合測試)
```

## 使用方法

### 1. 快速執行

```bash
# 執行完整回歸測試套件
npm run test:regression:chatbot

# CI 環境執行
npm run test:regression:chatbot:ci
```

### 2. 分別執行測試類型

```bash
# 單元回歸測試
npm run test:unit:chatbot

# 跨瀏覽器兼容性測試
npm run test:crossbrowser:chatbot

# E2E 測試
npm run test:e2e:chatbot

# 性能基準測試
npm run test:performance:baseline
```

### 3. 開發環境測試

```bash
# 啟動開發伺服器
npm run dev

# 在另一個終端執行測試
npm run test:regression:chatbot
```

## 測試覆蓋範圍

### 1. 功能完整性測試

#### 核心聊天功能

- ✅ 訊息發送與接收
- ✅ 串流響應處理
- ✅ 訊息歷史記錄
- ✅ 快速操作按鈕

#### 查詢建議系統

- ✅ 6個查詢類別功能
- ✅ 上下文感知建議
- ✅ 動態建議更新
- ✅ 建議點擊處理

#### 對話增強功能

- ✅ 回應格式化
- ✅ 錯誤處理
- ✅ 重試機制
- ✅ 載入狀態管理

### 2. 架構完整性測試

#### 組件分離

- ✅ ChatHeader 組件
- ✅ ChatMessages 組件
- ✅ ChatInput 組件
- ✅ QuerySuggestions 組件
- ✅ AIResponseRenderer 組件

#### 狀態管理

- ✅ useChatState Hook
- ✅ useMessageHistory Hook
- ✅ useSuggestionState Hook
- ✅ 混合狀態管理系統

#### 依賴注入

- ✅ ServiceProvider 上下文
- ✅ 服務抽象層
- ✅ 可測試性改善

### 3. 性能測試

#### 渲染性能

- ✅ 組件載入時間
- ✅ 重渲染優化
- ✅ 記憶體使用監控
- ✅ 記憶體洩漏預防

#### 交互性能

- ✅ 響應時間測量
- ✅ 並發處理能力
- ✅ 大數據量處理

#### Web Vitals

- ✅ First Contentful Paint (FCP)
- ✅ Largest Contentful Paint (LCP)
- ✅ Cumulative Layout Shift (CLS)
- ✅ Total Blocking Time (TBT)

### 4. 兼容性測試

#### 跨瀏覽器

- ✅ Chrome (Chromium)
- ✅ Firefox
- ✅ Safari (WebKit)
- ✅ Edge

#### 響應式設計

- ✅ 桌面設備 (1920x1080)
- ✅ 平板設備 (768x1024)
- ✅ 手機設備 (375x667)
- ✅ 觸控交互

#### 視覺一致性

- ✅ Glassmorphic 設計效果
- ✅ Framer Motion 動畫
- ✅ 主題切換支援

## 性能基準與目標

### 關鍵性能指標 (KPI)

| 指標         | 重構前 | 目標            | 檢查方式                |
| ------------ | ------ | --------------- | ----------------------- |
| 頁面載入時間 | 2500ms | ≤2000ms (-20%)  | Lighthouse + 自動測試   |
| 組件渲染時間 | 800ms  | ≤600ms (-25%)   | Performance API         |
| 記憶體使用   | 5MB    | ≤4.1MB (-17.8%) | Chrome DevTools Memory  |
| 互動響應時間 | 300ms  | ≤240ms (-20%)   | User Timing API         |
| Bundle 大小  | 500KB  | ≤400KB (-20%)   | Webpack Bundle Analyzer |

### 性能回歸檢查

系統會自動檢查以下回歸條件：

1. **載入性能**: 如果載入時間超過基準線的 110%，觸發警告
2. **記憶體使用**: 如果記憶體使用增長超過 5%，觸發警告
3. **響應時間**: 如果響應時間超過基準線的 120%，測試失敗
4. **Lighthouse 評分**: 如果性能評分低於 75 分，觸發警告

## 測試報告

### 自動化報告生成

每次運行回歸測試後，系統會生成：

1. **JSON 報告**: 包含詳細測試結果和性能指標
2. **HTML 報告**: 視覺化的測試結果展示
3. **控制台摘要**: 快速查看測試狀態

### 報告位置

```
test-results/
├── chatbot-regression-[timestamp].json
├── chatbot-regression-[timestamp].html
├── performance-benchmark.json
├── playwright-report/
└── coverage/
```

### CI/CD 整合

GitHub Actions 工作流程會：

1. 在每次推送到 main/develop 分支時執行
2. 在 Pull Request 中執行
3. 生成測試結果摘要
4. 上傳測試報告到 Artifacts
5. 在性能回歸時阻止合併

## 故障排除

### 常見問題

#### 1. 開發伺服器連接失敗

```bash
# 檢查伺服器狀態
curl -f http://localhost:3001/

# 手動啟動伺服器
npm run dev -- --port 3001
```

#### 2. Playwright 安裝問題

```bash
# 重新安裝 Playwright
npx playwright install --with-deps
```

#### 3. 測試超時

```bash
# 增加超時設定
export TEST_TIMEOUT=300000

# 或在 vitest.config.ts 中調整
testTimeout: 300000
```

#### 4. 記憶體不足

```bash
# 增加 Node.js 記憶體限制
export NODE_OPTIONS="--max-old-space-size=4096"
```

### 性能問題診斷

#### 1. 使用性能監控工具

```bash
# 開啟性能監控
export ENABLE_PERFORMANCE_MONITORING=true
npm run test:performance:baseline
```

#### 2. 檢查記憶體洩漏

```bash
# 開啟記憶體監控
export ENABLE_MEMORY_MONITORING=true
npm run test:unit:chatbot
```

#### 3. 分析 Bundle 大小

```bash
# 生成 bundle 分析報告
npm run analyze
```

## 維護指南

### 更新基準值

當合法的性能改進或變更需要更新基準值時：

1. 編輯 `scripts/regression/run-chatbot-regression.js`
2. 更新 `performanceBaseline` 對象中的值
3. 提交變更並說明原因

### 添加新測試

1. 在相應的測試文件中添加新測試案例
2. 更新測試覆蓋率統計
3. 確保新測試與現有測試不衝突

### CI/CD 配置更新

1. 編輯 `.github/workflows/chatbot-regression.yml`
2. 測試工作流程變更
3. 更新文檔

## 最佳實踐

### 測試開發

1. **隔離性**: 每個測試應該獨立運行
2. **確定性**: 測試結果應該可重複
3. **快速執行**: 單元測試應該在秒級完成
4. **清晰命名**: 測試名稱應該描述測試內容

### 性能測試

1. **基準測試**: 建立穩定的基準線
2. **環境控制**: 在一致的環境中運行性能測試
3. **多次運行**: 取多次運行的平均值
4. **合理閾值**: 設置實際可達成的性能目標

### 維護

1. **定期更新**: 保持測試依賴的最新狀態
2. **文檔同步**: 測試變更時同步更新文檔
3. **版本標記**: 重要變更時打版本標籤
4. **團隊溝通**: 重大變更前與團隊溝通

---

## 聯繫與支援

如有測試相關問題，請：

1. 查看此文檔的故障排除部分
2. 檢查 GitHub Issues 中的已知問題
3. 聯繫開發團隊獲得支援

**測試愉快！** 🧪✨
