### 必須優先閱讀
- `CLAUDE.md`

### 思考模式
- Sequential-thinking

### 專家小組
- 專家議會名單：如用戶沒有提供／指明，則按照問題複雜程度指派
- 專家議會說明文檔：`docs\role_play\README.md`

### 任務
- 專注並只解決用戶問題
- 如沒有提供，則必須詢問

### 處理流程
- 獲取錯誤：`由用戶提供`
- 尋找記錄：到 `docs\issue-library` 查找有否同類似錯誤的文檔，以便快速獲取解決方法
- 開始解難：如是首次遇到該類型問題，則開始使用Sub-Agent及Sub-Task，同步進行troubleshooting
- 策略執行：使用 `Sequential-thinking` 思考及分析問題
- 譏會討論：專家議會按照問題複雜程度進行討論會議
- 證實修復：修改後**必需建立一次性的測試文件證實修復工作**
- 更新記錄：確定修補後將是次修復依據 `docs\issue-library\README.md` 的規範 更新`docs\issue-library` 內對應文檔
- 移除測試：**必須需刪除一次性的測試文件**
- 進行下個修復項目

### 修復原則

- 奧卡姆剃刀 (Occam's Razor)
  - **核心原則**: 簡單問題應該用簡單解決方案
  - **由簡至繁**: 先檢查最明顯既可能性，然後才考慮複雜架構問題
  - **避免誤導**: 錯誤指向邊一行就先檢查嗰一行，唔好被堆疊避免訊息誤導
  - **逐步診斷**: 語法 → 類型 → 邏輯 → 架構

- Murphy's Law - 防禦性修復
  - **核心原則**: 可能出錯既嘢一定會出錯
  - **預防性檢查**: 每次部署前都要 double check configuration
  - **錯誤重現**: 如果 bug 可以發生，就一定可以重現
  - **備用方案**: 永遠準備 rollback plan 同 emergency fix

- Hanlon's Razor - 診斷心態
  - **核心原則**: 唔好將無知誤解為惡意破壞
  - **Bug 分析**: 優先考慮邏輯錯誤、配置問題，而唔係 security breach
  - **團隊合作**: 問「點解會咁寫」而唔係「邊個搞壞咗」
  - **根因分析**: 假設係 honest mistake，專注搵根本原因

- Five Whys Method
  - **核心原則**: 連續問五次「點解」嚟搵根本原因
  - **深度挖掘**: 唔好滿足於表面現象，要搵系統性問題
  - **避免症狀修復**: 修復根因而唔係修復症狀
  - **文檔記錄**: 記錄完整既分析過程避免重複問題

- Binary Search Debugging
  - **核心原則**: 用二分法縮小問題範圍
  - **代碼定位**: 注釋一半代碼睇 bug 係咪仍然存在
  - **時間回溯**: 搵最後一個正常既 commit，然後往前追蹤
  - **數據範圍**: 測試邊界值嚟確定問題既具體範圍

- Rubber Duck Debugging
  - **核心原則**: 向無生命物體解釋問題嚟發現盲點
  - **邏輯檢視**: 逐行解釋代碼邏輯俾「鴨仔」聽
  - **假設驗證**: 講出嚟既假設通常會暴露邏輯漏洞
  - **思維整理**: 強迫自己用簡單語言描述複雜問題

- Heisenbug Principle
  - **核心原則**: 觀察過程會改變 bug 既行為
  - **調試影響**: 加 debug log 可能會改變 timing 同掩蓋問題
  - **環境差異**: production bug 喺 development 環境可能消失
  - **最小干預**: 用最少既調試手段嚟避免改變系統行為

- First Principles Debugging
  - **核心原則**: 回到最基本既假設重新分析問題
  - **重新檢驗**: 質疑所有「理所當然」既假設
  - **基礎驗證**: 檢查 network connectivity、file permissions 呢啲基本嘢
  - **從零開始**: 如果複雜分析都搵唔到，就簡化到最基本既 test case

 - **Blame-Free Post-Mortem
  - **核心原則**: 專注系統改善而唔係個人責任
  - **學習導向**: 每次 incident 都係改善系統既機會
  - **流程檢討**: 分析既係 process failure 而唔係 human error
  - **預防為主**: 建立機制防止同類問題再次發生

### 可使用工具
| **思維模式** | Sequential-thinking MCP | 邏輯推理 |
| **搜尋** | Brave Search MCP | 資料搜尋 |
| **自動化** | Puppeteer MCP | 無頭瀏覽器操作 |
| **資料庫** | Supabase MCP | 資料庫查詢 |
| **前端測試** | Playwright | E2E測試 |
| **單元測試** | Vitest | 快速測試 |
| **元件開發** | Storybook | 元件開發與測試 |

### 修復後測試
- 必需建立一次性的測試文件證實修復工作
- 避免技術債: 必須通過 TypeScript/EsLint
- 事後必須需刪除一次性的測試文件

### 相關文檔記錄
- 修復記錄庫：`docs\issue-library`
- 修復記錄文檔規範：`docs\issue-library\README.md`
- 工作記錄庫：`docs\Today_Todo`
- 工作記錄文檔規範：`docs\Today_Todo\README.md`