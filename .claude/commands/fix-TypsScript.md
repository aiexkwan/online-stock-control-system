### 必須優先閱讀
- `CLAUDE.md`

### 思考模式
- Sequential-thinking

### 專家小組
- ID：1, 3, 7, 8, 15, 16
- ID說明文檔：`docs\role_play\README.md`

### 任務
- 運行 `npm run typecheck`
- 專注並只解決 TypeScript 錯誤

### 處理流程
- 獲取錯誤：運行 `npm run typecheck` 獲取最新的 TypeScript 錯誤
- 尋找記錄：到 `docs\issue-library\TypeScript-Issue.md` 查找有否同類似錯誤，以便快速獲取解決方法
- 開始解難：如是首次遇到該問題，則開始使用Sub-Agent及Sub-Task，同步進行troubleshooting
- 策略執行：依據策略（包括但不限於）開始trouble solving
- 證實修復：完成修改後**必需建立一次性的測試文件證實修復工作**
- 更新記錄：確定修補後將是次修復依據 `docs\issue-library\README.md` 更新`docs\issue-library\TypeScript-Issue.md`
- 移除測試：**必須需刪除一次性的測試文件**
- 進行下個修復項目

### 策略（包括但不限於）
- Zod/Yup 驗證後轉型：保證不可信資料（如表單輸入、API 回傳、JSON.parse）經過驗證後轉為 TS 型別，減少 runtime bug
- DTO/自定義 type interface：自家 API 資料結構可自行定義型別並轉換，可配合 `as` 或 constructor 斷言使用
- Supabase / GraphQL codegen：如 API 支援 schema，可用自動生成工具產生 `.ts` 型別，與後端同步更新
- Schema-to-Type or Type-to-Schema：根據開發流向自動轉換，方便表單校驗/API 簽名驗證一致性
- 其他可能策略

### 可以但嚴禁直接使用策略
- `unknown`+type narrowing：可接受半信任來源資料，但需即時使用 type guard 斷言，避免流向不安全操作
- `any`+註解 / TODO：僅可於開發初期或 schema 不可控情況下使用，必須加上 `// TODO: refine type` 標記追蹤
- 使用 `as` 斷言：僅可用於已驗證過之資料結構，不應當作萬用 bypass，需伴隨類型測試或單元測試保護

### 可使用工具（包括但不限於）
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
    - 適用於 GraphQL 查詢與 mutation 型別同步 |
- 其他可能工具

### 修復測試
- 必需建立一次性的測試文件證實修復工作
- 事後必須需刪除一次性的測試文件

### 相關文檔記錄
- 修復記錄庫：`docs\issue-library`
- 修復記錄文檔規範：`docs\issue-library\README.md`
- 工作記錄庫：`docs\Today_Todo`
- 工作記錄文檔規範：`docs\Today_Todo\README.md`