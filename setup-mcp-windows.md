# Windows MCP Server 設置指南

## 前置要求

1. **安裝 Node.js**
   - 下載: https://nodejs.org/
   - 選擇 LTS 版本
   - 安裝時確保勾選 "Add to PATH"

2. **安裝 Python** (for mem0)
   - 下載: https://www.python.org/downloads/
   - 安裝時勾選 "Add Python to PATH"
   - 完成後運行: `pip install mem0ai[mcp]`

3. **安裝 Claude Desktop**
   - 下載: https://claude.ai/download

## 設置步驟

### 1. 建立設定檔目錄
打開 PowerShell 或 Command Prompt，運行：
```cmd
mkdir %APPDATA%\Claude
```

### 2. 複製設定檔
將 `claude_desktop_config_windows.json` 內容複製到：
```
%APPDATA%\Claude\claude_desktop_config.json
```

或者用命令行：
```cmd
copy claude_desktop_config_windows.json %APPDATA%\Claude\claude_desktop_config.json
```

### 3. 安裝 MCP 伺服器依賴

打開 PowerShell 或 Command Prompt，運行以下命令：

```cmd
# Supabase MCP Server
npm install -g @supabase/mcp-server-supabase

# Puppeteer MCP Server
npm install -g puppeteer-mcp-server

# Magic MCP Server (會自動安裝)
# mem0 (如果未安裝)
pip install mem0ai[mcp]
```

### 4. 驗證安裝
運行以下命令確保所有工具已安裝：
```cmd
npx --version
python --version
pip show mem0ai
```

### 5. 重啟 Claude Desktop
- 完全關閉 Claude Desktop
- 重新啟動應用程式
- MCP 伺服器應該會自動啟動

## 故障排除

### 如果 npx 命令無法找到
1. 確保 Node.js 已正確安裝
2. 重新啟動電腦讓 PATH 生效
3. 手動添加 Node.js 到系統 PATH

### 如果 Python 命令無法找到
1. 重新安裝 Python 並勾選 "Add to PATH"
2. 或手動添加 Python 到系統 PATH

### 查看 MCP 日誌
日誌位置：`%APPDATA%\Claude\logs\`

## 測試 MCP 連接
在 Claude Desktop 中輸入：
```
/mcp
```
應該顯示已連接的 MCP 伺服器列表。