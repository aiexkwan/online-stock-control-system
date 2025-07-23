# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 語言設定
永遠使用廣東話回答所有問題。

## 專案概述
NewPennine 倉庫管理系統 - 基於 Next.js 14、TypeScript 同 Supabase 嘅現代化 WMS。企業級倉庫管理解決方案，支援完整供應鏈管理，包括 QC/GRN 標籤列印、庫存轉移、AI 訂單分析同管理儀表板。

**最新狀態 (2025-07-23)**: AnalysisCard 完整實施完成 ✅ 94.7% 進度達成  
- **Widget→Card 架構簡化**：47個→16個 (第6個Card完成，進度37.5%)
- **AnalysisCard 技術亮點**：880行代碼，GraphQL+AI整合，16專家協作設計
- **AI 智能分析功能**：5種分析類型，3種響應速度，智能洞察生成
- **16專家協作決策**：從GraphQL遷移到統一架構簡化的理性回歸過程
- **功能重複性發現**：79%重複率成為架構簡化關鍵轉折點，預計代碼減少83%
- **ROI效益提升**：從150%提升至400%，維護複雜度降低90%

**🎯 Cards 實施進度**：
- ✅ StatsCard：整合10個統計類widgets，GraphQL統一查詢
- ✅ ChartCard：整合8個圖表類widgets，多視覺化類型支援  
- ✅ TableCard：整合6個表格類widgets，複雜查詢優化
- ✅ UploadCard：整合4個上傳類widgets，文件處理mutations
- ✅ ReportCard：整合2個報表類widgets，6種報表類型生成
- ✅ AnalysisCard：整合2個分析類widgets，AI分析洞察功能

**📊 技術債務狀況**：
- TypeScript 錯誤：從271個減少至0個 (100%修復完成)
- Widget 重複性：79%重複功能已通過Card整合消除
- CI/CD TODO 掃描：52個技術債務項目持續追蹤
- 代碼覆蓋率：100% TypeScript 覆蓋，完全類型安全

# 📚 優先建議閱讀
**角色定位功能**: `docs/role_play/README.md`

## 文檔庫系統及相關規則
**導航**: `docs\README.md`

# 🏗️ 技術棧同架構

## 核心技術
- **專家議會**: `docs\role_play\README.md`
- **前端**: Next.js 14 (App Router), React 18, TypeScript
- **後端**: Supabase PostgreSQL (專案 ID: `bbmkuiplnzvpudszrend`)
- **樣式**: Tailwind CSS, Framer Motion, shadcn/ui
- **狀態管理**: React Hooks, Zustand
- **認證**: Supabase Auth
- **實時功能**: Supabase Realtime
- **AI 整合**: OpenAI GPT-4o
- **頁面 API**: GraphQL + NestJS API

## 開發指引
- **架構模式**: Server Actions + Widget 系統 + 通用佈局
- **性能優化**: Bundle 分析、懶加載、緩存策略
- **測試策略**: 單元測試 + E2E 測試 + 性能測試
- **安全考慮**: RLS 政策、權限控制、輸入驗證

## 🛠️ 可用工具清單

| 類別 | 工具名稱 | 用途 |
|------|----------|------|
| **思維模式** | Sequential-thinking MCP | 邏輯推理 |
| **搜尋** | Brave Search MCP | 資料搜尋 |
| **自動化** | Puppeteer MCP | 無頭瀏覽器操作 |
| **資料庫** | Supabase MCP | 資料庫查詢 |
| **前端測試** | Playwright | E2E測試 |
| **單元測試** | Vitest | 快速測試 |
| **元件開發** | Storybook | 元件開發與測試 |

## 💻 系統資訊

| 項目 | 規格 |
|------|------|
| **現時用戶** | 30-40人 |
| **同時在線** | 4-5人 |
| **支援平台** | 移動裝置 + 電腦端 |
| **運作時間** | 24/7 |

---
## ⚠️ 核心規則（必須嚴格遵守）

# 🛠️ 核心配置與規則

## 必須遵守事項

### 奧卡姆剃刀原則 (Occam's Razor)
**核心原則**: 簡單問題應該用簡單解決方案
- 🔍 **先檢查最明顯既可能性**，然後才考慮複雜架構問題
- 📍 **錯誤指向邊一行就先檢查嗰一行**，唔好被堆疊訊息誤導
- 🎯 **一步一步診斷**：語法 → 類型 → 邏輯 → 架構
- **KISS** - Keep It Simple, Stupid
- **YAGNI** - You Aren't Gonna Need It
- **Open/Closed Principle**
- **SOLID Principles**
- **DRY** - 減少冗碼

### 🚫 禁止行為
- ❌ **禁止假設**：缺少資料必須提問
- ❌ **禁止自作主張**：有疑問必須確認
- ❌ **禁止跳過測試**：更新後必須測試
- ❌ **禁止自行建立文檔**：如用戶沒有要求，嚴禁建立文檔
- ❌ **禁止繞過問題**：如使用"Unknown"繞過Eslint
- ❌ **禁止單方面決策**：重要決策必須經過專家討論

### 核心原則
- **優先使用 React Query，取代 useEffect + useState 組合**
- **長駐開啟 ultrathink 模式**
- **優先編輯現有文件而非創建新文件，減少冗碼**
- **只在用戶明確要求時創建文檔文件**
- **每次更新必須解決 TypeScript 和 ESLint 問題**
- **使用 MCP 工具確認數據庫結構，唔好假設**
- **所有 UI 文字必須使用英文**
- **保持代碼整潔，減少冗餘**
- **專家討論必須記錄結果同決策理據**

### 使用模式
- **深層思考**：Ultrathink
- **任務執行**：Sub-Task, Sub-Agent
- **專家協作**：多角色討論和決策

## 工具使用
所有命令都可使用：
- **Ultrathink** - 深層思考
- **Sequential-thinking** - 邏輯推理
- **Task** - 同步平行執行任務（專家並行討論）
- **Puppeteer MCP** - 自動化測試
- **Supabase MCP** - 資料庫查詢
- **Brave Search MCP** - 搜尋資料

## 測試憑證
```yaml
登入憑證:
  email: ${env.local.SYS_LOGIN} 或 ${env.local.PUPPETEER_LOGIN}
  password: ${env.local.SYS_PASSWORD} 或 ${env.local.PUPPETEER_PASSWORD}
```

## 🔧 工作執行方式

### 執行流程（加強版）
1. **分析階段**：根據用戶指示判斷需要的文檔
2. **專家召集**：根據任務類型召集相關專家
3. **協作討論**：專家間進行深度討論和決策
4. **規劃階段**：建立詳細todolist
5. **驗證階段**：基於證據的推理（測試/指標/文件）

---



## 開發命令

### 基本開發
```bash
npm run dev          # 啟動開發服務器 
npm run dev-c        # 啟動開發服務器 (會自動清理同殺死 localhost)
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


*最後更新：2025年7月*
*版本：4.0 (專家討論系統版)*
