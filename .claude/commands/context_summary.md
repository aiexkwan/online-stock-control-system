---
allowed-tools: Bash(date:*), Bash(mkdir:*), Write, Supabase(insert:*, rpc:*)
-argument-hint: [title] [tags] [scope]
description: 自動化地在每次對話結束後，生成精煉摘要並歸檔，同時將向量存入 Supabase，實現 AI 的長期記憶。
---

# 自動化對話上下文摘要指令 (Automated Context Summary)

將每次對話的關鍵資訊以結構化格式自動沉澱，一方面歸檔至 `docs/Context_History/`，另一方面將其向量化後存入 Supabase 數據庫，實現可追溯、可檢索的長期記憶。

## 變數

- **TITLE**: 由 [context-fetcher](../agents/context-fetcher.md) 根據對話內容自動生成。
- **TAGS**: 由 [context-fetcher](../agents/context-fetcher.md) 根據對話內容自動提取關鍵字。
- **SCOPE**: 預設為 `session`，[context-fetcher](../agents/context-fetcher.md) 可根據上下文關聯到 `feature` 或 `sprint`。

## 執行代理 (Executing Agent)

- [context-fetcher](../agents/context-fetcher.md): 負責監聽對話結束事件，並根據上下文執行本指令的所有步驟，包括生成摘要、提取標籤、生成向量並寫入存檔和數據庫。

## 🚨 執行規則

### 即時沉澱原則

1. **每回合對話後必寫**：任一具體結論、決策或任務分解後立即生成摘要
2. **精煉可檢索**：優先記錄意圖、決策、行動、風險與檔案路徑
3. **持久歸檔**：一律保存至 `docs/Context_History/<timestamp>/context-summary.md`
4. Python腳本：[腳本](../../scripts/hooks/context_summary_hook.py)
5. **鏈接一切**：引用實際檔案路徑與 PR/Issue 連結，避免口語化模糊描述
6. **隱私保護**：使用 LoggerSanitizer；移除密碼、金鑰、Token、PII

### 品質標準

- **重點聚焦**：6-12 條核心要點即可，避免流水賬
- **可行動**：明確產出「指派事項」、「後續步驟」與「截止時間」
- **可追溯**：包含檔案路徑、分支、PR/Issue 編號或連結
- **可比對**：標記版本/日期/參與者，支持後續審計

## 執行指令

0. 讀取[通用規則](../../CLAUDE.local.md)
1. 執行 `date +"%Y-%m-%d_%H-%M-%S"` 取得 `timestamp`
2. 建立目錄：`docs/Context_History/<timestamp>/`
3. **[context-fetcher](../agents/context-fetcher.md)自動分析對話上下文**：
   - 自動生成 `TITLE`
   - 自動提取 `TAGS`
   - 自動判斷 `SCOPE`
   - 組裝摘要 JSON 物件
4. **生成用於嵌入的 `content` 字符串**：將 JSON 中的 `summary.goal`, `decisions`, `actions.task` 等核心文本字段拼接成一個字符串。
5. **調用 [ai-engineer](../agents/ai-engineer.md) 生成向量嵌入**：將 `content` 字符串轉換為一個 1536 維的向量。
6. **寫入 Supabase 數據庫**：
   - 使用 `Supabase(insert:*)` 工具或`Supabase MCP 工具`
   - 將 `session_id`, `content`, `embedding` 寫入 `context_summaries` 表。
7. **寫入文件歸檔**：將完整的 JSON 物件（不含向量）寫入 `docs/Context_History/<timestamp>/context-summary.json`。
8. **更新索引**：在 `docs/Context_History/_index.jsonl` 追加本次摘要的索引。

## 輸出格式

### 目錄結構

```
docs/Context_History/
└── <YYYY-MM-DD_HH-MM-SS>/
    └── context-summary.json  # 本次對話摘要（JSON 模板）
```

### JSON Schema（範例）

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://penninewms.local/schemas/context-summary.schema.json",
  "title": "ContextSummary",
  "type": "object",
  "required": ["meta", "participants", "summary"],
  "properties": {
    "meta": {
      "type": "object",
      "required": ["timestamp", "title", "scope"],
      "properties": {
        "timestamp": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}$" },
        "sessionId": { "type": "string" },
        "title": { "type": "string", "minLength": 1 },
        "scope": {
          "type": "string",
          "enum": ["session", "feature", "sprint", "release", "project"]
        },
        "tags": { "type": "array", "items": { "type": "string" } }
      }
    },
    "participants": {
      "type": "object",
      "required": ["user"],
      "properties": {
        "user": { "type": "string" },
        "agents": { "type": "array", "items": { "type": "string" } }
      }
    },
    "summary": {
      "type": "object",
      "required": ["goal"],
      "properties": {
        "goal": { "type": "string" },
        "findings": { "type": "array", "items": { "type": "string" } }
      }
    },
    "decisions": { "type": "array", "items": { "type": "string" } },
    "actions": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["assignee", "task"],
        "properties": {
          "assignee": { "type": "string" },
          "task": { "type": "string" },
          "due": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" }
        }
      }
    },
    "open": { "type": "array", "items": { "type": "string" } },
    "refs": {
      "type": "object",
      "properties": {
        "files": { "type": "array", "items": { "type": "string" } },
        "links": { "type": "array", "items": { "type": "string" } }
      }
    },
    "context": { "type": "object", "properties": { "snippet": { "type": "string" } } },
    "risks": { "type": "array", "items": { "type": "string" } },
    "assumptions": { "type": "array", "items": { "type": "string" } },
    "next": { "type": "array", "items": { "type": "string" } }
  }
}
```

## 最小 JSON 範例（示意）

```json
{
  "meta": {
    "timestamp": "2025-08-24 22:10:00",
    "sessionId": "ctx-2025-08-24-001",
    "title": "GRN 標籤卡 E2E 測試計劃定稿",
    "scope": "feature",
    "tags": ["testing", "playwright", "grn"]
  },
  "participants": { "user": "@chun", "agents": ["@frontend-developer", "@backend-architect"] },
  "summary": {
    "goal": "釐清 GRNLabelCard 測試數據與流程並落檔",
    "findings": ["報告輸出到 docs/test/grn-label/<timestamp>/"]
  },
  "decisions": ["使用環境變數存放測試憑證；禁止硬編碼"],
  "actions": [
    {
      "assignee": "@test-automator",
      "task": "撰寫 __tests__/e2e/grn-label/grn-label-card.spec.ts",
      "due": "2025-08-26"
    }
  ],
  "refs": {
    "files": ["app/(app)/admin/cards/GRNLabelCard.tsx"],
    "links": ["PR #123"]
  },
  "context": { "snippet": "完成測試計劃，後續撰寫並執行 Playwright 測試。" },
  "next": ["實作測試腳本", "執行並產生測試報告"]
}
```

## SARIF（選配）

可選擇同時輸出 `docs/Context_History/<timestamp>/context-summary.sarif`（SARIF v2.1.0），於 `runs[].results[]` 的 `properties.summary` 存放同一份 JSON 摘要：

```json
{
  "$schema": "https://schemastore.azurewebsites.net/schemas/json/sarif-2.1.0.json",
  "version": "2.1.0",
  "runs": [
    {
      "tool": { "driver": { "name": "ContextSummary", "version": "1.0.0" } },
      "results": [
        {
          "ruleId": "context.summary",
          "level": "note",
          "message": { "text": "對話上下文摘要" },
          "properties": {
            "summary": {
              /* 置入上方 JSON 物件 */
            }
          }
        }
      ]
    }
  ]
}
```

## 合規與安全

- 使用 LoggerSanitizer 對摘要內容進行輸出前清理
- 禁止記錄：密碼、金鑰、Token、個人敏感資訊（PII）
- 如必須引用敏感參數，僅記錄變數名（例如：`process.env.TEST_SYS_LOGIN`）

## 成功標準

- 對話後即時進行摘要與落檔
- 後續任務可直接引用「指派事項」與「後續步驟」展開實作

---

記住：本指令專注於「長期上下文沉澱」。務必保持精煉、可檢索、可追溯，並持續為未來的對話節省時間。
