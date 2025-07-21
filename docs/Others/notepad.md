/fix-issue
閱讀 docs/planning/eslint-comprehensive-full-analysis-2025.md
集中並只解決 Eslint 錯誤
修復後運行測試，以保證問題已解決
確定解決後，更新 docs/planning/eslint-comprehensive-full-analysis-2025.md
更新指改寫有關部份，並非在文檔尾加上新描述
角色id : 1,2,3,4,6,7,8

策略（由1開始嘗試，逐級下降，並非直接使用“unknown解決“）
1. Zod / Yup 驗證後轉型：保證資料結構正確，避免 runtime bug（不可信來源、表單、JSON.parse）
2. DTO / 自定義 type interface：自行定義型別轉換並 assert（自家 API / Restful）
3. Supabase / GraphQL codegen：自動從 schema 產生型別（有 schema 支援的 API）
4. unknown + type narrowing：多一層 type guard，提升安全性（半信任 API）
5. any + 註解 / TODO：快速開發階段用，但要追蹤清理（如無任何辦法處理）

工具
1. zod：運行時型別檢查
2. io-ts：Functional style 型別驗證
3. typescript-json-schema：從 interface 轉 schema
4. quicktype.io：一鍵從 JSON 生 TypeScript 型別

現開始集中解決： P0





claude --dangerously-skip-permissions
