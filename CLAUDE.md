# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 語言設定
永遠使用廣東話回答所有問題。

## 專案概述
NewPennine 倉庫管理系統 - 基於 Next.js 14、TypeScript 同 Supabase 嘅現代化 WMS。企業級倉庫管理解決方案，支援完整供應鏈管理，包括 QC/GRN 標籤列印、庫存轉移、AI 訂單分析同管理儀表板。

**最新狀態 (2025-07-18)**: TypeScript 錯誤修復重大進展 ✅ 74.9% 完成  
- TypeScript 錯誤從 271 個減少至 68 個 (203 個錯誤已修復)
- Storybook 配置和可訪問性組件完成，jest-axe 測試框架建立
- 監控系統類型完整，Widget 枚舉使用統一  
- 35+ REST API 端點已實施並經過測試
- 前端 widgets 完全遷移到 REST API 架構

---

## 🎭 專家角色與場景組合

### 預設場景組合（快速選擇）
根據不同工作場景，建議使用以下角色組合：

| 場景 | 命令 | 包含角色 |
|------|------|----------|
| 日常操作優化 | `/role daily-ops` | Backend + Frontend + 流程優化 + QA + 數據分析 |
| 緊急修復 | `/role emergency` | 分析師 + Backend + DevOps + 安全 |
| 新功能開發 | `/role new-feature` | 產品經理 + 架構 + Backend + Frontend + QA |
| 性能優化 | `/role performance` | 優化專家 + 架構 + Backend + 數據分析 |
| 安全審計 | `/role security-audit` | 安全 + Backend + DevOps + QA |
| 系統整合 | `/role integration` | 整合專家 + 架構 + Backend + QA + 安全 |

### 角色詳細說明
完整角色職責和使用指引請參考：
- 角色總覽：`docs/general_rules.md` → 身分定位系統
- 個別角色文檔：`docs/role_play/[角色名].md`

---

## 🎯 快速命令指引

### 基本工作模式
- **`/start`** - 執行 todolist 下一步任務
- **`/plan`** - 建立完整計劃
- **`/check`** - 檢查完成進度
- **`/fix`** - 修復問題
- **`/audit`** - 代碼審核
- **`/final-audit`** - 最終系統審核
- **`/think`** - 深度思考分析
- **`/update-claude`** - 根據最新 codebase 更新 CLAUDE.md
- **`/role [角色名稱]`** - 切換到特定專家角色

### 專家角色系統
使用 `/role` 命令切換角色，或在任務開始時選擇多個角色協作：

| ID | 角色 | 用途 | 命令範例 |
|:---:|------|------|----------|
| 1 | 分析師 | 問題分析、根本原因調查 | `/role analyzer` |
| 2 | 系統架構專家 | 架構設計、技術選型 | `/role architect` |
| 3 | Backend工程師 | API開發、資料庫操作 | `/role backend` |
| 4 | DevOps專家 | 部署、監控、自動化 | `/role devops` |
| 5 | Frontend專家 | UI開發、用戶體驗 | `/role frontend` |
| 6 | 優化專家 | 性能優化、瓶頸分析 | `/role optimizer` |
| 7 | QA專家 | 測試策略、品質保證 | `/role qa` |
| 8 | 代碼品質專家 | 重構、技術債管理 | `/role refactor` |
| 9 | 安全專家 | 安全審計、漏洞修復 | `/role security` |
| 10 | 產品經理 | 需求管理、優先級 | `/role pm` |
| 11 | 整合專家 | 系統整合、API對接 | `/role integration` |
| 12 | 流程優化專家 | 流程改進、效率提升 | `/role process` |
| 13 | 數據分析師 | 數據洞察、報表分析 | `/role data` |
| 14 | AI/ML工程師 | AI優化、模型調整 | `/role ai` |

**多角色協作範例**：
```
/role backend,qa,security  # 同時使用3個角色進行安全API開發
```

### 每個命令詳細說明

#### 📌 `/start` - 開始執行任務
```
執行流程：
1. 閱讀 docs/general_rules.md
2. 檢查 todolist（如為空，先詢問）
3. 執行下一步任務
4. 使用 Playwright 測試驗證
5. 更新相關進度文檔
```

#### 📋 `/plan` - 制定計劃
```
執行流程：
1. 閱讀 docs/general_rules.md
2. 建立完整計劃
3. 使用版本號（1.1, 1.2.4）作規劃單位
4. 將計劃寫入 docs/planning/
```

#### ✅ `/check` - 進度檢查
```
執行流程：
1. 閱讀 docs/general_rules.md
2. 檢查完成進度
3. 使用測試工具驗證
4. 確認是否按規劃執行
```

#### 🔧 `/fix` - 問題修復
```
執行流程：
1. 使用分析師角色（docs/role_play/Analyzer.md）
2. 查看 issue-library 相似問題
3. 專注解決當前問題
4. Playwright 測試驗證
5. 更新到 issue-library
```

#### 🔍 `/audit` - 代碼審核
```
審核項目：
1. 重複或不合理的讀寫
2. 循環引用問題
3. A/B機制（edge case處理）
4. 冗碼和不必要註釋
5. 編碼原則遵守
6. 用戶操作流程
完成後寫入 docs/audit/
```

#### 🏆 `/final-audit` - 最終系統審核
```
審核範圍：
1. Workflow 分析
2. Dataflow 檢查
3. Code Quality & 清潔度
4. Component 維護性
5. UI & 語言一致性
6. 系統安全性
7. 測試覆蓋率
8. Logging 與分類
9. 監控與警示系統
10. Documentation
輸出至：docs/Project-Restructure/audit/
```

#### 🔄 `/update-claude` - 更新 CLAUDE.md
```
執行流程：
1. 掃描整個 codebase 結構
2. 分析新增/修改的功能
3. 檢查 package.json 的新命令
4. 更新技術棧資訊
5. 更新開發模式和最佳實踐
6. 保持原有重要配置
注意：只更新變更部分，保留核心指引
```

#### 👤 `/role [角色名稱]` - 角色切換
```
使用方式：
- 單角色：/role backend
- 多角色：/role backend,qa,security
- 查看角色：/role list
- 場景建議：/role suggest [場景描述]

詳細角色文檔：docs/role_play/
場景組合建議：docs/general_rules.md
```

---

## 🛠️ 核心配置與規則

### 必須遵守事項
- **遵從"KISS"原則**: 系統、設計、程式碼、流程——只要可以簡單實現，無需複雜化
- **長駐開啟 ultrathink 模式**
- **優先編輯現有文件而非創建新文件，減少冗碼**
- **只在用戶明確要求時創建文檔文件**
- **每次更新必須解決 TypeScript 和 ESLint 問題**
- **使用 MCP 工具確認數據庫結構，唔好假設**
- **所有 UI 文字必須使用英文**
- **保持代碼整潔，減少冗餘**

### 工具使用
所有命令都可使用：
- **Ultrathink** - 深層思考
- **Sequential-thinking** - 邏輯推理
- **Task** - 同步平行執行任務
- **Puppeteer MCP** - 自動化測試
- **Supabase MCP** - 資料庫查詢
- **Brave Search MCP** - 搜尋資料

### 測試憑證
```yaml
登入憑證:
  email: ${env.local.SYS_LOGIN} 或 ${env.local.PUPPETEER_LOGIN}
  password: ${env.local.SYS_PASSWORD} 或 ${env.local.PUPPETEER_PASSWORD}
```

---

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
# 單元測試
npm test             # Jest 單元測試
npm run test:watch   # 監視模式運行測試
npm run test:coverage # 生成覆蓋率報告
npm run test:ci      # CI 模式運行測試

# E2E 測試
npm run test:e2e     # Playwright E2E 測試
npm run test:e2e:ui  # E2E 測試 UI 模式
npm run test:e2e:debug # E2E 測試除錯模式
npm run test:e2e:report # 查看 E2E 測試報告
npm run test:e2e:pdf # 運行 PDF 生成測試

# 性能測試
npm run test:perf    # 性能測試
npm run test:perf:report # 性能測試報告
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
- **Widget Dashboard API**: NestJS API

### 關鍵架構模式

#### Server Actions 架構
- **`app/actions/`**: 統一 Server Actions，處理所有數據變更操作
- **RPC 優先**: 複雜業務邏輯使用 Supabase RPC 函數確保原子性
- **錯誤處理**: 統一使用 `ErrorHandler` service (`app/components/qc-label-form/services/ErrorHandler.ts`)

#### Widget 系統
- **統一 Widget Registry**: `lib/widgets/enhanced-registry.ts` 管理所有儀表板組件
- **懶加載**: 所有 widgets 支持動態導入同懶加載 (`lib/widgets/dynamic-imports.ts`)
- **性能監控**: 內建性能監控框架 (`lib/widgets/performance-monitor.ts`)

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

### Server Action 開發
1. 在 `app/actions/` 相應文件添加 action
2. 使用 Zod schema 驗證 (`app/actions/schemas.ts`)
3. 實施錯誤處理同日誌記錄

### 數據庫操作
1. 優先使用 RPC 函數處理複雜邏輯
2. 使用 MCP 工具確認 schema 結構
3. 實施完整事務日誌追蹤

## 重要模式同最佳實踐

### Widget 開發模式
- 所有新 widgets 必須支持懶加載
- 使用性能監控確保優化效果

### 性能優化模式
- 使用 `@tanstack/react-virtual` 處理大列表
- 啟用 React Query 緩存策略
- 監控 bundle size 同分析報告

### 測試策略
- 單元測試覆蓋關鍵業務邏輯
- E2E 測試覆蓋主要用戶流程
- PDF 生成功能需要專門測試
- 性能測試監控優化效果 (`npm run test:perf`)

## 高階開發模式 (2025 更新)

### 統一數據獲取模式 - useUnifiedAPI
使用 `useUnifiedAPI` hook 統一處理數據獲取，支援現代化 REST API 架構：
```typescript
const { data, loading, error } = useUnifiedAPI({
  endpoint: '/api/data',
  params: { id },
  enabled: !!id,
  queryKey: ['data', id]
});
```

### Server-Side Rendering (SSR) 優化
為 critical widgets 啟用 SSR 以提升首屏性能：
- 使用 `prefetchCriticalWidgetsData` 預取數據
- 只為 injection/pipeline/warehouse 主題啟用
- 確保優雅降級到 CSR

### 批量查詢策略
使用 `useDashboardBatchQuery` 減少網絡請求：
- 將 15+ 獨立查詢合併為 1 個批量查詢
- 使用 `DashboardDataContext` 共享數據
- 減少 80% 網絡延遲

### Progressive Loading 模式
圖表組件實施延遲加載：
- 使用 `useInViewport` hook 檢測可見性
- 先顯示 skeleton，再加載實際圖表
- 使用 `ChartSkeleton` 統一加載狀態

### 通用組件使用
優先使用通用組件減少代碼重複：
- `MetricCard`: 統計卡片顯示
- `DataTable`: 列表數據展示
- `ChartContainer`: 圖表容器
- `DateRangeFilter`: 日期範圍選擇

### Bundle Size 優化
已實現 93% bundle size 減少：
- 精確分離大型庫 (ExcelJS, recharts, 舊式 API 客戶端)
- 智能優先級策略 (框架 > 圖表 > 數據層)
- maxSize 限制 200KB per chunk

### 性能監控
使用內建性能監控工具：
- `PerformanceMonitor` 實時監控組件
- `npm run test:perf` 運行性能測試
- 追蹤 Web Vitals (FCP, LCP, TTI, CLS)

## 文檔資源
- **項目文檔**: `/docs` 目錄
- **通用規則**: `docs/general_rules.md`
- **角色文檔**: `docs/role_play/` 目錄
- **API 文檔**: `lib/api/` 目錄下的 REST API 實現
- **數據庫結構**: `docs\databaseScheme\databaseStructure.md`
- **內部知識庫**: 使用 Ask Database 功能查詢
- **測試報告**: E2E 測試結果同覆蓋率報告

## 單獨測試運行
```bash
# 運行特定測試文件
npm test -- --testPathPattern="specific-test"
npm run test:e2e -- --grep "特定測試名稱"

# 運行特定組件的測試
npm test -- app/components/specific-component

# 清除測試緩存
npm test -- --clearCache
```

---

## 📚 相關資源連結

### 文檔庫路徑
- **計劃文檔**: `docs/planning/`
- **TodoList**: `docs/Today_Todo/`
- **進度報告**: `docs/progress-check/`
- **審核記錄**: `docs/audit/`
- **錯誤記錄**: `docs/issue-library/`
- **RPC函數**: `docs/rpc-functions/`
- **SQL查詢**: `docs/SQL-Library/`

### 角色扮演文檔
完整角色清單請參考 `docs/general_rules.md` 的身分定位系統部分。

---

*最後更新：2025年1月*
*版本：3.0 (整合版)*