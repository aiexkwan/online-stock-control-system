### 必須優先閱讀
- `CLAUDE.md`

### 思考模式
- Sequential-thinking

### 專家小組
- ID：1, 3, 7, 8, 15, 16
- ID說明文檔：`docs\role_play\README.md`

### 任務
- 運行 `npm run lint`
- 專注並只解決 EsLint 錯誤

### 處理流程
- 獲取錯誤：運行 `npm run lint` 獲取最新的 EsLint 錯誤
- 尋找記錄：到 `docs\issue-library\EsLint-Issue.md` 查找有否同類似錯誤，以便快速獲取解決方法
- 開始解難：如是首次遇到該問題，則開始使用Sub-Agent及Sub-Task，同步進行troubleshooting
- 策略執行：依據策略（包括但不限於）開始trouble solving
- 證實修復：完成修改後**必需建立一次性的測試文件證實修復工作**
- 更新記錄：確定修補後將是次修復依據 `docs\issue-library\README.md` 更新`docs\issue-library\EsLint-Issue.md`
- 移除測試：**必須需刪除一次性的測試文件**
- 進行下個修復項目

### 策略（包括但不限於）
| 類型 | 策略 | 補充說明 |
|------|------|----------|
| **代碼風格問題** | 根據 `.eslintrc.js` 的風格進行修復，如 `quote`, `indent`, `semi`, `no-extra-semi` 等 | 保持風格一致 |
| **安全性與可讀性** | 解決如 `no-unused-vars`, `no-console`, `no-empty-function`, `prefer-const` | 避免潛在風險或 code smell |
| **型別相關 ESLint 錯誤** | 解決如 `@typescript-eslint/no-explicit-any`, `no-unsafe-assignment`, `ban-ts-comment` | 應優先透過型別定義解決而非 disable |
| **React Hooks 錯誤** | 如 `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps` | 嚴格遵守 hook 規則 |
| **錯誤繞過策略** | 僅可於無法解決之特殊情境下，明確註明 `// eslint-disable-next-line` 並附上理由與 TODO 跟進 | 禁止無附註解繞過 |



### 可以但嚴禁直接使用策略
| 策略                             | 建議情境與風險控制說明                                           |
|----------------------------------|------------------------------------------------------------------|
| `eslint-disable-next-line`       | 僅可用於已完整評估該 rule 對專案無實質風險且無法透過改寫解決之情況，**必須附上理由與 TODO** |
| `@ts-ignore` + ESLint bypass     | 嚴禁雙重抑制，僅可於 migration 過程中使用，並需配合 issue / 備註跟進                        |
| `any`                            | 若屬 ESLint 對 `any` 之警告，應回溯資料源並優先以 `unknown` + type narrowing 處理              |


### 可使用工具（包括但不限於）
| 工具名稱 / 套件                           | 功能說明                                                  | 備註                               |
|-------------------------------------------|-----------------------------------------------------------|------------------------------------|
| [`eslint`](https://eslint.org/)           | 靜態程式碼檢查，檢測語法錯誤與不一致寫法                    | 基礎工具                           |
| [`@typescript-eslint`](https://typescript-eslint.io/) | 增強 TypeScript 支援，提供型別導向規則                     | 重點 plugin，已預設啟用             |
| [`eslint-plugin-react`](https://github.com/jsx-eslint/eslint-plugin-react) | 針對 React 的最佳實踐與 hook 檢查                          | 必需啟用於 frontend 代碼             |
| [`eslint-plugin-import`](https://github.com/import-js/eslint-plugin-import) | 控制 import 順序、重複引用與模組管理                       | 對大型 monorepo 特別有效             |
| [`eslint-plugin-unused-imports`](https://github.com/sweepline/eslint-plugin-unused-imports) | 自動偵測未使用的 import 並提示移除                          | 可搭配格式化工具如 `prettier` 使用  |
| [`biome`](https://biomejs.dev/) 或 `prettier` | 自動格式化工具，可與 ESLint 規則協同操作                     | 格式統一                            |

### 修復測試
- 必需建立一次性的測試文件證實修復工作
- 事後必須需刪除一次性的測試文件

### 相關文檔記錄
- 修復記錄庫：`docs\issue-library`
- 修復記錄文檔規範：`docs\issue-library\README.md`
- 工作記錄庫：`docs\Today_Todo`
- 工作記錄文檔規範：`docs\Today_Todo\README.md`