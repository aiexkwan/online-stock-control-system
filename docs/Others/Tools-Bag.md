# 系統可使用工具列表

## 必須使用
- Graphiti-Memory MCP
    - 系統主要及唯一記憶管理
    - 圖像記憶管理系統
    - 儲存同提取歷史對話
    - 使用說明：`.claude/memory/memory-system.md`

- Sequential-thinking MCP
    - 順序思考工具
    - 推理工具

## 可選使用
- Supabase MCP
    - 數據庫查詢工具
    - 讀取及修改數據庫內資料

- Playwright MCP
    - E2E Test
    - 瀏覽器自動化工具
    - 支援多種瀏覽器
    - 跨瀏覽器測試

- Context7 MCP
    - 上下文管理工具
    - 幫助維持對話嘅連貫性
    - 管理長對話嘅上下文信息


## 其他
－ `codegen`

- `zod`
    - `https://zod.dev`
    - 運行時型別驗證、與 TS 型別自動推導互通
    - 支援 form validation / API）

- `yup`
    - `https://github.com/jquense/yup`
    - Schema 驗證工具，常見於 React Hook Form
    - 型別推導能力較弱

- `io-ts`
    -`https://github.com/gcanti/io-ts`
    - Functional 風格型別驗證 + runtime 檢查
    - 可配合 `fp-ts` 組合運算

- `typescript-json-schema`
    - `https://github.com/YousefED/typescript-json-schema`
    - 將 TypeScript interface 轉為 JSON Schema
    - 適用於 schema 驗證與 Swagger 文件

- `quicktype.io`
    - `https://quicktype.io/`
    - 從 JSON 自動生成 TypeScript 型別
    - 適合一次性轉換使用

- `graphql-code-generator`
    - `https://www.graphql-code-generator.com/`
    - 自動產生 TS 型別（如 `__generated__` hooks
    - 適用於 GraphQL 查詢與 mutation 型別同步

－ `eslint`

－ `@typescript-eslint`

－ `eslint-plugin-react`

－ `eslint-plugin-import`

－ `eslint-plugin-unused-imports`

－ `prettier`