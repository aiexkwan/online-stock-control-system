# 測試技術棧 (Testing Technology Stack)

_最後更新日期: 2025-08-27 10:42:20_

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

- **E2E 測試**: Playwright 1.54.1
- **單元/整合測試**: Vitest 3.2.4, Jest 29.7.0, React Testing Library 16.3.0 (103個測試檔案)
- **API 測試**: MSW 2.10.3
- **無障礙性測試**: @axe-core/playwright 4.10.2

## 測試指令

- **TypeScript 編譯檢查**: `npm run typecheck`
- **系統建置**: `npm run build`
- **單元測試 (Vitest)**: `npm run vitest`
- **端對端測試**: `npm run test:e2e`
- **測試套件 (Jest)**: `npm run test`
- **測試覆蓋率**: 預估 89%
