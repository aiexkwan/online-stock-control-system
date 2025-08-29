# 開發工具 (Dev Tools)

_最後更新日期: 2025-08-29 02:33:37_

## 核心工具

- **包管理器**: npm
- **代碼檢查與格式化**: ESLint 8.57.1, Prettier 3.4.2
- **GraphQL**: @graphql-codegen/cli 5.0.7
- **依賴分析**: Madge 8.0.0
- **開發工具**: Cross-env 7.0.3, Nodemon 3.1.10, TSX 4.20.3
- **測試框架**: Jest 29.7.0, Vitest 3.2.4, Playwright 1.54.1
- **性能監控**: @lhci/cli 0.15.1 (Lighthouse CI)

### 代碼質量保障流程

我們結合 `ESLint` 和 `Prettier` 來自動化保證代碼的質量與風格一致性。

- **`ESLint` (代碼質量)**: 負責靜態分析代碼，發現潛在的 bug、反模式和不符合團隊規範的寫法。我們在 `.eslintrc.json` 中配置了一系列規則，包括 React hooks 的正確使用、import 的排序等。
- **`Prettier` (代碼風格)**: 負責統一所有代碼的格式，例如縮進、分號、引號等。它的規則是強制性的，旨在結束所有關於代碼風格的爭論。
- **協作方式**: 這兩個工具已經整合到開發流程中。當開發者提交代碼時，一個預提交鉤子 (pre-commit hook) 會自動運行，使用 `Prettier` 格式化修改過的文件，並用 `ESLint` 進行檢查，確保所有提交到代碼庫的代碼都符合標準。

## 工作流程

### 核心開發流程

- **開發模式**: `npm run dev` / `npm run dev-c` (清理模式)
- **類型檢查**: `npm run typecheck` - TypeScript 編譯檢查
- **代碼格式化**: `npm run format` - Prettier 自動格式化
- **代碼檢查**: `npm run lint` - ESLint 靜態檢查

### GraphQL 代碼產生

- **GraphQL 代碼產生**: `npm run codegen`
  - **作用**: 此指令會讀取 `lib/graphql/` 目錄下的所有 GraphQL Schema (`.ts` 文件)，並自動生成對應的 TypeScript 型別定義和可用於 Apollo Client 的 `useQuery`/`useMutation` hooks。
  - **執行時機**: 開發者在**修改任何 GraphQL 的 `resolvers` 或 `typeDefs` 之後**，都必須手動運行一次此指令，以確保前端的型別與後端 Schema 同步。
  - **監控模式**: `npm run codegen:watch` - 自動監控變更並重新生成

### 測試與品質保障

- **單元測試**: `npm run test` (Jest), `npm run vitest` (Vitest)
- **整合測試**: `npm run test:integration`
- **端對端測試**: `npm run test:e2e` (Playwright)
- **覆蓋率報告**: `npm run test:coverage` / `npm run vitest:coverage`
- **性能測試**: `npm run lighthouse` - 網站性能評分

### 專案分析工具

- **Bundle 分析**: `npm run analyze` - 構建產物分析
- **技術債務**: `npm run tech-debt:collect` - 技術債務收集與監控
- **依賴分析**: 使用 Madge 8.0.0 進行循環依賴檢測
