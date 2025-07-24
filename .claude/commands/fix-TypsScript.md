### 必須優先閱讀
- `CLAUDE.md`

### 思考模式
- Sequential-thinking

### 專家小組
- ID：1, 3, 7, 8
- ID說明文檔：`docs\role_play\README.md`

### 任務`
- 專注並只解決用戶提供的 TypeScript/EsLint 錯誤
- 如沒有提供，則默認修復所有 TypeScript/EsLint 錯誤

### 處理方式
- 使用Sub-Agent及Sub-Task，同步進行troubleshooting

### 建議可能策略
- Zod / Yup 驗證後轉型：保證資料結構正確，避免 runtime bug（不可信來源、表單、JSON.parse）
- DTO / 自定義 type interface：自行定義型別轉換並 assert（自家 API / Restful）
- Supabase / GraphQL codegen：自動從 schema 產生型別（有 schema 支援的 API）
- 其他可能策略

### 可以但嚴禁直接使用策略
- `unknown` + type narrowing：多一層 type guard，提升安全性（半信任 API）
- `any` + 註解 / TODO：快速開發階段用，但要追蹤清理（如無任何辦法處理）

### 建議可能使用工具
- zod：運行時型別檢查
- io-ts：Functional style 型別驗證
- typescript-json-schema：從 interface 轉 schema
- quicktype.io：一鍵從 JSON 生 TypeScript 型別

### 修復測試
- 必需建立一次性的測試文件證實修復工作
- 事後必須需刪除一次性的測試文件

### 相關文檔記錄
- 修復記錄庫：`docs\issue-library`
- 修復記錄文檔規範：`docs\issue-library\README.md`
- 工作記錄庫：`docs\Today_Todo`
- 工作記錄文檔規範：`docs\Today_Todo\README.md`