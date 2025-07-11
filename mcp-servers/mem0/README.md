# MEM0 MCP Server for NewPennine

MEM0 Model Context Protocol (MCP) server 為 NewPennine 提供智能記憶層功能，支援跨會話嘅持久化記憶管理。

## 功能特點

- **多層級記憶管理**: 支援 User、Session 同 Agent 層級記憶
- **智能記憶提取**: 自動識別同儲存重要對話內容
- **向量搜索**: 基於語義相似度搜索相關記憶
- **記憶更新同刪除**: 完整 CRUD 操作支援
- **元數據支援**: 為記憶添加自定義元數據

## 安裝

### 1. 安裝依賴

```bash
cd mcp-servers/mem0
npm install
npm run build
```

### 2. 安裝 Python 依賴

```bash
cd python
pip install -r requirements.txt
```

### 3. 配置環境變量

需要設定 OpenAI API Key：

```bash
export OPENAI_API_KEY="your-openai-api-key"
```

## 可用工具

### add_memory
添加新記憶從對話消息

```json
{
  "messages": [
    {"role": "user", "content": "我喜歡用深色主題"},
    {"role": "assistant", "content": "好的，我會記住您偏好深色主題"}
  ],
  "user_id": "user123",
  "session_id": "session456",
  "metadata": {"category": "preferences"}
}
```

### search_memory
搜索相關記憶

```json
{
  "query": "用戶界面偏好",
  "user_id": "user123",
  "limit": 10
}
```

### get_memory
獲取特定記憶

```json
{
  "memory_id": "mem_12345"
}
```

### update_memory
更新現有記憶

```json
{
  "memory_id": "mem_12345",
  "data": "用戶現在偏好淺色主題"
}
```

### delete_memory
刪除記憶

```json
{
  "memory_id": "mem_12345"
}
```

### get_all_memories
獲取所有記憶

```json
{
  "user_id": "user123",
  "limit": 100
}
```

## 使用示例

喺 Claude Desktop 使用：

1. 確保 `.mcp.mac.json` 已配置 mem0 server
2. 重啟 Claude Desktop
3. 使用 MCP 工具調用記憶功能

```
使用 add_memory 工具記住我喜歡深色主題
使用 search_memory 工具搜索我嘅界面偏好
```

## 技術架構

- **TypeScript MCP Server**: 處理協議通信同請求路由
- **Python MEM0 SDK**: 提供記憶管理核心功能
- **OpenAI GPT-4o-mini**: 用於記憶提取同語義理解
- **向量數據庫**: 支援高效語義搜索

## 開發

### 開發模式

```bash
npm run dev
```

### 構建

```bash
npm run build
```

### 測試

```bash
# 手動測試單個功能
python python/add_memory.py '{"messages": [{"role": "user", "content": "test"}]}'
```

## 注意事項

1. 需要有效嘅 OpenAI API Key
2. 記憶數據存儲喺本地或配置嘅向量數據庫
3. 建議定期清理過期或無關記憶
4. 支援多用戶同會話隔離

## 故障排除

### Python 依賴問題
```bash
cd python
pip install --upgrade pip
pip install -r requirements.txt
```

### 權限問題
```bash
chmod +x python/*.py
```

### API Key 問題
確保環境變量正確設置：
```bash
echo $OPENAI_API_KEY
```