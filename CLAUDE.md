# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 語言設定
永遠使用廣東話回答所有問題。

## 專案概述
NewPennine 倉庫管理系統 - 基於 Next.js 14、TypeScript 同 Supabase 嘅現代化 WMS。企業級倉庫管理解決方案，支援完整供應鏈管理，包括 QC/GRN 標籤列印、庫存轉移、AI 訂單分析同管理儀表板。

## 開發命令

### 基本開發
```bash
npm run dev          # 啟動開發服務器 (會自動清理同殺死 localhost)
npm run build        # 生產構建
npm run start        # 啟動生產服務器
npm run clean        # 清理 .next, .turbo, dist 等目錄
```

### 代碼品質
```bash
npm run lint         # ESLint 檢查
npm run typecheck    # TypeScript 類型檢查
npm run format       # Prettier 格式化
npm run format:check # 檢查格式化狀態
```

### 測試
```bash
npm test             # Jest 單元測試
npm run test:watch   # 監視模式運行測試
npm run test:coverage # 生成覆蓋率報告
npm run test:e2e     # Playwright E2E 測試
npm run test:e2e:ui  # E2E 測試 UI 模式
npm run test:e2e:debug # E2E 測試除錯模式
npm run test:e2e:report # 查看 E2E 測試報告
npm run test:e2e:pdf # 運行 PDF 生成測試
```

### GraphQL 開發
```bash
npm run codegen      # 生成 GraphQL 類型同 hooks
npm run codegen:watch # 監視模式生成 GraphQL 代碼
npm run codegen:check # 檢查 GraphQL schema 有效性
```

### 分析同優化
```bash
npm run analyze      # Bundle 分析
npm run analyze:view # 查看 bundle 分析報告
npm run validate-schema # 驗證 GraphQL schema
npm run validate-schema:ci # CI 模式驗證 schema
npm run auto-push    # 自動 git push (開發用)
```

### MCP/Supabase 工具
```bash
npm run mcpIOS       # 啟動 Supabase MCP 服務器 (用於 Claude Code 數據庫查詢)
```

## 技術棧同架構

### 核心技術
- **前端**: Next.js 14 (App Router), React 18, TypeScript
- **後端**: Supabase PostgreSQL (專案 ID: `bbmkuiplnzvpudszrend`)
- **樣式**: Tailwind CSS, Framer Motion, shadcn/ui
- **狀態管理**: React Hooks, Zustand
- **認證**: Supabase Auth
- **實時功能**: Supabase Realtime
- **AI 整合**: OpenAI GPT-4o

### 關鍵架構模式

#### Server Actions 架構
- **`app/actions/`**: 統一 Server Actions，處理所有數據變更操作
- **RPC 優先**: 複雜業務邏輯使用 Supabase RPC 函數確保原子性
- **錯誤處理**: 統一使用 `ErrorHandler` service (`app/components/qc-label-form/services/ErrorHandler.ts`)

#### Widget 系統
- **統一 Widget Registry**: `lib/widgets/enhanced-registry.ts` 管理所有儀表板組件
- **懶加載**: 所有 widgets 支持動態導入同懶加載 (`lib/widgets/dynamic-imports.ts`)
- **性能監控**: 內建性能監控同 A/B 測試框架 (`lib/widgets/performance-monitor.ts`)
- **遷移適配器**: 支持舊 widgets 無縫遷移 (`lib/widgets/migration-adapter.ts`)
- **雙重驗證**: 確保 widget 遷移正確性 (`lib/widgets/dual-run-verification.ts`)

#### 通用佈局系統
- **`components/layout/universal/`**: 可重用佈局組件系統
- **響應式設計**: 完整移動端支持
- **主題系統**: 支持多主題切換

### 數據庫架構
主要表格：
- `record_palletinfo`: 棧板信息同追蹤
- `record_history`: 完整審計日誌
- `record_transfer`: 庫存移動記錄  
- `record_inventory`: 實時庫存水平
- `record_aco`/`record_grn`: 訂單同收貨管理
- `data_code`: 產品目錄
- `data_supplier`: 供應商數據
- `data_id`: 用戶管理

## 開發規範

### 必須遵守事項
- **長駐開啟ultrathink模式**
- 優先編輯現有文件而非創建新文件，減少冗碼
- 只在用戶明確要求時創建文檔文件
- **運行 `npm run lint` 同 `npm run typecheck` 確保代碼質量**
- **使用 MCP 工具確認數據庫結構，唔好假設**
- **所有 UI 文字必須使用英文**
- 保持代碼整潔，減少冗餘
- **避免使用鍵盤事件處理器** - 根據最近更新，已移除鍵盤事件改善用戶體驗

### 架構指引
1. **Server Actions**: 所有數據變更必須通過 `app/actions/` 處理
2. **RPC 函數**: 複雜事務操作使用 Supabase RPC 確保原子性
3. **錯誤處理**: 統一使用 `ErrorHandler` service
4. **Widget 開發**: 新 widgets 必須註冊到 enhanced registry
5. **TypeScript 嚴格模式**: 啟用所有 strict 選項
6. **組件模組化**: 保持組件可重用同可測試

### 性能考慮
- 優先使用 RPC 函數處理複雜操作
- 實施適當嘅緩存策略 (Redis/React Query)
- 使用虛擬化處理大數據列表 (`@tanstack/react-virtual`)
- 監控 bundle size，使用懶加載

### 安全考慮
- 唔好 commit 任何 API key 或敏感資料
- 使用環境變量管理配置
- 實施適當嘅權限控制
- 所有 SQL 查詢經過安全驗證

## 常用開發模式

### 新增 Widget
1. 在 `app/admin/components/dashboard/widgets/` 創建組件
2. 註冊到 `lib/widgets/enhanced-registry.ts`
3. 添加到相應佈局文件 (`adminDashboardLayouts.ts`)
4. 使用 `lib/widgets/dynamic-imports.ts` 配置懶加載
5. 可選：配置 A/B 測試 (`lib/widgets/ab-testing-framework.ts`)

### Server Action 開發
1. 在 `app/actions/` 相應文件添加 action
2. 使用 Zod schema 驗證 (`app/actions/schemas.ts`)
3. 實施錯誤處理同日誌記錄

### 數據庫操作
1. 優先使用 RPC 函數處理複雜邏輯
2. 使用 MCP 工具確認 schema 結構
3. 實施完整事務日誌追蹤

## 重要模式同最佳實踐

### Widget 遷移模式
- 使用 `lib/widgets/migration-adapter.ts` 進行無縫遷移
- 啟用雙重驗證確保遷移正確性
- 所有新 widgets 必須支持懶加載

### 性能優化模式
- 使用 `@tanstack/react-virtual` 處理大列表
- 啟用 React Query 緩存策略
- 監控 bundle size 同分析報告

### 測試策略
- 單元測試覆蓋關鍵業務邏輯
- E2E 測試覆蓋主要用戶流程
- PDF 生成功能需要專門測試

## 文檔資源
- **項目文檔**: `/docs` 目錄
- **GraphQL Schema**: `lib/graphql/schema.graphql`
- **數據庫結構**: `docs/databaseStructure.md`
- **Widget 開發**: `lib/widgets/` 目錄
- **內部知識庫**: 使用 Ask Database 功能查詢
- **測試報告**: E2E 測試結果同覆蓋率報告