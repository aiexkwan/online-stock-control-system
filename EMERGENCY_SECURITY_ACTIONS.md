# 🚨 緊急安全行動清單

## 立即執行（按順序）：

### 1. 撤銷並重新生成所有密鑰

#### OpenAI API Key

1. 立即前往 https://platform.openai.com/api-keys
2. 刪除當前洩露的密鑰
3. 生成新密鑰並安全保存

#### Supabase Keys

1. 前往 Supabase Dashboard
2. Settings > API > 重新生成所有密鑰
3. 更新所有使用這些密鑰的服務

#### Resend API Key

1. 前往 Resend Dashboard
2. 撤銷當前密鑰
3. 生成新密鑰

### 2. 清理 Git 歷史

```bash
# 從 Git 歷史中完全移除 .env 檔案
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 或使用 BFG Repo-Cleaner（更快速）
bfg --delete-files .env
```

### 3. 更新環境變數管理

1. 將所有敏感資訊移至環境變數
2. 使用 `.env.example` 作為模板（不含實際值）
3. 在部署平台（Vercel）設置環境變數

### 4. 審查其他可能的洩露

檢查以下位置：

- 所有 backup 目錄
- 所有 log 檔案
- 所有 commit 歷史

## 預防措施

1. 使用 git-secrets 或類似工具防止敏感資訊提交
2. 實施 pre-commit hooks 檢查敏感資訊
3. 定期審查和輪換密鑰
4. 使用密鑰管理服務（如 Vault）
