# 開發工具 (Dev Tools)

_最後更新日期: 2025-08-27 10:42:20_

## 核心工具

- **包管理器**: npm
- **代碼檢查與格式化**: ESLint 8.57.1, Prettier 3.4.2
- **GraphQL**: @graphql-codegen/cli 5.0.7
- **依賴分析**: Madge 8.0.0
- **引入工具**: Cross-env 7.0.3, Nodemon 3.1.10

### 代碼質量保障流程

我們結合 `ESLint` 和 `Prettier` 來自動化保證代碼的質量與風格一致性。

- **`ESLint` (代碼質量)**: 負責靜態分析代碼，發現潛在的 bug、反模式和不符合團隊規範的寫法。我們在 `.eslintrc.json` 中配置了一系列規則，包括 React hooks 的正確使用、import 的排序等。
- **`Prettier` (代碼風格)**: 負責統一所有代碼的格式，例如縮進、分號、引號等。它的規則是強制性的，旨在結束所有關於代碼風格的爭論。
- **協作方式**: 這兩個工具已經整合到開發流程中。當開發者提交代碼時，一個預提交鉤子 (pre-commit hook) 會自動運行，使用 `Prettier` 格式化修改過的文件，並用 `ESLint` 進行檢查，確保所有提交到代碼庫的代碼都符合標準。

## 工作流程

- **GraphQL 代碼產生**: `npm run codegen`
  - **作用**: 此指令會讀取 `lib/graphql/` 目錄下的所有 GraphQL Schema (`.ts` 文件)，並自動生成對應的 TypeScript 型別定義和可用於 Apollo Client 的 `useQuery`/`useMutation` hooks。
  - **執行時機**: 開發者在**修改任何 GraphQL 的 `resolvers` 或 `typeDefs` 之後**，都必須手動運行一次此指令，以確保前端的型別與後端 Schema 同步。
