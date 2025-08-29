# 測試技術棧 (Testing Technology Stack)

_最後更新日期: 2025-08-29 02:33:37_

## 測試策略

我們的測試策略旨在以最有效的方式確保代碼質量，大致遵循測試金字塔模型，但更側重於整合測試的價值。

- **E2E 測試 (Playwright)**
  - **職責**: 模擬真實用戶的關鍵操作流程，從用戶登錄到創建訂單等，確保整個系統（前端、後端、資料庫）能夠協同工作。這些測試是質量的最後一道防線。
  - **位置**: [`e2e/`](../../e2e/)

- **單元/整合測試 (Vitest, Jest, RTL)**
  - **職責**:
    - **單元測試**: 測試獨立的、無副作用的工具函數（例如 `lib/utils/`）或簡單的業務邏輯。
    - **整合測試**: 這是我們測試的核心。我們使用 React Testing Library (RTL) 來測試 React 組件，驗證其在用戶交互下的行為是否符合預期。這類測試通常會包含多個組件的協作。
  - **位置**: [`__tests__/`](../../__tests__/)

- **API 測試 (MSW)**
  - **職責**: 使用 Mock Service Worker (MSW) 攔截並模擬後端 API 的響應。這使得我們可以在沒有真實後端的情況下，獨立地測試前端的數據請求、加載狀態、錯誤處理等邏輯。

## 測試工具

### E2E 測試

- **Playwright**: 1.54.1
- **@axe-core/playwright**: 4.10.2 (無障礙性測試)
- **@executeautomation/playwright-mcp-server**: 1.0.6
- **puppeteer-mcp-server**: 0.7.2

### 單元/整合測試

- **Vitest**: 3.2.4 (含 @vitest/ui, @vitest/browser, @vitest/coverage-v8)
- **Jest**: 29.7.0 (含 @jest/globals, ts-jest 29.4.0)
- **React Testing Library**: 16.3.0 (含 @testing-library/jest-dom 6.6.3, @testing-library/user-event 14.6.1)

### API 測試與模擬

- **MSW (Mock Service Worker)**: 2.10.3 (含 @mswjs/data 0.16.2)
- **next-test-api-route-handler**: 4.0.16
- **@faker-js/faker**: 9.9.0

### 測試支援工具

- **jest-axe**: 10.0.0 (無障礙性測試)
- **jsdom**: 26.1.0
- **lighthouse**: 12.8.1, **@lhci/cli**: 0.15.1 (性能測試)

## 測試配置文件

### 主要配置

- **playwright.config.ts**: Playwright E2E 測試配置
- **vitest.config.ts**: Vitest 單元測試配置
- **jest.config.js**: Jest 測試套件配置

### 擴展配置

- **jest.config.enhanced.js**: Jest 增強配置
- **vitest.integration.config.ts**: Vitest 整合測試專用配置
- **vitest.setup.ts**, **jest.setup.js**: 測試環境設置

## 測試指令

### 核心測試指令

- **TypeScript 編譯檢查**: `npm run typecheck`
- **系統建置**: `npm run build`
- **單元測試 (Vitest)**: `npm run vitest`
- **測試套件 (Jest)**: `npm run test`
- **端對端測試**: `npm run test:e2e`

### 擴展測試指令

- **Vitest UI模式**: `npm run vitest:ui`
- **測試覆蓋率**: `npm run vitest:coverage`, `npm run test:coverage`
- **整合測試**: `npm run test:integration:vitest`
- **並行測試**: `npm run test:parallel`
- **CI測試**: `npm run test:ci`

### 專項測試指令

- **安全測試**: `npm run test:security`
- **性能測試**: `npm run test:perf`
- **無障礙測試**: `npm run test:a11y`
- **GRN專項測試**: `npm run test:grn`
- **PDF功能測試**: `npm run test:pdf-extraction`

## 測試文件統計

### 測試文件分布 (總計 108個)

- **E2E測試**: 5個文件 (位於 `e2e/`)
- **單元/整合測試**: 103個文件 (位於 `__tests__/`)

### 測試分類

- **單元測試**: 約35個 (`__tests__/unit/`)
- **整合測試**: 約15個 (`__tests__/integration/`)
- **E2E測試**: 約25個 (`__tests__/e2e/`)
- **安全測試**: 約10個 (`__tests__/security/`)
- **性能測試**: 約5個 (`__tests__/performance/`)
- **穩定性測試**: 約8個 (`__tests__/stability/`)
- **其他**: 工廠模式、模擬、設置等 (約5個)

## 測試覆蓋率

- **預估整體覆蓋率**: 89%
- **覆蓋率監控**: 透過 `@vitest/coverage-v8` 和 Jest 內建覆蓋率工具
- **測試金字塔分布**: 大致遵循測試金字塔模型，側重整合測試價值
