# 系統環境變數設置指南

## Windows 系統

### 方法1：通過系統設置界面

1. 打開「設定」→「系統」→「關於」
2. 點擊「進階系統設定」
3. 在「系統內容」視窗中點擊「環境變數」
4. 在「使用者變數」或「系統變數」中點擊「新增」
5. 輸入變數名稱和值：

   ```
   變數名稱: SUPABASE_URL
   變數值: https://your-project.supabase.co

   變數名稱: SUPABASE_KEY
   變數值: your-supabase-anon-key

   變數名稱: OPENAI_API_KEY
   變數值: your-openai-api-key
   ```

### 方法2：通過命令提示字元 (臨時設置)

```cmd
set SUPABASE_URL=https://your-project.supabase.co
set SUPABASE_KEY=your-supabase-anon-key
set OPENAI_API_KEY=your-openai-api-key
```

### 方法3：通過PowerShell (永久設置)

```powershell
[Environment]::SetEnvironmentVariable("SUPABASE_URL", "https://your-project.supabase.co", "User")
[Environment]::SetEnvironmentVariable("SUPABASE_KEY", "your-supabase-anon-key", "User")
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "your-openai-api-key", "User")
```

---

## macOS 系統

### 方法1：通過 .zshrc 或 .bash_profile (推薦)

1. 打開終端機
2. 編輯配置文件：

   ```bash
   # 如果使用 zsh (macOS 預設)
   nano ~/.zshrc

   # 如果使用 bash
   nano ~/.bash_profile
   ```

3. 在文件末尾加入：
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_KEY="your-supabase-anon-key"
   export OPENAI_API_KEY="your-openai-api-key"
   ```
4. 儲存文件並重新加載：

   ```bash
   # 如果使用 zsh
   source ~/.zshrc

   # 如果使用 bash
   source ~/.bash_profile
   ```

### 方法2：通過 launchctl (系統級別)

```bash
# 設置環境變數
launchctl setenv SUPABASE_URL "https://your-project.supabase.co"
launchctl setenv SUPABASE_KEY "your-supabase-anon-key"
launchctl setenv OPENAI_API_KEY "your-openai-api-key"
```

### 方法3：臨時設置 (當前終端會話)

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-supabase-anon-key"
export OPENAI_API_KEY="your-openai-api-key"
```

---

## Linux 系統

### 方法1：通過 .bashrc 或 .profile (推薦)

1. 編輯用戶配置文件：
   ```bash
   nano ~/.bashrc
   # 或者
   nano ~/.profile
   ```
2. 在文件末尾加入：
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_KEY="your-supabase-anon-key"
   export OPENAI_API_KEY="your-openai-api-key"
   ```
3. 重新加載配置：
   ```bash
   source ~/.bashrc
   # 或者
   source ~/.profile
   ```

### 方法2：系統級設置

1. 編輯系統環境文件：
   ```bash
   sudo nano /etc/environment
   ```
2. 加入環境變數：
   ```bash
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_KEY="your-supabase-anon-key"
   OPENAI_API_KEY="your-openai-api-key"
   ```
3. 重新登入或重啟系統

### 方法3：臨時設置

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-supabase-anon-key"
export OPENAI_API_KEY="your-openai-api-key"
```

---

## 驗證環境變數設置

### Windows

```cmd
echo %SUPABASE_URL%
echo %SUPABASE_KEY%
echo %OPENAI_API_KEY%
```

### macOS/Linux

```bash
echo $SUPABASE_URL
echo $SUPABASE_KEY
echo $OPENAI_API_KEY
```

### 在Python中驗證

```python
import os

print("SUPABASE_URL:", os.getenv('SUPABASE_URL'))
print("SUPABASE_KEY:", os.getenv('SUPABASE_KEY'))
print("OPENAI_API_KEY:", os.getenv('OPENAI_API_KEY'))
```

---

## 注意事項

1. **安全性**:
   - 避免將敏感API密鑰存放在公共可見的地方
   - 確保配置文件的權限設置正確

2. **重啟要求**:
   - Windows: 可能需要重新啟動命令提示字元或應用程式
   - macOS/Linux: 需要重新加載終端或重新登入

3. **作用域**:
   - 使用者級別：只對當前使用者有效
   - 系統級別：對所有使用者有效

4. **IDE 支援**:
   - 某些IDE可能需要重啟才能讀取新的環境變數
   - 可以在IDE的設置中單獨配置環境變數

選擇適合你操作系統和使用情境的方法即可！
