### 必須優先閱讀
- `CLAUDE.md`

### 思考模式
- Sequential-thinking
- Ultrathink

### 可使用工具
| **MCP工具列** | 查看 `docs\Others\MCP_List.md` |
| **前端測試** | Playwright | E2E測試 |
| **單元測試** | Vitest | 快速測試 |
| **元件開發** | Storybook | 元件開發與測試 |

### 組成專家小組
- 專家身分ID：15
- 專家身分說明文檔：`docs\role_play\README.md`

### 任務
- 整理文檔庫 `\docs` 內所有記錄文檔
- `docs\Others` 除外

### 處理流程
- **總覽分類**：逐個文檔庫執行
- **了解規範**：檢視文檔庫內的 `README.MD`，了解該文檔庫的規劃及範本格式
- **深入檢視**：檢視該文檔庫現時的所有文檔紀錄
- **執行整理**：按照規劃及範本格式整理該文檔庫內的文檔
- **檢查分類**：整理後查看各文件分布，有否違反該文檔庫用途（如計劃文檔錯誤放在技術文檔庫，技術文檔放在專家討論文檔庫）

### 整理原則

- *Single Source of Truth (唯一真相來源)*
  - **核心原則**: 每個資訊只應該有一個權威版本
  - **避免重複**: 同一個概念唔好喺多個文檔重複解釋
  - **版本控制**: 確保所有人都參考同一個最新版本
  - **更新連動**: 修改一次就全系統生效，避免不一致

- *Information Architecture (資訊架構)*
  - **核心原則**: 按照用戶既心智模型組織內容
  - **分類邏輯**: 用用戶既思維方式而唔係創作者既邏輯分類
  - **導航路徑**: 提供多種方式搵到同一個資訊
  - **層次分明**: 建立清晰既資訊層級關係

- *Progressive Disclosure (漸進式揭露)*
  - **核心原則**: 先展示最重要既資訊，詳細內容分層展示
  - **概要優先**: 每個文檔都要有 executive summary
  - **鑽取深度**: 讀者可以根據需要選擇閱讀深度
  - **認知負荷**: 避免一次過俾太多資訊造成overwhelm

- *PARA Method (Projects, Areas, Resources, Archive)*
  - **核心原則**: 按照可操作性分類文檔
  - **Projects**: 有明確進度記錄既主動項目
  - **Areas**: 需要持續維護既責任範圍
  - **Resources**: 將來可能用到既參考資料
  - **Archive**: 已完成或不再活躍既內容

- *Zettelkasten (卡片盒筆記法)*
  - **核心原則**: 每個概念獨立記錄，通過連結建立關係
  - **原子化**: 每個文檔只包含一個完整既概念
  - **網狀連結**: 通過 hyperlink 或 tag 建立概念之間既關係
  - **意外發現**: 透過連結發現意想不到既概念關聯

- *Documentation Driven Development*
  - **核心原則**: 先寫文檔再寫代碼，確保設計思路清晰
  - **設計澄清**: 寫文檔既過程會暴露設計問題
  - **溝通工具**: 文檔成為 team member 溝通既共同語言
  - **未來維護**: 好既文檔係未來維護既關鍵

- *版本控制原則 (Version Control for Docs)*
  - **核心原則**: 文檔都要有版本管理同變更追蹤
  - **變更日誌**: 記錄每次修改既原因同影響範圍
  - **協作衝突**: 建立機制處理多人同時編輯既衝突
  - **回溯能力**: 可以返回任何歷史版本

- *搜尋優化 (Search-Friendly Organization)*
  - **核心原則**: 優化文檔既可搜尋性
  - **關鍵詞**: 喺標題同內容包含用戶可能搜尋既詞語
  - **元數據**: 善用 tag、category、description 等元數據
  - **全文搜尋**: 確保重要概念喺正文出現而唔係只喺標題

- *最小維護成本 (Minimum Maintenance Cost)*
  - **核心原則**: 文檔結構要易於長期維護
  - **自動化**: 盡量用自動化工具維護文檔既一致性
  - **模板化**: 用標準模板減少格式既維護工作
  - **過期檢測**: 建立機制識別同清理過期文檔

- *認知負荷理論 (Cognitive Load Theory)*
  - **核心原則**: 減少讀者既認知負荷
  - **分塊處理**: 將大文檔拆分成易消化既小塊
  - **視覺層次**: 用標題、列表、空白嚟建立視覺層次
  - **減少干擾**: 避免無關既資訊分散注意力

- *活文檔原則 (Living Documentation)*
  - **核心原則**: 文檔要與系統同步演進
  - **自動生成**: 從代碼或配置自動生成部分文檔
  - **持續更新**: 建立流程確保文檔與實際狀況一致
  - **責任分工**: 明確邊個負責維護邊部分文檔
