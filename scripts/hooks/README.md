# Hooks 目錄

## Agent 任務完成自動記憶系統

此目錄包含 AI Agent 長期記憶系統的核心組件，實現自動化的任務執行記憶與知識管理。

### 系統架構

```
hooks/
├── read_memory.py              # 記憶讀取腳本
├── write_momory.py             # 記憶寫入腳本
├── agent_task_completion_hook.py # Agent 任務完成 Hook
└── test_memory_system.py       # 系統測試腳本
```

### 功能特性

#### 1. 自動記憶保存

- 每個 Agent 完成任務後自動執行記憶寫入
- 支援 30+ 種不同類型的 Agent
- 智能提取任務關鍵信息
- 自動生成標籤和分類

#### 2. 記憶檢索

- 基於語義相似度的向量搜索
- 支援多維度過濾（時間、標籤、Agent類型）
- 後備文本搜索機制
- 上下文感知的記憶調用

#### 3. 支援的 Agent 類型

- **開發類**: frontend-developer, backend-architect, typescript-pro
- **優化類**: database-optimizer, performance-engineer, legacy-modernizer
- **測試類**: test-automator, debugger, error-detective
- **部署類**: deployment-engineer, devops-troubleshooter, incident-responder
- **架構類**: architect-reviewer, data-architect, ai-engineer
- **文檔類**: api-documenter, docs-architect, reference-builder
- **安全類**: security-auditor
- **代碼品質**: code-reviewer, eslint-fixer, build-error-resolver
- **設計類**: ui-ux-designer
- **數據類**: data-analyst, ml-engineer
- **其他**: prompt-engineer, context-manager, general-purpose

### 快速開始

#### 環境設置

1. **安裝依賴**：

```bash
pip3 install python-dotenv supabase openai
```

2. **配置環境變數**：

專案已包含 `.env` 文件，腳本會自動載入。如需手動設置：

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-supabase-anon-key"
export OPENAI_API_KEY="your-openai-api-key"
```

#### 使用方式

##### 1. Agent 自動記憶保存

當 Agent 完成任務時，自動調用記憶保存：

```bash
# 方式1: 從命令行傳入輸出文件
python3 agent_task_completion_hook.py frontend-developer output.txt

# 方式2: 通過管道傳入輸出
echo "Agent 任務輸出內容" | python3 agent_task_completion_hook.py frontend-developer
```

##### 2. 手動記憶寫入

```python
from write_momory import MemoryWriter

writer = MemoryWriter(supabase_url, supabase_key, openai_api_key)

task_data = {
    "agent_id": "frontend-developer",
    "task_type": "frontend_development",
    "context_content": "實現用戶登入功能...",
    "tags": ["authentication", "react", "frontend"]
}

success = writer.save_memory(task_data, "frontend-developer")
```

##### 3. 記憶檢索

```python
from read_memory import MemoryReader

reader = MemoryReader(supabase_url, supabase_key, openai_api_key)

# 語義搜索
memories = reader.search_similar_memories(
    "用戶認證相關的優化",
    limit=5,
    agent_id="frontend-developer"
)

# 獲取最近記憶
recent = reader.get_recent_memories("frontend-developer", hours=24)

# 獲取上下文記憶
context, raw = reader.get_contextual_memories(
    "優化登入流程",
    agent_id="frontend-developer",
    max_memories=5
)
```

##### 4. 系統測試

```bash
# 運行完整系統測試
python3 test_memory_system.py
```

### Hook 整合配置

#### Claude Code 整合

在 Claude Code 的設置中配置 Hook：

```json
{
  "hooks": {
    "agent-task-completion": {
      "command": "python3 /path/to/agent_task_completion_hook.py ${agent_type}",
      "enabled": true,
      "trigger": "on_agent_complete"
    }
  }
}
```

#### 自定義 Agent Hook

在你的 Agent 代碼中調用：

```python
import subprocess
import json

def on_task_complete(agent_type, output):
    """Agent 任務完成回調"""
    hook_script = "scripts/hooks/agent_task_completion_hook.py"

    result = subprocess.run(
        ["python3", hook_script, agent_type],
        input=output,
        text=True,
        capture_output=True
    )

    if result.returncode == 0:
        print(f"✅ 記憶已保存")
    else:
        print(f"❌ 記憶保存失敗")
```

### 資料庫結構

#### context_history 表

```sql
CREATE TABLE context_history (
    id BIGSERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    context_content TEXT NOT NULL,
    raw_data JSONB,
    task_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags TEXT[],
    embedding VECTOR(1536),
    content_hash TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_agent_id ON context_history(agent_id);
CREATE INDEX idx_task_type ON context_history(task_type);
CREATE INDEX idx_timestamp ON context_history(task_timestamp);
CREATE INDEX idx_tags ON context_history USING GIN(tags);
CREATE INDEX idx_content_hash ON context_history(content_hash);
```

### 進階功能

#### 自定義任務類型映射

修改 `agent_task_completion_hook.py` 中的映射：

```python
task_type_mapping = {
    "your-custom-agent": "custom_task_type",
    # ... 更多映射
}
```

#### 記憶過期策略

設置記憶保留期限：

```python
# 只搜索最近30天的記憶
memories = reader.search_similar_memories(
    query="...",
    time_range_days=30
)
```

#### 批量記憶處理

```python
# 批量寫入多個記憶
for task in tasks:
    writer.save_memory(task, agent_id)
```

### 故障排除

#### 常見問題

1. **環境變數未找到**
   - 確認 `.env` 文件存在於專案根目錄
   - 檢查 python-dotenv 是否已安裝

2. **向量搜索失敗**
   - 確認 Supabase 中已創建 match_memories 函數
   - 檢查 pgvector 擴展是否已啟用

3. **記憶重複**
   - 系統使用 content_hash 自動去重
   - 相同內容不會重複儲存

4. **性能問題**
   - 調整搜索限制 (limit 參數)
   - 使用時間範圍過濾減少搜索範圍

### 監控與維護

#### 查看記憶統計

```sql
-- 按 Agent 統計記憶數量
SELECT agent_id, COUNT(*) as memory_count
FROM context_history
GROUP BY agent_id
ORDER BY memory_count DESC;

-- 查看最近的記憶
SELECT agent_id, task_type, task_timestamp
FROM context_history
ORDER BY task_timestamp DESC
LIMIT 10;
```

#### 清理舊記憶

```sql
-- 刪除超過90天的記憶
DELETE FROM context_history
WHERE task_timestamp < NOW() - INTERVAL '90 days';
```

### 安全注意事項

1. **API 密鑰保護**
   - 永遠不要將密鑰提交到版本控制
   - 使用環境變數或安全的密鑰管理服務

2. **敏感資訊過濾**
   - 系統自動限制記憶大小（最大5000字元）
   - 避免儲存密碼、令牌等敏感資訊

3. **訪問控制**
   - 確保 Supabase RLS 策略正確配置
   - 限制 API 密鑰的權限範圍

### 貢獻指南

歡迎提交改進建議和錯誤報告。請確保：

1. 測試所有變更
2. 更新相關文檔
3. 遵循現有代碼風格

### 授權

本系統為專有軟體，請參考專案根目錄的授權文件。

---

最後更新：2025-09-02
