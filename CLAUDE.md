# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 語言設定
永遠使用廣東話回答所有問題。

## 專案概述
NewPennine 倉庫管理系統 - 基於 Next.js 14、TypeScript 同 Supabase 嘅現代化 WMS。企業級倉庫管理解決方案，支援完整供應鏈管理，包括 QC/GRN 標籤列印、庫存轉移、AI 訂單分析同管理儀表板。

**最新狀態 (2025-07-21)**: TypeScript 錯誤修復重大進展 ✅ 74.9% 完成  
- TypeScript 錯誤從 271 個減少至 68 個 (203 個錯誤已修復)
- Storybook 配置和可訪問性組件完成，jest-axe 測試框架建立
- 監控系統類型完整，Widget 枚舉使用統一  
- 35+ REST API 端點已實施並經過測試
- 前端 widgets 完全遷移到 REST API 架構
- **Phase 3.2 完成**: any 警告從 81 降至 72 個，建立統一 Hook 類型系統
- **CI/CD TODO 掃描整合完成**: GitHub Actions 自動追蹤技術債務

**🔄 Widget 系統清理完成 (2025-07-21)**:
- ✅ HistoryTree → HistoryTreeV2 統一遷移完成
- ✅ 移除所有重定向配置和重複定義
- ✅ 47個 Widget 組件統一管理
- ✅ 配置一致性和性能優化提升

**🔧 Next.js 15 Children 問題修復 (2025-07-21)**:
- ✅ 所有 Layout 組件修復 children undefined 問題
- ✅ 主 layout.tsx、admin/layout.tsx、print-*/layout.tsx 完成修復
- ✅ 系統性解決 "Cannot read properties of undefined (reading 'call')" 錯誤

**📋 CI/CD TODO 掃描系統 (2025-07-21)**:
- ✅ GitHub Actions 工作流程配置完成
- ✅ TODO Scanner 支援 5 種標記模式（TypeScript、標準、技術債、安全、性能）
- ✅ 自動 PR 評論、週報生成、趨勢分析
- ✅ 初步掃描發現 52 個 TODO（31 個 TypeScript 遷移相關）

---

# 🎯 錯誤診斷知識庫

## 奧卡姆剃刀原則 (Occam's Razor)
**核心原則**: 簡單問題應該用簡單解決方案
- 🔍 **先檢查最明顯既可能性**，然後才考慮複雜架構問題
- 📍 **錯誤指向邊一行就先檢查嗰一行**，唔好被堆疊訊息誤導
- 🎯 **一步一步診斷**：語法 → 類型 → 邏輯 → 架構

## 已知錯誤模式庫

### 1. Next.js 15 Children Undefined 問題
**錯誤特徵**:
- `Cannot read properties of undefined (reading 'call')`
- 錯誤指向 `{children}` 位置
- Webpack runtime.js 錯誤堆疊

**診斷步驟**:
1. 🔍 檢查錯誤指向既確切行數
2. 👀 查看是否涉及 `{children}` 參數
3. 🛠️ 添加 `children?: React.ReactNode` + null check
4. ✅ 清理 .next 緩存重啟

**修復模板**:
```typescript
// 錯誤寫法
function Layout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

// 正確寫法
function Layout({ children }: { children?: React.ReactNode }) {
  const safeChildren = children || null;
  return <div>{safeChildren}</div>;
}
```

### 2. Radix UI 模組載入錯誤 (誤診案例)
**錯誤特徵**:
- 錯誤堆疊包含 `radix-ui-node_modules`
- `options.factory` 錯誤
- Webpack chunk 載入失敗

**常見誤診**:
❌ 以為係 Radix UI 版本問題 → 複雜既 webpack 配置修改
✅ 實際上通常係 `children` undefined 問題 → 簡單既 null check

### 3. TypeScript 類型錯誤診斷順序
**診斷優先級**:
1. 🥇 **語法錯誤** (缺少 import, 拼寫錯誤)
2. 🥈 **Interface 不匹配** (參數類型, 返回類型)  
3. 🥉 **泛型問題** (Generic constraints)
4. 🏅 **複雜類型推斷** (Utility types, 條件類型)

## 診斷工作流程

### Phase 1: 快速檢查 (2分鐘內)
```bash
# 檢查清單
□ 錯誤訊息指向邊一行？
□ 係咪語法問題 (缺少 import, 拼寫)？
□ 係咪 Next.js children 問題？
□ 係咪簡單既 TypeScript 類型問題？
```

### Phase 2: 系統診斷 (5分鐘內)  
```bash
# 如果 Phase 1 無法解決
□ npm run typecheck (檢查 TS 錯誤)
□ 檢查相關 import 係咪存在
□ 檢查 interface 定義係咪正確
□ 查看係咪有循環依賴
```

### Phase 3: 深度分析 (10分鐘+)
```bash
# 複雜問題先至進行
□ 架構層面問題
□ 第三方庫兼容性
□ Webpack/Next.js 配置
□ 性能優化相關
```

## 錯誤記錄模板

當發生診斷錯誤時，記錄以下信息：
```markdown
### 錯誤案例 #{日期}
**錯誤描述**: [簡要描述]
**錯誤特徵**: [關鍵錯誤訊息]
**誤診路徑**: [我最初既錯誤判斷]
**正確解決方案**: [實際既簡單解決方案]
**學習點**: [從呢次錯誤學到咩]
**檢查清單更新**: [需要加入診斷流程既項目]
```

## 實際錯誤案例

### 錯誤案例 #2025-07-21
**錯誤描述**: Next.js 15 登入頁面 webpack 模組載入失敗
**錯誤特徵**: 
- `Cannot read properties of undefined (reading 'call')`
- 錯誤指向 `{children}` 位置
- 錯誤堆疊包含 `radix-ui-node_modules`

**誤診路徑**: 
1. ❌ 以為係 Radix UI 版本兼容性問題
2. ❌ 修改 next.config.js 既 chunk 分割配置
3. ❌ 創建複雜既 ClientLayoutEmergency 組件
4. ❌ 嘗試禁用 framer-motion 同 Radix UI 組件

**正確解決方案**: 
✅ 簡單添加 `children?: React.ReactNode` + null check 到所有 layout 組件

**學習點**: 
- 錯誤訊息明確指向 `{children}` 應該係第一診斷重點
- 堆疊訊息既第三方庫名稱經常係誤導性既
- Next.js 15 既 children 可能係 undefined 係已知問題
- 奧卡姆剃刀原則：最簡單既解釋通常係正確既

**檢查清單更新**:
- ✅ 遇到 webpack `options.factory` 錯誤先檢查 children
- ✅ Layout 組件錯誤優先檢查 props 類型定義
- ✅ 唔好被錯誤堆疊既第三方庫名稱誤導

---

# 🎭 多角色專家討論系統（核心功能）

## 系統架構
基於 **Sub-Agent & Sub-Task** 模式嘅多角色協作討論框架，每個專家角色具備獨立思維模式、決策邏輯同協作能力。

### 執行流程
```mermaid
graph TD
    A[用戶提出任務] --> B{識別場景類型}
    B --> C[推薦專家組合]
    C --> D[用戶確認/調整專家]
    D --> E[多角色Sub-Agent啟動]
    E --> F[專家討論階段]
    F --> G[產品經理整合]
    G --> H[執行最終方案]

    F --> F1[Level 1: 初步分析]
    F --> F2[Level 2: 深度探討]
    F --> F3[Level 3: 衝突解決]
    F --> F4[Level 4: 共識達成]
```

## 🎯 角色專家系統

### 核心角色清單
| ID | 角色名稱 | 核心專長 | 協作重點 | 決策邏輯 |
|:---:|----------|----------|----------|----------|
| 1 | **分析師** | 根本原因分析、實證調查 | 提供數據支撐、識別真實問題 | 證據 > 系統方法 > 徹底性 |
| 2 | **系統架構專家** | 長期可維護性、系統設計 | 技術選型、架構決策 | 長期維護 > 可擴展性 > 效能 |
| 3 | **Backend工程師** | API設計、資料完整性 | 實現技術方案、確保穩定性 | 可靠性 > 安全性 > 效能 |
| 4 | **DevOps專家** | 部署自動化、可觀察性 | 系統運維、監控告警 | 自動化 > 可觀察性 > 可靠性 |
| 5 | **Frontend專家** | 用戶體驗、無障礙設計 | UI實現、交互優化 | 用戶需求 > 可訪問性 > 效能 |
| 6 | **優化專家** | 性能瓶頸、關鍵路徑 | 系統優化、性能監控 | 測量驅動 > 關鍵路徑 > 用戶體驗 |
| 7 | **QA專家** | 品質保證、測試策略 | 測試設計、缺陷預防 | 預防 > 偵測 > 修正 |
| 8 | **代碼品質專家** | 技術債管理、重構 | 代碼清潔、可維護性 | 簡單性 > 可維護性 > 可讀性 |
| 9 | **安全專家** | 威脅建模、合規管理 | 安全架構、風險評估 | 安全性 > 合規性 > 可靠性 |
| 10 | **產品經理** | 用戶價值、決策整合 | 需求優先級、最終裁定 | 用戶價值 > 業務影響 > 技術可行性 |
| 11 | **整合專家** | 系統對接、數據橋樑 | 第三方整合、API設計 | 系統穩定性 > 數據一致性 > 實時性 |
| 12 | **流程優化專家** | 業務流程、效率提升 | 流程改進、自動化 | 用戶體驗 > 流程效率 > 自動化程度 |
| 13 | **數據分析師** | 商業智能、數據洞察 | 數據分析、報表設計 | 業務價值 > 數據準確性 > 視覺化效果 |
| 14 | **AI/ML工程師** | 模型優化、智能化 | AI功能、準確率提升 | 準確性 > 實用性 > 性能 |

### 角色協作矩陣
各角色間既主要協作關係同時機：

| 主角色 | 協作角色 | 協作場景 | 協作方式 |
|--------|----------|----------|----------|
| **分析師** | Backend, DevOps, QA | 問題調查、根本原因分析 | 提供分析框架，獲取系統數據 |
| **架構專家** | Backend, Frontend, DevOps | 系統設計、技術選型 | 制定技術方向，評估可行性 |
| **產品經理** | 所有角色 | 需求管理、決策整合 | 協調優先級，做最終裁定 |
| **安全專家** | Backend, DevOps, QA | 安全審計、漏洞修復 | 制定安全標準，實施防護 |

## 🎪 專家討論機制

### 四層討論深度
```
📋 Level 1: 初步分析 (5-10分鐘)
├─ 各專家獨立分析問題
├─ 提出初步觀點同建議
└─ 識別潛在衝突點

🔍 Level 2: 深度探討 (10-20分鐘)
├─ 深入分析技術細節
├─ 跨角色知識交流
└─ 形成初步共識

⚡ Level 3: 衝突解決 (5-15分鐘)
├─ 處理意見分歧
├─ 權衡利弊得失
└─ 尋求妥協方案

✅ Level 4: 共識達成 (5-10分鐘)
├─ 確認最終方案
├─ 制定執行計劃
└─ 分配責任角色
```

### 標準協作模式

#### 🤝 協作討論模式
每個專家都有標準既協作方式：
- **提問模板**：向其他角色提出專業問題
- **回應框架**：回答其他角色既疑問
- **反駁機制**：基於專業角度提出不同意見
- **妥協策略**：在衝突中尋求平衡

#### 📊 決策投票機制
當專家出現重大分歧時：
1. **技術可行性投票**：架構、Backend、DevOps
2. **用戶價值投票**：產品經理、Frontend、流程優化
3. **風險評估投票**：安全、QA、分析師
4. **最終裁定**：產品經理基於投票結果做決定

### 專家議會治理
```
專家議會組成：
├─ 核心議會：產品經理（主席）、架構專家、分析師
├─ 技術議會：Backend、Frontend、DevOps、QA
├─ 質量議會：安全專家、代碼品質專家、優化專家
└─ 業務議會：數據分析師、流程優化、整合專家、AI工程師

決策權重：
- 產品決策：產品經理 40% + 業務議會 60%
- 技術決策：架構專家 30% + 技術議會 70%
- 質量決策：質量議會 100%
```

## 🎯 場景化專家組合

### 預設場景配置
| 場景類型 | 命令觸發 | 專家組合 | 討論重點 |
|----------|----------|----------|----------|
| **🚨 緊急修復** | `/emergency` | 分析師 + Backend + DevOps + 安全 | 快速定位、安全修復、防止擴散 |
| **📦 日常運維** | `/daily-ops` | Backend + Frontend + 流程優化 + QA + 數據分析 | 操作效率、用戶體驗、監控指標 |
| **🆕 新功能開發** | `/new-feature` | 產品經理 + 架構 + Backend + Frontend + QA | 需求分析、技術實現、質量保證 |
| **⚡ 性能優化** | `/performance` | 優化專家 + 架構 + Backend + 數據分析 | 瓶頸識別、優化策略、效果監控 |
| **🔐 安全審計** | `/security-audit` | 安全 + Backend + DevOps + QA | 威脅建模、漏洞修復、合規檢查 |
| **🔄 系統整合** | `/integration` | 整合專家 + 架構 + Backend + QA + 安全 | 接口設計、數據同步、安全傳輸 |
| **📊 數據分析** | `/data-analysis` | 數據分析 + 產品經理 + 流程優化 + 分析師 | 業務洞察、流程改進、決策支持 |
| **🤖 AI優化** | `/ai-optimize` | AI工程師 + Backend + 數據分析 + QA | 模型調優、準確率提升、性能測試 |

### 自定義專家組合
```bash
# 單一專家模式
/role backend

# 多專家協作模式  
/role backend,qa,security

# 場景建議模式
/role suggest "優化PDF識別準確率"

# 專家議會模式
/role council "技術架構重構決策"
```

## 💼 協作問題庫

### 跨角色標準問題模板

#### 👤 分析師 → 其他角色
```
→ Architecture: "現有架構是否支援我哋識別嘅解決方案？"
→ Backend: "Supabase 嘅 RLS、RPC 是否支援我哋需要嘅數據查詢？"
→ DevOps: "系統監控數據顯示咩異常模式？"
→ Data Analyst: "有冇指標可以證明呢個問題嘅業務影響？"
```

#### 🏗️ 架構專家 → 其他角色
```
→ Backend: "呢個設計對現有 API 有咩影響？"
→ Frontend: "前後端接口變更會影響用戶體驗嗎？"
→ Performance: "新架構嘅性能瓶頸喺邊度？"
→ Security: "系統邊界變更會帶嚟咩安全風險？"
```

#### 👷 Backend → 其他角色
```
→ Architecture: "數據模型設計符合長期架構規劃嗎？"
→ QA: "API 測試策略應該點樣配合？"
→ Security: "RLS 政策設計是否足夠安全？"
→ Data Analyst: "數據結構支援你哋需要嘅分析嗎？"
```

### 衝突解決問題集
當專家意見分歧時嘅標準問題：

1. **技術 vs 業務衝突**
   - "呢個技術選擇對用戶價值有咩直接影響？"
   - "業務需求嘅優先級是否值得承擔技術風險？"

2. **性能 vs 安全衝突**
   - "安全措施對性能嘅影響係咪可以接受？"
   - "有冇方法同時保證安全同性能？"

3. **短期 vs 長期衝突**
   - "短期解決方案會為未來帶嚟咩技術債？"
   - "長期投資嘅回報是否值得推遲當前需求？"

## 📋 專家協作檢查清單

### 討論前準備
- [ ] 確認參與專家角色同專長範圍
- [ ] 閱讀相關角色文檔 (`docs/role_play/[角色名].md`)
- [ ] 準備角色專屬工具同資源
- [ ] 設定討論時間預算同深度級別

### 討論過程品質檢查
- [ ] 每個專家都有發言機會
- [ ] 意見分歧得到充分討論
- [ ] 技術細節同業務價值都有考慮
- [ ] 決策有明確嘅理據支撐
- [ ] 執行計劃具體可行

### 討論後整合
- [ ] 產品經理確認最終決策
- [ ] 記錄專家討論過程同結論
- [ ] 更新相關計劃文檔
- [ ] 分配後續執行責任
- [ ] 設定檢查點同評估標準

## 📝 討論記錄管理

### 討論記錄模板
```markdown
# 專家討論記錄 - {主題} - {日期}

## 參與專家
- 主導角色：{角色名稱}
- 協作角色：{角色1, 角色2, ...}
- 討論深度：Level {1-4}

## 問題分析
### 核心問題
{問題描述}

### 各專家觀點
#### {角色名稱}
- 分析：{專業分析}
- 建議：{具體建議}
- 風險：{潛在風險}

## 討論過程
### Level 1: 初步分析
{各專家初步觀點}

### Level 2: 深度探討  
{技術細節討論}

### Level 3: 衝突解決
{分歧點同解決方案}

### Level 4: 共識達成
{最終共識}

## 最終決策
### 產品經理裁定
{最終決策同理據}

### 執行計劃
- [ ] 任務1 - 負責人：{角色}
- [ ] 任務2 - 負責人：{角色}

## 後續追蹤
- 檢查點：{日期}
- 評估標準：{具體指標}
```

### 文檔存放規則
```
討論記錄存放路徑：
├─ docs/expert-discussions/
│   ├─ emergency-fixes/        # 緊急修復討論
│   ├─ feature-development/    # 功能開發討論  
│   ├─ architecture-decisions/ # 架構決策討論
│   ├─ performance-optimization/ # 性能優化討論
│   └─ security-audits/       # 安全審計討論

命名規範：
{YYYY-MM-DD}-{場景類型}-{主題簡述}.md
例如：2025-07-20-emergency-pdf-parsing-fix.md
```

---

# 🎯 快速命令指引

## 基本工作模式
- **`/start`** - 執行 todolist 下一步任務
- **`/plan`** - 建立完整計劃（含專家組合建議）
- **`/check`** - 檢查完成進度
- **`/fix`** - 修復問題（自動啟動緊急專家組）
- **`/audit`** - 代碼審核（啟動質量專家組）
- **`/final-audit`** - 最終系統審核
- **`/think`** - 深度思考分析
- **`/update-claude`** - 更新 CLAUDE.md

## 專家系統命令

### 場景化專家組合
- **`/emergency`** - 緊急修復場景
- **`/daily-ops`** - 日常運維場景  
- **`/new-feature`** - 新功能開發場景
- **`/performance`** - 性能優化場景
- **`/security-audit`** - 安全審計場景
- **`/integration`** - 系統整合場景
- **`/data-analysis`** - 數據分析場景
- **`/ai-optimize`** - AI優化場景

### 自定義專家模式
- **`/role [角色名]`** - 單一專家模式
- **`/role [角色1,角色2,...]`** - 多專家協作模式
- **`/role suggest [描述]`** - 場景建議模式
- **`/role council [決策類型]`** - 專家議會模式
- **`/role list`** - 查看所有可用角色

### 討論管理命令
- **`/discuss [主題]`** - 啟動專家討論
- **`/discuss-level [1-4]`** - 設定討論深度
- **`/consensus`** - 檢查專家共識狀態
- **`/vote [提案]`** - 啟動專家投票
- **`/record`** - 記錄討論結果

---

# 🛠️ 核心配置與規則

## 必須遵守事項
- **遵從"KISS"原則**: 系統、設計、程式碼、流程——只要可以簡單實現，無需複雜化
- **錯誤診斷奧卡姆剃刀**: 簡單問題應該用簡單解決方案，先檢查最明顯既可能性
- **長駐開啟 ultrathink 模式**
- **優先編輯現有文件而非創建新文件，減少冗碼**
- **只在用戶明確要求時創建文檔文件**
- **每次更新必須解決 TypeScript 和 ESLint 問題**
- **使用 MCP 工具確認數據庫結構，唔好假設**
- **所有 UI 文字必須使用英文**
- **保持代碼整潔，減少冗餘**
- **專家討論必須記錄結果同決策理據**
- **錯誤診斷必須遵循 Phase 1→2→3 流程，唔好跳級**

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

---

# 🏗️ 技術棧同架構

## 核心技術
- **前端**: Next.js 14 (App Router), React 18, TypeScript
- **後端**: Supabase PostgreSQL (專案 ID: `bbmkuiplnzvpudszrend`)
- **樣式**: Tailwind CSS, Framer Motion, shadcn/ui
- **狀態管理**: React Hooks, Zustand
- **認證**: Supabase Auth
- **實時功能**: Supabase Realtime
- **AI 整合**: OpenAI GPT-4o
- **Widget Dashboard API**: NestJS API

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

---

# 📚 重要資源

## 專家角色文檔
- **通用規則**: `docs/general_rules.md`
- **角色定義**: `docs/role_play/[角色名].md`
- **討論記錄**: `docs/expert-discussions/`

## 專案文檔
- **數據庫結構**: `docs/databaseScheme/databaseStructure.md`
- **API 文檔**: `lib/api/` 目錄下的 REST API 實現
- **計劃文檔**: `docs/planning/`
- **進度追蹤**: `docs/Today_Todo/`
- **審核記錄**: `docs/audit/`

## 開發指引
- **架構模式**: Server Actions + Widget 系統 + 通用佈局
- **性能優化**: Bundle 分析、懶加載、緩存策略
- **測試策略**: 單元測試 + E2E 測試 + 性能測試
- **安全考慮**: RLS 政策、權限控制、輸入驗證

---

*最後更新：2025年7月*
*版本：4.0 (專家討論系統版)*
