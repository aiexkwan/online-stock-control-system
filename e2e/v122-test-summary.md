# v1.2.2 Widget API 測試執行總結

## 測試文件清單

### 1. Playwright E2E 測試
- **文件**: `e2e/widgets/nestjs-widgets-api-v122.spec.ts`
- **內容**: 測試 4 個 Widget endpoints 的完整功能
- **測試項目**:
  - StatsCardWidget: 9 種數據源測試
  - ProductDistributionChartWidget: 產品分佈和限制測試
  - InventoryOrderedAnalysisWidget: 庫存分析測試
  - TransactionReportWidget: 交易報告和過濾測試
  - 錯誤處理: 401/400 錯誤測試

### 2. 性能基準測試
- **文件**: `e2e/performance/graphql-vs-rest-benchmark.spec.ts`
- **內容**: GraphQL vs REST API 性能對比
- **測試項目**:
  - 單一請求響應時間對比
  - 數據傳輸大小對比
  - 並發請求處理對比
  - 負載測試（100 請求）

### 3. 手動測試腳本
- **文件**: `e2e/test-widget-api-manual.sh`
- **用途**: 使用 curl 快速驗證 API 功能
- **功能**: 無需 Playwright 即可測試所有 endpoints

### 4. 自動化測試腳本
- **文件**: `e2e/run-widget-api-tests.sh`
- **用途**: 自動啟動 NestJS 並運行所有測試

## 如何執行測試

### 方法 1: 手動測試（推薦快速驗證）
```bash
# 1. 啟動 NestJS 服務器
cd backend/newpennine-api
npm run start:dev

# 2. 在新終端運行手動測試
cd ../..
./e2e/test-widget-api-manual.sh
```

### 方法 2: Playwright 自動化測試
```bash
# 1. 確保 NestJS 服務器運行中
# 2. 運行 Playwright 測試
npx playwright test e2e/widgets/nestjs-widgets-api-v122.spec.ts --project=chromium
```

### 方法 3: 完整測試套件
```bash
# 運行自動化腳本（會自動啟動服務器）
./e2e/run-widget-api-tests.sh
```

## 測試結果位置
- **測試報告**: `playwright-report/`
- **性能報告**: `docs/audit/v122-widget-api-performance-report.md`
- **截圖**: `e2e/screenshots/`

## 預期結果
- 所有 4 個 Widget endpoints 功能正常
- 平均性能提升 60-70%
- 數據傳輸量減少 60%+
- 實施 5 分鐘緩存機制

## 注意事項
1. 確保 NestJS 服務器在 port 3001 運行
2. 使用正確的測試用戶憑證（已配置在 test-data.ts）
3. 首次運行可能需要等待服務器完全啟動
