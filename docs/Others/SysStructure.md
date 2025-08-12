# 線上庫存控制系統 - 系統結構

## 概覽
這是一個使用 Next.js、TypeScript、Supabase 和 GraphQL 構建的綜合倉庫管理系統（WMS）。

## 根目錄結構

```
online-stock-control-system/
├── app/                                # Next.js 13+ App Router
│   ├── (app)/                          # 已認證的應用路由
│   │   ├── admin/                      # 管理員儀表板和管理功能
│   │   ├── change-password/            # 密碼管理
│   │   ├── order-loading/              # 訂單處理和載入
│   │   ├── print-grnlabel/             # GRN 標籤打印
│   │   ├── print-label/                # 通用標籤打印
│   │   ├── productUpdate/              # 產品信息更新
│   │   ├── stock-transfer/             # 庫存移動管理
│   │   └── void-pallet/                # 托盤作廢操作
│   ├── (auth)/                         # 認證路由
│   ├── actions/                        # 服務器操作 (Next.js)
│   ├── api/                            # API 路由和端點
│   ├── components/                     # 共享 React 組件
│   ├── hooks/                          # 自定義 React hooks
│   ├── services/                       # 業務邏輯服務
│   └── utils/                          # 實用工具函數
│
├── backend/                            # 後端服務
│   └── newpennine-api/                 # NestJS API 服務器
│       ├── src/                        # 源代碼
│       └── test/                       # 後端測試
│
├── components/                         # 全局 UI 組件
│   ├── ui/                             # 核心 UI 組件（基於 Radix UI）
│   ├── label/                          # 標籤模板
│   ├── print-label-pdf/                # PDF 生成組件
│   └── qc-label-form/                  # 質量控制表單
│
├── config/                             # 配置文件
│   ├── navigation.ts                   # 導航配置
│   ├── page-theme.ts                   # 主題設置
│   └── tech-debt-thresholds.json      # 技術債監控
│
├── docs/                               # 文檔
│   ├── analysis/                       # 系統分析文檔
│   ├── audit/                          # 審計報告
│   ├── databaseScheme/                 # 數據庫架構文檔
│   ├── expert-discussions/             # 技術討論
│   ├── integration/                    # 集成指南
│   ├── planning/                       # 項目規劃文檔
│   ├── RPC-Library/                    # RPC 函數文檔
│   └── SQL-Library/                    # SQL 查詢庫
│
├── e2e/                                # 端到端測試（Playwright）
│   ├── admin/                          # 管理面板測試
│   ├── auth/                           # 認證測試
│   ├── dashboard/                      # 儀表板測試
│   └── inventory/                      # 庫存測試
│
├── lib/                                # 核心庫和實用工具
│   ├── graphql/                        # GraphQL 客戶端和服務器設置
│   ├── cards/                          # 卡片組件系統
│   ├── alerts/                         # 警報系統
│   ├── analytics/                      # 分析工具
│   ├── cache/                          # 緩存層
│   ├── monitoring/                     # 性能監控
│   ├── performance/                    # 性能工具
│   └── types/                          # TypeScript 類型定義
│
├── supabase/                           # Supabase 配置
│   ├── migrations/                     # 數據庫遷移
│   └── functions/                      # Edge 函數
│
├── scripts/                            # 構建和實用腳本
│   ├── migrations/                     # 遷移腳本
│   └── puppeteer-test/                 # Puppeteer 測試腳本
│
├── types/                              # 全局 TypeScript 類型
│   ├── index.ts                        # 主要類型導出
│   └── env.d.ts                        # 環境類型
│
├── __tests__/                          # 單元和集成測試
│   ├── dataloaders/                    # DataLoader 測試
│   ├── mocks/                          # 測試模擬
│   └── utils/                          # 測試工具
│
└── 配置文件
    ├── next.config.js                  # Next.js 配置
    ├── tsconfig.json                   # TypeScript 配置
    ├── tailwind.config.js              # Tailwind CSS 配置
    ├── playwright.config.ts            # Playwright 測試配置
    ├── jest.config.js                  # Jest 測試配置
    ├── codegen.yml                     # GraphQL 代碼生成
    └── .mcp.json                       # MCP 服務器配置
```

## 關鍵架構組件

### 前端架構
- **框架**：Next.js 13+ 配合 App Router
- **樣式**：Tailwind CSS
- **UI 組件**：Radix UI 原語
- **狀態管理**：React Context + Apollo Client
- **類型安全**：TypeScript 嚴格模式

### 後端架構
- **數據庫**：Supabase (PostgreSQL)
- **API**：REST 和 GraphQL 混合方式
- **後端服務**：NestJS（獨立服務）
- **認證**：Supabase Auth
- **實時功能**：Supabase Realtime 訂閱

### 核心功能
1. **管理員儀表板** - 綜合管理界面
2. **訂單管理** - 訂單載入、處理和跟蹤
3. **庫存控制** - 庫存水平、轉移和跟蹤
4. **標籤打印** - GRN 標籤、QC 標籤、產品標籤
5. **報告系統** - 各種業務報告和分析
6. **用戶管理** - 認證和授權
7. **實時更新** - 實時數據同步

### 開發工具
- **測試**：Jest、Playwright、Vitest
- **代碼生成**：GraphQL Codegen
- **性能**：Lighthouse、Web Vitals 監控
- **文檔**：基於 Markdown 的文檔
- **MCP 服務器**：Supabase、Sequential Thinking、Context7、IDE 集成

### 遷移狀態
系統目前正在進行重大架構遷移：
- Widget 系統 → 基於卡片的架構
- REST API → GraphQL 優先方式
- 遺留組件 → 現代 React 模式
- 性能優化和 TypeScript 改進